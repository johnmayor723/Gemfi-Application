jest.mock("../../src/integrations/account", () => ({

    client: {
        getByPhoneNumber: jest.fn(),
        getBalance: jest.fn()
    }

}));

jest.mock("../../src/integrations/statement", () => ({

    client: {
        getMiniStatement: jest.fn()
    }

}));

jest.mock("../../src/modules/otp/sms.provider", () => ({

    send: jest.fn().mockResolvedValue({ success: true, provider: "TERMII" })

}));

const request = require("supertest");

const database = require("../helpers/database");

const app = require("../../src/app");

const { client: accountClient } = require("../../src/integrations/account");

const { client: statementClient } = require("../../src/integrations/statement");

const pinService = require("../../src/modules/pin/pin.service");

const account = {
    accountNumber: "8011122233",
    displayName: "Jane Doe"
};

const post = (body) =>
    request(app)
        .post("/ussd/callback")
        .type("form")
        .send(body);

describe("POST /ussd/callback", () => {

    beforeAll(async () => {

        await database.connect();

    });

    beforeEach(async () => {

        await database.clearDatabase();
        jest.clearAllMocks();

    });

    afterAll(async () => {

        await database.closeDatabase();

    });

    test("unrecognized number ends the session immediately", async () => {

        accountClient.getByPhoneNumber.mockResolvedValue(null);

        const res = await post({
            sessionId: "s1",
            phoneNumber: "2348000000000",
            text: ""
        });

        expect(res.status).toBe(200);
        expect(res.text).toMatch(/^END /);
        expect(res.text).toContain("couldn't find an account");

    });

    test("recognized number with no PIN set starts enrollment", async () => {

        accountClient.getByPhoneNumber.mockResolvedValue(account);

        const res = await post({
            sessionId: "s2",
            phoneNumber: "2348011100002",
            text: ""
        });

        expect(res.status).toBe(200);
        expect(res.text).toMatch(/^CON /);
        expect(res.text).toContain("verification code");

    });

    test("full enrollment across a multi-step session sets a working PIN", async () => {

        accountClient.getByPhoneNumber.mockResolvedValue(account);

        const start = await post({ sessionId: "s3", phoneNumber: "2348011100003", text: "" });
        expect(start.text).toMatch(/^CON /);

        const code = start.text.match(/code: (\d+)\)/)[1];

        const afterOtp = await post({ sessionId: "s3", phoneNumber: "2348011100003", text: code });
        expect(afterOtp.text).toBe("CON Verified! Choose a 4-digit PIN:");

        const afterPin = await post({ sessionId: "s3", phoneNumber: "2348011100003", text: `${code}*1234` });
        expect(afterPin.text).toBe("CON Re-enter your PIN to confirm:");

        const afterConfirm = await post({ sessionId: "s3", phoneNumber: "2348011100003", text: `${code}*1234*1234` });
        expect(afterConfirm.status).toBe(200);
        expect(afterConfirm.text).toMatch(/^END /);
        expect(afterConfirm.text).toContain("PIN set successfully");

        await expect(
            pinService.verify("8011122233", "1234")
        ).resolves.toBe(true);

    });

    test("mismatched PIN confirmation ends the session without setting a PIN", async () => {

        accountClient.getByPhoneNumber.mockResolvedValue(account);

        const start = await post({ sessionId: "s4", phoneNumber: "2348011100004", text: "" });
        const code = start.text.match(/code: (\d+)\)/)[1];

        await post({ sessionId: "s4", phoneNumber: "2348011100004", text: code });
        await post({ sessionId: "s4", phoneNumber: "2348011100004", text: `${code}*1234` });

        const res = await post({ sessionId: "s4", phoneNumber: "2348011100004", text: `${code}*1234*9999` });

        expect(res.text).toMatch(/^END /);
        expect(res.text).toContain("did not match");
        expect(await pinService.isSet("8011122233")).toBe(false);

    });

    test("returning user with a PIN goes straight to the PIN prompt, then the main menu", async () => {

        await pinService.set("8011122233", "1234");
        accountClient.getByPhoneNumber.mockResolvedValue(account);

        const start = await post({ sessionId: "s5", phoneNumber: "2348011100005", text: "" });
        expect(start.text).toBe("CON Enter your PIN:");

        const afterPin = await post({ sessionId: "s5", phoneNumber: "2348011100005", text: "1234" });
        expect(afterPin.text).toBe("CON 1. Check Balance\n2. Mini Statement");

    });

    test("wrong PIN re-prompts in the same session with attempts remaining", async () => {

        await pinService.set("8011122233", "1234");
        accountClient.getByPhoneNumber.mockResolvedValue(account);

        await post({ sessionId: "s6", phoneNumber: "2348011100006", text: "" });

        const res = await post({ sessionId: "s6", phoneNumber: "2348011100006", text: "0000" });

        expect(res.text).toMatch(/^CON /);
        expect(res.text).toContain("2 attempts remaining");

    });

    test("three wrong PINs in a row lock the account and end the session", async () => {

        await pinService.set("8011122233", "1234");
        accountClient.getByPhoneNumber.mockResolvedValue(account);

        // A wrong-but-not-locked PIN stays in the same session
        // (state remains AWAITING_PIN), so all three attempts
        // happen in session s7 - pin.service still tracks attempts
        // server-side per account, independent of the session.
        await post({ sessionId: "s7", phoneNumber: "2348011100007", text: "" });
        await post({ sessionId: "s7", phoneNumber: "2348011100007", text: "0000" });
        await post({ sessionId: "s7", phoneNumber: "2348011100007", text: "0000" });
        const res = await post({ sessionId: "s7", phoneNumber: "2348011100007", text: "0000" });

        expect(res.text).toMatch(/^END /);
        expect(res.text).toContain("Locked for");

    });

    test("main menu option 1 returns the account balance and ends the session", async () => {

        await pinService.set("8011122233", "1234");
        accountClient.getByPhoneNumber.mockResolvedValue(account);
        accountClient.getBalance.mockResolvedValue({
            accountNumber: "8011122233",
            currency: "NGN",
            availableBalance: 5000,
            ledgerBalance: 5000
        });

        await post({ sessionId: "s8", phoneNumber: "2348011100008", text: "" });
        await post({ sessionId: "s8", phoneNumber: "2348011100008", text: "1234" });

        const res = await post({ sessionId: "s8", phoneNumber: "2348011100008", text: "1234*1" });

        expect(res.text).toMatch(/^END /);
        expect(res.text).toContain("NGN 5000");

    });

    test("main menu option 2 returns a mini-statement and ends the session", async () => {

        await pinService.set("8011122233", "1234");
        accountClient.getByPhoneNumber.mockResolvedValue(account);
        statementClient.getMiniStatement.mockResolvedValue({
            transactions: [
                { date: "2026-08-01", type: "CREDIT", amount: 1000 },
                { date: "2026-08-03", type: "DEBIT", amount: 200 }
            ]
        });

        await post({ sessionId: "s9", phoneNumber: "2348011100009", text: "" });
        await post({ sessionId: "s9", phoneNumber: "2348011100009", text: "1234" });

        const res = await post({ sessionId: "s9", phoneNumber: "2348011100009", text: "1234*2" });

        expect(res.text).toMatch(/^END /);
        expect(res.text).toContain("2026-08-01 +1000");
        expect(res.text).toContain("2026-08-03 -200");

    });

    test("responses are always plain text, never the JSON envelope", async () => {

        accountClient.getByPhoneNumber.mockResolvedValue(null);

        const res = await post({ sessionId: "s10", phoneNumber: "2348000000000", text: "" });

        expect(res.headers["content-type"]).toMatch(/^text\/plain/);

    });

    test("a wrong enrollment OTP re-prompts in the same session instead of ending it", async () => {

        accountClient.getByPhoneNumber.mockResolvedValue(account);

        await post({ sessionId: "s11", phoneNumber: "2348011100011", text: "" });

        const res = await post({ sessionId: "s11", phoneNumber: "2348011100011", text: "000000" });

        expect(res.text).toMatch(/^CON /);
        expect(res.text).toContain("Invalid verification code");

        // Session survived - the correct code still works afterward.
        expect(await pinService.isSet("8011122233")).toBe(false);

    });

    test("a non-4-digit PIN during enrollment re-prompts instead of failing the session", async () => {

        accountClient.getByPhoneNumber.mockResolvedValue(account);

        const start = await post({ sessionId: "s12", phoneNumber: "2348011100012", text: "" });
        const code = start.text.match(/code: (\d+)\)/)[1];

        await post({ sessionId: "s12", phoneNumber: "2348011100012", text: code });

        const res = await post({ sessionId: "s12", phoneNumber: "2348011100012", text: `${code}*12` });

        expect(res.text).toMatch(/^CON /);
        expect(res.text).toContain("must be exactly 4 digits");

    });

    test("an invalid main menu option ends the session", async () => {

        await pinService.set("8011122233", "1234");
        accountClient.getByPhoneNumber.mockResolvedValue(account);

        await post({ sessionId: "s13", phoneNumber: "2348011100013", text: "" });
        await post({ sessionId: "s13", phoneNumber: "2348011100013", text: "1234" });

        const res = await post({ sessionId: "s13", phoneNumber: "2348011100013", text: "1234*9" });

        expect(res.text).toBe("END Invalid option.");

    });

    test("mini-statement with no transactions in range says so plainly", async () => {

        await pinService.set("8011122233", "1234");
        accountClient.getByPhoneNumber.mockResolvedValue(account);
        statementClient.getMiniStatement.mockResolvedValue({ transactions: [] });

        await post({ sessionId: "s14", phoneNumber: "2348011100014", text: "" });
        await post({ sessionId: "s14", phoneNumber: "2348011100014", text: "1234" });

        const res = await post({ sessionId: "s14", phoneNumber: "2348011100014", text: "1234*2" });

        expect(res.text).toBe("END No recent transactions.");

    });

});
