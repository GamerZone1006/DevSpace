import { useEffect, useRef, useState } from "react";
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

            if (isIncoming && !belongsToActiveConversation) {
                onUnreadChange?.((count) => count + 1);
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
                    ) : following.map((user) => (
                        <button
                            type="button"
                            className={`following-user ${activeUser?._id === user._id ? "selected" : ""}`}
                            key={user._id}
                            onClick={() => setActiveUser(user)}
                        >
                            <UserAvatar user={user} className="following-avatar" />
                            <span>{user.name || user.username}</span>
                        </button>
                    ))}
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
                    ) : messages.map((message) => {
                        const mine = (message.sender?._id || message.sender) === currentUser?._id;
                        const messageTime = formatMessageTime(message.createdAt || message.timestamp);
                        return (
                            <div className={`chat-message ${mine ? "mine" : "theirs"}`} key={message._id}>
                                <div className="message-bubble-content">
                                    <span>{message.text}</span>
                                </div>
                                <div className="message-meta">
                                    {messageTime && <span className="message-time">{messageTime}</span>}
                                    {mine && <small className="message-status">{message.status}</small>}
                                </div>
                            </div>
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
        </section>
    );
}

export default MessagingHub;