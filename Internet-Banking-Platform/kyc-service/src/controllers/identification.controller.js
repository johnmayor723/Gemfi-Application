/**
 * ==========================================================
 * Identification Controller
 * ----------------------------------------------------------
 * Handles customer identification endpoints.
 *
 * Responsibilities:
 *  - Accept HTTP requests
 *  - Call the Identification Service
 *  - Return HTTP responses
 * ==========================================================
 */

const asyncHandler = require("../middleware/asyncHandler");
const identificationService = require("../services/identification.service");

/**
 * ==========================================================
 * Create Identification Record
 *
 * POST /customers/:customerId/identification
 * ==========================================================
 */
exports.create = asyncHandler(async (req, res) => {

    const identification =
        await identificationService.create(

            req.params.customerId,

            req.body

        );

    res.status(201).json({

        success: true,

        message: "Identification record created successfully.",

        data: identification

    });

});

/**
 * ==========================================================
 * Update Identification Record
 *
 * PUT /customers/:customerId/identification
 * ==========================================================
 */
exports.update = asyncHandler(async (req, res) => {

    const identification =
        await identificationService.update(

            req.params.customerId,

            req.body

        );

    res.json({

        success: true,

        message: "Identification record updated successfully.",

        data: identification

    });

});

/**
 * ==========================================================
 * Retrieve Identification Record
 *
 * GET /customers/:customerId/identification
 * ==========================================================
 */
exports.get = asyncHandler(async (req, res) => {

    const identification =
        await identificationService.get(

            req.params.customerId

        );

    res.json({

        success: true,

        data: identification

    });

});