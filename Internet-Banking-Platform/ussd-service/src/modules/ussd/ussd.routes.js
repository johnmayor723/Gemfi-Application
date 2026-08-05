const express = require("express");

const controller = require("./ussd.controller");

const validator = require("./ussd.validator");

const validate = require("../../middleware/validation.middleware");

const { ussdCallbackLimiter } = require("../../middleware/rate-limit.middleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Africa's Talking USSD callback
|--------------------------------------------------------------------------
|
| Called directly by Africa's Talking's servers, never by a
| customer channel or another platform service - there is no
| bearer JWT or internal token to gate this with, the same way
| account-service's pre-enrollment /accounts/validate stays public
| with rate limiting instead of identity auth. Production hardening
| beyond that is an nginx-level IP allowlist for AT's own server
| ranges, not something this route can enforce itself.
*/
router.post(
    "/ussd/callback",
    ussdCallbackLimiter,
    validator.callback,
    validate,
    controller.callback
);

module.exports = router;
