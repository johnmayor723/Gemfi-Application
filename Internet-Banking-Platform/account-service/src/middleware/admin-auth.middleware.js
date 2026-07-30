const jwt = require("jsonwebtoken");

const { app: config } = require("../config");

const { AuthenticationError } = require("../errors");

const adminService = require("../modules/admin/admin.service");

/**
 * Gates the two portal-facing account routes (provision,
 * Fineract-id lookup) behind a short-lived admin session
 * token issued by POST /admin/auth/login. Distinct from
 * authenticate.middleware.js, which verifies a customer's
 * Bearer JWT issued by Auth Service.
 */
const adminAuth = (req, res, next) => {

    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {

        return next(
            new AuthenticationError(
                "Admin authentication token is required."
            )
        );

    }

    const token = header.slice(7);

    let decoded;

    try {

        decoded =
            jwt.verify(token, config.adminSession.jwtSecret);

    } catch {

        return next(
            new AuthenticationError(
                "Invalid or expired admin session."
            )
        );

    }

    const session =
        adminService.touchSession(decoded.sessionId);

    if (!session) {

        return next(
            new AuthenticationError(
                "Admin session expired due to inactivity. Please log in again."
            )
        );

    }

    req.admin = {

        sessionId: decoded.sessionId,

        username: session.username,

        staffDisplayName: session.staffDisplayName,

        roles: session.roles

    };

    return next();

};

module.exports = adminAuth;
