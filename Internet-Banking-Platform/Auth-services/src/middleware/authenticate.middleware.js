const jwtService = require("../modules/auth/jwt.service");

const { AuthenticationError } = require("../errors");

const authenticate = (req, res, next) => {
    const token = jwtService.extractToken(req.headers.authorization);

    if (!token) {
        return next(new AuthenticationError("Authentication token is required."));
    }

    try {
        const decoded = jwtService.verify(token);

        if (decoded.type === "refresh") {
            return next(new AuthenticationError("Invalid access token."));
        }

        req.user = {
            userId: decoded.userId,
            accountNumber: decoded.accountNumber,
            clientId: decoded.clientId,
            username: decoded.username
        };

        return next();
    } catch (error) {
        return next(new AuthenticationError("Invalid or expired token."));
    }
};

module.exports = authenticate;
