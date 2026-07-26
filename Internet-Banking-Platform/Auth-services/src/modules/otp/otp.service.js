const repository =
    require("./otp.repository");

const generator =
    require("./otp.generator");

const emailProvider =
    require("./email.provider");

const smsProvider =
    require("./sms.provider");

const {
    NotFoundError,
    ValidationError,
    UnauthorizedError
} = require("../../errors");

const config =
    require("../../config/app.config");

const { logger } =
    require("../../config");

class OtpService {

    /**
     * ==========================================================
     * Create Email OTP
     * ==========================================================
     */
    async createEmailOtp({

        referenceId,

        referenceType,

        email,

        expiryMinutes = 5

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

            referenceId,

            "EMAIL",

            {

                referenceId,

                referenceType,

                channel: "EMAIL",

                destination: email,

                codeHash,

                verified: false,

                verifiedAt: null,

                attempts: 0,

                expiresAt

            }

        );

        await emailProvider.send({

            email,

            otp: code

        });

        /**
         * Debug convenience only - real OTP codes must never be
         * logged in production (see ARCHITECTURE.md's logging
         * rules). Gated the same way enrollment.service.js already
         * gates echoing the code back in the API response.
         */
        if (!config.isProduction) {

            logger.info(
                {
                    referenceType,
                    referenceId,
                    email,
                    code
                },
                "Email OTP generated (debug only - not logged in production)."
            );

        }

        return {

            expiresAt,

            code

        };

    }

    /**
     * ==========================================================
     * Create SMS OTP
     * ==========================================================
     */
    async createSmsOtp({

        referenceId,

        referenceType,

        phoneNumber,

        expiryMinutes = 5,

        /**
         * Temporary debug-only fallback while the Termii Sender ID
         * is pending approval and no real SMS can be delivered.
         * When set (and not production), the SMS OTP code is also
         * emailed so UI testing isn't blocked. Remove this param
         * and its usage below once Sender ID approval lands.
         */
        debugEmail = null

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

            referenceId,

            "SMS",

            {

                referenceId,

                referenceType,

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

        /**
         * SMS delivery is currently blocked on Termii Sender ID
         * approval - email the code too so the UI flow isn't
         * stuck. TEMPORARY - remove once Sender ID is approved.
         */
        if (!config.isProduction && debugEmail) {

            await emailProvider.send({

                email: debugEmail,

                otp: code,

                subject: "Internet Banking Verification Code (SMS - debug fallback)"

            });

        }

        /**
         * Debug convenience only - real OTP codes must never be
         * logged in production (see ARCHITECTURE.md's logging
         * rules). Gated the same way enrollment.service.js already
         * gates echoing the code back in the API response.
         */
        if (!config.isProduction) {

            logger.info(
                {
                    referenceType,
                    referenceId,
                    phoneNumber,
                    code
                },
                "SMS OTP generated (debug only - not logged in production)."
            );

        }

        return {

            expiresAt,

            code

        };

    }

    /**
     * ==========================================================
     * Verify OTP
     * ==========================================================
     */
    async verify({

        referenceId,

        channel,

        code,

        maxAttempts = 5

    }) {

        const otp =
            await repository.find(

                referenceId,

                channel

            );

        if (!otp) {

            throw new NotFoundError(
                "OTP not found."
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
                "OTP has expired."
            );

        }

        if (

            otp.attempts >=

            maxAttempts

        ) {

            throw new UnauthorizedError(
                "Maximum OTP attempts exceeded."
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
                "Invalid OTP."
            );

        }

        await repository.markVerified(
            otp.id
        );

        return true;

    }

    /**
     * ==========================================================
     * Send Password Reset OTP
     * ==========================================================
     */
    async sendPasswordResetOtp(user) {

        return this.createEmailOtp({

            referenceId:
                user.id.toString(),

            referenceType:
                "PASSWORD_RESET",

            email:
                user.email

        });

    }

    /**
     * ==========================================================
     * Verify Password Reset OTP
     * ==========================================================
     */
    async verifyPasswordResetOtp(
        userId,
        code
    ) {

        const verified =
            await this.verify({

                referenceId:
                    userId.toString(),

                channel:
                    "EMAIL",

                code

            });

        await this.delete(
            userId.toString()
        );

        return verified;

    }

    /**
     * ==========================================================
     * Check Verification Status
     * ==========================================================
     */
    async isVerified(

        referenceId,

        channel

    ) {

        const otp =
            await repository.find(

                referenceId,

                channel

            );

        if (!otp) {

            return false;

        }

        return otp.verified;

    }

    /**
     * ==========================================================
     * Delete OTPs
     * ==========================================================
     */
    async delete(

        referenceId

    ) {

        return repository.deleteByReferenceId(
            referenceId
        );

    }

}

module.exports =
    new OtpService();
