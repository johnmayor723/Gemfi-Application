const express = require("express");

const controller = require("./account.controller");

const validate = require("../../middleware/validation.middleware");

const internalAuth = require("../../middleware/internal-auth.middleware");

const authenticate = require("../../middleware/authenticate.middleware");

const {
    createMapping,
    validateAccount,
    nameEnquiry,
    syncAccount,
    registerAccount
} = require("./validators");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Public APIs
|--------------------------------------------------------------------------
*/

/**
 * Provision an Account Number for a savings account just
 * created in Fineract. Called directly by gemfi-mfb-portal.
 */
router.post(
    "/accounts",
    registerAccount,
    validate,
    controller.provisionAccount
);

/**
 * Read back the Account Number / NUBAN / Fineract account
 * number for a savings account. Called directly by gemfi-mfb-portal.
 */
router.get(
    "/accounts/fineract/:fineractAccountId",
    controller.getPublicMappingByFineractAccountId
);

/**
 * Validate ownership during Internet Banking registration.
 */
router.post(
    "/accounts/validate",
    validateAccount,
    validate,
    controller.validateAccount
);

/**
 * Name enquiry.
 */
router.get(
    "/accounts/name-enquiry/:accountNumber",
    nameEnquiry,
    validate,
    controller.nameEnquiry
);

/*
|--------------------------------------------------------------------------
| Customer APIs (Bearer JWT - the authenticated Internet Banking user)
|--------------------------------------------------------------------------
*/

/**
 * Canonical customer-facing account endpoint - every account
 * owned by the authenticated customer.
 */
router.get(
    "/accounts/me",
    authenticate,
    controller.getMyAccounts
);

/*
|--------------------------------------------------------------------------
| Internal APIs
|--------------------------------------------------------------------------
*/

/**
 * Create account mapping.
 */
router.post(
    "/internal/accounts",
    internalAuth,
    createMapping,
    validate,
    controller.createMapping
);

/**
 * Find by account number.
 */
router.get(
    "/internal/accounts/:accountNumber",
    internalAuth,
    controller.getByAccountNumber
);

/**
 * Find by client ID.
 */
router.get(
    "/internal/accounts/client/:clientId",
    internalAuth,
    controller.getByClientId
);

/**
 * Find by Fineract Account ID.
 */
router.get(
    "/internal/accounts/fineract/:fineractAccountId",
    internalAuth,
    controller.getByFineractAccountId
);

/**
 * Synchronize account from Fineract.
 */
router.post(
    "/internal/accounts/sync",
    internalAuth,
    syncAccount,
    validate,
    controller.syncAccount
);

module.exports = router;
