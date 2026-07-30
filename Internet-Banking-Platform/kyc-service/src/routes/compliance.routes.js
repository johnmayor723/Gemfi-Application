/**
 * ==========================================================
 * Compliance Routes
 * ==========================================================
 */

const express = require("express");

const router = express.Router();

const adminAuth = require("../middleware/adminAuth");

router.use(adminAuth);

const controller = require("../controllers/compliance.controller");

/**
 * ==========================================================
 * Credit Check
 * ==========================================================
 */
router.post(
    "/customers/:customerId/compliance/credit",
    controller.checkCredit
);

router.get(
    "/customers/:customerId/compliance/credit",
    controller.getCredit
);

/**
 * ==========================================================
 * AML Screen
 * ==========================================================
 */
router.post(
    "/customers/:customerId/compliance/aml",
    controller.checkAml
);

router.get(
    "/customers/:customerId/compliance/aml",
    controller.getAml
);

/**
 * ==========================================================
 * PEP Screen
 * ==========================================================
 */
router.post(
    "/customers/:customerId/compliance/pep",
    controller.checkPep
);

router.get(
    "/customers/:customerId/compliance/pep",
    controller.getPep
);

/**
 * ==========================================================
 * Sanctions Screen
 * ==========================================================
 */
router.post(
    "/customers/:customerId/compliance/sanctions",
    controller.checkSanctions
);

router.get(
    "/customers/:customerId/compliance/sanctions",
    controller.getSanctions
);

module.exports = router;
