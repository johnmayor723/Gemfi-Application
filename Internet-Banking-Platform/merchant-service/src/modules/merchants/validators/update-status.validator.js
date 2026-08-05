const { body, param } = require("../../../validators");

module.exports = [

    param("id")
        .isMongoId()
        .withMessage("Merchant ID must be a valid identifier."),

    body("status")
        .trim()
        .notEmpty()
        .withMessage("Status is required.")
        .isIn(["ACTIVE", "SUSPENDED", "CLOSED"])
        .withMessage(
            "Status must be one of ACTIVE, SUSPENDED, CLOSED."
        )

];
