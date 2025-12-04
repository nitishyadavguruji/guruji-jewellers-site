// backend/server.js
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 4000;

// CORS + JSON
app.use(cors());
app.use(express.json());

// -------- Upload folder --------
const uploadFolder = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});
const upload = multer({ storage });

// Static serve images
app.use("/uploads", express.static(uploadFolder));

// -------- Local products.json (tumhara master data) --------
const DATA_FILE = path.join(__dirname, "products.json"); // dhyaan: naam EXACT yahi ho

function readProducts() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Error reading products.json:", err);
    return [];
  }
}

function saveProducts(products) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2));
}

// Render base URL
const BASE_URL = process.env.BASE_URL || "https://guruji-api.onrender.com";

// -------- GET: sab products (sirf JSON se) --------
app.get("/api/products", (req, res) => {
  const products = readProducts();
  res.json(products);
});

// -------- POST: naya product add (JSON me + image upload) --------
app.post("/api/products", upload.single("image"), (req, res) => {
  try {
    const products = readProducts();

    const {
      name,
      category,
      price,
      rating,
      shortDescription,
      description,
    } = req.body;

    let imageUrl = "";
    if (req.file) {
      imageUrl = `${BASE_URL}/uploads/${req.file.filename}`;
    }

    const newProduct = {
      id: Date.now(),
      name,
      category,
      price: Number(price),
      rating: rating ? Number(rating) : 4.8,
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

// Health check
app.get("/", (req, res) => {
  res.send("Guru Ji Jewellers API running");
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
