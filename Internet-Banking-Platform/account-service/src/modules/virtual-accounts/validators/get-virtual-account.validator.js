const { param } = require("../../../validators");

module.exports = [

    param("virtualAccountNumber")
        .trim()
        .notEmpty()
        .withMessage("Virtual account number is required.")
        .isLength({ min: 10, max: 10 })
        .withMessage(
            "Virtual account number must be exactly 10 digits."
        )
        .isNumeric()
        .withMessage(
            "Virtual account number must contain only digits."
        )

];
