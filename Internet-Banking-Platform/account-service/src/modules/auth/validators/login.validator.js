const { body } = require("express-validator");

module.exports = [

    /**
     * Login Identifier
     *
     * Can be:
     * - Username
     * - Email
     * - External Account Number
     */
    body("identifier")
        .trim()
        .notEmpty()
        .withMessage(
            "Username, email or account number is required."
        )
        .isLength({
            min: 4,
            max: 100
        })
        .withMessage(
            "Invalid login identifier."
        ),

    /**
     * Password
     */
    body("password")
        .notEmpty()
        .withMessage(
            "Password is required."
        )
        .isLength({
            min: 8
        })
        .withMessage(
            "Password must be at least 8 characters."
        )

];
