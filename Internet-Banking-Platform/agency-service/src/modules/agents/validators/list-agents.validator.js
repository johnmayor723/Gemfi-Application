const { query } = require("../../../validators");

const STATUSES = [
    "PENDING",
    "APPROVED",
    "REJECTED",
    "ACTIVE",
    "SUSPENDED",
    "CLOSED"
];

const AGENT_TYPES = [
    "SUPER_AGENT",
    "AGENT"
];

module.exports = [

    query("status")
        .optional()
        .trim()
        .isIn(STATUSES)
        .withMessage(
            `Status must be one of ${STATUSES.join(", ")}.`
        ),

    query("agentType")
        .optional()
        .trim()
        .isIn(AGENT_TYPES)
        .withMessage(
            `Agent type must be one of ${AGENT_TYPES.join(", ")}.`
        ),

    query("parentAgentId")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Parent agent ID cannot be empty.")

];
