const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
    toggleFollow
} = require("../controllers/followController");

const router = express.Router();

router.post(
    "/:userId",
    protect,
    toggleFollow
);

module.exports = router;