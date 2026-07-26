/**
 * ==========================================================
 * NIN Service
 * ----------------------------------------------------------
 * Handles customer NIN verification.
 * ==========================================================
 */

const ApiError = require("../utils/ApiError");

const kycRepository = require("../repositories/kyc.repository");

const providerFactory =
    require("../providers/nin/provider.factory");

class NINService {

    async verify(customerId, nin) {

        if (!nin) {

            throw new ApiError(
                400,
                "NIN is required."
            );

        }

        if (!/^\d{11}$/.test(nin)) {

            throw new ApiError(
                400,
                "NIN must be exactly 11 digits."
            );

        }

        const profile =
            await kycRepository.findByCustomerId(customerId);

        if (!profile) {

            throw new ApiError(
                404,
                "KYC profile not found."
            );

        }

        const provider =
            providerFactory.getProvider();

        const verification =
            await provider.verify({

                customerId,

                nin,

                firstName: profile.firstName,

                lastName: profile.lastName,

                phoneNumber: profile.phoneNumber

            });

        profile.nin = {

            provider: verification.provider,

            reference: verification.reference,

            verified: verification.verified,

            nin: verification.nin,

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

        profile.verification.ninVerified =
            verification.verified;

        if (verification.verified &&
            profile.status === "PENDING") {

            profile.status = "IN_PROGRESS";

        }

        await profile.save();

        return profile.nin;

    }

    async get(customerId) {

        const profile =
            await kycRepository.findByCustomerId(customerId);

        if (!profile) {

            throw new ApiError(
                404,
                "KYC profile not found."
            );

        }

        return profile.nin;

    }

}

module.exports = new NINService();