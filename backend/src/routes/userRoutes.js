const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const protect = require("../middleware/authMiddleware");
const { getProfile, getOwnProfile, updateProfile, getConnections } = require("../controllers/userController");

const router = express.Router();
const storage = new CloudinaryStorage({
	cloudinary,
	params: {
		folder: "devspace/profiles",
		allowed_formats: ["jpg", "jpeg", "png", "webp"]
	}
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get("/me", protect, getOwnProfile);
router.get("/:userId/connections", protect, getConnections);
router.get("/:userId", protect, getProfile);
router.put("/me", protect, updateProfile);
router.post("/me/profile-picture", protect, upload.single("profilePicture"), updateProfile);

module.exports = router;
