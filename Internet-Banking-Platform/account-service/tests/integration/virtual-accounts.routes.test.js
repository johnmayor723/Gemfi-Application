jest.mock("../../src/modules/admin/admin.service", () => ({

    touchSession: jest.fn(),

    login: jest.fn(),

    logout: jest.fn()

}));

jest.mock("../../src/integrations/fineract", () => ({

    adapter: {
        getAccount: jest.fn(),
        getAccountSummary: jest.fn(),
        setClientAccountIdentifiers: jest.fn()
    },

    client: {},

    authClient: {}

}));

const jwt = require("jsonwebtoken");
const request = require("supertest");

const database = require("../helpers/database");

const appConfig = require("../../src/config/app.config");

const app = require("../../src/app");

const adminService = require("../../src/modules/admin/admin.service");

const { adapter: fineractAdapter } = require("../../src/integrations/fineract");

const AccountMapping = require("../../src/modules/accounts/account.model");
const VirtualAccountMapping = require("../../src/modules/virtual-accounts/virtual-account.model");

const { NotFoundError } = require("../../src/errors");

const adminToken = () =>
    jwt.sign(
        { sessionId: "test-admin-session", username: "test-admin" },
        appConfig.adminSession.jwtSecret,
        { expiresIn: "30m" }
    );

const validAdminSession = () => ({
    username: "test-admin",
    staffDisplayName: "Test Admin",
    roles: ["ADMIN"]
});

const seedSettlementAccountMapping = async (overrides = {}) => {

    return AccountMapping.create({
        accountNumber: "1234567890",
        fineractAccountId: "500",
        fineractAccountNumber: "000000000500",
        clientId: "900",
        displayName: "Merchant One",
        phoneNumber: "08012345678",
        email: "merchant@example.com",
        status: "ACTIVE",
        ...overrides
    });

};

const fineractAccount = (overrides = {}) => ({
    id: "500",
    accountNo: "000000000500",
    clientId: "900",
    displayName: "Merchant One",
    firstname: "Merchant",
    middlename: null,
    lastname: "One",
    mobileNo: "08012345678",
    emailAddress: "merchant@example.com",
    active: true,
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
    adminService.touchSession.mockReturnValue(validAdminSession());
});

describe("Virtual Account Routes", () => {

    describe("POST /virtual-accounts", () => {

        test("rejects requests without an admin token", async () => {

            const response = await request(app)
                .post("/virtual-accounts")
                .send({
                    ownerType: "MERCHANT",
                    ownerId: "merchant-1",
                    settlementFineractAccountId: "500",
                    purpose: "COLLECTIONS"
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);

        });

        test("rejects requests with an invalid admin token", async () => {

            const response = await request(app)
                .post("/virtual-accounts")
                .set("Authorization", "Bearer not-a-real-token")
                .send({
                    ownerType: "MERCHANT",
                    ownerId: "merchant-1",
                    settlementFineractAccountId: "500",
                    purpose: "COLLECTIONS"
                });

            expect(response.status).toBe(401);

        });

        test("rejects requests when the admin session has expired", async () => {

            adminService.touchSession.mockReturnValue(null);

            const response = await request(app)
                .post("/virtual-accounts")
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({
                    ownerType: "MERCHANT",
                    ownerId: "merchant-1",
                    settlementFineractAccountId: "500",
                    purpose: "COLLECTIONS"
                });

            expect(response.status).toBe(401);

        });

        test("returns 400 when required fields are missing", async () => {

            const response = await request(app)
                .post("/virtual-accounts")
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({
                    ownerType: "MERCHANT"
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);

        });

        test("returns 400 for an invalid ownerType", async () => {

            const response = await request(app)
                .post("/virtual-accounts")
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({
                    ownerType: "NOT_A_REAL_TYPE",
                    ownerId: "merchant-1",
                    settlementFineractAccountId: "500",
                    purpose: "COLLECTIONS"
                });

            expect(response.status).toBe(400);

        });

        test("returns 400 when neither settlement identifier is supplied", async () => {

            const response = await request(app)
                .post("/virtual-accounts")
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({
                    ownerType: "MERCHANT",
                    ownerId: "merchant-1",
                    purpose: "COLLECTIONS"
                });

            expect(response.status).toBe(400);

        });

        test("returns 404 when the settlement Fineract account does not exist", async () => {

            fineractAdapter.getAccount.mockRejectedValue(
                new NotFoundError("Fineract savings account not found.")
            );

            const response = await request(app)
                .post("/virtual-accounts")
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({
                    ownerType: "MERCHANT",
                    ownerId: "merchant-1",
                    settlementFineractAccountId: "does-not-exist",
                    purpose: "COLLECTIONS"
                });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);

        });

        test("returns 500, not 404, when Fineract itself fails (not a not-found case)", async () => {

            fineractAdapter.getAccount.mockRejectedValue(
                new Error("connect ECONNREFUSED")
            );

            const response = await request(app)
                .post("/virtual-accounts")
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({
                    ownerType: "MERCHANT",
                    ownerId: "merchant-1",
                    settlementFineractAccountId: "does-not-exist",
                    purpose: "COLLECTIONS"
                });

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);

        });

        test("creates a virtual account mapped to an existing settlement account", async () => {

            fineractAdapter.getAccount.mockResolvedValue(fineractAccount());

            const response = await request(app)
                .post("/virtual-accounts")
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({
                    ownerType: "MERCHANT",
                    ownerId: "merchant-1",
                    settlementFineractAccountId: "500",
                    purpose: "COLLECTIONS",
                    label: "Invoice #100"
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            expect(response.body.data.virtualAccountNumber).toHaveLength(10);
            expect(response.body.data.settlementFineractAccountId).toBe("500");
            expect(response.body.data.settlementFineractAccountNumber).toBe("000000000500");
            expect(response.body.data.status).toBe("ACTIVE");
            expect(response.body.data.label).toBe("Invoice #100");

            const stored = await VirtualAccountMapping.findOne({
                virtualAccountNumber: response.body.data.virtualAccountNumber
            });

            expect(stored).not.toBeNull();

        });

        test("returns 400 for an invalid purpose", async () => {

            const response = await request(app)
                .post("/virtual-accounts")
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({
                    ownerType: "MERCHANT",
                    ownerId: "merchant-1",
                    settlementFineractAccountId: "500",
                    purpose: "NOT_A_REAL_PURPOSE"
                });

            expect(response.status).toBe(400);

        });

        test("accepts AGENT_FLOAT as a valid purpose", async () => {

            fineractAdapter.getAccount.mockResolvedValue(fineractAccount());

            const response = await request(app)
                .post("/virtual-accounts")
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({
                    ownerType: "AGENT",
                    ownerId: "agent-1",
                    settlementFineractAccountId: "500",
                    purpose: "AGENT_FLOAT",
                    label: "Agent Float Account"
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.purpose).toBe("AGENT_FLOAT");

        });

        test("resolves the settlement account via settlementFineractAccountNumber", async () => {

            await seedSettlementAccountMapping();

            fineractAdapter.getAccount.mockResolvedValue(fineractAccount());

            const response = await request(app)
                .post("/virtual-accounts")
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({
                    ownerType: "AGENT",
                    ownerId: "agent-1",
                    settlementFineractAccountNumber: "000000000500",
                    purpose: "WALLET_TOPUP"
                });

            expect(response.status).toBe(200);
            expect(response.body.data.settlementFineractAccountId).toBe("500");

        });

        test("returns 404 when settlementFineractAccountNumber has no known mapping", async () => {

            const response = await request(app)
                .post("/virtual-accounts")
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({
                    ownerType: "AGENT",
                    ownerId: "agent-1",
                    settlementFineractAccountNumber: "999999999999",
                    purpose: "WALLET_TOPUP"
                });

            expect(response.status).toBe(404);
            expect(fineractAdapter.getAccount).not.toHaveBeenCalled();

        });

        test("many virtual accounts can point at the same settlement account", async () => {

            fineractAdapter.getAccount.mockResolvedValue(fineractAccount());

            const first = await request(app)
                .post("/virtual-accounts")
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({
                    ownerType: "MERCHANT",
                    ownerId: "merchant-1",
                    settlementFineractAccountId: "500",
                    purpose: "COLLECTIONS",
                    label: "Payer A"
                });

            const second = await request(app)
                .post("/virtual-accounts")
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({
                    ownerType: "MERCHANT",
                    ownerId: "merchant-1",
                    settlementFineractAccountId: "500",
                    purpose: "COLLECTIONS",
                    label: "Payer B"
                });

            expect(first.status).toBe(200);
            expect(second.status).toBe(200);

            expect(first.body.data.virtualAccountNumber)
                .not.toBe(second.body.data.virtualAccountNumber);

            expect(first.body.data.settlementFineractAccountId)
                .toBe(second.body.data.settlementFineractAccountId);

        });

    });

    describe("GET /virtual-accounts/:virtualAccountNumber", () => {

        test("rejects requests without an admin token", async () => {

            const response = await request(app)
                .get("/virtual-accounts/2011112222");

            expect(response.status).toBe(401);

        });

        test("returns 404 when the virtual account number is unknown", async () => {

            const response = await request(app)
                .get("/virtual-accounts/2099999999")
                .set("Authorization", `Bearer ${adminToken()}`);

            expect(response.status).toBe(404);

        });

        test("resolves an existing virtual account", async () => {

            const mapping = await VirtualAccountMapping.create({
                virtualAccountNumber: "2011112222",
                ownerType: "MERCHANT",
                ownerId: "merchant-1",
                settlementFineractAccountId: "500",
                settlementFineractAccountNumber: "000000000500",
                purpose: "COLLECTIONS",
                status: "ACTIVE"
            });

            const response = await request(app)
                .get(`/virtual-accounts/${mapping.virtualAccountNumber}`)
                .set("Authorization", `Bearer ${adminToken()}`);

            expect(response.status).toBe(200);
            expect(response.body.data.virtualAccountNumber).toBe("2011112222");

        });

    });

    describe("GET /virtual-accounts", () => {

        test("filters by ownerType and ownerId", async () => {

            await VirtualAccountMapping.create([
                {
                    virtualAccountNumber: "2011110001",
                    ownerType: "MERCHANT",
                    ownerId: "merchant-1",
                    settlementFineractAccountId: "500",
                    settlementFineractAccountNumber: "000000000500",
                    purpose: "COLLECTIONS"
                },
                {
                    virtualAccountNumber: "2011110002",
                    ownerType: "MERCHANT",
                    ownerId: "merchant-2",
                    settlementFineractAccountId: "501",
                    settlementFineractAccountNumber: "000000000501",
                    purpose: "COLLECTIONS"
                },
                {
                    virtualAccountNumber: "2011110003",
                    ownerType: "AGENT",
                    ownerId: "merchant-1",
                    settlementFineractAccountId: "502",
                    settlementFineractAccountNumber: "000000000502",
                    purpose: "WALLET_TOPUP"
                }
            ]);

            const response = await request(app)
                .get("/virtual-accounts?ownerType=MERCHANT&ownerId=merchant-1")
                .set("Authorization", `Bearer ${adminToken()}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].virtualAccountNumber).toBe("2011110001");

        });

        test("returns 400 for an invalid ownerType filter", async () => {

            const response = await request(app)
                .get("/virtual-accounts?ownerType=NOT_REAL")
                .set("Authorization", `Bearer ${adminToken()}`);

            expect(response.status).toBe(400);

        });

    });

    describe("PATCH /virtual-accounts/:virtualAccountNumber/status", () => {

        test("transitions ACTIVE to SUSPENDED", async () => {

            await VirtualAccountMapping.create({
                virtualAccountNumber: "2011112222",
                ownerType: "MERCHANT",
                ownerId: "merchant-1",
                settlementFineractAccountId: "500",
                settlementFineractAccountNumber: "000000000500",
                purpose: "COLLECTIONS",
                status: "ACTIVE"
            });

            const response = await request(app)
                .patch("/virtual-accounts/2011112222/status")
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({ status: "SUSPENDED" });

            expect(response.status).toBe(200);
            expect(response.body.data.status).toBe("SUSPENDED");

        });

        test("rejects an invalid status value", async () => {

            const response = await request(app)
                .patch("/virtual-accounts/2011112222/status")
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({ status: "NOT_A_STATUS" });

            expect(response.status).toBe(400);

        });

        test("rejects reopening a CLOSED virtual account", async () => {

            await VirtualAccountMapping.create({
                virtualAccountNumber: "2011112222",
                ownerType: "MERCHANT",
                ownerId: "merchant-1",
                settlementFineractAccountId: "500",
                settlementFineractAccountNumber: "000000000500",
                purpose: "COLLECTIONS",
                status: "CLOSED"
            });

            const response = await request(app)
                .patch("/virtual-accounts/2011112222/status")
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({ status: "ACTIVE" });

            expect(response.status).toBe(422);
            expect(response.body.success).toBe(false);

        });

        test("returns 404 for an unknown virtual account number", async () => {

            const response = await request(app)
                .patch("/virtual-accounts/2099999999/status")
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({ status: "SUSPENDED" });

            expect(response.status).toBe(404);

        });

    });

});
