const Post = require("../models/Post");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");
const WatchHistory = require("../models/WatchHistory");
const {
    updateInterestScores
} = require("../services/interestLearningService");
const {
    validateContent
} = require("../services/contentValidationService");
const mediaQueue = require("../queues/mediaQueue");
const { processMedia } = require("../services/mediaProcessingService");
const { redisClient } = require("../config/redis");
const { visiblePostsFilter } = require("../utils/postVisibility");
const { formatPost } = require("../utils/formatPost");
const { checkAndAwardBadges } = require("../services/badgeService");
const { emitPostDeleted } = require("../socket");

const inferType = (type, file) => {
    if (["image", "video"].includes(type)) {
        return type;
    }

    const mime = file?.mimetype || "";
    return mime.startsWith("video/") ? "video" : "image";
};

const markReadyInline = async (post) => {
    try {
        const result = await processMedia(post.type, post.publicId);
        await Post.findByIdAndUpdate(post._id, {
            mediaUrl: result.optimizedUrl,
            mediaUrls: [result.optimizedUrl],
            thumbnailUrl: result.thumbnailUrl || "",
            status: "ready"
        });
    } catch (inlineError) {
        console.error("Inline media processing failed:", inlineError);
        await Post.findByIdAndUpdate(post._id, { status: "ready" });
    }
};

const createPost = async (req, res) => {
    try {
        const {
            caption = "",
            type: rawType,
            technologyTags = ""
        } = req.body;

        const files = req.files || [];
        if (!files.length) {
            return res.status(400).json({
                message: "Media file is required"
            });
        }

        const hasVideo = files.some((file) => file.mimetype.startsWith("video/"));
        if (files.length > 1 && hasVideo) {
            return res.status(400).json({ message: "Videos must be uploaded individually" });
        }

        const type = inferType(rawType, files[0]);
        const mediaUrls = files.map((file) => file.path);
        const publicIds = files.map((file) => file.filename);

        const parsedTechnologyTags = technologyTags
            ? String(technologyTags)
                .split(",")
                .map((tag) => tag.trim().toLowerCase())
                .filter(Boolean)
            : [];

        const hashtags = caption
            .match(/#[a-zA-Z0-9_]+/g)
            ?.map((tag) => tag.substring(1).toLowerCase()) || [];

        const validation = validateContent({
            caption,
            hashtags,
            technologyTags: parsedTechnologyTags
        });

        const post = await Post.create({
            author: req.userId,
            type,
            mediaUrl: mediaUrls[0],
            mediaUrls,
            publicId: publicIds[0],
            publicIds,
            thumbnailUrl: type === "video"
                ? files[0].path.replace("/upload/", "/upload/so_0/")
                : "",
            caption,
            hashtags,
            technologyTags: parsedTechnologyTags,
            status: "processing"
        });

        if (type === "video") {
            await mediaQueue.add("process-media", {
                postId: post._id.toString(),
                type,
                publicId: publicIds[0]
            }).catch(async (error) => {
                console.error("mediaQueue.add failed:", error);
                await markReadyInline(post);
            });
        } else {
            await Post.findByIdAndUpdate(post._id, { status: "ready" });
        }

        await User.findByIdAndUpdate(req.userId, { $inc: { "stats.postsCount": 1 } });

        // Check and award badges
        await checkAndAwardBadges(req.userId);

        const populatedPost = await Post.findById(post._id)
            .populate("author", "name username profilePicture bio");

        res.status(201).json({
            message: "Post created successfully",
            post: formatPost(populatedPost, req.userId),
            contentValidation: {
                score: validation.score,
                decision: validation.decision
            }
        });
    } catch (error) {
        console.error("Create post error:", error);

        res.status(500).json({
            message: "Failed to create post"
        });
    }
};

const getPost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate("author", "name username profilePicture bio");

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        res.status(200).json({
            post: formatPost(post, req.userId)
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to get post"
        });
    }
};

const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find(visiblePostsFilter(req.userId))
            .populate("author", "name username profilePicture bio")
            .sort({ createdAt: -1 })
            .limit(50);

        try {
            if (redisClient.isOpen) {
                await redisClient.setEx(
                    "feed:all-posts",
                    60,
                    JSON.stringify(posts.map((post) => post._id))
                );
            }
        } catch (cacheError) {
            console.warn("All-posts cache skipped:", cacheError.message);
        }

        res.status(200).json({
            posts: posts.map((post) => formatPost(post, req.userId))
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to get posts"
        });
    }
};

const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        if (post.author.toString() !== req.userId) {
            return res.status(403).json({
                message: "You can only delete your own posts"
            });
        }

        const publicIds = post.publicIds?.length ? post.publicIds : [post.publicId];
        await Promise.all(publicIds.map((publicId) => cloudinary.uploader.destroy(publicId, {
            resource_type: post.type === "video" ? "video" : "image"
        })));

        await Post.findByIdAndDelete(post._id);

        await User.findByIdAndUpdate(req.userId, {
            $inc: { "stats.postsCount": -1 }
        });

        res.status(200).json({
            message: "Post deleted successfully"
        });
    } catch (error) {
        console.error("Delete post error:", error);

        res.status(500).json({
            message: "Failed to delete post"
        });
    }
};

const toggleLike = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        const userId = req.userId;
        const alreadyLiked = post.likes.some((id) => id.toString() === userId);

        if (alreadyLiked) {
            post.likes = post.likes.filter((id) => id.toString() !== userId);
        } else {
            post.likes.push(userId);
        }

        post.likesCount = post.likes.length;
        await post.save();

        await WatchHistory.findOneAndUpdate(
            { user: userId, post: post._id },
            { liked: !alreadyLiked }
        );

        await updateInterestScores(userId, req.params.id, {
            completionRate: 1,
            watchCount: 1,
            liked: !alreadyLiked,
            saved: false,
            shared: false
        });

        res.status(200).json({
            liked: !alreadyLiked,
            likedByMe: !alreadyLiked,
            likesCount: post.likesCount
        });
    } catch (error) {
        console.error("Like error:", error);

        res.status(500).json({
            message: "Failed to like post"
        });
    }
};

const trackView = async (req, res) => {
    try {
        const post = await Post.findOneAndUpdate(
            { _id: req.params.id, status: { $in: ["ready", "published"] }, viewers: { $ne: req.userId } },
            { $addToSet: { viewers: req.userId }, $inc: { viewsCount: 1 } },
            { new: true }
        );

        if (post) {
            return res.status(200).json({ viewsCount: post.viewsCount });
        }

        const existingPost = await Post.findById(req.params.id).select("_id status viewsCount");
        if (!existingPost) return res.status(404).json({ message: "Post not found" });
        res.status(200).json({ viewsCount: existingPost.viewsCount });
    } catch (error) {
        console.error("Track view error:", error);
        res.status(500).json({ message: "Failed to track view" });
    }
};

const reportPost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).select("author status viewers reporters viewsCount");
        if (!post) return res.status(404).json({ message: "Post not found" });
        if (post.author.toString() === req.userId) {
            return res.status(400).json({ message: "You cannot report your own post" });
        }
        const viewers = post.viewers || [];
        const reporters = post.reporters || [];
        if (reporters.some((id) => id.toString() === req.userId)) {
            return res.status(200).json({
                reported: true,
                removed: post.status === "removed",
                viewsCount: viewers.length,
                reportCount: reporters.length
            });
        }

        const updatedPost = await Post.findOneAndUpdate(
            {
                _id: req.params.id,
                status: { $in: ["ready", "published"] },
                reporters: { $ne: req.userId }
            },
            {
                $addToSet: {
                    viewers: req.userId,
                    reporters: req.userId
                }
            },
            { new: true }
        ).select("author type publicId publicIds viewers reporters viewsCount");

        if (!updatedPost) {
            const currentPost = await Post.findById(req.params.id).select("status viewers reporters viewsCount");
            if (!currentPost) return res.status(404).json({ message: "Post not found" });
            return res.status(200).json({
                reported: true,
                removed: currentPost.status === "removed",
                viewsCount: currentPost.viewers?.length || currentPost.viewsCount || 0,
                reportCount: currentPost.reporters?.length || 0
            });
        }

        const reportCount = updatedPost.reporters.length;
        const viewCount = updatedPost.viewers.length;
        const shouldRemove = viewCount > 0 && reportCount / viewCount > 0.8;

        if (!shouldRemove) {
            await Post.updateOne(
                { _id: updatedPost._id },
                { $set: { viewsCount: viewCount } }
            );
            return res.status(200).json({
                reported: true,
                removed: false,
                viewsCount: viewCount,
                reportCount
            });
        }

        const warningMessage = "Your post was marked as inappropriate by the community and has been automatically removed.";
        const publicIds = updatedPost.publicIds?.length ? updatedPost.publicIds : [updatedPost.publicId];
        const deletedPost = await Post.findOneAndDelete({ _id: updatedPost._id });
        if (!deletedPost) {
            return res.status(200).json({
                reported: true,
                removed: true,
                viewsCount: viewCount,
                reportCount,
                message: warningMessage
            });
        }

        emitPostDeleted(deletedPost._id);

        await User.findByIdAndUpdate(updatedPost.author, {
            $push: { moderationWarnings: { post: updatedPost._id, message: "Your post was marked as inappropriate by the community and has been automatically removed." } },
            $set: { hasUnseenReportWarning: true },
            $inc: { "stats.postsCount": -1 }
        });

        await Promise.all(publicIds.map((publicId) => cloudinary.uploader.destroy(publicId, {
            resource_type: updatedPost.type === "video" ? "video" : "image"
        })));

        res.status(200).json({
            reported: true,
            removed: true,
            viewsCount: viewCount,
            reportCount,
            message: warningMessage
        });
    } catch (error) {
        console.error("Report post error:", error);
        res.status(500).json({ message: "Failed to report post" });
    }
};

module.exports = {
    createPost,
    getPost,
    getAllPosts,
    deletePost,
    toggleLike,
    trackView,
    reportPost
};
