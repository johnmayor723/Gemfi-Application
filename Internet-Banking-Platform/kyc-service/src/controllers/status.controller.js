/**
 * ==========================================================
 * Status Controller
 * ----------------------------------------------------------
 * Handles KYC status endpoints.
 * ==========================================================
 */

const asyncHandler = require("../middleware/asyncHandler");
const statusService = require("../services/status.service");

/**
 * ==========================================================
 * Get Customer KYC Status
 *
 * GET /customers/:customerId/status
 * ==========================================================
 */
exports.get = asyncHandler(async (req, res) => {

    const result = await statusService.getStatus(
        req.params.customerId
    );

    res.json({

        success: true,

        data: result

    });

});