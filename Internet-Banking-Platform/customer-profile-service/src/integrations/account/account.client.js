const axios = require("axios");

const config = require("../../config/app.config");

const {
    ApiError,
    NotFoundError,
    BusinessRuleError
} = require("../../errors");

const client = axios.create({

    baseURL: config.accountService.url,

    timeout: 30000,

    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-internal-token": config.internalServiceToken
    }

});

/**
 * ------------------------------------------------------
 * Translate Account Service failures into ApiErrors.
 * ------------------------------------------------------
 */
const handleError = (error) => {

    if (error.response) {

        const {
            status,
            data
        } = error.response;

        const message =
            (data && data.message) ||
            "Account Service request failed.";

        if (status === 404) {
            throw new NotFoundError(message);
        }

        if (status >= 400 && status < 500) {
            throw new BusinessRuleError(message);
        }

        throw new ApiError({
            statusCode: 502,
            message: "Account Service returned an unexpected error.",
            errorCode: "SYS-5020"
        });

    }

    throw new ApiError({
        statusCode: 503,
        message: "Account Service is unavailable.",
        errorCode: "SYS-5030"
    });

};

class AccountClient {

    /**
     * ------------------------------------------------------
     * Get Savings Accounts For A Client
     * ------------------------------------------------------
     */
    async getAccounts(clientId) {

        try {

            const { data: response } =
                await client.get(
                    `/internal/accounts/client/${clientId}`
                );

            return response.data;

        } catch (error) {

            handleError(error);

        }

    }

    /**
     * ------------------------------------------------------
     * Get Fineract Client Demographic Info
     * ------------------------------------------------------
     */
    async getClient(clientId) {

        try {

            const { data: response } =
                await client.get(
                    `/internal/customer/${clientId}`
                );

            return response.data;

        } catch (error) {

            handleError(error);

        }

    }

    /**
     * ------------------------------------------------------
     * Get Loan Accounts For A Client
     * ------------------------------------------------------
     */
    async getLoans(clientId) {

        try {

            const { data: response } =
                await client.get(
                    `/internal/customer/${clientId}/loans`
                );

            return response.data;

        } catch (error) {

            handleError(error);

        }

    }

    /**
     * ------------------------------------------------------
     * Get Transactions For A Savings Account
     * ------------------------------------------------------
     */
    async getTransactions(accountId, { page = 1, limit = 20 } = {}) {

        try {

            const { data: response } =
                await client.get(
                    `/internal/customer/accounts/${accountId}/transactions`,
                    {
                        params: {
                            page,
                            limit
                        }
                    }
                );

            return response.data;

        } catch (error) {

            handleError(error);

        }

    }

}

module.exports = new AccountClient();
