const { body } = require("../../validators");

/**
 * Africa's Talking's own callback payload shape - sessionId,
 * phoneNumber, and text are the only fields this service reads
 * (serviceCode/networkCode are sent but unused). text is
 * deliberately allowed to be an empty string: AT always sends
 * text="" on the very first request of a session, so the common
 * requiredString()/phoneNumber() validators (which reject empty
 * strings) don't fit here.
 */
module.exports = {

    callback: [

        body("sessionId")
            .trim()
            .notEmpty()
            .withMessage("sessionId is required."),

        body("phoneNumber")
            .trim()
            .notEmpty()
            .withMessage("phoneNumber is required.")
            .matches(/^\+?[0-9]{10,15}$/)
            .withMessage("Invalid phoneNumber."),

        body("text")
            .exists()
            .withMessage("text is required.")
            .isString()
            .withMessage("text must be a string.")

    ]

};
