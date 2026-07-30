const fs = require("fs");
const path = require("path");

const fileRepository = require("../repositories/file.repository");
const kycRepository = require("../repositories/kyc.repository");
const verificationFlags = require("../constants/verificationFlags");

const auditService = require("./audit.service");
const fineractSyncService = require("./fineractSync.service");

const ApiError = require("../utils/ApiError");

class FileService {

    /**
     * ==========================================================
     * Upload File
     * ----------------------------------------------------------
     * Generic upload method used by:
     * - Passport Photo
     * - Signature
     * - Supporting Documents
     * - Address Proof
     * - Reference Letter
     * ==========================================================
     */
    async uploadFile(
        customerId,
        fileType,
        file,
        metadata = {}
    ) {

        if (!file) {
            throw new ApiError(
                400,
                "Uploaded file is required."
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

        const folderMap = {

            PHOTO: "photos",

            SIGNATURE: "signatures",

            DOCUMENT: "documents",

            ADDRESS_PROOF: "address-proof",

            REFERENCE_LETTER: "references"

        };

        const savedFile =
            await fileRepository.create({

                customerId,

                fileType,

                originalName: file.originalname,

                storedName: file.filename,

                mimeType: file.mimetype,

                size: file.size,

                path: path.join(
                    folderMap[fileType],
                    file.filename
                ),

                metadata

            });

        /**
         * Update verification flag.
         */
        const flag =
            verificationFlags[fileType];

        if (flag) {

            profile.verification[flag] = true;

            await profile.save();

        }

        /**
         * Create audit record.
         */
        await auditService.log({

            customerId,

            module: fileType,

            action: "UPLOAD",

            status: "SUCCESS",

            description: `${fileType} uploaded successfully.`,

            metadata: {

                fileId: savedFile._id,

                originalName: savedFile.originalName,

                storedName: savedFile.storedName,

                mimeType: savedFile.mimeType,

                size: savedFile.size

            }

        });

        /**
         * Push the artifact onto Fineract's client record.
         * Best-effort: syncFile() never throws, so a Fineract
         * outage never fails the upload itself. A failed sync
         * is retried by the background sweep or an explicit
         * POST /files/:fileId/sync.
         */
        await fineractSyncService.syncFile(savedFile);

        return savedFile;

    }

    /**
     * ==========================================================
     * Retrieve Latest File
     * ==========================================================
     */
    async getFile(customerId, fileType) {

        const file =
            await fileRepository.findLatest(
                customerId,
                fileType
            );

        if (!file) {

            throw new ApiError(
                404,
                `${fileType} not found.`
            );

        }

        return file;

    }

    /**
     * ==========================================================
     * Delete File
     * ==========================================================
     */
    async deleteFile(customerId, fileType) {

        const file =
            await fileRepository.findLatest(
                customerId,
                fileType
            );

        if (!file) {

            throw new ApiError(
                404,
                `${fileType} not found.`
            );

        }

        const absolutePath = path.join(

            __dirname,

            "..",

            "..",

            "uploads",

            file.path

        );

        if (fs.existsSync(absolutePath)) {

            fs.unlinkSync(
                absolutePath
            );

        }

        await fileRepository.softDelete(
            file._id
        );

        /**
         * Update verification flag.
         */
        const flag =
            verificationFlags[fileType];

        if (flag) {

            const profile =
                await kycRepository.findByCustomerId(
                    customerId
                );

            if (profile) {

                profile.verification[flag] = false;

                await profile.save();

            }

        }

        /**
         * Create audit record.
         */
        await auditService.log({

            customerId,

            module: fileType,

            action: "DELETE",

            status: "SUCCESS",

            description: `${fileType} deleted successfully.`,

            metadata: {

                fileId: file._id,

                originalName: file.originalName,

                storedName: file.storedName,

                mimeType: file.mimeType,

                size: file.size

            }

        });

    }

}

module.exports = new FileService();