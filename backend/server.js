// backend/server.js
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// Upload folder
const uploadFolder = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder);
}

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadFolder);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, unique);
  }
});
const upload = multer({ storage });

// Products JSON file ka path
const PRODUCTS_FILE = path.join(__dirname, "products.json");

function readProducts() {
  if (!fs.existsSync(PRODUCTS_FILE)) return [];
  const data = fs.readFileSync(PRODUCTS_FILE, "utf8");
  try {
    return JSON.parse(data || "[]");
  } catch {
    return [];
  }
}

function writeProducts(products) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

// Uploaded images ko serve karo
app.use("/uploads", express.static(uploadFolder));

// GET sab products
app.get("/api/products", (req, res) => {
  const products = readProducts();
  res.json(products);
});

// POST naya product (form + image)
app.post("/api/products", upload.single("image"), (req, res) => {
  const file = req.file;
  const {
    name,
    category,
    price,
    rating,
    shortDescription,
    description
  } = req.body;

  if (!name || !category || !price) {
    return res.status(400).json({ message: "Name, category, price required" });
  }

  const products = readProducts();

  const newProduct = {
    id: Date.now(),
    name,
    category,
    price: Number(price),
    rating: rating ? Number(rating) : 4.5,
    image: file ? `http://localhost:${PORT}/uploads/${file.filename}` : "",
    shortDescription: shortDescription || "",
    description: description || ""
  };

  products.push(newProduct);
  writeProducts(products);

  res.json({ message: "Product added", product: newProduct });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
