const axios = require("axios");

const config = require("../../config/app.config");

const {
    ApiError,
    NotFoundError,
    BusinessRuleError
} = require("../../errors");

/**
 * The only outbound HTTP dependency this service has. An agent's
 * float virtual account lives in account-service, not here -
 * agency-service never talks to Fineract directly, following the
 * same internal-service-call pattern already used by
 * merchant-service/beneficiary-service/transaction-service/
 * customer-profile-service/statement-service's own
 * account.client.js files (axios instance with an internal
 * shared-secret header, error translation into this service's own
 * ApiError subclasses).
 */
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
     * Create Virtual Account
     * ------------------------------------------------------
     * Provisions an agent's float virtual account via
     * account-service's internal, service-to-service API (see
     * account-service/src/modules/virtual-accounts/virtual-account.routes.js
     * POST /internal/virtual-accounts).
     */
    async createVirtualAccount(payload, { correlationId } = {}) {

        try {

            const { data: response } =
                await client.post(
                    "/internal/virtual-accounts",
                    payload,
                    {
                        headers: correlationId
                            ? { "X-Correlation-Id": correlationId }
                            : {}
                    }
                );

            return response.data;

        } catch (error) {

            handleError(error);

        }

    }

}

module.exports = new AccountClient();
