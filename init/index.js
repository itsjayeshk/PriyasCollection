require("dotenv").config();

const mongoose = require("mongoose");
const initData = require("./data.js");
const Product = require("../models/listing.js");

const MONGO_URL = process.env.MONGO_URL;
const SEED_OWNER_ID =
    process.env.SEED_OWNER_ID || "6a0046cbc9150a98192c8472";

main()
    .then(() => {
        console.log("Connected to DB");
    })
    .catch((err) => {
        console.log(err);
    });

async function main() {
    await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
    await Product.deleteMany({});

    const products = initData.data.map((product) => ({
        ...product,
        owner: SEED_OWNER_ID,
    }));

    await Product.insertMany(products);
    console.log("Product data initialized");
};

initDB();
