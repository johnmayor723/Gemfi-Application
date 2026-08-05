const {
    body
} = require("../../validators");

module.exports = {

    login: [

        body("username")
            .trim()
            .notEmpty()
            .withMessage(
                "Username is required."
            ),

        body("password")
            .notEmpty()
            .withMessage(
                "Password is required."
            )

    ]

};
