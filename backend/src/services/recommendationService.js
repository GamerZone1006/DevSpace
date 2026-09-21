const Post = require("../models/Post");
const User = require("../models/User");
const WatchHistory = require("../models/WatchHistory");
const { visiblePostsFilter } = require("../utils/postVisibility");

const normalize = (value, min, max) => {
    if (max === min) return 0;
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
};

const toTagSet = (values = []) =>
    new Set(
        values
            .map((value) => String(value).trim().toLowerCase())
            .filter(Boolean)
    );

/*
 * Registered tech stacks are a ranking boost only.
 * Matching posts float higher; unmatched posts still appear.
 */
const calculateTechStackPreference = (post, user) => {
    const stacks = toTagSet([
        ...(user.interests || []),
        ...(user.skills || [])
    ]);

    if (!stacks.size) {
        return 0;
    }

    const tags = (post.technologyTags || []).map((tag) => tag.toLowerCase());
    if (!tags.length) {
        return 0;
    }

    const matches = tags.filter((tag) => stacks.has(tag)).length;
    if (matches === 0) {
        return 0;
    }

    return Math.min(matches / Math.max(tags.length, 1), 1);
};

const calculateInterestMatch = (post, user) => {
    if (!post.technologyTags?.length) {
        return 0;
    }

    let totalScore = 0;

    post.technologyTags.forEach((tag) => {
        const score = user.interestScores?.get(tag);
        if (score !== undefined) {
            totalScore += score;
        }
    });

    return Math.min(totalScore / post.technologyTags.length, 1);
};

const calculateWatchBehavior = (history) => {
    if (!history) {
        return 0;
    }

    let score = 0;
    score += history.completionRate * 0.5;

    if (history.watchCount > 1) {
        score += 0.3;
    }

    if (history.saved) {
        score += 0.2;
    }

    return Math.min(score, 1);
};

const calculateEngagement = (post) => {
    const likes = post.likesCount ?? post.likes?.length ?? 0;
    const comments = post.commentsCount || 0;
    const shares = post.sharesCount || 0;
    const saves = post.savesCount || 0;

    const engagementScore =
        likes * 1 + comments * 2 + shares * 3 + saves * 3;

    return Math.min(Math.log10(engagementScore + 1) / 3, 1);
};

const calculateCreatorAffinity = (post, user) => {
    const creatorId = post.author._id.toString();
    const followsCreator = user.following.some(
        (id) => id.toString() === creatorId
    );

    return followsCreator ? 1 : 0.2;
};

const calculateFreshness = (createdAt) => {
    const ageInHours =
        (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);

    return Math.exp(-ageInHours / 72);
};

const calculateExploration = (post, user) => {
    const tags = post.technologyTags || [];

    if (!tags.length) {
        return 0.4;
    }

    const unknownTags = tags.filter((tag) => !user.interestScores?.has(tag));
    return unknownTags.length > 0 ? 0.8 : 0.25;
};

const generateRecommendations = async (userId, limit = 50, options = {}) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new Error("User not found");
    }

    const watchHistory = await WatchHistory.find({ user: userId });
    const historyMap = new Map();

    watchHistory.forEach((history) => {
        historyMap.set(history.post.toString(), history);
    });

    const posts = await Post.find(visiblePostsFilter(userId))
        .populate("author", "name username profilePicture bio")
        .sort({ createdAt: -1 })
        .limit(200);

    const scoredPosts = posts.map((post) => {
        const history = historyMap.get(post._id.toString());
        const techStackPreference = calculateTechStackPreference(post, user);
        const interestMatch = calculateInterestMatch(post, user);
        const watchBehavior = calculateWatchBehavior(history);
        const engagement = calculateEngagement(post);
        const creatorAffinity = calculateCreatorAffinity(post, user);
        const freshness = calculateFreshness(post.createdAt);
        const exploration = calculateExploration(post, user);

        const finalScore =
            techStackPreference * 0.40 +
            interestMatch * 0.15 +
            watchBehavior * 0.10 +
            engagement * 0.12 +
            creatorAffinity * 0.08 +
            freshness * 0.10 +
            exploration * 0.05;

        return {
            post,
            recommendationScore: Number(finalScore.toFixed(4)),
            scoreBreakdown: {
                techStackPreference: Number(techStackPreference.toFixed(3)),
                interestMatch: Number(interestMatch.toFixed(3)),
                watchBehavior: Number(watchBehavior.toFixed(3)),
                engagement: Number(engagement.toFixed(3)),
                creatorAffinity: Number(creatorAffinity.toFixed(3)),
                freshness: Number(freshness.toFixed(3)),
                exploration: Number(exploration.toFixed(3))
            }
        };
    });

    scoredPosts.sort(
        (a, b) => b.recommendationScore - a.recommendationScore
    );

    if (options.prioritizeNewest && scoredPosts.length > 1) {
        const newestPost = scoredPosts.reduce((newest, current) =>
            new Date(current.post.createdAt) > new Date(newest.post.createdAt)
                ? current
                : newest
        );

        return [
            newestPost,
            ...scoredPosts.filter((item) => item.post._id.toString() !== newestPost.post._id.toString())
        ].slice(0, limit);
    }

    return scoredPosts.slice(0, limit);
};

module.exports = {
    generateRecommendations,
    calculateTechStackPreference,
    normalize
};
