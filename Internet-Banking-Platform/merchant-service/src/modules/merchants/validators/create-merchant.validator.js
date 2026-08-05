const { body } = require("../../../validators");

const BUSINESS_TYPES = [
    "SOLE_PROPRIETORSHIP",
    "LIMITED_LIABILITY",
    "PARTNERSHIP",
    "NGO",
    "OTHER"
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

    body("businessName")
        .trim()
        .notEmpty()
        .withMessage("Business name is required."),

    body("tradingName")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Trading name cannot be empty."),

    body("registrationNumber")
        .trim()
        .notEmpty()
        .withMessage("Registration number is required."),

    body("businessType")
        .trim()
        .notEmpty()
        .withMessage("Business type is required.")
        .isIn(BUSINESS_TYPES)
        .withMessage(
            `Business type must be one of ${BUSINESS_TYPES.join(", ")}.`
        ),

    body("merchantCategory")
        .trim()
        .notEmpty()
        .withMessage("Merchant category is required.")
        .isIn(MERCHANT_CATEGORIES)
        .withMessage(
            `Merchant category must be one of ${MERCHANT_CATEGORIES.join(", ")}.`
        ),

    body("contactName")
        .trim()
        .notEmpty()
        .withMessage("Contact name is required."),

    body("contactEmail")
        .trim()
        .notEmpty()
        .withMessage("Contact email is required.")
        .isEmail()
        .withMessage("Invalid contact email address.")
        .normalizeEmail(),

    body("contactPhone")
        .trim()
        .notEmpty()
        .withMessage("Contact phone is required.")
        .matches(/^[0-9]{10,15}$/)
        .withMessage("Invalid contact phone number."),

    body("address")
        .trim()
        .notEmpty()
        .withMessage("Address is required.")

];
