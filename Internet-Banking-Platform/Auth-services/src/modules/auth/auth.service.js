const enrollmentService =
    require("../enrollment/enrollment.service");

const otpService =
    require("../otp/otp.service");

const authRepository =
    require("./auth.repository");

const jwtService =
    require("./jwt.service");

const passwordService =
    require("./password.service");

const refreshTokenService =
    require("../refresh-token/refresh-token.service");

const auditService =
    require("../audit/audit.service");

const {
    AUDIT_EVENTS,
    AUDIT_STATUS
} = require("../../constants/audit-event.constants");

const config =
    require("../../config/app.config");

const { logger } =
    require("../../config");

const {
    AuthenticationError,
    NotFoundError
} = require("../../errors");

class AuthService {

    /**
     * Register Internet Banking user after verified enrollment.
     */
    async register(data, request) {
        return enrollmentService.complete(
            data,
            request
        );
    }

    /**
     * ==========================================================
     * Login
     * ==========================================================
     */
    async login(
        data,
        request
    ) {

        const {
            identifier,
            password
        } = data;

        try {

            const user =
                await authRepository.findByIdentifier(
                    identifier
                );

            if (!user) {

                throw new AuthenticationError(
                    "Invalid credentials."
                );

            }

            if (user.status === "LOCKED") {

                if (
                    user.lockedUntil &&
                    user.lockedUntil > new Date()
                ) {

                    throw new AuthenticationError(
                        "Account is locked. Please try again later."
                    );

                }

                await authRepository.unlockAccount(
                    user.id
                );

                user.status = "ACTIVE";
                user.failedLoginAttempts = 0;

            }

            if (user.status !== "ACTIVE") {

                throw new AuthenticationError(
                    "Account is not active."
                );

            }

            const passwordValid =
                await passwordService.verify(
                    password,
                    user.passwordHash
                );

            if (!passwordValid) {

                const updated =
                    await authRepository.incrementFailedAttempts(
                        user.id
                    );

                const maxAttempts =
                    config.auth.security.maxLoginAttempts;

                if (updated.failedLoginAttempts >= maxAttempts) {

                    const lockedUntil =
                        new Date(
                            Date.now() +
                            (
                                config.auth.security.accountLockMinutes *
                                60 *
                                1000
                            )
                        );

                    await authRepository.lockAccount(
                        user.id,
                        lockedUntil
                    );

                }

                throw new AuthenticationError(
                    "Invalid credentials."
                );

            }

            await authRepository.updateLastLogin(
                user.id
            );

            const accessToken =
                jwtService.generateAccessToken(user);

            const refreshToken =
                await refreshTokenService.create(
                    user,
                    request
                );

            await auditService.log({

                eventType:
                    AUDIT_EVENTS.LOGIN_SUCCESS,

                userId:
                    user.id,

                identifier,

                accountNumber:
                    user.accountNumber,

                request

            });

            logger.info(
                {
                    userId: user.id,
                    identifier,
                    accountNumber: user.accountNumber
                },
                "Login succeeded."
            );

            return {

                accessToken,

                refreshToken,

                user: {

                    accountNumber:
                        user.accountNumber,

                    username:
                        user.username,

                    email:
                        user.email,

                    phoneNumber:
                        user.phoneNumber

                }

            };

        } catch (error) {

            await auditService.log({

                eventType:
                    AUDIT_EVENTS.LOGIN_FAILED,

                status:
                    AUDIT_STATUS.FAILURE,

                identifier,

                request,

                metadata: {
                    reason:
                        error.message
                }

            });

            logger.warn(
                {
                    identifier,
                    reason: error.message
                },
                "Login failed."
            );

            throw error;

        }

    }

    /**
     * ==========================================================
     * Refresh Token
     * ==========================================================
     */
    async refreshToken(
        token,
        request
    ) {

        const session =
            await refreshTokenService.validate(
                token
            );

        if (!session) {

            throw new AuthenticationError(
                "Invalid or expired refresh token."
            );

        }

        const user =
            await authRepository.findById(
                session.userId
            );

        if (
            !user ||
            user.status !== "ACTIVE"
        ) {

            throw new AuthenticationError(
                "Account is not active."
            );

        }

        await refreshTokenService.revoke(
            token
        );

        const accessToken =
            jwtService.generateAccessToken(user);

        const newRefreshToken =
            await refreshTokenService.create(
                user,
                request
            );

        await auditService.log({

            eventType:
                AUDIT_EVENTS.TOKEN_REFRESHED,

            userId:
                user.id,

            accountNumber:
                user.accountNumber,

            request

        });

        return {

            accessToken,

            refreshToken:
                newRefreshToken

        };

    }

    /**
     * ==========================================================
     * Logout Current Device
     * ==========================================================
     */
    async logout(
        token,
        request
    ) {

        const session =
            await refreshTokenService.validate(
                token
            );

        await refreshTokenService.revoke(
            token
        );

        await auditService.log({

            eventType:
                AUDIT_EVENTS.LOGOUT,

            userId:
                session ? session.userId : null,

            request

        });

        return {
            loggedOut: true
        };

    }

    /**
     * ==========================================================
     * Logout Everywhere
     * ==========================================================
     */
    async logoutAll(
        userId,
        request
    ) {

        await refreshTokenService.revokeAll(
            userId
        );

        await auditService.log({

            eventType:
                AUDIT_EVENTS.LOGOUT_ALL,

            userId,

            request

        });

        return {
            loggedOut: true
        };

    }

    /**
     * ==========================================================
     * Active Sessions
     * ==========================================================
     */
    async getSessions(userId) {

        const sessions =
            await refreshTokenService.getSessions(
                userId
            );

        return sessions.map(
            (session) => ({

                id:
                    session.id,

                deviceId:
                    session.deviceId,

                deviceName:
                    session.deviceName,

                ipAddress:
                    session.ipAddress,

                userAgent:
                    session.userAgent,

                createdAt:
                    session.createdAt,

                expiresAt:
                    session.expiresAt

            })
        );

    }

    /**
     * ==========================================================
     * Forgot Password
     * ==========================================================
     */
    async forgotPassword(
        data,
        request
    ) {

        const {
            identifier
        } = data;

        const user =
            await authRepository.findByIdentifier(
                identifier
            );

        if (!user) {

            throw new NotFoundError(
                "No account found for the supplied identifier."
            );

        }

        const otpResult =
            await otpService.sendPasswordResetOtp(
                user
            );

        const response = {
            expiresAt:
                otpResult.expiresAt
        };

        /**
         * Expose the plaintext reset token outside production
         * so the flow can be tested without a live email provider.
         */
        if (!config.isProduction) {

            response.token =
                otpResult.code;

        }

        await auditService.log({

            eventType:
                AUDIT_EVENTS.PASSWORD_RESET_REQUESTED,

            userId:
                user.id,

            identifier,

            accountNumber:
                user.accountNumber,

            request

        });

        return response;

    }

    /**
     * ==========================================================
     * Reset Password
     * ==========================================================
     */
    async resetPassword(
        data,
        request
    ) {

        const {
            identifier,
            token,
            password
        } = data;

        const user =
            await authRepository.findByIdentifier(
                identifier
            );

        if (!user) {

            throw new NotFoundError(
                "No account found for the supplied identifier."
            );

        }

        await otpService.verifyPasswordResetOtp(
            user.id,
            token
        );

        const passwordHash =
            await passwordService.hash(
                password
            );

        await authRepository.update(
            user.id,
            {
                passwordHash,
                passwordChangedAt:
                    new Date()
            }
        );

        await refreshTokenService.revokeAll(
            user.id
        );

        await auditService.log({

            eventType:
                AUDIT_EVENTS.PASSWORD_RESET_COMPLETED,

            userId:
                user.id,

            identifier,

            accountNumber:
                user.accountNumber,

            request

        });

        return {
            reset: true
        };

    }

    /**
     * ==========================================================
     * Change Password
     * ==========================================================
     */
    async changePassword(
        userId,
        data,
        request
    ) {

        const {
            currentPassword,
            newPassword
        } = data;

        const user =
            await authRepository.findById(
                userId
            );

        if (!user) {

            throw new NotFoundError(
                "User not found."
            );

        }

        const passwordValid =
            await passwordService.verify(
                currentPassword,
                user.passwordHash
            );

        if (!passwordValid) {

            throw new AuthenticationError(
                "Current password is incorrect."
            );

        }

        const passwordHash =
            await passwordService.hash(
                newPassword
            );

        await authRepository.update(
            userId,
            {
                passwordHash,
                passwordChangedAt:
                    new Date()
            }
        );

        await refreshTokenService.revokeAll(
            userId
        );

        await auditService.log({

            eventType:
                AUDIT_EVENTS.PASSWORD_CHANGED,

            userId,

            accountNumber:
                user.accountNumber,

            request

        });

        return {
            changed: true
        };

    }

}

module.exports = new AuthService();
