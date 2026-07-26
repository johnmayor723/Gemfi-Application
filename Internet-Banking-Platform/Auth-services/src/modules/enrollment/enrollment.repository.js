const Enrollment =
    require("./enrollment.model");

class EnrollmentRepository {

    /**
     * ==========================================================
     * Create Enrollment
     * ==========================================================
     */
    async create(data) {

        return Enrollment.create(
            data
        );

    }

    /**
     * ==========================================================
     * Find By Account Number
     * ==========================================================
     */
    async findByAccountNumber(
        accountNumber
    ) {

        return Enrollment.findOne({

            accountNumber

        });

    }

    /**
     * ==========================================================
     * Find By Client ID
     * ==========================================================
     */
    async findByClientId(
        clientId
    ) {

        return Enrollment.findOne({

            clientId

        });

    }


    /**
     * Find Enrollment By ID
     */
    async findById(id) {

        return Enrollment.findById(id);

    }

    /**
     * ==========================================================
     * Find By Email
     * ==========================================================
     */
    async findByEmail(
        email
    ) {

        return Enrollment.findOne({

            email:
                email.toLowerCase()

        });

    }

    /**
     * ==========================================================
     * Update
     * ==========================================================
     */
    async update(
        id,
        updateData
    ) {

        return Enrollment.findByIdAndUpdate(

            id,

            updateData,

            {

                new: true,

                runValidators: true

            }

        );

    }

    /**
     * ==========================================================
     * Mark Verified
     * ==========================================================
     */
    async markVerified(
        id
    ) {

        return Enrollment.findByIdAndUpdate(

            id,

            {

                status:
                    "VERIFIED",

                verifiedAt:
                    new Date()

            },

            {

                new: true

            }

        );

    }

    /**
     * ==========================================================
     * Delete By ID
     * ==========================================================
     */
    async delete(
        id
    ) {

        return Enrollment.findByIdAndDelete(
            id
        );

    }

    /**
     * ==========================================================
     * Delete By Account Number
     * ==========================================================
     */
    async deleteByAccountNumber(
        accountNumber
    ) {

        return Enrollment.findOneAndDelete({

            accountNumber

        });

    }

    /**
     * ==========================================================
     * Exists By Account Number
     * ==========================================================
     */
    async existsByAccountNumber(
        accountNumber
    ) {

        return Enrollment.exists({

            accountNumber

        });

    }

}

module.exports =
    new EnrollmentRepository();
