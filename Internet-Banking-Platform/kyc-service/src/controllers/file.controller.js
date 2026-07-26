/**
 * ==========================================================
 * File Controller
 * ----------------------------------------------------------
 * Handles generic file retrieval.
 * ==========================================================
 */

const path = require("path");

const asyncHandler = require("../middleware/asyncHandler");

const fileRepository = require("../repositories/file.repository");

const ApiError = require("../utils/ApiError");


exports.download = asyncHandler(async (req, res) => {

    const file = await fileRepository.findById(
        req.params.fileId
    );

    if (!file || file.deleted) {

        throw new ApiError(
            404,
            "File not found."
        );

    }

    const absolutePath = path.join(

        __dirname,

        "..",

        "uploads",

        file.path

    );

    return res.sendFile(absolutePath);

});