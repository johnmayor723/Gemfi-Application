const AuthUser = require("./auth.model");

class AuthRepository {

    /**
     * Create a new Internet Banking user.
     */
    async create(data) {
        return AuthUser.create(data);
    }

    /**
     * Find by Mongo ID.
     */
    async findById(id) {
        return AuthUser.findById(id);
    }

    /**
     * Find by external account number.
     */
    async findByAccountNumber(accountNumber) {
        return AuthUser.findOne({
            accountNumber
        });
    }

    /**
     * Find by client ID.
     */
    async findByClientId(clientId) {
        return AuthUser.findOne({
            clientId
        });
    }

    /**
     * Find by username.
     */
    async findByUsername(username) {
        return AuthUser.findOne({
            username: username.toLowerCase()
        });
    }

    /**
     * Find by email.
     */
    async findByEmail(email) {
        return AuthUser.findOne({
            email: email.toLowerCase()
        });
    }

    /**
     * Find by phone number.
     */
    async findByPhoneNumber(phoneNumber) {
        return AuthUser.findOne({
            phoneNumber
        });
    }

    /**
     * Find user by login identifier.
     * Supports:
     *  - username
     *  - email
     *  - external account number
     */
    async findByIdentifier(identifier) {

        return AuthUser.findOne({
            $or: [
                {
                    username:
                        identifier.toLowerCase()
                },
                {
                    email:
                        identifier.toLowerCase()
                },
                {
                    accountNumber:
                        identifier
                }
            ]
        });

    }

    /**
     * Update by Mongo ID.
     */
    async update(id, updateData) {

        return AuthUser.findByIdAndUpdate(
            id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

    }

    /**
     * Update by account number.
     */
    async updateByAccountNumber(
        accountNumber,
        updateData
    ) {

        return AuthUser.findOneAndUpdate(
            {
                accountNumber
            },
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

    }

    /**
     * Delete by ID.
     */
    async delete(id) {
        return AuthUser.findByIdAndDelete(id);
    }

    /**
     * Check username availability.
     */
    async existsByUsername(username) {

        return AuthUser.exists({
            username:
                username.toLowerCase()
        });

    }

    /**
     * Check account registration.
     */
    async existsByAccountNumber(accountNumber) {

        return AuthUser.exists({
            accountNumber
        });

    }

    /**
     * Check email.
     */
    async existsByEmail(email) {

        return AuthUser.exists({
            email:
                email.toLowerCase()
        });

    }

    /**
     * Check phone.
     */
    async existsByPhoneNumber(phoneNumber) {

        return AuthUser.exists({
            phoneNumber
        });

    }

    /**
     * Update last login.
     */
    async updateLastLogin(id) {

        return AuthUser.findByIdAndUpdate(
            id,
            {
                lastLoginAt: new Date(),
                failedLoginAttempts: 0,
                lockedUntil: null
            },
            {
                new: true
            }
        );

    }

    /**
     * Increment failed login attempts.
     */
    async incrementFailedAttempts(id) {

        return AuthUser.findByIdAndUpdate(
            id,
            {
                $inc: {
                    failedLoginAttempts: 1
                }
            },
            {
                new: true
            }
        );

    }

    /**
     * Lock account.
     */
    async lockAccount(
        id,
        lockedUntil
    ) {

        return AuthUser.findByIdAndUpdate(
            id,
            {
                status: "LOCKED",
                lockedUntil
            },
            {
                new: true
            }
        );

    }

    /**
     * Unlock account.
     */
    async unlockAccount(id) {

        return AuthUser.findByIdAndUpdate(
            id,
            {
                status: "ACTIVE",
                failedLoginAttempts: 0,
                lockedUntil: null
            },
            {
                new: true
            }
        );

    }

}

module.exports = new AuthRepository();
