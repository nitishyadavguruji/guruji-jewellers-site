// 🔹 MAIN CONFIG
const WHATSAPP_NUMBER = "918218150139"; // ✅ same number everywhere now
const API_URL = "https://guruji-api.onrender.com/api/products";

let products = [];
let enquiryCart = [];
let currentProduct = null;

// DOM elements
const productGrid = document.getElementById("productGrid");
const categoryFilter = document.getElementById("categoryFilter");
const sortFilter = document.getElementById("sortFilter");
const metalFilter = document.getElementById("metalFilter");
const searchBox = document.getElementById("searchBox");
const minPriceInput = document.getElementById("minPrice");
const maxPriceInput = document.getElementById("maxPrice");
const minPriceDisplay = document.getElementById("minPriceDisplay");
const maxPriceDisplay = document.getElementById("maxPriceDisplay");

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
const modalWeightRange = document.getElementById("modalWeightRange");
const modalMetalType = document.getElementById("modalMetalType");
const modalMakingCharges = document.getElementById("modalMakingCharges");
const modalDeliveryInfo = document.getElementById("modalDeliveryInfo");
const modalAddToEnquiryBtn = document.getElementById("modalAddToEnquiryBtn");

// Enquiry cart elements
const enquiryBar = document.getElementById("enquiryBar");
const enquiryCount = document.getElementById("enquiryCount");
const viewEnquiryBtn = document.getElementById("viewEnquiryBtn");

const enquiryCartModal = document.getElementById("enquiryCartModal");
const enquiryModalClose = document.getElementById("enquiryModalClose");
const enquiryItemsList = document.getElementById("enquiryItemsList");
const enquiryTotal = document.getElementById("enquiryTotal");
const customerNameInput = document.getElementById("customerName");
const customerPhoneInput = document.getElementById("customerPhone");
const sendEnquiryBtn = document.getElementById("sendEnquiryBtn");

// UTIL
function renderStars(rating) {
  const safeRating = typeof rating === "number" ? rating : 4.8;
  const full = Math.round(safeRating);
  let stars = "";
  for (let i = 0; i < 5; i++) {
    stars += i < full ? "★" : "☆";
  }
  return stars;
}

function formatPrice(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return "₹—";
  return "₹" + num.toLocaleString("en-IN");
}

// BACKEND SE PRODUCTS LAO
async function loadProducts() {
  try {
    const res = await fetch(API_URL);
    products = await res.json();

    setupCategories();
    setupPriceSlider();
    renderProducts();
  } catch (err) {
    console.error("Error loading products:", err);
    if (productGrid) {
      productGrid.innerHTML = "<p>Unable to load products right now. Please try again later.</p>";
    }
  }
}

function setupCategories() {
  if (!categoryFilter) return;
  const cats = ["all", ...new Set(products.map(p => p.category).filter(Boolean))];
  categoryFilter.innerHTML = "";
  cats.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat === "all" ? "All Types" : cat;
    categoryFilter.appendChild(opt);
  });
}

function setupPriceSlider() {
  if (!minPriceInput || !maxPriceInput || !minPriceDisplay || !maxPriceDisplay) return;

  const priceValues = products
    .map(p => Number(p.price))
    .filter(v => !Number.isNaN(v) && v > 0);

  let minVal = 0;
  let maxVal = 200000;

  if (priceValues.length > 0) {
    minVal = Math.min(...priceValues);
    maxVal = Math.max(...priceValues);
  }

  minVal = Math.floor(minVal / 1000) * 1000;
  maxVal = Math.ceil(maxVal / 1000) * 1000;

  minPriceInput.min = String(minVal);
  minPriceInput.max = String(maxVal);
  maxPriceInput.min = String(minVal);
  maxPriceInput.max = String(maxVal);

  minPriceInput.value = String(minVal);
  maxPriceInput.value = String(maxVal);

  minPriceDisplay.textContent = String(minVal);
  maxPriceDisplay.textContent = String(maxVal);
}

// FILTER + RENDER
function getFilterValues() {
  const categoryValue = categoryFilter ? categoryFilter.value : "all";
  const metalValue = metalFilter ? metalFilter.value.toLowerCase() : "";
  const searchValue = searchBox ? searchBox.value.toLowerCase().trim() : "";
  const sortOption = sortFilter ? sortFilter.value : "default";

  const minPrice = minPriceInput ? Number(minPriceInput.value) || 0 : 0;
  const maxPrice = maxPriceInput ? Number(maxPriceInput.value) || Number.POSITIVE_INFINITY : Number.POSITIVE_INFINITY;

  return { categoryValue, metalValue, searchValue, sortOption, minPrice, maxPrice };
}

function renderProducts() {
  if (!productGrid) return;

  const { categoryValue, metalValue, searchValue, sortOption, minPrice, maxPrice } = getFilterValues();

  let list = [...products];

  // Category filter
  if (categoryValue && categoryValue !== "all") {
    list = list.filter(p => p.category === categoryValue);
  }

  // Metal filter (expects p.metalType or p.metal to be "Gold" / "Silver")
  if (metalValue) {
    list = list.filter(p => {
      const metal = (p.metalType || p.metal || "").toString().toLowerCase();
      return metal === metalValue;
    });
  }

  // Search (name / category)
  if (searchValue) {
    list = list.filter(p => {
      const name = (p.name || "").toLowerCase();
      const cat = (p.category || "").toLowerCase();
      return name.includes(searchValue) || cat.includes(searchValue);
    });
  }

  // Price filter
  list = list.filter(p => {
    const price = Number(p.price);
    if (Number.isNaN(price)) return true;
    return price >= minPrice && price <= maxPrice;
  });

  // Sorting
  if (sortOption === "price-asc") {
    list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
  } else if (sortOption === "price-desc") {
    list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
  } else if (sortOption === "rating-desc") {
    list.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
  }

  productGrid.innerHTML = "";

  if (list.length === 0) {
    productGrid.innerHTML = "<p>No products match these filters.</p>";
    return;
  }

  list.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";

    const imageSrc = p.image || "https://via.placeholder.com/400x300?text=Jewellery";

    // badge logic: use p.badge OR booleans
    const badgeText =
      p.badge ||
      (p.isNew && "New") ||
      (p.isBestSeller && "Best Seller") ||
      (p.hasOffer && "Offer") ||
      (p.isCustomisable && "Customisable");

    let badgeClass = "product-badge";
    if (badgeText === "Offer") badgeClass += " offer";
    if (badgeText === "Customisable") badgeClass += " custom";

    const safeRating = typeof p.rating === "number" ? p.rating : 4.8;

    card.innerHTML = `
      ${badgeText ? `<div class="${badgeClass}">${badgeText}</div>` : ""}
      <img src="${imageSrc}" alt="${p.name}" class="product-img">
      <div class="product-body">
        <div class="product-name">${p.name}</div>
        <div class="product-category">${p.category || ""}</div>
        <div class="product-desc">${p.shortDescription || ""}</div>
        <div class="product-footer">
          <span class="price-tag">${formatPrice(p.price)}</span>
          <span class="rating">${renderStars(safeRating)} (${safeRating.toFixed(1)})</span>
        </div>
        <div class="card-btn-row">
          <button class="btn-outline-gold details-btn">Details</button>
          <button class="btn-primary enquiry-btn">Add to Enquiry</button>
        </div>
      </div>
    `;

    card.querySelector(".details-btn")
      .addEventListener("click", () => openModal(p));

    card.querySelector(".enquiry-btn")
      .addEventListener("click", () => addToEnquiry(p));

    productGrid.appendChild(card);
  });
}

// MODAL
function setTextOrHide(element, label, value) {
  if (!element) return;
  if (value) {
    element.textContent = `${label}: ${value}`;
    element.style.display = "list-item";
  } else {
    element.textContent = "";
    element.style.display = "none";
  }
}

function openModal(product) {
  currentProduct = product;
  if (!productModal) return;

  modalImage.src = product.image || "https://via.placeholder.com/400x300?text=Jewellery";
  modalTitle.textContent = product.name || "";
  modalCategory.textContent = product.category || "";

  modalPrice.textContent = formatPrice(product.price);

  const safeRating = typeof product.rating === "number" ? product.rating : 4.8;
  modalRating.innerHTML = `${renderStars(safeRating)} (${safeRating.toFixed(1)})`;

  const weightRange = product.weightRange || product.weight || "";
  const metalType = product.metalType || product.metal || "";
  const makingChargesNote = product.makingChargesNote || product.makingCharges || "";
  const deliveryInfo = product.deliveryInfo || "Store pickup from Ashok Nagar, Etawah. Delivery on request.";

  setTextOrHide(modalWeightRange, "Weight range", weightRange);
  setTextOrHide(modalMetalType, "Metal", metalType);
  setTextOrHide(modalMakingCharges, "Making charges", makingChargesNote);
  setTextOrHide(modalDeliveryInfo, "Delivery / Pickup", deliveryInfo);

  modalDescription.textContent = product.description || product.shortDescription || "";

  productModal.classList.remove("hidden");
}

function closeModal() {
  if (!productModal) return;
  productModal.classList.add("hidden");
}

function openWhatsappForProduct(product) {
  const msg =
    `Hi Guru Ji Jewellers, I want details about "${product.name}" (Category: ${product.category}, Price: ${formatPrice(product.price)}).`;
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
}

// ENQUIRY CART LOGIC
function addToEnquiry(product) {
  if (!product) return;

  const exists = enquiryCart.find(
    item =>
      (item._id && product._id && item._id === product._id) ||
      (item.id && product.id && item.id === product.id) ||
      (item.name === product.name && item.category === product.category)
  );

  if (!exists) {
    enquiryCart.push(product);
    updateEnquiryUI();
  }
}

function removeFromEnquiry(index) {
  enquiryCart.splice(index, 1);
  updateEnquiryUI();
}

function updateEnquiryUI() {
  if (!enquiryBar || !enquiryItemsList) return;

  if (enquiryCart.length === 0) {
    enquiryBar.classList.add("hidden");
    if (enquiryCartModal) enquiryCartModal.classList.add("hidden");
    return;
  }

  enquiryBar.classList.remove("hidden");

  enquiryCount.textContent =
    enquiryCart.length === 1
      ? "1 design selected"
      : `${enquiryCart.length} designs selected`;

  enquiryItemsList.innerHTML = "";
  let total = 0;

  enquiryCart.forEach((p, index) => {
    const li = document.createElement("li");
    const priceNumber = Number(p.price) || 0;
    total += priceNumber;

    const infoDiv = document.createElement("div");
    infoDiv.className = "enquiry-item-info";

    const titleDiv = document.createElement("div");
    titleDiv.textContent = `${p.name || "Design"} (${p.category || "Jewellery"})`;

    const metaDiv = document.createElement("div");
    metaDiv.className = "enquiry-item-meta";

    const metaParts = [];
    if (p.metalType || p.metal) metaParts.push((p.metalType || p.metal).toString());
    if (p.weightRange || p.weight) metaParts.push((p.weightRange || p.weight).toString());
    metaDiv.textContent = metaParts.join(" • ");

    const priceDiv = document.createElement("div");
    priceDiv.className = "price-tag";
    priceDiv.textContent = formatPrice(priceNumber);

    infoDiv.appendChild(titleDiv);
    if (metaDiv.textContent) infoDiv.appendChild(metaDiv);
    infoDiv.appendChild(priceDiv);

    const removeBtn = document.createElement("button");
    removeBtn.className = "enquiry-remove-btn";
    removeBtn.innerHTML = "&times;";
    removeBtn.addEventListener("click", () => removeFromEnquiry(index));

    li.appendChild(infoDiv);
    li.appendChild(removeBtn);

    enquiryItemsList.appendChild(li);
  });

  if (enquiryTotal) {
    enquiryTotal.textContent = `Approx total (all designs): ${formatPrice(total)}`;
  }
}

function openEnquiryCart() {
  if (!enquiryCartModal) return;
  if (enquiryCart.length === 0) return;
  enquiryCartModal.classList.remove("hidden");
}

function closeEnquiryCart() {
  if (!enquiryCartModal) return;
  enquiryCartModal.classList.add("hidden");
}

function sendEnquiry() {
  if (enquiryCart.length === 0) return;

  const name = (customerNameInput && customerNameInput.value.trim()) || "Customer";
  const phone = customerPhoneInput ? customerPhoneInput.value.trim() : "";

  let msg = `Hi Guru Ji Jewellers,\n\nI am ${name}`;
  if (phone) {
    msg += ` (Mobile: ${phone})`;
  }
  msg += `.\nI am interested in these designs:\n`;

  enquiryCart.forEach((p, index) => {
    const metaParts = [];
    if (p.metalType || p.metal) metaParts.push((p.metalType || p.metal).toString());
    if (p.weightRange || p.weight) metaParts.push((p.weightRange || p.weight).toString());

    msg += `${index + 1}) ${p.name || "Design"} - Category: ${p.category || "Jewellery"}, Price: ${formatPrice(p.price)}`;
    if (metaParts.length) msg += ` (${metaParts.join(" • ")})`;
    msg += "\n";
  });

  msg += `\nPlease share availability, best pricing and booking details.`;

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
}

// EVENT LISTENERS
if (categoryFilter) categoryFilter.addEventListener("change", renderProducts);
if (sortFilter) sortFilter.addEventListener("change", renderProducts);
if (metalFilter) metalFilter.addEventListener("change", renderProducts);
if (searchBox) searchBox.addEventListener("input", renderProducts);

function handlePriceChange() {
  if (!minPriceInput || !maxPriceInput || !minPriceDisplay || !maxPriceDisplay) return;

  let minVal = Number(minPriceInput.value);
  let maxVal = Number(maxPriceInput.value);

  if (minVal > maxVal) {
    if (this === minPriceInput) {
      maxVal = minVal;
      maxPriceInput.value = String(maxVal);
    } else {
      minVal = maxVal;
      minPriceInput.value = String(minVal);
    }
  }

  minPriceDisplay.textContent = String(minVal);
  maxPriceDisplay.textContent = String(maxVal);

  renderProducts();
}

if (minPriceInput) minPriceInput.addEventListener("input", handlePriceChange);
if (maxPriceInput) maxPriceInput.addEventListener("input", handlePriceChange);

// Modal events
if (modalClose) modalClose.addEventListener("click", closeModal);
if (productModal) {
  productModal.addEventListener("click", (e) => {
    if (e.target === productModal) closeModal();
  });
}

if (modalWhatsappBtn) {
  modalWhatsappBtn.addEventListener("click", () => {
    if (currentProduct) openWhatsappForProduct(currentProduct);
  });
}

if (modalAddToEnquiryBtn) {
  modalAddToEnquiryBtn.addEventListener("click", () => {
    if (currentProduct) {
      addToEnquiry(currentProduct);
    }
  });
}

// Enquiry cart events
if (viewEnquiryBtn) viewEnquiryBtn.addEventListener("click", openEnquiryCart);
if (enquiryModalClose) enquiryModalClose.addEventListener("click", closeEnquiryCart);
if (enquiryCartModal) {
  enquiryCartModal.addEventListener("click", (e) => {
    if (e.target === enquiryCartModal) closeEnquiryCart();
  });
}

if (sendEnquiryBtn) sendEnquiryBtn.addEventListener("click", sendEnquiry);

// START
loadProducts();
