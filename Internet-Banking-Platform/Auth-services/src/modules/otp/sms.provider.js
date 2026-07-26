const axios = require("axios");

const config = require("../../config/app.config");

const { logger } = require("../../config");

/**
 * ==========================================================
 * SMS OTP Provider
 * ==========================================================
 *
 * Sends OTP via Termii's standard send endpoint. This requires
 * an approved Sender ID (TERMII_SENDER_ID) on the Termii
 * workspace - the "number send" endpoint that avoids this
 * requirement does not exist on the v4 API, confirmed by direct
 * probing (404).
 *
 * ==========================================================
 */

/**
 * Termii expects Nigerian numbers in international format
 * with no leading "+" (e.g. 2348012345678). Enrollment collects
 * local-format numbers (08012345678), so normalize here rather
 * than at every call site.
 */
const toInternational = (phoneNumber) => {

    const digits =
        phoneNumber.replace(/\D/g, "");

    /**
     * Handles the common "234" + local-with-leading-0" mistake
     * (e.g. 23408012345678) as well as plain local format.
     */
    if (digits.startsWith("2340")) {

        return `234${digits.slice(4)}`;

    }

    if (digits.startsWith("234")) {

        return digits;

    }

    if (digits.startsWith("0")) {

        return `234${digits.slice(1)}`;

    }

    return digits;

};

class SmsProvider {

    /**
     * Send SMS OTP
     */
    async send({

        phoneNumber,

        otp

    }) {

        try {

            const baseUrl =
                config.sms.termii.baseUrl.replace(/\/+$/, "");

            await axios.post(

                `${baseUrl}/api/sms/send`,

                {

                    api_key:
                        config.sms.termii.apiKey,

                    to:
                        toInternational(phoneNumber),

                    from:
                        config.sms.termii.senderId,

                    sms:
                        `Your Internet Banking verification code is ${otp}. It expires in 5 minutes.`,

                    type: "plain",

                    channel: "generic"

                }

            );

            return {

                success: true,

                provider: "TERMII"

            };

        } catch (error) {

            logger.warn(
                {
                    error: {
                        message: error.message,
                        status: error.response?.status,
                        body: error.response?.data
                    },
                    phoneNumber
                },
                "Failed to send SMS OTP."
            );

            return {

                success: false,

                provider: "TERMII",

                error: error.message

            };

        }

    }

}

module.exports = new SmsProvider();
