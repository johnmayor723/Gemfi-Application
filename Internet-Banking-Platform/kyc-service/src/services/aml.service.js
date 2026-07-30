/**
 * ==========================================================
 * AML Service
 * ----------------------------------------------------------
 * Handles customer AML screening.
 *
 * Responsibilities:
 *  - Validate business rules
 *  - Retrieve customer KYC profile
 *  - Call the configured AML provider
 *  - Persist screening results
 *  - Update KYC verification status
 * ==========================================================
 */

const ApiError = require("../utils/ApiError");

const kycRepository = require("../repositories/kyc.repository");

const auditService = require("./audit.service");

const providerFactory =
    require("../providers/aml/provider.factory");

class AmlService {

    /**
     * ======================================================
     * Run AML Screen
     *
     * POST /customers/:customerId/compliance/aml
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

        profile.aml = {

            provider: result.provider,

            reference: result.reference,

            checked: true,

            matched: result.matched,

            riskLevel: result.riskLevel,

            matches: result.matches || [],

            checkedAt: new Date()

        };

        profile.verification.amlChecked = true;

        await profile.save();

        await auditService.log({

            customerId,

            module: "KYC",

            action: "AML_CHECK",

            status: "SUCCESS",

            description: `AML screen run by ${admin.username}.`,

            performedBy: admin.username,

            metadata: {

                staffDisplayName: admin.staffDisplayName || null,

                provider: result.provider,

                reference: result.reference,

                matched: result.matched

            }

        });

        return profile.aml;

    }

    /**
     * ======================================================
     * Get AML Screen
     *
     * GET /customers/:customerId/compliance/aml
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

        return profile.aml;

    }

}

module.exports = new AmlService();
