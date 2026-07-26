const mongoose = require("mongoose");

/**
 * ==========================================================
 * OTP Store
 * ==========================================================
 */

const OtpSchema =
    new mongoose.Schema(
        {
            registrationId: {
                type: String,
                required: true,
                index: true
            },

            code: {
                type: String,
                required: true
            },

            expiresAt: {
                type: Date,
                required: true
            },

            attempts: {
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

OtpSchema.index(
    {
        createdAt: 1
    },
    {
        expireAfterSeconds: 900
    }
);

module.exports =
    mongoose.model(
        "Otp",
        OtpSchema
    );
