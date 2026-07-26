const jwt = require("jsonwebtoken");

const config = require("../config/app.config");

const { AuthenticationError } = require("../errors");

/**
 * Gates customer-facing routes with the same Bearer JWT every
 * other service verifies (issued by Auth Service, shared JWT_SECRET,
 * stateless - no call back to Auth Service needed).
 */
const authenticate = (req, res, next) => {

    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {

        return next(
            new AuthenticationError(
                "Authentication token is required."
            )
        );

    }

    const token = header.slice(7);

    try {

        const decoded = jwt.verify(token, config.jwt.secret);

        req.user = {

            userId: decoded.userId,

            accountNumber: decoded.accountNumber,

            clientId: decoded.clientId,

            username: decoded.username

        };

        return next();

    } catch (error) {

        return next(
            new AuthenticationError(
                "Invalid or expired token."
            )
        );

    }

};

module.exports = authenticate;
