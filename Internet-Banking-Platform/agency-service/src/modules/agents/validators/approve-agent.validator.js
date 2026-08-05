const { body, param } = require("../../../validators");

const COMMISSION_TYPES = [
    "PERCENTAGE",
    "FLAT"
];

module.exports = [

    param("id")
        .isMongoId()
        .withMessage("Agent ID must be a valid identifier."),

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

    body("commissionSchedule")
        .notEmpty()
        .withMessage("Commission schedule is required.")
        .isObject()
        .withMessage("Commission schedule must be an object."),

    body("commissionSchedule.type")
        .trim()
        .notEmpty()
        .withMessage("Commission schedule type is required.")
        .isIn(COMMISSION_TYPES)
        .withMessage(
            `Commission schedule type must be one of ${COMMISSION_TYPES.join(", ")}.`
        ),

    body("commissionSchedule.value")
        .notEmpty()
        .withMessage("Commission schedule value is required.")
        .isFloat({ min: 0 })
        .withMessage(
            "Commission schedule value must be a non-negative number."
        ),

    body("commissionSchedule.capAmount")
        .optional()
        .isFloat({ min: 0 })
        .withMessage(
            "Commission schedule cap amount must be a non-negative number."
        ),

    body("dailyCashInLimit")
        .notEmpty()
        .withMessage("Daily cash-in limit is required.")
        .isFloat({ min: 0 })
        .withMessage("Daily cash-in limit must be a non-negative number."),

    body("dailyCashOutLimit")
        .notEmpty()
        .withMessage("Daily cash-out limit is required.")
        .isFloat({ min: 0 })
        .withMessage("Daily cash-out limit must be a non-negative number."),

    body("perTransactionLimit")
        .notEmpty()
        .withMessage("Per-transaction limit is required.")
        .isFloat({ min: 0 })
        .withMessage("Per-transaction limit must be a non-negative number."),

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
