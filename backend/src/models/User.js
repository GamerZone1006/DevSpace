const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },

        password: {
            type: String,
            required: true,
            minlength: 6
        },

        profilePicture: {
            type: String,
            default: ""
        },

        bio: {
            type: String,
            default: ""
        },

        linkedinUrl: {
            type: String,
            default: ""
        },

        githubUrl: {
            type: String,
            default: ""
        },

        interests: {
            type: [String],
            required: true,
            default: []
        },

        interestScores: {
            type: Map,
            of: Number,
            default: {}
        },

        followers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        following: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],
        skills: {
            type: [String],
            default: []
        },

        stats: {
            postsCount: {
                type: Number,
                default: 0
            },

            followersCount: {
                type: Number,
                default: 0
            },

            followingCount: {
                type: Number,
                default: 0
            }
        },

        badges: {
            type: [String],
            default: []
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);