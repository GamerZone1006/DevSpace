/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

import api from "../services/api";
import PostCard from "../components/PostCard";
import useWellnessTimer from "../hooks/useWellnessTimer";
import WellnessReminder from "../components/WellnessReminder";

function Feed() {
    const [searchParams, setSearchParams] = useSearchParams();
    const {
        showReminder,
        reminderType,
        activeTime,
        formatTime,
        dismissReminder,
        takeBreak,
        continueBrowsing
    } = useWellnessTimer();

    const tabFromUrl = searchParams.get("tab");
    const searchQuery = searchParams.get("q");
    const initialTab =
        tabFromUrl === "following" || tabFromUrl === "reels"
            ? tabFromUrl
            : "for-you";

    const [activeTab, setActiveTab] = useState(initialTab);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    const fetchFeed = useCallback(async (tab = activeTab, silent = false, query = searchQuery) => {
        try {
            if (!silent) {
                setLoading(true);
            } else {
                setRefreshing(true);
            }

            setError("");

            const endpoint =
                tab === "following"
                    ? "/feed/following"
                    : "/feed/for-you";

            const response = await api.get(endpoint);
            let feed = response.data.feed || [];

            // Filter by search query if present
            if (query) {
                const searchLower = query.toLowerCase();
                feed = feed.filter((post) =>
                    post.caption?.toLowerCase().includes(searchLower) ||
                    post.technologyTags?.some((tag) => tag.toLowerCase().includes(searchLower)) ||
                    post.hashtags?.some((tag) => tag.toLowerCase().includes(searchLower)) ||
                    post.author?.username?.toLowerCase().includes(searchLower) ||
                    post.author?.name?.toLowerCase().includes(searchLower)
                );
            }

            setPosts(
                tab === "reels"
                    ? feed.filter((post) => post.type === "video")
                    : feed
            );
        } catch (feedError) {
            console.error("Feed error:", feedError);

            if (!silent) {
                setError(
                    feedError.response?.data?.message ||
                    "Unable to load feed"
                );
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeTab, searchQuery]);

    useEffect(() => {
        queueMicrotask(() => {
            fetchFeed(activeTab);
        });
    }, [activeTab, fetchFeed]);

    useEffect(() => {
        if (searchQuery) {
            fetchFeed(activeTab, true);
        }
    }, [searchQuery, activeTab, fetchFeed]);

    const changeTab = (tab) => {
        setActiveTab(tab);
        setSearchParams(tab === "for-you" ? {} : { tab });
    };

    const handlePostUpdate = (postId, updates) => {
        setPosts((currentPosts) =>
            currentPosts.map((post) =>
                post._id === postId
                    ? { ...post, ...updates }
                    : post
            )
        );
    };

    const handlePostDelete = (postId) => {
        setPosts((current) => current.filter((post) => post._id !== postId));
    };

    const visiblePosts = posts;

    return (
        <div className="feed-page">
            <div className="feed-header">
                {/* <div>
                    <h1>DevSpace</h1>
                    <p>Learn. Build. Share.</p>
                </div> */}

                <div className="feed-tabs">
                    <button
                        className={activeTab === "for-you" ? "active" : ""}
                        onClick={() => changeTab("for-you")}
                    >
                        <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        <span className="tab-text">&nbsp; For You</span>
                    </button>
                    <button
                        className={activeTab === "following" ? "active" : ""}
                        onClick={() => changeTab("following")}
                    >
                        <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <line x1="19" y1="11" x2="19" y2="17" />
                            <line x1="22" y1="14" x2="16" y2="14" />
                        </svg>
                        <span className="tab-text">&nbsp; Following</span>
                    </button>
                    {/* <button
                        className={activeTab === "reels" ? "active" : ""}
                        onClick={() => changeTab("reels")}
                    >
                        <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        <span className="tab-text">&nbsp; Reels</span>
                    </button> */}
                </div>
            </div>

            {refreshing && (
                <p className="refreshing-message">Updating feed...</p>
            )}

            {loading && (
                <div className="feed-message">Loading posts...</div>
            )}

            {!loading && error && (
                <div className="feed-message error">{error}</div>
            )}

            {!loading && !error && visiblePosts.length === 0 && (
                <div className="feed-message">
                    {activeTab === "reels"
                        ? "No reels yet. Post a video to get started."
                        : "No posts available yet."}
                </div>
            )}

            {!loading && !error && visiblePosts.length > 0 && (
                <div className={`posts-container ${activeTab === "reels" ? "reels-feed" : ""}`}>
                    {visiblePosts.map((post) => (
                        <PostCard
                            key={post._id}
                            post={post}
                            feedPost
                            autoPlayOnView={activeTab === "reels"}
                            onPostUpdate={handlePostUpdate}
                            onPostDelete={handlePostDelete}
                        />
                    ))}
                </div>
            )}

            <WellnessReminder
                show={showReminder}
                reminderType={reminderType}
                activeTime={activeTime}
                formatTime={formatTime}
                onDismiss={dismissReminder}
                onTakeBreak={takeBreak}
                onContinue={continueBrowsing}
            />
        </div>
    );
}

export default Feed;