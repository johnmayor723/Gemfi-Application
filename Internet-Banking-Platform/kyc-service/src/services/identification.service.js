/**
 * ==========================================================
 * Identification Service
 * ----------------------------------------------------------
 * Handles customer identification records.
 *
 * Responsibilities:
 *  - Create identification record
 *  - Update identification record
 *  - Retrieve identification record
 * ==========================================================
 */

const ApiError = require("../utils/ApiError");
const kycRepository = require("../repositories/kyc.repository");

class IdentificationService {

    /**
     * ======================================================
     * Create Identification Record
     *
     * POST /customers/:customerId/identification
     * ======================================================
     *
     * @param {String} customerId
     * @param {Object} payload
     * @returns {Promise<Object>}
     */
    async create(customerId, payload) {

        const profile = await kycRepository.findByCustomerId(customerId);

        if (!profile) {
            throw new ApiError(404, "KYC profile not found.");
        }

        if (profile.identification?.number) {
            throw new ApiError(
                400,
                "Identification record already exists."
            );
        }

        profile.identification = {

            type: payload.type,

            number: payload.number,

            expiryDate: payload.expiryDate,

            createdAt: new Date(),

            updatedAt: new Date()

        };

        await profile.save();

        return profile.identification;

    }

    /**
     * ======================================================
     * Update Identification Record
     *
     * PUT /customers/:customerId/identification
     * ======================================================
     *
     * @param {String} customerId
     * @param {Object} payload
     * @returns {Promise<Object>}
     */
    async update(customerId, payload) {

        const profile = await kycRepository.findByCustomerId(customerId);

        if (!profile) {
            throw new ApiError(404, "KYC profile not found.");
        }

        profile.identification = {

            ...profile.identification,

            type: payload.type,

            number: payload.number,

            expiryDate: payload.expiryDate,

            updatedAt: new Date()

        };

        await profile.save();

        return profile.identification;

    }

    /**
     * ======================================================
     * Get Identification Record
     *
     * GET /customers/:customerId/identification
     * ======================================================
     *
     * @param {String} customerId
     * @returns {Promise<Object>}
     */
    async get(customerId) {

        const profile = await kycRepository.findByCustomerId(customerId);

        if (!profile) {
            throw new ApiError(404, "KYC profile not found.");
        }

        if (!profile.identification?.number) {
            throw new ApiError(
                404,
                "Identification record not found."
            );
        }

        return profile.identification;

    }

}

module.exports = new IdentificationService();