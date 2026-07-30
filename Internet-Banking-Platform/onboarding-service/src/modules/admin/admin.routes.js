const express = require("express");

const router = express.Router();

const controller = require("./admin.controller");

const validator = require("./admin.validator");

const validate = require("../../middleware/validation.middleware");

const adminAuth = require("../../middleware/admin-auth.middleware");

const { adminLoginLimiter } = require("../../middleware/rate-limit.middleware");

/**
 * Every admin-facing route in this service lives under
 * /admin/onboarding - account-service already owns the bare
 * /admin prefix on the shared nginx gateway, so this stays a
 * strictly longer, non-colliding prefix rather than fighting
 * nginx location-priority matching.
 */

/**
 * Login
 */
router.post(
    "/admin/onboarding/auth/login",
    adminLoginLimiter,
    validator.login,
    validate,
    controller.login
);

/**
 * Logout
 */
router.post(
    "/admin/onboarding/auth/logout",
    adminAuth,
    controller.logout
);

/**
 * Session
 */
router.get(
    "/admin/onboarding/auth/session",
    adminAuth,
    controller.session
);

module.exports = router;
