/**
 * ==========================================================
 * Fineract Adapter
 * ----------------------------------------------------------
 * Maps a kyc-service File record onto the correct Fineract
 * API call and normalizes the response. Hides the fact that
 * PHOTO goes through the dedicated Images slot while every
 * other file type goes through the generic Documents API.
 * ==========================================================
 */

const client = require("./fineract.client");

const FileTypes = require("../../constants/fileTypes");

/**
 * Fineract document "name" per kyc-service file type.
 * PHOTO is intentionally absent - it never goes through
 * uploadClientDocument().
 */
const DOCUMENT_NAMES = {

    [FileTypes.SIGNATURE]: "Signature",

    [FileTypes.DOCUMENT]: "Identity Document",

    [FileTypes.ADDRESS_PROOF]: "Proof of Address",

    [FileTypes.REFERENCE_LETTER]: "Reference Letter"

};

class FineractAdapter {

    /**
     * Push a single File record's bytes onto the matching
     * Fineract client record.
     *
     * @param {String} clientId - Fineract client id (kyc-service's customerId)
     * @param {Object} file - kyc-service File document
     * @param {Buffer} buffer - file bytes read from disk
     *
     * @returns {Promise<{ resourceId: String }>}
     */
    async syncFile(clientId, file, buffer) {

        const filePart = {

            filename: file.originalName,

            mimeType: file.mimeType,

            buffer

        };

        if (file.fileType === FileTypes.PHOTO) {

            const result =
                await client.uploadClientImage(clientId, filePart);

            return {

                resourceId:
                    result?.resourceId != null
                        ? String(result.resourceId)
                        : clientId

            };

        }

        const name =
            DOCUMENT_NAMES[file.fileType] || file.fileType;

        const result =
            await client.uploadClientDocument(

                clientId,

                filePart,

                {

                    name,

                    description: file.originalName

                }

            );

        return {

            resourceId:
                result?.resourceId != null
                    ? String(result.resourceId)
                    : null

        };

    }

    /**
     * Whether Fineract's client record actually has the photo
     * slot set, independent of what kyc-service's local
     * fineractSync flag says.
     *
     * @param {String} clientId
     * @returns {Promise<Boolean>}
     */
    async isImageSynced(clientId) {

        const record = await client.getClient(clientId);

        return Boolean(record.imagePresent);

    }

    /**
     * Every document id Fineract actually holds for this
     * client, used to confirm local "synced" documents are
     * still really there.
     *
     * @param {String} clientId
     * @returns {Promise<Set<String>>}
     */
    async getSyncedDocumentIds(clientId) {

        const documents =
            await client.getClientDocuments(clientId);

        return new Set(

            (documents || []).map((document) => String(document.id))

        );

    }

}

module.exports = new FineractAdapter();
