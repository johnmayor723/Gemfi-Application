jest.mock("../../src/integrations/account/account.client");
jest.mock("../../src/integrations/kyc/kyc.client");

const jwt = require("jsonwebtoken");
const request = require("supertest");

const accountClient = require("../../src/integrations/account/account.client");
const kycClient = require("../../src/integrations/kyc/kyc.client");

const app = require("../../src/app");

const token = () =>
    jwt.sign(
        {
            userId: "user-1",
            accountNumber: "1234567890",
            clientId: "1",
            username: "janedoe"
        },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
    );

describe("Profile Routes", () => {

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe("GET /profile", () => {

        test("rejects requests without a bearer token", async () => {

            const response = await request(app).get("/profile");

            expect(response.status).toBe(401);

        });

        test("returns the aggregated profile with a valid token", async () => {

            accountClient.getAccounts.mockResolvedValue([
                { accountNumber: "1234567890", fineractAccountId: "8" }
            ]);

            accountClient.getClient.mockResolvedValue({
                clientId: "1",
                displayName: "Jane Doe"
            });

            accountClient.getLoans.mockResolvedValue([]);

            kycClient.getStatus.mockResolvedValue({
                kycLevel: "Tier1",
                status: "Verified"
            });

            const response = await request(app)
                .get("/profile")
                .set("Authorization", `Bearer ${token()}`);

            expect(response.status).toBe(200);
            expect(response.body.data.customer.displayName).toBe("Jane Doe");
            expect(response.body.data.accounts).toHaveLength(1);

        });

    });

    describe("GET /profile/transactions", () => {

        test("returns 400 when accountNumber is missing", async () => {

            const response = await request(app)
                .get("/profile/transactions")
                .set("Authorization", `Bearer ${token()}`);

            expect(response.status).toBe(400);

        });

        test("returns transactions for an owned account", async () => {

            accountClient.getAccounts.mockResolvedValue([
                { accountNumber: "1234567890", fineractAccountId: "8" }
            ]);

            accountClient.getTransactions.mockResolvedValue({
                transactions: [],
                pagination: { page: 1, limit: 20, total: 0 }
            });

            const response = await request(app)
                .get("/profile/transactions?accountNumber=1234567890")
                .set("Authorization", `Bearer ${token()}`);

            expect(response.status).toBe(200);
            expect(response.body.data.pagination.total).toBe(0);

        });

        test("returns 403 for an account the user does not own", async () => {

            accountClient.getAccounts.mockResolvedValue([
                { accountNumber: "1234567890", fineractAccountId: "8" }
            ]);

            const response = await request(app)
                .get("/profile/transactions?accountNumber=9999999999")
                .set("Authorization", `Bearer ${token()}`);

            expect(response.status).toBe(403);

        });

    });

});
