/**
 * ==========================================================
 * File Repository
 * ----------------------------------------------------------
 * Handles all MongoDB operations for uploaded files.
 *
 * Responsibilities:
 *  - Create
 *  - Find
 *  - Update
 *  - Soft Delete
 *
 * No business logic belongs here.
 * ==========================================================
 */

const File = require("../models/File");
const FileTypes = require("../constants/fileTypes");
const fileTypes = require("../constants/fileTypes");

class FileRepository {

    /**
     * Create a new file record.
     *
     * @param {Object} payload
     * @returns {Promise<Object>}
     */
    async create(payload) {

        return File.create(payload);

    }

    /**
     * Find file by MongoDB ID.
     *
     * @param {String} id
     * @returns {Promise<Object>}
     */
    async findById(id) {

        return File.findOne({

            _id: id,

            deleted: false

        });

    }

    /**
     * Get latest uploaded file for a customer.
     *
     * @param {String} customerId
     * @param {String} fileType
     * @returns {Promise<Object>}
     */
    async findLatest(customerId, fileType) {

        return File.findOne({

            customerId,

            fileType,

            deleted: false

        })

        .sort({

            createdAt: -1

        });

    }

    /**
     * ======================================================
     * Return every uploaded DOCUMENT.
     * ======================================================
     */
    async findDocuments(customerId) {

        return File.find({

            customerId,

            fileType: fileTypes.DOCUMENT,

            deleted: false

        })

        .sort({

            createdAt: -1

        });

    }

    /**
     * ======================================================
     * Find one document.
     * ======================================================
     */
    async findDocument(documentId) {

        return File.findOne({

            _id: documentId,

            fileType: "DOCUMENT",

            deleted: false

        });

    }

    /**
     * ======================================================
     * Soft delete.
     * ======================================================
     */
    async softDelete(id) {

        return File.findByIdAndUpdate(

            id,

            {

                deleted: true

            },

            {

                new: true

            }

        );

    }

}

module.exports = new FileRepository();