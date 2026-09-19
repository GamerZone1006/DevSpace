const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
    addComment,
    getComments,
    deleteComment
} = require("../controllers/commentController");

const router = express.Router();


// Add comment
router.post(
    "/:postId",
    protect,
    addComment
);


// Get comments
router.get(
    "/:postId",
    protect,
    getComments
);


// Delete comment
router.delete(
    "/:commentId",
    protect,
    deleteComment
);


module.exports = router;