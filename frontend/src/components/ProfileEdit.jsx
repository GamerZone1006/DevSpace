import { useState } from "react";
import api from "../services/api";

function ProfileEdit({ profile, onSave, onCancel }) {
    const [bio, setBio] = useState(profile.bio || "");
    const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedinUrl || "");
    const [githubUrl, setGithubUrl] = useState(profile.githubUrl || "");
    const [interests, setInterests] = useState(profile.interests?.join(", ") || "");
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(profile.profilePicture || "");
    const [cropSource, setCropSource] = useState("");
    const [cropImage, setCropImage] = useState(null);
    const [cropZoom, setCropZoom] = useState(1);
    const [cropX, setCropX] = useState(0);
    const [cropY, setCropY] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const interestsArray = interests
                .split(",")
                .map((item) => item.trim().toLowerCase())
                .filter(Boolean);

            let response = await api.put("/users/me", {
                bio,
                linkedinUrl,
                githubUrl,
                interests: interestsArray
            });

            if (avatarFile) {
                const formData = new FormData();
                formData.append("profilePicture", avatarFile);
                response = await api.post("/users/me/profile-picture", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
            }

            onSave(response.data.user);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const source = URL.createObjectURL(file);
        const image = new Image();
        image.onload = () => {
            setCropImage(image);
            setCropSource(source);
            setCropZoom(1);
            setCropX(0);
            setCropY(0);
        };
        image.src = source;
    };

    const confirmCrop = () => {
        if (!cropImage) return;

        const canvas = document.createElement("canvas");
        const size = 512;
        const baseScale = Math.max(size / cropImage.naturalWidth, size / cropImage.naturalHeight);
        const scale = baseScale * cropZoom;
        const width = cropImage.naturalWidth * scale;
        const height = cropImage.naturalHeight * scale;
        const context = canvas.getContext("2d");
        canvas.width = size;
        canvas.height = size;
        context.drawImage(cropImage, (size - width) / 2 + cropX * 2, (size - height) / 2 + cropY * 2, width, height);

        canvas.toBlob((blob) => {
            if (!blob) return;
            const croppedFile = new File([blob], "profile-picture.jpg", { type: "image/jpeg" });
            const preview = URL.createObjectURL(blob);
            setAvatarFile(croppedFile);
            setAvatarPreview(preview);
            setCropSource("");
            setCropImage(null);
        }, "image/jpeg", 0.9);
    };

    return (
        <div className="profile-edit">
            <h3>Edit Profile</h3>
            <form onSubmit={handleSubmit}>
                <div className="form-group profile-picture-upload">
                    <label htmlFor="profile-picture">Profile picture</label>
                    <div className="profile-picture-preview">
                        {avatarPreview ? <img src={avatarPreview} alt="Profile preview" /> : <span>+</span>}
                    </div>
                    <input
                        id="profile-picture"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleAvatarChange}
                    />
                </div>
                <div className="form-group">
                    <label>Bio</label>
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows="3"
                        maxLength="500"
                        placeholder="Tell us about yourself..."
                    />
                </div>

                <div className="form-group">
                    <label>LinkedIn URL</label>
                    <input
                        type="url"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        placeholder="https://linkedin.com/in/yourusername"
                    />
                </div>

                <div className="form-group">
                    <label>GitHub URL</label>
                    <input
                        type="url"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/yourusername"
                    />
                </div>

                <div className="form-group">
                    <label>Learning Preferences (comma-separated)</label>
                    <input
                        type="text"
                        value={interests}
                        onChange={(e) => setInterests(e.target.value)}
                        placeholder="react, nodejs, python, machine learning"
                    />
                    <small>These will be used to personalize your "For You" feed</small>
                </div>

                {error && <div className="edit-error">{error}</div>}

                <div className="form-actions">
                    <button type="button" onClick={onCancel} disabled={loading}>
                        Cancel
                    </button>
                    <button type="submit" disabled={loading}>
                        {loading ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </form>

            {cropSource && cropImage && (
                <div className="avatar-crop-overlay" role="dialog" aria-modal="true" aria-label="Crop profile picture">
                    <div className="avatar-crop-modal">
                        <div className="avatar-crop-header">
                            <div>
                                <span className="crop-eyebrow">AVATAR FRAME</span>
                                <h4>Adjust your profile picture</h4>
                            </div>
                            <button type="button" onClick={() => setCropSource("")} aria-label="Close crop dialog">X</button>
                        </div>
                        <div className="avatar-crop-frame">
                            <img
                                src={cropSource}
                                alt="Crop preview"
                                style={{
                                    width: `${Math.max(100, (cropImage.naturalWidth / cropImage.naturalHeight) * 100 * cropZoom)}%`,
                                    height: `${Math.max(100, (cropImage.naturalHeight / cropImage.naturalWidth) * 100 * cropZoom)}%`,
                                    transform: `translate(${cropX}px, ${cropY}px)`
                                }}
                            />
                        </div>
                        <label className="crop-control">
                            Zoom
                            <input type="range" min="1" max="3" step="0.01" value={cropZoom} onChange={(event) => setCropZoom(Number(event.target.value))} />
                        </label>
                        <label className="crop-control">
                            Horizontal position
                            <input type="range" min="-100" max="100" value={cropX} onChange={(event) => setCropX(Number(event.target.value))} />
                        </label>
                        <label className="crop-control">
                            Vertical position
                            <input type="range" min="-100" max="100" value={cropY} onChange={(event) => setCropY(Number(event.target.value))} />
                        </label>
                        <div className="avatar-crop-actions">
                            <button type="button" onClick={() => setCropSource("")}>Cancel</button>
                            <button type="button" onClick={confirmCrop}>Use this picture</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProfileEdit;