const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
    toggleSave,
    sharePost
} = require("../controllers/engagementController");

const router = express.Router();

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