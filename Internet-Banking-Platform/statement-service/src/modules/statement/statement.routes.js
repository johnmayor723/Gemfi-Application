const express = require("express");

const router = express.Router();

const controller = require("./statement.controller");

const validator = require("./statement.validator");

const validate = require("../../middleware/validation.middleware");

const authenticate = require("../../middleware/authenticate.middleware");

const internalAuth = require("../../middleware/internal-auth.middleware");

/**
 * Generate Statement
 */
router.get(
    "/statements",
    authenticate,
    validator.generate,
    validate,
    controller.generate
);

/**
 * Generate Statement (internal caller) - e.g. ussd-service's
 * mini-statement menu item, which has no customer JWT to use
 * against the route above.
 */
router.get(
    "/internal/statements",
    internalAuth,
    validator.generateForInternalCaller,
    validate,
    controller.generateForInternalCaller
);

module.exports = router;
