const repository = require("../repositories/kyc.repository");

class KycAggregateService {

    async build(customerId) {

        const profile =
            await repository.findByCustomerId(customerId);

        if (!profile) {

            return null;

        }

        return {

            customerId: profile.customerId,

            kycLevel: profile.kycLevel,

            status: profile.status,

            bvn: null,

            nin: null,

            documents: [],

            photo: null,

            signature: null,

            address: null,

            references: []

        };

    }

}

module.exports = new KycAggregateService();