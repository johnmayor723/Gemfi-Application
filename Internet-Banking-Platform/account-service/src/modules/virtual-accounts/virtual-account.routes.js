const express = require("express");

const controller = require("./virtual-account.controller");

const validate = require("../../middleware/validation.middleware");

const adminAuth = require("../../middleware/admin-auth.middleware");

const internalAuth = require("../../middleware/internal-auth.middleware");

const {
    adminActionLimiter
} = require("../../middleware/rate-limit.middleware");

const {
    createVirtualAccount,
    getVirtualAccount,
    listVirtualAccounts,
    updateVirtualAccountStatus
} = require("./validators");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Admin APIs
|--------------------------------------------------------------------------
| Backend/provisioning operations, not end-user facing - gated by
| the same admin-session auth (see /admin/auth/login) that guards
| the portal-facing account routes in ../accounts/account.routes.js.
*/

/**
 * Provision a virtual account number against an existing
 * settlement Fineract account.
 */
router.post(
    "/virtual-accounts",
    adminAuth,
    adminActionLimiter,
    createVirtualAccount,
    validate,
    controller.createVirtualAccount
);

/**
 * List virtual accounts, optionally filtered by owner.
 */
router.get(
    "/virtual-accounts",
    adminAuth,
    adminActionLimiter,
    listVirtualAccounts,
    validate,
    controller.listVirtualAccounts
);

/**
 * Resolve a single virtual account mapping.
 */
router.get(
    "/virtual-accounts/:virtualAccountNumber",
    adminAuth,
    adminActionLimiter,
    getVirtualAccount,
    validate,
    controller.getVirtualAccount
);

/**
 * Transition a virtual account's status. CLOSED is terminal.
 */
router.patch(
    "/virtual-accounts/:virtualAccountNumber/status",
    adminAuth,
    adminActionLimiter,
    updateVirtualAccountStatus,
    validate,
    controller.updateVirtualAccountStatus
);

/*
|--------------------------------------------------------------------------
| Internal APIs
|--------------------------------------------------------------------------
| Service-to-service operations, gated by the shared internal
| service token (see ../../middleware/internal-auth.middleware.js)
| the same way ../accounts/account.routes.js gates /internal/accounts.
| Meant for sibling services (e.g. merchant-service) provisioning
| and resolving virtual accounts on behalf of entities they own,
| never for a browser or mobile client directly.
*/

/**
 * Provision a virtual account number against an existing
 * settlement Fineract account, on behalf of another service.
 */
router.post(
    "/internal/virtual-accounts",
    internalAuth,
    createVirtualAccount,
    validate,
    controller.createVirtualAccount
);

/**
 * List virtual accounts, optionally filtered by owner.
 */
router.get(
    "/internal/virtual-accounts",
    internalAuth,
    listVirtualAccounts,
    validate,
    controller.listVirtualAccounts
);

/**
 * Resolve a single virtual account mapping.
 */
router.get(
    "/internal/virtual-accounts/:virtualAccountNumber",
    internalAuth,
    getVirtualAccount,
    validate,
    controller.getVirtualAccount
);

module.exports = router;
