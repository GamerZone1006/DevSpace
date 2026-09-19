const WatchHistory = require("../models/WatchHistory");
const SavedPost = require("../models/SavedPost");
const User = require("../models/User");

const getDashboard = async (req, res) => {
    try {
        const userId = req.userId;

        const user = await User.findById(userId).select(
            "name username interests interestScores stats"
        );

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const watchHistory = await WatchHistory.find({
            user: userId
        }).populate(
            "post",
            "technologyTags type caption"
        );

        const savedCount = await SavedPost.countDocuments({
            user: userId
        });

        // Total learning/watch time
        const totalWatchTime = watchHistory.reduce(
            (total, item) => total + (item.watchDuration || 0),
            0
        );

        // Number of unique reels/posts watched
        const reelsWatched = watchHistory.length;

        // Average completion rate
        const averageCompletionRate =
            watchHistory.length > 0
                ? watchHistory.reduce(
                    (total, item) =>
                        total + item.completionRate,
                    0
                ) / watchHistory.length
                : 0;

        // Count topics explored
        const topicFrequency = {};

        watchHistory.forEach((item) => {
            if (!item.post) return;

            const tags = item.post.technologyTags || [];

            tags.forEach((tag) => {
                const normalizedTag = tag.toLowerCase();

                topicFrequency[normalizedTag] =
                    (topicFrequency[normalizedTag] || 0) + 1;
            });
        });

        const topicsExplored = Object.entries(topicFrequency)
            .sort((a, b) => b[1] - a[1])
            .map(([topic, count]) => ({
                topic,
                count
            }));

        const scoredInterests = Array.from(
            user.interestScores?.entries() || []
        )
            .sort((a, b) => b[1] - a[1])
            .map(([topic, score]) => ({
                topic: String(topic),
                score: Number(score.toFixed(3))
            }));

        const registeredStacks = (user.interests || []).map((topic) =>
            typeof topic === "string"
                ? { topic, score: 0 }
                : {
                    topic: topic?.topic || topic?.name || "",
                    score: Number(topic?.score || 0)
                }
        );

        const interestMap = new Map();
        [...registeredStacks, ...scoredInterests].forEach((item) => {
            if (!item.topic) return;
            interestMap.set(item.topic, item);
        });

        const interests = Array.from(interestMap.values());

        res.status(200).json({
            dashboard: {
                learningTimeSeconds: totalWatchTime,
                learningTimeMinutes: Number(
                    (totalWatchTime / 60).toFixed(2)
                ),

                reelsWatched,

                savedPosts: savedCount,

                averageCompletionRate: Number(
                    averageCompletionRate.toFixed(3)
                ),

                topicsExplored,

                interests,

                stats: user.stats
            }
        });

    } catch (error) {
        console.error("Dashboard error:", error);

        res.status(500).json({
            message: "Failed to load dashboard"
        });
    }
};

module.exports = {
    getDashboard
};