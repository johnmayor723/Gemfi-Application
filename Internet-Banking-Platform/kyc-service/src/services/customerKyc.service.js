/**
 * ==========================================================
 * Customer KYC Service
 * ----------------------------------------------------------
 * The single, normalized, customer-facing view of KYC status
 * for the Internet Banking application - deliberately separate
 * from the per-customerId admin/core-banking routes elsewhere
 * in this service. Reuses the existing BVN/NIN services (and,
 * through them, the existing provider factory) rather than
 * duplicating verification logic.
 * ==========================================================
 */

const kycRepository = require("../repositories/kyc.repository");
const bvnService = require("./bvn.service");
const ninService = require("./nin.service");

class CustomerKycService {

    /**
     * A customer using Internet Banking shouldn't need to know
     * that a KYC profile has to exist before BVN/NIN can be
     * linked - create a bare one on first use if none exists yet.
     */
    async findOrCreateProfile(customerId) {

        const existing =
            await kycRepository.findByCustomerId(customerId);

        if (existing) {

            return existing;

        }

        return kycRepository.create({ customerId });

    }

    /**
     * GET /kyc/me
     *
     * No profile yet is a normal state (customer enrolled in
     * Internet Banking but hasn't started KYC) - returns a
     * NOT_STARTED default rather than a 404.
     */
    async getMe(customerId) {

        const profile =
            await kycRepository.findByCustomerId(customerId);

        const bvnLinked = Boolean(profile?.bvn?.bvn);
        const ninLinked = Boolean(profile?.nin?.nin);
        const bvnVerified = Boolean(profile?.verification?.bvnVerified);
        const ninVerified = Boolean(profile?.verification?.ninVerified);

        let overallStatus = "NOT_STARTED";

        if (bvnVerified && ninVerified) {

            overallStatus = "VERIFIED";

        } else if (bvnLinked || ninLinked || bvnVerified || ninVerified) {

            overallStatus = "PARTIALLY_VERIFIED";

        }

        return {

            bvn: profile?.bvn?.bvn || null,

            nin: profile?.nin?.nin || null,

            bvnLinked,

            ninLinked,

            bvnVerified,

            ninVerified,

            overallStatus

        };

    }

    /**
     * POST /kyc/link-bvn
     */
    async linkBvn(customerId, bvn) {

        await this.findOrCreateProfile(customerId);

        return bvnService.verify(customerId, bvn);

    }

    /**
     * POST /kyc/link-nin
     */
    async linkNin(customerId, nin) {

        await this.findOrCreateProfile(customerId);

        return ninService.verify(customerId, nin);

    }

}

module.exports = new CustomerKycService();
