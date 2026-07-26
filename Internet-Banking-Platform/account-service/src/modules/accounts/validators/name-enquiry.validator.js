const { param } = require("express-validator");

module.exports = [

    param("accountNumber")
        .trim()
        .notEmpty()
        .withMessage("Account number is required.")
        .isLength({ min: 10, max: 10 })
        .withMessage("Account number must be exactly 10 digits.")
        .isNumeric()
        .withMessage("Account number must contain only digits.")
];