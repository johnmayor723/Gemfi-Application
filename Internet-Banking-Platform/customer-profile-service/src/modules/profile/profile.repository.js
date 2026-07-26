const ProfilePreference = require("./profile.model");

class ProfileRepository {

    /**
     * Find preferences by client id.
     */
    async findByClientId(clientId) {

        return ProfilePreference.findOne({
            clientId
        });

    }

    /**
     * Create or update preferences for a client id.
     */
    async upsert(clientId, data) {

        return ProfilePreference.findOneAndUpdate(

            {
                clientId
            },

            {
                $set: data
            },

            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true,
                runValidators: true
            }

        );

    }

}

module.exports = new ProfileRepository();
