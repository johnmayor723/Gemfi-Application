const Beneficiary = require("./beneficiary.model");

class BeneficiaryRepository {

    /**
     * Create a beneficiary.
     */
    async create(data) {

        return Beneficiary.create(data);

    }

    /**
     * Find by ID.
     */
    async findById(id) {

        return Beneficiary.findById(id);

    }

    /**
     * Find an existing beneficiary for the same user/account/bank.
     */
    async findDuplicate(userId, accountNumber, bankCode) {

        return Beneficiary.findOne({
            userId,
            accountNumber,
            bankCode: bankCode || null
        });

    }

    /**
     * Find paginated beneficiaries for a user, newest first.
     */
    async findByUserId(
        userId,
        {
            page = 1,
            limit = 20,
            favorite
        } = {}
    ) {

        const filter = {
            userId
        };

        if (favorite !== undefined) {

            filter.isFavorite = favorite;

        }

        return Beneficiary
            .find(filter)
            .sort({
                createdAt: -1
            })
            .skip((page - 1) * limit)
            .limit(limit);

    }

    /**
     * Count beneficiaries for a user.
     */
    async countByUserId(userId, { favorite } = {}) {

        const filter = {
            userId
        };

        if (favorite !== undefined) {

            filter.isFavorite = favorite;

        }

        return Beneficiary.countDocuments(filter);

    }

    /**
     * Update nickname/isFavorite only.
     */
    async update(id, data) {

        return Beneficiary.findByIdAndUpdate(
            id,
            data,
            {
                new: true,
                runValidators: true
            }
        );

    }

    /**
     * Delete by ID.
     */
    async delete(id) {

        return Beneficiary.findByIdAndDelete(id);

    }

}

module.exports = new BeneficiaryRepository();
