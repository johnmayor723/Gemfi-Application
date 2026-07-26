const express = require("express");

const router = express.Router();

const controller = require("./beneficiary.controller");

const validator = require("./beneficiary.validator");

const validate = require("../../middleware/validation.middleware");

const authenticate = require("../../middleware/authenticate.middleware");

/**
 * Create Beneficiary
 */
router.post(
    "/beneficiaries",
    authenticate,
    validator.create,
    validate,
    controller.create
);

/**
 * List Beneficiaries
 */
router.get(
    "/beneficiaries",
    authenticate,
    validator.list,
    validate,
    controller.list
);

/**
 * Get Beneficiary By ID
 */
router.get(
    "/beneficiaries/:id",
    authenticate,
    validator.getById,
    validate,
    controller.getById
);

/**
 * Update Beneficiary
 */
router.patch(
    "/beneficiaries/:id",
    authenticate,
    validator.update,
    validate,
    controller.update
);

/**
 * Remove Beneficiary
 */
router.delete(
    "/beneficiaries/:id",
    authenticate,
    validator.getById,
    validate,
    controller.remove
);

module.exports = router;
