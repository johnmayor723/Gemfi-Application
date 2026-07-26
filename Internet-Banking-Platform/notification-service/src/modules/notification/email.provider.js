const nodemailer = require("nodemailer");

const config = require("../../config/app.config");

const { logger } = require("../../config");

/**
 * ==========================================================
 * Email Provider
 * ==========================================================
 *
 * Sends notification emails via Gmail SMTP (Nodemailer).
 *
 * ==========================================================
 */

const transporter = nodemailer.createTransport({

    host: config.email.host,

    port: config.email.port,

    secure: config.email.secure,

    auth: {

        user: config.email.user,

        pass: config.email.password

    }

});

class EmailProvider {

    /**
     * Send Email
     */
    async send({

        email,

        subject,

        message

    }) {

        try {

            await transporter.sendMail({

                from: config.email.from,

                to: email,

                subject,

                text: message,

                html: `<p>${message}</p>`

            });

            return {

                success: true,

                provider: "GMAIL"

            };

        } catch (error) {

            logger.warn(
                {
                    error: {
                        message: error.message
                    },
                    email
                },
                "Failed to send email notification."
            );

            return {

                success: false,

                provider: "GMAIL",

                error: error.message

            };

        }

    }

}

module.exports = new EmailProvider();
