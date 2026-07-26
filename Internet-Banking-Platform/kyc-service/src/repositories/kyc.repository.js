const KycProfile = require("../models/KycProfile");

class KycRepository {

    async create(profile) {

        return KycProfile.create(profile);

    }

    async findByCustomerId(customerId) {

        return KycProfile.findOne({
            customerId
        });

    }

    async update(customerId, updates) {

        return KycProfile.findOneAndUpdate(
            {
                customerId
            },
            updates,
            {
                new: true
            }
        );

    }

}

module.exports = new KycRepository();