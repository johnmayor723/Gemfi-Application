/**
 * ==========================================================
 * Audit Routes
 * ==========================================================
 */

const express = require("express");

const router = express.Router();

const auditController =
require("../controllers/audit.controller");

/**
 * ==========================================================
 * Customer Audit Timeline
 * ==========================================================
 */
router.get(

    "/customers/:customerId/audit",

    auditController.getCustomerTimeline

);

/**
 * ==========================================================
 * Get Single Audit Record
 * ==========================================================
 */
router.get(

    "/audit/:id",

    auditController.getById

);

/**
 * ==========================================================
 * Get All Audit Records
 * ==========================================================
 */
router.get(

    "/audit",

    auditController.getAll

);

module.exports = router;