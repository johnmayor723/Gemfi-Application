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

const accountClient = require("../../src/integrations/account/account.client");

const adminService = require("../../src/modules/admin/admin.service");

const Agent = require("../../src/modules/agents/agent.model");

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

const validAgentPayload = (parentAgentId, overrides = {}) => ({
    agentType: "AGENT",
    parentAgentId,
    businessName: "Corner Shop Agent",
    tradingName: "Corner Shop",
    registrationNumber: "RC-AG-200300",
    businessType: "SOLE_PROPRIETORSHIP",
    contactName: "John Smith",
    contactEmail: "john@cornershop.example",
    contactPhone: "08087654321",
    address: "5 Market Road, Ibadan",
    ...overrides
});

const virtualAccountResponse = (overrides = {}) => ({
    virtualAccountNumber: "2011119999",
    ownerType: "AGENT",
    ownerId: "some-id",
    settlementFineractAccountId: "700",
    settlementFineractAccountNumber: "000000000700",
    purpose: "AGENT_FLOAT",
    status: "ACTIVE",
    ...overrides
});

const validApprovalPayload = (overrides = {}) => ({
    settlementFineractAccountId: "700",
    commissionSchedule: { type: "PERCENTAGE", value: 1.5, capAmount: 500 },
    dailyCashInLimit: 500000,
    dailyCashOutLimit: 300000,
    perTransactionLimit: 50000,
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

describe("Agent Routes", () => {

    describe("POST /agents", () => {

        test("rejects requests without an admin token", async () => {

            const response = await request(app)
                .post("/agents")
                .send(validSuperAgentPayload());

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);

        });

        test("rejects requests with an invalid admin token", async () => {

            const response = await request(app)
                .post("/agents")
                .set("Authorization", "Bearer not-a-real-token")
                .send(validSuperAgentPayload());

            expect(response.status).toBe(401);

        });

        test("returns 400 when required fields are missing", async () => {

            const response = await request(app)
                .post("/agents")
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({ businessName: "Northgate Super Agent Ltd" });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);

        });

        test("returns 400 for an invalid agentType", async () => {

            const response = await request(app)
                .post("/agents")
                .set("Authorization", `Bearer ${adminToken()}`)
                .send(validSuperAgentPayload({ agentType: "NOT_A_REAL_TYPE" }));

            expect(response.status).toBe(400);

        });

        test("returns 400 for an invalid businessType", async () => {

            const response = await request(app)
                .post("/agents")
                .set("Authorization", `Bearer ${adminToken()}`)
                .send(validSuperAgentPayload({ businessType: "NOT_A_REAL_TYPE" }));

            expect(response.status).toBe(400);

        });

        test("creates a super-agent application in PENDING status", async () => {

            const response = await request(app)
                .post("/agents")
                .set("Authorization", `Bearer ${adminToken()}`)
                .send(validSuperAgentPayload());

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe("PENDING");
            expect(response.body.data.agentType).toBe("SUPER_AGENT");
            expect(response.body.data.businessName).toBe("Northgate Super Agent Ltd");

            const stored = await Agent.findById(response.body.data._id);
            expect(stored).not.toBeNull();

        });

        test("returns 409 for a duplicate registration number", async () => {

            await Agent.create(validSuperAgentPayload());

            const response = await request(app)
                .post("/agents")
                .set("Authorization", `Bearer ${adminToken()}`)
                .send(validSuperAgentPayload({ contactEmail: "other@northgate.example" }));

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);

        });

        describe("hierarchy rule", () => {

            test("returns 400 when agentType is SUPER_AGENT and parentAgentId is supplied", async () => {

                const response = await request(app)
                    .post("/agents")
                    .set("Authorization", `Bearer ${adminToken()}`)
                    .send(
                        validSuperAgentPayload({
                            parentAgentId: "64b7f9f9f9f9f9f9f9f9f9f9"
                        })
                    );

                expect(response.status).toBe(400);

            });

            test("returns 400 when agentType is AGENT and parentAgentId is missing", async () => {

                const response = await request(app)
                    .post("/agents")
                    .set("Authorization", `Bearer ${adminToken()}`)
                    .send({ ...validAgentPayload(undefined), parentAgentId: undefined });

                expect(response.status).toBe(400);

            });

            test("returns 400 when parentAgentId is not a valid identifier", async () => {

                const response = await request(app)
                    .post("/agents")
                    .set("Authorization", `Bearer ${adminToken()}`)
                    .send(validAgentPayload("not-a-mongo-id"));

                expect(response.status).toBe(400);

            });

            test("returns 422 when parentAgentId does not resolve to an existing agent", async () => {

                const response = await request(app)
                    .post("/agents")
                    .set("Authorization", `Bearer ${adminToken()}`)
                    .send(validAgentPayload("64b7f9f9f9f9f9f9f9f9f9f9"));

                expect(response.status).toBe(422);

            });

            test("returns 422 when parentAgentId resolves to an AGENT, not a SUPER_AGENT", async () => {

                const superAgent = await Agent.create(validSuperAgentPayload());

                const childAgent = await Agent.create(
                    validAgentPayload(String(superAgent._id), {
                        registrationNumber: "RC-AG-200301"
                    })
                );

                const response = await request(app)
                    .post("/agents")
                    .set("Authorization", `Bearer ${adminToken()}`)
                    .send(
                        validAgentPayload(String(childAgent._id), {
                            registrationNumber: "RC-AG-200302"
                        })
                    );

                expect(response.status).toBe(422);

            });

            test("creates an AGENT application when parentAgentId resolves to a SUPER_AGENT", async () => {

                const superAgent = await Agent.create(validSuperAgentPayload());

                const response = await request(app)
                    .post("/agents")
                    .set("Authorization", `Bearer ${adminToken()}`)
                    .send(validAgentPayload(String(superAgent._id)));

                expect(response.status).toBe(201);
                expect(response.body.data.agentType).toBe("AGENT");
                expect(response.body.data.parentAgentId).toBe(String(superAgent._id));

            });

        });

    });

    describe("GET /agents", () => {

        test("rejects requests without an admin token", async () => {

            const response = await request(app).get("/agents");

            expect(response.status).toBe(401);

        });

        test("filters by status, agentType, and parentAgentId", async () => {

            const superAgent = await Agent.create(
                validSuperAgentPayload({ registrationNumber: "RC-SA-1" })
            );

            await Agent.create(
                validAgentPayload(String(superAgent._id), {
                    registrationNumber: "RC-AG-1"
                })
            );

            await Agent.create(
                validSuperAgentPayload({
                    registrationNumber: "RC-SA-2",
                    status: "ACTIVE"
                })
            );

            const response = await request(app)
                .get(
                    `/agents?status=PENDING&agentType=AGENT&parentAgentId=${superAgent._id}`
                )
                .set("Authorization", `Bearer ${adminToken()}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].registrationNumber).toBe("RC-AG-1");

        });

        test("returns 400 for an invalid status filter", async () => {

            const response = await request(app)
                .get("/agents?status=NOT_REAL")
                .set("Authorization", `Bearer ${adminToken()}`);

            expect(response.status).toBe(400);

        });

    });

    describe("GET /agents/:id", () => {

        test("returns 400 for a malformed id", async () => {

            const response = await request(app)
                .get("/agents/not-a-mongo-id")
                .set("Authorization", `Bearer ${adminToken()}`);

            expect(response.status).toBe(400);

        });

        test("returns 404 for an unknown agent", async () => {

            const response = await request(app)
                .get("/agents/64b7f9f9f9f9f9f9f9f9f9f9")
                .set("Authorization", `Bearer ${adminToken()}`);

            expect(response.status).toBe(404);

        });

        test("returns an existing agent", async () => {

            const superAgent = await Agent.create(validSuperAgentPayload());

            const response = await request(app)
                .get(`/agents/${superAgent._id}`)
                .set("Authorization", `Bearer ${adminToken()}`);

            expect(response.status).toBe(200);
            expect(response.body.data.businessName).toBe("Northgate Super Agent Ltd");

        });

    });

    describe("PATCH /agents/:id/approve", () => {

        test("rejects requests without an admin token", async () => {

            const superAgent = await Agent.create(validSuperAgentPayload());

            const response = await request(app)
                .patch(`/agents/${superAgent._id}/approve`)
                .send(validApprovalPayload());

            expect(response.status).toBe(401);

        });

        test("returns 400 when commissionSchedule is missing", async () => {

            const superAgent = await Agent.create(validSuperAgentPayload());

            const response = await request(app)
                .patch(`/agents/${superAgent._id}/approve`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({
                    settlementFineractAccountId: "700",
                    dailyCashInLimit: 500000,
                    dailyCashOutLimit: 300000,
                    perTransactionLimit: 50000
                });

            expect(response.status).toBe(400);
            expect(accountClient.createVirtualAccount).not.toHaveBeenCalled();

        });

        test("returns 400 when limits are missing", async () => {

            const superAgent = await Agent.create(validSuperAgentPayload());

            const response = await request(app)
                .patch(`/agents/${superAgent._id}/approve`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({
                    settlementFineractAccountId: "700",
                    commissionSchedule: { type: "PERCENTAGE", value: 1.5 }
                });

            expect(response.status).toBe(400);
            expect(accountClient.createVirtualAccount).not.toHaveBeenCalled();

        });

        test("returns 400 when neither settlement identifier is supplied", async () => {

            const superAgent = await Agent.create(validSuperAgentPayload());

            const response = await request(app)
                .patch(`/agents/${superAgent._id}/approve`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send(
                    validApprovalPayload({ settlementFineractAccountId: undefined })
                );

            expect(response.status).toBe(400);

        });

        test("approves a pending agent, provisions its float virtual account, and activates it", async () => {

            const superAgent = await Agent.create(validSuperAgentPayload());

            accountClient.createVirtualAccount.mockResolvedValue(
                virtualAccountResponse({ ownerId: String(superAgent._id) })
            );

            const response = await request(app)
                .patch(`/agents/${superAgent._id}/approve`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send(validApprovalPayload());

            expect(response.status).toBe(200);
            expect(response.body.data.status).toBe("ACTIVE");
            expect(response.body.data.settlementFineractAccountId).toBe("700");
            expect(response.body.data.settlementFineractAccountNumber).toBe("000000000700");
            expect(response.body.data.floatVirtualAccountNumber).toBe("2011119999");
            expect(response.body.data.commissionSchedule.type).toBe("PERCENTAGE");
            expect(response.body.data.commissionSchedule.value).toBe(1.5);
            expect(response.body.data.dailyCashInLimit).toBe(500000);
            expect(response.body.data.dailyCashOutLimit).toBe(300000);
            expect(response.body.data.perTransactionLimit).toBe(50000);
            expect(response.body.data.reviewedBy).toBe("test-admin");
            expect(response.body.data.reviewedAt).not.toBeNull();

            expect(accountClient.createVirtualAccount).toHaveBeenCalledWith(
                expect.objectContaining({
                    ownerType: "AGENT",
                    ownerId: String(superAgent._id),
                    settlementFineractAccountId: "700",
                    purpose: "AGENT_FLOAT"
                })
            );

        });

        test("surfaces the account-service error and leaves status untouched when the settlement account is rejected", async () => {

            const { NotFoundError } = require("../../src/errors");

            const superAgent = await Agent.create(validSuperAgentPayload());

            accountClient.createVirtualAccount.mockRejectedValue(
                new NotFoundError("Settlement Fineract account not found.")
            );

            const response = await request(app)
                .patch(`/agents/${superAgent._id}/approve`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send(
                    validApprovalPayload({
                        settlementFineractAccountId: "does-not-exist"
                    })
                );

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);

            const stored = await Agent.findById(superAgent._id);
            expect(stored.status).toBe("PENDING");
            expect(stored.settlementFineractAccountId).toBeNull();

        });

        test("surfaces account-service unavailability without transitioning status", async () => {

            const superAgent = await Agent.create(validSuperAgentPayload());

            accountClient.createVirtualAccount.mockRejectedValue(
                new Error("connect ECONNREFUSED")
            );

            const response = await request(app)
                .patch(`/agents/${superAgent._id}/approve`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send(validApprovalPayload());

            expect(response.status).toBe(500);

            const stored = await Agent.findById(superAgent._id);
            expect(stored.status).toBe("PENDING");

        });

        test("rejects approving an agent that is not PENDING", async () => {

            const superAgent = await Agent.create(
                validSuperAgentPayload({ status: "ACTIVE" })
            );

            const response = await request(app)
                .patch(`/agents/${superAgent._id}/approve`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send(validApprovalPayload());

            expect(response.status).toBe(422);
            expect(accountClient.createVirtualAccount).not.toHaveBeenCalled();

        });

    });

    describe("PATCH /agents/:id/reject", () => {

        test("returns 400 when rejectionReason is missing", async () => {

            const superAgent = await Agent.create(validSuperAgentPayload());

            const response = await request(app)
                .patch(`/agents/${superAgent._id}/reject`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({});

            expect(response.status).toBe(400);

        });

        test("rejects a pending agent application", async () => {

            const superAgent = await Agent.create(validSuperAgentPayload());

            const response = await request(app)
                .patch(`/agents/${superAgent._id}/reject`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({ rejectionReason: "Incomplete documentation." });

            expect(response.status).toBe(200);
            expect(response.body.data.status).toBe("REJECTED");
            expect(response.body.data.rejectionReason).toBe("Incomplete documentation.");
            expect(response.body.data.reviewedBy).toBe("test-admin");

        });

        test("rejects rejecting an agent that is not PENDING", async () => {

            const superAgent = await Agent.create(
                validSuperAgentPayload({ status: "REJECTED" })
            );

            const response = await request(app)
                .patch(`/agents/${superAgent._id}/reject`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({ rejectionReason: "Second look." });

            expect(response.status).toBe(422);

        });

    });

    /**
     * Status, commission-schedule, and limits coverage lives in
     * agents-lifecycle.routes.test.js - split out to keep each
     * file's authenticated-request count comfortably under the
     * adminActionLimiter's 30-per-minute cap (see the comment at
     * the top of that file for why).
     */

});
