jest.mock("../../src/integrations/account/account.client");

jest.mock("../../src/modules/admin/admin.service", () => ({

    touchSession: jest.fn(),

    login: jest.fn(),

    logout: jest.fn()

}));

const jwt = require("jsonwebtoken");
const request = require("supertest");

const database = require("../helpers/database");

const appConfig = require("../../src/config/app.config");

const app = require("../../src/app");

const adminService = require("../../src/modules/admin/admin.service");

const Agent = require("../../src/modules/agents/agent.model");

/**
 * Split out from agents.routes.test.js: the shared /agents route
 * chain layers a 30-requests-per-minute adminActionLimiter (see
 * ../../src/middleware/rate-limit.middleware.js) on every
 * authenticated request, and each Jest test file gets its own
 * fresh in-memory rate-limit store (module registry reset per
 * file). Keeping status/commission-schedule/limits coverage in
 * its own file keeps both files comfortably under that cap,
 * mirroring the per-file budget already implicit in
 * merchant-service's and account-service's own test suites.
 */

const adminToken = (overrides = {}) =>
    jwt.sign(
        {
            sessionId: "test-admin-session",
            username: "test-admin",
            ...overrides
        },
        appConfig.adminSession.jwtSecret,
        { expiresIn: "30m" }
    );

const validSuperAgentPayload = (overrides = {}) => ({
    agentType: "SUPER_AGENT",
    businessName: "Northgate Super Agent Ltd",
    tradingName: "Northgate",
    registrationNumber: "RC-SA-100200",
    businessType: "LIMITED_LIABILITY",
    contactName: "Jane Doe",
    contactEmail: "jane@northgate.example",
    contactPhone: "08012345678",
    address: "12 Broad Street, Lagos",
    ...overrides
});

beforeAll(async () => {
    await database.connect();
});

afterAll(async () => {
    await database.closeDatabase();
});

beforeEach(async () => {
    await database.clearDatabase();
    jest.clearAllMocks();
    adminService.touchSession.mockReturnValue({
        username: "test-admin",
        staffDisplayName: "Test Admin",
        roles: ["ADMIN"]
    });
});

describe("Agent Lifecycle Routes", () => {

    describe("PATCH /agents/:id/status", () => {

        test("rejects an invalid status value", async () => {

            const superAgent = await Agent.create(
                validSuperAgentPayload({ status: "ACTIVE" })
            );

            const response = await request(app)
                .patch(`/agents/${superAgent._id}/status`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({ status: "NOT_A_STATUS" });

            expect(response.status).toBe(400);

        });

        test("transitions ACTIVE to SUSPENDED", async () => {

            const superAgent = await Agent.create(
                validSuperAgentPayload({ status: "ACTIVE" })
            );

            const response = await request(app)
                .patch(`/agents/${superAgent._id}/status`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({ status: "SUSPENDED" });

            expect(response.status).toBe(200);
            expect(response.body.data.status).toBe("SUSPENDED");

        });

        test("transitions SUSPENDED back to ACTIVE", async () => {

            const superAgent = await Agent.create(
                validSuperAgentPayload({ status: "SUSPENDED" })
            );

            const response = await request(app)
                .patch(`/agents/${superAgent._id}/status`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({ status: "ACTIVE" });

            expect(response.status).toBe(200);
            expect(response.body.data.status).toBe("ACTIVE");

        });

        test("rejects a redundant same-status request", async () => {

            const superAgent = await Agent.create(
                validSuperAgentPayload({ status: "ACTIVE" })
            );

            const response = await request(app)
                .patch(`/agents/${superAgent._id}/status`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({ status: "ACTIVE" });

            expect(response.status).toBe(422);

        });

        test("rejects reopening a CLOSED agent", async () => {

            const superAgent = await Agent.create(
                validSuperAgentPayload({ status: "CLOSED" })
            );

            const response = await request(app)
                .patch(`/agents/${superAgent._id}/status`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({ status: "ACTIVE" });

            expect(response.status).toBe(422);

        });

        test("rejects transitioning status from PENDING", async () => {

            const superAgent = await Agent.create(validSuperAgentPayload());

            const response = await request(app)
                .patch(`/agents/${superAgent._id}/status`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({ status: "SUSPENDED" });

            expect(response.status).toBe(422);

        });

        test("rejects transitioning status from REJECTED", async () => {

            const superAgent = await Agent.create(
                validSuperAgentPayload({ status: "REJECTED" })
            );

            const response = await request(app)
                .patch(`/agents/${superAgent._id}/status`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({ status: "ACTIVE" });

            expect(response.status).toBe(422);

        });

    });

    describe("PATCH /agents/:id/commission-schedule", () => {

        test("returns 400 for an invalid commission schedule type", async () => {

            const superAgent = await Agent.create(
                validSuperAgentPayload({ status: "ACTIVE" })
            );

            const response = await request(app)
                .patch(`/agents/${superAgent._id}/commission-schedule`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({ commissionSchedule: { type: "NOT_REAL", value: 1 } });

            expect(response.status).toBe(400);

        });

        test("updates the commission schedule for an active agent", async () => {

            const superAgent = await Agent.create(
                validSuperAgentPayload({
                    status: "ACTIVE",
                    commissionSchedule: { type: "FLAT", value: 100 }
                })
            );

            const response = await request(app)
                .patch(`/agents/${superAgent._id}/commission-schedule`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({
                    commissionSchedule: { type: "PERCENTAGE", value: 2, capAmount: 1000 }
                });

            expect(response.status).toBe(200);
            expect(response.body.data.commissionSchedule.type).toBe("PERCENTAGE");
            expect(response.body.data.commissionSchedule.value).toBe(2);
            expect(response.body.data.commissionSchedule.capAmount).toBe(1000);

        });

        test("rejects changing the commission schedule for a pending agent", async () => {

            const superAgent = await Agent.create(validSuperAgentPayload());

            const response = await request(app)
                .patch(`/agents/${superAgent._id}/commission-schedule`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({ commissionSchedule: { type: "FLAT", value: 100 } });

            expect(response.status).toBe(422);

        });

    });

    describe("PATCH /agents/:id/limits", () => {

        test("returns 400 when a limit is missing", async () => {

            const superAgent = await Agent.create(
                validSuperAgentPayload({ status: "ACTIVE" })
            );

            const response = await request(app)
                .patch(`/agents/${superAgent._id}/limits`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({ dailyCashInLimit: 500000, dailyCashOutLimit: 300000 });

            expect(response.status).toBe(400);

        });

        test("updates the limits for an active agent", async () => {

            const superAgent = await Agent.create(
                validSuperAgentPayload({
                    status: "ACTIVE",
                    dailyCashInLimit: 100000,
                    dailyCashOutLimit: 100000,
                    perTransactionLimit: 20000
                })
            );

            const response = await request(app)
                .patch(`/agents/${superAgent._id}/limits`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({
                    dailyCashInLimit: 750000,
                    dailyCashOutLimit: 500000,
                    perTransactionLimit: 100000
                });

            expect(response.status).toBe(200);
            expect(response.body.data.dailyCashInLimit).toBe(750000);
            expect(response.body.data.dailyCashOutLimit).toBe(500000);
            expect(response.body.data.perTransactionLimit).toBe(100000);

        });

        test("rejects changing limits for a pending agent", async () => {

            const superAgent = await Agent.create(validSuperAgentPayload());

            const response = await request(app)
                .patch(`/agents/${superAgent._id}/limits`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({
                    dailyCashInLimit: 500000,
                    dailyCashOutLimit: 300000,
                    perTransactionLimit: 50000
                });

            expect(response.status).toBe(422);

        });

    });

});
