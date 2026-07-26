const express = require("express");

const router = express.Router();

const controller = require("./profile.controller");

const validator = require("./profile.validator");

const validate = require("../../middleware/validation.middleware");

const authenticate = require("../../middleware/authenticate.middleware");

/**
 * Get My Profile
 */
router.get(
    "/profile",
    authenticate,
    controller.getProfile
);

/**
 * Update My Profile
 */
router.patch(
    "/profile",
    authenticate,
    validator.update,
    validate,
    controller.updateProfile
);

/**
 * Get My Transactions
 */
router.get(
    "/profile/transactions",
    authenticate,
    validator.getTransactions,
    validate,
    controller.getTransactions
);

module.exports = router;
