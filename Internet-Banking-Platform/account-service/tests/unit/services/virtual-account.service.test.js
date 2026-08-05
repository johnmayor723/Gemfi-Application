jest.mock("../../../src/modules/virtual-accounts/virtual-account.repository");
jest.mock("../../../src/modules/virtual-accounts/virtual-account-number.generator");
jest.mock("../../../src/modules/accounts/account.repository");
jest.mock("../../../src/integrations/fineract");

const virtualAccountRepository =
    require("../../../src/modules/virtual-accounts/virtual-account.repository");

const virtualAccountNumberGenerator =
    require("../../../src/modules/virtual-accounts/virtual-account-number.generator");

const accountRepository =
    require("../../../src/modules/accounts/account.repository");

const { adapter: fineract } =
    require("../../../src/integrations/fineract");

const virtualAccountService =
    require("../../../src/modules/virtual-accounts/virtual-account.service");

const {
    NotFoundError,
    ConflictError,
    BusinessRuleError
} = require("../../../src/errors");

const fineractAccount = () => ({
    id: "500",
    accountNo: "000000000500",
    clientId: "900",
    displayName: "Merchant One"
});

describe("Virtual Account Service", () => {

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe("createVirtualAccount", () => {

        test("creates a mapping when settlementFineractAccountId is supplied directly", async () => {

            fineract.getAccount.mockResolvedValue(fineractAccount());

            virtualAccountNumberGenerator.generate.mockResolvedValue("2011112222");

            virtualAccountRepository.create.mockImplementation(async (data) => ({
                _id: "mapping-1",
                ...data
            }));

            const result = await virtualAccountService.createVirtualAccount({
                ownerType: "MERCHANT",
                ownerId: "merchant-1",
                settlementFineractAccountId: "500",
                purpose: "COLLECTIONS",
                label: "Invoice #100"
            });

            expect(fineract.getAccount).toHaveBeenCalledWith("500");
            expect(accountRepository.findByFineractAccountNumber).not.toHaveBeenCalled();
            expect(virtualAccountNumberGenerator.generate).toHaveBeenCalled();

            expect(result.virtualAccountNumber).toBe("2011112222");
            expect(result.settlementFineractAccountId).toBe("500");
            expect(result.settlementFineractAccountNumber).toBe("000000000500");
            expect(result.status).toBe("ACTIVE");

        });

        test("resolves the settlement account via settlementFineractAccountNumber when no id is supplied", async () => {

            accountRepository.findByFineractAccountNumber.mockResolvedValue({
                fineractAccountId: "500"
            });

            fineract.getAccount.mockResolvedValue(fineractAccount());

            virtualAccountNumberGenerator.generate.mockResolvedValue("2011112223");

            virtualAccountRepository.create.mockImplementation(async (data) => ({
                _id: "mapping-2",
                ...data
            }));

            const result = await virtualAccountService.createVirtualAccount({
                ownerType: "AGENT",
                ownerId: "agent-1",
                settlementFineractAccountNumber: "000000000500",
                purpose: "WALLET_TOPUP"
            });

            expect(accountRepository.findByFineractAccountNumber)
                .toHaveBeenCalledWith("000000000500");

            expect(fineract.getAccount).toHaveBeenCalledWith("500");

            expect(result.settlementFineractAccountId).toBe("500");

        });

        test("throws NotFoundError when settlementFineractAccountNumber does not resolve to a mapping", async () => {

            accountRepository.findByFineractAccountNumber.mockResolvedValue(null);

            await expect(
                virtualAccountService.createVirtualAccount({
                    ownerType: "AGENT",
                    ownerId: "agent-1",
                    settlementFineractAccountNumber: "does-not-exist",
                    purpose: "WALLET_TOPUP"
                })
            ).rejects.toBeInstanceOf(NotFoundError);

            expect(fineract.getAccount).not.toHaveBeenCalled();

        });

        test("throws NotFoundError when Fineract returns a 404 for the settlement account", async () => {

            fineract.getAccount.mockRejectedValue(
                new NotFoundError("Fineract savings account not found.")
            );

            await expect(
                virtualAccountService.createVirtualAccount({
                    ownerType: "MERCHANT",
                    ownerId: "merchant-1",
                    settlementFineractAccountId: "does-not-exist",
                    purpose: "COLLECTIONS"
                })
            ).rejects.toBeInstanceOf(NotFoundError);

            expect(virtualAccountNumberGenerator.generate).not.toHaveBeenCalled();

        });

        test("rethrows unexpected Fineract errors unchanged", async () => {

            const infraError = new Error("connect ECONNREFUSED");

            fineract.getAccount.mockRejectedValue(infraError);

            await expect(
                virtualAccountService.createVirtualAccount({
                    ownerType: "MERCHANT",
                    ownerId: "merchant-1",
                    settlementFineractAccountId: "500",
                    purpose: "COLLECTIONS"
                })
            ).rejects.toBe(infraError);

        });

        test("translates a duplicate virtual account number into ConflictError", async () => {

            fineract.getAccount.mockResolvedValue(fineractAccount());

            virtualAccountNumberGenerator.generate.mockResolvedValue("2011112222");

            const duplicateKeyError = new Error("E11000 duplicate key error");
            duplicateKeyError.code = 11000;

            virtualAccountRepository.create.mockRejectedValue(duplicateKeyError);

            await expect(
                virtualAccountService.createVirtualAccount({
                    ownerType: "MERCHANT",
                    ownerId: "merchant-1",
                    settlementFineractAccountId: "500",
                    purpose: "COLLECTIONS"
                })
            ).rejects.toBeInstanceOf(ConflictError);

        });

    });

    describe("getByVirtualAccountNumber", () => {

        test("returns the mapping when found", async () => {

            virtualAccountRepository.findByVirtualAccountNumber.mockResolvedValue({
                virtualAccountNumber: "2011112222"
            });

            const result = await virtualAccountService.getByVirtualAccountNumber("2011112222");

            expect(result.virtualAccountNumber).toBe("2011112222");

        });

        test("throws NotFoundError when missing", async () => {

            virtualAccountRepository.findByVirtualAccountNumber.mockResolvedValue(null);

            await expect(
                virtualAccountService.getByVirtualAccountNumber("2099999999")
            ).rejects.toBeInstanceOf(NotFoundError);

        });

    });

    describe("listByOwner", () => {

        test("builds a filter from both ownerType and ownerId", async () => {

            virtualAccountRepository.findByOwner.mockResolvedValue([]);

            await virtualAccountService.listByOwner({
                ownerType: "MERCHANT",
                ownerId: "merchant-1"
            });

            expect(virtualAccountRepository.findByOwner).toHaveBeenCalledWith({
                ownerType: "MERCHANT",
                ownerId: "merchant-1"
            });

        });

        test("builds an empty filter when neither owner field is supplied", async () => {

            virtualAccountRepository.findByOwner.mockResolvedValue([]);

            await virtualAccountService.listByOwner({});

            expect(virtualAccountRepository.findByOwner).toHaveBeenCalledWith({});

        });

    });

    describe("updateStatus", () => {

        test("transitions ACTIVE to SUSPENDED", async () => {

            virtualAccountRepository.findByVirtualAccountNumber.mockResolvedValue({
                virtualAccountNumber: "2011112222",
                status: "ACTIVE"
            });

            virtualAccountRepository.updateStatusByVirtualAccountNumber.mockResolvedValue({
                virtualAccountNumber: "2011112222",
                status: "SUSPENDED"
            });

            const result = await virtualAccountService.updateStatus("2011112222", "SUSPENDED");

            expect(result.status).toBe("SUSPENDED");

        });

        test("rejects reopening a CLOSED virtual account", async () => {

            virtualAccountRepository.findByVirtualAccountNumber.mockResolvedValue({
                virtualAccountNumber: "2011112222",
                status: "CLOSED"
            });

            await expect(
                virtualAccountService.updateStatus("2011112222", "ACTIVE")
            ).rejects.toBeInstanceOf(BusinessRuleError);

            expect(virtualAccountRepository.updateStatusByVirtualAccountNumber).not.toHaveBeenCalled();

        });

        test("rejects re-requesting the current status", async () => {

            virtualAccountRepository.findByVirtualAccountNumber.mockResolvedValue({
                virtualAccountNumber: "2011112222",
                status: "ACTIVE"
            });

            await expect(
                virtualAccountService.updateStatus("2011112222", "ACTIVE")
            ).rejects.toBeInstanceOf(BusinessRuleError);

        });

        test("throws NotFoundError when the mapping does not exist", async () => {

            virtualAccountRepository.findByVirtualAccountNumber.mockResolvedValue(null);

            await expect(
                virtualAccountService.updateStatus("2099999999", "SUSPENDED")
            ).rejects.toBeInstanceOf(NotFoundError);

        });

    });

});
