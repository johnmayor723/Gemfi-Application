const { body, param, query } = require("../../validators");

module.exports = {

    sendInternal: [

        body("userId")
            .trim()
            .notEmpty()
            .withMessage(
                "userId is required."
            ),

        body("channel")
            .trim()
            .notEmpty()
            .withMessage(
                "channel is required."
            )
            .isIn(["EMAIL", "SMS"])
            .withMessage(
                "channel must be EMAIL or SMS."
            ),

        body("type")
            .trim()
            .notEmpty()
            .withMessage(
                "type is required."
            ),

        body("recipient")
            .trim()
            .notEmpty()
            .withMessage(
                "recipient is required."
            ),

        body("subject")
            .optional()
            .trim(),

        body("message")
            .trim()
            .notEmpty()
            .withMessage(
                "message is required."
            )

    ],

    listInternal: [

        query("userId")
            .trim()
            .notEmpty()
            .withMessage(
                "userId is required."
            ),

        query("page")
            .optional()
            .isInt({ min: 1 })
            .withMessage(
                "Page must be a positive integer."
            ),

        query("limit")
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage(
                "Limit must be between 1 and 100."
            )

    ],

    list: [

        query("page")
            .optional()
            .isInt({ min: 1 })
            .withMessage(
                "Page must be a positive integer."
            ),

        query("limit")
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage(
                "Limit must be between 1 and 100."
            )

    ],

    markRead: [

        param("id")
            .trim()
            .notEmpty()
            .withMessage(
                "Notification ID is required."
            )

    ]

};
