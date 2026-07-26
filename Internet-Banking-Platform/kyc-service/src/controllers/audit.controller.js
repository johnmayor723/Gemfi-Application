/**
 * ==========================================================
 * Audit Controller
 * ----------------------------------------------------------
 * Handles HTTP requests for audit trail operations.
 *
 * Responsibilities:
 *  - Retrieve customer audit timeline
 *  - Retrieve a single audit record
 *  - Retrieve all audit records
 * ==========================================================
 */

const asyncHandler = require("../middleware/asyncHandler");
const auditService = require("../services/audit.service");

/**
 * ==========================================================
 * Get Customer Audit Timeline
 *
 * GET /customers/:customerId/audit
 * ==========================================================
 */
exports.getCustomerTimeline = asyncHandler(async (req, res) => {

    const audits =
        await auditService.getCustomerTimeline(
            req.params.customerId
        );

    res.status(200).json({

        success: true,

        count: audits.length,

        data: audits

    });

});

/**
 * ==========================================================
 * Get Single Audit Record
 *
 * GET /audit/:id
 * ==========================================================
 */
exports.getById = asyncHandler(async (req, res) => {

    const audit =
        await auditService.getById(
            req.params.id
        );

    res.status(200).json({

        success: true,

        data: audit

    });

});

/**
 * ==========================================================
 * Get All Audit Records
 *
 * GET /audit
 * ==========================================================
 */
exports.getAll = asyncHandler(async (req, res) => {

    const audits =
        await auditService.getAll();

    res.status(200).json({

        success: true,

        count: audits.length,

        data: audits

    });

});
