const { body, param } = require("../../../validators");

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
        ),

    body("status")
        .trim()
        .notEmpty()
        .withMessage("Status is required.")
        .isIn(["ACTIVE", "SUSPENDED", "CLOSED"])
        .withMessage(
            "Status must be one of ACTIVE, SUSPENDED, CLOSED."
        )

];
