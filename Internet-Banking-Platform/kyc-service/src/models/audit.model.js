const mongoose = require("mongoose");

/**
 * ==========================================================
 * Audit Trail Schema
 * ----------------------------------------------------------
 * Stores a chronological history of actions performed
 * within the KYC system.
 *
 * This schema is generic and can be reused by future
 * modules such as Loans, Savings, Users, etc.
 * ==========================================================
 */
const AuditSchema = new mongoose.Schema(
    {
        /**
         * Customer associated with the event.
         */
        customerId: {
            type: String,
            required: true,
            index: true
        },

        /**
         * Module generating the event.
         *
         * Examples:
         * PHOTO
         * SIGNATURE
         * DOCUMENT
         * BVN
         * NIN
         * ADDRESS
         * NEXT_OF_KIN
         * REFERENCE
         * AML
         */
        module: {
            type: String,
            required: true
        },

        /**
         * Action performed.
         *
         * Examples:
         * CREATE
         * UPDATE
         * DELETE
         * UPLOAD
         * VERIFY
         * DOWNLOAD
         */
        action: {
            type: String,
            required: true
        },

        /**
         * Outcome of the action.
         */
        status: {
            type: String,
            enum: [
                "SUCCESS",
                "FAILED",
                "PENDING"
            ],
            default: "SUCCESS"
        },

        /**
         * Human-readable description.
         */
        description: {
            type: String,
            required: true
        },

        /**
         * User that performed the action.
         *
         * Until authentication is added,
         * default to SYSTEM.
         */
        performedBy: {
            type: String,
            default: "SYSTEM"
        },

        /**
         * Additional structured information.
         *
         * Examples:
         * fileId
         * provider
         * referenceId
         * documentId
         */
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },

        /**
         * Request IP address.
         */
        ipAddress: {
            type: String,
            default: null
        },

        /**
         * Client user agent.
         */
        userAgent: {
            type: String,
            default: null
        }

    },
    {
        timestamps: true,
        collection: "audit_trails"
    }
);

module.exports =
    mongoose.models.Audit ||
    mongoose.model(
        "Audit",
        AuditSchema
    );