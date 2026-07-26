const { body } = require("express-validator");

module.exports = [

    body("token")
        .trim()
        .notEmpty()
        .withMessage(
            "Reset token is required."
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
