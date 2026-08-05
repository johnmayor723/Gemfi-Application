const { client: accountClient } =
    require("../../integrations/account");

const otpService =
    require("../otp/otp.service");

const pinService =
    require("../pin/pin.service");

const { NotFoundError } =
    require("../../errors");

/**
 * Orchestrates first-time PIN enrollment (Decision B1 from the
 * scoping plan): resolve the phone number against account-service,
 * send an SMS OTP to prove the caller really holds that number,
 * verify it, then let the caller set a PIN. Each step is a
 * separate USSD menu screen, driven by ussd-session's state
 * machine - this service has no notion of "session", only of the
 * enrollment steps themselves.
 */
class EnrollmentService {

    /**
     * Resolves the account tied to a phone number. Returns null
     * (not a thrown error) when there's no match - "unrecognized
     * number" is a normal branch for the session state machine,
     * not a failure.
     */
    async resolveAccount(phoneNumber) {

        return accountClient.getByPhoneNumber(phoneNumber);

    }

    /**
     * Step 1: send the enrollment OTP. Assumes the caller has
     * already resolved an account for this phone number and
     * confirmed no PIN is set yet.
     */
    async requestOtp(accountNumber, phoneNumber) {

        return otpService.createEnrollmentOtp({
            accountNumber,
            phoneNumber
        });

    }

    /**
     * Step 2: verify the OTP the caller just typed in. Throws on
     * a wrong/expired/exhausted code - the session state machine
     * is responsible for turning that into a USSD-appropriate
     * message and re-prompt.
     */
    async verifyOtp(accountNumber, code) {

        return otpService.verifyEnrollmentOtp(
            accountNumber,
            code
        );

    }

    /**
     * Step 3: set the PIN. Requires the OTP for this account to
     * already be verified - re-checks rather than trusting the
     * session state machine alone, since this is the step that
     * actually creates a standing credential.
     */
    async completeEnrollment(accountNumber, plainPin) {

        const verified =
            await otpService.isVerified(accountNumber);

        if (!verified) {

            throw new NotFoundError(
                "Phone number has not been verified yet."
            );

        }

        await pinService.set(accountNumber, plainPin);

        await otpService.delete(accountNumber);

    }

}

module.exports = new EnrollmentService();
