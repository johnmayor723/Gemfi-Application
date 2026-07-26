/**
 * ==========================================================
 * Document Controller
 * ----------------------------------------------------------
 * Handles customer KYC document endpoints.
 *
 * Supported documents:
 *  - National ID
 *  - Driver's License
 *  - Passport
 *  - Utility Bill
 *  - CAC Documents
 *  - Proof of Address
 *
 * Business logic belongs in file.service.js
 * ==========================================================
 */

const path = require("path");

const asyncHandler = require("../middleware/asyncHandler");

const fileService = require("../services/file.service");

const fileRepository = require("../repositories/file.repository");

const FileTypes = require("../constants/fileTypes");

const ApiError = require("../utils/ApiError");

/**
 * ==========================================================
 * Upload Document
 *
 * POST /customers/:customerId/documents
 * ==========================================================
 */
exports.upload = asyncHandler(async (req, res) => {

    const customerId = req.params.customerId;

    const metadata = {

        documentType: req.body.documentType,

        documentNumber: req.body.documentNumber,

        expiryDate: req.body.expiryDate

    };

    const document = await fileService.uploadFile(

        customerId,

        FileTypes.DOCUMENT,

        req.file,

        metadata

    );

    return res.status(201).json({

        success: true,

        message: "Document uploaded successfully.",

        data: {

            documentId: document._id

        }

    });

});


/**
 * ==========================================================
 * List Customer Documents
 *
 * GET /customers/:customerId/documents
 * ==========================================================
 */
exports.list = asyncHandler(async (req, res) => {

    const documents =
        await fileRepository.findDocuments(

            req.params.customerId

        );

    const response = documents.map(doc => ({

        documentId: doc._id,

        documentType: doc.metadata.documentType,

        documentNumber: doc.metadata.documentNumber,

        expiryDate: doc.metadata.expiryDate,

        status: doc.status,

        uploadedAt: doc.createdAt

    }));

    return res.json({

        success: true,

        data: response

    });

});


/**
 * ==========================================================
 * Get One Document
 *
 * GET /documents/:documentId
 * ==========================================================
 */
exports.get = asyncHandler(async (req, res) => {

    const document =
        await fileRepository.findDocument(

            req.params.documentId

        );

    if (!document) {

        throw new ApiError(
            404,
            "Document not found."
        );

    }

    return res.json({

        success: true,

        data: document

    });

});


/**
 * ==========================================================
 * Download Document
 *
 * GET /documents/:documentId/download
 * ==========================================================
 */
exports.download = asyncHandler(async (req, res) => {

    const document =
        await fileRepository.findDocument(
            req.params.documentId
        );

    if (!document) {

        throw new ApiError(
            404,
            "Document not found."
        );

    }

    const absolutePath = path.join(

        __dirname,

        "..",

        "uploads",

        document.path

    );

    return res.sendFile(absolutePath);

});


/**
 * ==========================================================
 * Delete Document
 *
 * DELETE /documents/:documentId
 * ==========================================================
 */
exports.remove = asyncHandler(async (req, res) => {

    const document =
        await fileRepository.findDocument(
            req.params.documentId
        );

    if (!document) {

        throw new ApiError(
            404,
            "Document not found."
        );

    }

    await fileRepository.softDelete(document._id);

    return res.json({

        success: true,

        message: "Document deleted successfully."

    });

});