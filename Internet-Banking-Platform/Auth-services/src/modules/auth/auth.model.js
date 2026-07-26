const mongoose = require("mongoose");

/**
 * ==========================================================
 * Internet Banking User
 * ==========================================================
 */

const AuthUserSchema = new mongoose.Schema(
    {
        accountNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        clientId: {
            type: String,
            required: true
        },

        username: {
            type: String,
            required: true,
            unique: true,
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
            required: true,
            trim: true
        },

        passwordHash: {
            type: String,
            required: true
        },

        status: {
            type: String,
            enum: ["ACTIVE", "LOCKED", "INACTIVE"],
            default: "ACTIVE"
        },

        emailVerified: {
            type: Boolean,
            default: false
        },

        phoneVerified: {
            type: Boolean,
            default: false
        },

        passwordChangedAt: {
            type: Date,
            default: null
        },

        lastLoginAt: {
            type: Date,
            default: null
        },

        failedLoginAttempts: {
            type: Number,
            default: 0
        },

        lockedUntil: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

AuthUserSchema.index({ accountNumber: 1 });
AuthUserSchema.index({ clientId: 1 });
AuthUserSchema.index({ username: 1 });
AuthUserSchema.index({ status: 1 });

module.exports = mongoose.model(
    "AuthUser",
    AuthUserSchema
);
