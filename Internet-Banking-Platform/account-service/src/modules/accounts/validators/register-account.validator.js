const {
    body,
    requiredString
} = require("../../../validators");

module.exports = [

    requiredString(
        "fineractAccountId",
        "Fineract account ID"
    ),

    requiredString(
        "name",
        "Name"
    ),

    body("phoneNumber")
        .trim()
        .notEmpty()
        .withMessage(
            "Phone number is required."
        )
        .matches(/^\+?[0-9]{10,15}$/)
        .withMessage(
            "Invalid phone number."
        )

];
