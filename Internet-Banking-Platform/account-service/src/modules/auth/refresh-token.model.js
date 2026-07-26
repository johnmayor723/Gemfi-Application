const mongoose = require("mongoose");

/**
 * ==========================================================
 * Refresh Tokens
 * ==========================================================
 */

const RefreshTokenSchema =
    new mongoose.Schema(
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "AuthUser",
                required: true,
                index: true
            },

            token: {
                type: String,
                required: true,
                unique: true
            },

            expiresAt: {
                type: Date,
                required: true
            },

            revoked: {
                type: Boolean,
                default: false
            }
        },
        {
            timestamps: true,
            versionKey: false
        }
    );

RefreshTokenSchema.index(
    {
        expiresAt: 1
    },
    {
        expireAfterSeconds: 0
    }
);

module.exports =
    mongoose.model(
        "RefreshToken",
        RefreshTokenSchema
    );
