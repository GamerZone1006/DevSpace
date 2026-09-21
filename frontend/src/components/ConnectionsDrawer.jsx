import { useEffect, useState } from "react";
import api from "../services/api";
import FollowButton from "./FollowButton";
import { useUser } from "../context/useUser";
import { useFollowerNotifications } from "../context/FollowerNotificationContext";

const connectionsCache = new Map();

function ConnectionsDrawer({ profileId, type, open, onClose }) {
    const { user: currentUser } = useUser();
    const { markFollowersSeen, subscribeToFollowerEvents } = useFollowerNotifications();
    const currentUserId = currentUser?._id;
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const title = type === "following" ? "Following" : "Followers";

    useEffect(() => {
        if (!open || !profileId) return;

        const cacheKey = `${profileId}:${type}`;
        const cachedUsers = connectionsCache.get(cacheKey);
        if (cachedUsers) {
            queueMicrotask(() => {
                setUsers(cachedUsers);
                setLoading(false);
            });
        }

        const loadConnections = async () => {
            try {
                if (!cachedUsers) setLoading(true);
                const isOwnFollowers = type === "followers" && String(profileId) === String(currentUserId);
                if (isOwnFollowers) {
                    markFollowersSeen();
                    setUsers((current) => current.map((user) => ({ ...user, isUnseen: false })));
                }
                const response = await api.get(`/users/${profileId}/connections?type=${type}`);
                const nextUsers = response.data.users || [];
                const visibleUsers = isOwnFollowers
                    ? nextUsers.map((user) => ({ ...user, isUnseen: false }))
                    : nextUsers;
                connectionsCache.set(cacheKey, visibleUsers);
                setUsers(visibleUsers);
            } catch (error) {
                console.error("Connections error:", error);
            } finally {
                setLoading(false);
            }
        };

        loadConnections();
    }, [currentUserId, markFollowersSeen, open, profileId, type]);

    useEffect(() => {
        if (!open || type !== "followers" || String(profileId) !== String(currentUserId)) {
            return undefined;
        }

        return subscribeToFollowerEvents((event) => {
            if (event.action === "removed") {
                setUsers((current) => current.filter((user) => user._id !== event.followerId));
                return;
            }

            const follower = event.notification?.follower;
            if (!follower) return;
            setUsers((current) => current.some((user) => user._id === follower._id)
                ? current
                : [{ ...follower, followingByMe: true, isUnseen: true }, ...current]);
        });
    }, [currentUserId, open, profileId, subscribeToFollowerEvents, type]);

    const handleFollowChange = (userId, following) => {
        setUsers((current) => current.map((user) =>
            user._id === userId ? { ...user, followingByMe: following } : user
        ));
    };

    return (
        <div className={`connections-drawer-shell ${open ? "open" : ""}`} aria-hidden={!open}>
            <button className="connections-backdrop" type="button" onClick={onClose} aria-label="Close connections" />
            <aside className="connections-drawer" aria-label={title}>
                <header className="connections-header">
                    <div>
                        <span className="connections-eyebrow">NETWORK</span>
                        <h2>{title}</h2>
                    </div>
                    <button type="button" className="connections-close" onClick={onClose} aria-label="Close drawer">X</button>
                </header>
                <div className="connections-list">
                    {loading ? (
                        <div className="connections-skeleton-list" aria-label={`Loading ${title.toLowerCase()}`}>
                            {[1, 2, 3, 4].map((item) => (
                                <div className="connection-skeleton" key={item}>
                                    <span className="connection-skeleton-avatar" />
                                    <span className="connection-skeleton-copy" />
                                    <span className="connection-skeleton-button" />
                                </div>
                            ))}
                        </div>
                    ) : users.length === 0 ? (
                        <p className="connections-empty">No {title.toLowerCase()} yet.</p>
                    ) : users.map((user) => (
                        <div className="connection-row" key={user._id}>
                            <span className="connection-avatar-wrap">
                                {user.profilePicture ? (
                                    <img src={user.profilePicture} alt={user.username} />
                                ) : (
                                    <span className="connection-avatar-fallback">{user.name?.charAt(0).toUpperCase()}</span>
                                )}
                                {user.isUnseen && <span className="new-follower-dot" aria-label="New follower" />}
                            </span>
                            <div className="connection-info">
                                <strong>{user.username}</strong>
                                <span>{user.name}</span>
                            </div>
                            <FollowButton
                                userId={user._id}
                                initialFollowing={user.followingByMe}
                                onFollowChange={(following) => handleFollowChange(user._id, following)}
                            />
                        </div>
                    ))}
                </div>
            </aside>
        </div>
    );
}

export default ConnectionsDrawer;