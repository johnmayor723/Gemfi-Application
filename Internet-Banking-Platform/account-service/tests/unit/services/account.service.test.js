const db =
    require("../../helpers/db");

const repository =
    require("../../../src/modules/accounts/account.repository");

jest.mock("../../../src/integrations/fineract", () => ({

    adapter: {
        getAccountSummary: jest.fn()
    }

}));

const { adapter: fineract } =
    require("../../../src/integrations/fineract");

const accountService =
    require("../../../src/modules/accounts/account.service");

const { NotFoundError } =
    require("../../../src/errors");

describe("Account Service - getBalanceByAccountNumber", () => {

    beforeAll(async () => {

        await db.connect();

    });

    beforeEach(async () => {

        await db.clear();

    });

    afterAll(async () => {

        await db.disconnect();

    });

    test("returns live Fineract balance for an existing mapping", async () => {

        await repository.create({
            accountNumber: "8022233344",
            nuban: "2022233344",
            fineractAccountId: "501",
            fineractAccountNumber: "easy000000501",
            clientId: "88",
            displayName: "Test Customer",
            status: "ACTIVE"
        });

        fineract.getAccountSummary.mockResolvedValue({
            currency: "NGN",
            status: "Active",
            ledgerBalance: 15000,
            availableBalance: 14500
        });

        const result =
            await accountService.getBalanceByAccountNumber(
                "8022233344"
            );

        expect(fineract.getAccountSummary)
            .toHaveBeenCalledWith("501");

        expect(result).toEqual({
            accountNumber: "8022233344",
            currency: "NGN",
            status: "Active",
            ledgerBalance: 15000,
            availableBalance: 14500
        });

    });

    test("throws NotFoundError for an unmapped account number, without calling Fineract", async () => {

        await expect(
            accountService.getBalanceByAccountNumber(
                "8000000000"
            )
        ).rejects.toThrow(NotFoundError);

        expect(fineract.getAccountSummary)
            .not.toHaveBeenCalled();

    });

    test("propagates a Fineract failure instead of swallowing it into a null balance", async () => {

        await repository.create({
            accountNumber: "8033344455",
            nuban: "2033344455",
            fineractAccountId: "502",
            fineractAccountNumber: "easy000000502",
            clientId: "89",
            displayName: "Test Customer 2",
            status: "ACTIVE"
        });

        fineract.getAccountSummary.mockRejectedValue(
            new Error("Fineract unreachable")
        );

        await expect(
            accountService.getBalanceByAccountNumber(
                "8033344455"
            )
        ).rejects.toThrow("Fineract unreachable");

    });

});
