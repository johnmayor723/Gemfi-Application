const mongoose = require("mongoose");

/**
 * ==========================================================
 * Notification
 * ==========================================================
 */

const NotificationSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            index: true
        },

        channel: {
            type: String,
            required: true,
            enum: ["EMAIL", "SMS"]
        },

        /**
         * Open string, e.g. "TRANSFER_COMPLETED" — not a rigid
         * enum, so new event types from any calling service never
         * require a schema change here.
         */
        type: {
            type: String,
            required: true
        },

        recipient: {
            type: String,
            required: true
        },

        subject: {
            type: String,
            default: null
        },

        message: {
            type: String,
            required: true
        },

        status: {
            type: String,
            required: true,
            enum: ["SENT", "FAILED"]
        },

        providerResponse: {
            type: String,
            default: null
        },

        correlationId: {
            type: String,
            default: null
        },

        isRead: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model(
    "Notification",
    NotificationSchema
);
