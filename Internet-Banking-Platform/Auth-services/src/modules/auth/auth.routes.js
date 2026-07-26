const express =
    require("express");

const router =
    express.Router();

const controller =
    require("./auth.controller");

const validators =
    require("./validators");

const enrollmentValidator =
    require("../enrollment/enrollment.validator");

const validate =
    require("../../middleware/validation.middleware");

const authenticate =
    require("../../middleware/authenticate.middleware");

/**
 * ==========================================================
 * Register
 * ==========================================================
 */

router.post(

    "/register",

    enrollmentValidator.complete,

    validate,

    controller.register

);

/**
 * ==========================================================
 * Login
 * ==========================================================
 */

router.post(

    "/login",

    validators.login,

    validate,

    controller.login

);

/**
 * ==========================================================
 * Refresh Token
 * ==========================================================
 */

router.post(

    "/refresh-token",

    validators.token,

    validate,

    controller.refreshToken

);

/**
 * ==========================================================
 * Logout Current Device
 * ==========================================================
 */

router.post(

    "/logout",

    validators.token,

    validate,

    controller.logout

);

/**
 * ==========================================================
 * Logout Everywhere
 * ==========================================================
 */

router.post(

    "/logout-all",

    authenticate,

    controller.logoutAll

);

/**
 * ==========================================================
 * Active Sessions
 * ==========================================================
 */

router.get(

    "/sessions",

    authenticate,

    controller.getSessions

);

/**
 * ==========================================================
 * Forgot Password
 * ==========================================================
 */

router.post(

    "/forgot-password",

    validators.forgotPassword,

    validate,

    controller.forgotPassword

);

/**
 * ==========================================================
 * Reset Password
 * ==========================================================
 */

router.post(

    "/reset-password",

    validators.resetPassword,

    validate,

    controller.resetPassword

);

/**
 * ==========================================================
 * Change Password
 * ==========================================================
 */

router.post(

    "/change-password",

    authenticate,

    validators.changePassword,

    validate,

    controller.changePassword

);

module.exports =
    router;
