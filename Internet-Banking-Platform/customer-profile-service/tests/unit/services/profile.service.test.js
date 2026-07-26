jest.mock("../../../src/integrations/account/account.client");
jest.mock("../../../src/integrations/kyc/kyc.client");

const accountClient = require("../../../src/integrations/account/account.client");
const kycClient = require("../../../src/integrations/kyc/kyc.client");

const profileService = require("../../../src/modules/profile/profile.service");

describe("Profile Service", () => {

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe("getMyProfile", () => {

        test("aggregates all sources on success", async () => {

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

            const result = await profileService.getMyProfile({
                clientId: "1"
            });

            expect(result.customer.displayName).toBe("Jane Doe");
            expect(result.accounts).toHaveLength(1);
            expect(result.loans).toEqual([]);
            expect(result.kyc.kycLevel).toBe("Tier1");
            expect(result.warnings).toBeUndefined();

        });

        test("degrades gracefully when kyc-service fails", async () => {

            accountClient.getAccounts.mockResolvedValue([
                { accountNumber: "1234567890", fineractAccountId: "8" }
            ]);

            accountClient.getClient.mockResolvedValue({
                clientId: "1",
                displayName: "Jane Doe"
            });

            accountClient.getLoans.mockResolvedValue([]);

            kycClient.getStatus.mockRejectedValue(
                new Error("KYC Service is unavailable.")
            );

            const result = await profileService.getMyProfile({
                clientId: "1"
            });

            expect(result.kyc).toBeNull();
            expect(result.accounts).toHaveLength(1);
            expect(result.warnings).toEqual([
                {
                    source: "kyc",
                    message: "KYC Service is unavailable."
                }
            ]);

        });

        test("fails the whole request when accounts fail", async () => {

            accountClient.getAccounts.mockRejectedValue(
                new Error("Account Service is unavailable.")
            );

            accountClient.getClient.mockResolvedValue({});
            accountClient.getLoans.mockResolvedValue([]);
            kycClient.getStatus.mockResolvedValue({});

            await expect(
                profileService.getMyProfile({ clientId: "1" })
            ).rejects.toThrow("Account Service is unavailable.");

        });

    });

    describe("getMyTransactions", () => {

        test("resolves accountNumber to fineractAccountId and fetches transactions", async () => {

            accountClient.getAccounts.mockResolvedValue([
                { accountNumber: "1234567890", fineractAccountId: "8" }
            ]);

            accountClient.getTransactions.mockResolvedValue({
                transactions: [],
                pagination: { page: 1, limit: 20, total: 0 }
            });

            const result = await profileService.getMyTransactions(
                { clientId: "1" },
                { accountNumber: "1234567890", page: 1, limit: 20 }
            );

            expect(accountClient.getTransactions).toHaveBeenCalledWith(
                "8",
                { page: 1, limit: 20 }
            );

            expect(result.pagination.total).toBe(0);

        });

        test("rejects an account that does not belong to the user", async () => {

            accountClient.getAccounts.mockResolvedValue([
                { accountNumber: "1234567890", fineractAccountId: "8" }
            ]);

            await expect(
                profileService.getMyTransactions(
                    { clientId: "1" },
                    { accountNumber: "9999999999", page: 1, limit: 20 }
                )
            ).rejects.toThrow("Account does not belong to this user.");

        });

    });

});
