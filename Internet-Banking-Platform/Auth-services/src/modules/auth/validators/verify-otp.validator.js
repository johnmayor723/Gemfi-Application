const { body } = require("express-validator");

module.exports = [

    /**
     * Registration ID
     */
    body("registrationId")
        .trim()
        .notEmpty()
        .withMessage(
            "Registration ID is required."
        ),

    /**
     * OTP
     */
    body("otp")
        .trim()
        .notEmpty()
        .withMessage(
            "OTP is required."
        )
        .isLength({
            min: 6,
            max: 6
        })
        .withMessage(
            "OTP must be 6 digits."
        )
        .isNumeric()
        .withMessage(
            "OTP must contain only digits."
        )

];
