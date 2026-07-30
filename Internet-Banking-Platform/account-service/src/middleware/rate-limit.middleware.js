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
 * Anonymous, pre-authentication lookups: name enquiry and
 * account-ownership validation during Internet Banking
 * enrollment. No identity to key off, so IP-based limiting is
 * the only defense against account-number/name enumeration -
 * kept tight relative to a real user's expected retry count.
 */
const publicLookupLimiter = rateLimit({

    windowMs: 60 * 1000,

    limit: 15,

    standardHeaders: true,

    legacyHeaders: false,

    handler

});

/**
 * Admin-session-authenticated portal actions: account
 * provisioning and Fineract-id lookup. Looser than the public
 * lookup limiter - this guards against a runaway client/bug
 * rather than anonymous abuse, since the caller is already
 * authenticated.
 */
const adminActionLimiter = rateLimit({

    windowMs: 60 * 1000,

    limit: 30,

    standardHeaders: true,

    legacyHeaders: false,

    handler

});

/**
 * The admin login endpoint itself is unauthenticated by
 * definition, so it needs its own tight limiter to blunt
 * credential-stuffing against Fineract.
 */
const adminLoginLimiter = rateLimit({

    windowMs: 60 * 1000,

    limit: 10,

    standardHeaders: true,

    legacyHeaders: false,

    handler

});

/**
 * Baseline protection applied globally in app.js, across every
 * route including the internal/customer-facing ones the limiters
 * above don't cover. Routes with their own tighter limiter run
 * both - this one never replaces a route-specific limiter.
 */
const globalLimiter = rateLimit({

    windowMs: 15 * 60 * 1000,

    limit: 300,

    standardHeaders: true,

    legacyHeaders: false,

    handler

});

module.exports = {

    publicLookupLimiter,

    adminActionLimiter,

    adminLoginLimiter,

    globalLimiter

};
