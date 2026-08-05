const repository = require("./merchant.repository");

const {
    client: accountClient
} = require("../../integrations/account");

const {
    NotFoundError,
    ConflictError,
    BusinessRuleError
} = require("../../errors");

/**
 * Purpose value used when provisioning a merchant's settlement
 * virtual account through account-service. This is one of the
 * enum values account-service's own virtual-accounts module
 * already defines (see account-service/src/modules/virtual-accounts/
 * validators/create-virtual-account.validator.js) - reused
 * verbatim rather than invented here.
 */
const SETTLEMENT_VIRTUAL_ACCOUNT_PURPOSE = "MERCHANT_SETTLEMENT";

/**
 * Status transitions via PATCH /merchants/:id/status are only
 * legal once a merchant has already left PENDING - the initial
 * PENDING decision is made exclusively through approve/reject.
 * CLOSED is a terminal state - since it is deliberately excluded
 * from this list, a closed merchant fails the same "must already
 * be onboarded" gate every other illegal-source status fails,
 * and can never be reopened.
 */
const ONBOARDED_STATUSES = ["ACTIVE", "SUSPENDED"];

class MerchantService {

    /**
     * Create a merchant application. Ops-created for now - there
     * is no merchant self-service portal.
     */
    async createApplication(data) {

        try {

            return await repository.create({
                ...data,
                status: "PENDING"
            });

        } catch (error) {

            if (error.code === 11000) {

                throw new ConflictError(
                    "A merchant with this registration number already exists."
                );

            }

            throw error;

        }

    }

    /**
     * List merchants, optionally filtered by status and/or
     * merchantCategory.
     */
    async listMerchants({ status, merchantCategory }) {

        const filter = {};

        if (status) {

            filter.status = status;

        }

        if (merchantCategory) {

            filter.merchantCategory = merchantCategory;

        }

        return repository.find(filter);

    }

    /**
     * Resolve a single merchant by its Mongo _id.
     */
    async getMerchantById(id) {

        const merchant =
            await repository.findById(id);

        if (!merchant) {

            throw new NotFoundError(
                "Merchant not found."
            );

        }

        return merchant;

    }

    /**
     * Approve a pending merchant application. Provisions a
     * settlement virtual account against the already-existing
     * Fineract settlement account the approver supplies, via
     * account-service's internal API - merchant-service never
     * talks to Fineract directly. On success, persists what
     * account-service actually confirmed (never the client-supplied
     * settlement identifiers verbatim) plus the fee schedule, and
     * transitions the merchant straight to ACTIVE. On any failure
     * to reach account-service, or a rejected settlement account,
     * the error is surfaced and the merchant's status is left
     * untouched - the external call always happens before any
     * write to this merchant's status.
     */
    async approveMerchant(
        id,
        {
            settlementFineractAccountId,
            settlementFineractAccountNumber,
            feeSchedule
        },
        admin
    ) {

        const merchant =
            await this.getMerchantById(id);

        if (merchant.status !== "PENDING") {

            throw new BusinessRuleError(
                "Only a pending merchant application can be approved."
            );

        }

        const virtualAccount =
            await accountClient.createVirtualAccount({

                ownerType: "MERCHANT",

                ownerId: String(merchant._id),

                settlementFineractAccountId,

                settlementFineractAccountNumber,

                purpose: SETTLEMENT_VIRTUAL_ACCOUNT_PURPOSE,

                label: merchant.businessName

            });

        return repository.updateById(id, {

            status: "ACTIVE",

            settlementFineractAccountId:
                virtualAccount.settlementFineractAccountId,

            settlementFineractAccountNumber:
                virtualAccount.settlementFineractAccountNumber,

            settlementVirtualAccountNumber:
                virtualAccount.virtualAccountNumber,

            feeSchedule,

            reviewedBy: admin.username,

            reviewedAt: new Date()

        });

    }

    /**
     * Reject a pending merchant application. REJECTED is terminal
     * - use a new application for a re-submission.
     */
    async rejectMerchant(id, { rejectionReason }, admin) {

        const merchant =
            await this.getMerchantById(id);

        if (merchant.status !== "PENDING") {

            throw new BusinessRuleError(
                "Only a pending merchant application can be rejected."
            );

        }

        return repository.updateById(id, {

            status: "REJECTED",

            rejectionReason,

            reviewedBy: admin.username,

            reviewedAt: new Date()

        });

    }

    /**
     * Transition status once a merchant has already been onboarded
     * (ACTIVE/SUSPENDED). CLOSED is terminal. Re-requesting the
     * current status is rejected as a no-op, mirroring
     * account-service's virtual-account.service.js convention.
     */
    async updateStatus(id, status) {

        const merchant =
            await this.getMerchantById(id);

        if (!ONBOARDED_STATUSES.includes(merchant.status)) {

            throw new BusinessRuleError(
                "Only an active or suspended merchant's status can be changed. Use approve/reject for the initial decision."
            );

        }

        if (merchant.status === status) {

            throw new BusinessRuleError(
                `Merchant is already ${status.toLowerCase()}.`
            );

        }

        return repository.updateById(id, {
            status
        });

    }

    /**
     * Update the fee schedule. Only legal once a merchant has
     * already been onboarded (ACTIVE or SUSPENDED) - a merchant
     * must exist before its fee schedule can be changed.
     */
    async updateFeeSchedule(id, feeSchedule) {

        const merchant =
            await this.getMerchantById(id);

        if (!ONBOARDED_STATUSES.includes(merchant.status)) {

            throw new BusinessRuleError(
                "Fee schedule can only be changed for an active or suspended merchant."
            );

        }

        return repository.updateById(id, {
            feeSchedule
        });

    }

}

module.exports = new MerchantService();
