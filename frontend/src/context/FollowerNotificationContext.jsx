import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import api from "../services/api";
import { useUser } from "./useUser";

const FollowerNotificationContext = createContext(null);
const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export function FollowerNotificationProvider({ children }) {
    const { user } = useUser();
    const [unseenFollowerCount, setUnseenFollowerCount] = useState(0);
    const [latestFollowerEvent, setLatestFollowerEvent] = useState(null);
    const followerEventListeners = useRef(new Set());
    const postDeletionListeners = useRef(new Set());
    const seenMutationVersion = useRef(0);

    useEffect(() => {
        if (!user?._id) {
            setUnseenFollowerCount(0);
            setLatestFollowerEvent(null);
            return undefined;
        }

        let active = true;
        const socket = io(socketUrl, {
            auth: { token: localStorage.getItem("devspaceToken") }
        });

        const loadNotifications = async () => {
            const requestVersion = seenMutationVersion.current;
            try {
                const response = await api.get("/follow/notifications");
                if (active && requestVersion === seenMutationVersion.current) {
                    setUnseenFollowerCount(response.data.unseenCount || 0);
                }
            } catch (error) {
                console.error("Follower notifications error:", error);
            }
        };

        const handleFollowerNotification = (payload) => {
            setLatestFollowerEvent(payload);
            followerEventListeners.current.forEach((listener) => listener(payload));
            if (payload.action === "created") {
                setUnseenFollowerCount((count) => count + 1);
            } else if (payload.action === "removed") {
                setUnseenFollowerCount((count) => Math.max(0, count - 1));
            }
        };

        const handleFollowersSeen = () => setUnseenFollowerCount(0);
        const handlePostDeleted = (payload) => {
            postDeletionListeners.current.forEach((listener) => listener(payload));
        };

        socket.on("notification:follower", handleFollowerNotification);
        socket.on("notification:followers-seen", handleFollowersSeen);
        socket.on("post:deleted", handlePostDeleted);
        loadNotifications();

        return () => {
            active = false;
            socket.off("notification:follower", handleFollowerNotification);
            socket.off("notification:followers-seen", handleFollowersSeen);
            socket.off("post:deleted", handlePostDeleted);
            socket.disconnect();
        };
    }, [user?._id]);

    const markFollowersSeen = useCallback(async () => {
        seenMutationVersion.current += 1;
        setUnseenFollowerCount(0);
        try {
            await api.post("/follow/notifications/seen");
        } catch (error) {
            console.error("Mark follower notifications seen error:", error);
        }
    }, []);

    const subscribeToFollowerEvents = useCallback((listener) => {
        followerEventListeners.current.add(listener);
        return () => followerEventListeners.current.delete(listener);
    }, []);

    const subscribeToPostDeletions = useCallback((listener) => {
        postDeletionListeners.current.add(listener);
        return () => postDeletionListeners.current.delete(listener);
    }, []);

    const value = useMemo(() => ({
        unseenFollowerCount,
        hasUnseenFollowers: unseenFollowerCount > 0,
        latestFollowerEvent,
        markFollowersSeen,
        subscribeToFollowerEvents,
        subscribeToPostDeletions
    }), [latestFollowerEvent, markFollowersSeen, subscribeToFollowerEvents, subscribeToPostDeletions, unseenFollowerCount]);

    return (
        <FollowerNotificationContext.Provider value={value}>
            {children}
        </FollowerNotificationContext.Provider>
    );
}

export function useFollowerNotifications() {
    const context = useContext(FollowerNotificationContext);
    if (!context) {
        throw new Error("useFollowerNotifications must be used inside FollowerNotificationProvider");
    }
    return context;
}
