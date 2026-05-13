const Product = require("../models/listing.js");
const Review = require("../models/review.js");
const ExpressError = require("../utils/ExpressError.js");
const { cloudinary } = require("../utils/cloudinary.js");
const { PRODUCT_CATEGORIES } = require("../utils/productCategories.js");

const DEFAULT_PRODUCT_IMAGE = {
    filename: "default-product-image",
    url: "/images/logo.png",
};

const LEGACY_PRODUCT_FIELDS = {
    description: "",
    location: "",
    country: "",
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getUploadedImage = (file) => {
    if (!file) {
        return { ...DEFAULT_PRODUCT_IMAGE };
    }

    return {
        filename: file.filename,
        url: file.path,
    };
};

const getProductPayload = (body) => body.product || body.listing;

const extractProductData = (body) => {
    const { title, price, category } = getProductPayload(body);

    return {
        title: title.trim(),
        price: Number(price),
        category,
    };
};

const isCloudinaryProductImage = (image) =>
    Boolean(
        image?.filename &&
            image.filename !== DEFAULT_PRODUCT_IMAGE.filename &&
            image.filename.includes("/") &&
            /^https?:\/\/res\.cloudinary\.com\//.test(image.url || "")
    );

const deleteCloudinaryImage = async (image) => {
    if (!isCloudinaryProductImage(image)) {
        return;
    }

    try {
        await cloudinary.uploader.destroy(image.filename, {
            resource_type: "image",
            invalidate: true,
        });
    } catch (err) {
        console.log(err);
    }
};

const cleanupLegacyProductFields = async (productId) => {
    await Product.updateOne(
        { _id: productId },
        { $unset: LEGACY_PRODUCT_FIELDS },
        { strict: false }
    );
};

const index = async (req, res) => {
    const searchQuery =
        typeof req.query.search === "string" ? req.query.search.trim() : "";
    const requestedCategory =
        typeof req.query.category === "string" ? req.query.category.trim() : "";
    const selectedCategory = PRODUCT_CATEGORIES.includes(requestedCategory)
        ? requestedCategory
        : "";

    const filter = {};

    if (searchQuery) {
        filter.title = {
            $regex: escapeRegex(searchQuery),
            $options: "i",
        };
    }

    if (selectedCategory) {
        filter.category = selectedCategory;
    }

    const products = await Product.find(filter).sort({ _id: -1 });

    res.render("listings/index", {
        products,
        categories: PRODUCT_CATEGORIES,
        searchQuery,
        selectedCategory,
    });
};

const renderNewForm = (req, res) => {
    res.render("listings/new", {
        categories: PRODUCT_CATEGORIES,
    });
};

const createProduct = async (req, res) => {
    if (!getProductPayload(req.body)) {
        throw new ExpressError(400, "Send valid product data");
    }

    const product = new Product({
        ...extractProductData(req.body),
        image: getUploadedImage(req.file),
        owner: req.user._id,
    });

    await product.save();
    await cleanupLegacyProductFields(product._id);

    req.flash("success", "Product added successfully!");
    res.redirect("/listings");
};

const showProduct = async (req, res) => {
    const { id } = req.params;

    const product = await Product.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author",
            },
        })
        .populate("owner");

    if (!product) {
        req.flash("error", "Product does not exist!");
        return res.redirect("/listings");
    }

    res.render("listings/show", {
        product,
    });
};

const renderEditForm = async (req, res) => {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
        req.flash("error", "Product does not exist!");
        return res.redirect("/listings");
    }

    res.render("listings/edit", {
        product,
        categories: PRODUCT_CATEGORIES,
    });
};

const updateProduct = async (req, res) => {
    if (!getProductPayload(req.body)) {
        throw new ExpressError(400, "Send valid product data");
    }

    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
        req.flash("error", "Product not found!");
        return res.redirect("/listings");
    }

    const oldImage = product.image
        ? {
              filename: product.image.filename,
              url: product.image.url,
          }
        : null;

    Object.assign(product, extractProductData(req.body));

    if (req.file) {
        product.image = getUploadedImage(req.file);
    } else if (!product.image?.url) {
        product.image = { ...DEFAULT_PRODUCT_IMAGE };
    }

    await product.save();
    await cleanupLegacyProductFields(product._id);

    if (req.file) {
        await deleteCloudinaryImage(oldImage);
    }

    req.flash("success", "Product updated successfully!");
    res.redirect(`/listings/${id}`);
};

const destroyProduct = async (req, res) => {
    const { id } = req.params;

    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
        req.flash("error", "Product not found!");
        return res.redirect("/listings");
    }

    await deleteCloudinaryImage(deletedProduct.image);
    await Review.deleteMany({ _id: { $in: deletedProduct.reviews } });

    req.flash("success", "Product deleted successfully!");
    res.redirect("/listings");
};

module.exports = {
    index,
    renderNewForm,
    createProduct,
    showProduct,
    renderEditForm,
    updateProduct,
    destroyProduct,
    createListing: createProduct,
    showListing: showProduct,
    updateListing: updateProduct,
    destroyListing: destroyProduct,
};
