/**
 * ==========================================================
 * PEP Service
 * ----------------------------------------------------------
 * Handles customer PEP (Politically Exposed Person)
 * screening.
 *
 * Responsibilities:
 *  - Validate business rules
 *  - Retrieve customer KYC profile
 *  - Call the configured PEP provider
 *  - Persist screening results
 *  - Update KYC verification status
 * ==========================================================
 */

const ApiError = require("../utils/ApiError");

const kycRepository = require("../repositories/kyc.repository");

const auditService = require("./audit.service");

const providerFactory =
    require("../providers/pep/provider.factory");

class PepService {

    /**
     * ======================================================
     * Run PEP Screen
     *
     * POST /customers/:customerId/compliance/pep
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

        profile.pep = {

            provider: result.provider,

            reference: result.reference,

            checked: true,

            matched: result.matched,

            matches: result.matches || [],

            checkedAt: new Date()

        };

        profile.verification.pepChecked = true;

        await profile.save();

        await auditService.log({

            customerId,

            module: "KYC",

            action: "PEP_CHECK",

            status: "SUCCESS",

            description: `PEP screen run by ${admin.username}.`,

            performedBy: admin.username,

            metadata: {

                staffDisplayName: admin.staffDisplayName || null,

                provider: result.provider,

                reference: result.reference,

                matched: result.matched

            }

        });

        return profile.pep;

    }

    /**
     * ======================================================
     * Get PEP Screen
     *
     * GET /customers/:customerId/compliance/pep
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

        return profile.pep;

    }

}

module.exports = new PepService();
