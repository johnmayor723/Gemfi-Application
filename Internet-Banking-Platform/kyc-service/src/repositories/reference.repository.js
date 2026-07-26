const KycProfile =
require("../models/kycProfile");


class ReferenceRepository {


    async findProfile(customerId){

        return KycProfile.findOne({

            customerId

        });

    }


    async findProfileByReferenceId(id){

        return KycProfile.findOne({

            "references._id":id

        });

    }


    async save(profile){

        return profile.save();

    }


}


module.exports =
new ReferenceRepository();