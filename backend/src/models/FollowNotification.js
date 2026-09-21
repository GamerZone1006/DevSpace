const mongoose = require("mongoose");

const followNotificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        follower: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        seenAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

followNotificationSchema.index({ recipient: 1, seenAt: 1, createdAt: -1 });
followNotificationSchema.index({ recipient: 1, follower: 1 }, { unique: true });

module.exports = mongoose.model("FollowNotification", followNotificationSchema);
