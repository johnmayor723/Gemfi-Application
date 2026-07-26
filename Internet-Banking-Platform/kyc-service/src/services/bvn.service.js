/**
 * ==========================================================
 * BVN Service
 * ----------------------------------------------------------
 * Handles customer BVN verification.
 *
 * Responsibilities:
 *  - Validate business rules
 *  - Retrieve customer KYC profile
 *  - Call the configured BVN provider
 *  - Persist verification results
 *  - Update KYC verification status
 * ==========================================================
 */

const ApiError = require("../utils/ApiError");

const kycRepository = require("../repositories/kyc.repository");

const providerFactory =
    require("../providers/bvn/provider.factory");

class BVNService {

    /**
     * ======================================================
     * Verify Customer BVN
     *
     * POST /customers/:customerId/bvn/verify
     * ======================================================
     *
     * @param {String} customerId
     * @param {String} bvn
     *
     * @returns {Promise<Object>}
     */
    async verify(customerId, bvn) {

        /**
         * -----------------------------
         * Validate Request
         * -----------------------------
         */

        if (!bvn) {

            throw new ApiError(
                400,
                "BVN is required."
            );

        }

        if (!/^\d{11}$/.test(bvn)) {

            throw new ApiError(
                400,
                "BVN must be exactly 11 digits."
            );

        }

        /**
         * -----------------------------
         * Retrieve KYC Profile
         * -----------------------------
         */

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

        /**
         * -----------------------------
         * Get Configured Provider
         * -----------------------------
         */

        const provider =
            providerFactory.getProvider();

        /**
         * -----------------------------
         * Verify BVN
         * -----------------------------
         */

        const verification =
            await provider.verify({

                customerId,

                bvn,

                firstName: profile.firstName,

                lastName: profile.lastName,

                phoneNumber: profile.phoneNumber

            });

        /**
         * -----------------------------
         * Save Verification Result
         * -----------------------------
         */

        profile.bvn = {

            provider: verification.provider,

            reference: verification.reference,

            verified: verification.verified,

            bvn: verification.bvn,

            firstName: verification.firstName,

            middleName: verification.middleName,

            lastName: verification.lastName,

            dob: verification.dob,

            phoneNumber: verification.phoneNumber,

            email: verification.email,

            gender: verification.gender,

            photo: verification.photo,

            verifiedAt: new Date()

        };

        /**
         * -----------------------------
         * Update Verification Flags
         * -----------------------------
         */

        profile.verification.bvnVerified =
            verification.verified;

        /**
         * Optional:
         * Auto-upgrade KYC status
         */

        if (verification.verified &&
            profile.status === "PENDING") {

            profile.status = "IN_PROGRESS";

        }

        /**
         * -----------------------------
         * Persist Changes
         * -----------------------------
         */

        await profile.save();

        /**
         * -----------------------------
         * Return Provider Response
         * -----------------------------
         */

        return profile.bvn;

    }

    /**
     * ======================================================
     * Retrieve Customer BVN
     *
     * GET /customers/:customerId/bvn
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

        return profile.bvn;

    }

}

module.exports = new BVNService();