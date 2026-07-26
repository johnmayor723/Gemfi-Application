const request = require("supertest");

const app = require("../../src/app");

const authRepository =
    require("../../src/modules/auth/auth.repository");

const passwordService =
    require("../../src/modules/auth/password.service");

const createUser = async () => {
    const passwordHash =
        await passwordService.hash("Str0ng!Passw0rd");

    return authRepository.create({
        accountNumber: "1234567890",
        clientId: "client-1",
        username: "janedoe",
        email: "jane@example.com",
        phoneNumber: "08012345678",
        passwordHash
    });
};

describe("Auth Routes", () => {

    describe("POST /auth/login", () => {

        test("returns tokens for valid credentials", async () => {
            await createUser();

            const response = await request(app)
                .post("/auth/login")
                .send({
                    identifier: "janedoe",
                    password: "Str0ng!Passw0rd"
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.accessToken).toBeDefined();
            expect(response.body.data.refreshToken).toBeDefined();
        });

        test("returns 400 when the body fails validation", async () => {
            const response = await request(app)
                .post("/auth/login")
                .send({
                    identifier: "janedoe"
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        test("returns 401 for invalid credentials", async () => {
            await createUser();

            const response = await request(app)
                .post("/auth/login")
                .send({
                    identifier: "janedoe",
                    password: "WrongPassword1!"
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

    });

    describe("protected routes", () => {

        test("reject requests without a bearer token", async () => {
            const response = await request(app)
                .get("/auth/sessions");

            expect(response.status).toBe(401);
        });

        test("allow access with a valid access token", async () => {
            await createUser();

            const login = await request(app)
                .post("/auth/login")
                .send({
                    identifier: "janedoe",
                    password: "Str0ng!Passw0rd"
                });

            const response = await request(app)
                .get("/auth/sessions")
                .set(
                    "Authorization",
                    `Bearer ${login.body.data.accessToken}`
                );

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

    });

    describe("POST /auth/refresh-token and /auth/logout", () => {

        test("rotates a refresh token then rejects it after logout", async () => {
            await createUser();

            const login = await request(app)
                .post("/auth/login")
                .send({
                    identifier: "janedoe",
                    password: "Str0ng!Passw0rd"
                });

            const refreshed = await request(app)
                .post("/auth/refresh-token")
                .send({
                    refreshToken: login.body.data.refreshToken
                });

            expect(refreshed.status).toBe(200);
            expect(refreshed.body.data.accessToken).toBeDefined();

            const logout = await request(app)
                .post("/auth/logout")
                .send({
                    refreshToken: refreshed.body.data.refreshToken
                });

            expect(logout.status).toBe(200);

            const reuse = await request(app)
                .post("/auth/refresh-token")
                .send({
                    refreshToken: refreshed.body.data.refreshToken
                });

            expect(reuse.status).toBe(401);
        });

    });

});
