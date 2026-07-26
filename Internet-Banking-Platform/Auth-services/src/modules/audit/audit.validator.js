const { query } = require("express-validator");

module.exports = {

    trail: [

        query("page")
            .optional()
            .isInt({ min: 1 })
            .withMessage(
                "Page must be a positive integer."
            )
            .toInt(),

        query("limit")
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage(
                "Limit must be between 1 and 100."
            )
            .toInt()

    ]

};
