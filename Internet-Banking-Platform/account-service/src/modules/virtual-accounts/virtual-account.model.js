const mongoose = require("mongoose");

/**
 * A virtual account is a uniquely generated NUBAN-format
 * account number that does NOT have its own Fineract savings
 * account behind it. Instead it resolves to one real, existing
 * Fineract settlement account (see AccountMapping in
 * ../accounts/account.model.js).
 *
 * Unlike AccountMapping, which is a 1:1 mapping (one
 * accountNumber per one real Fineract account), this is a
 * many-to-one mapping - many virtualAccountNumbers may point at
 * the same settlementFineractAccountId. This unlocks issuing
 * one virtual account number per payer/invoice against a single
 * merchant/agent settlement account.
 *
 * This module is provisioning + lookup only. Inbound-credit
 * sweep/webhook logic that actually moves money into the
 * settlement account on receipt of a virtual-account-addressed
 * payment is out of scope here - it depends on a separate
 * NIBSS/PTSP inbound-payment integration project.
 */
const VirtualAccountMappingSchema = new mongoose.Schema(

    {

        /**
         * Generated, customer/payer-facing virtual account
         * number. NUBAN-shaped (same format as
         * ../accounts/nuban.generator.js and
         * ../accounts/account-number.generator.js). Never
         * collides with a real accountNumber/nuban in
         * AccountMapping - see virtual-account-number.generator.js.
         */
        virtualAccountNumber: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        /**
         * The kind of entity this virtual account was issued
         * for.
         */
        ownerType: {
            type: String,
            required: true,
            enum: [
                "CUSTOMER",
                "MERCHANT",
                "AGENT",
                "PLATFORM"
            ]
        },

        /**
         * External reference id for the owning entity. The
         * owning entity itself lives in another service/domain
         * (e.g. a future merchant-service) - this service only
         * stores the id.
         */
        ownerId: {
            type: String,
            required: true,
            index: true
        },

        /**
         * The real Fineract savings account this virtual
         * account's funds ultimately belong to.
         */
        settlementFineractAccountId: {
            type: String,
            required: true,
            index: true
        },

        /**
         * Fineract account number of the settlement account,
         * captured at creation time.
         */
        settlementFineractAccountNumber: {
            type: String,
            required: true
        },

        /**
         * Why this virtual account was issued, e.g. COLLECTIONS,
         * WALLET_TOPUP.
         */
        purpose: {
            type: String,
            required: true
        },

        status: {
            type: String,
            enum: [
                "ACTIVE",
                "SUSPENDED",
                "CLOSED"
            ],
            default: "ACTIVE"
        },

        /**
         * Human-readable reference, e.g. an invoice or payer
         * label.
         */
        label: {
            type: String,
            default: null
        },

        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        }

    },

    {

        timestamps: true

    }

);

/**
 * Supports GET /virtual-accounts?ownerType=&ownerId= filtering.
 */
VirtualAccountMappingSchema.index({
    ownerType: 1,
    ownerId: 1
});

module.exports =
    mongoose.model(
        "VirtualAccountMapping",
        VirtualAccountMappingSchema
    );
