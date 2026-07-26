const database =
    require("./helpers/database");

beforeAll(async () => {

    await database.connect();

});

beforeEach(async () => {

    await database.clearDatabase();

});

afterAll(async () => {

    await database.closeDatabase();

});
