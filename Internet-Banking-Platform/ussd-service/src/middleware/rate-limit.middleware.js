const { rateLimit } = require("express-rate-limit");

const { TooManyRequestsError } = require("../errors");

/**
 * Hands rate-limit rejections to the standard error handler
 * instead of express-rate-limit's default plain-text response,
 * so callers get the same { success, message, error, meta }
 * shape as every other error.
 */
const handler = (req, res, next) => {

    next(new TooManyRequestsError());

};

/**
 * Baseline protection applied globally in app.js. Route-specific
 * limiters (login, public lookups, etc.) should layer a tighter
 * limit on top of this where a route needs it, not replace it.
 */
const globalLimiter = rateLimit({

    windowMs: 15 * 60 * 1000,

    limit: 300,

    standardHeaders: true,

    legacyHeaders: false,

    handler

});

/**
 * The USSD callback is called only by Africa's Talking's own
 * servers - every request shares a small handful of source IPs
 * regardless of how many different customers are dialing in at
 * once, so an IP-keyed limiter (the usual pattern for a public
 * endpoint) would throttle all USSD users collectively instead of
 * targeting abuse. Keyed by phoneNumber instead: generous enough
 * for a real multi-step session with a retry or two, tight enough
 * to stop one number hammering the endpoint.
 */
const ussdCallbackLimiter = rateLimit({

    windowMs: 60 * 1000,

    limit: 30,

    standardHeaders: true,

    legacyHeaders: false,

    keyGenerator: (req) =>
        req.body?.phoneNumber || req.ip,

    handler

});

module.exports = {

    globalLimiter,

    ussdCallbackLimiter

};
