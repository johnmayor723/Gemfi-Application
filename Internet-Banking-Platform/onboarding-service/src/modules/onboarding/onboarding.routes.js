const express = require("express");

const router = express.Router();

const controller = require("./onboarding.controller");

const validator = require("./onboarding.validator");

const validate = require("../../middleware/validation.middleware");

const adminAuth = require("../../middleware/admin-auth.middleware");

const upload = require("../../config/multer");

const {
    publicOnboardingLimiter
} = require("../../middleware/rate-limit.middleware");

/*
|--------------------------------------------------------------------------
| Public APIs
|--------------------------------------------------------------------------
*/

/**
 * Client submits a new onboarding request. No invite gate -
 * rate limiting is the real defense here.
 */
router.post(
    "/onboarding/requests",
    publicOnboardingLimiter,
    upload.single("logo"),
    validator.submit,
    validate,
    controller.submit
);

/**
 * Client checks their own submission by id.
 */
router.get(
    "/onboarding/requests/:id/status",
    publicOnboardingLimiter,
    validator.getPublicStatus,
    validate,
    controller.getPublicStatus
);

/**
 * Serves a tenant's uploaded logo file. Public - the logo
 * itself carries no sensitive data.
 */
router.get(
    "/onboarding/requests/:id/logo",
    controller.getLogo
);

/**
 * Live branding for an active tenant. Called by the portal
 * and connect apps at boot. 404s for anything not active, so
 * this can't be used to enumerate the pending queue.
 */
router.get(
    "/branding/:subdomain",
    validator.getBranding,
    validate,
    controller.getBranding
);

/*
|--------------------------------------------------------------------------
| Admin APIs
|--------------------------------------------------------------------------
*/

/**
 * List / filter the onboarding queue.
 */
router.get(
    "/admin/onboarding/requests",
    adminAuth,
    controller.list
);

/**
 * Blank-start a tenant with no client submission (phone/email
 * onboarding case).
 */
router.post(
    "/admin/onboarding/requests",
    adminAuth,
    upload.single("logo"),
    validator.submit,
    validate,
    controller.adminCreate
);

/**
 * Full detail for one request.
 */
router.get(
    "/admin/onboarding/requests/:id",
    adminAuth,
    validator.getById,
    validate,
    controller.getById
);

/**
 * Edit/extend a pending request before approval.
 */
router.patch(
    "/admin/onboarding/requests/:id",
    adminAuth,
    validator.update,
    validate,
    controller.update
);

/**
 * Reject a pending request.
 */
router.post(
    "/admin/onboarding/requests/:id/reject",
    adminAuth,
    validator.reject,
    validate,
    controller.reject
);

module.exports = router;
