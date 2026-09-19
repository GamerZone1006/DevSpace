function BadgesSection({ badges }) {
    const BADGE_INFO = {
        "first-post": {
            name: "First Steps",
            description: "Created your first post",
            icon: (
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.5 16.5L19.5 7.5L12 19.5L10.5 13.5L4.5 16.5Z" fill="#FF5722" stroke="#E64A19" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 19.5V13.5" stroke="#E64A19" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )
        },
        "poster-5": {
            name: "Content Creator",
            description: "Created 5 posts",
            icon: (
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#FFC107" stroke="#FFA000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )
        },
        "poster-10": {
            name: "Prolific Poster",
            description: "Created 10 posts",
            icon: (
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L14.39 8.26L21.19 8.63L15.9 12.97L17.76 19.37L12 15.77L6.24 19.37L8.1 12.97L2.81 8.63L9.61 8.26L12 2Z" fill="#FF9800" stroke="#F57C00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )
        },
        "poster-25": {
            name: "Post Master",
            description: "Created 25 posts",
            icon: (
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 9H18V18C18 19.1046 17.1046 20 16 20H8C6.89543 20 6 19.1046 6 18V9Z" fill="#FFD700" stroke="#DAA520" strokeWidth="1.5" />
                    <path d="M4 9H20V11H4V9Z" fill="#FFD700" stroke="#DAA520" strokeWidth="1.5" />
                    <path d="M12 4V7" stroke="#DAA520" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M8 4H16" stroke="#DAA520" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            )
        },
        "follower-10": {
            name: "Rising Star",
            description: "Reached 10 followers",
            icon: (
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#E3F2FD" stroke="#2196F3" strokeWidth="1.5" />
                    <path d="M12 6L13.88 9.8L18.1 10.41L15.05 13.38L15.77 17.58L12 15.58L8.23 17.58L8.95 13.38L5.9 10.41L10.12 9.8L12 6Z" fill="#2196F3" />
                </svg>
            )
        },
        "follower-50": {
            name: "Community Leader",
            description: "Reached 50 followers",
            icon: (
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 18H21V20H3V18Z" fill="#9C27B0" />
                    <path d="M4 16L5 8L12 11L19 8L20 16H4Z" fill="#BA68C8" stroke="#7B1FA2" strokeWidth="1.5" />
                    <circle cx="12" cy="6" r="2" fill="#FFD700" />
                </svg>
            )
        },
        "follower-100": {
            name: "Influencer",
            description: "Reached 100 followers",
            icon: (
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 4H18L22 10L12 20L2 10L6 4Z" fill="#00BCD4" stroke="#00838F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M2 10H22" stroke="#00838F" strokeWidth="1.5" />
                    <path d="M12 20L16 10M12 20L8 10" stroke="#00838F" strokeWidth="1.5" />
                </svg>
            )
        },
        "early-adopter": {
            name: "Early Adopter",
            description: "Joined in the first month",
            icon: (
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="9" fill="#E8F5E9" stroke="#4CAF50" strokeWidth="1.5" />
                    <circle cx="12" cy="12" r="5" fill="#C8E6C9" stroke="#4CAF50" strokeWidth="1.5" />
                    <circle cx="12" cy="12" r="1.5" fill="#2E7D32" />
                </svg>
            )
        },
        "tech-savvy": {
            name: "Tech Savvy",
            description: "Added 5+ tech interests",
            icon: (
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="4" width="20" height="13" rx="2" fill="#37474F" stroke="#263238" strokeWidth="1.5" />
                    <path d="M8 21H16" stroke="#37474F" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M12 17V21" stroke="#37474F" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M7 9L10 12L7 15" stroke="#4CAF50" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M13 15H17" stroke="#4CAF50" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            )
        },
        "social-butterfly": {
            name: "Social Butterfly",
            description: "Following 20+ users",
            icon: (
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 12C9 7 3 8 3 12C3 16 9 17 12 12Z" fill="#E91E63" stroke="#C2185B" strokeWidth="1.5" />
                    <path d="M12 12C15 7 21 8 21 12C21 16 15 17 12 12Z" fill="#F48FB1" stroke="#C2185B" strokeWidth="1.5" />
                    <path d="M12 7V17" stroke="#4A148C" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M10 5L12 7L14 5" stroke="#4A148C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )
        }
    };

    const userBadges = (badges || []).map(badgeId => ({
        id: badgeId,
        ...BADGE_INFO[badgeId]
    })).filter(badge => badge.name);

    if (userBadges.length === 0) {
        return null;
    }

    return (
        <div className="badges-section">
            <h3>Achievements</h3>
            <div className="badges-grid">
                {userBadges.map(badge => (
                    <div key={badge.id} className="badge-item">
                        <div className="badge-icon">{badge.icon}</div>
                        <div className="badge-info">
                            <div className="badge-name">{badge.name}</div>
                            <div className="badge-description">{badge.description}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default BadgesSection;