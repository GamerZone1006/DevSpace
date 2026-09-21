const express = require("express");
const multer = require("multer");
const {
    CloudinaryStorage
} = require("multer-storage-cloudinary");

const cloudinary = require("../config/cloudinary");

const protect = require("../middleware/authMiddleware");

const {
    createPost,
    getPost,
    getAllPosts,
    deletePost,
    toggleLike,
    trackView,
    reportPost
} = require("../controllers/postController");

const router = express.Router();
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,

    params: async (req, file) => {
        const isVideo = file.mimetype.startsWith("video/");

        return {
            folder: "devspace/posts",

            resource_type: isVideo
                ? "video"
                : "image",

            allowed_formats: [
                "jpg",
                "jpeg",
                "png",
                "webp",
                "mp4",
                "mov",
                "webm"
            ]
        };
    }
});


const upload = multer({
    storage,

    limits: {
        fileSize: 100 * 1024 * 1024
    }
});


// Create post
router.post(
    "/",
    protect,
    upload.array("media", 10),
    createPost
);


// Get all posts
router.get(
    "/",
    protect,
    getAllPosts
);


// Get single post
router.get(
    "/:id",
    protect,
    getPost
);


// Delete post
router.delete(
    "/:id",
    protect,
    deletePost
);


// Like / unlike
router.post(
    "/:id/like",
    protect,
    toggleLike
);

router.post(
    "/:id/view",
    protect,
    trackView
);

router.post(
    "/:id/report",
    protect,
    reportPost
);


module.exports = router;