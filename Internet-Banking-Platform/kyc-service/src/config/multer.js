/**
 * ==========================================================
 * Multer Configuration
 * ----------------------------------------------------------
 * Generic upload middleware used by the KYC Service.
 *
 * Responsibilities:
 *  - Creates upload folders automatically.
 *  - Generates unique filenames.
 *  - Validates file types.
 *  - Enforces file size limits.
 *
 * This configuration is reused by:
 *
 * PHOTO
 * SIGNATURE
 * DOCUMENT
 * ADDRESS_PROOF
 * REFERENCE_LETTER
 * ==========================================================
 */

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuid } = require("uuid");

/**
 * Upload folders.
 */
const folders = {

    PHOTO: "uploads/photos",

    SIGNATURE: "uploads/signatures",

    DOCUMENT: "uploads/documents",

    ADDRESS_PROOF: "uploads/address-proof",

    REFERENCE_LETTER: "uploads/references"

};

/**
 * Ensure the upload directory exists.
 *
 * @param {string} directory
 */
function ensureDirectory(directory) {

    if (!fs.existsSync(directory)) {

        fs.mkdirSync(directory, { recursive: true });

    }

}

/**
 * Multer storage configuration.
 */
const storage = multer.diskStorage({

    /**
     * Determines where the uploaded file is stored.
     */
    destination(req, file, cb) {

        const fileType = req.uploadType || "DOCUMENT";

        const directory = folders[fileType];

        ensureDirectory(directory);

        cb(null, directory);

    },

    /**
     * Generates a unique filename.
     */
    filename(req, file, cb) {

        const extension = path.extname(file.originalname);

        cb(
            null,
            `${uuid()}${extension}`
        );

    }

});

/**
 * Valid image/document MIME types.
 */
const allowedMimeTypes = [

    "image/jpeg",

    "image/png",

    "image/jpg",

    "application/pdf"

];

/**
 * Validate uploaded file.
 */
function fileFilter(req, file, cb) {

    if (!allowedMimeTypes.includes(file.mimetype)) {

        return cb(
            new Error("Unsupported file type."),
            false
        );

    }

    cb(null, true);

}

/**
 * Generic upload middleware.
 */
const upload = multer({

    storage,

    fileFilter,

    limits: {

        fileSize: 5 * 1024 * 1024

    }

});

module.exports = upload;