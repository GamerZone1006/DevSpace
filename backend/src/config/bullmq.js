const IORedis = require("ioredis");

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const createBullmqConnection = () =>
    new IORedis(redisUrl, {
        maxRetriesPerRequest: null
    });

module.exports = {
    createBullmqConnection
};
