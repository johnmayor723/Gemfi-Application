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
};

module.exports = config;