const authService =
    require("../../../src/modules/auth/auth.service");

const authRepository =
    require("../../../src/modules/auth/auth.repository");

const passwordService =
    require("../../../src/modules/auth/password.service");

const refreshTokenService =
    require("../../../src/modules/refresh-token/refresh-token.service");

const emailProvider =
    require("../../../src/modules/otp/email.provider");

const fakeRequest = () => ({
    headers: {},
    ip: "127.0.0.1",
    get: () => "jest-test-agent"
});

const createUser = async (overrides = {}) => {
    const passwordHash =
        await passwordService.hash("Str0ng!Passw0rd");

    return authRepository.create({
        accountNumber: "1234567890",
        clientId: "client-1",
        username: "janedoe",
        email: "jane@example.com",
        phoneNumber: "08012345678",
        passwordHash,
        ...overrides
    });
};

describe("Auth Service", () => {

    describe("login", () => {

        test("logs in with valid credentials", async () => {
            await createUser();

            const result = await authService.login(
                {
                    identifier: "janedoe",
                    password: "Str0ng!Passw0rd"
                },
                fakeRequest()
            );

            expect(result.accessToken).toBeDefined();
            expect(result.refreshToken).toBeDefined();
            expect(result.user.username).toBe("janedoe");
        });

        test("rejects an unknown identifier", async () => {
            await expect(
                authService.login(
                    {
                        identifier: "nobody",
                        password: "Str0ng!Passw0rd"
                    },
                    fakeRequest()
                )
            ).rejects.toThrow("Invalid credentials.");
        });

        test("rejects an incorrect password and locks after max attempts", async () => {
            await createUser();

            for (let i = 0; i < 5; i++) {
                await expect(
                    authService.login(
                        {
                            identifier: "janedoe",
                            password: "WrongPassword1!"
                        },
                        fakeRequest()
                    )
                ).rejects.toThrow("Invalid credentials.");
            }

            const locked = await authRepository.findByUsername("janedoe");

            expect(locked.status).toBe("LOCKED");
        });

        test("rejects login while account is locked", async () => {
            const user = await createUser();

            await authRepository.lockAccount(
                user.id,
                new Date(Date.now() + 60 * 60 * 1000)
            );

            await expect(
                authService.login(
                    {
                        identifier: "janedoe",
                        password: "Str0ng!Passw0rd"
                    },
                    fakeRequest()
                )
            ).rejects.toThrow("Account is locked. Please try again later.");
        });

        test("unlocks automatically once lockedUntil has passed", async () => {
            const user = await createUser();

            await authRepository.lockAccount(
                user.id,
                new Date(Date.now() - 1000)
            );

            const result = await authService.login(
                {
                    identifier: "janedoe",
                    password: "Str0ng!Passw0rd"
                },
                fakeRequest()
            );

            expect(result.accessToken).toBeDefined();
        });

    });

    describe("refreshToken", () => {

        test("rotates a valid refresh token", async () => {
            const user = await createUser();

            const token = await refreshTokenService.create(
                user,
                fakeRequest()
            );

            const result = await authService.refreshToken(
                token,
                fakeRequest()
            );

            expect(result.accessToken).toBeDefined();
            expect(result.refreshToken).toBeDefined();
            expect(result.refreshToken).not.toBe(token);

            const oldSession = await refreshTokenService.validate(token);
            expect(oldSession).toBeNull();
        });

        test("rejects an invalid refresh token", async () => {
            await expect(
                authService.refreshToken(
                    "not-a-real-token",
                    fakeRequest()
                )
            ).rejects.toThrow("Invalid or expired refresh token.");
        });

    });

    describe("logout", () => {

        test("revokes the supplied refresh token", async () => {
            const user = await createUser();

            const token = await refreshTokenService.create(
                user,
                fakeRequest()
            );

            await authService.logout(token);

            const session = await refreshTokenService.validate(token);
            expect(session).toBeNull();
        });

    });

    describe("logoutAll", () => {

        test("revokes every session for the user", async () => {
            const user = await createUser();

            await refreshTokenService.create(user, fakeRequest());
            await refreshTokenService.create(user, fakeRequest());

            await authService.logoutAll(user.id);

            const remaining = await refreshTokenService.countSessions(user.id);
            expect(remaining).toBe(0);
        });

    });

    describe("getSessions", () => {

        test("returns active sessions without the token hash", async () => {
            const user = await createUser();

            await refreshTokenService.create(user, fakeRequest());

            const sessions = await authService.getSessions(user.id);

            expect(sessions).toHaveLength(1);
            expect(sessions[0].tokenHash).toBeUndefined();
            expect(sessions[0].id).toBeDefined();
        });

    });

    describe("forgotPassword and resetPassword", () => {

        afterEach(() => {
            jest.restoreAllMocks();
        });

        const captureOtp = () => {
            let captured;

            jest.spyOn(emailProvider, "send").mockImplementation(
                async ({ otp }) => {
                    captured = otp;
                    return { success: true, provider: "MOCK" };
                }
            );

            return () => captured;
        };

        test("sends a reset OTP for a known identifier", async () => {
            await createUser();
            const getOtp = captureOtp();

            const result = await authService.forgotPassword({
                identifier: "janedoe"
            });

            expect(result.expiresAt).toBeDefined();
            expect(getOtp()).toMatch(/^\d{6}$/);
        });

        test("rejects an unknown identifier", async () => {
            await expect(
                authService.forgotPassword({
                    identifier: "nobody"
                })
            ).rejects.toThrow("No account found for the supplied identifier.");
        });

        test("resets the password with a valid OTP", async () => {
            const user = await createUser();
            const getOtp = captureOtp();

            await authService.forgotPassword({
                identifier: "janedoe"
            });

            const result = await authService.resetPassword({
                identifier: "janedoe",
                token: getOtp(),
                password: "Ev3nStr0nger!"
            });

            expect(result.reset).toBe(true);

            const updated = await authRepository.findById(user.id);

            const valid = await passwordService.verify(
                "Ev3nStr0nger!",
                updated.passwordHash
            );

            expect(valid).toBe(true);
        });

        test("rejects an invalid OTP", async () => {
            await createUser();
            captureOtp();

            await authService.forgotPassword({
                identifier: "janedoe"
            });

            await expect(
                authService.resetPassword({
                    identifier: "janedoe",
                    token: "000000",
                    password: "Ev3nStr0nger!"
                })
            ).rejects.toThrow();
        });

    });

    describe("changePassword", () => {

        test("changes the password and revokes existing sessions", async () => {
            const user = await createUser();

            await refreshTokenService.create(user, fakeRequest());

            await authService.changePassword(
                user.id,
                {
                    currentPassword: "Str0ng!Passw0rd",
                    newPassword: "Ev3nStr0nger!"
                }
            );

            const updated = await authRepository.findById(user.id);

            const valid = await passwordService.verify(
                "Ev3nStr0nger!",
                updated.passwordHash
            );

            expect(valid).toBe(true);

            const sessionCount = await refreshTokenService.countSessions(user.id);
            expect(sessionCount).toBe(0);
        });

        test("rejects an incorrect current password", async () => {
            const user = await createUser();

            await expect(
                authService.changePassword(
                    user.id,
                    {
                        currentPassword: "WrongPassword1!",
                        newPassword: "Ev3nStr0nger!"
                    }
                )
            ).rejects.toThrow("Current password is incorrect.");
        });

        test("rejects an unknown user", async () => {
            const mongoose = require("mongoose");

            await expect(
                authService.changePassword(
                    new mongoose.Types.ObjectId(),
                    {
                        currentPassword: "Str0ng!Passw0rd",
                        newPassword: "Ev3nStr0nger!"
                    }
                )
            ).rejects.toThrow("User not found.");
        });

    });

});
