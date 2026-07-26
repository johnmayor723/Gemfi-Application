const express = require("express");

const router = express.Router();

const controller = require("./notification.controller");

const validator = require("./notification.validator");

const validate = require("../../middleware/validation.middleware");

const authenticate = require("../../middleware/authenticate.middleware");

const internalAuth = require("../../middleware/internal-auth.middleware");

/**
 * ==========================================================
 * Internal (service-to-service, gated by a shared internal
 * service token — never reachable from a browser or mobile
 * client, only from other platform services)
 * ==========================================================
 */

router.post(
    "/internal/notifications",
    internalAuth,
    validator.sendInternal,
    validate,
    controller.sendInternal
);

router.get(
    "/internal/notifications",
    internalAuth,
    validator.listInternal,
    validate,
    controller.listInternal
);

/**
 * ==========================================================
 * Customer-facing (Bearer-authenticated)
 * ==========================================================
 */

router.get(
    "/notifications",
    authenticate,
    validator.list,
    validate,
    controller.list
);

router.patch(
    "/notifications/:id/read",
    authenticate,
    validator.markRead,
    validate,
    controller.markRead
);

module.exports = router;
