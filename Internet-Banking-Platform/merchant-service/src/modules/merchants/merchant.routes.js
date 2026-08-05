const express = require("express");

const controller = require("./merchant.controller");

const validate = require("../../middleware/validation.middleware");

const adminAuth = require("../../middleware/admin-auth.middleware");

const {
    adminActionLimiter
} = require("../../middleware/rate-limit.middleware");

const {
    createMerchant,
    listMerchants,
    getMerchant,
    approveMerchant,
    rejectMerchant,
    updateMerchantStatus,
    updateFeeSchedule
} = require("./validators");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Admin APIs
|--------------------------------------------------------------------------
| Every merchant route is a backend/ops operation, not end-user
| facing - there is no merchant self-service portal yet. Gated by
| the same kind of admin-session auth account-service's portal-
| facing routes use (see ../../middleware/admin-auth.middleware.js
| for why this service verifies rather than issues those tokens).
*/

/**
 * Create a merchant application (status PENDING).
 */
router.post(
    "/merchants",
    adminAuth,
    adminActionLimiter,
    createMerchant,
    validate,
    controller.createMerchant
);

/**
 * List merchants, optionally filtered by status and
 * merchantCategory.
 */
router.get(
    "/merchants",
    adminAuth,
    adminActionLimiter,
    listMerchants,
    validate,
    controller.listMerchants
);

/**
 * Get a single merchant.
 */
router.get(
    "/merchants/:id",
    adminAuth,
    adminActionLimiter,
    getMerchant,
    validate,
    controller.getMerchant
);

/**
 * Approve a pending merchant application - provisions its
 * settlement virtual account via account-service and activates it.
 */
router.patch(
    "/merchants/:id/approve",
    adminAuth,
    adminActionLimiter,
    approveMerchant,
    validate,
    controller.approveMerchant
);

/**
 * Reject a pending merchant application. Terminal.
 */
router.patch(
    "/merchants/:id/reject",
    adminAuth,
    adminActionLimiter,
    rejectMerchant,
    validate,
    controller.rejectMerchant
);

/**
 * Transition an onboarded merchant's status. CLOSED is terminal.
 */
router.patch(
    "/merchants/:id/status",
    adminAuth,
    adminActionLimiter,
    updateMerchantStatus,
    validate,
    controller.updateMerchantStatus
);

/**
 * Update an onboarded merchant's fee schedule.
 */
router.patch(
    "/merchants/:id/fee-schedule",
    adminAuth,
    adminActionLimiter,
    updateFeeSchedule,
    validate,
    controller.updateFeeSchedule
);

module.exports = router;
