const mongoose = require("mongoose");
const Message = require("../models/Message");
const User = require("../models/User");
const Post = require("../models/Post");
const { emitToUser } = require("../socket");

const getFollowing = async (req, res) => {
    try {
        const user = await User.findById(req.userId)
            .select("following")
            .populate("following", "name username profilePicture");

        if (!user) return res.status(404).json({ message: "User not found" });

        res.json({ users: user.following });
    } catch (error) {
        console.error("Following users error:", error);
        res.status(500).json({ message: "Failed to load following users" });
    }
};

const getShareUsers = async (req, res) => {
    try {
        const users = await User.find({ _id: { $ne: req.userId } })
            .select("name username profilePicture")
            .sort({ updatedAt: -1 })
            .limit(40);

        res.json({ users });
    } catch (error) {
        console.error("Share users error:", error);
        res.status(500).json({ message: "Failed to load share users" });
    }
};

const getConversation = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user id" });
        }

        const messages = await Message.find({
            $or: [
                { sender: req.userId, recipient: userId },
                { sender: userId, recipient: req.userId }
            ]
        })
            .sort({ createdAt: 1 })
            .populate("sender", "name username profilePicture");

        await Message.updateMany(
            { sender: userId, recipient: req.userId, status: { $ne: "read" } },
            { $set: { status: "read" } }
        );

        res.json({ messages });
    } catch (error) {
        console.error("Conversation error:", error);
        res.status(500).json({ message: "Failed to load conversation" });
    }
};

const sharePostToUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { postId } = req.body;
        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({ message: "Invalid user or post id" });
        }

        const [recipient, post] = await Promise.all([
            User.findById(userId).select("_id"),
            Post.findById(postId).populate("author", "name username profilePicture")
        ]);
        if (!recipient || !post) return res.status(404).json({ message: "User or post not found" });

        const sharedPost = {
            postId: post._id.toString(),
            type: post.type,
            mediaUrl: post.mediaUrl,
            thumbnailUrl: post.thumbnailUrl || "",
            mediaUrls: post.mediaUrls || [],
            caption: post.caption || "",
            author: {
                name: post.author?.name || "",
                username: post.author?.username || "",
                profilePicture: post.author?.profilePicture || ""
            }
        };
        const message = await Message.create({
            sender: req.userId,
            recipient: userId,
            text: "Shared a post",
            sharedPost
        });
        const populatedMessage = await message.populate("sender", "name username profilePicture");
        const payload = populatedMessage.toObject();

        emitToUser(userId, "message:new", payload);
        emitToUser(req.userId, "message:new", payload);
        res.status(201).json({ message: payload });
    } catch (error) {
        console.error("Share post message error:", error);
        res.status(500).json({ message: "Failed to share post" });
    }
};

module.exports = { getFollowing, getShareUsers, getConversation, sharePostToUser };