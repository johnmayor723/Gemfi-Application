const {
    body,
    param
} = require("../../validators");

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const submit = [

    body("companyName")
        .trim()
        .notEmpty()
        .withMessage("Company name is required."),

    body("contactEmail")
        .trim()
        .notEmpty()
        .withMessage("Contact email is required.")
        .isEmail()
        .withMessage("Invalid contact email.")
        .normalizeEmail(),

    body("contactPhone")
        .trim()
        .notEmpty()
        .withMessage("Contact phone is required.")
        .matches(/^[0-9+][0-9\s-]{6,20}$/)
        .withMessage("Invalid contact phone."),

    body("contactAddress")
        .optional()
        .trim(),

    body("primaryColor")
        .trim()
        .notEmpty()
        .withMessage("Primary color is required.")
        .matches(HEX_COLOR)
        .withMessage("Primary color must be a 6-digit hex color, e.g. #5B4A8F."),

    body("secondaryColor")
        .trim()
        .notEmpty()
        .withMessage("Secondary color is required.")
        .matches(HEX_COLOR)
        .withMessage("Secondary color must be a 6-digit hex color, e.g. #E3DDF0.")

];

const getPublicStatus = [

    param("id")
        .trim()
        .notEmpty()
        .withMessage("Request id is required.")
        .isMongoId()
        .withMessage("Invalid request id.")

];

const getBranding = [

    param("subdomain")
        .trim()
        .notEmpty()
        .withMessage("Subdomain is required.")

];

const getById = [

    param("id")
        .trim()
        .notEmpty()
        .withMessage("Request id is required.")
        .isMongoId()
        .withMessage("Invalid request id.")

];

const update = [

    ...getById,

    body("companyName").optional().trim().notEmpty(),

    body("contactEmail").optional().trim().isEmail().normalizeEmail(),

    body("contactPhone").optional().trim(),

    body("contactAddress").optional().trim(),

    body("primaryColor").optional().trim().matches(HEX_COLOR),

    body("secondaryColor").optional().trim().matches(HEX_COLOR),

    body("roles").optional().isArray(),

    body("chartOfAccountsConfirmed").optional().isBoolean()

];

const reject = [

    ...getById,

    body("reason")
        .optional()
        .trim()

];

module.exports = {

    submit,

    getPublicStatus,

    getBranding,

    getById,

    update,

    reject

};
