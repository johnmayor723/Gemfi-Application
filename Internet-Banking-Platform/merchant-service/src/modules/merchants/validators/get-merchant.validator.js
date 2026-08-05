const { param } = require("../../../validators");

module.exports = [

    param("id")
        .isMongoId()
        .withMessage("Merchant ID must be a valid identifier.")

];
