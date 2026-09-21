const Post = require("../models/Post");
const SavedPost = require("../models/SavedPost");
const WatchHistory = require("../models/WatchHistory");
const {
    updateInterestScores
} = require("../services/interestLearningService");
const { formatPost } = require("../utils/formatPost");

const toggleSave = async (req, res) => {
    try {
        const postId = req.params.postId;
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const existingSave = await SavedPost.findOne({ user: req.userId, post: postId });

        if (existingSave) {
            await SavedPost.findByIdAndDelete(existingSave._id);

            const updatedPost = await Post.findByIdAndUpdate(
                postId,
                { $inc: { savesCount: -1 } },
                { new: true }
            );

            const savesCount = Math.max(0, updatedPost?.savesCount ?? 0);
            if (updatedPost && updatedPost.savesCount < 0) {
                updatedPost.savesCount = 0;
                await updatedPost.save();
            }

            await WatchHistory.findOneAndUpdate(
                { user: req.userId, post: postId },
                { saved: false }
            );

            return res.status(200).json({
                saved: false,
                savedByMe: false,
                savesCount
            });
        }

        await SavedPost.create({ user: req.userId, post: postId });

        const updatedPost = await Post.findByIdAndUpdate(
            postId,
            { $inc: { savesCount: 1 } },
            { new: true }
        );

        await updateInterestScores(req.userId, postId, {
            completionRate: 1, watchCount: 1, liked: false, saved: true, shared: false
        });

        await WatchHistory.findOneAndUpdate(
            { user: req.userId, post: postId },
            { saved: true }
        );

        res.status(200).json({
            saved: true,
            savedByMe: true,
            savesCount: Math.max(0, updatedPost?.savesCount ?? 1)
        });
    } catch (error) {
        console.error("Save error:", error);
        res.status(500).json({ message: "Failed to save post" });
    }
};

const sharePost = async (req, res) => {
    try {
        const postId = req.params.postId;
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        const updatedPost = await Post.findByIdAndUpdate(
            postId,
            { $inc: { sharesCount: 1 } },
            { new: true }
        );

        await updateInterestScores(
            req.userId,
            postId,
            {
                completionRate: 1,
                watchCount: 1,
                liked: false,
                saved: false,
                shared: true
            }
        );

        await WatchHistory.findOneAndUpdate(
            { user: req.userId, post: postId },
            { shared: true }
        );

        res.status(200).json({
            message: "Post shared",
            sharesCount: updatedPost?.sharesCount ?? post.sharesCount + 1
        });
    } catch (error) {
        console.error("Share error:", error);

        res.status(500).json({
            message: "Failed to share post"
        });
    }
};

const getSavedPosts = async (req, res) => {
    try {
        const savedPosts = await SavedPost.find({ user: req.userId })
            .sort({ createdAt: -1 })
            .populate({
                path: "post",
                populate: {
                    path: "author",
                    select: "name username profilePicture bio"
                }
            });

        const posts = savedPosts
            .filter((savedPost) => savedPost.post)
            .map((savedPost) => formatPost(savedPost.post, req.userId, new Set([savedPost.post._id.toString()])));

        res.status(200).json({ posts });
    } catch (error) {
        console.error("Saved posts error:", error);
        res.status(500).json({ message: "Failed to load saved posts" });
    }
};

module.exports = {
    toggleSave,
    sharePost,
    getSavedPosts
};
