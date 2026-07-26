/**
 * ==========================================================
 * NIN Controller
 * ----------------------------------------------------------
 * Handles customer NIN endpoints.
 * ==========================================================
 */

const asyncHandler = require("../middleware/asyncHandler");
const ninService = require("../services/nin.service");

exports.verify = asyncHandler(async (req, res) => {

    const result = await ninService.verify(
        req.params.customerId,
        req.body.nin
    );

    res.json({
        success: true,
        message: "NIN verified successfully.",
        data: result
    });

});

exports.get = asyncHandler(async (req, res) => {

    const result =
        await ninService.get(
            req.params.customerId
        );

    res.json({
        success: true,
        data: result
    });

});