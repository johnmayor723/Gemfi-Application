const jwt = require("jsonwebtoken");

const env = require("../config/env");
const ApiError = require("../utils/ApiError");
const adminSessionService = require("../services/adminSession.service");

/**
 * Gates every admin-facing KYC route (customer photo, signature,
 * documents, bvn, nin, identification, address, next-of-kin,
 * references, audit) behind a short-lived admin session token
 * issued by POST /admin/auth/login. Distinct from the
 * customer-facing middleware in auth.js, which verifies a
 * different token issued by the Auth Service.
 */
module.exports = (req, res, next) => {

    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {

        return next(
            new ApiError(401, "Admin authentication token is required.")
        );

    }

    const token = header.slice(7);

    let decoded;

    try {

        decoded = jwt.verify(token, env.adminSession.jwtSecret);

    } catch {

        return next(
            new ApiError(401, "Invalid or expired admin session.")
        );

    }

    const session = adminSessionService.touchSession(decoded.sessionId);

    if (!session) {

        return next(
            new ApiError(
                401,
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
