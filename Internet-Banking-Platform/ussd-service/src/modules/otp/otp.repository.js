const Otp = require("./otp.model");

class OtpRepository {

    async create(data) {

        return Otp.create(data);

    }

    async find(
        referenceId,
        channel
    ) {

        return Otp.findOne({

            referenceId,

            channel

        });

    }

    async incrementAttempts(
        id
    ) {

        return Otp.findByIdAndUpdate(

            id,

            {

                $inc: {

                    attempts: 1

                }

            },

            {

                new: true

            }

        );

    }

    async markVerified(
        id
    ) {

        return Otp.findByIdAndUpdate(

            id,

            {

                verified: true,

                verifiedAt:
                    new Date()

            },

            {

                new: true

            }

        );

    }

    /**
     * Upsert keyed on {referenceId, channel} - re-requesting an
     * OTP for the same enrollment overwrites the prior one rather
     * than accumulating rows.
     */
    async replace(
        referenceId,
        channel,
        data
    ) {

        return Otp.findOneAndUpdate(

            {

                referenceId,

                channel

            },

            data,

            {

                upsert: true,

                new: true,

                runValidators: true

            }

        );

    }

    async deleteByReferenceId(
        referenceId
    ) {

        return Otp.deleteMany({

            referenceId

        });

    }

}

module.exports =
    new OtpRepository();
