const service = require("./customer.service");

const { success } = require("../../responses/api.response");

/**
 * Get Client
 */
const getClient = async (req, res) => {

    const customer =
        await service.getClient(req.params.clientId);

    return success(res, {
        message: "Client retrieved successfully.",
        data: customer
    });

};

/**
 * Get Loan Accounts
 */
const getLoans = async (req, res) => {

    const loans =
        await service.getLoans(req.params.clientId);

    return success(res, {
        message: "Loan accounts retrieved successfully.",
        data: loans
    });

};

/**
 * Get Transactions
 */
const getTransactions = async (req, res) => {

    const {
        page,
        limit,
        startDate,
        endDate
    } = req.query;

    const transactions =
        await service.getTransactions(
            req.params.accountId,
            {
                page: page ? Number(page) : undefined,
                limit: limit ? Number(limit) : undefined,
                startDate,
                endDate
            }
        );

    return success(res, {
        message: "Transactions retrieved successfully.",
        data: transactions
    });

};

module.exports = {

    getClient,

    getLoans,

    getTransactions

};
