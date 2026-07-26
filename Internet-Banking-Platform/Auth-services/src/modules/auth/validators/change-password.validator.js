const { body } = require("express-validator");

module.exports = [

    body("currentPassword")
        .notEmpty()
        .withMessage(
            "Current password is required."
        ),

    body("newPassword")
        .notEmpty()
        .withMessage(
            "New password is required."
        )
        .isLength({
            min: 8
        })
        .withMessage(
            "New password must be at least 8 characters."
        ),

    body("confirmPassword")
        .custom((value, { req }) => {

            if (value !== req.body.newPassword) {

                throw new Error(
                    "Passwords do not match."
                );

            }

            return true;

        })

];
