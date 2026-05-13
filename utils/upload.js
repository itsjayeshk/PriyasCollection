const crypto = require("crypto");
const path = require("path");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const ExpressError = require("./ExpressError.js");
const { cloudinary, hasCloudinaryConfig } = require("./cloudinary.js");

const PRODUCT_IMAGES_FOLDER = "priyas-collection/products";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const allowedMimeTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
]);

const fileFilter = (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const isAllowedFile =
        allowedExtensions.has(extension) && allowedMimeTypes.has(file.mimetype);

    if (!isAllowedFile) {
        return cb(
            new ExpressError(
                400,
                "Only JPG, JPEG, PNG, and WEBP image uploads are allowed."
            )
        );
    }

    if (!hasCloudinaryConfig()) {
        return cb(
            new ExpressError(
                500,
                "Cloudinary is not configured. Set CLOUD_NAME, CLOUD_API_KEY, and CLOUD_API_SECRET."
            )
        );
    }

    return cb(null, true);
};

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: PRODUCT_IMAGES_FOLDER,
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        resource_type: "image",
        public_id: () =>
            `${Date.now()}-${crypto.randomBytes(16).toString("hex")}`,
    },
});

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_IMAGE_SIZE,
    },
});

module.exports = {
    PRODUCT_IMAGES_FOLDER,
    LISTINGS_FOLDER: PRODUCT_IMAGES_FOLDER,
    storage,
    upload,
    productImageUpload: upload.single("image"),
    uploadListingImage: upload.single("image"),
};
