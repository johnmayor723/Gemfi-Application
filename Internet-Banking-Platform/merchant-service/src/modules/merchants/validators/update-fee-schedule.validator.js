const { body, param } = require("../../../validators");

const FEE_TYPES = [
    "PERCENTAGE",
    "FLAT"
];

module.exports = [

    param("id")
        .isMongoId()
        .withMessage("Merchant ID must be a valid identifier."),

    body("feeSchedule")
        .notEmpty()
        .withMessage("Fee schedule is required.")
        .isObject()
        .withMessage("Fee schedule must be an object."),

    body("feeSchedule.type")
        .trim()
        .notEmpty()
        .withMessage("Fee schedule type is required.")
        .isIn(FEE_TYPES)
        .withMessage(
            `Fee schedule type must be one of ${FEE_TYPES.join(", ")}.`
        ),

    body("feeSchedule.value")
        .notEmpty()
        .withMessage("Fee schedule value is required.")
        .isFloat({ min: 0 })
        .withMessage("Fee schedule value must be a non-negative number."),

    body("feeSchedule.capAmount")
        .optional()
        .isFloat({ min: 0 })
        .withMessage(
            "Fee schedule cap amount must be a non-negative number."
        )

];
