const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
    getFollowingFeed,
    getForYouFeed
} = require("../controllers/feedController");

const router = express.Router();


// Following feed
router.get(
    "/following",
    protect,
    getFollowingFeed
);


// For You feed
router.get(
    "/for-you",
    protect,
    getForYouFeed
);


module.exports = router;