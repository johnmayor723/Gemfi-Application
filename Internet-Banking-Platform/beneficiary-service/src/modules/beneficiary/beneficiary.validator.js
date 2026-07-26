const { body, param, query } = require("../../validators");

module.exports = {

    create: [

        body("accountNumber")
            .trim()
            .notEmpty()
            .withMessage(
                "Account number is required."
            )
            .isLength({ min: 10, max: 10 })
            .withMessage(
                "Account number must be exactly 10 digits."
            )
            .isNumeric()
            .withMessage(
                "Account number must contain only digits."
            ),

        body("bankCode")
            .optional()
            .trim()
            .notEmpty()
            .withMessage(
                "Bank code cannot be empty."
            ),

        body("bankName")
            .if(body("bankCode").exists())
            .trim()
            .notEmpty()
            .withMessage(
                "Bank name is required for other-bank beneficiaries."
            ),

        body("accountName")
            .if(body("bankCode").exists())
            .trim()
            .notEmpty()
            .withMessage(
                "Account name is required for other-bank beneficiaries."
            ),

        body("nickname")
            .optional()
            .trim()
            .isLength({ max: 50 })
            .withMessage(
                "Nickname must be at most 50 characters."
            )

    ],

    update: [

        param("id")
            .trim()
            .notEmpty()
            .withMessage(
                "Beneficiary ID is required."
            ),

        body("nickname")
            .optional()
            .trim()
            .isLength({ max: 50 })
            .withMessage(
                "Nickname must be at most 50 characters."
            ),

        body("isFavorite")
            .optional()
            .isBoolean()
            .withMessage(
                "isFavorite must be a boolean."
            )
            .toBoolean()

    ],

    getById: [

        param("id")
            .trim()
            .notEmpty()
            .withMessage(
                "Beneficiary ID is required."
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
            ),

        query("favorite")
            .optional()
            .isBoolean()
            .withMessage(
                "favorite must be a boolean."
            )

    ]

};
