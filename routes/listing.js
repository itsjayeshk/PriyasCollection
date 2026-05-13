const express = require("express");
const router = express.Router();

const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, validateProduct } = require("../middleware.js");
const { productImageUpload } = require("../utils/upload.js");
const productController = require("../controllers/listings.js");

router.get("/", wrapAsync(productController.index));

router.get("/new", isLoggedIn, productController.renderNewForm);

router.post(
    "/",
    isLoggedIn,
    productImageUpload,
    validateProduct,
    wrapAsync(productController.createProduct)
);

router.get("/:id", wrapAsync(productController.showProduct));

router.get(
    "/:id/edit",
    isLoggedIn,
    wrapAsync(productController.renderEditForm)
);

router.put(
    "/:id",
    isLoggedIn,
    productImageUpload,
    validateProduct,
    wrapAsync(productController.updateProduct)
);

router.delete(
    "/:id",
    isLoggedIn,
    wrapAsync(productController.destroyProduct)
);

module.exports = router;
