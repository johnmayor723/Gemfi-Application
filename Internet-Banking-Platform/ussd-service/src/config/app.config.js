require("dotenv").config();

const required = [
    "SERVICE_NAME",
    "PORT",
    "NODE_ENV",
    "MONGODB_URI",
    "MONGODB_DATABASE"
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
        database: process.env.MONGODB_DATABASE || "banking_platform"
    },

    accountService: {
        url: process.env.ACCOUNT_SERVICE_URL
    },

    statementService: {
        url: process.env.STATEMENT_SERVICE_URL
    },

    internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN,

    africasTalking: {
        username: process.env.AFRICASTALKING_USERNAME,
        apiKey: process.env.AFRICASTALKING_API_KEY
    },

    sms: {
        termii: {
            apiKey: process.env.TERMII_API_KEY,
            senderId: process.env.TERMII_SENDER_ID,
            baseUrl: process.env.TERMII_BASE_URL || "https://api.ng.termii.com"
        }
    },

    otp: {
        length: Number(process.env.OTP_LENGTH || 6),
        expiryMinutes: Number(process.env.OTP_EXPIRY_MINUTES || 5),
        maxAttempts: Number(process.env.OTP_MAX_ATTEMPTS || 5)
    },

    pin: {
        length: Number(process.env.PIN_LENGTH || 4),
        maxAttempts: Number(process.env.PIN_MAX_ATTEMPTS || 3),
        lockoutMinutes: Number(process.env.PIN_LOCKOUT_MINUTES || 30)
    },

    ussd: {
        sessionTtlSeconds: Number(process.env.USSD_SESSION_TTL_SECONDS || 180)
    }
};

module.exports = config;