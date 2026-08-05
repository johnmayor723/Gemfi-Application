const mongoose = require("mongoose");

/**
 * Agency banking's agent network: agent onboarding, hierarchy
 * (super-agent/agent), float account provisioning, and commission/
 * limit configuration. This module deliberately EXCLUDES actual
 * cash-in/cash-out transaction execution - no Fineract deposit/
 * withdrawal calls, no customer OTP/PIN authorization flow, no
 * calls to transaction-service. Real money movement on a
 * customer's account initiated by an agent needs a customer-
 * authorization mechanism (PIN/OTP) that does not exist in this
 * flow yet; this module only tracks the agent relationship and its
 * configuration, not money movement against it.
 */

const AGENT_TYPES = [
    "SUPER_AGENT",
    "AGENT"
];

const BUSINESS_TYPES = [
    "SOLE_PROPRIETORSHIP",
    "LIMITED_LIABILITY",
    "PARTNERSHIP",
    "NGO",
    "OTHER"
];

const STATUSES = [
    "PENDING",
    "APPROVED",
    "REJECTED",
    "ACTIVE",
    "SUSPENDED",
    "CLOSED"
];

const COMMISSION_TYPES = [
    "PERCENTAGE",
    "FLAT"
];

const CommissionScheduleSchema = new mongoose.Schema(

    {

        type: {
            type: String,
            enum: COMMISSION_TYPES,
            required: true
        },

        value: {
            type: Number,
            required: true,
            min: 0
        },

        capAmount: {
            type: Number,
            default: null,
            min: 0
        }

    },

    {

        _id: false

    }

);

const AgentSchema = new mongoose.Schema(

    {

        agentType: {
            type: String,
            enum: AGENT_TYPES,
            required: true
        },

        /**
         * The super-agent this agent reports to. Required when
         * agentType is "AGENT", must be null/absent when
         * agentType is "SUPER_AGENT". Resolved and validated
         * against this same collection at creation time - see
         * agent.service.js createApplication.
         */
        parentAgentId: {
            type: String,
            default: null
        },

        businessName: {
            type: String,
            required: true,
            trim: true
        },

        tradingName: {
            type: String,
            default: null,
            trim: true
        },

        /**
         * CAC/RC business registration number.
         */
        registrationNumber: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true
        },

        businessType: {
            type: String,
            enum: BUSINESS_TYPES,
            required: true
        },

        contactName: {
            type: String,
            required: true,
            trim: true
        },

        contactEmail: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },

        contactPhone: {
            type: String,
            required: true,
            trim: true
        },

        address: {
            type: String,
            required: true,
            trim: true
        },

        status: {
            type: String,
            enum: STATUSES,
            default: "PENDING"
        },

        rejectionReason: {
            type: String,
            default: null
        },

        /**
         * The real Fineract settlement account backing this
         * agent's float virtual account, as confirmed by
         * account-service (never trusted verbatim from the
         * approver's request body once account-service has
         * resolved the real values - see agent.service.js
         * approveAgent).
         */
        settlementFineractAccountId: {
            type: String,
            default: null
        },

        settlementFineractAccountNumber: {
            type: String,
            default: null
        },

        /**
         * The dedicated float account number account-service
         * issues for this agent (see account-service's
         * virtual-accounts module, purpose=AGENT_FLOAT).
         */
        floatVirtualAccountNumber: {
            type: String,
            default: null,
            index: true
        },

        /**
         * Optional until approval, required from that point on -
         * enforced in agent.service.js and the approve/
         * commission-schedule validators, not at the schema
         * level (same convention merchant-service's feeSchedule
         * follows).
         */
        commissionSchedule: {
            type: CommissionScheduleSchema,
            default: null
        },

        dailyCashInLimit: {
            type: Number,
            default: null,
            min: 0
        },

        dailyCashOutLimit: {
            type: Number,
            default: null,
            min: 0
        },

        perTransactionLimit: {
            type: Number,
            default: null,
            min: 0
        },

        /**
         * Admin username from the admin-auth-attached request
         * context (see ../../middleware/admin-auth.middleware.js).
         */
        reviewedBy: {
            type: String,
            default: null
        },

        reviewedAt: {
            type: Date,
            default: null
        }

    },

    {

        timestamps: true

    }

);

/**
 * Supports GET /agents?status=&agentType=&parentAgentId=
 * filtering.
 */
AgentSchema.index({
    status: 1,
    agentType: 1,
    parentAgentId: 1
});

module.exports =
    mongoose.model(
        "Agent",
        AgentSchema
    );
