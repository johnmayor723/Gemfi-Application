const jwt = require("jsonwebtoken");

const { app: config } = require("../config");

const { AuthenticationError } = require("../errors");

const adminService = require("../modules/admin/admin.service");

/**
 * Gates every admin-facing agent route behind a short-lived
 * admin session token issued by this service's own
 * POST /admin/auth/login, mirroring account-service,
 * kyc-service, onboarding-service, and merchant-service - every
 * admin-gated service in this platform owns a full local admin
 * module (login against Fineract's /authentication endpoint + an
 * in-memory session store with a sliding inactivity timeout).
 * agency-service's only outbound business call is still to
 * account-service (see src/integrations/account/account.client.js) -
 * this Fineract touchpoint exists solely to authenticate admin
 * logins, the same narrow exception every sibling service makes.
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
