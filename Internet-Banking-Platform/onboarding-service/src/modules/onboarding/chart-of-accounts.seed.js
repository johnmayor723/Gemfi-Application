/**
 * ==========================================================
 * Chart Of Accounts Seed
 * ----------------------------------------------------------
 * Baseline GL accounts every newly-approved tenant starts
 * with - 1 header + 4 detail accounts per class, matching the
 * sketch from the onboarding platform plan. This is a
 * starting point, not a final chart of accounts: every tenant
 * can edit or delete these afterward through their own
 * portal.
 *
 * Fineract's accountType enum: 1=ASSET, 2=LIABILITY,
 * 3=EQUITY, 4=INCOME, 5=EXPENSE. usage: 1=DETAIL, 2=HEADER.
 * Confirmed live against GET /glaccounts/template.
 * ==========================================================
 */

const CLASSES = [

    {

        type: 1,

        code: "1000",

        header: "Assets",

        details: [
            ["1010", "Cash and Bank Balances"],
            ["1020", "Loans to Clients"],
            ["1030", "Investments"],
            ["1040", "Other Assets"]
        ]

    },

    {

        type: 2,

        code: "2000",

        header: "Liabilities",

        details: [
            ["2010", "Client Savings Deposits"],
            ["2020", "Borrowings"],
            ["2030", "Accounts Payable"],
            ["2040", "Other Liabilities"]
        ]

    },

    {

        type: 3,

        code: "3000",

        header: "Equity",

        details: [
            ["3010", "Share Capital"],
            ["3020", "Retained Earnings"],
            ["3030", "Reserves"],
            ["3040", "Other Equity"]
        ]

    },

    {

        type: 4,

        code: "4000",

        header: "Income",

        details: [
            ["4010", "Interest Income on Loans"],
            ["4020", "Fees and Commission Income"],
            ["4030", "Investment Income"],
            ["4040", "Other Income"]
        ]

    },

    {

        type: 5,

        code: "5000",

        header: "Expenses",

        details: [
            ["5010", "Interest Expense"],
            ["5020", "Personnel Expenses"],
            ["5030", "Administrative Expenses"],
            ["5040", "Provision for Loan Losses"]
        ]

    }

];

module.exports = {
    CLASSES
};
