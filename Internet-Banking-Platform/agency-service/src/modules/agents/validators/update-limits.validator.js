const { body, param } = require("../../../validators");

/**
 * Limits are replaced together, mirroring merchant-service's
 * full-replace feeSchedule update convention (see
 * merchant-service/src/modules/merchants/validators/
 * update-fee-schedule.validator.js) rather than a partial patch -
 * all three fields are required on every call.
 */
module.exports = [

    param("id")
        .isMongoId()
        .withMessage("Agent ID must be a valid identifier."),

    body("dailyCashInLimit")
        .notEmpty()
        .withMessage("Daily cash-in limit is required.")
        .isFloat({ min: 0 })
        .withMessage("Daily cash-in limit must be a non-negative number."),

    body("dailyCashOutLimit")
        .notEmpty()
        .withMessage("Daily cash-out limit is required.")
        .isFloat({ min: 0 })
        .withMessage("Daily cash-out limit must be a non-negative number."),

    body("perTransactionLimit")
        .notEmpty()
        .withMessage("Per-transaction limit is required.")
        .isFloat({ min: 0 })
        .withMessage("Per-transaction limit must be a non-negative number.")

];
