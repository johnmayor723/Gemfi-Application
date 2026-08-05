const { param } = require("../../../validators");

module.exports = [

    param("id")
        .isMongoId()
        .withMessage("Agent ID must be a valid identifier.")

];
