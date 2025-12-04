// backend/server.js
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 4000;

// ==== GOOGLE SHEET CONFIG ====
// Ye wahi ID hai jo tumne URL se li hai
const SHEET_ID = "1fa2xxOW_jG1kZ47_nsleOKYYa9-U_TV6j3V7E3Vkr8M";
// Sheet ke andar tab ka naam
const SHEET_PRODUCTS_NAME = "Products"; // jahan products table hai

// Allow all origins (Netlify + local)
app.use(cors());
app.use(express.json());

// ================== UPLOAD FOLDER ==================
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

// Static serve images
app.use("/uploads", express.static(uploadFolder));

// ================== LOCAL JSON (SIRF MANUAL PRODUCTS) ==================
// NOTE: yahan file ka naam "product.json" rakha hai (jo tumne diya hai)
const DATA_FILE = path.join(__dirname, "product.json");

function readProductsFromFile() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Error reading product.json", err);
    return [];
  }
}

// Base URL for images – Render ka URL
const BASE_URL = process.env.BASE_URL || "https://guruji-api.onrender.com";

// ================== GOOGLE SHEET HELPERS ==================
async function fetchSheetRows() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${encodeURIComponent(
    SHEET_PRODUCTS_NAME
  )}&tqx=out:json`;

  const res = await fetch(url);
  const text = await res.text();

  // gviz response ko plain JSON me convert karna
  const jsonStr = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
  const data = JSON.parse(jsonStr);

  return data.table.rows || [];
}

// Products sheet → products array
async function fetchProductsFromSheet() {
  const rows = await fetchSheetRows();

  const products = rows.map((row, i) => {
    const c = row.c || [];
    return {
      id: c[0]?.v ?? `sheet-${i + 1}`,
      name: c[1]?.v || "",
      category: c[2]?.v || "",
      price: Number(c[3]?.v || 0),
      rating: Number(c[4]?.v || 0),
      image: c[5]?.v || "",
      shortDescription: c[6]?.v || "",
      description: c[7]?.v || "",
    };
  });

  return products;
}

// ================== API ROUTES ==================

// ---- GET: Products (manual JSON + Google Sheet new products) ----
app.get("/api/products", async (req, res) => {
  try {
    const baseProducts = readProductsFromFile(); // tumhare 9 manual products
    let sheetProducts = [];
    try {
      sheetProducts = await fetchProductsFromSheet(); // new products from Sheet
    } catch (innerErr) {
      console.error("Error fetching from Google Sheet:", innerErr);
    }

    // Dono ko merge kar do
    const all = [...baseProducts, ...sheetProducts];
    res.json(all);
  } catch (err) {
    console.error("Error in /api/products:", err);
    res.status(500).json({ error: "Unable to load products right now." });
  }
});

// ---- POST: Add new product (image upload only + return object) ----
// NOTE: Ye Google Sheet me direct nahi likhta, sirf image save karta hai
// Product ko Google Sheet me admin.html se Apps Script ke through save karenge
app.post("/api/products", upload.single("image"), (req, res) => {
  try {
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

    // JSON file me ab new product nahi save kar rahe – sirf manual 9 waha rahenge

    res.status(201).json({
      success: true,
      message: "Image uploaded, product object ready.",
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

// Simple health check
app.get("/", (req, res) => {
  res.send("Guru Ji Jewellers API running");
});

// ================== START SERVER ==================
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
