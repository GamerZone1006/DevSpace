const cloudinary = require("../config/cloudinary");

/*
    Media processing configuration

    Images:
    - Maximum width: 1080px
    - Automatic quality optimization
    - Automatic format selection

    Videos:
    - Maximum width: 1080px
    - Automatic quality optimization
    - MP4 delivery
*/

const optimizeImage = async (publicId) => {
    try {
        const result = cloudinary.url(publicId, {
            secure: true,
            transformation: [
                {
                    width: 1080,
                    height: 1080,
                    crop: "limit"
                },
                {
                    quality: "auto",
                    fetch_format: "auto"
                }
            ]
        });

        return result;
    } catch (error) {
        console.error("Image optimization error:", error);
        throw error;
    }
};


const optimizeVideo = async (publicId) => {
    try {
        const result = cloudinary.url(publicId, {
            resource_type: "video",
            secure: true,
            transformation: [
                {
                    width: 1080,
                    crop: "limit"
                },
                {
                    quality: "auto"
                }
            ],
            format: "mp4"
        });

        return result;
    } catch (error) {
        console.error("Video optimization error:", error);
        throw error;
    }
};


const generateThumbnail = (publicId) => {
    return cloudinary.url(publicId, {
        resource_type: "video",
        secure: true,
        transformation: [
            {
                width: 600,
                height: 600,
                crop: "fill",
                gravity: "auto"
            }
        ],
        format: "jpg"
    });
};


const processMedia = async (type, publicId) => {
    if (type === "image") {
        return {
            optimizedUrl: await optimizeImage(publicId),
            thumbnailUrl: null
        };
    }

    if (type === "video") {
        return {
            optimizedUrl: await optimizeVideo(publicId),
            thumbnailUrl: generateThumbnail(publicId)
        };
    }

    throw new Error("Unsupported media type");
};


module.exports = {
    optimizeImage,
    optimizeVideo,
    generateThumbnail,
    processMedia
};