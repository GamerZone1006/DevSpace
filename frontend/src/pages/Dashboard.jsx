import { useEffect, useState } from "react";
import api from "../services/api";

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

function normalizeTopic(topic, index) {
    if (topic == null) return null;

    if (typeof topic === "string") {
        return { key: `topic-${index}-${topic}`, topic, count: 0 };
    }

    const label = topic.topic || topic.name;
    if (!label) return null;

    return {
        key: `topic-${index}-${label}`,
        topic: String(label),
        count: Number(topic.count || 0)
    };
}

function Dashboard() {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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

    const topicsExplored = (dashboard.topicsExplored || [])
        .map(normalizeTopic)
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
                <div className="dashboard-card">
                    <span>Saved Posts</span>
                    <strong>{dashboard.savedPosts || 0}</strong>
                </div>
                <div className="dashboard-card">
                    <span>Avg. Completion</span>
                    <strong>
                        {Math.round((dashboard.averageCompletionRate || 0) * 100)}%
                    </strong>
                </div>
            </div>

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

            <section className="dashboard-section">
                <h2>Topics Explored</h2>
                {topicsExplored.length > 0 ? (
                    <div className="topic-list">
                        {topicsExplored.map((topic) => (
                            <div className="topic-row" key={topic.key}>
                                <span>{topic.topic}</span>
                                <strong>{topic.count}</strong>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="empty-text">
                        Start watching technical content to see your learning activity here.
                    </p>
                )}
            </section>
        </div>
    );
}

export default Dashboard;
