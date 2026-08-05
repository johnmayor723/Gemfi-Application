jest.mock("../../../src/integrations/account", () => ({

    client: {
        getByPhoneNumber: jest.fn()
    }

}));

jest.mock("../../../src/modules/otp/sms.provider", () => ({

    send: jest.fn().mockResolvedValue({ success: true, provider: "TERMII" })

}));

const db =
    require("../../helpers/database");

const { client: accountClient } =
    require("../../../src/integrations/account");

const pinService =
    require("../../../src/modules/pin/pin.service");

const enrollmentService =
    require("../../../src/modules/enrollment/enrollment.service");

describe("Enrollment Service", () => {

    beforeAll(async () => {

        await db.connect();

    });

    beforeEach(async () => {

        await db.clearDatabase();
        jest.clearAllMocks();

    });

    afterAll(async () => {

        await db.closeDatabase();

    });

    test("resolveAccount passes through account-service's result, including null for an unrecognized number", async () => {

        accountClient.getByPhoneNumber.mockResolvedValue(null);

        expect(
            await enrollmentService.resolveAccount("2348000000000")
        ).toBeNull();

        accountClient.getByPhoneNumber.mockResolvedValue({
            accountNumber: "8011122233"
        });

        expect(
            await enrollmentService.resolveAccount("2348011122233")
        ).toEqual({ accountNumber: "8011122233" });

    });

    test("completeEnrollment refuses to set a PIN before the OTP is verified", async () => {

        await enrollmentService.requestOtp("8011122233", "2348011122233");

        await expect(
            enrollmentService.completeEnrollment("8011122233", "1234")
        ).rejects.toThrow("has not been verified yet");

        expect(
            await pinService.isSet("8011122233")
        ).toBe(false);

    });

    test("full flow: request -> verify -> complete sets a working PIN", async () => {

        const { code } =
            await enrollmentService.requestOtp("8011122233", "2348011122233");

        await enrollmentService.verifyOtp("8011122233", code);

        await enrollmentService.completeEnrollment("8011122233", "1234");

        expect(
            await pinService.isSet("8011122233")
        ).toBe(true);

        await expect(
            pinService.verify("8011122233", "1234")
        ).resolves.toBe(true);

    });

});
