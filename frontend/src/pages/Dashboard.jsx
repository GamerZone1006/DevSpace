import { useEffect, useState } from "react";
import api from "../services/api";
import PostCard from "../components/PostCard";

function normalizeInterest(interest, index) {
    if (interest == null) {
        return null;
    }

    if (typeof interest === "string" || typeof interest === "number") {
        return {
            key: `interest-${index}-${interest}`,
            topic: String(interest),
            score: 0
        };
    }

    if (typeof interest === "object") {
        const topic = interest.topic || interest.name || interest.label;
        if (!topic) return null;

        return {
            key: `interest-${index}-${topic}`,
            topic: String(topic),
            score: Number(interest.score || 0)
        };
    }

    return null;
}

function Dashboard() {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [savedModalOpen, setSavedModalOpen] = useState(false);
    const [savedPosts, setSavedPosts] = useState([]);
    const [savedPostsLoading, setSavedPostsLoading] = useState(false);
    const [savedPostsError, setSavedPostsError] = useState("");
    const [selectedPost, setSelectedPost] = useState(null);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                setLoading(true);
                const response = await api.get("/dashboard");
                setDashboard(response.data.dashboard);
            } catch (dashboardError) {
                console.error("Dashboard error:", dashboardError);
                setError(
                    dashboardError.response?.data?.message ||
                    "Unable to load dashboard."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    useEffect(() => {
        if (!savedModalOpen && !selectedPost) return undefined;

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                if (selectedPost) {
                    setSelectedPost(null);
                } else {
                    setSavedModalOpen(false);
                }
            }
        };

        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [savedModalOpen, selectedPost]);

    useEffect(() => {
        if (!savedModalOpen) return;

        const fetchSavedPosts = async () => {
            try {
                setSavedPostsLoading(true);
                setSavedPostsError("");
                const response = await api.get("/engagement/saved");
                setSavedPosts(response.data.posts || []);
            } catch (savedPostsErrorResponse) {
                console.error("Saved posts error:", savedPostsErrorResponse);
                setSavedPostsError(
                    savedPostsErrorResponse.response?.data?.message ||
                    "Unable to load saved posts."
                );
            } finally {
                setSavedPostsLoading(false);
            }
        };

        fetchSavedPosts();
    }, [savedModalOpen]);

    const handleSavedPostUpdate = (postId, updates) => {
        if (updates.savedByMe === false) {
            setSavedPosts((current) => current.filter((post) => post._id !== postId));
            setDashboard((current) => current
                ? { ...current, savedPosts: Math.max(0, (current.savedPosts || 0) - 1) }
                : current);
            if (selectedPost && selectedPost._id === postId) {
                setSelectedPost(null);
            }
            return;
        }

        setSavedPosts((current) => current.map((post) =>
            post._id === postId ? { ...post, ...updates } : post
        ));
        if (selectedPost && selectedPost._id === postId) {
            setSelectedPost((current) => ({ ...current, ...updates }));
        }
    };

    if (loading) {
        return (
            <div className="dashboard-page">
                <div className="feed-message">Loading dashboard...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-page">
                <div className="feed-message error">{error}</div>
            </div>
        );
    }

    if (!dashboard) {
        return (
            <div className="dashboard-page">
                <div className="feed-message">No dashboard data available.</div>
            </div>
        );
    }

    const rawInterests = Array.isArray(dashboard.interests)
        ? dashboard.interests
        : dashboard.interests && typeof dashboard.interests === "object"
            ? Object.entries(dashboard.interests).map(([topic, score]) => ({ topic, score }))
            : [];

    const interests = rawInterests
        .map(normalizeInterest)
        .filter(Boolean);

    return (
        <div className="dashboard-page">
            <div className="dashboard-header">
                <h1>Learning Dashboard</h1>
                <p>Track what you are learning on DevSpace.</p>
            </div>

            <div className="dashboard-stats">
                <div className="dashboard-card">
                    <span>Learning Time</span>
                    <strong>{dashboard.learningTimeMinutes || 0} min</strong>
                </div>
                <div className="dashboard-card">
                    <span>Reels Watched</span>
                    <strong>{dashboard.reelsWatched || 0}</strong>
                </div>
                <button
                    type="button"
                    className="dashboard-card dashboard-card-button"
                    onClick={() => setSavedModalOpen(true)}
                    aria-haspopup="dialog"
                    aria-expanded={savedModalOpen}
                >
                    <span>Saved Posts</span>
                    <strong>{dashboard.savedPosts || 0}</strong>
                    <small>Open collection</small>
                </button>
                <div className="dashboard-card">
                    <span>Avg. Completion</span>
                    <strong>
                        {Math.round((dashboard.averageCompletionRate || 0) * 100)}%
                    </strong>
                </div>
            </div>

            {/* Main Saved Posts Modal (Grid View) */}
            <div
                className={`saved-posts-modal-backdrop ${savedModalOpen ? "is-open" : ""}`}
                role="presentation"
                aria-hidden={!savedModalOpen}
                onMouseDown={(event) => {
                    if (event.target === event.currentTarget) setSavedModalOpen(false);
                }}
            >
                <section
                    className="saved-posts-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="saved-posts-title"
                >
                    <div className="saved-posts-modal-header">
                        <div>
                            <span className="saved-posts-eyebrow">YOUR COLLECTION</span>
                            <h2 id="saved-posts-title">Saved Posts</h2>
                        </div>
                        <button
                            type="button"
                            className="saved-posts-close"
                            onClick={() => setSavedModalOpen(false)}
                            aria-label="Close saved posts"
                        >
                            ×
                        </button>
                    </div>

                    <div className="saved-posts-modal-content">
                        {savedPostsLoading ? (
                            <div className="feed-message">Loading saved posts...</div>
                        ) : savedPostsError ? (
                            <div className="feed-message error">{savedPostsError}</div>
                        ) : savedPosts.length === 0 ? (
                            <div className="feed-message">You have not saved any posts yet.</div>
                        ) : (
                            <div className="saved-posts-grid">
                                {savedPosts.map((post) => (
                                    <button
                                        key={post._id}
                                        type="button"
                                        className="saved-thumbnail-card"
                                        onClick={() => setSelectedPost(post)}
                                    >
                                        <div className="saved-thumbnail-content">
                                            {post.type === "video" && post.mediaUrl ? (
                                                <video
                                                    src={post.mediaUrl}
                                                    poster={post.thumbnailUrl || undefined}
                                                    muted
                                                    playsInline
                                                    preload="metadata"
                                                    aria-label={post.caption || "Saved video post"}
                                                />
                                            ) : post.mediaUrl || post.thumbnailUrl ? (
                                                <img
                                                    src={post.mediaUrl || post.thumbnailUrl}
                                                    alt={post.title || post.caption || "Saved post"}
                                                />
                                            ) : (
                                                <span className="saved-thumbnail-fallback">
                                                    {post.title || post.caption || "View Post"}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Single Post Full Viewer Overlay */}
            {selectedPost && (
                <div
                    className="single-post-modal-backdrop"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) setSelectedPost(null);
                    }}
                >
                    <div className="single-post-modal" role="dialog" aria-modal="true">
                        <div className="single-post-header">
                            <button
                                type="button"
                                className="single-post-back"
                                onClick={() => setSelectedPost(null)}
                            >
                                ← Back to Grid
                            </button>
                            <button
                                type="button"
                                className="saved-posts-close"
                                onClick={() => setSelectedPost(null)}
                                aria-label="Close post"
                            >
                                ×
                            </button>
                        </div>
                        <div className="single-post-body">
                            <PostCard
                                post={selectedPost}
                                onPostUpdate={handleSavedPostUpdate}
                            />
                        </div>
                    </div>
                </div>
            )}

            <section className="dashboard-section">
                <h2>Your Interests</h2>
                <div className="dashboard-tags">
                    {interests.length > 0 ? (
                        interests.map((interest) => (
                            <span key={interest.key}>
                                {interest.topic}
                                <small>{Math.round(interest.score * 100)}%</small>
                            </span>
                        ))
                    ) : (
                        <p className="empty-text">Follow topics by watching and saving posts.</p>
                    )}
                </div>
            </section>

            {/* Dashboard Manual Section */}
            <section className="dashboard-section dashboard-manual">
                <h2>How Dashboard Works</h2>
                <p className="manual-subtitle">A quick guide to understanding your metrics and learning stats.</p>
                
                <div className="manual-grid">
                    <div className="manual-item manual-time">
                        <div className="manual-icon">
                            <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                        </div>
                        <div>
                            <h4>Learning Time</h4>
                            <p>Total time spent actively viewing and engaging with educational content on DevSpace.</p>
                        </div>
                    </div>

                    <div className="manual-item manual-reels">
                        <div className="manual-icon">
                            <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                                <line x1="7" y1="2" x2="7" y2="22"></line>
                                <line x1="17" y1="2" x2="17" y2="22"></line>
                                <line x1="2" y1="12" x2="22" y2="12"></line>
                                <line x1="2" y1="7" x2="7" y2="7"></line>
                                <line x1="2" y1="17" x2="7" y2="17"></line>
                                <line x1="17" y1="17" x2="22" y2="17"></line>
                                <line x1="17" y1="7" x2="22" y2="7"></line>
                            </svg>
                        </div>
                        <div>
                            <h4>Reels Watched</h4>
                            <p>The total number of bite-sized technical reels you have viewed across the platform.</p>
                        </div>
                    </div>

                    <div className="manual-item manual-saved">
                        <div className="manual-icon">
                            <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                            </svg>
                        </div>
                        <div>
                            <h4>Saved Posts</h4>
                            <p>Count of valuable posts and snippets you've bookmarked for quick future reference.</p>
                        </div>
                    </div>

                    <div className="manual-item manual-completion">
                        <div className="manual-icon">
                            <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                <polyline points="17 6 23 6 23 12"></polyline>
                            </svg>
                        </div>
                        <div>
                            <h4>Avg. Completion</h4>
                            <p>The average percentage of content watched through to completion, reflecting focus and depth.</p>
                        </div>
                    </div>

                    <div className="manual-item manual-interests">
                        <div className="manual-icon">
                            <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <circle cx="12" cy="12" r="6"></circle>
                                <circle cx="12" cy="12" r="2"></circle>
                            </svg>
                        </div>
                        <div>
                            <h4>Your Interests</h4>
                            <p>Dynamic score breakdown of tech domains and topics you interact with the most.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Dashboard;