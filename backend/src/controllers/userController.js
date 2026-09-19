const mongoose = require("mongoose");
const User = require("../models/User");
const Post = require("../models/Post");
const SavedPost = require("../models/SavedPost");
const { visiblePostsFilter } = require("../utils/postVisibility");
const { formatPost } = require("../utils/formatPost");

const findUser = async (identifier, currentUserId) => {
    if (!identifier || identifier === "me") {
        return User.findById(currentUserId);
    }

    if (mongoose.Types.ObjectId.isValid(identifier)) {
        const byId = await User.findById(identifier);
        if (byId) return byId;
    }

    return User.findOne({ username: identifier.toLowerCase() });
};

const buildProfilePayload = async (user, currentUserId) => {
    const posts = await Post.find({
        author: user._id,
        ...visiblePostsFilter(currentUserId)
    })
        .populate("author", "name username profilePicture bio")
        .sort({ createdAt: -1 });

    const isFollowing = user.followers.some(
        (id) => id.toString() === currentUserId.toString()
    );

    const savedPosts = await SavedPost.find({
        user: currentUserId,
        post: { $in: posts.map((p) => p._id) }
    });
    const savedSet = new Set(savedPosts.map((sp) => sp.post.toString()));

    const skills = user.skills?.length ? user.skills : user.interests || [];

    const profile = {
        _id: user._id,
        name: user.name,
        username: user.username,
        profilePicture: user.profilePicture,
        bio: user.bio,
        linkedinUrl: user.linkedinUrl,
        githubUrl: user.githubUrl,
        skills,
        interests: user.interests,
        badges: user.badges || [],
        stats: {
            postsCount: user.stats?.postsCount ?? posts.length,
            followersCount: user.stats?.followersCount ?? user.followers.length,
            followingCount: user.stats?.followingCount ?? user.following.length
        },
        followingByMe: isFollowing,
        isOwnProfile: user._id.toString() === currentUserId.toString()
    };

    return {
        user: profile,
        posts: posts.map((post) => formatPost(post, currentUserId, savedSet))
    };
};

const getOwnProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select(
            "name username profilePicture bio linkedinUrl githubUrl skills interests stats followers following badges"
        );

        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json(await buildProfilePayload(user, req.userId));
    } catch (error) {
        console.error("Get own profile error:", error);
        res.status(500).json({ message: "Failed to load profile" });
    }
};

const getProfile = async (req, res) => {
    try {
        const identifier = req.params.userId || req.params.username;
        const user = await findUser(identifier, req.userId);

        if (!user) return res.status(404).json({ message: "User not found" });

        const selected = await User.findById(user._id).select(
            "name username profilePicture bio linkedinUrl githubUrl skills interests stats followers following badges"
        );

        res.status(200).json(await buildProfilePayload(selected, req.userId));
    } catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({ message: "Failed to load profile" });
    }
};

const getConnections = async (req, res) => {
    try {
        const user = await findUser(req.params.userId, req.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const connectionType = req.query.type === "following" ? "following" : "followers";
        const users = await User.find({ _id: { $in: user[connectionType] || [] } })
            .select("name username profilePicture followers")
            .sort({ username: 1 });

        res.status(200).json({
            users: users.map((connection) => ({
                _id: connection._id,
                name: connection.name,
                username: connection.username,
                profilePicture: connection.profilePicture,
                followingByMe: connection.followers.some(
                    (id) => id.toString() === req.userId.toString()
                )
            }))
        });
    } catch (error) {
        console.error("Get connections error:", error);
        res.status(500).json({ message: "Failed to load connections" });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { bio, linkedinUrl, githubUrl, interests } = req.body;

        const updateData = {};
        if (bio !== undefined) updateData.bio = bio;
        if (linkedinUrl !== undefined) updateData.linkedinUrl = linkedinUrl;
        if (githubUrl !== undefined) updateData.githubUrl = githubUrl;
        if (interests !== undefined) updateData.interests = interests;
        if (req.file?.path) updateData.profilePicture = req.file.path;

        const user = await User.findByIdAndUpdate(
            req.userId,
            { $set: updateData },
            { new: true }
        ).select("name username profilePicture bio linkedinUrl githubUrl skills interests stats followers following");

        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json(await buildProfilePayload(user, req.userId));
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ message: "Failed to update profile" });
    }
};

module.exports = { getProfile, getOwnProfile, updateProfile, getConnections };
