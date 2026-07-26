const { client: fineractClient } = require("../../integrations/fineract");

class CustomerService {

    /**
     * Get Fineract client demographic info.
     */
    async getClient(clientId) {

        const customer =
            await fineractClient.getClient(clientId);

        return {

            clientId: String(customer.id),

            displayName:
                customer.displayName,

            firstName:
                customer.firstname,

            middleName:
                customer.middlename || null,

            lastName:
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
     * Get loan accounts for a client.
     */
    async getLoans(clientId) {

        const accounts =
            await fineractClient.getClientAccounts(clientId);

        return accounts.loanAccounts || [];

    }

    /**
     * Get transactions for a savings account.
     *
     * Fineract returns the full transaction list embedded on
     * the account (no native pagination or date filtering for
     * this association), so both are applied here — the
     * optional startDate/endDate filter runs before the
     * pagination slice.
     */
    async getTransactions(
        accountId,
        {
            page = 1,
            limit = 20,
            startDate,
            endDate
        } = {}
    ) {

        let transactions =
            await fineractClient.getSavingsTransactions(
                accountId
            );

        if (startDate || endDate) {

            const start =
                startDate ? new Date(startDate) : null;

            const end =
                endDate ? new Date(endDate) : null;

            transactions =
                transactions.filter((transaction) => {

                    const [
                        year,
                        month,
                        day
                    ] = transaction.date;

                    const transactionDate =
                        new Date(
                            Date.UTC(year, month - 1, day)
                        );

                    if (start && transactionDate < start) {

                        return false;

                    }

                    if (end && transactionDate > end) {

                        return false;

                    }

                    return true;

                });

        }

        const total = transactions.length;

        const sliceStart = (page - 1) * limit;

        const pageItems =
            transactions.slice(
                sliceStart,
                sliceStart + limit
            );

        return {

            transactions: pageItems,

            pagination: {

                page,

                limit,

                total

            }

        };

    }

}

module.exports = new CustomerService();
