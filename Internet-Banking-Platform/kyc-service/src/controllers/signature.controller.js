/**
 * ==========================================================
 * Signature Controller
 * ----------------------------------------------------------
 * Handles customer signature endpoints.
 *
 * Responsibilities:
 *  - Accept HTTP requests
 *  - Call the File Service
 *  - Return HTTP responses
 *
 * Business logic belongs in file.service.js
 * ==========================================================
 */

const asyncHandler = require("../middleware/asyncHandler");
const fileService = require("../services/file.service");
const FileTypes = require("../constants/fileTypes");

/**
 * ==========================================================
 * Upload Customer Signature
 * ----------------------------------------------------------
 * POST /customers/:customerId/signature
 * ==========================================================
 */
exports.upload = asyncHandler(async (req, res) => {

    const customerId = req.params.customerId;

    const signature = await fileService.uploadFile(
        customerId,
        FileTypes.SIGNATURE,
        req.file
    );

    return res.status(201).json({

        success: true,

        message: "Customer signature uploaded successfully.",

        data: {

            signatureId: signature._id,

            url: `/api/v1/files/${signature._id}`

        }

    });

});


/**
 * ==========================================================
 * Get Customer Signature
 * ----------------------------------------------------------
 * GET /customers/:customerId/signature
 * ==========================================================
 */
exports.get = asyncHandler(async (req, res) => {

    const customerId = req.params.customerId;

    const signature = await fileService.getFile(
        customerId,
        FileTypes.SIGNATURE
    );

    return res.json({

        success: true,

        data: {

            signatureId: signature._id,

            url: `/api/v1/files/${signature._id}`,

            uploadedAt: signature.createdAt

        }

    });

});


/**
 * ==========================================================
 * Delete Customer Signature
 * ----------------------------------------------------------
 * DELETE /customers/:customerId/signature
 * ==========================================================
 */
exports.remove = asyncHandler(async (req, res) => {

    const customerId = req.params.customerId;

    await fileService.deleteFile(
        customerId,
        FileTypes.SIGNATURE
    );

    return res.json({

        success: true,

        message: "Customer signature deleted successfully."

    });

});