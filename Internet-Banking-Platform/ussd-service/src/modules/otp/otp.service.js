const repository =
    require("./otp.repository");

const generator =
    require("./otp.generator");

const smsProvider =
    require("./sms.provider");

const config =
    require("../../config/app.config");

const {
    NotFoundError,
    ValidationError,
    TooManyRequestsError
} = require("../../errors");

/**
 * SMS-only, single-purpose OTP service - verifying phone
 * ownership before a first-time PIN enrollment (see
 * enrollment.service.js). No email channel and no other
 * referenceType exist here, unlike transaction-service's OTP
 * module which this mirrors the mechanics of.
 */
class OtpService {

    async createEnrollmentOtp({

        accountNumber,

        phoneNumber,

        expiryMinutes = config.otp.expiryMinutes

    }) {

        const code =
            generator.generate();

        const codeHash =
            generator.hash(code);

        const expiresAt =
            new Date(
                Date.now() +
                (expiryMinutes * 60 * 1000)
            );

        await repository.replace(

            accountNumber,

            "SMS",

            {

                referenceId:
                    accountNumber,

                referenceType:
                    "PHONE_ENROLLMENT",

                channel: "SMS",

                destination:
                    phoneNumber,

                codeHash,

                verified: false,

                verifiedAt: null,

                attempts: 0,

                expiresAt

            }

        );

        await smsProvider.send({

            phoneNumber,

            otp: code

        });

        return {

            expiresAt,

            code

        };

    }

    async verifyEnrollmentOtp(

        accountNumber,

        code,

        {
            maxAttempts = config.otp.maxAttempts
        } = {}

    ) {

        const otp =
            await repository.find(

                accountNumber,

                "SMS"

            );

        if (!otp) {

            throw new NotFoundError(
                "No verification code was requested for this account."
            );

        }

        if (otp.verified) {

            return true;

        }

        if (

            otp.expiresAt <

            new Date()

        ) {

            throw new ValidationError(
                "Verification code has expired."
            );

        }

        if (

            otp.attempts >=

            maxAttempts

        ) {

            throw new TooManyRequestsError(
                "Maximum verification attempts exceeded."
            );

        }

        const matched =
            generator.verify(

                code,

                otp.codeHash

            );

        if (!matched) {

            await repository.incrementAttempts(
                otp.id
            );

            throw new ValidationError(
                "Invalid verification code."
            );

        }

        await repository.markVerified(
            otp.id
        );

        return true;

    }

    async delete(

        accountNumber

    ) {

        return repository.deleteByReferenceId(
            accountNumber
        );

    }

    /**
     * Whether the enrollment OTP for this account has already
     * been verified - a plain status check, no code involved and
     * no side effects, unlike verifyEnrollmentOtp(). Used by
     * enrollment.service.js to confirm step 2 actually happened
     * before step 3 (setting the PIN) is allowed to proceed.
     */
    async isVerified(accountNumber) {

        const otp =
            await repository.find(
                accountNumber,
                "SMS"
            );

        return Boolean(otp && otp.verified);

    }

}

module.exports =
    new OtpService();
