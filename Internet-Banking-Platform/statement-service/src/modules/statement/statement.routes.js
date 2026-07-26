const express = require("express");

const router = express.Router();

const controller = require("./statement.controller");

const validator = require("./statement.validator");

const validate = require("../../middleware/validation.middleware");

const authenticate = require("../../middleware/authenticate.middleware");

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

module.exports = router;
