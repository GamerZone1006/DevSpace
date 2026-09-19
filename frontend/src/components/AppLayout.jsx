import { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import MessagingHub from "./MessagingHub";

function AppLayout({ children }) {
    const [messagingOpen, setMessagingOpen] = useState(false);
    const [unreadMessages, setUnreadMessages] = useState(0);

    const toggleMessaging = () => {
        setMessagingOpen((open) => !open);
        setUnreadMessages(0);
    };

    return (
        <div className="app-layout">

            <Navbar />

            <div className="app-body">
                <Sidebar
                    onMessagesClick={toggleMessaging}
                    unreadMessages={unreadMessages}
                />

                <main className="main-content">
                    {children}
                </main>
            </div>

            <MessagingHub
                open={messagingOpen}
                onClose={() => setMessagingOpen(false)}
                onUnreadChange={setUnreadMessages}
            />

        </div>
    );
}

export default AppLayout;