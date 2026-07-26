const client = require("./fineract.client");

class AccountsApi {

    /**
     * Get savings account by ID.
     */
    async getSavingsAccount(accountId) {

        const response =
            await client.get(`/savingsaccounts/${accountId}`);

        return response.data;
    }

    /**
     * Get client by ID.
     */
    async getClient(clientId) {

        const response =
            await client.get(`/clients/${clientId}`);

        return response.data;
    }

}

module.exports = new AccountsApi();
