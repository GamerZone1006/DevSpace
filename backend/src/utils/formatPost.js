const formatPost = (post, userId, savedSet = new Set()) => {
    const data = typeof post.toObject === "function" ? post.toObject() : { ...post };
    const likes = data.likes || [];
    const mediaUrls = data.mediaUrls?.length ? data.mediaUrls : [data.mediaUrl].filter(Boolean);

    return {
        ...data,
        mediaUrls,
        likesCount: data.likesCount ?? likes.length,
        savesCount: data.savesCount ?? 0,
        sharesCount: data.sharesCount ?? 0,
        commentsCount: data.commentsCount ?? 0,
        likedByMe: likes.some((id) => id.toString() === userId?.toString()),
        savedByMe: savedSet.has(data._id.toString())
    };
};

module.exports = { formatPost };
