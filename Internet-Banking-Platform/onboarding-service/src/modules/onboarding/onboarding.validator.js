const {
    body,
    param
} = require("../../validators");

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const TIERS = ["starter", "professional", "enterprise"];
const INSTITUTION_TYPES = ["bank", "cooperative", "loan_company"];

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
        .withMessage("Secondary color must be a 6-digit hex color, e.g. #E3DDF0."),

    body("tier")
        .optional()
        .trim()
        .isIn(TIERS)
        .withMessage(`Tier must be one of: ${TIERS.join(", ")}.`),

    body("institutionType")
        .optional()
        .trim()
        .isIn(INSTITUTION_TYPES)
        .withMessage(`Institution type must be one of: ${INSTITUTION_TYPES.join(", ")}.`)

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

    body("chartOfAccountsConfirmed").optional().isBoolean(),

    body("tier")
        .optional()
        .trim()
        .isIn(TIERS)
        .withMessage(`Tier must be one of: ${TIERS.join(", ")}.`),

    body("institutionType")
        .optional()
        .trim()
        .isIn(INSTITUTION_TYPES)
        .withMessage(`Institution type must be one of: ${INSTITUTION_TYPES.join(", ")}.`)

];

const reject = [

    ...getById,

    body("reason")
        .optional()
        .trim()

];

const setStatus = [

    ...getById,

    body("status")
        .trim()
        .notEmpty()
        .withMessage("Status is required.")
        .isIn(["active", "disabled"])
        .withMessage("Status must be either 'active' or 'disabled'.")

];

const createTenantUser = [

    ...getById,

    body("username")
        .trim()
        .notEmpty()
        .withMessage("Username is required."),

    body("firstname")
        .trim()
        .notEmpty()
        .withMessage("First name is required."),

    body("lastname")
        .trim()
        .notEmpty()
        .withMessage("Last name is required."),

    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required.")
        .isEmail()
        .withMessage("Invalid email."),

    body("officeId")
        .notEmpty()
        .withMessage("Office is required."),

    body("roles")
        .isArray({ min: 1 })
        .withMessage("At least one role is required."),

    body("password")
        .notEmpty()
        .withMessage("Password is required."),

    body("repeatPassword")
        .notEmpty()
        .withMessage("Password confirmation is required.")

];

module.exports = {

    submit,

    getPublicStatus,

    getBranding,

    getById,

    update,

    reject,

    setStatus,

    createTenantUser

};
