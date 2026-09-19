import { useState } from "react";
import api from "../services/api";

function FollowButton({ userId, initialFollowing = false, onFollowChange }) {
    const [following, setFollowing] = useState(initialFollowing);
    const [loading, setLoading] = useState(false);

    const handleFollow = async () => {
        if (loading) return;

        const nextFollowing = !following;
        setFollowing(nextFollowing);
        onFollowChange?.(nextFollowing);

        try {
            setLoading(true);
            const response = await api.post(`/follow/${userId}`);
            setFollowing(response.data.following);
            onFollowChange?.(
                response.data.following,
                response.data.followersCount
            );
        } catch (error) {
            console.error("Follow error:", error);
            setFollowing(!nextFollowing);
            onFollowChange?.(!nextFollowing);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            className={`follow-button ${following ? "following" : ""}`}
            onClick={handleFollow}
            disabled={loading}
        >
            {loading ? "..." : following ? "Following" : "Follow"}
        </button>
    );
}

export default FollowButton;
