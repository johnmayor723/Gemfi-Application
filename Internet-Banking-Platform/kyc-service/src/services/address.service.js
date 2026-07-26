/**
 * ==========================================================
 * Address Service
 * ----------------------------------------------------------
 * Handles customer address management.
 * ==========================================================
 */

const ApiError = require("../utils/ApiError");
const kycRepository = require("../repositories/kyc.repository");
const fileService = require("./file.service");
const FileTypes = require("../constants/fileTypes");

class AddressService {

    /**
     * Update customer address.
     */
    async update(customerId, payload) {

        const profile = await kycRepository.findByCustomerId(customerId);

        if (!profile) {
            throw new ApiError(404, "KYC profile not found.");
        }

        profile.address = {

            ...profile.address,

            type: payload.type,

            address: payload.address,

            city: payload.city,

            state: payload.state,

            country: payload.country,

            updatedAt: new Date()

        };

        if (!profile.address.createdAt) {
            profile.address.createdAt = new Date();
        }

        await profile.save();

        return profile.address;

    }

    /**
     * Retrieve customer address.
     */
    async get(customerId) {

        const profile = await kycRepository.findByCustomerId(customerId);

        if (!profile) {
            throw new ApiError(404, "KYC profile not found.");
        }

        return profile.address;

    }

    /**
     * Upload proof of address.
     */
    async uploadProof(customerId, file) {

        const savedFile = await fileService.uploadFile(

            customerId,

            FileTypes.ADDRESS_PROOF,

            file

        );

        const profile = await kycRepository.findByCustomerId(customerId);

        profile.address.proofFileId = savedFile._id;

        await profile.save();

        return savedFile;

    }

    /**
     * Verify address.
     */
    async verify(customerId) {

        const profile = await kycRepository.findByCustomerId(customerId);

        if (!profile) {

            throw new ApiError(404, "KYC profile not found.");

        }

        profile.address.verified = true;

        profile.address.verifiedAt = new Date();

        profile.verification.addressVerified = true;

        await profile.save();

        return profile.address;

    }

}

module.exports = new AddressService();