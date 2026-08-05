const mongoose = require("mongoose");

/**
 * ==========================================================
 * OTP Schema
 * ==========================================================
 *
 * Same shape as transaction-service's own OTP collection
 * (ussd-service owns its own, rather than sharing one, for the
 * same reason - no hard runtime dependency between services).
 * SMS-only and single-purpose here: verifying that whoever is
 * dialing in really holds the phone number on file for an
 * account, before letting them enroll a PIN. See
 * enrollment.service.js.
 * ==========================================================
 */

const OtpSchema = new mongoose.Schema(
    {
        /**
         * Public Reference (the accountNumber being enrolled)
         */
        referenceId: {
            type: String,
            required: true
        },

        referenceType: {
            type: String,
            required: true,
            enum: [
                "PHONE_ENROLLMENT"
            ]
        },

        channel: {
            type: String,
            required: true,
            enum: [
                "SMS"
            ]
        },

        /**
         * Recipient phone number
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

        verified: {
            type: Boolean,
            default: false
        },

        attempts: {
            type: Number,
            default: 0
        },

        verifiedAt: {
            type: Date,
            default: null
        },

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

OtpSchema.index({
    referenceId: 1,
    channel: 1
});

module.exports = mongoose.model(
    "Otp",
    OtpSchema
);
