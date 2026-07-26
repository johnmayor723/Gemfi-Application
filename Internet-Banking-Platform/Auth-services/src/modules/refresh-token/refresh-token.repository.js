const RefreshToken =
    require("./refresh-token.model");

class RefreshTokenRepository {

    /**
     * ==========================================================
     * Create
     * ==========================================================
     */
    async create(data) {

        return RefreshToken.create(data);

    }

    /**
     * ==========================================================
     * Find By Token Hash
     * ==========================================================
     */
    async findByTokenHash(tokenHash) {

        return RefreshToken.findOne({
            tokenHash
        });

    }

    /**
     * ==========================================================
     * Find By User ID
     * ==========================================================
     */
    async findByUserId(userId) {

        return RefreshToken
            .find({
                userId
            })
            .sort({
                createdAt: -1
            });

    }

    /**
     * ==========================================================
     * Find By Device
     * ==========================================================
     */
    async findByDevice(
        userId,
        deviceId
    ) {

        return RefreshToken.findOne({

            userId,

            deviceId

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

        return RefreshToken.findByIdAndUpdate(

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
     * Delete By ID
     * ==========================================================
     */
    async delete(id) {

        return RefreshToken.findByIdAndDelete(
            id
        );

    }

    /**
     * ==========================================================
     * Delete By Token Hash
     * ==========================================================
     */
    async deleteByTokenHash(
        tokenHash
    ) {

        return RefreshToken.findOneAndDelete({

            tokenHash

        });

    }

    /**
     * ==========================================================
     * Delete User Device
     * ==========================================================
     */
    async deleteByDevice(
        userId,
        deviceId
    ) {

        return RefreshToken.findOneAndDelete({

            userId,

            deviceId

        });

    }

    /**
     * ==========================================================
     * Delete All User Tokens
     * ==========================================================
     */
    async deleteByUserId(
        userId
    ) {

        return RefreshToken.deleteMany({

            userId

        });

    }

    /**
     * ==========================================================
     * Count Active Sessions
     * ==========================================================
     */
    async countByUserId(
        userId
    ) {

        return RefreshToken.countDocuments({

            userId

        });

    }

    /**
     * ==========================================================
     * Remove Expired
     * ==========================================================
     *
     * Normally handled automatically
     * by MongoDB TTL index.
     */
    async removeExpired() {

        return RefreshToken.deleteMany({

            expiresAt: {
                $lt: new Date()
            }

        });

    }

}

module.exports =
    new RefreshTokenRepository();