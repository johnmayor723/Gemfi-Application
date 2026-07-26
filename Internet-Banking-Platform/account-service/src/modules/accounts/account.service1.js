const accountRepository = require("./account.repository");
const generator = require("./account-number.generator");

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

        if (existing) {

            accountNumber =
                existing.accountNumber;

        } else {

            accountNumber =
                await generator.generate();

        }

        const payload = {

            accountNumber,

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

        };

    }

}

module.exports = new AccountService();