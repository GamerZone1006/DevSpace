import { useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import MessagingHub from "./MessagingHub";
import FeedThemeCustomizer from "./FeedThemeCustomizer";
import ScrollToTop from "./ScrollToTop";

function AppLayout({ children }) {
    const [messagingOpen, setMessagingOpen] = useState(false);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [feedTheme, setFeedTheme] = useState(() => localStorage.getItem("devspace-feed-background-theme") || "default");
    const location = useLocation();
    const isFeedRoute = location.pathname === "/feed";

    const toggleMessaging = () => {
        setMessagingOpen((open) => !open);
        setUnreadMessages(0);
    };

    return (
        <div className="app-layout">

            <Navbar />

            <div className={`app-body ${isFeedRoute ? `feed-theme-${feedTheme}` : ""}`}>
                <Sidebar
                    onMessagesClick={toggleMessaging}
                    unreadMessages={unreadMessages}
                />

                <main className={`main-content ${isFeedRoute ? "feed-theme-scope" : ""}`}>
                    {children}
                </main>
            </div>

            <MessagingHub
                open={messagingOpen}
                onClose={() => setMessagingOpen(false)}
                onUnreadChange={setUnreadMessages}
            />

            {isFeedRoute && <FeedThemeCustomizer onThemeChange={setFeedTheme} />}

            {isFeedRoute && <ScrollToTop />}

        </div>
    );
}

export default AppLayout;