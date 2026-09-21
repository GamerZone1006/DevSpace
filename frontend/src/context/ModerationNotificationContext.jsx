import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useUser } from "./useUser";

const ModerationNotificationContext = createContext(null);

export function ModerationNotificationProvider({ children }) {
    const { user } = useUser();
    const [hasUnseenWarnings, setHasUnseenWarnings] = useState(false);
    const [warnings, setWarnings] = useState([]);

    useEffect(() => {
        if (!user?._id) {
            setHasUnseenWarnings(false);
            setWarnings([]);
            return undefined;
        }

        let active = true;

        const loadWarnings = async () => {
            try {
                const response = await api.get("/users/me");
                if (active) {
                    const userWarnings = response.data.user?.moderationWarnings || [];
                    const unseenWarnings = userWarnings.filter((warning) => !warning.seenAt);
                    setWarnings(userWarnings);
                    setHasUnseenWarnings(unseenWarnings.length > 0);
                }
            } catch (error) {
                console.error("Moderation warnings error:", error);
            }
        };

        loadWarnings();

        return () => {
            active = false;
        };
    }, [user?._id]);

    const markWarningsSeen = useCallback(async () => {
        try {
            await api.post("/users/me/moderation-warnings/seen-all");
            setHasUnseenWarnings(false);
            setWarnings((current) =>
                current.map((warning) => ({ ...warning, seenAt: new Date() }))
            );
        } catch (error) {
            console.error("Mark moderation warnings seen error:", error);
        }
    }, []);

    const value = useMemo(() => ({
        hasUnseenWarnings,
        warnings,
        markWarningsSeen
    }), [hasUnseenWarnings, warnings, markWarningsSeen]);

    return (
        <ModerationNotificationContext.Provider value={value}>
            {children}
        </ModerationNotificationContext.Provider>
    );
}

export function useModerationNotifications() {
    const context = useContext(ModerationNotificationContext);
    if (!context) {
        throw new Error("useModerationNotifications must be used inside ModerationNotificationProvider");
    }
    return context;
}