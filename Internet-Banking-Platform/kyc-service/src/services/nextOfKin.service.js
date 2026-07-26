const ApiError =
require("../utils/ApiError");

const repository =
require("../repositories/nextOfKin.repository");


class NextOfKinService {


    /**
     * Create next of kin
     */
    async create(customerId,data){


        const profile =
        await repository.findProfile(customerId);


        if(!profile){

            throw new ApiError(
                404,
                "KYC profile not found."
            );

        }


        profile.nextOfKin.push(data);


        await repository.save(profile);


        return profile.nextOfKin[
            profile.nextOfKin.length - 1
        ];

    }



    /**
     * Get next of kin list
     */
    async list(customerId){


        const profile =
        await repository.findProfile(customerId);


        if(!profile){

            throw new ApiError(
                404,
                "KYC profile not found."
            );

        }


        return profile.nextOfKin;

    }



    /**
     * Update next of kin
     */
    async update(id,data){


        const profile =
        await repository.findProfileByNextOfKinId(id);


        if(!profile){

            throw new ApiError(
                404,
                "Next of kin not found."
            );

        }


        const kin =
        profile.nextOfKin.id(id);


        Object.assign(
            kin,
            data,
            {
                updatedAt:new Date()
            }
        );


        await repository.save(profile);


        return kin;

    }



    /**
     * Delete next of kin
     */
    async remove(id){


        const profile =
        await repository.findProfileByNextOfKinId(id);


        if(!profile){

            throw new ApiError(
                404,
                "Next of kin not found."
            );

        }


        profile.nextOfKin.pull(id);


        await repository.save(profile);


    }


}


module.exports =
new NextOfKinService();