/**
 * ==========================================================
 * Admin Session Service
 * ----------------------------------------------------------
 * Short-lived, in-memory admin sessions. Single-instance
 * service (pm2 fork mode) so an in-memory store is safe -
 * no cross-process session sharing is needed.
 *
 * A session dies at whichever comes first:
 *  - absoluteTtlMinutes since creation
 *  - inactivityTtlMinutes since the last authenticated request
 * ==========================================================
 */

const crypto = require("node:crypto");

const env = require("../config/env");

const ABSOLUTE_TTL_MS =
    env.adminSession.absoluteTtlMinutes * 60 * 1000;

const INACTIVITY_TTL_MS =
    env.adminSession.inactivityTtlMinutes * 60 * 1000;

const sessions = new Map();

/**
 * ==========================================================
 * Create Session
 * ==========================================================
 */
exports.createSession = (admin) => {

    const sessionId = crypto.randomUUID();

    const now = Date.now();

    sessions.set(sessionId, {

        username: admin.username,

        staffDisplayName: admin.staffDisplayName,

        roles: admin.roles,

        createdAt: now,

        lastActivityAt: now

    });

    return sessionId;

};

/**
 * ==========================================================
 * Touch Session
 * ----------------------------------------------------------
 * Validates the session is still alive and slides the
 * inactivity window forward. Returns null if the session is
 * missing or expired.
 * ==========================================================
 */
exports.touchSession = (sessionId) => {

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

};

/**
 * ==========================================================
 * Destroy Session
 * ==========================================================
 */
exports.destroySession = (sessionId) => {

    sessions.delete(sessionId);

};

/**
 * ==========================================================
 * Periodic Sweep
 * ----------------------------------------------------------
 * Evicts stale sessions so the in-memory map never grows
 * unbounded.
 * ==========================================================
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
