require("dotenv").config();

const required = [
    "SERVICE_NAME",
    "PORT",
    "NODE_ENV",
    "MONGODB_URI",
    "MONGODB_DATABASE",
    "ACCOUNT_SERVICE_URL",
    "INTERNAL_SERVICE_TOKEN",
    "ADMIN_JWT_SECRET",
    "FINERACT_URL",
    "FINERACT_TENANT"
];

const missing = required.filter(
    (key) => !process.env[key]
);

if (missing.length > 0) {
    console.error("");

    console.error("========================================");
    console.error("CONFIGURATION ERROR");
    console.error("========================================");
    console.error("");

    missing.forEach((item) => {
        console.error(`Missing environment variable: ${item}`);
    });

    console.error("");

    process.exit(1);
}

const config = {
    serviceName: process.env.SERVICE_NAME,

    version: process.env.SERVICE_VERSION || "1.0.0",

    environment: process.env.NODE_ENV,

    port: Number(process.env.PORT),

    apiPrefix: process.env.API_PREFIX || "/api/v1",

    isDevelopment: process.env.NODE_ENV === "development",

    isProduction: process.env.NODE_ENV === "production",

    isTest: process.env.NODE_ENV === "test",

    mongo: {
        uri: process.env.MONGODB_URI,
        database: process.env.MONGODB_DATABASE || "agency_service"
    },

    /**
     * Account Service - the only other service agency-service ever
     * calls for business logic. An agent's float virtual account
     * is provisioned there (see
     * src/integrations/account/account.client.js).
     */
    accountService: {
        url: process.env.ACCOUNT_SERVICE_URL
    },

    internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN,

    /**
     * Fineract is only ever touched here to authenticate admin
     * logins (src/integrations/fineract/fineract-auth.client.js),
     * the same narrow exception account-service, kyc-service,
     * onboarding-service, and merchant-service each make for
     * their own admin modules. agency-service never calls
     * Fineract for business logic - agent cash-in/cash-out
     * transaction execution is explicitly out of scope for this
     * service (see src/modules/agents/agent.service.js).
     */
    fineract: {

        url: process.env.FINERACT_URL,

        tenant: process.env.FINERACT_TENANT,

        /**
         * Fineract sandboxes commonly run with a self-signed
         * certificate.
         */
        rejectUnauthorized:
            process.env.FINERACT_TLS_REJECT_UNAUTHORIZED === "true"

    },

    /**
     * Admin session auth - this service owns a full local admin
     * module (src/modules/admin/), same as account-service,
     * kyc-service, onboarding-service, and merchant-service.
     */
    adminSession: {

        jwtSecret: process.env.ADMIN_JWT_SECRET,

        absoluteTtlMinutes:
            Number(process.env.ADMIN_SESSION_TTL_MINUTES) || 30,

        inactivityTtlMinutes:
            Number(process.env.ADMIN_INACTIVITY_TIMEOUT_MINUTES) || 10

    }
};

module.exports = config;
