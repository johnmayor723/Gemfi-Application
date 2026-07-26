/**
 * ==========================================================
 * Customer KYC Controller
 * ----------------------------------------------------------
 * The customer-facing counterpart to the per-customerId
 * controllers elsewhere in this service - customerId is
 * always resolved from the authenticated JWT, never a URL
 * param, so the Internet Banking UI never needs to know it.
 * ==========================================================
 */

const asyncHandler = require("../middleware/asyncHandler");
const { success } = require("../utils/response");
const customerKycService = require("../services/customerKyc.service");

/**
 * GET /kyc/me
 */
exports.getMe = asyncHandler(async (req, res) => {

    const result =
        await customerKycService.getMe(req.user.clientId);

    return success(res, result, "KYC profile retrieved successfully.");

});

/**
 * POST /kyc/link-bvn
 */
exports.linkBvn = asyncHandler(async (req, res) => {

    await customerKycService.linkBvn(
        req.user.clientId,
        req.body.bvn
    );

    const result =
        await customerKycService.getMe(req.user.clientId);

    return success(res, result, "BVN linked successfully.");

});

/**
 * POST /kyc/link-nin
 */
exports.linkNin = asyncHandler(async (req, res) => {

    await customerKycService.linkNin(
        req.user.clientId,
        req.body.nin
    );

    const result =
        await customerKycService.getMe(req.user.clientId);

    return success(res, result, "NIN linked successfully.");

});
