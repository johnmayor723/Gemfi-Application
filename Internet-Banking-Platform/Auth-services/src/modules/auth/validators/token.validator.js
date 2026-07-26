const { body } = require("express-validator");

module.exports = [

    body("refreshToken")
        .trim()
        .notEmpty()
        .withMessage(
            "Refresh token is required."
        )

];
