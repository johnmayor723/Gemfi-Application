/**
 * ==========================================================
 * Sanctions Service
 * ----------------------------------------------------------
 * Handles customer sanctions-list screening.
 *
 * Responsibilities:
 *  - Validate business rules
 *  - Retrieve customer KYC profile
 *  - Call the configured sanctions provider
 *  - Persist screening results
 *  - Update KYC verification status
 * ==========================================================
 */

const ApiError = require("../utils/ApiError");

const kycRepository = require("../repositories/kyc.repository");

const auditService = require("./audit.service");

const providerFactory =
    require("../providers/sanctions/provider.factory");

class SanctionsService {

    /**
     * ======================================================
     * Run Sanctions Screen
     *
     * POST /customers/:customerId/compliance/sanctions
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
            await provider.screen({

                customerId,

                fullName: payload.fullName,

                dateOfBirth: payload.dateOfBirth || null

            });

        profile.sanctions = {

            provider: result.provider,

            reference: result.reference,

            checked: true,

            matched: result.matched,

            lists: result.lists || [],

            checkedAt: new Date()

        };

        profile.verification.sanctionsChecked = true;

        await profile.save();

        await auditService.log({

            customerId,

            module: "KYC",

            action: "SANCTIONS_CHECK",

            status: "SUCCESS",

            description: `Sanctions screen run by ${admin.username}.`,

            performedBy: admin.username,

            metadata: {

                staffDisplayName: admin.staffDisplayName || null,

                provider: result.provider,

                reference: result.reference,

                matched: result.matched

            }

        });

        return profile.sanctions;

    }

    /**
     * ======================================================
     * Get Sanctions Screen
     *
     * GET /customers/:customerId/compliance/sanctions
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

        return profile.sanctions;

    }

}

module.exports = new SanctionsService();
