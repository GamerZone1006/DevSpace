export function formatRelativeTime(timestamp, now = Date.now()) {
    const createdAt = new Date(timestamp).getTime();

    if (!Number.isFinite(createdAt)) return "";

    const elapsedSeconds = Math.max(0, Math.floor((now - createdAt) / 1000));

    if (elapsedSeconds < 60) return "Just now";

    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;

    const elapsedHours = Math.floor(elapsedMinutes / 60);
    if (elapsedHours < 24) return `${elapsedHours}h ago`;

    const elapsedDays = Math.floor(elapsedHours / 24);
    if (elapsedDays < 7) return `${elapsedDays}d ago`;

    const elapsedWeeks = Math.floor(elapsedDays / 7);
    if (elapsedWeeks < 5) return `${elapsedWeeks}w ago`;

    return new Date(createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: new Date(createdAt).getFullYear() === new Date(now).getFullYear() ? undefined : "numeric"
    });
}
