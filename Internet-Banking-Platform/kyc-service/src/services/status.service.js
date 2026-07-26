/**
 * ==========================================================
 * Status Service
 * ----------------------------------------------------------
 * Computes the customer's overall KYC completion status.
 *
 * Responsibilities:
 *  - Retrieve customer's KYC profile
 *  - Build KYC status summary
 *  - Calculate completion percentage
 *  - Return a frontend-friendly checklist
 * ==========================================================
 */

const ApiError = require("../utils/ApiError");
const kycRepository = require("../repositories/kyc.repository");
const kycRequirements = require("../constants/kycRequirements");

class StatusService {

    /**
     * ======================================================
     * Get Customer KYC Status
     *
     * GET /customers/:customerId/status
     * ======================================================
     *
     * @param {String} customerId
     * @returns {Promise<Object>}
     */
    async getStatus(customerId) {

        /**
         * --------------------------------------------
         * Retrieve customer's KYC profile.
         * --------------------------------------------
         */
        const profile = await kycRepository.findByCustomerId(customerId);

        if (!profile) {
            throw new ApiError(
                404,
                "KYC profile not found."
            );
        }

        /**
         * --------------------------------------------
         * Build status object.
         * --------------------------------------------
         */
        const status = {

            customerId: profile.customerId,

            kycLevel: profile.kycLevel,

            status: profile.status,

            /**
             * Identity Verification
             */
            photo:
                profile.verification?.photoUploaded || false,

            signature:
                profile.verification?.signatureUploaded || false,

            documents:
                (profile.documents?.length || 0) > 0,

            bvn:
                profile.verification?.bvnVerified || false,

            nin:
                profile.verification?.ninVerified || false,

            /**
             * Customer Information
             */
            identification:
                !!profile.identification,

            address:
                !!profile.address,

            nextOfKin:
                (profile.nextOfKin?.length || 0) > 0,

            references:
                (profile.references?.length || 0) > 0,

            /**
             * Compliance
             */
            creditCheck:
                profile.verification?.creditChecked || false,

            aml:
                profile.verification?.amlChecked || false,

            pep:
                profile.verification?.pepChecked || false,

            sanctions:
                profile.verification?.sanctionsChecked || false

        };

        /**
         * --------------------------------------------
         * Calculate completion percentage.
         * --------------------------------------------
         */
        const completedRequirements = kycRequirements.filter(

            requirement => status[requirement.key]

        ).length;

        status.completion = Math.round(

            (completedRequirements / kycRequirements.length) * 100

        );

        /**
         * --------------------------------------------
         * Build frontend checklist.
         * --------------------------------------------
         */
        status.requirements = kycRequirements.map(

            requirement => ({

                key: requirement.key,

                label: requirement.label,

                completed: Boolean(status[requirement.key])

            })

        );

        /**
         * --------------------------------------------
         * Return response.
         * --------------------------------------------
         */
        return status;

    }

}

module.exports = new StatusService();