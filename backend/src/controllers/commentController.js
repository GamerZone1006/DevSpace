const Comment = require("../models/Comment");
const Post = require("../models/Post");


// ADD COMMENT
const addComment = async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text || !text.trim()) {
            return res.status(400).json({
                message: "Comment cannot be empty"
            });
        }

        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        const comment = await Comment.create({
            post: post._id,
            user: req.userId,
            text: text.trim()
        });

        await Post.findByIdAndUpdate(
            post._id,
            {
                $inc: {
                    commentsCount: 1
                }
            }
        );

        const populatedComment = await Comment.findById(
            comment._id
        ).populate(
            "user",
            "name username profilePicture"
        );

        res.status(201).json({
            message: "Comment added",
            comment: populatedComment
        });

    } catch (error) {
        console.error("Add comment error:", error);

        res.status(500).json({
            message: "Failed to add comment"
        });
    }
};


// GET COMMENTS
const getComments = async (req, res) => {
    try {
        const comments = await Comment.find({
            post: req.params.postId
        })
            .populate(
                "user",
                "name username profilePicture"
            )
            .sort({ createdAt: -1 });

        res.status(200).json({
            comments
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to get comments"
        });
    }
};


// DELETE COMMENT
const deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(
            req.params.commentId
        );

        if (!comment) {
            return res.status(404).json({
                message: "Comment not found"
            });
        }

        if (comment.user.toString() !== req.userId) {
            return res.status(403).json({
                message: "You can only delete your own comments"
            });
        }

        await Comment.findByIdAndDelete(comment._id);

        await Post.findByIdAndUpdate(
            comment.post,
            {
                $inc: {
                    commentsCount: -1
                }
            }
        );

        res.status(200).json({
            message: "Comment deleted"
        });

    } catch (error) {
        console.error("Delete comment error:", error);

        res.status(500).json({
            message: "Failed to delete comment"
        });
    }
};


module.exports = {
    addComment,
    getComments,
    deleteComment
};