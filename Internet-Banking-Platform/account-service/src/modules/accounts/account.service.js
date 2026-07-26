const accountRepository = require("./account.repository");
const generator = require("./account-number.generator");
const phoneAccountNumberGenerator = require("./phone-account-number.generator");

const {
    ConflictError,
    NotFoundError
} = require("../../errors");

const {
    adapter: fineract
} = require("../../integrations/fineract");

class AccountService {

    /**
     * Create account mapping manually.
     */
    async createMapping(data) {

        const accountExists =
            await accountRepository.existsByAccountNumber(
                data.accountNumber
            );

        if (accountExists) {
            throw new ConflictError(
                "Account number already exists."
            );
        }

        const fineractExists =
            await accountRepository.existsByFineractAccountId(
                data.fineractAccountId
            );

        if (fineractExists) {
            throw new ConflictError(
                "Fineract account is already mapped."
            );
        }

        return accountRepository.create(data);

    }

    /**
     * Provision an Account Number for a savings account that
     * was just created in Fineract. Called directly by
     * gemfi-mfb-portal once Fineract confirms the savings account
     * exists.
     *
     * Idempotent: re-calling with the same fineractAccountId
     * after a prior success returns the same accountNumber
     * rather than regenerating one.
     */
    async provisionAccount({
        fineractAccountId,
        name,
        phoneNumber
    }) {

        const existing =
            await accountRepository.findByFineractAccountId(
                fineractAccountId
            );

        if (existing) {

            return existing;

        }

        const {
            accountNumber,
            alreadyAssigned
        } = await phoneAccountNumberGenerator.generate(
            phoneNumber
        );

        if (alreadyAssigned) {

            throw new ConflictError(
                "This account number is already assigned to another customer."
            );

        }

        const account =
            await fineract.getAccount(
                fineractAccountId
            );

        const payload = {

            accountNumber,

            nuban: null,

            fineractAccountId,

            fineractAccountNumber:
                account.accountNo,

            clientId:
                account.clientId,

            displayName: name,

            phoneNumber,

            status: "ACTIVE"

        };

        try {

            return await accountRepository.create(
                payload
            );

        } catch (error) {

            /**
             * Concurrent duplicate submission for the same
             * Fineract account - recover by returning the
             * mapping the other request created instead of
             * erroring.
             */
            if (error.code === 11000) {

                const recovered =
                    await accountRepository.findByFineractAccountId(
                        fineractAccountId
                    );

                if (recovered) {

                    return recovered;

                }

                throw new ConflictError(
                    "This account number is already assigned to another customer."
                );

            }

            throw error;

        }

    }

    /**
     * Get by external account number.
     */
    async getByAccountNumber(accountNumber) {

        const account =
            await accountRepository.findByAccountNumber(
                accountNumber
            );

        if (!account) {
            throw new NotFoundError(
                "Account mapping not found."
            );
        }

        return account;

    }

    /**
     * Get by client id.
     */
    async getByClientId(clientId) {

        return accountRepository.findByClientId(
            clientId
        );

    }

    /**
     * Get by Fineract account id.
     */
    async getByFineractAccountId(
        fineractAccountId
    ) {

        const account =
            await accountRepository.findByFineractAccountId(
                fineractAccountId
            );

        if (!account) {

            throw new NotFoundError(
                "Account mapping not found."
            );

        }

        return account;

    }

    /**
     * Name enquiry.
     */
    async nameEnquiry(accountNumber) {

        const account =
            await accountRepository.findByAccountNumber(
                accountNumber
            );

        if (!account) {

            throw new NotFoundError(
                "Account not found."
            );

        }

        return {

            accountNumber:
                account.accountNumber,

            accountName:
                account.displayName,

            status:
                account.status

        };

    }

    /**
     * Synchronize mapping from Fineract.
     */
    async syncAccount(fineractAccountId) {

        /**
         * Existing mapping.
         */
        const existing =
            await accountRepository.findByFineractAccountId(
                fineractAccountId
            );

        /**
         * Retrieve account from Fineract.
         */
        const account =
            await fineract.getAccount(
                fineractAccountId
            );

        /**
         * Preserve generated account number.
         */
        let accountNumber;
        let nuban;

        if (existing) {

            accountNumber =
                existing.accountNumber;
            nuban = existing.nuban    

        } else {

            accountNumber =
                await generator.generate();

             nuban = accountNumber
                  

        }

        const payload = {

            accountNumber,

            nuban,

            fineractAccountId:
                account.id,

            fineractAccountNumber:
                account.accountNo,

            clientId:
                account.clientId,

            displayName:
                account.displayName,

            firstName:
                account.firstname,

            middleName:
                account.middlename,

            lastName:
                account.lastname,

            phoneNumber:
                account.mobileNo,

            email:
                account.emailAddress,

            status:
                account.active
                    ? "ACTIVE"
                    : "INACTIVE"

        };

        if (existing) {

            return accountRepository.updateByFineractAccountId(

                fineractAccountId,

                payload

            );

        }

        return accountRepository.create(
            payload
        );

    }

    /**
     * Get every account owned by the authenticated customer,
     * enriched with live balance/status from Fineract. This is
     * the canonical account endpoint for the Internet Banking UI.
     *
     * The first account is marked primary - there is no stored
     * primary-account preference anywhere in the platform today,
     * so this is a computed convention, not a persisted field.
     */
    async getMyAccounts(clientId) {

        const mappings =
            await accountRepository.findByClientId(clientId);

        return Promise.all(

            mappings.map(async (mapping, index) => {

                let summary = null;

                try {

                    summary =
                        await fineract.getAccountSummary(
                            mapping.fineractAccountId
                        );

                } catch (error) {

                    summary = null;

                }

                return {

                    accountNumber: mapping.accountNumber,

                    accountType:
                        summary?.accountType || null,

                    status:
                        summary?.status || mapping.status,

                    currency:
                        summary?.currency || null,

                    ledgerBalance:
                        summary?.ledgerBalance ?? null,

                    availableBalance:
                        summary?.availableBalance ?? null,

                    productName:
                        summary?.productName || null,

                    isPrimary: index === 0

                };

            })

        );

    }

    /**
     * Validate ownership.
     */
    async validateOwnership({

        accountNumber,

        email,

        phoneNumber

    }) {

        const account =
            await accountRepository.findByAccountNumber(
                accountNumber
            );

        if (!account) {

            throw new NotFoundError(
                "Account not found."
            );

        }

        return {

            matched:

                account.email.toLowerCase() ===
                    email.toLowerCase()

                &&

                account.phoneNumber ===
                    phoneNumber

                &&

                account.status ===
                    "ACTIVE"

        };

    }

}

module.exports = new AccountService();