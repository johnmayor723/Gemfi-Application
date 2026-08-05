const { query } = require("../../../validators");

const STATUSES = [
    "PENDING",
    "APPROVED",
    "REJECTED",
    "ACTIVE",
    "SUSPENDED",
    "CLOSED"
];

const MERCHANT_CATEGORIES = [
    "RETAIL",
    "ECOMMERCE",
    "HOSPITALITY",
    "TRANSPORT",
    "UTILITIES",
    "PROFESSIONAL_SERVICES",
    "OTHER"
];

module.exports = [

    query("status")
        .optional()
        .trim()
        .isIn(STATUSES)
        .withMessage(
            `Status must be one of ${STATUSES.join(", ")}.`
        ),

    query("merchantCategory")
        .optional()
        .trim()
        .isIn(MERCHANT_CATEGORIES)
        .withMessage(
            `Merchant category must be one of ${MERCHANT_CATEGORIES.join(", ")}.`
        )

];
