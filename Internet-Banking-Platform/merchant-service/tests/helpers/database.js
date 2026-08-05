const mongoose = require("mongoose");

const {
    MongoMemoryServer
} = require("mongodb-memory-server");

let mongo;

/**
 * Start in-memory MongoDB.
 */
async function connect() {

    mongo =
        await MongoMemoryServer.create();

    const uri =
        mongo.getUri();

    await mongoose.connect(uri);

}

/**
 * Clear database.
 */
async function clearDatabase() {

    const collections =
        mongoose.connection.collections;

    for (const key in collections) {

        await collections[key].deleteMany({});

    }

}

/**
 * Stop database.
 */
async function closeDatabase() {

    await mongoose.disconnect();

    if (mongo) {

        await mongo.stop();

    }

}

module.exports = {

    connect,

    clearDatabase,

    closeDatabase

};
