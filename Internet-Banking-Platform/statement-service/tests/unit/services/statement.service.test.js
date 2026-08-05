jest.mock("../../../src/integrations/account/account.client");

const accountClient = require("../../../src/integrations/account/account.client");

const statementService = require("../../../src/modules/statement/statement.service");

const user = { userId: "user-1", accountNumber: "1111111111" };

const account = {
    accountNumber: "1111111111",
    fineractAccountId: "10",
    displayName: "Jane Doe",
    status: "ACTIVE"
};

const fakeTransactions = [
    {
        id: 1,
        date: [2026, 7, 1],
        entryType: "CREDIT",
        amount: 1000,
        runningBalance: 1000,
        transactionType: { value: "Deposit" }
    },
    {
        id: 2,
        date: [2026, 7, 5],
        entryType: "DEBIT",
        amount: 300,
        runningBalance: 700,
        transactionType: { value: "Withdrawal" }
    },
    {
        id: 3,
        date: [2026, 7, 10],
        entryType: "CREDIT",
        amount: 500,
        runningBalance: 1200,
        transactionType: { value: "Deposit" }
    }
];

describe("Statement Service", () => {

    afterEach(() => {
        jest.resetAllMocks();
    });

    test("rejects a statement request for someone else's account", async () => {

        await expect(
            statementService.generate(user, {
                accountNumber: "9999999999",
                format: "json"
            })
        ).rejects.toThrow("your own account");

    });

    test("rejects an inactive account", async () => {

        accountClient.getAccount.mockResolvedValue({ ...account, status: "INACTIVE" });

        await expect(
            statementService.generate(user, {
                accountNumber: "1111111111",
                format: "json"
            })
        ).rejects.toThrow("not active");

    });

    test("computes opening/closing balance and summary correctly", async () => {

        accountClient.getAccount.mockResolvedValue(account);

        accountClient.getTransactions.mockResolvedValue({
            transactions: fakeTransactions,
            pagination: { page: 1, limit: 500, total: 3 }
        });

        const result = await statementService.generate(user, {
            accountNumber: "1111111111",
            startDate: "2026-07-01",
            endDate: "2026-07-31",
            format: "json"
        });

        // First line is a CREDIT of 1000 with runningBalance 1000
        // -> openingBalance = 1000 - 1000 = 0.
        expect(result.content.openingBalance).toBe(0);

        // Last line's runningBalance is the closing balance.
        expect(result.content.closingBalance).toBe(1200);

        expect(result.content.summary).toEqual({
            totalCredits: 1500,
            totalDebits: 300,
            transactionCount: 3
        });

        // Lines are sorted chronologically (by id) and internal
        // id is stripped from the public shape.
        expect(result.content.transactions.map((line) => line.date)).toEqual([
            "2026-07-01",
            "2026-07-05",
            "2026-07-10"
        ]);

        expect(result.content.transactions[0].id).toBeUndefined();

    });

    test("returns null balances when there are no transactions in range", async () => {

        accountClient.getAccount.mockResolvedValue(account);

        accountClient.getTransactions.mockResolvedValue({
            transactions: [],
            pagination: { page: 1, limit: 500, total: 0 }
        });

        const result = await statementService.generate(user, {
            accountNumber: "1111111111",
            format: "json"
        });

        expect(result.content.openingBalance).toBeNull();
        expect(result.content.closingBalance).toBeNull();

    });

    test("defaults to the current calendar month when no range is supplied", async () => {

        accountClient.getAccount.mockResolvedValue(account);
        accountClient.getTransactions.mockResolvedValue({ transactions: [], pagination: {} });

        const result = await statementService.generate(user, {
            accountNumber: "1111111111",
            format: "json"
        });

        const now = new Date();
        const expectedStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);

        expect(result.content.period.startDate).toBe(expectedStart);

    });

    test("produces a CSV export with header and summary rows", async () => {

        accountClient.getAccount.mockResolvedValue(account);

        accountClient.getTransactions.mockResolvedValue({
            transactions: fakeTransactions,
            pagination: {}
        });

        const result = await statementService.generate(user, {
            accountNumber: "1111111111",
            startDate: "2026-07-01",
            endDate: "2026-07-31",
            format: "csv"
        });

        expect(result.format).toBe("csv");
        expect(result.content).toContain("Date,Type,Description,Amount,Running Balance");
        expect(result.content).toContain("2026-07-01,CREDIT,\"Deposit\",1000,1000");
        expect(result.content).toContain("Closing Balance,1200");

    });

    test("generateForInternalCaller skips the ownership check entirely", async () => {

        accountClient.getAccount.mockResolvedValue(account);

        accountClient.getTransactions.mockResolvedValue({
            transactions: fakeTransactions,
            pagination: {}
        });

        // No `user` argument at all - an internal caller has no
        // JWT-derived accountNumber to check against.
        const result = await statementService.generateForInternalCaller({
            accountNumber: "1111111111",
            startDate: "2026-07-01",
            endDate: "2026-07-31"
        });

        expect(result.closingBalance).toBe(1200);
        expect(result.summary.transactionCount).toBe(3);

    });

    test("generateForInternalCaller defaults limit to 10 for a mini-statement, not 500", async () => {

        accountClient.getAccount.mockResolvedValue(account);
        accountClient.getTransactions.mockResolvedValue({ transactions: [], pagination: {} });

        await statementService.generateForInternalCaller({
            accountNumber: "1111111111"
        });

        expect(accountClient.getTransactions).toHaveBeenCalledWith(
            "10",
            expect.objectContaining({ limit: 10 })
        );

    });

});
