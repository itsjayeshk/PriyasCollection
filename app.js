require("dotenv").config();

const express = require("express");
const app = express();

const multer = require("multer");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");

const User = require("./models/user.js");
const ExpressError = require("./utils/ExpressError.js");
const { cloudinary } = require("./utils/cloudinary.js");

const productRoutes = require("./routes/listing.js");
const reviewRoutes = require("./routes/review.js");
const userRoutes = require("./routes/user.js");

const MONGO_URL = process.env.MONGO_URL;
const PORT = process.env.PORT || 8080;

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

app.use("/uploads", (req, res, next) => {
    next(new ExpressError(410, "Local uploads are no longer served."));
});

app.use(express.static(path.join(__dirname, "public")));

const sessionOptions = {
    secret: process.env.SESSION_SECRET || "mysupersecret",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true,
    },
};

app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

app.use("/listings", productRoutes);
app.use("/listings/:id/reviews", reviewRoutes);
app.use("/users", userRoutes);

app.get("/", (req, res) => {
    res.redirect("/listings");
});

app.use((req, res, next) => {
    next(new ExpressError(404, "Page Not Found"));
});

app.use(async (err, req, res, next) => {
    if (req.file?.filename) {
        try {
            await cloudinary.uploader.destroy(req.file.filename, {
                resource_type: "image",
                invalidate: true,
            });
        } catch (cleanupErr) {
            console.log(cleanupErr);
        }
    }

    let { statusCode = 500, message = "Something went wrong!" } = err;

    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        statusCode = 400;
        message = "Image size must be 5 MB or smaller.";
    }

    console.log(err);

    res.status(statusCode).render("error.ejs", {
        message,
    });
});

async function startServer() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("Connected to MongoDB");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (err) {
        console.log("MongoDB connection error");
        console.log(err);
    }
}

startServer();
