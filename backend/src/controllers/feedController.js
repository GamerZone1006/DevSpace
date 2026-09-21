const Post = require("../models/Post");
const User = require("../models/User");
const SavedPost = require("../models/SavedPost");
const { generateRecommendations } = require("../services/recommendationService");
const { redisClient } = require("../config/redis");
const { formatPost } = require("../utils/formatPost");

const annotateFeed = async (userId, posts) => {
    const savedPosts = await SavedPost.find({
        user: userId,
        post: { $in: posts.map((p) => p._id) }
    });
    const savedSet = new Set(savedPosts.map((sp) => sp.post.toString()));

    return posts.map((post) => formatPost(post, userId, savedSet));
};

const getFollowingFeed = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const posts = await Post.find({
            author: { $in: user.following },
            status: { $in: ["ready", "published"] }
        })
            .populate("author", "name username profilePicture bio")
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json({ feed: await annotateFeed(req.userId, posts) });
    } catch (error) {
        console.error("Following feed error:", error);
        res.status(500).json({ message: "Failed to load following feed" });
    }
};

const getForYouFeed = async (req, res) => {
    try {
        const recommendations = await generateRecommendations(req.userId, 50, {
            prioritizeNewest: req.query.initial === "true"
        });
        const posts = recommendations.map((item) => item.post);
        const savedPosts = await SavedPost.find({
            user: req.userId,
            post: { $in: posts.map((p) => p._id) }
        });
        const savedSet = new Set(savedPosts.map((sp) => sp.post.toString()));

        const feed = recommendations.map((item) => ({
            ...formatPost(item.post, req.userId, savedSet),
            recommendationScore: item.recommendationScore
        }));

        try {
            if (redisClient.isOpen) {
                await redisClient.setEx(
                    `feed:for-you:ids:${req.userId}`,
                    60,
                    JSON.stringify(feed.map((post) => post._id))
                );
            }
        } catch (cacheError) {
            console.warn("For You cache skipped:", cacheError.message);
        }

        res.status(200).json({ feed });
    } catch (error) {
        console.error("For You feed error:", error);
        res.status(500).json({ message: "Failed to generate recommendations" });
    }
};

module.exports = { getFollowingFeed, getForYouFeed };
