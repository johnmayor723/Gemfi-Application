const app = require("./app");
const env = require("./config/env");
const connectDB = require("./config/database");
const logger = require("./utils/logger");
const port = env.port || process.env.PORT || 4000;

(async () => {

    await connectDB();

    app.listen(port, () => {

        logger.info(`KYC Service running on port ${env.port}`);
        logger.info("MongoDB Connected");
        //logger.error(error.message);
    });

})();