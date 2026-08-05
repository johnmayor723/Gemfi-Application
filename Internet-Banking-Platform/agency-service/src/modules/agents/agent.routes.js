const express = require("express");

const controller = require("./agent.controller");

const validate = require("../../middleware/validation.middleware");

const adminAuth = require("../../middleware/admin-auth.middleware");

const {
    adminActionLimiter
} = require("../../middleware/rate-limit.middleware");

const {
    createAgent,
    listAgents,
    getAgent,
    approveAgent,
    rejectAgent,
    updateAgentStatus,
    updateCommissionSchedule,
    updateLimits
} = require("./validators");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Admin APIs
|--------------------------------------------------------------------------
| Every agent route is a backend/ops operation, not end-user
| facing - there is no agent self-service portal. Gated by the
| same kind of admin-session auth account-service's portal-facing
| routes use (see ../../middleware/admin-auth.middleware.js for
| why this service verifies rather than issues those tokens).
|
| Deliberately absent from this module: cash-in/cash-out
| transaction execution, commission calculation/payout against
| real transactions, an agent-facing app/portal/USSD channel,
| Fineract client/savings-account creation, gateway/nginx wiring,
| and inbound webhook/sweep logic for the float virtual account -
| all explicitly out of scope for this service (see
| agent.service.js).
*/

/**
 * Create an agent application (status PENDING).
 */
router.post(
    "/agents",
    adminAuth,
    adminActionLimiter,
    createAgent,
    validate,
    controller.createAgent
);

/**
 * List agents, optionally filtered by status, agentType, and
 * parentAgentId.
 */
router.get(
    "/agents",
    adminAuth,
    adminActionLimiter,
    listAgents,
    validate,
    controller.listAgents
);

/**
 * Get a single agent.
 */
router.get(
    "/agents/:id",
    adminAuth,
    adminActionLimiter,
    getAgent,
    validate,
    controller.getAgent
);

/**
 * Approve a pending agent application - provisions its float
 * virtual account via account-service and activates it.
 */
router.patch(
    "/agents/:id/approve",
    adminAuth,
    adminActionLimiter,
    approveAgent,
    validate,
    controller.approveAgent
);

/**
 * Reject a pending agent application. Terminal.
 */
router.patch(
    "/agents/:id/reject",
    adminAuth,
    adminActionLimiter,
    rejectAgent,
    validate,
    controller.rejectAgent
);

/**
 * Transition an onboarded agent's status. CLOSED is terminal.
 */
router.patch(
    "/agents/:id/status",
    adminAuth,
    adminActionLimiter,
    updateAgentStatus,
    validate,
    controller.updateAgentStatus
);

/**
 * Update an onboarded agent's commission schedule.
 */
router.patch(
    "/agents/:id/commission-schedule",
    adminAuth,
    adminActionLimiter,
    updateCommissionSchedule,
    validate,
    controller.updateCommissionSchedule
);

/**
 * Update an onboarded agent's daily/per-transaction limits.
 */
router.patch(
    "/agents/:id/limits",
    adminAuth,
    adminActionLimiter,
    updateLimits,
    validate,
    controller.updateLimits
);

module.exports = router;
