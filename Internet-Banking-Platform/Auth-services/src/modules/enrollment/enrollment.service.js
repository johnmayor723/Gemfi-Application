const repository =
    require("./enrollment.repository");

const otpService =
    require("../otp/otp.service");

const authRepository =
    require("../auth/auth.repository");

const passwordService =
    require("../auth/password.service");

const jwtService =
    require("../auth/jwt.service");

const refreshTokenService =
    require("../refresh-token/refresh-token.service");

const {
    client: accountService
} = require("../../integrations/account");

const auditService =
    require("../audit/audit.service");

const {
    AUDIT_EVENTS
} = require("../../constants/audit-event.constants");

const config =
    require("../../config/app.config");

const {
    ConflictError,
    NotFoundError,
    ValidationError
} = require("../../errors");

class EnrollmentService {

    /**
     * ==========================================================
     * Start Enrollment
     * ==========================================================
     */
    async start(
        data,
        request
    ) {

        /**
         * Validate account ownership.
         */

        const ownership =
            await accountService.validateAccount({

                accountNumber:
                    data.accountNumber,

                email:
                    data.email,

                phoneNumber:
                    data.phoneNumber

            });

        if (!ownership.matched) {

            throw new ValidationError(
                "Account ownership validation failed."
            );

        }

        /**
         * Existing Internet Banking User
         */

        const existingUser =
            await authRepository.findByAccountNumber(
                data.accountNumber
            );

        if (existingUser) {

            throw new ConflictError(
                "Internet Banking has already been activated for this account."
            );

        }

        /**
         * Remove any previous enrollment.
         */

        await repository.deleteByAccountNumber(
            data.accountNumber
        );

        /**
         * Fetch account mapping.
         */

        const account =
            await accountService.getAccount(
                data.accountNumber
            );

        if (!account) {

            throw new NotFoundError(
                "Account mapping not found."
            );

        }

        /**
         * Create enrollment.
         */

        const expiresAt =
            new Date(
                Date.now() +
                (15 * 60 * 1000)
            );

        const enrollment =
            await repository.create({

                accountNumber:
                    account.accountNumber,

                clientId:
                    account.clientId,

                email:
                    account.email,

                phoneNumber:
                    account.phoneNumber,

                expiresAt

            });

        /**
         * Generate Email OTP.
         */

        const emailOtpResult =
            await otpService.createEmailOtp({

                referenceId:
                    enrollment.id,

                referenceType:
                    "ENROLLMENT",

                email:
                    account.email

            });

        /**
         * Generate SMS OTP.
         */

        const smsOtpResult =
            await otpService.createSmsOtp({

                referenceId:
                    enrollment.id,

                referenceType:
                    "ENROLLMENT",

                phoneNumber:
                    account.phoneNumber,

                /**
                 * TEMPORARY - Termii Sender ID is pending approval,
                 * so email the SMS code too. Remove once approved.
                 */
                debugEmail:
                    account.email

            });

        const response = {

            enrollmentId:
                enrollment.id,

            expiresAt

        };

        /**
         * Expose plaintext OTPs outside production so the flow
         * can be tested without a live email/SMS provider.
         */
        if (!config.isProduction) {

            response.emailOtp =
                emailOtpResult.code;

            response.smsOtp =
                smsOtpResult.code;

        }

        await auditService.log({

            eventType:
                AUDIT_EVENTS.ENROLLMENT_STARTED,

            identifier:
                data.accountNumber,

            accountNumber:
                account.accountNumber,

            request,

            metadata: {
                enrollmentId:
                    enrollment.id
            }

        });

        return response;

    }

    /**
     * ==========================================================
     * Verify Enrollment
     * ==========================================================
     */
    async verify(
        data,
        request
    ) {

        const enrollment =
            await repository.findById(
                data.enrollmentId
            );

        if (!enrollment) {

            throw new NotFoundError(
                "Enrollment not found."
            );

        }

        await otpService.verify({

            referenceId:
                enrollment.id,

            channel:
                "EMAIL",

            code:
                data.emailOtp

        });

        await otpService.verify({

            referenceId:
                enrollment.id,

            channel:
                "SMS",

            code:
                data.smsOtp

        });

        await repository.markVerified(
            enrollment.id
        );

        await auditService.log({

            eventType:
                AUDIT_EVENTS.ENROLLMENT_VERIFIED,

            accountNumber:
                enrollment.accountNumber,

            request,

            metadata: {
                enrollmentId:
                    enrollment.id
            }

        });

        return {

            verified: true

        };

    }

    /**
     * ==========================================================
     * Complete Enrollment
     * ==========================================================
     */
    async complete(
        data,
        request
    ) {

        const enrollment =
            await repository.findById(
                data.enrollmentId
            );

        if (!enrollment) {

            throw new NotFoundError(
                "Enrollment not found."
            );

        }

        if (
            enrollment.status !==
            "VERIFIED"
        ) {

            throw new ValidationError(
                "Enrollment has not been verified."
            );

        }

        /**
         * Username already exists.
         */

        const username =
            await authRepository.findByUsername(
                data.username
            );

        if (username) {

            throw new ConflictError(
                "Username already exists."
            );

        }

        /**
         * Password hash.
         */

        const passwordHash =
            await passwordService.hash(
                data.password
            );

        /**
         * Create Internet Banking user.
         */

        const user =
            await authRepository.create({

                accountNumber:
                    enrollment.accountNumber,

                clientId:
                    enrollment.clientId,

                username:
                    data.username,

                email:
                    enrollment.email,

                phoneNumber:
                    enrollment.phoneNumber,

                passwordHash,

                status:
                    "ACTIVE",

                emailVerified:
                    true,

                phoneVerified:
                    true

            });

        /**
         * JWT.
         */

        const accessToken =
            jwtService.generateAccessToken(user);

        /**
         * Refresh Token.
         */

        const refreshToken =
            await refreshTokenService.create(
                user,
                request
            );

        /**
         * Cleanup.
         */

        await otpService.delete(
            enrollment.id
        );

        await repository.delete(
            enrollment.id
        );

        await auditService.log({

            eventType:
                AUDIT_EVENTS.USER_REGISTERED,

            userId:
                user.id,

            identifier:
                user.username,

            accountNumber:
                user.accountNumber,

            request,

            metadata: {
                enrollmentId:
                    enrollment.id
            }

        });

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

    }

}

module.exports =
    new EnrollmentService();