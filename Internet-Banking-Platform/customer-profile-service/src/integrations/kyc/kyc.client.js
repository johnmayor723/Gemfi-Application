const axios = require("axios");

const config = require("../../config/app.config");

const {
    ApiError,
    NotFoundError,
    BusinessRuleError
} = require("../../errors");

const client = axios.create({

    baseURL: config.kycService.url,

    timeout: 30000,

    headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
    }

});

/**
 * ------------------------------------------------------
 * Translate KYC Service failures into ApiErrors.
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
            "KYC Service request failed.";

        if (status === 404) {
            throw new NotFoundError(message);
        }

        if (status >= 400 && status < 500) {
            throw new BusinessRuleError(message);
        }

        throw new ApiError({
            statusCode: 502,
            message: "KYC Service returned an unexpected error.",
            errorCode: "SYS-5020"
        });

    }

    throw new ApiError({
        statusCode: 503,
        message: "KYC Service is unavailable.",
        errorCode: "SYS-5030"
    });

};

class KycClient {

    /**
     * ------------------------------------------------------
     * Get KYC Status (includes kycLevel, completion, bvn, nin)
     * ------------------------------------------------------
     */
    async getStatus(customerId) {

        try {

            const { data: response } =
                await client.get(
                    `/api/v1/customers/${customerId}/status`
                );

            return response.data !== undefined
                ? response.data
                : response;

        } catch (error) {

            handleError(error);

        }

    }

}

module.exports = new KycClient();
