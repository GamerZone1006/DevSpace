const User = require("../models/User");

const BADGE_CRITERIA = {
    FIRST_POST: { id: "first-post", name: "First Steps", description: "Created your first post", icon: "🚀" },
    POSTER_5: { id: "poster-5", name: "Content Creator", description: "Created 5 posts", icon: "✨" },
    POSTER_10: { id: "poster-10", name: "Prolific Poster", description: "Created 10 posts", icon: "🌟" },
    POSTER_25: { id: "poster-25", name: "Post Master", description: "Created 25 posts", icon: "🏆" },
    FOLLOWER_10: { id: "follower-10", name: "Rising Star", description: "Reached 10 followers", icon: "⭐" },
    FOLLOWER_50: { id: "follower-50", name: "Community Leader", description: "Reached 50 followers", icon: "👑" },
    FOLLOWER_100: { id: "follower-100", name: "Influencer", description: "Reached 100 followers", icon: "💎" },
    EARLY_ADOPTER: { id: "early-adopter", name: "Early Adopter", description: "Joined in the first month", icon: "🎯" },
    TECH_SAVVY: { id: "tech-savvy", name: "Tech Savvy", description: "Added 5+ tech interests", icon: "💻" },
    SOCIAL_BUTTERFLY: { id: "social-butterfly", name: "Social Butterfly", description: "Following 20+ users", icon: "🦋" }
};

const checkAndAwardBadges = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) return [];

        const newBadges = [];
        const currentBadges = user.badges || [];

        // Check post-based badges
        if (user.stats?.postsCount >= 1 && !currentBadges.includes("first-post")) {
            newBadges.push(BADGE_CRITERIA.FIRST_POST);
        }
        if (user.stats?.postsCount >= 5 && !currentBadges.includes("poster-5")) {
            newBadges.push(BADGE_CRITERIA.POSTER_5);
        }
        if (user.stats?.postsCount >= 10 && !currentBadges.includes("poster-10")) {
            newBadges.push(BADGE_CRITERIA.POSTER_10);
        }
        if (user.stats?.postsCount >= 25 && !currentBadges.includes("poster-25")) {
            newBadges.push(BADGE_CRITERIA.POSTER_25);
        }

        // Check follower-based badges
        if (user.stats?.followersCount >= 10 && !currentBadges.includes("follower-10")) {
            newBadges.push(BADGE_CRITERIA.FOLLOWER_10);
        }
        if (user.stats?.followersCount >= 50 && !currentBadges.includes("follower-50")) {
            newBadges.push(BADGE_CRITERIA.FOLLOWER_50);
        }
        if (user.stats?.followersCount >= 100 && !currentBadges.includes("follower-100")) {
            newBadges.push(BADGE_CRITERIA.FOLLOWER_100);
        }

        // Check interest-based badges
        if (user.interests?.length >= 5 && !currentBadges.includes("tech-savvy")) {
            newBadges.push(BADGE_CRITERIA.TECH_SAVVY);
        }

        // Check following-based badges
        if (user.following?.length >= 20 && !currentBadges.includes("social-butterfly")) {
            newBadges.push(BADGE_CRITERIA.SOCIAL_BUTTERFLY);
        }

        // Check early adopter badge (account created within 30 days of launch)
        const launchDate = new Date("2024-01-01"); // Adjust this to your actual launch date
        const userCreatedDate = new Date(user.createdAt);
        const daysSinceLaunch = Math.floor((userCreatedDate - launchDate) / (1000 * 60 * 60 * 24));
        if (daysSinceLaunch <= 30 && !currentBadges.includes("early-adopter")) {
            newBadges.push(BADGE_CRITERIA.EARLY_ADOPTER);
        }

        // Award new badges
        if (newBadges.length > 0) {
            const badgeIds = newBadges.map(badge => badge.id);
            await User.findByIdAndUpdate(userId, {
                $push: { badges: { $each: badgeIds } }
            });
        }

        return newBadges;
    } catch (error) {
        console.error("Badge awarding error:", error);
        return [];
    }
};

const getAllBadges = () => {
    return Object.values(BADGE_CRITERIA);
};

module.exports = {
    checkAndAwardBadges,
    getAllBadges,
    BADGE_CRITERIA
};