const { Queue } = require("bullmq");
const { createBullmqConnection } = require("../config/bullmq");

const mediaQueue = new Queue("media-processing", {
    connection: createBullmqConnection()
});

module.exports = mediaQueue;
