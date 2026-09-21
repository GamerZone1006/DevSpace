const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
    toggleFollow,
    getFollowerNotifications,
    markFollowerNotificationsSeen
} = require("../controllers/followController");

const router = express.Router();

router.get("/notifications", protect, getFollowerNotifications);
router.post("/notifications/seen", protect, markFollowerNotificationsSeen);

router.post(
    "/:userId",
    protect,
    toggleFollow
);

module.exports = router;