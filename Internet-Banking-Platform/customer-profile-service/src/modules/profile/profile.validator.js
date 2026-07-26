const { body, query } = require("../../validators");

module.exports = {

    update: [

        body("displayName")
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage(
                "Display name must be at most 100 characters."
            ),

        body("notificationsEnabled")
            .optional()
            .isBoolean()
            .withMessage(
                "notificationsEnabled must be a boolean."
            )
            .toBoolean()

    ],

    getTransactions: [

        query("accountNumber")
            .trim()
            .notEmpty()
            .withMessage(
                "Account number is required."
            )
            .isLength({ min: 10, max: 10 })
            .withMessage(
                "Account number must be exactly 10 digits."
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

    ]

};
