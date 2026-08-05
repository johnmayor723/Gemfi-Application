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

const ApiError = require("../utils/ApiError");

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
 * Files are buffered in memory only. Nothing is written to
 * disk until persistUploadedFile() below has sniffed the
 * buffer's real magic bytes - the client-supplied mimetype
 * header and the originalname's extension are both
 * attacker-controlled and are never used to decide what gets
 * saved or under what extension.
 */
const storage = multer.memoryStorage();

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
 * Cheap first-pass rejection on the client-declared mimetype.
 * Not authoritative on its own - persistUploadedFile() below
 * re-checks the real file content before anything is written
 * to disk.
 */
function fileFilter(req, file, cb) {

    if (!allowedMimeTypes.includes(file.mimetype)) {

        return cb(
            new ApiError(400, "Unsupported file type."),
            false
        );

    }

    cb(null, true);

}

/**
 * Known file signatures (magic bytes). The saved mimetype and
 * extension always come from whichever signature the buffer
 * actually matches here, never from client input.
 */
const signatures = [

    {

        mimeType: "image/jpeg",

        extension: ".jpg",

        matches(buffer) {

            return (
                buffer.length >= 3 &&
                buffer[0] === 0xff &&
                buffer[1] === 0xd8 &&
                buffer[2] === 0xff
            );

        }

    },

    {

        mimeType: "image/png",

        extension: ".png",

        matches(buffer) {

            const signature = Buffer.from(
                [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
            );

            return (
                buffer.length >= signature.length &&
                buffer.subarray(0, signature.length).equals(signature)
            );

        }

    },

    {

        mimeType: "application/pdf",

        extension: ".pdf",

        matches(buffer) {

            return (
                buffer.length >= 5 &&
                buffer.subarray(0, 5).toString("ascii") === "%PDF-"
            );

        }

    }

];

/**
 * Returns the matching signature for a buffer, or null if the
 * buffer's real content doesn't match any allowed file type.
 *
 * @param {Buffer} buffer
 * @returns {{mimeType: string, extension: string}|null}
 */
function detectFileType(buffer) {

    return (
        signatures.find((signature) => signature.matches(buffer)) || null
    );

}

/**
 * Generic upload middleware. Only buffers the file in memory
 * and does the cheap mimetype pre-check - persistUploadedFile()
 * must run after this on every route to actually validate the
 * content and write it to disk.
 */
const upload = multer({

    storage,

    fileFilter,

    limits: {

        fileSize: 5 * 1024 * 1024

    }

});

/**
 * Validates the uploaded buffer's real content against
 * detectFileType() and, only if it matches an allowed type,
 * writes it to disk under a generated filename whose
 * extension is taken from the detected type - never from the
 * client-supplied originalname. Must be chained directly after
 * upload.single(...)/upload.fields(...) on any route that
 * accepts a file.
 *
 * Rewrites req.file's filename/mimetype/destination/path in
 * place so downstream controllers (which read those fields)
 * behave exactly as they did under the old disk storage.
 */
function persistUploadedFile(req, res, next) {

    if (!req.file) {

        return next();

    }

    const detected = detectFileType(req.file.buffer);

    if (!detected) {

        return next(
            new ApiError(400, "Unsupported or unrecognized file type.")
        );

    }

    const fileType = req.uploadType || "DOCUMENT";

    const directory = folders[fileType];

    ensureDirectory(directory);

    const filename = `${uuid()}${detected.extension}`;

    const destination = path.join(directory, filename);

    fs.writeFileSync(destination, req.file.buffer);

    req.file.filename = filename;

    req.file.mimetype = detected.mimeType;

    req.file.destination = directory;

    req.file.path = destination;

    next();

}

module.exports = upload;

module.exports.persistUploadedFile = persistUploadedFile;
