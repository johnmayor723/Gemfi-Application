const crypto = require("crypto");

const config = require("../../config/app.config");

class OtpService {

    /**
     * Generate a secure numeric OTP.
     */
    generate() {

        const length =
            Number(process.env.OTP_LENGTH || 6);

        const min =
            Math.pow(10, length - 1);

        const max =
            Math.pow(10, length) - 1;

        const otp =
            crypto.randomInt(
                min,
                max + 1
            );

        return otp.toString();

    }

    /**
     * Calculate OTP expiry.
     */
    getExpiryDate() {

        const expiryMinutes =
            Number(
                process.env.OTP_EXPIRY_MINUTES || 5
            );

        return new Date(
            Date.now() +
            expiryMinutes * 60 * 1000
        );

    }

    /**
     * Create OTP payload.
     */
    create() {

        return {

            code: this.generate(),

            expiresAt:
                this.getExpiryDate(),

            attempts: 0,

            verified: false

        };

    }

    /**
     * Check if OTP has expired.
     */
    isExpired(expiresAt) {

        return new Date() > expiresAt;

    }

    /**
     * Check if OTP is already verified.
     */
    isVerified(otp) {

        return otp.verified === true;

    }

    /**
     * Verify OTP code.
     */
    verify(
        otp,
        suppliedCode
    ) {

        if (!otp) {

            return {
                valid: false,
                message: "OTP not found."
            };

        }

        if (this.isVerified(otp)) {

            return {
                valid: false,
                message:
                    "OTP already verified."
            };

        }

        if (
            this.isExpired(
                otp.expiresAt
            )
        ) {

            return {
                valid: false,
                message:
                    "OTP has expired."
            };

        }

        const maxAttempts =
            Number(
                process.env.OTP_MAX_ATTEMPTS || 5
            );

        if (
            otp.attempts >=
            maxAttempts
        ) {

            return {
                valid: false,
                message:
                    "Maximum verification attempts exceeded."
            };

        }

        if (
            otp.code !== suppliedCode
        ) {

            return {
                valid: false,
                message:
                    "Invalid OTP."
            };

        }

        return {

            valid: true,

            message:
                "OTP verified successfully."

        };

    }

}

module.exports = new OtpService();
