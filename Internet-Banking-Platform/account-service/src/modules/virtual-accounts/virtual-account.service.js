const repository = require("./virtual-account.repository");
const generator = require("./virtual-account-number.generator");

const accountRepository = require("../accounts/account.repository");

const {
    adapter: fineract
} = require("../../integrations/fineract");

const {
    NotFoundError,
    ConflictError,
    BusinessRuleError
} = require("../../errors");

/**
 * CLOSED is a terminal state - a closed virtual account can
 * never be reopened.
 */
const TERMINAL_STATUS = "CLOSED";

class VirtualAccountService {

    /**
     * Provision a virtual account number that resolves to an
     * existing, real Fineract settlement account.
     *
     * The caller may identify the settlement account either by
     * its Fineract savings account id or by its Fineract account
     * number - whichever is supplied, the underlying Fineract
     * account is re-verified before a virtual account number is
     * ever generated, the same way ../accounts/account.service.js
     * verifies a Fineract account before mapping it.
     */
    async createVirtualAccount({

        ownerType,

        ownerId,

        settlementFineractAccountId,

        settlementFineractAccountNumber,

        purpose,

        label,

        metadata

    }) {

        const resolvedFineractAccountId =
            settlementFineractAccountId ||
            await this._resolveFineractAccountIdFromNumber(
                settlementFineractAccountNumber
            );

        const account =
            await this._getVerifiedFineractAccount(
                resolvedFineractAccountId
            );

        const virtualAccountNumber =
            await generator.generate();

        const payload = {

            virtualAccountNumber,

            ownerType,

            ownerId,

            settlementFineractAccountId:
                account.id,

            settlementFineractAccountNumber:
                account.accountNo,

            purpose,

            status: "ACTIVE",

            label:
                label || null,

            metadata:
                metadata || null

        };

        try {

            return await repository.create(payload);

        } catch (error) {

            /**
             * Extremely unlikely given the generator's own
             * uniqueness loop, but guards the last mile against
             * a concurrent request generating the same number
             * in the window between the loop's check and this
             * insert.
             */
            if (error.code === 11000) {

                throw new ConflictError(
                    "Virtual account number generation collided. Please retry."
                );

            }

            throw error;

        }

    }

    /**
     * Resolve a settlement Fineract account id from a Fineract
     * account number, using the account mapping this service
     * already owns rather than inventing a new Fineract lookup.
     */
    async _resolveFineractAccountIdFromNumber(
        settlementFineractAccountNumber
    ) {

        const mapping =
            await accountRepository.findByFineractAccountNumber(
                settlementFineractAccountNumber
            );

        if (!mapping) {

            throw new NotFoundError(
                "Settlement Fineract account not found."
            );

        }

        return mapping.fineractAccountId;

    }

    /**
     * Confirm the settlement Fineract account actually exists,
     * reusing the same Fineract adapter call
     * ../accounts/account.service.js already uses to validate an
     * account before mapping it.
     */
    async _getVerifiedFineractAccount(fineractAccountId) {

        try {

            return await fineract.getAccount(
                fineractAccountId
            );

        } catch (error) {

            if (error instanceof NotFoundError) {

                throw new NotFoundError(
                    "Settlement Fineract account not found."
                );

            }

            throw error;

        }

    }

    /**
     * Resolve a single mapping by its virtual account number.
     */
    async getByVirtualAccountNumber(virtualAccountNumber) {

        const mapping =
            await repository.findByVirtualAccountNumber(
                virtualAccountNumber
            );

        if (!mapping) {

            throw new NotFoundError(
                "Virtual account mapping not found."
            );

        }

        return mapping;

    }

    /**
     * List mappings, optionally filtered by owner.
     */
    async listByOwner({ ownerType, ownerId }) {

        const filter = {};

        if (ownerType) {

            filter.ownerType = ownerType;

        }

        if (ownerId) {

            filter.ownerId = ownerId;

        }

        return repository.findByOwner(filter);

    }

    /**
     * Transition status. CLOSED is terminal - it can never be
     * reopened. Re-requesting the current status is rejected as
     * a no-op, mirroring
     * transaction-service's standing-order.service.js "already X"
     * convention.
     */
    async updateStatus(virtualAccountNumber, status) {

        const mapping =
            await this.getByVirtualAccountNumber(
                virtualAccountNumber
            );

        if (mapping.status === TERMINAL_STATUS) {

            throw new BusinessRuleError(
                "Virtual account is closed and cannot be reopened."
            );

        }

        if (mapping.status === status) {

            throw new BusinessRuleError(
                `Virtual account is already ${status.toLowerCase()}.`
            );

        }

        return repository.updateStatusByVirtualAccountNumber(
            virtualAccountNumber,
            status
        );

    }

}

module.exports = new VirtualAccountService();
