const { client: accountClient } = require("../../integrations/account");

const { AuthorizationError, BusinessRuleError } = require("../../errors");

class StatementService {

    /**
     * ==========================================================
     * Generate Statement
     * ==========================================================
     *
     * Self-service only — accountNumber must belong to the
     * caller. No cross-user statement access without a roles
     * system, which doesn't exist yet.
     */
    async generate(user, { accountNumber, startDate, endDate, format }) {

        if (accountNumber !== user.accountNumber) {

            throw new AuthorizationError(
                "You can only request a statement for your own account."
            );

        }

        const account =
            await accountClient.getAccount(accountNumber);

        if (account.status !== "ACTIVE") {

            throw new BusinessRuleError(
                "Account is not active."
            );

        }

        const range =
            this.resolveRange(startDate, endDate);

        const result =
            await accountClient.getTransactions(
                account.fineractAccountId,
                {
                    startDate: range.startDate,
                    endDate: range.endDate,
                    limit: 500
                }
            );

        const lines =
            result.transactions
                .map((transaction) => this.toStatementLine(transaction))
                .sort((a, b) => a.id - b.id)
                .map(({ id, ...line }) => line);

        const { openingBalance, closingBalance } =
            this.computeBalances(lines);

        const summary =
            this.computeSummary(lines);

        const statement = {

            accountNumber: account.accountNumber,

            accountName: account.displayName,

            period: range,

            openingBalance,

            closingBalance,

            summary,

            transactions: lines

        };

        if (format === "csv") {

            return {
                format: "csv",
                content: this.toCsv(statement)
            };

        }

        return {
            format: "json",
            content: statement
        };

    }

    /**
     * Default to the current calendar month when no range is
     * supplied — a sensible "my statement" default with zero
     * params.
     */
    resolveRange(startDate, endDate) {

        const now = new Date();

        const defaultStart =
            new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
                .toISOString()
                .slice(0, 10);

        const defaultEnd =
            now.toISOString().slice(0, 10);

        return {
            startDate: startDate || defaultStart,
            endDate: endDate || defaultEnd
        };

    }

    /**
     * Normalizes a raw Fineract transaction into a clean
     * statement line. `id` is kept only for sorting and
     * stripped before the line is returned to the caller.
     */
    toStatementLine(transaction) {

        const [
            year,
            month,
            day
        ] = transaction.date;

        return {

            id: transaction.id,

            date:
                new Date(Date.UTC(year, month - 1, day))
                    .toISOString()
                    .slice(0, 10),

            type:
                transaction.entryType === "CREDIT" ? "CREDIT" : "DEBIT",

            amount: transaction.amount,

            runningBalance: transaction.runningBalance,

            description:
                (transaction.transactionType && transaction.transactionType.value) ||
                "Transaction"

        };

    }

    /**
     * Reverse-engineers the balance immediately before the first
     * line in range from its own runningBalance + amount, since
     * the date-filtered result set doesn't include the
     * transaction just before the range. No transactions in
     * range means the balance can't be determined without
     * extending the range — returned as null, not guessed.
     */
    computeBalances(lines) {

        if (lines.length === 0) {

            return {
                openingBalance: null,
                closingBalance: null
            };

        }

        const first = lines[0];

        const last = lines[lines.length - 1];

        const openingBalance =
            first.type === "CREDIT"
                ? first.runningBalance - first.amount
                : first.runningBalance + first.amount;

        return {
            openingBalance,
            closingBalance: last.runningBalance
        };

    }

    computeSummary(lines) {

        const totalCredits =
            lines
                .filter((line) => line.type === "CREDIT")
                .reduce((sum, line) => sum + line.amount, 0);

        const totalDebits =
            lines
                .filter((line) => line.type === "DEBIT")
                .reduce((sum, line) => sum + line.amount, 0);

        return {
            totalCredits,
            totalDebits,
            transactionCount: lines.length
        };

    }

    toCsv(statement) {

        const header =
            "Date,Type,Description,Amount,Running Balance";

        const rows =
            statement.transactions.map(
                (line) =>
                    `${line.date},${line.type},"${line.description.replace(/"/g, '""')}",${line.amount},${line.runningBalance}`
            );

        const summaryLines = [
            "",
            `Account,${statement.accountNumber}`,
            `Account Name,${statement.accountName}`,
            `Period,${statement.period.startDate} to ${statement.period.endDate}`,
            `Opening Balance,${statement.openingBalance ?? "N/A"}`,
            `Closing Balance,${statement.closingBalance ?? "N/A"}`,
            `Total Credits,${statement.summary.totalCredits}`,
            `Total Debits,${statement.summary.totalDebits}`
        ];

        return [header, ...rows, ...summaryLines].join("\n");

    }

}

module.exports = new StatementService();
