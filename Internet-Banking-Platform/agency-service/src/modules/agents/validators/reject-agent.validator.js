const { body, param } = require("../../../validators");

module.exports = [

    param("id")
        .isMongoId()
        .withMessage("Agent ID must be a valid identifier."),

    body("rejectionReason")
        .trim()
        .notEmpty()
        .withMessage("Rejection reason is required.")

];
