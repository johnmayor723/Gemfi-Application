const express =
    require("express");

const router =
    express.Router();

const controller =
    require("./audit.controller");

const validator =
    require("./audit.validator");

const validate =
    require("../../middleware/validation.middleware");

const authenticate =
    require("../../middleware/authenticate.middleware");

/**
 * ==========================================================
 * My Audit Trail
 * ==========================================================
 */

router.get(

    "/audit",

    authenticate,

    validator.trail,

    validate,

    controller.getMyAuditTrail

);

module.exports =
    router;
