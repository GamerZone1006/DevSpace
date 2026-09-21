const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
    toggleSave,
    sharePost,
    getSavedPosts
} = require("../controllers/engagementController");

const router = express.Router();

router.get(
    "/saved",
    protect,
    getSavedPosts
);

router.post(
    "/save/:postId",
    protect,
    toggleSave
);

router.post(
    "/share/:postId",
    protect,
    sharePost
);

module.exports = router;