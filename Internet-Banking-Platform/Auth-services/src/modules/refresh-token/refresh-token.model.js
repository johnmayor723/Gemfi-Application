const mongoose = require("mongoose");

/**
 * ==========================================================
 * Refresh Tokens
 * ==========================================================
 */

const RefreshTokenSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AuthUser",
            required: true
        },

        tokenHash: {
            type: String,
            required: true,
            unique: true
        },

        deviceId: {
            type: String,
            default: null
        },

        deviceName: {
            type: String,
            default: null
        },

        ipAddress: {
            type: String,
            default: null
        },

        userAgent: {
            type: String,
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

RefreshTokenSchema.index({ userId: 1 });
RefreshTokenSchema.index({ tokenHash: 1 });
RefreshTokenSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);

module.exports = mongoose.model(
    "RefreshToken",
    RefreshTokenSchema
);
