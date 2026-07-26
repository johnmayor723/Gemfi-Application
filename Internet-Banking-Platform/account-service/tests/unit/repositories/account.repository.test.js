const db =
    require("../../helpers/db");

const repository =
    require("../../../src/modules/accounts/account.repository");

describe("Account Repository", () => {

    beforeAll(async () => {

        await db.connect();

    });

    beforeEach(async () => {

        await db.clear();

    });

    afterAll(async () => {

        await db.disconnect();

    });

    test("repository should load", () => {

        expect(repository)
            .toBeDefined();

    });

});