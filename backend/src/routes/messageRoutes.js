const express = require("express");
const protect = require("../middleware/authMiddleware");
const { getFollowing, getConversation } = require("../controllers/messageController");

const router = express.Router();

router.get("/following", protect, getFollowing);
router.get("/:userId", protect, getConversation);

module.exports = router;