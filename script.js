
const WHATSAPP_NUMBER = "9181218150139"; // change to your number

const API_URL = "http://localhost:4000/api/products";

let products = [];

// DOM elements
const productGrid = document.getElementById("productGrid");
const categoryFilter = document.getElementById("categoryFilter");
const sortFilter = document.getElementById("sortFilter");

// Modal elements
const productModal = document.getElementById("productModal");
const modalClose = document.getElementById("modalClose");
const modalImage = document.getElementById("modalImage");
const modalTitle = document.getElementById("modalTitle");
const modalCategory = document.getElementById("modalCategory");
const modalPrice = document.getElementById("modalPrice");
const modalRating = document.getElementById("modalRating");
const modalDescription = document.getElementById("modalDescription");
const modalWhatsappBtn = document.getElementById("modalWhatsappBtn");

let currentProduct = null;

function renderStars(rating) {
  const full = Math.round(rating);
  let stars = "";
  for (let i = 0; i < 5; i++) {
    stars += i < full ? "★" : "☆";
  }
  return stars;
}

// BACKEND SE PRODUCTS LAO
async function loadProducts() {
  try {
    const res = await fetch(API_URL);
    products = await res.json();
    setupCategories();
    renderProducts();
  } catch (err) {
    console.error("Error loading products:", err);
  }
}

function setupCategories() {
  const cats = ["all", ...new Set(products.map(p => p.category))];
  categoryFilter.innerHTML = "";
  cats.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat === "all" ? "All Types" : cat;
    categoryFilter.appendChild(opt);
  });
}

function renderProducts() {
  const selectedCat = categoryFilter.value;
  const sortOption = sortFilter.value;

  let list = [...products];

  if (selectedCat !== "all") {
    list = list.filter(p => p.category === selectedCat);
  }

  if (sortOption === "price-asc") {
    list.sort((a, b) => a.price - b.price);
  } else if (sortOption === "price-desc") {
    list.sort((a, b) => b.price - a.price);
  } else if (sortOption === "rating-desc") {
    list.sort((a, b) => b.rating - a.rating);
  }

  productGrid.innerHTML = "";

  if (list.length === 0) {
    productGrid.innerHTML = "<p>No products added yet.</p>";
    return;
  }

  list.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";

    const imageSrc = p.image || "https://via.placeholder.com/400x300?text=Jewellery";

    card.innerHTML = `
      <img src="${imageSrc}" alt="${p.name}" class="product-img">
      <div class="product-body">
        <div class="product-name">${p.name}</div>
        <div class="product-category">${p.category}</div>
        <div class="product-desc">${p.shortDescription}</div>
        <div class="product-footer">
          <span class="price-tag">₹${p.price}</span>
          <span class="rating">${renderStars(p.rating)} (${p.rating.toFixed(1)})</span>
        </div>
        <div class="card-btn-row">
          <button class="btn-outline-gold">Details</button>
          <button class="btn-primary small-wa-btn"><i class="fa-brands fa-whatsapp"></i></button>
        </div>
      </div>
    `;

    card.querySelector(".btn-outline-gold")
      .addEventListener("click", () => openModal(p));
    card.querySelector(".small-wa-btn")
      .addEventListener("click", () => openWhatsappForProduct(p));

    productGrid.appendChild(card);
  });
}

// MODAL
function openModal(product) {
  currentProduct = product;
  modalImage.src = product.image || "https://via.placeholder.com/400x300?text=Jewellery";
  modalTitle.textContent = product.name;
  modalCategory.textContent = product.category;
  modalPrice.textContent = "₹" + product.price;
  modalRating.innerHTML = `${renderStars(product.rating)} (${product.rating.toFixed(1)})`;
  modalDescription.textContent = product.description;
  productModal.classList.remove("hidden");
}

function closeModal() {
  productModal.classList.add("hidden");
}

function openWhatsappForProduct(product) {
  const msg =
    `Hi Guru Ji Jewellers, I want details about "${product.name}" (Category: ${product.category}, Price: ₹${product.price}).`;
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
}

// EVENT LISTENERS
categoryFilter.addEventListener("change", renderProducts);
sortFilter.addEventListener("change", renderProducts);

modalClose.addEventListener("click", closeModal);
productModal.addEventListener("click", (e) => {
  if (e.target === productModal) closeModal();
});

modalWhatsappBtn.addEventListener("click", () => {
  if (currentProduct) openWhatsappForProduct(currentProduct);
});

// START
loadProducts();
