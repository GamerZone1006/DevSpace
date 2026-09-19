const mongoose = require("mongoose");
const Message = require("../models/Message");
const User = require("../models/User");

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

module.exports = { getFollowing, getConversation };