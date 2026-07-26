const mongoose = require("mongoose");

const config = require("../../src/config/app.config");

async function connect() {

    if (mongoose.connection.readyState === 0) {

        await mongoose.connect(config.mongo.uri, {
            dbName: config.mongo.database
        });

    }

}

async function clear() {

    const collections =
        mongoose.connection.collections;

    for (const key of Object.keys(collections)) {

        await collections[key].deleteMany({});

    }

}

async function disconnect() {

    await mongoose.disconnect();

}

module.exports = {

    connect,

    clear,

    disconnect

};
