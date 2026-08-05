module.exports = {

    createAgent:
        require("./create-agent.validator"),

    listAgents:
        require("./list-agents.validator"),

    getAgent:
        require("./get-agent.validator"),

    approveAgent:
        require("./approve-agent.validator"),

    rejectAgent:
        require("./reject-agent.validator"),

    updateAgentStatus:
        require("./update-status.validator"),

    updateCommissionSchedule:
        require("./update-commission-schedule.validator"),

    updateLimits:
        require("./update-limits.validator")

};
