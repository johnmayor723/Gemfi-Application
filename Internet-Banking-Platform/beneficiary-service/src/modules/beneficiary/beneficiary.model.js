const mongoose = require("mongoose");

/**
 * ==========================================================
 * Beneficiary
 * ==========================================================
 */

const BeneficiarySchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            index: true
        },

        accountNumber: {
            type: String,
            required: true
        },

        /**
         * null for a same-bank beneficiary.
         */
        bankCode: {
            type: String,
            default: null
        },

        /**
         * null for a same-bank beneficiary (implied to be this
         * bank); required for other-bank since there's no bank
         * directory to resolve it from.
         */
        bankName: {
            type: String,
            default: null
        },

        /**
         * Auto-filled from Account Service for same-bank;
         * user-supplied and unverified for other-bank.
         */
        accountName: {
            type: String,
            required: true
        },

        nickname: {
            type: String,
            default: null
        },

        type: {
            type: String,
            required: true,
            enum: ["SAME_BANK", "OTHER_BANK"]
        },

        isFavorite: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

BeneficiarySchema.index(
    {
        userId: 1,
        accountNumber: 1,
        bankCode: 1
    },
    {
        unique: true
    }
);

module.exports = mongoose.model(
    "Beneficiary",
    BeneficiarySchema
);
