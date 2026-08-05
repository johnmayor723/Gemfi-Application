const { body, param } = require("../../../validators");

const COMMISSION_TYPES = [
    "PERCENTAGE",
    "FLAT"
];

module.exports = [

    param("id")
        .isMongoId()
        .withMessage("Agent ID must be a valid identifier."),

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
        )

];
