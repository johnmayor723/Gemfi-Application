/**
 * ==========================================================
 * Audit Service
 * ----------------------------------------------------------
 * Business logic for audit trail.
 *
 * Responsibilities:
 *  - Create audit events
 *  - Retrieve customer audit history
 *  - Retrieve individual audit records
 *  - Retrieve all audit events
 * ==========================================================
 */

const auditRepository =
require("../repositories/audit.repository");

const ApiError =
require("../utils/ApiError");

class AuditService {

    /**
     * ======================================================
     * Create Audit Record
     * ======================================================
     *
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    async log(data) {

        return auditRepository.create({

            customerId: data.customerId,

            module: data.module,

            action: data.action,

            status: data.status || "SUCCESS",

            description: data.description,

            performedBy: data.performedBy || "SYSTEM",

            metadata: data.metadata || {},

            ipAddress: data.ipAddress || null,

            userAgent: data.userAgent || null

        });

    }

    /**
     * ======================================================
     * Customer Audit Timeline
     * ======================================================
     *
     * @param {String} customerId
     * @returns {Promise<Array>}
     */
    async getCustomerTimeline(customerId) {

        return auditRepository.findByCustomer(
            customerId
        );

    }

    /**
     * ======================================================
     * Get Audit Record
     * ======================================================
     *
     * @param {String} id
     * @returns {Promise<Object>}
     */
    async getById(id) {

        const audit =
        await auditRepository.findById(id);

        if (!audit) {

            throw new ApiError(
                404,
                "Audit record not found."
            );

        }

        return audit;

    }

    /**
     * ======================================================
     * Get All Audit Records
     * ======================================================
     *
     * Used by administrators.
     *
     * @returns {Promise<Array>}
     */
    async getAll() {

        return auditRepository.findAll();

    }

}

module.exports =
new AuditService();