require("dotenv").config();

module.exports = {
    port: process.env.PORT || 4000,

    mongoUri: process.env.MONGO_URI,

    jwtSecret: process.env.JWT_SECRET,

    nodeEnv: process.env.NODE_ENV,

    uploadDir: process.env.UPLOAD_DIR,

    fineract: {

        url: process.env.FINERACT_URL,

        tenant: process.env.FINERACT_TENANT,

        basicAuth: process.env.FINERACT_BASIC_AUTH,

        rejectUnauthorized:
            process.env.FINERACT_TLS_REJECT_UNAUTHORIZED === "true"

    },

    adminSession: {

        jwtSecret:
            process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET,

        absoluteTtlMinutes:
            Number(process.env.ADMIN_SESSION_TTL_MINUTES) || 30,

        inactivityTtlMinutes:
            Number(process.env.ADMIN_INACTIVITY_TIMEOUT_MINUTES) || 10

    },

    fineractSync: {

        maxAttempts:
            Number(process.env.FINERACT_SYNC_MAX_ATTEMPTS) || 5,

        sweepIntervalMinutes:
            Number(process.env.FINERACT_SYNC_SWEEP_INTERVAL_MINUTES) || 5

    }
};
