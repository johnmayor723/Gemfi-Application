const virtualAccountService = require("./virtual-account.service");

const { success } = require("../../responses/api.response");

/**
 * Create Virtual Account
 */
const createVirtualAccount = async (req, res) => {

    const mapping =
        await virtualAccountService.createVirtualAccount(
            req.body
        );

    return success(res, {
        message: "Virtual account created successfully.",
        data: mapping
    });

};

/**
 * Get Virtual Account By Virtual Account Number
 */
const getVirtualAccount = async (req, res) => {

    const mapping =
        await virtualAccountService.getByVirtualAccountNumber(
            req.params.virtualAccountNumber
        );

    return success(res, {
        message: "Virtual account retrieved successfully.",
        data: mapping
    });

};

/**
 * List Virtual Accounts (filterable by owner)
 */
const listVirtualAccounts = async (req, res) => {

    const mappings =
        await virtualAccountService.listByOwner(req.query);

    return success(res, {
        message: "Virtual accounts retrieved successfully.",
        data: mappings
    });

};

/**
 * Update Virtual Account Status
 */
const updateVirtualAccountStatus = async (req, res) => {

    const mapping =
        await virtualAccountService.updateStatus(
            req.params.virtualAccountNumber,
            req.body.status
        );

    return success(res, {
        message: "Virtual account status updated successfully.",
        data: mapping
    });

};

module.exports = {

    createVirtualAccount,

    getVirtualAccount,

    listVirtualAccounts,

    updateVirtualAccountStatus

};
