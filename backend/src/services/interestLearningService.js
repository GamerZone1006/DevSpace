const User = require("../models/User");
const Post = require("../models/Post");

const clamp = (value, min = 0, max = 1) => {
    return Math.max(min, Math.min(max, value));
};

/*
    Interaction signals:

    Skip        = -0.5
    Low watch   = -0.2
    50% watch   = +0.2
    75% watch   = +0.5
    Full watch  = +0.8
    Replay      = +0.9
    Like        = +1.0
    Save        = +1.5
    Share       = +1.7
*/

const calculateInteractionSignal = ({
    completionRate = 0,
    watchCount = 1,
    liked = false,
    saved = false,
    shared = false
}) => {
    let signal = 0;

    // Watch behaviour
    if (completionRate < 0.25) {
        signal -= 0.5;
    } else if (completionRate >= 0.5 && completionRate < 0.75) {
        signal += 0.2;
    } else if (completionRate >= 0.75 && completionRate < 1) {
        signal += 0.5;
    } else if (completionRate >= 1) {
        signal += 0.8;
    }

    // Replay
    if (watchCount > 1) {
        signal += 0.9;
    }

    // Explicit engagement
    if (liked) {
        signal += 1.0;
    }

    if (saved) {
        signal += 1.5;
    }

    if (shared) {
        signal += 1.7;
    }

    return signal;
};

const updateInterestScores = async (userId, postId, behavior) => {
    const user = await User.findById(userId);
    const post = await Post.findById(postId);

    if (!user || !post) {
        return;
    }

    const tags = post.technologyTags || [];

    if (!tags.length) {
        return;
    }

    const interactionSignal = calculateInteractionSignal(behavior);

    for (const rawTag of tags) {
        const tag = rawTag.trim().toLowerCase();

        if (!tag) continue;

        const oldScore = user.interestScores.get(tag) || 0.5;

        /*
            Exponential moving average:

            New Score =
                80% previous interest
                + 20% current behaviour
        */

        const normalizedSignal = clamp(
            (interactionSignal + 1) / 3
        );

        const newScore =
            (oldScore * 0.8) +
            (normalizedSignal * 0.2);

        user.interestScores.set(
            tag,
            Number(clamp(newScore).toFixed(4))
        );
    }

    await user.save();
};

module.exports = {
    calculateInteractionSignal,
    updateInterestScores
};