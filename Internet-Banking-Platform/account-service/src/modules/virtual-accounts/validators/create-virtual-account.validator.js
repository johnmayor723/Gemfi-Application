const {
    body
} = require("../../../validators");

/**
 * Categorical fields in this codebase are validated with a
 * closed isIn([...]) list rather than left free-form (see e.g.
 * transaction-service/.../standing-order.validator.js frequency,
 * notification-service/.../notification.validator.js channel).
 * Followed the same convention here for purpose.
 */
const OWNER_TYPES = [
    "CUSTOMER",
    "MERCHANT",
    "AGENT",
    "PLATFORM"
];

const PURPOSES = [
    "COLLECTIONS",
    "WALLET_TOPUP",
    "INVOICE_PAYMENT",
    "MERCHANT_SETTLEMENT",
    "AGENT_FLOAT",
    "OTHER"
];

module.exports = [

    body("ownerType")
        .trim()
        .notEmpty()
        .withMessage("Owner type is required.")
        .isIn(OWNER_TYPES)
        .withMessage(
            `Owner type must be one of ${OWNER_TYPES.join(", ")}.`
        ),

    body("ownerId")
        .trim()
        .notEmpty()
        .withMessage("Owner ID is required."),

    body("settlementFineractAccountId")
        .optional()
        .trim()
        .notEmpty()
        .withMessage(
            "Settlement Fineract account ID cannot be empty."
        ),

    body("settlementFineractAccountNumber")
        .optional()
        .trim()
        .notEmpty()
        .withMessage(
            "Settlement Fineract account number cannot be empty."
        ),

    body("purpose")
        .trim()
        .notEmpty()
        .withMessage("Purpose is required.")
        .isIn(PURPOSES)
        .withMessage(
            `Purpose must be one of ${PURPOSES.join(", ")}.`
        ),

    body("label")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Label must be at most 100 characters."),

    body("metadata")
        .optional()
        .isObject()
        .withMessage("Metadata must be an object."),

    body().custom((value) => {

        if (
            !value.settlementFineractAccountId &&
            !value.settlementFineractAccountNumber
        ) {

            throw new Error(
                "Either settlementFineractAccountId or settlementFineractAccountNumber is required."
            );

        }

        return true;

    })

];
