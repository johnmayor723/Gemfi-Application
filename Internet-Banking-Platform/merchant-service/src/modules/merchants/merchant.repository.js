const Merchant = require("./merchant.model");

class MerchantRepository {

    /**
     * Create a new merchant application.
     */
    async create(data) {

        return Merchant.create(data);

    }

    /**
     * Find by Mongo _id.
     */
    async findById(id) {

        return Merchant.findById(id);

    }

    /**
     * List merchants, optionally filtered by status/category.
     */
    async find(filter) {

        return Merchant.find(filter)
            .sort({
                createdAt: -1
            });

    }

    /**
     * Update by Mongo _id.
     */
    async updateById(id, update) {

        return Merchant.findByIdAndUpdate(

            id,

            update,

            {
                new: true,
                runValidators: true
            }

        );

    }

}

module.exports = new MerchantRepository();
