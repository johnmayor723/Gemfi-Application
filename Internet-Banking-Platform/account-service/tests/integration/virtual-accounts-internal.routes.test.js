jest.mock("../../src/integrations/fineract", () => ({

    adapter: {
        getAccount: jest.fn(),
        getAccountSummary: jest.fn(),
        setClientAccountIdentifiers: jest.fn()
    },

    client: {},

    authClient: {}

}));

const request = require("supertest");

const database = require("../helpers/database");

const appConfig = require("../../src/config/app.config");

const app = require("../../src/app");

const { adapter: fineractAdapter } = require("../../src/integrations/fineract");

const AccountMapping = require("../../src/modules/accounts/account.model");
const VirtualAccountMapping = require("../../src/modules/virtual-accounts/virtual-account.model");

const { NotFoundError } = require("../../src/errors");

const INTERNAL_TOKEN = appConfig.internalServiceToken;

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
});

describe("Internal Virtual Account Routes", () => {

    describe("POST /internal/virtual-accounts", () => {

        test("rejects requests without an internal token", async () => {

            const response = await request(app)
                .post("/internal/virtual-accounts")
                .send({
                    ownerType: "MERCHANT",
                    ownerId: "merchant-1",
                    settlementFineractAccountId: "500",
                    purpose: "MERCHANT_SETTLEMENT"
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);

        });

        test("rejects requests with an invalid internal token", async () => {

            const response = await request(app)
                .post("/internal/virtual-accounts")
                .set("x-internal-token", "not-the-real-token")
                .send({
                    ownerType: "MERCHANT",
                    ownerId: "merchant-1",
                    settlementFineractAccountId: "500",
                    purpose: "MERCHANT_SETTLEMENT"
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);

        });

        test("returns 400 when required fields are missing", async () => {

            const response = await request(app)
                .post("/internal/virtual-accounts")
                .set("x-internal-token", INTERNAL_TOKEN)
                .send({
                    ownerType: "MERCHANT"
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);

        });

        test("returns 404 when the settlement Fineract account does not exist", async () => {

            fineractAdapter.getAccount.mockRejectedValue(
                new NotFoundError("Fineract savings account not found.")
            );

            const response = await request(app)
                .post("/internal/virtual-accounts")
                .set("x-internal-token", INTERNAL_TOKEN)
                .send({
                    ownerType: "MERCHANT",
                    ownerId: "merchant-1",
                    settlementFineractAccountId: "does-not-exist",
                    purpose: "MERCHANT_SETTLEMENT"
                });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);

        });

        test("creates a virtual account mapped to an existing settlement account", async () => {

            fineractAdapter.getAccount.mockResolvedValue(fineractAccount());

            const response = await request(app)
                .post("/internal/virtual-accounts")
                .set("x-internal-token", INTERNAL_TOKEN)
                .send({
                    ownerType: "MERCHANT",
                    ownerId: "merchant-1",
                    settlementFineractAccountId: "500",
                    purpose: "MERCHANT_SETTLEMENT",
                    label: "Merchant One Settlement"
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            expect(response.body.data.virtualAccountNumber).toHaveLength(10);
            expect(response.body.data.settlementFineractAccountId).toBe("500");
            expect(response.body.data.settlementFineractAccountNumber).toBe("000000000500");
            expect(response.body.data.status).toBe("ACTIVE");
            expect(response.body.data.ownerType).toBe("MERCHANT");

            const stored = await VirtualAccountMapping.findOne({
                virtualAccountNumber: response.body.data.virtualAccountNumber
            });

            expect(stored).not.toBeNull();

        });

        test("resolves the settlement account via settlementFineractAccountNumber", async () => {

            await AccountMapping.create({
                accountNumber: "1234567890",
                fineractAccountId: "500",
                fineractAccountNumber: "000000000500",
                clientId: "900",
                displayName: "Merchant One",
                phoneNumber: "08012345678",
                email: "merchant@example.com",
                status: "ACTIVE"
            });

            fineractAdapter.getAccount.mockResolvedValue(fineractAccount());

            const response = await request(app)
                .post("/internal/virtual-accounts")
                .set("x-internal-token", INTERNAL_TOKEN)
                .send({
                    ownerType: "MERCHANT",
                    ownerId: "merchant-1",
                    settlementFineractAccountNumber: "000000000500",
                    purpose: "MERCHANT_SETTLEMENT"
                });

            expect(response.status).toBe(200);
            expect(response.body.data.settlementFineractAccountId).toBe("500");

        });

    });

    describe("GET /internal/virtual-accounts/:virtualAccountNumber", () => {

        test("rejects requests without an internal token", async () => {

            const response = await request(app)
                .get("/internal/virtual-accounts/2011112222");

            expect(response.status).toBe(401);

        });

        test("returns 404 when the virtual account number is unknown", async () => {

            const response = await request(app)
                .get("/internal/virtual-accounts/2099999999")
                .set("x-internal-token", INTERNAL_TOKEN);

            expect(response.status).toBe(404);

        });

        test("resolves an existing virtual account", async () => {

            await VirtualAccountMapping.create({
                virtualAccountNumber: "2011112222",
                ownerType: "MERCHANT",
                ownerId: "merchant-1",
                settlementFineractAccountId: "500",
                settlementFineractAccountNumber: "000000000500",
                purpose: "MERCHANT_SETTLEMENT",
                status: "ACTIVE"
            });

            const response = await request(app)
                .get("/internal/virtual-accounts/2011112222")
                .set("x-internal-token", INTERNAL_TOKEN);

            expect(response.status).toBe(200);
            expect(response.body.data.virtualAccountNumber).toBe("2011112222");

        });

    });

    describe("GET /internal/virtual-accounts", () => {

        test("rejects requests without an internal token", async () => {

            const response = await request(app)
                .get("/internal/virtual-accounts?ownerType=MERCHANT&ownerId=merchant-1");

            expect(response.status).toBe(401);

        });

        test("filters by ownerType and ownerId", async () => {

            await VirtualAccountMapping.create([
                {
                    virtualAccountNumber: "2011110001",
                    ownerType: "MERCHANT",
                    ownerId: "merchant-1",
                    settlementFineractAccountId: "500",
                    settlementFineractAccountNumber: "000000000500",
                    purpose: "MERCHANT_SETTLEMENT"
                },
                {
                    virtualAccountNumber: "2011110002",
                    ownerType: "MERCHANT",
                    ownerId: "merchant-2",
                    settlementFineractAccountId: "501",
                    settlementFineractAccountNumber: "000000000501",
                    purpose: "MERCHANT_SETTLEMENT"
                }
            ]);

            const response = await request(app)
                .get("/internal/virtual-accounts?ownerType=MERCHANT&ownerId=merchant-1")
                .set("x-internal-token", INTERNAL_TOKEN);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].virtualAccountNumber).toBe("2011110001");

        });

    });

});
