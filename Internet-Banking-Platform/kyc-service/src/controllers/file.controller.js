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

const fineractSyncService = require("../services/fineractSync.service");

const ApiError = require("../utils/ApiError");


/**
 * ==========================================================
 * Retry Fineract Sync For One File
 *
 * POST /files/:fileId/sync
 * ==========================================================
 */
exports.sync = asyncHandler(async (req, res) => {

    const file = await fineractSyncService.retrySync(

        req.params.fileId

    );

    res.json({

        success: true,

        message: "File synced to Fineract successfully.",

        data: file

    });

});

/**
 * ==========================================================
 * Fineract Sync Status For A Customer
 *
 * GET /customers/:customerId/documents/sync-status
 * ==========================================================
 */
exports.syncStatus = asyncHandler(async (req, res) => {

    const status = await fineractSyncService.getSyncStatus(

        req.params.customerId

    );

    res.json({

        success: true,

        data: status

    });

});

/**
 * ==========================================================
 * Reconcile A Customer's Files Against Fineract
 *
 * POST /customers/:customerId/documents/reconcile
 * ==========================================================
 */
exports.reconcile = asyncHandler(async (req, res) => {

    const result = await fineractSyncService.reconcile(

        req.params.customerId

    );

    res.json({

        success: true,

        message: "Reconciliation completed.",

        data: result

    });

});

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