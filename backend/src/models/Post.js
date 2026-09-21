const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        type: {
            type: String,
            enum: ["image", "video"],
            required: true
        },

        mediaUrl: {
            type: String,
            required: true
        },

        mediaUrls: {
            type: [String],
            default: []
        },

        publicId: {
            type: String,
            required: true
        },

        publicIds: {
            type: [String],
            default: []
        },

        thumbnailUrl: {
            type: String,
            default: ""
        },

        caption: {
            type: String,
            maxlength: 2200,
            default: ""
        },

        hashtags: {
            type: [String],
            default: []
        },

        technologyTags: {
            type: [String],
            default: []
        },

        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        likesCount: {
            type: Number,
            default: 0
        },

        commentsCount: {
            type: Number,
            default: 0
        },

        sharesCount: {
            type: Number,
            default: 0
        },

        viewsCount: {
            type: Number,
            default: 0
        },

        viewers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],

        reporters: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],

        savesCount: {
            type: Number,
            default: 0
        },

        status: {
            type: String,
            enum: ["processing", "ready", "published", "rejected", "removed"],
            default: "processing"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Post", postSchema);
