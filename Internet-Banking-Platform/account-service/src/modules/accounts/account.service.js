const accountRepository = require("./account.repository");
const nubanGenerator = require("./nuban.generator");
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
     *
     * Every provisioned account is assigned two GemFi-issued
     * identifiers: a phone-derived accountNumber (the customer's
     * permanent, official account number) and a generated nuban
     * (an interim, NIBSS-shaped identifier used until a real
     * NIBSS integration exists). Both are also registered onto
     * the Fineract client record itself, best-effort, via
     * FineractAdapter#setClientAccountIdentifiers.
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

        const nuban =
            await nubanGenerator.generate();

        const payload = {

            accountNumber,

            nuban,

            fineractAccountId,

            fineractAccountNumber:
                account.accountNo,

            clientId:
                account.clientId,

            displayName: name,

            phoneNumber,

            status: "ACTIVE"

        };

        let created;

        try {

            created = await accountRepository.create(
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

        await this._registerIdentifiersWithFineract(
            account.clientId,
            accountNumber,
            nuban
        );

        return created;

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
     * Get live Fineract balance for an internal caller (e.g.
     * ussd-service, which has no customer JWT to use against
     * GET /accounts/me). Unlike getMyAccounts(), a Fineract
     * failure here is NOT swallowed into a null-balance summary -
     * this endpoint exists solely to report a balance, so a
     * failure to reach Fineract should surface as a real error
     * for the caller to handle, not a silent 200 with nothing in
     * it.
     */
    async getBalanceByAccountNumber(accountNumber) {

        const account =
            await this.getByAccountNumber(accountNumber);

        const summary =
            await fineract.getAccountSummary(
                account.fineractAccountId
            );

        return {

            accountNumber:
                account.accountNumber,

            currency:
                summary.currency,

            status:
                summary.status,

            ledgerBalance:
                summary.ledgerBalance,

            availableBalance:
                summary.availableBalance

        };

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
     * Get by phone number.
     */
    async getByPhoneNumber(phoneNumber) {

        const account =
            await accountRepository.findByPhoneNumber(
                phoneNumber
            );

        if (!account) {

            throw new NotFoundError(
                "Account mapping not found."
            );

        }

        return account;

    }

    /**
     * Get by NUBAN.
     */
    async getByNuban(nuban) {

        const account =
            await accountRepository.findByNuban(
                nuban
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
     *
     * Used to backfill a mapping that provisionAccount never
     * created (e.g. the call was dropped between Fineract
     * confirming the savings account and gemfi-mfb-portal reaching
     * account-service). Uses the same identifier rules as
     * provisionAccount: a fresh mapping always gets a
     * phone-derived accountNumber and a generated nuban, never
     * a Fineract-assigned number.
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
         * Preserve generated identifiers on an existing mapping;
         * derive them fresh for a new one.
         */
        let accountNumber;
        let nuban;

        if (existing) {

            accountNumber =
                existing.accountNumber;
            nuban = existing.nuban;

        } else {

            accountNumber =
                phoneAccountNumberGenerator.deriveFromPhoneNumber(
                    account.mobileNo
                );

            nuban =
                await nubanGenerator.generate();

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

        let created;

        try {

            created = await accountRepository.create(
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

        await this._registerIdentifiersWithFineract(
            account.clientId,
            accountNumber,
            nuban
        );

        return created;

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

    /**
     * Push the phone-derived accountNumber and the generated
     * nuban onto the Fineract client record. Best-effort: a
     * Fineract-side failure here does not fail account
     * provisioning, since the Mongo mapping (the platform's
     * source of truth for these identifiers) already succeeded.
     * A retriable backfill is what syncAccount is for.
     */
    async _registerIdentifiersWithFineract(clientId, accountNumber, nuban) {

        try {

            await fineract.setClientAccountIdentifiers(
                clientId,
                {
                    accountNumber,
                    nuban
                }
            );

        } catch (error) {

            console.error(
                `Failed to register account identifiers on Fineract client ${clientId}:`,
                error.message
            );

        }

    }

}

module.exports = new AccountService();