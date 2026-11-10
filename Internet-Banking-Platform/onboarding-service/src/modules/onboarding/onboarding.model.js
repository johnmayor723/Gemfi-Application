const mongoose = require("mongoose");

/**
 * ==========================================================
 * Logo Schema
 * ==========================================================
 */
const LogoSchema = new mongoose.Schema(
    {
        originalName: String,

        storedName: String,

        mimeType: String,

        size: Number,

        path: String

    },
    {
        _id: false
    }
);

/**
 * ==========================================================
 * Onboarding Request Schema
 * ----------------------------------------------------------
 * A prospective tenant's branding + contact submission,
 * moving through pending -> approved/rejected, and (once
 * approved and provisioned) -> active. GEMFI's own tenant
 * status table lives here too - status flips to "disabled"
 * without ever touching Fineract's tenant registry, since
 * Fineract has no such column natively.
 * ==========================================================
 */
const OnboardingRequestSchema = new mongoose.Schema(
    {
        companyName: {
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

        contactAddress: {
            type: String,
            default: null
        },

        logo: {
            type: LogoSchema,
            default: null
        },

        primaryColor: {
            type: String,
            required: true
        },

        secondaryColor: {
            type: String,
            required: true
        },

        subdomain: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            index: true
        },

        /**
         * Subscription tier - drives self-service capability in the
         * portal (e.g. only "enterprise" tenants get the Users/Roles
         * management UI in gemfi-mfb-portal; lower tiers get that done
         * for them via the GemFi admin console instead). Matches the
         * three tiers published on gemfitech.com/resources/offering.
         */
        tier: {
            type: String,
            enum: [
                "starter",
                "professional",
                "enterprise"
            ],
            default: "starter"
        },

        /**
         * Institution type - drives terminology/labeling only (e.g.
         * "Members" instead of "Clients", "Contributions" instead of
         * "Savings") in gemfi-mfb-portal and gemfi-connect. Does not
         * change the underlying Fineract product configuration - a
         * cooperative tenant still runs on the same savings/loan
         * products as a bank tenant, just relabeled in the UI.
         */
        institutionType: {
            type: String,
            enum: [
                "bank",
                "cooperative",
                "loan_company"
            ],
            default: "bank"
        },

        status: {
            type: String,
            enum: [
                "pending",
                "approved",
                "rejected",
                "active",
                "disabled"
            ],
            default: "pending",
            index: true
        },

        submittedBy: {
            type: String,
            enum: ["client", "admin"],
            required: true
        },

        fineractTenantIdentifier: {
            type: String,
            default: null
        },

        roles: {
            type: [String],
            default: [
                "Branch Manager",
                "Teller",
                "Loan Officer",
                "Auditor"
            ]
        },

        chartOfAccountsConfirmed: {
            type: Boolean,
            default: false
        },

        reviewedBy: {
            type: String,
            default: null
        },

        reviewedAt: {
            type: Date,
            default: null
        },

        rejectionReason: {
            type: String,
            default: null
        }

    },
    {
        timestamps: true,
        collection: "onboarding_requests"
    }
);

module.exports =
    mongoose.models.OnboardingRequest ||
    mongoose.model("OnboardingRequest", OnboardingRequestSchema);
