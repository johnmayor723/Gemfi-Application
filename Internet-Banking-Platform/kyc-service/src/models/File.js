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