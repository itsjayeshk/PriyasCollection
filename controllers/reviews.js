const Product = require("../models/listing.js");
const Review = require("../models/review.js");
const ExpressError = require("../utils/ExpressError.js");

module.exports.createReview = async (req, res) => {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
        throw new ExpressError(404, "Product not found");
    }

    const newReview = new Review(req.body.review);
    newReview.author = req.user._id;

    product.reviews.push(newReview);

    await newReview.save();
    await product.save();

    req.flash("success", "Review added successfully!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyReview = async (req, res) => {
    const { id, reviewId } = req.params;

    await Product.findByIdAndUpdate(id, {
        $pull: { reviews: reviewId },
    });

    await Review.findByIdAndDelete(reviewId);

    req.flash("success", "Review deleted successfully!");
    res.redirect(`/listings/${id}`);
};
