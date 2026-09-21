/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState, Fragment } from "react";
import { io } from "socket.io-client";
import api from "../services/api";
import { useUser } from "../context/useUser";

const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

function UserAvatar({ user, className = "" }) {
    return user?.profilePicture ? (
        <img className={className} src={user.profilePicture} alt={user.username} />
    ) : (
        <span className={`${className} avatar-fallback`}>
            {user?.name?.charAt(0).toUpperCase() || "?"}
        </span>
    );
}

function MessagingHub({ open, onClose, onUnreadChange }) {
    const { user: currentUser } = useUser();
    const [following, setFollowing] = useState([]);
    const [activeUser, setActiveUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);
    const [socketConnected, setSocketConnected] = useState(false);
    const [expandedSharedPost, setExpandedSharedPost] = useState(null);
    
    // Tracks unread counts per user ID: { [userId]: count }
    const [unreadCounts, setUnreadCounts] = useState({});

    const socketRef = useRef(null);
    const activeUserRef = useRef(null);
    const messagesEndRef = useRef(null);
    const activeUserId = activeUser?._id;
    const currentUserId = currentUser?._id;

    useEffect(() => {
        activeUserRef.current = activeUser;
    }, [activeUser]);

    useEffect(() => {
        const socket = io(socketUrl, {
            auth: { token: localStorage.getItem("devspaceToken") },
            autoConnect: false
        });
        socketRef.current = socket;

        socket.on("connect", () => setSocketConnected(true));
        socket.on("disconnect", () => setSocketConnected(false));
        socket.on("message:new", (message) => {
            const senderId = message.sender?._id || message.sender;
            const recipientId = message.recipient?._id || message.recipient;
            const isIncoming = String(senderId) !== String(currentUserId);
            const belongsToActiveConversation = String(senderId) === String(activeUserRef.current?._id) ||
                String(recipientId) === String(activeUserRef.current?._id);

            if (belongsToActiveConversation) {
                setMessages((current) => current.some((item) => item._id === message._id)
                    ? current
                    : [...current, message]);
            }

            if (isIncoming) {
                // Always increment the global unread count for the main message icon badge
                onUnreadChange?.((count) => count + 1);

                // If not currently looking at this conversation, increment the sender's specific badge
                if (!belongsToActiveConversation) {
                    setUnreadCounts((prev) => ({
                        ...prev,
                        [senderId]: (prev[senderId] || 0) + 1
                    }));
                }
            }
        });
        socket.on("message:delivered", ({ messageId }) => {
            setMessages((current) => current.map((message) =>
                message._id === messageId ? { ...message, status: "delivered" } : message
            ));
        });
        socket.on("message:read", ({ messageId }) => {
            setMessages((current) => current.map((message) =>
                message._id === messageId ? { ...message, status: "read" } : message
            ));
        });

        socket.connect();

        return () => socket.disconnect();
    }, [currentUserId, onUnreadChange]);

    useEffect(() => {
        if (!open) return;
        const loadFollowing = async () => {
            try {
                const response = await api.get("/messages/following");
                setFollowing(response.data.users || []);
            } catch (error) {
                console.error("Following users error:", error);
            }
        };
        loadFollowing();
        onUnreadChange?.(0);
    }, [open, onUnreadChange]);

    useEffect(() => {
        if (!activeUserId) return;
        
        // Clear unread badge for this active user when opening their chat
        setUnreadCounts((prev) => ({
            ...prev,
            [activeUserId]: 0
        }));

        const loadConversation = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/messages/${activeUserId}`);
                setMessages(response.data.messages || []);
                response.data.messages?.forEach((message) => {
                    if (message.recipient?._id === currentUserId && message.status !== "read") {
                        socketRef.current?.emit("message:read", { messageId: message._id });
                    }
                });
            } catch (error) {
                console.error("Conversation error:", error);
            } finally {
                setLoading(false);
            }
        };
        loadConversation();
    }, [activeUserId, currentUserId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = (event) => {
        event.preventDefault();
        if (!text.trim() || !activeUser || !socketRef.current?.connected) return;
        socketRef.current.emit(
            "message:send",
            { recipientId: activeUser._id, text },
            (result) => {
                if (result?.ok) setText("");
            }
        );
    };

    const formatMessageTime = (timestamp) => {
        if (!timestamp) return "";
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return "";
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const formatMessageDate = (timestamp) => {
        if (!timestamp) return "";
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return "";

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const isSameDay = (first, second) =>
            first.getFullYear() === second.getFullYear() &&
            first.getMonth() === second.getMonth() &&
            first.getDate() === second.getDate();
        const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

        if (isSameDay(date, today)) return `Today ${time}`;
        if (isSameDay(date, yesterday)) return `Yesterday ${time}`;

        return `${date.toLocaleDateString([], { weekday: "short", day: "numeric" })} ${time}`;
    };

    return (
        <section className={`messaging-hub ${open ? "is-open" : ""} ${open && activeUser ? "has-chat" : ""}`} aria-label="Messages">
            <div className="following-strip">
                <div className="following-strip-heading">
                    <span>MESSAGES</span>
                    <button type="button" onClick={onClose} aria-label="Close messages">X</button>
                </div>
                <div className="following-users">
                    {following.length === 0 ? (
                        <span className="following-empty">Follow developers to start a conversation.</span>
                    ) : following.map((user) => {
                        const unreadCount = unreadCounts[user._id] || 0;
                        return (
                            <button
                                type="button"
                                className={`following-user ${activeUser?._id === user._id ? "selected" : ""}`}
                                key={user._id}
                                onClick={() => setActiveUser(user)}
                                style={{ position: "relative" }}
                            >
                                <div style={{ position: "relative", display: "inline-block" }}>
                                    <UserAvatar user={user} className="following-avatar" />
                                    {unreadCount > 0 && (
                                        <span 
                                            className="unread-badge"
                                            style={{
                                                position: "absolute",
                                                top: "-2px",
                                                right: "-2px",
                                                background: "#ff007f",
                                                color: "#fff",
                                                borderRadius: "50%",
                                                padding: "2px 6px",
                                                fontSize: "0.65rem",
                                                fontWeight: "bold",
                                                minWidth: "16px",
                                                textAlign: "center",
                                                boxShadow: "0 2px 4px rgba(0,0,0,0.3)"
                                            }}
                                        >
                                            {unreadCount > 9 ? "9+" : unreadCount}
                                        </span>
                                    )}
                                </div>
                                <span>{user.name || user.username}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <aside className="chat-drawer" aria-hidden={!activeUser}>
                <div className="chat-header">
                    {activeUser && <UserAvatar user={activeUser} className="chat-avatar" />}
                    <div className="chat-header-copy">
                        <strong>{activeUser?.name || "Select a developer"}</strong>
                        <span>@{activeUser?.username || "direct messages"}</span>
                    </div>
                    <button type="button" className="chat-close" onClick={() => setActiveUser(null)} aria-label="Close chat">X</button>
                </div>

                <div className="chat-history">
                    {!activeUser ? (
                        <div className="chat-placeholder">Choose a developer to open a direct thread.</div>
                    ) : loading ? (
                        <div className="chat-placeholder">Loading thread...</div>
                    ) : messages.length === 0 ? (
                        <div className="chat-placeholder">No messages yet. Start the conversation.</div>
                    ) : messages.map((message, index) => {
                        const previousMessage = messages[index - 1];
                        const messageTimestamp = message.createdAt || message.timestamp;
                        const previousTimestamp = previousMessage?.createdAt || previousMessage?.timestamp;
                        const messageDate = new Date(messageTimestamp);
                        const previousDate = new Date(previousTimestamp);
                        const isDifferentDay = index === 0 ||
                            messageDate.toDateString() !== previousDate.toDateString();
                        const hasSignificantGap = index > 0 &&
                            messageDate.getTime() - previousDate.getTime() >= 30 * 60 * 1000;
                        const showDateSeparator = isDifferentDay || hasSignificantGap;
                        const mine = (message.sender?._id || message.sender) === currentUser?._id;
                        const messageTime = formatMessageTime(message.createdAt || message.timestamp);
                        return (
                            <Fragment key={message._id || index}>
                                {showDateSeparator && (
                                    <div
                                        className="message-date-separator"
                                        style={{ textAlign: "center", fontSize: "0.7rem", opacity: 0.6, margin: "0.75rem 0", width: "100%" }}
                                    >
                                        {formatMessageDate(messageTimestamp)}
                                    </div>
                                )}
                                <div className={`chat-message ${mine ? "mine" : "theirs"}`}>
                                    {message.sharedPost ? (
                                        <button
                                            type="button"
                                            className="shared-post-preview"
                                            onClick={() => setExpandedSharedPost(message.sharedPost)}
                                        >
                                            <span className="shared-post-media">
                                                {message.sharedPost.type === "video" ? (
                                                    <video src={message.sharedPost.mediaUrl} poster={message.sharedPost.thumbnailUrl || undefined} muted playsInline preload="metadata" />
                                                ) : (
                                                    <img src={message.sharedPost.thumbnailUrl || message.sharedPost.mediaUrl} alt={message.sharedPost.caption || "Shared post"} />
                                                )}
                                            </span>
                                            <span className="shared-post-copy">
                                                <strong>@{message.sharedPost.author?.username || "devspace"}</strong>
                                                <span>{message.sharedPost.caption || "Shared a post with you"}</span>
                                            </span>
                                        </button>
                                    ) : (
                                        <div className="message-bubble-content">
                                            <span>{message.text}</span>
                                        </div>
                                    )}
                                    <div className="message-meta">
                                        {messageTime && <span className="message-time">{messageTime}</span>}
                                        {mine && <small className="message-status">{message.status}</small>}
                                    </div>
                                </div>
                            </Fragment>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                <form className="chat-form" onSubmit={handleSend}>
                    <input
                        value={text}
                        onChange={(event) => setText(event.target.value)}
                        placeholder={socketConnected ? "Write a message..." : "Connecting..."}
                        maxLength={2000}
                        disabled={!activeUser || !socketConnected}
                    />
                    <button type="submit" disabled={!text.trim() || !activeUser || !socketConnected}>Send</button>
                </form>
            </aside>

            {expandedSharedPost && (
                <div className="shared-post-lightbox" role="dialog" aria-modal="true" aria-label="Shared post preview">
                    <button type="button" className="shared-post-lightbox-backdrop" onClick={() => setExpandedSharedPost(null)} aria-label="Close shared post" />
                    <div className="shared-post-lightbox-content">
                        <button type="button" className="shared-post-lightbox-close" onClick={() => setExpandedSharedPost(null)} aria-label="Close shared post">×</button>
                        <div className="shared-post-expanded-media">
                            {expandedSharedPost.type === "video" ? (
                                <video src={expandedSharedPost.mediaUrl} poster={expandedSharedPost.thumbnailUrl || undefined} controls playsInline />
                            ) : (
                                <img src={expandedSharedPost.mediaUrl || expandedSharedPost.thumbnailUrl} alt={expandedSharedPost.caption || "Shared post"} />
                            )}
                        </div>
                        <div className="shared-post-expanded-copy">
                            <strong>@{expandedSharedPost.author?.username || "devspace"}</strong>
                            <p>{expandedSharedPost.caption}</p>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

export default MessagingHub;