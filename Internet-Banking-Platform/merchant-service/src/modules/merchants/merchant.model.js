const mongoose = require("mongoose");

/**
 * Merchant acquisition/onboarding for the bank: merchant KYB,
 * settlement account provisioning, and fee configuration. This is
 * NOT a payments/settlement-execution engine - no merchant
 * transaction volume exists yet (POS/aggregator integration is a
 * separate, future project), so this module only tracks the
 * merchant relationship itself, not money movement against it.
 */

const BUSINESS_TYPES = [
    "SOLE_PROPRIETORSHIP",
    "LIMITED_LIABILITY",
    "PARTNERSHIP",
    "NGO",
    "OTHER"
];

const MERCHANT_CATEGORIES = [
    "RETAIL",
    "ECOMMERCE",
    "HOSPITALITY",
    "TRANSPORT",
    "UTILITIES",
    "PROFESSIONAL_SERVICES",
    "OTHER"
];

/**
 * APPROVED is part of the modeled lifecycle but is not currently
 * set by any transition - PATCH /merchants/:id/approve moves a
 * merchant straight from PENDING to ACTIVE (an approved merchant
 * is, by definition, immediately onboarded once its settlement
 * account exists). Kept in the enum for forward compatibility with
 * a future multi-step approval flow.
 */
const STATUSES = [
    "PENDING",
    "APPROVED",
    "REJECTED",
    "ACTIVE",
    "SUSPENDED",
    "CLOSED"
];

const FEE_TYPES = [
    "PERCENTAGE",
    "FLAT"
];

const FeeScheduleSchema = new mongoose.Schema(

    {

        type: {
            type: String,
            enum: FEE_TYPES,
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

const MerchantSchema = new mongoose.Schema(

    {

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

        merchantCategory: {
            type: String,
            enum: MERCHANT_CATEGORIES,
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
         * merchant's virtual account, as confirmed by
         * account-service (never trusted verbatim from the
         * approver's request body once account-service has
         * resolved the real values - see merchant.service.js
         * approveMerchant).
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
         * The dedicated collection account number account-service
         * issues for this merchant (see account-service's
         * virtual-accounts module).
         */
        settlementVirtualAccountNumber: {
            type: String,
            default: null,
            index: true
        },

        feeSchedule: {
            type: FeeScheduleSchema,
            default: null
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
 * Supports GET /merchants?status=&merchantCategory= filtering.
 */
MerchantSchema.index({
    status: 1,
    merchantCategory: 1
});

module.exports =
    mongoose.model(
        "Merchant",
        MerchantSchema
    );
