// backend/server.js
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

// ---- Google Sheet Config ----
const SHEET_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbzxmPgc-iAcMUfnAl_YdT2EnCJehMbWfy3HOkoxgT93MK3x4KWO83zWhSGKe2EyUmY/exec";

const app = express();
const PORT = process.env.PORT || 4000;

// Allow all origins
app.use(cors());
app.use(express.json());

// ---- Upload folder ----
const uploadFolder = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_"))
});
const upload = multer({ storage });

// Static images
app.use("/uploads", express.static(uploadFolder));

// ---- Local products.json sync ----
const DATA_FILE = path.join(__dirname, "products.json");

function readProducts() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveProducts(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

const BASE_URL = process.env.BASE_URL || "https://guruji-api.onrender.com";

// ---- GET Products ----
app.get("/api/products", async (req, res) => {
  const products = readProducts();
  res.json(products);
});

// ---- ADD Product + SAVE to JSON + WRITE to SHEET ----
app.post("/api/products", upload.single("image"), async (req, res) => {
  try {
    const products = readProducts();

    const { name, category, price, rating, shortDescription, description } = req.body;

    const imageUrl = req.file
      ? `${BASE_URL}/uploads/${req.file.filename}`
      : "";

    const newProduct = {
      id: Date.now(),
      name,
      category,
      price: Number(price),
      rating: rating ? Number(rating) : 4.8,
      image: imageUrl,
      shortDescription,
      description
    };

    products.push(newProduct);
    saveProducts(products);

    // ---- Write to Google Sheet ----
    await fetch(SHEET_WEBAPP_URL, {
      method: "POST",
      body: JSON.stringify(newProduct)
    });

    return res.status(201).json({
      success: true,
      message: "Uploaded & synced to Sheet successfully",
      product: newProduct
    });

  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({
      success: false,
      message: "Upload saved locally, but Sheet sync failed!"
    });
  }
});

// ---- Start ----
app.listen(PORT, () => {
  console.log("Backend running on port", PORT);
});
