/**
 * ==========================================================
 * Admin Auth Controller
 * ----------------------------------------------------------
 * Handles HTTP requests for admin session login/logout.
 *
 * Responsibilities:
 *  - Authenticate an admin against real Fineract credentials
 *  - Issue a short-lived admin session token
 *  - Invalidate an admin session on logout
 * ==========================================================
 */

const jwt = require("jsonwebtoken");

const asyncHandler = require("../middleware/asyncHandler");
const ApiError = require("../utils/ApiError");
const env = require("../config/env");
const fineractAuthService = require("../services/fineractAuth.service");
const adminSessionService = require("../services/adminSession.service");

/**
 * ==========================================================
 * Login
 *
 * POST /admin/auth/login
 * ==========================================================
 */
exports.login = asyncHandler(async (req, res) => {

    const { username, password } = req.body;

    if (!username || !password) {

        throw new ApiError(
            400,
            "Username and password are required."
        );

    }

    let fineractUser;

    try {

        fineractUser =
            await fineractAuthService.authenticateWithFineract(
                username,
                password
            );

    } catch (error) {

        throw new ApiError(
            401,
            error.message || "Invalid Fineract credentials."
        );

    }

    const roles =
        (fineractUser.roles || []).map((role) => role.name);

    const sessionId = adminSessionService.createSession({

        username: fineractUser.username,

        staffDisplayName: fineractUser.staffDisplayName,

        roles

    });

    const token = jwt.sign(

        { sessionId, username: fineractUser.username },

        env.adminSession.jwtSecret,

        { expiresIn: `${env.adminSession.absoluteTtlMinutes}m` }

    );

    res.status(200).json({

        success: true,

        message: "Admin authenticated successfully.",

        data: {

            token,

            expiresInMinutes: env.adminSession.absoluteTtlMinutes,

            inactivityTimeoutMinutes:
                env.adminSession.inactivityTtlMinutes,

            admin: {

                username: fineractUser.username,

                staffDisplayName: fineractUser.staffDisplayName,

                roles

            }

        },

        meta: {

            timestamp: new Date().toISOString()

        }

    });

});

/**
 * ==========================================================
 * Logout
 *
 * POST /admin/auth/logout
 * ==========================================================
 */
exports.logout = asyncHandler(async (req, res) => {

    adminSessionService.destroySession(req.admin.sessionId);

    res.status(200).json({

        success: true,

        message: "Admin session ended.",

        data: {},

        meta: {

            timestamp: new Date().toISOString()

        }

    });

});

/**
 * ==========================================================
 * Session
 *
 * GET /admin/auth/session
 * ==========================================================
 */
exports.session = asyncHandler(async (req, res) => {

    res.status(200).json({

        success: true,

        message: "Session is active.",

        data: {

            admin: req.admin

        },

        meta: {

            timestamp: new Date().toISOString()

        }

    });

});
