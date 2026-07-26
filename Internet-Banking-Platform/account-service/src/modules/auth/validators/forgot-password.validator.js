const { body } = require("express-validator");

module.exports = [

    body("identifier")
        .trim()
        .notEmpty()
        .withMessage(
            "Username, email or account number is required."
        )

];
