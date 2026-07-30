const client = require("./fineract.client");

/**
 * One-to-one Fineract Data Table, registered against m_client,
 * that carries the two GemFi-issued identifiers onto the
 * Fineract client record itself: the phone-derived Account
 * Number and the (interim) NUBAN. Registered once via
 * scripts/register-account-identifiers-datatable.js - see that
 * script for the exact column definition.
 */
const ACCOUNT_IDENTIFIERS_DATATABLE = "client_account_identifiers";

class FineractAdapter {

    /**
     * Retrieve account information from Fineract.
     *
     * This adapter hides the fact that we make two
     * Fineract API calls (Savings Account + Client)
     * and returns one normalized object to the
     * Account Service.
     */
    async getAccount(fineractAccountId) {

        const savings =
            await client.getSavingsAccount(
                fineractAccountId
            );

        const customer =
            await client.getClient(
                savings.clientId
            );

        return {

            /**
             * Savings Account
             */
            id: String(savings.id),

            accountNo: savings.accountNo,

            /**
             * Client
             */
            clientId: String(customer.id),

            displayName:
                customer.displayName,

            firstname:
                customer.firstname,

            middlename:
                customer.middlename || null,

            lastname:
                customer.lastname,

            mobileNo:
                customer.mobileNo || null,

            emailAddress:
                customer.emailAddress || null,

            active:
                customer.active === true

        };

    }

    /**
     * Retrieve the balance/status summary for a savings account,
     * normalized for customer-facing display. Unlike getAccount(),
     * this only needs the savings account resource itself - balance,
     * currency, status, and product name all live on it directly.
     */
    async getAccountSummary(fineractAccountId) {

        const savings =
            await client.getSavingsAccount(
                fineractAccountId
            );

        return {

            productName:
                savings.savingsProductName || null,

            accountType:
                (savings.depositType && savings.depositType.value) ||
                savings.savingsProductName ||
                null,

            status:
                (savings.status && savings.status.value) || null,

            active:
                Boolean(savings.status && savings.status.active),

            currency:
                (savings.currency && savings.currency.code) || null,

            ledgerBalance:
                (savings.summary && savings.summary.accountBalance) ?? null,

            availableBalance:
                (savings.summary && savings.summary.availableBalance) ?? null

        };

    }

    /**
     * Register the phone-derived Account Number and the
     * generated NUBAN onto the Fineract client record, via the
     * client_account_identifiers Data Table.
     *
     * The datatable is one-to-one, so the first write for a
     * client must be a create; every write after that must be
     * an update. There's no cheap way to know in advance which
     * one this is, so this always attempts create first and
     * falls back to update on failure (Fineract returns an
     * error if a one-to-one entry already exists).
     */
    async setClientAccountIdentifiers(clientId, { accountNumber, nuban }) {

        const payload = {
            accountNumber,
            nuban
        };

        try {

            return await client.createDatatableEntry(
                ACCOUNT_IDENTIFIERS_DATATABLE,
                clientId,
                payload
            );

        } catch (error) {

            return await client.updateDatatableEntry(
                ACCOUNT_IDENTIFIERS_DATATABLE,
                clientId,
                payload
            );

        }

    }

}

module.exports = new FineractAdapter();