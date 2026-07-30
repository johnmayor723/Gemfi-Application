const ApiError = require("../api.error");

class TooManyRequestsError extends ApiError {
    constructor(
        message = "Too many requests. Please try again later."
    ) {
        super({
            statusCode: 429,
            message,
            errorCode: "SYS-4290"
        });
    }
}

module.exports = TooManyRequestsError;
