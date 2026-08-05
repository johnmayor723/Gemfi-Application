const express = require("express");

const router = express.Router();

const controller = require("./admin.controller");

const validator = require("./admin.validator");

const validate = require("../../middleware/validation.middleware");

const adminAuth = require("../../middleware/admin-auth.middleware");

const { adminLoginLimiter } = require("../../middleware/rate-limit.middleware");

/**
 * Login
 */
router.post(
    "/admin/auth/login",
    adminLoginLimiter,
    validator.login,
    validate,
    controller.login
);

/**
 * Logout
 */
router.post(
    "/admin/auth/logout",
    adminAuth,
    controller.logout
);

/**
 * Session
 */
router.get(
    "/admin/auth/session",
    adminAuth,
    controller.session
);

module.exports = router;
