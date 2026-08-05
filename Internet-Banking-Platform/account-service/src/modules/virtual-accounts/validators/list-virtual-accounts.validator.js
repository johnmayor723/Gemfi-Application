const { query } = require("../../../validators");

const OWNER_TYPES = [
    "CUSTOMER",
    "MERCHANT",
    "AGENT",
    "PLATFORM"
];

module.exports = [

    query("ownerType")
        .optional()
        .trim()
        .isIn(OWNER_TYPES)
        .withMessage(
            `Owner type must be one of ${OWNER_TYPES.join(", ")}.`
        ),

    query("ownerId")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Owner ID cannot be empty.")

];
