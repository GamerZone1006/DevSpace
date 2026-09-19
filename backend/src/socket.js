const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Message = require("./models/Message");
const User = require("./models/User");

const configureSocket = (io) => {
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.userId;
            next();
        } catch (error) {
            next(new Error("Unauthorized socket connection"));
        }
    });

    io.on("connection", (socket) => {
        socket.join(`user:${socket.userId}`);
        socket.emit("connection:ready", { userId: socket.userId });

        socket.on("message:send", async ({ recipientId, text }, acknowledge) => {
            try {
                if (!mongoose.Types.ObjectId.isValid(recipientId) || !text?.trim()) {
                    return acknowledge?.({ ok: false, message: "Recipient and message are required" });
                }

                const recipient = await User.findById(recipientId).select("_id");
                if (!recipient) return acknowledge?.({ ok: false, message: "User not found" });

                const message = await Message.create({
                    sender: socket.userId,
                    recipient: recipientId,
                    text: text.trim()
                });

                const populatedMessage = await message.populate("sender", "name username profilePicture");
                const payload = populatedMessage.toObject();

                io.to(`user:${recipientId}`).emit("message:new", payload);
                socket.emit("message:new", payload);
                io.to(`user:${recipientId}`).emit("message:delivered", { messageId: message._id });
                socket.emit("message:delivered", { messageId: message._id });
                acknowledge?.({ ok: true, message: payload });
            } catch (error) {
                console.error("Socket message error:", error);
                acknowledge?.({ ok: false, message: "Unable to send message" });
            }
        });

        socket.on("message:read", async ({ messageId }) => {
            if (!mongoose.Types.ObjectId.isValid(messageId)) return;
            const message = await Message.findOneAndUpdate(
                { _id: messageId, recipient: socket.userId },
                { $set: { status: "read" } },
                { new: true }
            );
            if (message) io.to(`user:${message.sender}`).emit("message:read", { messageId });
        });
    });
};

module.exports = configureSocket;