const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const publicUser = (user) => ({
    id: user._id,
    _id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    profilePicture: user.profilePicture,
    bio: user.bio,
    skills: user.skills,
    interests: user.interests,
    interestScores: Object.fromEntries(user.interestScores || [])
});

const register = async (req, res) => {
    try {
        const {
            name,
            username,
            email,
            password,
            interests
        } = req.body;

        if (!name || !username || !email || !password) {
            return res.status(400).json({
                message: "Name, username, email and password are required"
            });
        }

        if (!interests || !Array.isArray(interests) || interests.length === 0) {
            return res.status(400).json({
                message: "Please select at least one interest"
            });
        }

        const normalizedInterests = interests.map((interest) =>
            interest.trim().toLowerCase()
        );

        const existingUser = await User.findOne({
            $or: [
                { email: email.toLowerCase() },
                { username: username.toLowerCase() }
            ]
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Username or email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            password: hashedPassword,
            interests: normalizedInterests,
            skills: normalizedInterests,
            interestScores: new Map(
                normalizedInterests.map((interest) => [interest, 0.5])
            )
        });

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(201).json({
            message: "Registration successful",
            token,
            user: publicUser(user)
        });
    } catch (error) {
        console.error("Register error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase()
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: publicUser(user)
        });
    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    register,
    login
};
