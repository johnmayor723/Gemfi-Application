/**
 * ==========================================================
 * Admin Auth Routes
 * ==========================================================
 */

const express = require("express");

const router = express.Router();

const adminAuthController =
require("../controllers/adminAuth.controller");

const adminAuth = require("../middleware/adminAuth");

/**
 * ==========================================================
 * Login
 * ==========================================================
 */
router.post(

    "/admin/auth/login",

    adminAuthController.login

);

/**
 * ==========================================================
 * Logout
 * ==========================================================
 */
router.post(

    "/admin/auth/logout",

    adminAuth,

    adminAuthController.logout

);

/**
 * ==========================================================
 * Session Status
 * ==========================================================
 */
router.get(

    "/admin/auth/session",

    adminAuth,

    adminAuthController.session

);

module.exports = router;
