const { body } = require("express-validator");

module.exports = [

    /**
     * External Account Number
     */
    body("accountNumber")
        .trim()
        .notEmpty()
        .withMessage("Account number is required.")
        .isLength({
            min: 10,
            max: 10
        })
        .withMessage(
            "Account number must be 10 digits."
        )
        .isNumeric()
        .withMessage(
            "Account number must contain only digits."
        ),

    /**
     * Email
     */
    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required.")
        .isEmail()
        .withMessage(
            "Invalid email address."
        )
        .normalizeEmail(),

    /**
     * Phone Number
     */
    body("phoneNumber")
        .trim()
        .notEmpty()
        .withMessage(
            "Phone number is required."
        )
        .isLength({
            min: 10,
            max: 15
        })
        .withMessage(
            "Invalid phone number."
        ),

    /**
     * Username
     */
    body("username")
        .trim()
        .notEmpty()
        .withMessage(
            "Username is required."
        )
        .isLength({
            min: 4,
            max: 30
        })
        .withMessage(
            "Username must be between 4 and 30 characters."
        )
        .matches(/^[a-zA-Z0-9._]+$/)
        .withMessage(
            "Username may only contain letters, numbers, '.' and '_'."
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
        .matches(/[A-Z]/)
        .withMessage(
            "Password must contain at least one uppercase letter."
        )
        .matches(/[a-z]/)
        .withMessage(
            "Password must contain at least one lowercase letter."
        )
        .matches(/[0-9]/)
        .withMessage(
            "Password must contain at least one number."
        )
        .matches(/[!@#$%^&*(),.?":{}|<>_\-\\[\]/+=;]/)
        .withMessage(
            "Password must contain at least one special character."
        ),

    /**
     * Confirm Password
     */
    body("confirmPassword")
        .notEmpty()
        .withMessage(
            "Confirm password is required."
        )
        .custom((value, { req }) => {

            if (value !== req.body.password) {

                throw new Error(
                    "Passwords do not match."
                );

            }

            return true;

        })

];
