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
 * Translate Account Service failures into ApiErrors -
 * same mapping transaction-service's client uses.
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
     * Resolve the account mapping for the phone number a USSD
     * session is dialing in from. Returns null (not a thrown
     * NotFoundError) when there's no match, since "unrecognized
     * number" is an expected, common case for the session state
     * machine to branch on - not an error condition.
     */
    async getByPhoneNumber(phoneNumber) {

        try {

            const { data: response } =
                await client.get(
                    `/internal/accounts/phone/${phoneNumber}`
                );

            return response.data;

        } catch (error) {

            if (error.response && error.response.status === 404) {

                return null;

            }

            handleError(error);

        }

    }

    /**
     * Live Fineract balance for an account - see account-service's
     * getBalanceByAccountNumber, added specifically for this
     * service (no customer JWT to use against GET /accounts/me).
     */
    async getBalance(accountNumber) {

        try {

            const { data: response } =
                await client.get(
                    `/internal/accounts/${accountNumber}/balance`
                );

            return response.data;

        } catch (error) {

            handleError(error);

        }

    }

}

module.exports = new AccountClient();
