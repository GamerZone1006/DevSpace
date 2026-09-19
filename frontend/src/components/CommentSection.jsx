import { useEffect, useState } from "react";
import api from "../services/api";

function CommentSection({ postId, open, onClose }) {
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

        fetchComments();
    }, [postId]);

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
                    comments.map((comment) => (
                        <div
                            className="comment"
                            key={comment._id}
                        >
                            <strong>@{comment.user?.username || "developer"}</strong>

                            <span>
                                {comment.text}
                            </span>
                        </div>
                    ))
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