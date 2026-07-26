const Audit =
require("../models/audit.model");

/**
 * ==========================================================
 * Audit Repository
 * ----------------------------------------------------------
 * Handles all database operations for audit records.
 * ==========================================================
 */
class AuditRepository {

    /**
     * Create a new audit record.
     *
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    async create(data) {

        return Audit.create(data);

    }

    /**
     * Retrieve all audit events for a customer.
     *
     * @param {String} customerId
     * @returns {Promise<Array>}
     */
    async findByCustomer(customerId) {

        return Audit
            .find({
                customerId
            })
            .sort({
                createdAt: -1
            });

    }

    /**
     * Retrieve a single audit event.
     *
     * @param {String} id
     * @returns {Promise<Object>}
     */
    async findById(id) {

        return Audit.findById(id);

    }

    /**
     * Retrieve all audit events.
     *
     * Used by administrators.
     *
     * @returns {Promise<Array>}
     */
    async findAll() {

        return Audit
            .find()
            .sort({
                createdAt: -1
            });

    }

}

module.exports =
    new AuditRepository();