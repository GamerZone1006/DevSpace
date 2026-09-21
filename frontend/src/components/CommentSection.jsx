import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function CommentSection({ postId, open, onClose, onCommentAdded }) {
    const [comments, setComments] = useState([]);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchComments = async () => {
            try {
                const response = await api.get(`/comments/${postId}`);
                setComments(response.data.comments || []);
            } catch (error) {
                console.error("Comments error:", error);
                setComments([]);
            }
        };

        if (open) {
            fetchComments();
        }
    }, [postId, open]);

    const handleComment = async (e) => {
        e.preventDefault();

        if (!text.trim()) return;

        try {
            setLoading(true);

            const response = await api.post(
                `/comments/${postId}`,
                { text }
            );

            setComments((current) => [
                ...current,
                response.data.comment
            ]);

            setText("");

            // Instantly update the comment count in the parent post component
            if (onCommentAdded) {
                onCommentAdded();
            }
        } catch (error) {
            console.error("Add comment error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <aside className={`comment-section ${open ? "open" : ""}`} aria-label="Comments" aria-hidden={!open}>
            <div className="comment-header">
                <div>
                    <span className="comment-eyebrow">THREAD</span>
                    <h2>Comments</h2>
                </div>
                <button type="button" className="comment-close" onClick={onClose} aria-label="Close comments">
                    X
                </button>
            </div>

            <div className="comments-list">
                {comments.length === 0 ? (
                    <p className="no-comments">No comments yet.</p>
                ) : (
                    comments.map((comment) => {
                        const userId = comment.user?._id || comment.user;
                        const username = comment.user?.username || "developer";
                        
                        const commentDate = comment.createdAt 
                            ? new Date(comment.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) 
                            : "";

                        return (
                            <div
                                className="comment"
                                key={comment._id}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Link 
                                        to={`/profile/${userId}`} 
                                        style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}
                                    >
                                        @{username}
                                    </Link>
                                    {commentDate && (
                                        <span style={{ fontSize: "11px", color: "var(--text-dim)", opacity: 0.8 }}>
                                            {commentDate}
                                        </span>
                                    )}
                                </div>
                                <span>
                                    {comment.text}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>

            <form
                className="comment-form"
                onSubmit={handleComment}
            >
                <input
                    type="text"
                    placeholder="Add to the thread..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    maxLength={500}
                />

                <button
                    type="submit"
                    disabled={loading}
                >
                    {loading ? "..." : "Post"}
                </button>
            </form>
        </aside>
    );
}

export default CommentSection;