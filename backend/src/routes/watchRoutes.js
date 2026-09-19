const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
    trackWatch
} = require("../controllers/watchController");

const router = express.Router();

router.post(
    "/:postId",
    protect,
    trackWatch
);

module.exports = router;