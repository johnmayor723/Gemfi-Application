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

const Merchant = require("../../src/modules/merchants/merchant.model");

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

const validMerchantPayload = (overrides = {}) => ({
    businessName: "Acme Retail Ltd",
    tradingName: "Acme",
    registrationNumber: "RC-100200",
    businessType: "LIMITED_LIABILITY",
    merchantCategory: "RETAIL",
    contactName: "Jane Doe",
    contactEmail: "jane@acme.example",
    contactPhone: "08012345678",
    address: "12 Broad Street, Lagos",
    ...overrides
});

const virtualAccountResponse = (overrides = {}) => ({
    virtualAccountNumber: "2011119999",
    ownerType: "MERCHANT",
    ownerId: "some-id",
    settlementFineractAccountId: "700",
    settlementFineractAccountNumber: "000000000700",
    purpose: "MERCHANT_SETTLEMENT",
    status: "ACTIVE",
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

describe("Merchant Routes", () => {

    describe("POST /merchants", () => {

        test("rejects requests without an admin token", async () => {

            const response = await request(app)
                .post("/merchants")
                .send(validMerchantPayload());

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);

        });

        test("rejects requests with an invalid admin token", async () => {

            const response = await request(app)
                .post("/merchants")
                .set("Authorization", "Bearer not-a-real-token")
                .send(validMerchantPayload());

            expect(response.status).toBe(401);

        });

        test("returns 400 when required fields are missing", async () => {

            const response = await request(app)
                .post("/merchants")
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({ businessName: "Acme Retail Ltd" });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);

        });

        test("returns 400 for an invalid businessType", async () => {

            const response = await request(app)
                .post("/merchants")
                .set("Authorization", `Bearer ${adminToken()}`)
                .send(validMerchantPayload({ businessType: "NOT_A_REAL_TYPE" }));

            expect(response.status).toBe(400);

        });

        test("creates a merchant application in PENDING status", async () => {

            const response = await request(app)
                .post("/merchants")
                .set("Authorization", `Bearer ${adminToken()}`)
                .send(validMerchantPayload());

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe("PENDING");
            expect(response.body.data.businessName).toBe("Acme Retail Ltd");

            const stored = await Merchant.findById(response.body.data._id);
            expect(stored).not.toBeNull();

        });

        test("returns 409 for a duplicate registration number", async () => {

            await Merchant.create(validMerchantPayload());

            const response = await request(app)
                .post("/merchants")
                .set("Authorization", `Bearer ${adminToken()}`)
                .send(validMerchantPayload({ contactEmail: "other@acme.example" }));

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);

        });

    });

    describe("GET /merchants", () => {

        test("rejects requests without an admin token", async () => {

            const response = await request(app).get("/merchants");

            expect(response.status).toBe(401);

        });

        test("filters by status and merchantCategory", async () => {

            await Merchant.create(validMerchantPayload({ registrationNumber: "RC-1" }));

            await Merchant.create(
                validMerchantPayload({
                    registrationNumber: "RC-2",
                    merchantCategory: "ECOMMERCE",
                    status: "ACTIVE"
                })
            );

            const response = await request(app)
                .get("/merchants?status=PENDING&merchantCategory=RETAIL")
                .set("Authorization", `Bearer ${adminToken()}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].registrationNumber).toBe("RC-1");

        });

        test("returns 400 for an invalid status filter", async () => {

            const response = await request(app)
                .get("/merchants?status=NOT_REAL")
                .set("Authorization", `Bearer ${adminToken()}`);

            expect(response.status).toBe(400);

        });

    });

    describe("GET /merchants/:id", () => {

        test("returns 400 for a malformed id", async () => {

            const response = await request(app)
                .get("/merchants/not-a-mongo-id")
                .set("Authorization", `Bearer ${adminToken()}`);

            expect(response.status).toBe(400);

        });

        test("returns 404 for an unknown merchant", async () => {

            const response = await request(app)
                .get("/merchants/64b7f9f9f9f9f9f9f9f9f9f9")
                .set("Authorization", `Bearer ${adminToken()}`);

            expect(response.status).toBe(404);

        });

        test("returns an existing merchant", async () => {

            const merchant = await Merchant.create(validMerchantPayload());

            const response = await request(app)
                .get(`/merchants/${merchant._id}`)
                .set("Authorization", `Bearer ${adminToken()}`);

            expect(response.status).toBe(200);
            expect(response.body.data.businessName).toBe("Acme Retail Ltd");

        });

    });

    describe("PATCH /merchants/:id/approve", () => {

        test("rejects requests without an admin token", async () => {

            const merchant = await Merchant.create(validMerchantPayload());

            const response = await request(app)
                .patch(`/merchants/${merchant._id}/approve`)
                .send({
                    settlementFineractAccountId: "700",
                    feeSchedule: { type: "PERCENTAGE", value: 1.5 }
                });

            expect(response.status).toBe(401);

        });

        test("returns 400 when feeSchedule is missing", async () => {

            const merchant = await Merchant.create(validMerchantPayload());

            const response = await request(app)
                .patch(`/merchants/${merchant._id}/approve`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({ settlementFineractAccountId: "700" });

            expect(response.status).toBe(400);
            expect(accountClient.createVirtualAccount).not.toHaveBeenCalled();

        });

        test("returns 400 when neither settlement identifier is supplied", async () => {

            const merchant = await Merchant.create(validMerchantPayload());

            const response = await request(app)
                .patch(`/merchants/${merchant._id}/approve`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({ feeSchedule: { type: "PERCENTAGE", value: 1.5 } });

            expect(response.status).toBe(400);

        });

        test("approves a pending merchant, provisions its settlement virtual account, and activates it", async () => {

            const merchant = await Merchant.create(validMerchantPayload());

            accountClient.createVirtualAccount.mockResolvedValue(
                virtualAccountResponse({ ownerId: String(merchant._id) })
            );

            const response = await request(app)
                .patch(`/merchants/${merchant._id}/approve`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({
                    settlementFineractAccountId: "700",
                    feeSchedule: { type: "PERCENTAGE", value: 1.5, capAmount: 500 }
                });

            expect(response.status).toBe(200);
            expect(response.body.data.status).toBe("ACTIVE");
            expect(response.body.data.settlementFineractAccountId).toBe("700");
            expect(response.body.data.settlementFineractAccountNumber).toBe("000000000700");
            expect(response.body.data.settlementVirtualAccountNumber).toBe("2011119999");
            expect(response.body.data.feeSchedule.type).toBe("PERCENTAGE");
            expect(response.body.data.feeSchedule.value).toBe(1.5);
            expect(response.body.data.reviewedBy).toBe("test-admin");
            expect(response.body.data.reviewedAt).not.toBeNull();

            expect(accountClient.createVirtualAccount).toHaveBeenCalledWith(
                expect.objectContaining({
                    ownerType: "MERCHANT",
                    ownerId: String(merchant._id),
                    settlementFineractAccountId: "700",
                    purpose: "MERCHANT_SETTLEMENT"
                })
            );

        });

        test("surfaces the account-service error and leaves status untouched when the settlement account is rejected", async () => {

            const { NotFoundError } = require("../../src/errors");

            const merchant = await Merchant.create(validMerchantPayload());

            accountClient.createVirtualAccount.mockRejectedValue(
                new NotFoundError("Settlement Fineract account not found.")
            );

            const response = await request(app)
                .patch(`/merchants/${merchant._id}/approve`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({
                    settlementFineractAccountId: "does-not-exist",
                    feeSchedule: { type: "FLAT", value: 100 }
                });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);

            const stored = await Merchant.findById(merchant._id);
            expect(stored.status).toBe("PENDING");
            expect(stored.settlementFineractAccountId).toBeNull();

        });

        test("surfaces account-service unavailability without transitioning status", async () => {

            const merchant = await Merchant.create(validMerchantPayload());

            accountClient.createVirtualAccount.mockRejectedValue(
                new Error("connect ECONNREFUSED")
            );

            const response = await request(app)
                .patch(`/merchants/${merchant._id}/approve`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({
                    settlementFineractAccountId: "700",
                    feeSchedule: { type: "FLAT", value: 100 }
                });

            expect(response.status).toBe(500);

            const stored = await Merchant.findById(merchant._id);
            expect(stored.status).toBe("PENDING");

        });

        test("rejects approving a merchant that is not PENDING", async () => {

            const merchant = await Merchant.create(
                validMerchantPayload({ status: "ACTIVE" })
            );

            const response = await request(app)
                .patch(`/merchants/${merchant._id}/approve`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({
                    settlementFineractAccountId: "700",
                    feeSchedule: { type: "FLAT", value: 100 }
                });

            expect(response.status).toBe(422);
            expect(accountClient.createVirtualAccount).not.toHaveBeenCalled();

        });

    });

    describe("PATCH /merchants/:id/reject", () => {

        test("returns 400 when rejectionReason is missing", async () => {

            const merchant = await Merchant.create(validMerchantPayload());

            const response = await request(app)
                .patch(`/merchants/${merchant._id}/reject`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({});

            expect(response.status).toBe(400);

        });

        test("rejects a pending merchant application", async () => {

            const merchant = await Merchant.create(validMerchantPayload());

            const response = await request(app)
                .patch(`/merchants/${merchant._id}/reject`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({ rejectionReason: "Incomplete documentation." });

            expect(response.status).toBe(200);
            expect(response.body.data.status).toBe("REJECTED");
            expect(response.body.data.rejectionReason).toBe("Incomplete documentation.");
            expect(response.body.data.reviewedBy).toBe("test-admin");

        });

        test("rejects rejecting a merchant that is not PENDING", async () => {

            const merchant = await Merchant.create(
                validMerchantPayload({ status: "REJECTED" })
            );

            const response = await request(app)
                .patch(`/merchants/${merchant._id}/reject`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({ rejectionReason: "Second look." });

            expect(response.status).toBe(422);

        });

    });

    describe("PATCH /merchants/:id/status", () => {

        test("rejects an invalid status value", async () => {

            const merchant = await Merchant.create(
                validMerchantPayload({ status: "ACTIVE" })
            );

            const response = await request(app)
                .patch(`/merchants/${merchant._id}/status`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({ status: "NOT_A_STATUS" });

            expect(response.status).toBe(400);

        });

        test("transitions ACTIVE to SUSPENDED", async () => {

            const merchant = await Merchant.create(
                validMerchantPayload({ status: "ACTIVE" })
            );

            const response = await request(app)
                .patch(`/merchants/${merchant._id}/status`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({ status: "SUSPENDED" });

            expect(response.status).toBe(200);
            expect(response.body.data.status).toBe("SUSPENDED");

        });

        test("transitions SUSPENDED back to ACTIVE", async () => {

            const merchant = await Merchant.create(
                validMerchantPayload({ status: "SUSPENDED" })
            );

            const response = await request(app)
                .patch(`/merchants/${merchant._id}/status`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({ status: "ACTIVE" });

            expect(response.status).toBe(200);
            expect(response.body.data.status).toBe("ACTIVE");

        });

        test("rejects a redundant same-status request", async () => {

            const merchant = await Merchant.create(
                validMerchantPayload({ status: "ACTIVE" })
            );

            const response = await request(app)
                .patch(`/merchants/${merchant._id}/status`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({ status: "ACTIVE" });

            expect(response.status).toBe(422);

        });

        test("rejects reopening a CLOSED merchant", async () => {

            const merchant = await Merchant.create(
                validMerchantPayload({ status: "CLOSED" })
            );

            const response = await request(app)
                .patch(`/merchants/${merchant._id}/status`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({ status: "ACTIVE" });

            expect(response.status).toBe(422);

        });

        test("rejects transitioning status from PENDING", async () => {

            const merchant = await Merchant.create(validMerchantPayload());

            const response = await request(app)
                .patch(`/merchants/${merchant._id}/status`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({ status: "SUSPENDED" });

            expect(response.status).toBe(422);

        });

        test("rejects transitioning status from REJECTED", async () => {

            const merchant = await Merchant.create(
                validMerchantPayload({ status: "REJECTED" })
            );

            const response = await request(app)
                .patch(`/merchants/${merchant._id}/status`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({ status: "ACTIVE" });

            expect(response.status).toBe(422);

        });

    });

    describe("PATCH /merchants/:id/fee-schedule", () => {

        test("returns 400 for an invalid fee schedule type", async () => {

            const merchant = await Merchant.create(
                validMerchantPayload({ status: "ACTIVE" })
            );

            const response = await request(app)
                .patch(`/merchants/${merchant._id}/fee-schedule`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({ feeSchedule: { type: "NOT_REAL", value: 1 } });

            expect(response.status).toBe(400);

        });

        test("updates the fee schedule for an active merchant", async () => {

            const merchant = await Merchant.create(
                validMerchantPayload({
                    status: "ACTIVE",
                    feeSchedule: { type: "FLAT", value: 100 }
                })
            );

            const response = await request(app)
                .patch(`/merchants/${merchant._id}/fee-schedule`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({ feeSchedule: { type: "PERCENTAGE", value: 2, capAmount: 1000 } });

            expect(response.status).toBe(200);
            expect(response.body.data.feeSchedule.type).toBe("PERCENTAGE");
            expect(response.body.data.feeSchedule.value).toBe(2);
            expect(response.body.data.feeSchedule.capAmount).toBe(1000);

        });

        test("rejects changing the fee schedule for a pending merchant", async () => {

            const merchant = await Merchant.create(validMerchantPayload());

            const response = await request(app)
                .patch(`/merchants/${merchant._id}/fee-schedule`)
                .set("Authorization", `Bearer ${adminToken()}`)
                .send({ feeSchedule: { type: "FLAT", value: 100 } });

            expect(response.status).toBe(422);

        });

    });

});
