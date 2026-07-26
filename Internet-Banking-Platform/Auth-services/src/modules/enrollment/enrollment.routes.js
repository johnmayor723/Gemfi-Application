const express =
    require("express");

const router =
    express.Router();

const controller =
    require("./enrollment.controller");

const validator =
    require("./enrollment.validator");

const validate =
    require("../../middleware/validation.middleware");

/**
 * ==========================================================
 * Enrollment
 * ==========================================================
 */

router.post(

    "/enrollment/start",

    validator.start,

    validate,

    controller.start

);

router.post(

    "/enrollment/verify",

    validator.verify,

    validate,

    controller.verify

);

router.post(

    "/enrollment/complete",

    validator.complete,

    validate,

    controller.complete

);

module.exports =
    router;
