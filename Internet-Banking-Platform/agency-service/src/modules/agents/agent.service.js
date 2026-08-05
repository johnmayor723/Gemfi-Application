const repository = require("./agent.repository");

const {
    client: accountClient
} = require("../../integrations/account");

const {
    NotFoundError,
    ConflictError,
    BusinessRuleError
} = require("../../errors");

/**
 * Purpose value used when provisioning an agent's float virtual
 * account through account-service. This is one of the enum
 * values account-service's own virtual-accounts module already
 * defines (see account-service/src/modules/virtual-accounts/
 * validators/create-virtual-account.validator.js) - reused
 * verbatim rather than invented here.
 */
const FLOAT_VIRTUAL_ACCOUNT_PURPOSE = "AGENT_FLOAT";

/**
 * Status transitions via PATCH /agents/:id/status are only legal
 * once an agent has already left PENDING - the initial PENDING
 * decision is made exclusively through approve/reject. CLOSED is
 * a terminal state - since it is deliberately excluded from this
 * list, a closed agent fails the same "must already be onboarded"
 * gate every other illegal-source status fails, and can never be
 * reopened.
 */
const ONBOARDED_STATUSES = ["ACTIVE", "SUSPENDED"];

class AgentService {

    /**
     * Create an agent application. Ops-created for now - there is
     * no agent self-service portal. Validates the super-agent/
     * agent hierarchy rule before persisting: a SUPER_AGENT must
     * not carry a parentAgentId, and an AGENT's parentAgentId must
     * resolve to an existing SUPER_AGENT in this same collection.
     */
    async createApplication(data) {

        if (data.agentType === "AGENT") {

            await this._validateParentAgent(data.parentAgentId);

        }

        try {

            return await repository.create({
                ...data,
                status: "PENDING"
            });

        } catch (error) {

            if (error.code === 11000) {

                throw new ConflictError(
                    "An agent with this registration number already exists."
                );

            }

            throw error;

        }

    }

    /**
     * Resolve a parentAgentId against this service's own agents
     * collection - a self-contained lookup, not a call to another
     * service. Throws a BusinessRuleError if the parent cannot be
     * resolved or is not itself a super-agent.
     */
    async _validateParentAgent(parentAgentId) {

        const parent =
            await repository.findById(parentAgentId);

        if (!parent) {

            throw new BusinessRuleError(
                "Parent agent not found."
            );

        }

        if (parent.agentType !== "SUPER_AGENT") {

            throw new BusinessRuleError(
                "Parent agent must be a super-agent."
            );

        }

    }

    /**
     * List agents, optionally filtered by status, agentType,
     * and/or parentAgentId.
     */
    async listAgents({ status, agentType, parentAgentId }) {

        const filter = {};

        if (status) {

            filter.status = status;

        }

        if (agentType) {

            filter.agentType = agentType;

        }

        if (parentAgentId) {

            filter.parentAgentId = parentAgentId;

        }

        return repository.find(filter);

    }

    /**
     * Resolve a single agent by its Mongo _id.
     */
    async getAgentById(id) {

        const agent =
            await repository.findById(id);

        if (!agent) {

            throw new NotFoundError(
                "Agent not found."
            );

        }

        return agent;

    }

    /**
     * Approve a pending agent application. Provisions a float
     * virtual account against the already-existing Fineract
     * settlement account the approver supplies, via
     * account-service's internal API - agency-service never talks
     * to Fineract directly. On success, persists what
     * account-service actually confirmed (never the client-
     * supplied settlement identifiers verbatim) plus the
     * commission schedule and limits, and transitions the agent
     * straight to ACTIVE. On any failure to reach account-service,
     * or a rejected settlement account, the error is surfaced and
     * the agent's status is left untouched - the external call
     * always happens before any write to this agent's status.
     */
    async approveAgent(
        id,
        {
            settlementFineractAccountId,
            settlementFineractAccountNumber,
            commissionSchedule,
            dailyCashInLimit,
            dailyCashOutLimit,
            perTransactionLimit
        },
        admin
    ) {

        const agent =
            await this.getAgentById(id);

        if (agent.status !== "PENDING") {

            throw new BusinessRuleError(
                "Only a pending agent application can be approved."
            );

        }

        const virtualAccount =
            await accountClient.createVirtualAccount({

                ownerType: "AGENT",

                ownerId: String(agent._id),

                settlementFineractAccountId,

                settlementFineractAccountNumber,

                purpose: FLOAT_VIRTUAL_ACCOUNT_PURPOSE,

                label: agent.businessName

            });

        return repository.updateById(id, {

            status: "ACTIVE",

            settlementFineractAccountId:
                virtualAccount.settlementFineractAccountId,

            settlementFineractAccountNumber:
                virtualAccount.settlementFineractAccountNumber,

            floatVirtualAccountNumber:
                virtualAccount.virtualAccountNumber,

            commissionSchedule,

            dailyCashInLimit,

            dailyCashOutLimit,

            perTransactionLimit,

            reviewedBy: admin.username,

            reviewedAt: new Date()

        });

    }

    /**
     * Reject a pending agent application. REJECTED is terminal -
     * use a new application for a re-submission.
     */
    async rejectAgent(id, { rejectionReason }, admin) {

        const agent =
            await this.getAgentById(id);

        if (agent.status !== "PENDING") {

            throw new BusinessRuleError(
                "Only a pending agent application can be rejected."
            );

        }

        return repository.updateById(id, {

            status: "REJECTED",

            rejectionReason,

            reviewedBy: admin.username,

            reviewedAt: new Date()

        });

    }

    /**
     * Transition status once an agent has already been onboarded
     * (ACTIVE/SUSPENDED). CLOSED is terminal. Re-requesting the
     * current status is rejected as a no-op, mirroring
     * merchant-service's merchant.service.js and account-service's
     * virtual-account.service.js convention.
     */
    async updateStatus(id, status) {

        const agent =
            await this.getAgentById(id);

        if (!ONBOARDED_STATUSES.includes(agent.status)) {

            throw new BusinessRuleError(
                "Only an active or suspended agent's status can be changed. Use approve/reject for the initial decision."
            );

        }

        if (agent.status === status) {

            throw new BusinessRuleError(
                `Agent is already ${status.toLowerCase()}.`
            );

        }

        return repository.updateById(id, {
            status
        });

    }

    /**
     * Update the commission schedule. Only legal once an agent
     * has already been onboarded (ACTIVE or SUSPENDED) - an agent
     * must exist before its commission schedule can be changed.
     */
    async updateCommissionSchedule(id, commissionSchedule) {

        const agent =
            await this.getAgentById(id);

        if (!ONBOARDED_STATUSES.includes(agent.status)) {

            throw new BusinessRuleError(
                "Commission schedule can only be changed for an active or suspended agent."
            );

        }

        return repository.updateById(id, {
            commissionSchedule
        });

    }

    /**
     * Update the daily/per-transaction limits. Only legal once an
     * agent has already been onboarded (ACTIVE or SUSPENDED). All
     * three limits are replaced together, mirroring
     * merchant-service's full-replace feeSchedule update
     * convention rather than a partial patch.
     */
    async updateLimits(
        id,
        { dailyCashInLimit, dailyCashOutLimit, perTransactionLimit }
    ) {

        const agent =
            await this.getAgentById(id);

        if (!ONBOARDED_STATUSES.includes(agent.status)) {

            throw new BusinessRuleError(
                "Limits can only be changed for an active or suspended agent."
            );

        }

        return repository.updateById(id, {
            dailyCashInLimit,
            dailyCashOutLimit,
            perTransactionLimit
        });

    }

}

module.exports = new AgentService();
