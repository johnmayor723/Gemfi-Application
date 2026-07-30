const repository = require("../repositories/kyc.repository");
const ApiError = require("../utils/ApiError");
const auditService = require("./audit.service");

/**
 * No field is safe to accept through this generic, unauthenticated
 * endpoint. Every legitimate field already has its own dedicated,
 * purpose-built endpoint (identification, address, next-of-kin,
 * references, bvn/nin verification, status). Passing the raw
 * request body straight to Mongo here previously let any caller set
 * status/verification/completion/kycLevel directly - i.e.
 * self-approve their own KYC.
 */
const ALLOWED_FIELDS = [];

class KycService {

    async create(customerId, payload) {

        const existing =
            await repository.findByCustomerId(customerId);

        if (existing) {

            throw new ApiError(
                409,
                "KYC profile already exists."
            );

        }

        return repository.create({

            customerId,

            kycLevel: payload.kycLevel

        });

    }

    async update(customerId, payload) {

        const suppliedFields = Object.keys(payload || {});

        const disallowedFields = suppliedFields.filter(
            (field) => !ALLOWED_FIELDS.includes(field)
        );

        if (disallowedFields.length > 0) {

            throw new ApiError(
                400,
                `These fields cannot be updated through this endpoint: ${disallowedFields.join(", ")}. Use the dedicated identification, address, next-of-kin, reference, or verification endpoints instead.`
            );

        }

        const profile =
            await repository.update(customerId, payload);

        if (!profile) {

            throw new ApiError(
                404,
                "KYC profile not found."
            );

        }

        return profile;

    }

    async approve(customerId, admin) {

        const profile =
            await repository.findByCustomerId(customerId);

        if (!profile) {

            throw new ApiError(
                404,
                "KYC profile not found."
            );

        }

        if (profile.status === "Verified") {

            throw new ApiError(
                409,
                "KYC profile is already verified."
            );

        }

        profile.status = "Verified";

        await profile.save();

        await auditService.log({

            customerId,

            module: "KYC",

            action: "APPROVE",

            status: "SUCCESS",

            description: `KYC profile approved by ${admin.username}.`,

            performedBy: admin.username,

            metadata: {

                staffDisplayName: admin.staffDisplayName || null

            }

        });

        return profile;

    }

    async reject(customerId, admin, reason) {

        const profile =
            await repository.findByCustomerId(customerId);

        if (!profile) {

            throw new ApiError(
                404,
                "KYC profile not found."
            );

        }

        profile.status = "Rejected";

        await profile.save();

        await auditService.log({

            customerId,

            module: "KYC",

            action: "REJECT",

            status: "SUCCESS",

            description: reason
                ? `KYC profile rejected by ${admin.username}: ${reason}`
                : `KYC profile rejected by ${admin.username}.`,

            performedBy: admin.username,

            metadata: {

                staffDisplayName: admin.staffDisplayName || null,

                reason: reason || null

            }

        });

        return profile;

    }

}

module.exports = new KycService();