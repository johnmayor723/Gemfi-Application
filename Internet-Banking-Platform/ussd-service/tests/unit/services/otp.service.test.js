jest.mock("../../../src/modules/otp/sms.provider", () => ({

    send: jest.fn().mockResolvedValue({ success: true, provider: "TERMII" })

}));

const db =
    require("../../helpers/database");

const smsProvider =
    require("../../../src/modules/otp/sms.provider");

const otpService =
    require("../../../src/modules/otp/otp.service");

describe("Otp Service (enrollment)", () => {

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

    test("createEnrollmentOtp sends via Termii and returns the plain code", async () => {

        const result =
            await otpService.createEnrollmentOtp({
                accountNumber: "8011122233",
                phoneNumber: "2348011122233"
            });

        expect(smsProvider.send).toHaveBeenCalledWith({
            phoneNumber: "2348011122233",
            otp: result.code
        });

        expect(result.code).toMatch(/^\d{6}$/);

    });

    test("verifyEnrollmentOtp succeeds with the correct code", async () => {

        const { code } =
            await otpService.createEnrollmentOtp({
                accountNumber: "8011122233",
                phoneNumber: "2348011122233"
            });

        await expect(
            otpService.verifyEnrollmentOtp("8011122233", code)
        ).resolves.toBe(true);

        expect(
            await otpService.isVerified("8011122233")
        ).toBe(true);

    });

    test("verifyEnrollmentOtp rejects a wrong code without marking verified", async () => {

        await otpService.createEnrollmentOtp({
            accountNumber: "8011122233",
            phoneNumber: "2348011122233"
        });

        await expect(
            otpService.verifyEnrollmentOtp("8011122233", "000000")
        ).rejects.toThrow("Invalid verification code");

        expect(
            await otpService.isVerified("8011122233")
        ).toBe(false);

    });

    test("isVerified is false when no OTP was ever requested", async () => {

        expect(
            await otpService.isVerified("8099999999")
        ).toBe(false);

    });

    test("re-requesting an OTP for the same account replaces the prior one", async () => {

        const first =
            await otpService.createEnrollmentOtp({
                accountNumber: "8011122233",
                phoneNumber: "2348011122233"
            });

        const second =
            await otpService.createEnrollmentOtp({
                accountNumber: "8011122233",
                phoneNumber: "2348011122233"
            });

        // The first code should no longer verify once replaced
        // (unless the RNG happened to collide, astronomically
        // unlikely for a 6-digit code).
        if (first.code !== second.code) {

            await expect(
                otpService.verifyEnrollmentOtp("8011122233", first.code)
            ).rejects.toThrow("Invalid verification code");

        }

        await expect(
            otpService.verifyEnrollmentOtp("8011122233", second.code)
        ).resolves.toBe(true);

    });

});
