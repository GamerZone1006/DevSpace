const Post = require("../models/Post");
const User = require("../models/User");
const { redisClient } = require("../config/redis");
const { visiblePostsFilter } = require("../utils/postVisibility");

const CACHE_TTL_SECONDS = 30;
const VIEW_TTL_SECONDS = 60 * 60 * 6;
const AFFINITY_TTL_SECONDS = 60 * 60 * 24 * 30;
const DEFAULT_CANDIDATE_LIMIT = 250;
const FRESH_POST_WINDOW_MS = 5 * 60 * 1000;
const FRESHNESS_LAMBDA = 1 / 72;

const ACTION_WEIGHTS = {
    view: 1,
    dwell: 0.05,
    like: 4,
    save: 6,
    comment: 8,
    share: 7
};

const redisReady = () => Boolean(redisClient?.isReady);
const userKey = (userId) => String(userId);
const affinityKey = (userId) => `enhanced:affinity:${userKey(userId)}`;
const viewedKey = (userId) => `enhanced:viewed:${userKey(userId)}`;
const cacheKey = (userId, pageSize) =>
    `enhanced:recommendations:${userKey(userId)}:${pageSize}`;

const safeRedis = async (operation, fallback = null) => {
    if (!redisReady()) return fallback;

    try {
        return await operation();
    } catch (error) {
        console.error("Enhanced recommendation Redis error:", error.message);
        return fallback;
    }
};

const normalizeTag = (tag) => String(tag || "").trim().toLowerCase();

const getPostId = (post) => String(post?._id || post?.id || "");

const getAuthorId = (post) =>
    String(post?.author?._id || post?.author?.id || post?.author || "");

const getFollowingIds = (user) =>
    new Set((user?.following || []).map((id) => String(id?._id || id)));

const getTags = (post) =>
    [...new Set((post?.technologyTags || []).map(normalizeTag).filter(Boolean))];

const getAffinityFromUser = (user, tag) => {
    const interestScores = user?.interestScores;
    if (!interestScores) return 0;

    if (typeof interestScores.get === "function") {
        return Number(interestScores.get(tag) || 0);
    }

    return Number(interestScores[tag] || 0);
};

const calculateTechStackPreference = (post, user, topicScores = {}) => {
    const tags = getTags(post);
    if (!tags.length) return 0;

    const preferredTags = new Set([
        ...(user?.interests || []).map(normalizeTag),
        ...(user?.skills || []).map(normalizeTag)
    ]);

    const total = tags.reduce((sum, tag) => {
        const redisScore = Number(topicScores[tag] || 0);
        const storedScore = getAffinityFromUser(user, tag);
        const explicitPreference = preferredTags.has(tag) ? 1 : 0;
        return sum + Math.min(1, explicitPreference + Math.log1p(redisScore) / 10 + storedScore / 10);
    }, 0);

    return Math.min(1, total / tags.length);
};

const calculateEngagement = (post) => {
    const likes = Number(post?.likesCount ?? post?.likes?.length ?? 0);
    const comments = Number(post?.commentsCount || 0);
    const shares = Number(post?.sharesCount || 0);
    const saves = Number(post?.savesCount || 0);
    const views = Number(post?.viewsCount || 0);
    const weightedActions = likes + comments * 2 + shares * 3 + saves * 3;
    const normalized = Math.log1p(weightedActions) / Math.log1p(Math.max(20, views + 20));

    return Math.max(0, Math.min(1, normalized));
};

const calculateFreshnessDecay = (createdAt, lambda = FRESHNESS_LAMBDA) => {
    const ageInHours = Math.max(
        0,
        (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60)
    );

    return Math.exp(-lambda * ageInHours);
};

const applyRecencyBoost = (score, createdAt, multiplier = 2.5) => {
    const ageMs = Date.now() - new Date(createdAt).getTime();
    return ageMs >= 0 && ageMs < FRESH_POST_WINDOW_MS
        ? score * multiplier
        : score;
};

const getTopicScores = async (userId, tags) => {
    if (!tags.length || !redisReady()) return {};

    const values = await safeRedis(
        () => redisClient.zMScore(affinityKey(userId), tags),
        tags.map(() => null)
    );

    return tags.reduce((scores, tag, index) => {
        scores[tag] = Number(values?.[index] || 0);
        return scores;
    }, {});
};

const isViewed = async (userId, postId) =>
    Boolean(await safeRedis(() => redisClient.sIsMember(viewedKey(userId), postId), 0));

const updateTopicAffinity = async (userId, topic, action = "view", dwellSeconds = 0) => {
    const normalizedTopic = normalizeTag(topic);
    if (!userId || !normalizedTopic) return 0;

    const actionWeight = ACTION_WEIGHTS[action] || ACTION_WEIGHTS.view;
    const dwellWeight = Math.max(0, Math.min(Number(dwellSeconds) || 0, 300)) * ACTION_WEIGHTS.dwell;
    const increment = actionWeight + dwellWeight;

    return safeRedis(async () => {
        const key = affinityKey(userId);
        const result = await redisClient.zIncrBy(key, increment, normalizedTopic);
        await redisClient.expire(key, AFFINITY_TTL_SECONDS);
        return Number(result);
    }, 0);
};

const trackInteraction = async ({
    userId,
    postId,
    topics = [],
    action = "view",
    dwellSeconds = 0
} = {}) => {
    if (!userId || !postId) return false;

    await Promise.all(
        topics.map((topic) => updateTopicAffinity(userId, topic, action, dwellSeconds))
    );

    await safeRedis(async () => {
        const key = viewedKey(userId);
        await redisClient.sAdd(key, postId);
        await redisClient.expire(key, VIEW_TTL_SECONDS);
        await redisClient.del(cacheKey(userId, 50), cacheKey(userId, 20));
        return true;
    }, false);

    return true;
};

const calculateEnhancedScore = async (post, user, options = {}) => {
    const tags = getTags(post);
    const topicScores = options.topicScores || (await getTopicScores(user._id, tags));
    const techAffinity = calculateTechStackPreference(post, user, topicScores);
    const engagement = calculateEngagement(post);
    const freshness = calculateFreshnessDecay(post.createdAt, options.lambda || FRESHNESS_LAMBDA);
    const proximity = getFollowingIds(user).has(getAuthorId(post)) ? 1 : 0.35;
    const mediaCount = Math.max(1, post.mediaUrls?.length || 1);
    const carouselMultiplier = 1 + Math.min(mediaCount - 1, 4) * 0.05;
    const viewed = options.viewed ?? (await isViewed(user._id, getPostId(post)));

    let score =
        (techAffinity * 0.42 + engagement * 0.22 + freshness * 0.18 + proximity * 0.18) *
        carouselMultiplier;

    if (viewed) score *= 0.35;
    score = applyRecencyBoost(score, post.createdAt, options.recencyMultiplier || 2.5);

    return {
        post,
        recommendationScore: Number(score.toFixed(6)),
        scoreBreakdown: {
            techAffinity: Number(techAffinity.toFixed(4)),
            engagement: Number(engagement.toFixed(4)),
            freshness: Number(freshness.toFixed(4)),
            proximity: Number(proximity.toFixed(4)),
            carouselMultiplier: Number(carouselMultiplier.toFixed(4)),
            viewed,
            recencyBoosted: Date.now() - new Date(post.createdAt).getTime() < FRESH_POST_WINDOW_MS
        }
    };
};

const loadCandidates = async (userId, candidateLimit) => {
    const key = cacheKey(userId, candidateLimit);
    const cachedIds = await safeRedis(() => redisClient.get(key), null);

    if (cachedIds) {
        let ids;
        try {
            ids = JSON.parse(cachedIds);
        } catch {
            ids = [];
        }

        const posts = await Post.find({
            ...visiblePostsFilter(userId),
            _id: { $in: ids }
        }).populate("author", "name username profilePicture bio");
        const freshPosts = await Post.find({
            ...visiblePostsFilter(userId),
            createdAt: { $gte: new Date(Date.now() - FRESH_POST_WINDOW_MS) }
        })
            .populate("author", "name username profilePicture bio")
            .sort({ createdAt: -1 })
            .limit(50);
        const postsById = new Map([...posts, ...freshPosts].map((post) => [getPostId(post), post]));
        return [...postsById.values()].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }

    const posts = await Post.find(visiblePostsFilter(userId))
        .populate("author", "name username profilePicture bio")
        .sort({ createdAt: -1 })
        .limit(candidateLimit);

    await safeRedis(
        () => redisClient.set(key, JSON.stringify(posts.map(getPostId)), { EX: CACHE_TTL_SECONDS }),
        null
    );
    return posts;
};

const generateEnhancedRecommendations = async (userId, options = {}) => {
    const normalizedOptions = typeof options === "number" ? { limit: options } : options;
    const page = Math.max(1, Number(normalizedOptions.page) || 1);
    const limit = Math.max(1, Math.min(Number(normalizedOptions.limit) || 20, 100));
    const candidateLimit = Math.max(
        limit,
        Math.min(Number(normalizedOptions.candidateLimit) || DEFAULT_CANDIDATE_LIMIT, 500)
    );
    const user = await User.findById(userId);

    if (!user) throw new Error("User not found");

    const posts = await loadCandidates(userId, candidateLimit);
    const tags = [...new Set(posts.flatMap(getTags))];
    const topicScores = await getTopicScores(userId, tags);
    const viewedPosts = new Set(
        (await safeRedis(() => redisClient.sMembers(viewedKey(userId)), [])) || []
    );
    const scoredPosts = await Promise.all(
        posts.map((post) =>
            calculateEnhancedScore(post, user, {
                topicScores,
                viewed: viewedPosts.has(getPostId(post)),
                recencyMultiplier: normalizedOptions.recencyMultiplier
            })
        )
    );

    scoredPosts.sort((a, b) => b.recommendationScore - a.recommendationScore);
    const start = (page - 1) * limit;

    return {
        recommendations: scoredPosts.slice(start, start + limit),
        page,
        limit,
        total: scoredPosts.length,
        hasMore: start + limit < scoredPosts.length
    };
};

module.exports = {
    updateTopicAffinity,
    trackInteraction,
    applyRecencyBoost,
    calculateFreshnessDecay,
    calculateTechStackPreference,
    calculateEngagement,
    calculateEnhancedScore,
    generateEnhancedRecommendations
};
