const axios = require("axios");

const config = require("../../config/app.config");

const { logger } = require("../../config");

/**
 * ==========================================================
 * SMS Provider
 * ==========================================================
 *
 * Sends notification SMS via Termii.
 *
 * ==========================================================
 */

class SmsProvider {

    /**
     * Send SMS
     */
    async send({

        phoneNumber,

        message

    }) {

        try {

            await axios.post(

                `${config.sms.termii.baseUrl}/api/sms/send`,

                {

                    api_key:
                        config.sms.termii.apiKey,

                    to:
                        phoneNumber,

                    from:
                        config.sms.termii.senderId,

                    sms:
                        message,

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
                        message: error.message
                    },
                    phoneNumber
                },
                "Failed to send SMS notification."
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
