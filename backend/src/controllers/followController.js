const User = require("../models/User");
const FollowNotification = require("../models/FollowNotification");
const { emitToUser } = require("../socket");


// FOLLOW / UNFOLLOW
const toggleFollow = async (req, res) => {
    try {
        const targetUserId = req.params.userId;
        const currentUserId = req.userId;

        if (targetUserId === currentUserId) {
            return res.status(400).json({
                message: "You cannot follow yourself"
            });
        }

        const targetUser = await User.findById(
            targetUserId
        );

        const currentUser = await User.findById(
            currentUserId
        );

        if (!targetUser || !currentUser) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const alreadyFollowing =
            currentUser.following.some(
                (id) => id.toString() === targetUserId
            );

        if (alreadyFollowing) {

            currentUser.following =
                currentUser.following.filter(
                    (id) => id.toString() !== targetUserId
                );

            targetUser.followers =
                targetUser.followers.filter(
                    (id) => id.toString() !== currentUserId
                );

            currentUser.stats.followingCount =
                Math.max(
                    0,
                    currentUser.stats.followingCount - 1
                );

            targetUser.stats.followersCount =
                Math.max(
                    0,
                    targetUser.stats.followersCount - 1
                );

        } else {

            currentUser.following.push(targetUserId);
            targetUser.followers.push(currentUserId);

            currentUser.stats.followingCount += 1;
            targetUser.stats.followersCount += 1;
        }

        await currentUser.save();
        await targetUser.save();

        if (alreadyFollowing) {
            await FollowNotification.findOneAndDelete({
                recipient: targetUserId,
                follower: currentUserId
            });
            emitToUser(targetUserId, "notification:follower", {
                type: "follower",
                action: "removed",
                followerId: currentUserId
            });
        } else {
            const notification = await FollowNotification.findOneAndUpdate(
                { recipient: targetUserId, follower: currentUserId },
                { $set: { seenAt: null } },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            ).populate("follower", "name username profilePicture");

            emitToUser(targetUserId, "notification:follower", {
                type: "follower",
                action: "created",
                notification: notification.toObject()
            });
        }

        res.status(200).json({
            following: !alreadyFollowing,
            followersCount: targetUser.stats.followersCount,
            followingCount: currentUser.stats.followingCount
        });

    } catch (error) {
        console.error("Follow error:", error);

        res.status(500).json({
            message: "Failed to follow user"
        });
    }
};

const getFollowerNotifications = async (req, res) => {
    try {
        const notifications = await FollowNotification.find({ recipient: req.userId })
            .populate("follower", "name username profilePicture")
            .sort({ createdAt: -1 })
            .limit(100);
        const unseenCount = notifications.filter((notification) => !notification.seenAt).length;

        res.status(200).json({
            unseenCount,
            notifications: notifications.map((notification) => ({
                ...notification.toObject(),
                isUnseen: !notification.seenAt
            }))
        });
    } catch (error) {
        console.error("Follower notifications error:", error);
        res.status(500).json({ message: "Failed to load follower notifications" });
    }
};

const markFollowerNotificationsSeen = async (req, res) => {
    try {
        await FollowNotification.updateMany(
            { recipient: req.userId, seenAt: null },
            { $set: { seenAt: new Date() } }
        );

        emitToUser(req.userId, "notification:followers-seen", { unseenCount: 0 });
        res.status(200).json({ unseenCount: 0 });
    } catch (error) {
        console.error("Mark follower notifications seen error:", error);
        res.status(500).json({ message: "Failed to mark follower notifications seen" });
    }
};

module.exports = {
    toggleFollow,
    getFollowerNotifications,
    markFollowerNotificationsSeen
};