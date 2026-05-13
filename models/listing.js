const mongoose = require("mongoose");
const { PRODUCT_CATEGORIES } = require("../utils/productCategories.js");

const Schema = mongoose.Schema;

const DEFAULT_PRODUCT_IMAGE = {
    filename: "default-product-image",
    url: "/images/logo.png",
};

const productSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },

        image: {
            filename: {
                type: String,
                trim: true,
                default: DEFAULT_PRODUCT_IMAGE.filename,
            },

            url: {
                type: String,
                trim: true,
                default: DEFAULT_PRODUCT_IMAGE.url,
            },
        },

        price: {
            type: Number,
            required: true,
            min: 1,
        },

        category: {
            type: String,
            enum: PRODUCT_CATEGORIES,
            required: true,
        },

        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        reviews: [
            {
                type: Schema.Types.ObjectId,
                ref: "Review",
            },
        ],
    },
    {
        strict: true,
    }
);

const Product = mongoose.model("Listing", productSchema);

module.exports = Product;
