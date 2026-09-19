/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import CommentSection from "./CommentSection";
import { formatRelativeTime } from "../utils/formatRelativeTime";

function PostCard({ post, onPostUpdate, onPostDelete, initialCommentsOpen = false, feedPost = false, autoPlayOnView = false }) {
    const [liked, setLiked] = useState(Boolean(post.likedByMe));
    const [likesCount, setLikesCount] = useState(post.likesCount || 0);
    const [saved, setSaved] = useState(Boolean(post.savedByMe));
    const [savesCount, setSavesCount] = useState(post.savesCount || 0);
    const [sharesCount, setSharesCount] = useState(post.sharesCount || 0);
    const [actionLoading, setActionLoading] = useState("");
    const [showComments, setShowComments] = useState(initialCommentsOpen);
    const [carouselIndex, setCarouselIndex] = useState(0);
    const [now, setNow] = useState(0);

    const watchTimer = useRef(null);
    const lastTrackedTime = useRef(0);
    const postCardRef = useRef(null);
    const videoRef = useRef(null);

    useEffect(() => {
        const updateTime = () => setNow(Date.now());
        updateTime();
        const timer = window.setInterval(updateTime, 15000);

        return () => window.clearInterval(timer);
    }, [post._id]);

    useEffect(() => {
        if (!autoPlayOnView || post.type !== "video" || !videoRef.current) {
            return undefined;
        }

        const video = videoRef.current;
        let isVisible = false;

        const observer = new IntersectionObserver(
            ([entry]) => {
                isVisible = entry.isIntersecting && entry.intersectionRatio >= 0.5;

                if (!isVisible) {
                    video.pause();
                    return;
                }

                const playPromise = video.play();
                playPromise
                    ?.then(() => {
                        // A pending play can resolve after a fast scroll out of view.
                        if (!isVisible) video.pause();
                    })
                    .catch(() => {
                        // Autoplay with sound can be blocked until the user interacts.
                    });
            },
            { threshold: 0.5 }
        );

        observer.observe(video);

        return () => {
            isVisible = false;
            observer.unobserve(video);
            observer.disconnect();
            video.pause();
        };
    }, [autoPlayOnView, post.type, post._id]);

    useEffect(() => {
        setLiked(Boolean(post.likedByMe));
        setLikesCount(post.likesCount || 0);
        setSaved(Boolean(post.savedByMe));
        setSavesCount(post.savesCount || 0);
        setSharesCount(post.sharesCount || 0);
    }, [post._id, post.likedByMe, post.likesCount, post.savedByMe, post.savesCount, post.sharesCount]);

    useEffect(() => {
        setCarouselIndex(0);
    }, [post._id]);

    const persistUpdate = (updates) => {
        onPostUpdate?.(post._id, updates);
    };

    const handleLike = async () => {
        if (actionLoading) return;

        const nextLiked = !liked;
        const nextCount = Math.max(0, likesCount + (nextLiked ? 1 : -1));
        setLiked(nextLiked);
        setLikesCount(nextCount);
        persistUpdate({ likedByMe: nextLiked, likesCount: nextCount });

        try {
            setActionLoading("like");
            const response = await api.post(`/posts/${post._id}/like`);
            const likedByMe = response.data.likedByMe ?? response.data.liked;
            const count = response.data.likesCount;
            setLiked(likedByMe);
            setLikesCount(count);
            persistUpdate({ likedByMe, likesCount: count });
        } catch (error) {
            console.error("Like error:", error);
            setLiked(!nextLiked);
            setLikesCount(likesCount);
            persistUpdate({ likedByMe: !nextLiked, likesCount });
        } finally {
            setActionLoading("");
        }
    };

    const handleSave = async () => {
        if (actionLoading) return;

        const nextSaved = !saved;
        const nextCount = Math.max(0, savesCount + (nextSaved ? 1 : -1));
        setSaved(nextSaved);
        setSavesCount(nextCount);
        persistUpdate({ savedByMe: nextSaved, savesCount: nextCount });

        try {
            setActionLoading("save");
            const response = await api.post(`/engagement/save/${post._id}`);
            const savedByMe = response.data.savedByMe ?? response.data.saved;
            const count = response.data.savesCount;
            setSaved(savedByMe);
            setSavesCount(count);
            persistUpdate({ savedByMe, savesCount: count });
        } catch (error) {
            console.error("Save error:", error);
            setSaved(!nextSaved);
            setSavesCount(savesCount);
            persistUpdate({ savedByMe: !nextSaved, savesCount });
        } finally {
            setActionLoading("");
        }
    };

    const handleShare = async () => {
        try {
            const response = await api.post(`/engagement/share/${post._id}`);
            const nextShares = response.data.sharesCount ?? sharesCount + 1;
            setSharesCount(nextShares);
            persistUpdate({ sharesCount: nextShares });

            if (navigator.share) {
                await navigator.share({
                    title: "DevSpace",
                    text: post.caption || "Check out this post on DevSpace",
                    url: `${window.location.origin}/post/${post._id}`
                });
            } else {
                await navigator.clipboard.writeText(
                    `${window.location.origin}/post/${post._id}`
                );
            }
        } catch (error) {
            console.error("Share error:", error);
        }
    };

    const trackWatch = async (video) => {
        if (!video.duration) return;
        const watchDuration = Math.floor(video.currentTime);

        if (watchDuration - lastTrackedTime.current < 10 && !video.ended) return;
        lastTrackedTime.current = watchDuration;

        try {
            await api.post(`/watch/${post._id}`, {
                watchDuration,
                videoDuration: Math.floor(video.duration)
            });
        } catch (error) {
            console.error("Watch tracking error:", error);
        }
    };

    const handleVideoPlay = () => {
        watchTimer.current = setInterval(() => {
            const video = document.getElementById(`video-${post._id}`);
            if (video) trackWatch(video);
        }, 10000);
    };

    const handleVideoPause = async (e) => {
        clearInterval(watchTimer.current);
        await trackWatch(e.currentTarget);
    };

    const handleVideoEnded = async (e) => {
        clearInterval(watchTimer.current);
        await trackWatch(e.currentTarget);
    };

    const authorId = post.author?._id || post.author?.id || post.author?.username;
    const currentUser = JSON.parse(localStorage.getItem("devspaceUser") || "null");
    const isOwnPost = currentUser && (post.author?._id === currentUser._id || post.author?.id === currentUser.id);

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this post?")) {
            return;
        }

        try {
            await api.delete(`/posts/${post._id}`);
            onPostDelete?.(post._id);
        } catch (error) {
            console.error("Delete post error:", error);
            alert("Failed to delete post. Please try again.");
        }
    };

    const mediaItems = post.mediaUrls?.length ? post.mediaUrls : [post.mediaUrl].filter(Boolean);
    const moveCarousel = (direction) => {
        setCarouselIndex((current) => (current + direction + mediaItems.length) % mediaItems.length);
    };

    const relativeTimestamp = formatRelativeTime(post.createdAt, now);

    return (
        <article ref={postCardRef} className={`post-card ${feedPost ? "feed-post-card" : ""} ${autoPlayOnView ? "reel-post-card" : ""}`}>
            <div className="post-author-bar">
                <Link to={authorId ? `/profile/${authorId}` : "/profile"} className="author-link">
                    <div className="author-avatar">
                        {post.author?.profilePicture ? (
                            <img src={post.author.profilePicture} alt={post.author.username} />
                        ) : (
                            post.author?.name?.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div>
                        <strong>{post.author?.username || post.author?.name}</strong>
                        <span>{post.author?.name}</span>
                    </div>
                </Link>
                {relativeTimestamp && (
                    <time
                        className="post-timestamp"
                        dateTime={post.createdAt}
                        title={new Date(post.createdAt).toLocaleString()}
                    >
                        {relativeTimestamp}
                    </time>
                )}
            </div>

            <div className={`post-content-layout ${showComments ? "comments-open" : ""}`}>
                <div className="post-media-column">
                    <div className="post-media-wrap">
                        <div className={`post-media ${mediaItems.length > 1 ? "carousel-media" : ""}`}>
                            {post.status === "processing" ? (
                                <div className="media-processing">Processing media...</div>
                            ) : post.type === "video" ? (
                                <video
                                    ref={videoRef}
                                    id={`video-${post._id}`}
                                    src={post.mediaUrl}
                                    controls
                                    playsInline
                                    preload="metadata"
                                    onPlay={handleVideoPlay}
                                    onPause={handleVideoPause}
                                    onEnded={handleVideoEnded}
                                />
                            ) : (
                                <>
                                    <div className="carousel-track" style={{ transform: `translateX(-${carouselIndex * 100}%)` }}>
                                        {mediaItems.map((mediaUrl, index) => (
                                            <img key={`${mediaUrl}-${index}`} src={mediaUrl} alt={`${post.caption || "DevSpace post"} ${index + 1}`} />
                                        ))}
                                    </div>
                                    {mediaItems.length > 1 && (
                                        <>
                                            <button type="button" className="carousel-arrow carousel-arrow-prev" onClick={() => moveCarousel(-1)} aria-label="Previous image">‹</button>
                                            <button type="button" className="carousel-arrow carousel-arrow-next" onClick={() => moveCarousel(1)} aria-label="Next image">›</button>
                                            <div className="carousel-dots" aria-label="Carousel pagination">
                                                {mediaItems.map((mediaUrl, index) => (
                                                    <button key={`${mediaUrl}-${index}`} type="button" className={index === carouselIndex ? "active" : ""} onClick={() => setCarouselIndex(index)} aria-label={`Show image ${index + 1}`} />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="post-action-rail">
                            <button
                                type="button"
                                onClick={handleLike}
                                disabled={Boolean(actionLoading)}
                                className={liked ? "liked" : ""}
                                aria-label="Like"
                            >
                                <span className="action-icon">
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                    </svg>
                                </span>
                                <span className="action-count">{likesCount}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowComments((open) => !open)}
                                aria-label="Comments"
                            >
                                <span className="action-icon">
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                    </svg>
                                </span>
                                <span className="action-count">{post.commentsCount || 0}</span>
                            </button>

                            <button type="button" onClick={handleShare} aria-label="Share">
                                <span className="action-icon">
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="22" y1="2" x2="11" y2="13"></line>
                                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                    </svg>
                                </span>
                                <span className="action-count">{sharesCount}</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={Boolean(actionLoading)}
                                className={saved ? "saved" : ""}
                                aria-label="Save"
                            >
                                <span className="action-icon">
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                                    </svg>
                                </span>
                                <span className="action-count">{savesCount}</span>
                            </button>

                            {isOwnPost && (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    aria-label="Delete"
                                    className="delete-button"
                                >
                                    <span className="action-icon">
                                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        </svg>
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>

                    {post.caption && <div className="post-caption">{post.caption}</div>}

                    {post.technologyTags?.length > 0 && (
                        <div className="technology-tags">
                            {post.technologyTags.map((tag) => (
                                <span key={tag}>#{tag}</span>
                            ))}
                        </div>
                    )}
                </div>

                <CommentSection
                    postId={post._id}
                    open={showComments}
                    onClose={() => setShowComments(false)}
                />
            </div>
        </article>
    );
}

export default PostCard;
