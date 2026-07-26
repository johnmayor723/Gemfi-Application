const {
    param,
    query
} = require("../../validators");

module.exports = {

    getClient: [

        param("clientId")
            .trim()
            .notEmpty()
            .withMessage(
                "Client ID is required."
            )

    ],

    getLoans: [

        param("clientId")
            .trim()
            .notEmpty()
            .withMessage(
                "Client ID is required."
            )

    ],

    getTransactions: [

        param("accountId")
            .trim()
            .notEmpty()
            .withMessage(
                "Account ID is required."
            ),

        query("page")
            .optional()
            .isInt({ min: 1 })
            .withMessage(
                "Page must be a positive integer."
            ),

        query("limit")
            .optional()
            .isInt({ min: 1, max: 500 })
            .withMessage(
                "Limit must be between 1 and 500."
            ),

        query("startDate")
            .optional()
            .isISO8601()
            .withMessage(
                "startDate must be a valid ISO 8601 date."
            ),

        query("endDate")
            .optional()
            .isISO8601()
            .withMessage(
                "endDate must be a valid ISO 8601 date."
            )

    ]

};
