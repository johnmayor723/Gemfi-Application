const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");

const { app: config } = require("../../config");

const { authClient } = require("../../integrations/fineract");

const { AuthenticationError } = require("../../errors");

/**
 * ==========================================================
 * Admin Sessions
 * ----------------------------------------------------------
 * Short-lived, in-memory admin sessions gating every
 * onboarding-review action. Single-instance service (pm2 fork
 * mode) so an in-memory store is safe - no cross-process
 * session sharing is needed.
 *
 * A session dies at whichever comes first:
 *  - absoluteTtlMinutes since creation
 *  - inactivityTtlMinutes since the last authenticated request
 * ==========================================================
 */
const sessions = new Map();

const ABSOLUTE_TTL_MS =
    config.adminSession.absoluteTtlMinutes * 60 * 1000;

const INACTIVITY_TTL_MS =
    config.adminSession.inactivityTtlMinutes * 60 * 1000;

class AdminService {

    /**
     * ======================================================
     * Login
     * ----------------------------------------------------------
     * Authenticates against Fineract's own /authentication
     * endpoint - no credentials are trusted or stored locally.
     * ======================================================
     */
    async login(username, password) {

        if (!username || !password) {

            throw new AuthenticationError(
                "Username and password are required."
            );

        }

        const fineractUser =
            await authClient.authenticate(username, password);

        const roles =
            (fineractUser.roles || []).map((role) => role.name);

        const sessionId = crypto.randomUUID();

        const now = Date.now();

        sessions.set(sessionId, {

            username: fineractUser.username,

            staffDisplayName: fineractUser.staffDisplayName,

            roles,

            createdAt: now,

            lastActivityAt: now

        });

        const token = jwt.sign(

            { sessionId, username: fineractUser.username },

            config.adminSession.jwtSecret,

            { expiresIn: `${config.adminSession.absoluteTtlMinutes}m` }

        );

        return {

            token,

            expiresInMinutes: config.adminSession.absoluteTtlMinutes,

            inactivityTimeoutMinutes:
                config.adminSession.inactivityTtlMinutes,

            admin: {

                username: fineractUser.username,

                staffDisplayName: fineractUser.staffDisplayName,

                roles

            }

        };

    }

    /**
     * ======================================================
     * Touch Session
     * ----------------------------------------------------------
     * Validates the session is still alive and slides the
     * inactivity window forward. Returns null if the session
     * is missing or expired.
     * ======================================================
     */
    touchSession(sessionId) {

        const session = sessions.get(sessionId);

        if (!session) {

            return null;

        }

        const now = Date.now();

        if (now - session.createdAt > ABSOLUTE_TTL_MS) {

            sessions.delete(sessionId);

            return null;

        }

        if (now - session.lastActivityAt > INACTIVITY_TTL_MS) {

            sessions.delete(sessionId);

            return null;

        }

        session.lastActivityAt = now;

        return session;

    }

    /**
     * ======================================================
     * Logout
     * ======================================================
     */
    logout(sessionId) {

        sessions.delete(sessionId);

    }

}

const adminService = new AdminService();

/**
 * ======================================================
 * Periodic Sweep
 * ----------------------------------------------------------
 * Evicts stale sessions so the in-memory map never grows
 * unbounded.
 * ======================================================
 */
setInterval(() => {

    const now = Date.now();

    for (const [sessionId, session] of sessions) {

        const expired =
            now - session.createdAt > ABSOLUTE_TTL_MS ||
            now - session.lastActivityAt > INACTIVITY_TTL_MS;

        if (expired) {

            sessions.delete(sessionId);

        }

    }

}, 60 * 1000).unref();

module.exports = adminService;
