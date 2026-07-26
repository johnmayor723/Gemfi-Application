const crypto = require("crypto");

const config = require("../config/app.config");

const { AuthenticationError } = require("../errors");

/**
 * Gates /internal/* routes with a shared service-to-service token.
 * These endpoints expose account mapping, customer demographics,
 * loans, and transaction history — they're meant to be called only
 * by other platform services, never a browser or mobile client
 * directly.
 */
const internalAuth = (req, res, next) => {

    const token = req.headers["x-internal-token"];

    const expected = config.internalServiceToken;

    if (
        !token ||
        token.length !== expected.length ||
        !crypto.timingSafeEqual(
            Buffer.from(token),
            Buffer.from(expected)
        )
    ) {

        return next(
            new AuthenticationError(
                "Invalid or missing internal service token."
            )
        );

    }

    return next();

};

module.exports = internalAuth;
