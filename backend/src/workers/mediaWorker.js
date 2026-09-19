const { Worker } = require("bullmq");
const Post = require("../models/Post");
const { processMedia } = require("../services/mediaProcessingService");
const { createBullmqConnection } = require("../config/bullmq");

const worker = new Worker(
    "media-processing",
    async (job) => {
        const { postId, type, publicId } = job.data;

        console.log(`Processing media job ${job.id} for post ${postId}`);

        const result = await processMedia(type, publicId);

        await Post.findByIdAndUpdate(postId, {
            mediaUrl: result.optimizedUrl,
            mediaUrls: [result.optimizedUrl],
            thumbnailUrl: result.thumbnailUrl || "",
            status: "ready"
        });

        console.log(`Media job ${job.id} completed — post ${postId} is ready`);

        return result;
    },
    {
        connection: createBullmqConnection()
    }
);

worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed successfully`);
});

worker.on("failed", async (job, error) => {
    console.error(`Job ${job?.id} failed:`, error.message);

    if (job?.data?.postId) {
        await Post.findByIdAndUpdate(job.data.postId, {
            status: "rejected"
        });
    }
});

console.log("Media worker started");

module.exports = worker;
