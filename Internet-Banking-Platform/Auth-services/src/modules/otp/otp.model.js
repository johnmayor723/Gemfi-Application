const mongoose = require("mongoose");

/**
 * ==========================================================
 * OTP Schema
 * ==========================================================
 *
 * Generic OTP storage.
 *
 * Used for:
 * - Enrollment
 * - Password Reset
 * - Transaction Authorization
 * - Device Verification
 * - Beneficiary Activation
 * ==========================================================
 */

const OtpSchema = new mongoose.Schema(
    {
        /**
         * Public Reference
         * (Enrollment ID, Password Reset ID, etc.)
         */
        referenceId: {
            type: String,
            required: true
        },

        /**
         * Reference Type
         */
        referenceType: {
            type: String,
            required: true,
            enum: [
                "ENROLLMENT",
                "PASSWORD_RESET",
                "TRANSFER",
                "DEVICE",
                "BENEFICIARY"
            ]
        },

        /**
         * Delivery Channel
         */
        channel: {
            type: String,
            required: true,
            enum: [
                "EMAIL",
                "SMS"
            ]
        },

        /**
         * Recipient
         */
        destination: {
            type: String,
            required: true
        },

        /**
         * SHA-256 Hash
         */
        codeHash: {
            type: String,
            required: true
        },

        /**
         * Verification Status
         */
        verified: {
            type: Boolean,
            default: false
        },

        /**
         * Attempts
         */
        attempts: {
            type: Number,
            default: 0
        },

        /**
         * Verified Time
         */
        verifiedAt: {
            type: Date,
            default: null
        },

        /**
         * Expiry
         */
        expiresAt: {
            type: Date,
            required: true
        }

    },
    {
        timestamps: true,
        versionKey: false
    }
);

/**
 * TTL Index
 */
OtpSchema.index(
    {
        expiresAt: 1
    },
    {
        expireAfterSeconds: 0
    }
);

/**
 * Search Indexes
 */
OtpSchema.index({
    referenceId: 1,
    channel: 1
});

module.exports = mongoose.model(
    "Otp",
    OtpSchema
);
