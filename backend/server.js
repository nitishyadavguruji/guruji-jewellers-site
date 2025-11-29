// backend/server.js
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 4000;

// Allow all origins (Netlify + local)
app.use(cors());
app.use(express.json());

// Upload folder
const uploadFolder = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder);
}

// Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadFolder);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, unique);
  },
});

const upload = multer({ storage });

// Serve images
app.use("/uploads", express.static(uploadFolder));

// Data file
const DATA_FILE = path.join(__dirname, "products.json");

function readProducts() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Error reading products.json", err);
    return [];
  }
}

function saveProducts(products) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2));
}

// Base URL for images – yahi tumhara Render URL hai:
const BASE_URL = process.env.BASE_URL || "https://guruji-api.onrender.com";

// GET all products
app.get("/api/products", (req, res) => {
  const products = readProducts();
  res.json(products);
});

// Add new product
app.post("/api/products", upload.single("image"), (req, res) => {
  try {
    const products = readProducts();
    const { name, category, price, rating, shortDescription, description } = req.body;

    let imageUrl = "";
    if (req.file) {
      imageUrl = `${BASE_URL}/uploads/${req.file.filename}`;
    }

    const newProduct = {
      id: Date.now(),
      name,
      category,
      price: Number(price),
      rating: rating ? Number(rating) : 0,
      image: imageUrl,
      shortDescription: shortDescription || "",
      description: description || "",
    };

    products.push(newProduct);
    saveProducts(products);

    res.status(201).json({
      success: true,
      message: "Product uploaded successfully",
      product: newProduct,
    });
  } catch (err) {
    console.error("Error saving product:", err);
    res.status(500).json({
      success: false,
      message: "Server error while saving product",
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
