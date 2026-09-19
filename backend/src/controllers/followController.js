const User = require("../models/User");


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


module.exports = {
    toggleFollow
};