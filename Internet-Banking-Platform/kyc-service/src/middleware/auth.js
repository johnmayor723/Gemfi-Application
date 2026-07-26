const jwt = require("jsonwebtoken");

const env = require("../config/env");

const ApiError = require("../utils/ApiError");

/**
 * Gates the customer-facing /kyc/me, /kyc/link-bvn, and
 * /kyc/link-nin routes with the same Bearer JWT every other
 * service verifies (issued by Auth Service, shared JWT_SECRET).
 *
 * Every other route in this service remains unauthenticated -
 * this middleware is scoped only to the new customer-facing
 * endpoints, not a platform-wide auth rollout.
 */
module.exports = (req, res, next) => {

    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {

        return next(
            new ApiError(401, "Authentication token is required.")
        );

    }

    const token = header.slice(7);

    try {

        const decoded = jwt.verify(token, env.jwtSecret);

        req.user = {

            userId: decoded.userId,

            accountNumber: decoded.accountNumber,

            clientId: decoded.clientId,

            username: decoded.username

        };

        return next();

    } catch (error) {

        return next(
            new ApiError(401, "Invalid or expired token.")
        );

    }

};
