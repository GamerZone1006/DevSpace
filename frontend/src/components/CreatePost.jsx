import { useState, useRef, useEffect } from "react";
import api from "../services/api";

const VideoPreview = ({ src }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        video.play().catch((err) => {
                            console.log('Autoplay prevented:', err);
                        });
                    } else {
                        video.pause();
                    }
                });
            },
            { threshold: 0.6 }
        );

        observer.observe(video);

        return () => {
            observer.disconnect();
            video.pause();
        };
    }, []);

    return (
        <video
            ref={videoRef}
            src={src}
            controls
            playsInline
            preload="metadata"
        />
    );
};

const MAX_FILES = 10;

function CreatePost({ onPostCreated }) {
    const [files, setFiles] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);
    const [caption, setCaption] = useState("");
    const [technologyTags, setTechnologyTags] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [guidelinesOpen, setGuidelinesOpen] = useState(false);
    const [guidelinesAcknowledged, setGuidelinesAcknowledged] = useState(false);
    const fileInputRef = useRef(null);

    const openCreationGuidelines = () => {
        if (!guidelinesAcknowledged) setGuidelinesOpen(true);
    };

    const continueToEditor = () => {
        setGuidelinesAcknowledged(true);
        setGuidelinesOpen(false);
        window.requestAnimationFrame(() => {
            fileInputRef.current?.click();
        });
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (!selectedFiles.length) return;
        if (selectedFiles.length > MAX_FILES) {
            setError(`You can select a maximum of ${MAX_FILES} images.`);
            e.target.value = "";
            return;
        }

        const hasVideo = selectedFiles.some((selectedFile) => selectedFile.type.startsWith("video/"));
        if (hasVideo && selectedFiles.length > 1) {
            setError("Videos must be uploaded individually.");
            e.target.value = "";
            return;
        }

        setFiles(selectedFiles);
        setPreviewUrls(selectedFiles.map((selectedFile) => URL.createObjectURL(selectedFile)));
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!files.length) {
            setError("Please select an image or video.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const formData = new FormData();
            files.forEach((selectedFile) => formData.append("media", selectedFile));
            formData.append("caption", caption);
            formData.append("technologyTags", technologyTags);
            formData.append(
                "type",
                files[0].type.startsWith("video/") ? "video" : "image"
            );

            const response = await api.post("/posts", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            // Reset state
            setFiles([]);
            setPreviewUrls([]);
            setCaption("");
            setTechnologyTags("");
            setGuidelinesAcknowledged(false);
            if (fileInputRef.current) fileInputRef.current.value = "";

            if (onPostCreated) {
                onPostCreated(response.data.post);
            }
        } catch (error) {
            setError(
                error.response?.data?.message || "Failed to create post."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="insta-create-card">
            {guidelinesOpen && (
                <div
                    className="post-guidelines-backdrop"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) setGuidelinesOpen(false);
                    }}
                >
                    <section
                        className="post-guidelines-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="post-guidelines-title"
                    >
                        <span className="post-guidelines-eyebrow">COMMUNITY GUIDELINES</span>
                        <h2 id="post-guidelines-title">Share thoughtfully</h2>
                        <p>
                            No inappropriate posts are allowed. If more than 80% of users who view the post report it, it will be automatically removed.
                        </p>
                        <div className="post-guidelines-actions">
                            <button type="button" className="post-guidelines-cancel" onClick={() => setGuidelinesOpen(false)}>
                                Cancel
                            </button>
                            <button type="button" className="post-guidelines-continue" onClick={continueToEditor}>
                                Continue
                            </button>
                        </div>
                    </section>
                </div>
            )}
            {/* Minimal Header */}
            <div className="insta-header">
                <h3>Create new post</h3>
                <button 
                    type="submit" 
                    form="create-post-form" 
                    className="insta-share-btn"
                    disabled={loading || !files.length}
                >
                    {loading ? "Sharing..." : "Share"}
                </button>
            </div>

            {error && <div className="insta-error">{error}</div>}

            <form id="create-post-form" onSubmit={handleSubmit} className="insta-form-body">
                <div className="insta-form-row">
                    {/* Media Upload / Preview Section (Left) */}
                    <div 
                        className={`insta-media-dropzone ${previewUrls.length ? "has-media" : ""}`}
                        onClick={() => !previewUrls.length && openCreationGuidelines()}
                    >
                        {previewUrls.length ? (
                            <div className="insta-preview-container">
                                <div className="insta-preview-grid">
                                    {previewUrls.map((previewUrl, index) => (
                                        files[index]?.type.startsWith("video/") ? (
                                            <VideoPreview key={previewUrl} src={previewUrl} />
                                        ) : (
                                            <img key={previewUrl} src={previewUrl} alt={`Upload preview ${index + 1}`} />
                                        )
                                    ))}
                                </div>
                                <span className="insta-preview-count">
                                    {files.length} {files.length === 1 ? (files[0]?.type.startsWith("video/") ? "video" : "image") : "items"} selected
                                </span>
                                <button 
                                    type="button" 
                                    className="insta-change-media"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        fileInputRef.current.click();
                                    }}
                                >
                                    Change
                                </button>
                            </div>
                        ) : (
                            <div className="insta-placeholder-content">
                                <div className="insta-plus-circle">
                                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <span className="insta-subtext">Add post/reels</span>
                            </div>
                        )}
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            onClick={(event) => event.stopPropagation()}
                            onChange={handleFileChange}
                            multiple={true}
                            accept="image/*,video/*" 
                            style={{ display: "none" }} 
                        />
                    </div>

                    {/* Details Section (Right: Captions & Tags) */}
                    <div className="insta-details-section">
                        <textarea
                            placeholder="Write a caption..."
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            rows="3"
                            maxLength="2200"
                        />

                        <div className="insta-tags-wrapper">
                            <span className="tag-symbol">#</span>
                            <input
                                type="text"
                                placeholder="Add tags (react, nodejs, mongodb)"
                                value={technologyTags}
                                onChange={(e) => setTechnologyTags(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default CreatePost;