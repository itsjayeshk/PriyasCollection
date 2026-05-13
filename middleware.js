const { productSchema, reviewSchema } = require("./schema.js");
const Review = require("./models/review.js");
const ExpressError = require("./utils/ExpressError.js");

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.flash("error", "You must be signed in first!");
        return res.redirect("/users/login");
    }

    next();
};

module.exports.validateProduct = (req, res, next) => {
    const { error } = productSchema.validate(req.body);

    if (error) {
        const msg = error.details.map((el) => el.message).join(", ");
        throw new ExpressError(400, msg);
    }

    next();
};

module.exports.validateListing = module.exports.validateProduct;

module.exports.validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);

    if (error) {
        const msg = error.details.map((el) => el.message).join(", ");
        throw new ExpressError(400, msg);
    }

    next();
};

module.exports.isReviewAuthor = async (req, res, next) => {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);

    if (!review) {
        req.flash("error", "Review not found!");
        return res.redirect(`/listings/${id}`);
    }

    if (!review.author || !review.author.equals(req.user._id)) {
        req.flash("error", "You are not allowed to delete this review.");
        return res.redirect(`/listings/${id}`);
    }

    next();
};
