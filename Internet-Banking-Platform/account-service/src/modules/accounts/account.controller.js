const accountService = require("./account.service");

const { success } = require("../../responses/api.response");

/**
 * Create Account Mapping
 */
const createMapping = async (req, res) => {

    const account =
        await accountService.createMapping(req.body);

    return success(res, {
        message: "Account mapping created successfully.",
        data: account
    });

};

/**
 * Provision Account Number
 *
 * Called directly by gemfi-mfb-portal after Apache Fineract confirms
 * a savings account was created. Responds with the flat
 * { success, accountNumber } contract this integration was
 * specified against, rather than the standard response
 * envelope every other endpoint uses.
 */
const provisionAccount = async (req, res) => {

    const account =
        await accountService.provisionAccount(req.body);

    return res.status(200).json({
        success: true,
        accountNumber: account.accountNumber
    });

};

/**
 * Get Public Mapping By Fineract Account ID
 *
 * Public, PII-free read of the identifiers for a savings
 * account - lets gemfi-mfb-portal display/refresh the Account
 * Number, NUBAN and Fineract account number for a client.
 */
const getPublicMappingByFineractAccountId = async (req, res) => {

    const account =
        await accountService.getByFineractAccountId(
            req.params.fineractAccountId
        );

    return success(res, {
        message: "Account identifiers retrieved successfully.",
        data: {

            accountNumber:
                account.accountNumber,

            nuban:
                account.nuban,

            fineractAccountNumber:
                account.fineractAccountNumber,

            fineractAccountId:
                account.fineractAccountId

        }
    });

};

/**
 * Validate Account Ownership
 */
const validateAccount = async (req, res) => {

    const result =
        await accountService.validateOwnership(req.body);

    return success(res, {
        message: "Account validation completed.",
        data: result
    });

};

/**
 * Name Enquiry
 */
const nameEnquiry = async (req, res) => {

    const result =
        await accountService.nameEnquiry(
            req.params.accountNumber
        );

    return success(res, {
        message: "Name enquiry successful.",
        data: result
    });

};

/**
 * Get By Account Number
 */
const getByAccountNumber = async (req, res) => {

    const account =
        await accountService.getByAccountNumber(
            req.params.accountNumber
        );

    return success(res, {
        message: "Account retrieved successfully.",
        data: account
    });

};

/**
 * Get Balance By Account Number
 *
 * Internal-only live Fineract balance lookup - for callers
 * (e.g. ussd-service) that have no customer JWT to use against
 * GET /accounts/me.
 */
const getBalanceByAccountNumber = async (req, res) => {

    const balance =
        await accountService.getBalanceByAccountNumber(
            req.params.accountNumber
        );

    return success(res, {
        message: "Balance retrieved successfully.",
        data: balance
    });

};

/**
 * Get My Accounts
 *
 * Canonical customer-facing account endpoint - every account
 * owned by the authenticated customer, enriched with live
 * balance/status from Fineract.
 */
const getMyAccounts = async (req, res) => {

    const accounts =
        await accountService.getMyAccounts(
            req.user.clientId
        );

    return success(res, {
        message: "Accounts retrieved successfully.",
        data: accounts
    });

};

/**
 * Get By Client ID
 */
const getByClientId = async (req, res) => {

    const accounts =
        await accountService.getByClientId(
            req.params.clientId
        );

    return success(res, {
        message: "Accounts retrieved successfully.",
        data: accounts
    });

};

/**
 * Get By Fineract Account ID
 */
const getByFineractAccountId = async (req, res) => {

    const account =
        await accountService.getByFineractAccountId(
            req.params.fineractAccountId
        );

    return success(res, {
        message: "Account retrieved successfully.",
        data: account
    });

};
/**
 * Get By Phone Number
 */
const getByPhoneNumber = async (req, res) => {

    const account =
        await accountService.getByPhoneNumber(
            req.params.phoneNumber
        );

    return success(res, {
        message: "Account retrieved successfully.",
        data: account
    });

};

/**
 * Get By NUBAN
 */
const getByNuban = async (req, res) => {

    const account =
        await accountService.getByNuban(
            req.params.nuban
        );

    return success(res, {
        message: "Account retrieved successfully.",
        data: account
    });

};

/**
 * Synchronize account from Fineract.
 */
const syncAccount = async (req, res) => {

    const account =
        await accountService.syncAccount(
            req.body.fineractAccountId
        );

    return success(res, {
        message: "Account synchronized successfully.",
        data: account
    });

};

module.exports = {

    createMapping,

    provisionAccount,

    getPublicMappingByFineractAccountId,

    validateAccount,

    nameEnquiry,

    getMyAccounts,

    getByAccountNumber,

    getBalanceByAccountNumber,

    getByClientId,

    getByFineractAccountId,

    getByPhoneNumber,

    getByNuban,

    syncAccount

};
