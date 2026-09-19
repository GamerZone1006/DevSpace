const Post = require("../models/Post");
const WatchHistory = require("../models/WatchHistory");
const {
    updateInterestScores
} = require("../services/interestLearningService");

const trackWatch = async (req, res) => {
    try {
        const { postId } = req.params;
        const { watchDuration, videoDuration } = req.body;

        if (
            typeof watchDuration !== "number" ||
            typeof videoDuration !== "number" ||
            videoDuration <= 0 ||
            watchDuration < 0
        ) {
            return res.status(400).json({
                message: "Invalid watch data"
            });
        }

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        const completionRate = Math.min(
            watchDuration / videoDuration,
            1
        );

        let history = await WatchHistory.findOne({
            user: req.userId,
            post: postId
        });

        if (history) {
            history.watchDuration = watchDuration;
            history.videoDuration = videoDuration;
            history.completionRate = completionRate;
            history.watchCount += 1;
            history.lastWatchedAt = new Date();

            await history.save();
        } else {
            history = await WatchHistory.create({
                user: req.userId,
                post: postId,
                watchDuration,
                videoDuration,
                completionRate
            });

            // Count unique viewers only once
            post.viewsCount += 1;
            await post.save();
        }

        // Learn user's interests from this watch
        await updateInterestScores(
            req.userId,
            postId,
            {
                completionRate,
                watchCount: history.watchCount,
                liked: history.liked,
                saved: history.saved,
                shared: history.shared
            }
        );

        res.status(200).json({
            message: "Watch tracked",
            completionRate,
            watchCount: history.watchCount
        });

    } catch (error) {
        console.error("Track watch error:", error);

        res.status(500).json({
            message: "Failed to track watch"
        });
    }
};

module.exports = {
    trackWatch
};