const repository = require("./beneficiary.repository");

const { client: accountClient } = require("../../integrations/account");

const {
    NotFoundError,
    AuthorizationError,
    ConflictError
} = require("../../errors");

class BeneficiaryService {

    /**
     * ==========================================================
     * Create Beneficiary
     * ==========================================================
     *
     * Same-bank beneficiaries are verified against Account
     * Service and their accountName is auto-filled from there
     * (never trusted from the request body). Other-bank
     * beneficiaries can't be verified — no bank directory or
     * real NIBSS lookup exists in this platform yet — so
     * accountName/bankName are stored as supplied.
     */
    async create(user, data, request = {}) {

        const {
            accountNumber,
            bankCode,
            bankName,
            accountName,
            nickname
        } = data;

        const type =
            bankCode ? "OTHER_BANK" : "SAME_BANK";

        const existing =
            await repository.findDuplicate(
                user.userId,
                accountNumber,
                bankCode
            );

        if (existing) {

            throw new ConflictError(
                "This beneficiary has already been saved."
            );

        }

        let resolvedAccountName = accountName;

        let resolvedBankName = bankName || null;

        if (type === "SAME_BANK") {

            const account =
                await accountClient.getAccount(
                    accountNumber,
                    { correlationId: request.correlationId }
                );

            resolvedAccountName = account.displayName;

            resolvedBankName = null;

        }

        const beneficiary =
            await repository.create({

                userId:
                    user.userId,

                accountNumber,

                bankCode:
                    bankCode || null,

                bankName:
                    resolvedBankName,

                accountName:
                    resolvedAccountName,

                nickname:
                    nickname || null,

                type

            });

        return this.toPublicShape(beneficiary);

    }

    /**
     * ==========================================================
     * Update Beneficiary
     * ==========================================================
     *
     * Only nickname/isFavorite can change — accountNumber/bankCode
     * are immutable (delete + recreate to change the underlying
     * account, so it goes through verification again).
     */
    async update(user, id, { nickname, isFavorite }) {

        await this.getOwned(user, id);

        const data = {};

        if (nickname !== undefined) {

            data.nickname = nickname;

        }

        if (isFavorite !== undefined) {

            data.isFavorite = isFavorite;

        }

        const updated =
            await repository.update(id, data);

        return this.toPublicShape(updated);

    }

    /**
     * ==========================================================
     * Remove Beneficiary
     * ==========================================================
     */
    async remove(user, id) {

        await this.getOwned(user, id);

        await repository.delete(id);

        return {
            deleted: true
        };

    }

    /**
     * ==========================================================
     * Get / List
     * ==========================================================
     */
    async getOwned(user, id) {

        const beneficiary =
            await repository.findById(id);

        if (!beneficiary) {

            throw new NotFoundError(
                "Beneficiary not found."
            );

        }

        if (beneficiary.userId !== user.userId) {

            throw new AuthorizationError(
                "This beneficiary does not belong to you."
            );

        }

        return beneficiary;

    }

    async getById(user, id) {

        const beneficiary =
            await this.getOwned(user, id);

        return this.toPublicShape(beneficiary);

    }

    async list(user, { page, limit, favorite }) {

        const [
            beneficiaries,
            total
        ] = await Promise.all([

            repository.findByUserId(
                user.userId,
                { page, limit, favorite }
            ),

            repository.countByUserId(
                user.userId,
                { favorite }
            )

        ]);

        return {

            beneficiaries:
                beneficiaries.map(
                    (beneficiary) => this.toPublicShape(beneficiary)
                ),

            pagination: {
                page,
                limit,
                total
            }

        };

    }

    toPublicShape(beneficiary) {

        return {

            id: beneficiary.id,

            accountNumber: beneficiary.accountNumber,

            bankCode: beneficiary.bankCode,

            bankName: beneficiary.bankName,

            accountName: beneficiary.accountName,

            nickname: beneficiary.nickname,

            type: beneficiary.type,

            isFavorite: beneficiary.isFavorite,

            createdAt: beneficiary.createdAt

        };

    }

}

module.exports = new BeneficiaryService();
