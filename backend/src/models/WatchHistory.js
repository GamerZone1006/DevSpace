const mongoose = require("mongoose");

const watchHistorySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
            required: true
        },

        watchDuration: {
            type: Number,
            default: 0
        },

        videoDuration: {
            type: Number,
            default: 0
        },

        completionRate: {
            type: Number,
            default: 0
        },

        watchCount: {
            type: Number,
            default: 1
        },

        liked: {
            type: Boolean,
            default: false
        },

        saved: {
            type: Boolean,
            default: false
        },

        shared: {
            type: Boolean,
            default: false
        },

        lastWatchedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

watchHistorySchema.index(
    { user: 1, post: 1 },
    { unique: true }
);

module.exports = mongoose.model(
    "WatchHistory",
    watchHistorySchema
);