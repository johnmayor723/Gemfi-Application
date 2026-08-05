const axios = require("axios");

const config = require("../../config/app.config");

const {
    ApiError,
    NotFoundError,
    BusinessRuleError
} = require("../../errors");

const client = axios.create({

    baseURL: config.statementService.url,

    timeout: 30000,

    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-internal-token": config.internalServiceToken
    }

});

const handleError = (error) => {

    if (error.response) {

        const {
            status,
            data
        } = error.response;

        const message =
            (data && data.message) ||
            "Statement Service request failed.";

        if (status === 404) {
            throw new NotFoundError(message);
        }

        if (status >= 400 && status < 500) {
            throw new BusinessRuleError(message);
        }

        throw new ApiError({
            statusCode: 502,
            message: "Statement Service returned an unexpected error.",
            errorCode: "SYS-5020"
        });

    }

    throw new ApiError({
        statusCode: 503,
        message: "Statement Service is unavailable.",
        errorCode: "SYS-5030"
    });

};

class StatementClient {

    /**
     * Mini-statement for the USSD menu - defaults to
     * statement-service's own short `limit` (10) for an internal
     * caller, see statement-service's generateForInternalCaller().
     */
    async getMiniStatement(accountNumber, { limit } = {}) {

        try {

            const { data: response } =
                await client.get(
                    "/internal/statements",
                    {
                        params: {
                            accountNumber,
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

module.exports = new StatementClient();
