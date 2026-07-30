/**
 * ==========================================================
 * Fineract Sync Service
 * ----------------------------------------------------------
 * Pushes uploaded KYC artifacts (photo, signature, documents,
 * address proof, reference letters) onto the customer's
 * Fineract client record, tracks per-file sync state on the
 * File document, retries failures, and reconciles local
 * "synced" flags against what Fineract actually holds.
 *
 * Single-instance service (pm2 fork mode, same assumption as
 * adminSession.service.js) so an in-process setInterval sweep
 * is safe - no cross-process coordination needed.
 * ==========================================================
 */

const fs = require("node:fs/promises");
const path = require("node:path");

const env = require("../config/env");

const fileRepository = require("../repositories/file.repository");

const auditService = require("./audit.service");

const fineract = require("../integrations/fineract");

const FileTypes = require("../constants/fileTypes");

const logger = require("../utils/logger");

/**
 * audit.service.js writes to MongoDB and can itself fail
 * (validation, connectivity). Sync outcomes must never be
 * lost because the *logging* of that outcome broke, so every
 * audit write on this path goes through here instead of
 * calling auditService directly.
 */
async function logAuditSafely(entry) {

    try {

        await auditService.log(entry);

    } catch (error) {

        logger.error(
            `Failed to write audit log for ${entry.action}: ${error.message}`
        );

    }

}

/**
 * Root of the uploads directory. Resolved relative to this
 * file rather than process.cwd(), since multer writes to
 * "<kyc-service>/uploads/..." regardless of the launching
 * process's working directory.
 */
const UPLOADS_ROOT =
    path.join(__dirname, "..", "..", "uploads");

class FineractSyncService {

    /**
     * ======================================================
     * Sync One File
     * ----------------------------------------------------------
     * Never throws - always resolves with the outcome, so
     * callers on the upload path can fire this without risking
     * the upload response itself.
     * ======================================================
     *
     * @param {Object} file - a kyc-service File document
     * @returns {Promise<{ synced: Boolean, file: Object, error: String|null }>}
     */
    async syncFile(file) {

        const attempts =
            (file.fineractSync?.attempts || 0) + 1;

        try {

            const buffer =
                await fs.readFile(

                    path.join(UPLOADS_ROOT, file.path)

                );

            const result =
                await fineract.adapter.syncFile(

                    file.customerId,

                    file,

                    buffer

                );

            const updated =
                await fileRepository.updateFineractSync(

                    file._id,

                    {

                        synced: true,

                        resourceId: result.resourceId,

                        syncedAt: new Date(),

                        attempts,

                        lastAttemptAt: new Date(),

                        lastError: null

                    }

                );

            await logAuditSafely({

                customerId: file.customerId,

                module: file.fileType,

                action: "FINERACT_SYNC",

                status: "SUCCESS",

                description:
                    `${file.fileType} synced to Fineract client ${file.customerId}.`,

                metadata: {

                    fileId: file._id,

                    resourceId: result.resourceId

                }

            });

            return {

                synced: true,

                file: updated,

                error: null

            };

        } catch (error) {

            const message =
                error.message || "Fineract sync failed.";

            const updated =
                await fileRepository.updateFineractSync(

                    file._id,

                    {

                        synced: false,

                        resourceId: file.fineractSync?.resourceId || null,

                        syncedAt: file.fineractSync?.syncedAt || null,

                        attempts,

                        lastAttemptAt: new Date(),

                        lastError: message

                    }

                );

            await logAuditSafely({

                customerId: file.customerId,

                module: file.fileType,

                action: "FINERACT_SYNC",

                status: "FAILED",

                description:
                    `${file.fileType} sync to Fineract failed: ${message}`,

                metadata: {

                    fileId: file._id,

                    attempts

                }

            });

            return {

                synced: false,

                file: updated,

                error: message

            };

        }

    }

    /**
     * ======================================================
     * Retry One File
     *
     * POST /files/:fileId/sync
     * ------------------------------------------------------
     * Admin-triggered, explicit. Unlike syncFile(), this
     * surfaces failure to the caller instead of swallowing it
     * - the admin asked for this to happen now.
     * ======================================================
     */
    async retrySync(fileId) {

        const ApiError = require("../utils/ApiError");

        const file =
            await fileRepository.findById(fileId);

        if (!file) {

            throw new ApiError(
                404,
                "File not found."
            );

        }

        const result =
            await this.syncFile(file);

        if (!result.synced) {

            throw new ApiError(
                502,
                result.error || "Fineract sync failed."
            );

        }

        return result.file;

    }

    /**
     * ======================================================
     * Sync Status
     *
     * GET /customers/:customerId/documents/sync-status
     * ======================================================
     */
    async getSyncStatus(customerId) {

        const files =
            await fileRepository.findAllForCustomer(customerId);

        return files.map((file) => ({

            fileId: file._id,

            fileType: file.fileType,

            originalName: file.originalName,

            fineractSync: file.fineractSync

        }));

    }

    /**
     * ======================================================
     * Reconcile
     *
     * POST /customers/:customerId/documents/reconcile
     * ------------------------------------------------------
     * Verifies every file locally marked "synced" is still
     * actually present on Fineract's side, and demotes any
     * that have drifted so the sweep/manual retry can repair
     * them. Does not push new syncs itself - that's
     * retrySync()/the background sweep's job.
     * ======================================================
     */
    async reconcile(customerId) {

        const files =
            await fileRepository.findAllForCustomer(customerId);

        const syncedFiles =
            files.filter((file) => file.fineractSync?.synced);

        if (syncedFiles.length === 0) {

            return {

                checked: 0,

                corrected: [],

                stillSynced: 0

            };

        }

        const needsImageCheck =
            syncedFiles.some(
                (file) => file.fileType === FileTypes.PHOTO
            );

        const [imagePresent, documentIds] =
            await Promise.all([

                needsImageCheck
                    ? fineract.adapter.isImageSynced(customerId)
                    : Promise.resolve(null),

                fineract.adapter.getSyncedDocumentIds(customerId)

            ]);

        const corrected = [];

        for (const file of syncedFiles) {

            const stillPresent =
                file.fileType === FileTypes.PHOTO
                    ? imagePresent
                    : documentIds.has(String(file.fineractSync.resourceId));

            if (stillPresent) {

                continue;

            }

            await fileRepository.updateFineractSync(

                file._id,

                {

                    synced: false,

                    resourceId: file.fineractSync.resourceId,

                    syncedAt: file.fineractSync.syncedAt,

                    attempts: file.fineractSync.attempts,

                    lastAttemptAt: file.fineractSync.lastAttemptAt,

                    lastError:
                        "Reconciliation: no longer present on Fineract."

                }

            );

            await logAuditSafely({

                customerId,

                module: file.fileType,

                action: "FINERACT_RECONCILE",

                status: "FAILED",

                description:
                    `${file.fileType} marked out of sync - missing on Fineract.`,

                metadata: {

                    fileId: file._id

                }

            });

            corrected.push(String(file._id));

        }

        return {

            checked: syncedFiles.length,

            corrected,

            stillSynced: syncedFiles.length - corrected.length

        };

    }

    /**
     * ======================================================
     * Background Sweep
     * ----------------------------------------------------------
     * Retries every unsynced file below the max-attempts
     * ceiling, one at a time so Fineract isn't hammered.
     * Guarded against overlapping runs.
     * ======================================================
     */
    async sweep() {

        if (this._sweepRunning) {

            return;

        }

        this._sweepRunning = true;

        try {

            const files =
                await fileRepository.findUnsynced(
                    env.fineractSync.maxAttempts
                );

            for (const file of files) {

                await this.syncFile(file);

            }

        } catch {

            // Individual failures are already logged by syncFile();
            // a failure here means listing itself broke (e.g. a
            // transient DB hiccup) - next sweep will retry.

        } finally {

            this._sweepRunning = false;

        }

    }

}

const fineractSyncService = new FineractSyncService();

setInterval(

    () => fineractSyncService.sweep(),

    env.fineractSync.sweepIntervalMinutes * 60 * 1000

).unref();

module.exports = fineractSyncService;
