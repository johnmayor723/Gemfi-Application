/**
 * ==========================================================
 * Mail Client
 * ----------------------------------------------------------
 * Calls gemfi-mail-service's internal /onboarding-welcome
 * route - the only service on the platform with real,
 * working SMTP credentials configured, so this reuses it
 * rather than standing up a second set of credentials here.
 * ==========================================================
 */

const axios = require("axios");

const { app: config } = require("../../config");

const client = axios.create({

    baseURL: config.mail.serviceUrl,

    timeout: 10000,

    headers: {

        "X-Internal-Auth": config.mail.secret,

        "Content-Type": "application/json"

    }

});

class MailClient {

    async sendOnboardingWelcome({ companyName, email, referenceId, statusUrl }) {

        await client.post("/onboarding-welcome", {

            companyName,

            email,

            referenceId,

            statusUrl

        });

    }

}

module.exports = new MailClient();
