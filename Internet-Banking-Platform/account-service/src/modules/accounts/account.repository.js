const AccountMapping = require("./account.model");

class AccountRepository {

    /**
     * Create a new account mapping.
     */
    async create(data) {

        return AccountMapping.create(data);

    }

    /**
     * Find by external account number.
     */
    async findByAccountNumber(accountNumber) {

        return AccountMapping.findOne({
            accountNumber
        });

    }

    /**
     * Find by Fineract Savings Account ID.
     */
    async findByFineractAccountId(fineractAccountId) {

        return AccountMapping.findOne({
            fineractAccountId
        });

    }

    /**
     * Find by Fineract Account Number.
     */
    async findByFineractAccountNumber(fineractAccountNumber) {

        return AccountMapping.findOne({
            fineractAccountNumber
        });

    }

    /**
     * Find all accounts belonging to a client.
     */
    async findByClientId(clientId) {

        return AccountMapping.find({
            clientId
        });

    }

    /**
     * Find by email.
     */
    async findByEmail(email) {

        return AccountMapping.findOne({
            email: email.toLowerCase()
        });

    }

    /**
     * Find by phone number.
     */
    async findByPhoneNumber(phoneNumber) {

        return AccountMapping.findOne({
            phoneNumber
        });

    }

    /**
     * Get all account mappings.
     */
    async findAll() {

        return AccountMapping.find()
            .sort({
                createdAt: -1
            });

    }

    /**
     * Update by MongoDB ID.
     */
    async update(id, updateData) {

        return AccountMapping.findByIdAndUpdate(

            id,

            updateData,

            {
                new: true,
                runValidators: true
            }

        );

    }

    /**
     * Update by Fineract Account ID.
     */
    async updateByFineractAccountId(
        fineractAccountId,
        updateData
    ) {

        return AccountMapping.findOneAndUpdate(

            {
                fineractAccountId
            },

            updateData,

            {
                new: true,
                runValidators: true
            }

        );

    }

    /**
     * Delete by MongoDB ID.
     */
    async delete(id) {

        return AccountMapping.findByIdAndDelete(id);

    }

    /**
     * Delete by Fineract Account ID.
     */
    async deleteByFineractAccountId(
        fineractAccountId
    ) {

        return AccountMapping.findOneAndDelete({

            fineractAccountId

        });

    }

    /**
     * Check if external account number exists.
     */
    async existsByAccountNumber(accountNumber) {

        return AccountMapping.exists({

            accountNumber

        });

    }

    /**
     * Check if Fineract Account ID exists.
     */
    async existsByFineractAccountId(
        fineractAccountId
    ) {

        return AccountMapping.exists({

            fineractAccountId

        });

    }

    /**
     * Check if Fineract Account Number exists.
     */
    async existsByFineractAccountNumber(
        fineractAccountNumber
    ) {

        return AccountMapping.exists({

            fineractAccountNumber

        });

    }

    /**
     * Check if email exists.
     */
    async existsByEmail(email) {

        return AccountMapping.exists({

            email: email.toLowerCase()

        });

    }

    /**
     * Check if phone number exists.
     */
    async existsByPhoneNumber(phoneNumber) {

        return AccountMapping.exists({

            phoneNumber

        });

    }

    /**
     * Count all account mappings.
     */
    async count() {

        return AccountMapping.countDocuments();

    }

}

module.exports = new AccountRepository();