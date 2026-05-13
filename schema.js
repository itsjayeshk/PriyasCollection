const Joi = require("joi");
const { PRODUCT_CATEGORIES } = require("./utils/productCategories.js");

const productPayloadSchema = Joi.object({
    title: Joi.string().trim().required(),
    image: Joi.any().optional(),
    price: Joi.number().min(1).required(),
    category: Joi.string()
        .valid(...PRODUCT_CATEGORIES)
        .required(),
});

const productSchema = Joi.object({
    product: productPayloadSchema,
    listing: productPayloadSchema,
})
    .xor("product", "listing")
    .required();

module.exports.productSchema = productSchema;
module.exports.listingSchema = productSchema;

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(1).max(5),
        comment: Joi.string().trim().required(),
    }).required(),
});
