const merchantService = require("./merchant.service");

const { success, created } = require("../../responses/api.response");

/**
 * Create Merchant Application
 */
const createMerchant = async (req, res) => {

    const merchant =
        await merchantService.createApplication(req.body);

    return created(res, {
        message: "Merchant application created successfully.",
        data: merchant
    });

};

/**
 * List Merchants (filterable by status and merchantCategory)
 */
const listMerchants = async (req, res) => {

    const merchants =
        await merchantService.listMerchants(req.query);

    return success(res, {
        message: "Merchants retrieved successfully.",
        data: merchants
    });

};

/**
 * Get Merchant By ID
 */
const getMerchant = async (req, res) => {

    const merchant =
        await merchantService.getMerchantById(req.params.id);

    return success(res, {
        message: "Merchant retrieved successfully.",
        data: merchant
    });

};

/**
 * Approve Merchant
 */
const approveMerchant = async (req, res) => {

    const merchant =
        await merchantService.approveMerchant(
            req.params.id,
            req.body,
            req.admin
        );

    return success(res, {
        message: "Merchant approved successfully.",
        data: merchant
    });

};

/**
 * Reject Merchant
 */
const rejectMerchant = async (req, res) => {

    const merchant =
        await merchantService.rejectMerchant(
            req.params.id,
            req.body,
            req.admin
        );

    return success(res, {
        message: "Merchant rejected successfully.",
        data: merchant
    });

};

/**
 * Update Merchant Status
 */
const updateMerchantStatus = async (req, res) => {

    const merchant =
        await merchantService.updateStatus(
            req.params.id,
            req.body.status
        );

    return success(res, {
        message: "Merchant status updated successfully.",
        data: merchant
    });

};

/**
 * Update Merchant Fee Schedule
 */
const updateFeeSchedule = async (req, res) => {

    const merchant =
        await merchantService.updateFeeSchedule(
            req.params.id,
            req.body.feeSchedule
        );

    return success(res, {
        message: "Merchant fee schedule updated successfully.",
        data: merchant
    });

};

module.exports = {

    createMerchant,

    listMerchants,

    getMerchant,

    approveMerchant,

    rejectMerchant,

    updateMerchantStatus,

    updateFeeSchedule

};
