const mongoose = require("mongoose");

/**
 * ==========================================================
 * Pending Registration
 * ==========================================================
 *
 * Temporary registration awaiting OTP verification.
 *
 * Automatically expires after 15 minutes.
 * ==========================================================
 */

const PendingRegistrationSchema =
    new mongoose.Schema(
        {
            registrationId: {
                type: String,
                required: true,
                unique: true,
                index: true
            },

            accountNumber: {
                type: String,
                required: true,
                index: true
            },

            clientId: {
                type: String,
                required: true
            },

            username: {
                type: String,
                required: true,
                lowercase: true,
                trim: true
            },

            email: {
                type: String,
                required: true,
                lowercase: true,
                trim: true
            },

            phoneNumber: {
                type: String,
                required: true
            },

            passwordHash: {
                type: String,
                required: true
            },

            otp: {
                type: String,
                required: true
            },

            otpExpiresAt: {
                type: Date,
                required: true
            },

            otpAttempts: {
                type: Number,
                default: 0
            },

            verified: {
                type: Boolean,
                default: false
            }
        },
        {
            timestamps: true,
            versionKey: false
        }
    );

/**
 * Auto delete after 15 minutes.
 */
PendingRegistrationSchema.index(
    {
        createdAt: 1
    },
    {
        expireAfterSeconds: 900
    }
);

module.exports = mongoose.model(
    "PendingRegistration",
    PendingRegistrationSchema
);
