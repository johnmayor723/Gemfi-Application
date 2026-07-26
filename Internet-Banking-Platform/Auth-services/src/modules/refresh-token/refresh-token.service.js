const crypto = require("crypto");

const repository =
    require("./refresh-token.repository");

const config =
    require("../../config/app.config");    

class RefreshTokenService {

    /**
     * ==========================================================
     * Generate Secure Random Refresh Token
     * ==========================================================
     */
    generateToken() {

        return crypto
            .randomBytes(64)
            .toString("hex");

    }

    /**
     * ==========================================================
     * SHA-256 Hash
     * ==========================================================
     */
    hash(token) {

        return crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

    }

    /**
     * ==========================================================
     * Create Refresh Token
     * ==========================================================
     */
    async create(user, request) {

        const token =
            this.generateToken();

        const tokenHash =
            this.hash(token);

        const expiresAt =
    new Date(

        Date.now()

        +

        (

            config.auth.jwt.refreshTokenDays

            *

            24

            *

            60

            *

            60

            *

            1000

        )

    );

        await repository.create({

            userId:
                user._id || user.id,

            tokenHash,

            deviceId:
                request.headers[
                    "x-device-id"
                ] || null,

            deviceName:
                request.headers[
                    "x-device-name"
                ] || null,

            ipAddress:
                request.ip,

            userAgent:
                request.get(
                    "user-agent"
                ),

            expiresAt

        });

        return token;

    }

    /**
     * ==========================================================
     * Validate Refresh Token
     * ==========================================================
     */
    async validate(token) {

        const tokenHash =
            this.hash(token);

        const session =
            await repository.findByTokenHash(
                tokenHash
            );

        if (!session) {

            return null;

        }

        if (
            session.expiresAt <
            new Date()
        ) {

            await repository.delete(
                session.id
            );

            return null;

        }

        return session;

    }

    /**
     * ==========================================================
     * Rotate Refresh Token
     * ==========================================================
     */
    async rotate(
        token,
        request
    ) {

        const session =
            await this.validate(
                token
            );

        if (!session) {

            return null;

        }

        await repository.delete(
            session.id
        );

        return this.create(

            {
                id:
                    session.userId
            },

            request

        );

    }

    /**
     * ==========================================================
     * Logout Current Device
     * ==========================================================
     */
    async revoke(token) {

        const tokenHash =
            this.hash(token);

        await repository.deleteByTokenHash(
            tokenHash
        );

    }

    /**
     * ==========================================================
     * Logout Specific Device
     * ==========================================================
     */
    async revokeDevice(
        userId,
        deviceId
    ) {

        await repository.deleteByDevice(

            userId,

            deviceId

        );

    }

    /**
     * ==========================================================
     * Logout Everywhere
     * ==========================================================
     */
    async revokeAll(
        userId
    ) {

        await repository.deleteByUserId(
            userId
        );

    }

    /**
     * ==========================================================
     * Active Sessions
     * ==========================================================
     */
    async getSessions(
        userId
    ) {

        return repository.findByUserId(
            userId
        );

    }

    /**
     * ==========================================================
     * Active Session Count
     * ==========================================================
     */
    async countSessions(
        userId
    ) {

        return repository.countByUserId(
            userId
        );

    }

}

module.exports =
    new RefreshTokenService();