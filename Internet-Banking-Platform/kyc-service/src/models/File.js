/**
 * ==========================================================
 * File Model
 * ----------------------------------------------------------
 * Stores metadata for all uploaded customer files.
 *
 * Supported file types:
 * - PHOTO
 * - SIGNATURE
 * - DOCUMENT
 * - ADDRESS_PROOF
 * - REFERENCE_LETTER
 *
 * Actual files are stored on disk (or S3 later).
 * MongoDB stores only metadata.
 * ==========================================================
 */

const mongoose = require("mongoose");

const FileSchema = new mongoose.Schema(
    {

        /**
         * Customer that owns this file.
         * References the Customer Service/Fineract customer.
         */
        customerId: {
            type: String,
            required: true,
            index: true
        },

        /**
         * Type of uploaded file.
         */
        fileType: {
            type: String,
            required: true,
            enum: [
                "PHOTO",
                "SIGNATURE",
                "DOCUMENT",
                "ADDRESS_PROOF",
                "REFERENCE_LETTER"
            ]
        },

        /**
         * Used only for identity documents.
         * Example:
         * NATIONAL_ID
         * PASSPORT
         * DRIVER_LICENSE
         */
        documentType: {
            type: String
        },

        /**
         * Optional document number.
         */
        documentNumber: {
            type: String
        },

        /**
         * Original filename uploaded by the client.
         */
        originalName: {
            type: String,
            required: true
        },

        /**
         * Filename stored on disk.
         */
        storedName: {
            type: String,
            required: true,
            unique: true
        },

        /**
         * MIME type.
         */
        mimeType: {
            type: String,
            required: true
        },

        /**
         * File size in bytes.
         */
        size: {
            type: Number,
            required: true
        },
        metadata: {

            documentType: String,

            documentNumber: String,

            expiryDate: Date,

            issuedDate: Date,

            issuingAuthority: String

        },

        /**
         * Relative storage path.
         */
        path: {
            type: String,
            required: true
        },

        /**
         * Soft delete flag.
         */
        deleted: {
            type: Boolean,
            default: false
        },

        /**
         * Fineract Sync
         * ----------------------------------------------------
         * Tracks whether this file's bytes have been pushed
         * onto the Fineract client record (image slot for
         * PHOTO, generic Documents API for everything else),
         * the resourceId Fineract assigned, and retry state
         * for failed syncs.
         */
        fineractSync: {

            synced: {
                type: Boolean,
                default: false
            },

            resourceId: {
                type: String,
                default: null
            },

            syncedAt: {
                type: Date,
                default: null
            },

            attempts: {
                type: Number,
                default: 0
            },

            lastAttemptAt: {
                type: Date,
                default: null
            },

            lastError: {
                type: String,
                default: null
            }

        }

    },
    {
        timestamps: true,
        collection: "files"
    }
);

module.exports = mongoose.model(
    "File",
    FileSchema
);