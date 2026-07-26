const ApiError =
require("../utils/ApiError");


const repository =
require("../repositories/reference.repository");


const fileService =
require("./file.service");


const FileTypes =
require("../constants/fileTypes");



class ReferenceService {


    /**
     * Create account reference
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


        if(!profile.references){

            profile.references=[];

        }


        profile.references.push(data);


        await repository.save(profile);


        return profile.references[
            profile.references.length-1
        ];

    }



    /**
     * List references
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


        return profile.references || [];

    }



    /**
     * Update reference
     */
    async update(id,data){


        const profile =
        await repository.findProfileByReferenceId(id);


        if(!profile){

            throw new ApiError(
                404,
                "Reference not found."
            );

        }


        const reference =
        profile.references.id(id);



        Object.assign(

            reference,

            data,

            {
                updatedAt:new Date()
            }

        );


        await repository.save(profile);


        return reference;

    }



    /**
     * Delete reference
     */
    async remove(id){


        const profile =
        await repository.findProfileByReferenceId(id);


        if(!profile){

            throw new ApiError(
                404,
                "Reference not found."
            );

        }


        profile.references.pull(id);


        await repository.save(profile);

    }



    /**
     * Upload reference letter
     */
    async uploadLetter(customerId,id,file){


        const savedFile =
        await fileService.uploadFile(

            customerId,

            FileTypes.REFERENCE_LETTER,

            file

        );


        const profile =
        await repository.findProfileByReferenceId(id);



        const reference =
        profile.references.id(id);



        reference.letterFileId =
        savedFile._id;



        await repository.save(profile);


        return savedFile;

    }


}


module.exports =
new ReferenceService();