import { useEffect, useState } from "react";
import api from "../services/api";
import FollowButton from "./FollowButton";

function ConnectionsDrawer({ profileId, type, open, onClose }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const title = type === "following" ? "Following" : "Followers";

    useEffect(() => {
        if (!open || !profileId) return;

        const loadConnections = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/users/${profileId}/connections?type=${type}`);
                setUsers(response.data.users || []);
            } catch (error) {
                console.error("Connections error:", error);
            } finally {
                setLoading(false);
            }
        };

        loadConnections();
    }, [open, profileId, type]);

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
                        <p className="connections-empty">Loading {title.toLowerCase()}...</p>
                    ) : users.length === 0 ? (
                        <p className="connections-empty">No {title.toLowerCase()} yet.</p>
                    ) : users.map((user) => (
                        <div className="connection-row" key={user._id}>
                            {user.profilePicture ? (
                                <img src={user.profilePicture} alt={user.username} />
                            ) : (
                                <span className="connection-avatar-fallback">{user.name?.charAt(0).toUpperCase()}</span>
                            )}
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