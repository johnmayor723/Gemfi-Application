const { client: accountClient } = require("../../integrations/account");

const { client: kycClient } = require("../../integrations/kyc");

const { AuthorizationError } = require("../../errors");

const profileRepository = require("./profile.repository");

class ProfileService {

    /**
     * ==========================================================
     * Get My Profile
     * ==========================================================
     *
     * Aggregates customer info, savings accounts, loan accounts,
     * and KYC status from Account Service and KYC Service.
     *
     * A failed non-essential source (customer info, loans, kyc)
     * degrades to a `warnings` entry rather than failing the
     * whole request. The accounts list is essential — if it
     * fails, the request fails.
     */
    async getMyProfile(user) {

        const {
            clientId
        } = user;

        const [
            accountsResult,
            clientResult,
            loansResult,
            kycResult,
            preferenceResult
        ] = await Promise.allSettled([

            accountClient.getAccounts(clientId),

            accountClient.getClient(clientId),

            accountClient.getLoans(clientId),

            kycClient.getStatus(clientId),

            profileRepository.findByClientId(clientId)

        ]);

        if (accountsResult.status === "rejected") {

            throw accountsResult.reason;

        }

        const warnings = [];

        if (clientResult.status === "rejected") {

            warnings.push({
                source: "customer",
                message: clientResult.reason.message
            });

        }

        if (loansResult.status === "rejected") {

            warnings.push({
                source: "loans",
                message: loansResult.reason.message
            });

        }

        if (kycResult.status === "rejected") {

            warnings.push({
                source: "kyc",
                message: kycResult.reason.message
            });

        }

        const preference =
            preferenceResult.status === "fulfilled"
                ? preferenceResult.value
                : null;

        const response = {

            customer:
                clientResult.status === "fulfilled"
                    ? clientResult.value
                    : null,

            accounts:
                accountsResult.value,

            loans:
                loansResult.status === "fulfilled"
                    ? loansResult.value
                    : [],

            kyc:
                kycResult.status === "fulfilled"
                    ? kycResult.value
                    : null,

            preferences: {

                displayName:
                    preference?.displayName ?? null,

                notificationsEnabled:
                    preference?.notificationsEnabled ?? true

            }

        };

        if (warnings.length > 0) {

            response.warnings = warnings;

        }

        return response;

    }

    /**
     * ==========================================================
     * Update My Profile
     * ==========================================================
     *
     * Only updates preferences this service owns. Demographic
     * fields (name, email, phone, address) live in Fineract via
     * Account Service and are never writable here.
     */
    async updateMyProfile(user, data) {

        const {
            clientId
        } = user;

        const preference =
            await profileRepository.upsert(clientId, data);

        return {

            displayName:
                preference.displayName,

            notificationsEnabled:
                preference.notificationsEnabled

        };

    }

    /**
     * ==========================================================
     * Get My Transactions
     * ==========================================================
     *
     * Never trusts a raw Fineract account ID from the client —
     * resolves accountNumber against the user's own account
     * list first, then translates to the Fineract account ID.
     */
    async getMyTransactions(
        user,
        {
            accountNumber,
            page,
            limit
        }
    ) {

        const {
            clientId
        } = user;

        const accounts =
            await accountClient.getAccounts(clientId);

        const account =
            accounts.find(
                (item) =>
                    item.accountNumber === accountNumber
            );

        if (!account) {

            throw new AuthorizationError(
                "Account does not belong to this user."
            );

        }

        return accountClient.getTransactions(
            account.fineractAccountId,
            {
                page,
                limit
            }
        );

    }

}

module.exports = new ProfileService();
