jest.mock("../../../src/modules/beneficiary/beneficiary.repository");
jest.mock("../../../src/integrations/account/account.client");

const repository = require("../../../src/modules/beneficiary/beneficiary.repository");
const accountClient = require("../../../src/integrations/account/account.client");

const beneficiaryService = require("../../../src/modules/beneficiary/beneficiary.service");

const user = { userId: "user-1", accountNumber: "1111111111" };

describe("Beneficiary Service", () => {

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe("create", () => {

        test("same-bank: verifies via Account Service and auto-fills accountName", async () => {

            repository.findDuplicate.mockResolvedValue(null);

            accountClient.getAccount.mockResolvedValue({
                accountNumber: "2222222222",
                displayName: "Real Account Holder",
                status: "ACTIVE"
            });

            repository.create.mockImplementation(async (data) => ({ id: "ben-1", ...data }));

            const result = await beneficiaryService.create(
                user,
                {
                    accountNumber: "2222222222",
                    accountName: "Whatever The User Typed",
                    nickname: "Mom"
                },
                {}
            );

            expect(result.type).toBe("SAME_BANK");
            expect(result.accountName).toBe("Real Account Holder");
            expect(repository.create).toHaveBeenCalledWith(
                expect.objectContaining({ accountName: "Real Account Holder", bankName: null })
            );

        });

        test("other-bank: stores accountName/bankName as supplied, unverified", async () => {

            repository.findDuplicate.mockResolvedValue(null);

            repository.create.mockImplementation(async (data) => ({ id: "ben-2", ...data }));

            const result = await beneficiaryService.create(
                user,
                {
                    accountNumber: "3333333333",
                    bankCode: "058",
                    bankName: "GTBank",
                    accountName: "John Doe"
                },
                {}
            );

            expect(result.type).toBe("OTHER_BANK");
            expect(result.accountName).toBe("John Doe");
            expect(result.bankName).toBe("GTBank");
            expect(accountClient.getAccount).not.toHaveBeenCalled();

        });

        test("rejects a duplicate beneficiary", async () => {

            repository.findDuplicate.mockResolvedValue({ id: "existing" });

            await expect(
                beneficiaryService.create(user, { accountNumber: "2222222222" }, {})
            ).rejects.toThrow("already been saved");

        });

    });

    describe("update", () => {

        test("rejects updating someone else's beneficiary", async () => {

            repository.findById.mockResolvedValue({
                id: "ben-1",
                userId: "someone-else"
            });

            await expect(
                beneficiaryService.update(user, "ben-1", { nickname: "New" })
            ).rejects.toThrow("does not belong to you");

        });

        test("only touches nickname/isFavorite", async () => {

            repository.findById.mockResolvedValue({
                id: "ben-1",
                userId: "user-1"
            });

            repository.update.mockResolvedValue({
                id: "ben-1",
                nickname: "New nickname",
                isFavorite: true
            });

            await beneficiaryService.update(user, "ben-1", {
                nickname: "New nickname",
                isFavorite: true
            });

            expect(repository.update).toHaveBeenCalledWith(
                "ben-1",
                { nickname: "New nickname", isFavorite: true }
            );

        });

    });

    describe("remove", () => {

        test("rejects removing a non-existent beneficiary", async () => {

            repository.findById.mockResolvedValue(null);

            await expect(
                beneficiaryService.remove(user, "ben-404")
            ).rejects.toThrow("Beneficiary not found");

        });

        test("deletes an owned beneficiary", async () => {

            repository.findById.mockResolvedValue({
                id: "ben-1",
                userId: "user-1"
            });

            repository.delete.mockResolvedValue({});

            const result = await beneficiaryService.remove(user, "ben-1");

            expect(result.deleted).toBe(true);

        });

    });

});
