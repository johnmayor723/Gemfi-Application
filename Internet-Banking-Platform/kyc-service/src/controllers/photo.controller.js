/**
 * ==========================================================
 * Photo Controller
 * ----------------------------------------------------------
 * Handles customer passport photograph endpoints.
 *
 * Responsibilities:
 *  - Accept HTTP requests
 *  - Call the File Service
 *  - Return HTTP responses
 * ==========================================================
 */

const asyncHandler = require("../middleware/asyncHandler");
const fileService = require("../services/file.service");
const FileTypes = require("../constants/fileTypes");

/**
 * Upload customer's passport photograph.
 *
 * POST /customers/:customerId/photo
 */
exports.upload = asyncHandler(async (req, res) => {

    const customerId = req.params.customerId;

    const photo = await fileService.uploadFile(
        customerId,
        FileTypes.PHOTO,
        req.file
    );

    res.status(201).json({
        success: true,
        message: "Passport photo uploaded successfully.",
        data: {
            photoId: photo._id,
            url: `/api/v1/files/${photo._id}`
        }
    });

});

/**
 * Get customer's passport photograph metadata.
 *
 * GET /customers/:customerId/photo
 */
exports.get = asyncHandler(async (req, res) => {

    const customerId = req.params.customerId;

    const photo = await fileService.getFile(
        customerId,
        FileTypes.PHOTO
    );

    res.json({
        success: true,
        data: {
            photoId: photo._id,
            url: `/api/v1/files/${photo._id}`,
            uploadedAt: photo.createdAt
        }
    });

});

/**
 * Delete customer's passport photograph.
 *
 * DELETE /customers/:customerId/photo
 */
exports.remove = asyncHandler(async (req, res) => {

    const customerId = req.params.customerId;

    await fileService.deleteFile(
        customerId,
        FileTypes.PHOTO
    );

    res.json({
        success: true,
        message: "Passport photo deleted successfully."
    });

});