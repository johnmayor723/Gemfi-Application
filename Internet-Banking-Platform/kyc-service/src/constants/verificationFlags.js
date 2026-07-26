/**
 * ==========================================================
 * Verification Flag Mapping
 * ----------------------------------------------------------
 * Maps uploaded file types to KYC verification flags.
 * ==========================================================
 */

const FileTypes = require("./fileTypes");

module.exports = {

    [FileTypes.PHOTO]: "photoUploaded",

    [FileTypes.SIGNATURE]: "signatureUploaded",

    [FileTypes.DOCUMENT]: "documentsUploaded",

    [FileTypes.ADDRESS_PROOF]: "addressVerified",

    [FileTypes.REFERENCE_LETTER]: null

};