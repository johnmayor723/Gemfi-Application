const asyncHandler =
require("../middleware/asyncHandler");

const { success } =
require("../utils/response");

const kycService =
require("../services/kyc.service");

const aggregateService =
require("../repositories/kycAggregate.service");

exports.create = asyncHandler(async (req, res) => {

    const profile =
        await kycService.create(
            req.params.customerId,
            req.body
        );

    return success(
        res,
        profile,
        "KYC profile created",
        201
    );

});

exports.get = asyncHandler(async (req, res) => {

    const profile =
        await aggregateService.build(
            req.params.customerId
        );

    return success(
        res,
        profile
    );

});

exports.update = asyncHandler(async (req, res) => {

    const profile =
        await kycService.update(
            req.params.customerId,
            req.body
        );

    return success(
        res,
        profile,
        "KYC profile updated"
    );

});

exports.approve = asyncHandler(async (req, res) => {

    const profile =
        await kycService.approve(
            req.params.customerId,
            req.admin
        );

    return success(
        res,
        profile,
        "KYC profile approved"
    );

});

exports.reject = asyncHandler(async (req, res) => {

    const profile =
        await kycService.reject(
            req.params.customerId,
            req.admin,
            req.body?.reason
        );

    return success(
        res,
        profile,
        "KYC profile rejected"
    );

});