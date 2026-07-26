/**
 * ==========================================================
 * BVN Repository
 * ==========================================================
 */

const BVN = require("../models/bvn.model");

class BVNRepository {

    async create(payload) {

        return BVN.create(payload);

    }

    async findByCustomerId(customerId) {

        return BVN.findOne({

            customerId

        });

    }

    async update(customerId, payload) {

        return BVN.findOneAndUpdate(

            { customerId },

            payload,

            {

                new: true,

                upsert: true

            }

        );

    }

}

module.exports = new BVNRepository();