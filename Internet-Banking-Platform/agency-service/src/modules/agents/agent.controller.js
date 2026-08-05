const agentService = require("./agent.service");

const { success, created } = require("../../responses/api.response");

/**
 * Create Agent Application
 */
const createAgent = async (req, res) => {

    const agent =
        await agentService.createApplication(req.body);

    return created(res, {
        message: "Agent application created successfully.",
        data: agent
    });

};

/**
 * List Agents (filterable by status, agentType, and parentAgentId)
 */
const listAgents = async (req, res) => {

    const agents =
        await agentService.listAgents(req.query);

    return success(res, {
        message: "Agents retrieved successfully.",
        data: agents
    });

};

/**
 * Get Agent By ID
 */
const getAgent = async (req, res) => {

    const agent =
        await agentService.getAgentById(req.params.id);

    return success(res, {
        message: "Agent retrieved successfully.",
        data: agent
    });

};

/**
 * Approve Agent
 */
const approveAgent = async (req, res) => {

    const agent =
        await agentService.approveAgent(
            req.params.id,
            req.body,
            req.admin
        );

    return success(res, {
        message: "Agent approved successfully.",
        data: agent
    });

};

/**
 * Reject Agent
 */
const rejectAgent = async (req, res) => {

    const agent =
        await agentService.rejectAgent(
            req.params.id,
            req.body,
            req.admin
        );

    return success(res, {
        message: "Agent rejected successfully.",
        data: agent
    });

};

/**
 * Update Agent Status
 */
const updateAgentStatus = async (req, res) => {

    const agent =
        await agentService.updateStatus(
            req.params.id,
            req.body.status
        );

    return success(res, {
        message: "Agent status updated successfully.",
        data: agent
    });

};

/**
 * Update Agent Commission Schedule
 */
const updateCommissionSchedule = async (req, res) => {

    const agent =
        await agentService.updateCommissionSchedule(
            req.params.id,
            req.body.commissionSchedule
        );

    return success(res, {
        message: "Agent commission schedule updated successfully.",
        data: agent
    });

};

/**
 * Update Agent Limits
 */
const updateLimits = async (req, res) => {

    const agent =
        await agentService.updateLimits(
            req.params.id,
            req.body
        );

    return success(res, {
        message: "Agent limits updated successfully.",
        data: agent
    });

};

module.exports = {

    createAgent,

    listAgents,

    getAgent,

    approveAgent,

    rejectAgent,

    updateAgentStatus,

    updateCommissionSchedule,

    updateLimits

};
