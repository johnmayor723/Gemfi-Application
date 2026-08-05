const { query } = require("../../validators");

module.exports = {

    generate: [

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
            ),

        query("format")
            .optional()
            .isIn(["json", "csv"])
            .withMessage(
                "format must be json or csv."
            )

    ],

    generateForInternalCaller: [

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
            ),

        query("limit")
            .optional()
            .isInt({ min: 1, max: 500 })
            .withMessage(
                "limit must be an integer between 1 and 500."
            )

    ]

};
