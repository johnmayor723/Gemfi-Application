const KycProfile =
require("../models/KycProfile");


class NextOfKinRepository {


    async findProfile(customerId){

        return KycProfile.findOne({
            customerId
        });

    }


    async save(profile){

        return profile.save();

    }


}


module.exports =
new NextOfKinRepository();