const User = require("../models/User");
const Post = require("../models/Post");

const search = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length < 2) {
            return res.status(400).json({
                message: "Search query must be at least 2 characters"
            });
        }

        const query = q.trim().toLowerCase();
        const regex = new RegExp(query, "i");

        // Search users
        const users = await User.find({
            $or: [
                { username: regex },
                { name: regex }
            ]
        })
            .select("username name profilePicture bio stats")
            .limit(10);

        // Search posts by caption and technology tags
        const posts = await Post.find({
            $or: [
                { caption: regex },
                { technologyTags: regex },
                { hashtags: regex }
            ],
            status: { $in: ["ready", "published"] }
        })
            .populate("author", "username name profilePicture")
            .sort({ createdAt: -1 })
            .limit(20);

        // Search for unique technology tags
        const allPosts = await Post.find({
            $or: [
                { technologyTags: regex }
            ],
            status: { $in: ["ready", "published"] }
        }).select("technologyTags");

        const uniqueTags = new Set();
        allPosts.forEach(post => {
            post.technologyTags?.forEach(tag => {
                if (tag.toLowerCase().includes(query)) {
                    uniqueTags.add(tag);
                }
            });
        });

        const technologyTags = Array.from(uniqueTags).slice(0, 10);

        res.status(200).json({
            users: users.map(user => ({
                _id: user._id,
                username: user.username,
                name: user.name,
                profilePicture: user.profilePicture,
                bio: user.bio,
                followersCount: user.stats?.followersCount || 0
            })),
            posts: posts.map(post => ({
                _id: post._id,
                caption: post.caption,
                technologyTags: post.technologyTags,
                type: post.type,
                mediaUrl: post.mediaUrl,
                thumbnailUrl: post.thumbnailUrl,
                likesCount: post.likesCount,
                commentsCount: post.commentsCount,
                author: post.author
            })),
            technologyTags
        });
    } catch (error) {
        console.error("Search error:", error);
        res.status(500).json({
            message: "Search failed"
        });
    }
};

module.exports = { search };