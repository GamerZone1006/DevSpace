import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import api from "../services/api";
import PostCard from "../components/PostCard";
import FollowButton from "../components/FollowButton";
import CreatePost from "../components/CreatePost";
import ProfileEdit from "../components/ProfileEdit";
import BadgesSection from "../components/BadgesSection";
import ConnectionsDrawer from "../components/ConnectionsDrawer";
import { useUser } from "../context/useUser";

function Profile() {
    const { userId } = useParams();
    const { setUser } = useUser();

    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activePost, setActivePost] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [connectionsType, setConnectionsType] = useState(null);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                setLoading(true);
                setError("");
                setActivePost(null);

                const endpoint = userId ? `/users/${userId}` : "/users/me";
                const response = await api.get(endpoint);

                setProfile(response.data.user);
                setPosts(response.data.posts || []);
            } catch (loadError) {
                console.error("Profile error:", loadError);

                setError(
                    loadError.response?.data?.message ||
                    "Unable to load profile."
                );
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [userId]);

    useEffect(() => {
        if (!activePost) return undefined;
        const handleKeyDown = (event) => {
            if (event.key === "Escape") setActivePost(null);
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [activePost]);

    const handlePostUpdate = (postId, updates) => {
        setPosts((currentPosts) =>
            currentPosts.map((post) =>
                post._id === postId
                    ? { ...post, ...updates }
                    : post
            )
        );
        setActivePost((current) =>
            current && current._id === postId
                ? { ...current, ...updates }
                : current
        );
    };

    const handleFollowChange = (following, followersCount) => {
        setProfile((current) => ({
            ...current,
            followingByMe: following,
            stats: {
                ...current.stats,
                followersCount:
                    typeof followersCount === "number"
                        ? followersCount
                        : following
                            ? (current.stats?.followersCount || 0) + 1
                            : Math.max(0, (current.stats?.followersCount || 0) - 1)
            }
        }));
    };

    const handlePostCreated = (createdPost) => {
        if (createdPost) {
            setPosts((current) => [createdPost, ...current]);
            setProfile((current) => ({
                ...current,
                stats: {
                    ...current.stats,
                    postsCount: (current.stats?.postsCount || 0) + 1
                }
            }));
        }
    };

    const handlePostDelete = async (postId) => {
        if (!window.confirm("Are you sure you want to delete this post?")) {
            return;
        }

        try {
            await api.delete(`/posts/${postId}`);
            setPosts((current) => current.filter((post) => post._id !== postId));
            setProfile((current) => ({
                ...current,
                stats: {
                    ...current.stats,
                    postsCount: Math.max(0, (current.stats?.postsCount || 0) - 1)
                }
            }));
        } catch (error) {
            console.error("Delete post error:", error);
            alert("Failed to delete post. Please try again.");
        }
    };

    if (loading) {
        return <div className="feed-message">Loading profile...</div>;
    }

    if (error) {
        return <div className="feed-message error">{error}</div>;
    }

    if (!profile) {
        return <div className="feed-message">Profile not found.</div>;
    }

    const skills = Array.isArray(profile.skills) ? profile.skills : [];

    return (
        <div className="profile-page">
            {profile.isOwnProfile && (
                <CreatePost onPostCreated={handlePostCreated} />
            )}

            <div className="profile-header">
                <div className="profile-avatar">
                    {profile.profilePicture ? (
                        <img
                            src={profile.profilePicture}
                            alt={profile.username}
                        />
                    ) : (
                        profile.name?.charAt(0).toUpperCase()
                    )}
                </div>

                <div className="profile-info">
                    <div className="profile-title-row">
                        <div>
                            <h1>{profile.username}</h1>
                            <p>{profile.name}</p>
                        </div>

                        <div className="profile-actions">
                            {!profile.isOwnProfile && (
                                <FollowButton
                                    key={profile._id}
                                    userId={profile._id}
                                    initialFollowing={profile.followingByMe || false}
                                    onFollowChange={handleFollowChange}
                                />
                            )}
                            {profile.isOwnProfile && (
                                <button
                                    className="edit-profile-button"
                                    onClick={() => setIsEditing(true)}
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>
                    </div>

                    {profile.bio && (
                        <p className="profile-bio">{profile.bio}</p>
                    )}

                    <div className="profile-social-links">
                        {profile.linkedinUrl && (
                            <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="social-link">
                                LinkedIn
                            </a>
                        )}
                        {profile.githubUrl && (
                            <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="social-link">
                                GitHub
                            </a>
                        )}
                    </div>

                    <div className="profile-stats">
                        <span>
                            <strong>{profile.stats?.postsCount || posts.length}</strong>{" "}
                            posts
                        </span>
                        <button type="button" onClick={() => setConnectionsType("followers")}>
                            <strong>{profile.stats?.followersCount || 0}</strong>{" "}
                            followers
                        </button>
                        <button type="button" onClick={() => setConnectionsType("following")}>
                            <strong>{profile.stats?.followingCount || 0}</strong>{" "}
                            following
                        </button>
                    </div>
                </div>
            </div>

            {isEditing && (
                <ProfileEdit
                    profile={profile}
                    onSave={(updatedProfile) => {
                        setProfile(updatedProfile);
                        if (profile.isOwnProfile) setUser(updatedProfile);
                        setIsEditing(false);
                    }}
                    onCancel={() => setIsEditing(false)}
                />
            )}

            {skills.length > 0 && (
                <div className="profile-skills">
                    {skills.map((skill) => (
                        <span key={typeof skill === "string" ? skill : skill.topic}>
                            {typeof skill === "string" ? skill : skill.topic}
                        </span>
                    ))}
                </div>
            )}

            <BadgesSection badges={profile.badges} />

            <div className="profile-grid">
                {posts.length === 0 ? (
                    <div className="feed-message">No posts yet.</div>
                ) : (
                    posts.map((post) => (
                        <div key={post._id} className="profile-grid-cell-wrapper">
                            <button
                                className="profile-grid-cell"
                                onClick={() => setActivePost(post)}
                                aria-label={`Open ${post.type === "video" ? "reel" : "post"}`}
                            >
                                {post.type === "video" ? (
                                    <>
                                        {post.thumbnailUrl ? (
                                            <img src={post.thumbnailUrl} alt="" />
                                        ) : (
                                            <video src={post.mediaUrl} muted />
                                        )}
                                        <span className="grid-video-badge">▶</span>
                                    </>
                                ) : (
                                    <img src={post.mediaUrl} alt={post.caption || ""} />
                                )}
                            </button>
                            {profile.isOwnProfile && (
                                <button
                                    className="profile-grid-delete"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        handlePostDelete(post._id);
                                    }}
                                    aria-label="Delete post"
                                >
                                    🗑
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            <ConnectionsDrawer
                profileId={profile._id}
                type={connectionsType || "followers"}
                open={Boolean(connectionsType)}
                onClose={() => setConnectionsType(null)}
            />

            {activePost && (
                <div className="profile-lightbox" role="dialog" aria-modal="true" aria-label="Post viewer">
                    <button className="profile-lightbox-backdrop" type="button" onClick={() => setActivePost(null)} aria-label="Close post viewer" />
                    <div className="profile-lightbox-content">
                        <button className="profile-lightbox-close" type="button" onClick={() => setActivePost(null)} aria-label="Close post viewer">X</button>
                        <PostCard
                            post={activePost}
                            onPostUpdate={handlePostUpdate}
                            onPostDelete={(postId) => {
                                handlePostDelete(postId);
                                setActivePost(null);
                            }}
                            initialCommentsOpen
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default Profile;
