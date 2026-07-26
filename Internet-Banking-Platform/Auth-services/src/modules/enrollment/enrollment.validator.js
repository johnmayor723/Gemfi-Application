const {
    body
} = require(
    "express-validator"
);

/**
 * ==========================================================
 * Start Enrollment
 * ==========================================================
 */

exports.start = [

    body("accountNumber")
        .trim()
        .notEmpty()
        .withMessage(
            "Account number is required."
        ),

    body("email")
        .trim()
        .isEmail()
        .withMessage(
            "Valid email is required."
        ),

    body("phoneNumber")
        .trim()
        .notEmpty()
        .withMessage(
            "Phone number is required."
        )

];

/**
 * ==========================================================
 * Verify Enrollment
 * ==========================================================
 */

exports.verify = [

    body("enrollmentId")
        .trim()
        .notEmpty()
        .withMessage(
            "Enrollment ID is required."
        ),

    body("emailOtp")
        .trim()
        .isLength({

            min: 6,
            max: 6

        })
        .withMessage(
            "Email OTP must be 6 digits."
        ),

    body("smsOtp")
        .trim()
        .isLength({

            min: 6,
            max: 6

        })
        .withMessage(
            "SMS OTP must be 6 digits."
        )

];

/**
 * ==========================================================
 * Complete Enrollment
 * ==========================================================
 */

exports.complete = [

    body("enrollmentId")
        .trim()
        .notEmpty()
        .withMessage(
            "Enrollment ID is required."
        ),

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
        ),

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
        ),

    body("confirmPassword")
        .custom((value, { req }) => {

            if (value !== req.body.password) {

                throw new Error(
                    "Passwords do not match."
                );

            }

            return true;

        })

];
