/**
 * ==========================================================
 * Credit Service
 * ----------------------------------------------------------
 * Handles customer credit checks.
 *
 * Responsibilities:
 *  - Validate business rules
 *  - Retrieve customer KYC profile
 *  - Call the configured credit provider
 *  - Persist check results
 *  - Update KYC verification status
 * ==========================================================
 */

const ApiError = require("../utils/ApiError");

const kycRepository = require("../repositories/kyc.repository");

const auditService = require("./audit.service");

const providerFactory =
    require("../providers/credit/provider.factory");

class CreditService {

    /**
     * ======================================================
     * Run Credit Check
     *
     * POST /customers/:customerId/compliance/credit
     * ======================================================
     *
     * @param {String} customerId
     * @param {Object} payload
     * @param {Object} admin
     *
     * @returns {Promise<Object>}
     */
    async check(customerId, payload, admin) {

        if (!payload?.fullName) {

            throw new ApiError(
                400,
                "fullName is required."
            );

        }

        const profile =
            await kycRepository.findByCustomerId(
                customerId
            );

        if (!profile) {

            throw new ApiError(
                404,
                "KYC profile not found."
            );

        }

        const provider =
            providerFactory.getProvider();

        const result =
            await provider.check({

                customerId,

                fullName: payload.fullName,

                dateOfBirth: payload.dateOfBirth || null

            });

        profile.creditCheck = {

            provider: result.provider,

            reference: result.reference,

            checked: true,

            score: result.score,

            rating: result.rating,

            checkedAt: new Date()

        };

        profile.verification.creditChecked = true;

        await profile.save();

        await auditService.log({

            customerId,

            module: "KYC",

            action: "CREDIT_CHECK",

            status: "SUCCESS",

            description: `Credit check run by ${admin.username}.`,

            performedBy: admin.username,

            metadata: {

                staffDisplayName: admin.staffDisplayName || null,

                provider: result.provider,

                reference: result.reference

            }

        });

        return profile.creditCheck;

    }

    /**
     * ======================================================
     * Get Credit Check
     *
     * GET /customers/:customerId/compliance/credit
     * ======================================================
     */
    async get(customerId) {

        const profile =
            await kycRepository.findByCustomerId(
                customerId
            );

        if (!profile) {

            throw new ApiError(
                404,
                "KYC profile not found."
            );

        }

        return profile.creditCheck;

    }

}

module.exports = new CreditService();
