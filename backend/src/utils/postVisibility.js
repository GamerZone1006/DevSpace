const VISIBLE_STATUSES = ["ready", "published"];

const visiblePostsFilter = (userId) => {
    if (!userId) {
        return { status: { $in: VISIBLE_STATUSES } };
    }

    return {
        $or: [
            { status: { $in: VISIBLE_STATUSES } },
            { author: userId, status: "processing" }
        ]
    };
};

module.exports = {
    VISIBLE_STATUSES,
    visiblePostsFilter
};
