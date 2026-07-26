const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();

    process.env.MONGODB_URI = mongoServer.getUri();

    await mongoose.connect(process.env.MONGODB_URI, {
        dbName: process.env.MONGODB_DATABASE
    });
});

afterAll(async () => {
    await mongoose.disconnect();

    if (mongoServer) {
        await mongoServer.stop();
    }
});

beforeEach(async () => {
    const { collections } = mongoose.connection;

    for (const collection of Object.values(collections)) {
        await collection.deleteMany({});
    }
});
