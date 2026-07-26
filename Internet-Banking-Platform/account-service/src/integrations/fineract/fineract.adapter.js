const client = require("./fineract.client");

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

}

module.exports = new FineractAdapter();