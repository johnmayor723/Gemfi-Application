const mongoose = require("mongoose");

const {
    AUDIT_STATUS
} = require("../../constants/audit-event.constants");

/**
 * ==========================================================
 * Audit Event
 * ==========================================================
 */

const AuditEventSchema = new mongoose.Schema(
    {
        eventType: {
            type: String,
            required: true,
            index: true
        },

        status: {
            type: String,
            enum: Object.values(AUDIT_STATUS),
            default: AUDIT_STATUS.SUCCESS
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AuthUser",
            default: null,
            index: true
        },

        identifier: {
            type: String,
            default: null
        },

        accountNumber: {
            type: String,
            default: null,
            index: true
        },

        ipAddress: {
            type: String,
            default: null
        },

        userAgent: {
            type: String,
            default: null
        },

        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

AuditEventSchema.index({ createdAt: -1 });

module.exports = mongoose.model(
    "AuditEvent",
    AuditEventSchema
);
