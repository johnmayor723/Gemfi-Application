const VirtualAccountMapping = require("./virtual-account.model");

class VirtualAccountRepository {

    /**
     * Create a new virtual account mapping.
     */
    async create(data) {

        return VirtualAccountMapping.create(data);

    }

    /**
     * Find by virtual account number.
     */
    async findByVirtualAccountNumber(virtualAccountNumber) {

        return VirtualAccountMapping.findOne({
            virtualAccountNumber
        });

    }

    /**
     * Check if a virtual account number already exists.
     */
    async existsByVirtualAccountNumber(virtualAccountNumber) {

        return VirtualAccountMapping.exists({
            virtualAccountNumber
        });

    }

    /**
     * List mappings, optionally filtered by owner.
     */
    async findByOwner(filter) {

        return VirtualAccountMapping.find(filter)
            .sort({
                createdAt: -1
            });

    }

    /**
     * Transition status by virtual account number.
     */
    async updateStatusByVirtualAccountNumber(
        virtualAccountNumber,
        status
    ) {

        return VirtualAccountMapping.findOneAndUpdate(

            {
                virtualAccountNumber
            },

            {
                status
            },

            {
                new: true,
                runValidators: true
            }

        );

    }

}

module.exports = new VirtualAccountRepository();
