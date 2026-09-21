const express = require("express");
const protect = require("../middleware/authMiddleware");
const { getFollowing, getShareUsers, getConversation, sharePostToUser } = require("../controllers/messageController");

const router = express.Router();

router.get("/following", protect, getFollowing);
router.get("/users", protect, getShareUsers);
router.post("/:userId/share", protect, sharePostToUser);
router.get("/:userId", protect, getConversation);

module.exports = router;