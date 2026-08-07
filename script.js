/* ==========================================================================
   AL HALAL VENTURES - INTERACTIVE JAVASCRIPT
   Product Catalog Data, Filtering, Cart Drawer & WhatsApp Integration
   ========================================================================== */

// Product Dataset
const productsData = [
  {
    id: 1,
    name: "Executive Suiting Material (Grey/Navy)",
    category: "Executive",
    tag: "Top Seller",
    desc: "Crisp, premium structured fabric for bespoke suits, agbada, and executive suits.",
    image: "images/executive_fabric_1786083488462.jpg"
  },
  {
    id: 2,
    name: "Luxury Silk Abaya Material",
    category: "Abaya",
    tag: "Best Quality",
    desc: "Ultra-soft, opaque silk fabric with gentle drape, ideal for modern modesty fashion.",
    image: "images/abaya_material_1786083502735.jpg"
  },
  {
    id: 3,
    name: "Royal Duchess Satin Material",
    category: "Duchess",
    tag: "Glamour",
    desc: "Heavyweight glossy satin fabric roll for royal occasions, gowns, and luxury wear.",
    image: "images/duchess_fabric_1786083472064.jpg"
  },
  {
    id: 4,
    name: "Textured Jonkoso Fabric",
    category: "Jonkoso",
    tag: "Traditional",
    desc: "Enduring woven pattern textile crafted for traditional and contemporary styles.",
    image: "images/jonkoso_fabric_1786098349901.jpg"
  },
  {
    id: 5,
    name: "Premium Breathable Niqob Set",
    category: "ModestWear",
    tag: "Essentials",
    desc: "Comfortable, double-layer breathable chiffon niqob designed for ease and elegance.",
    image: "images/niqob_sleeves_1786098361398.jpg"
  },
  {
    id: 6,
    name: "Stretch Arm Sleeves & Socks Bundle",
    category: "ModestWear",
    tag: "Daily Wear",
    desc: "Soft cotton-spandex arm sleeves & opaque velvet socks for everyday modesty.",
    image: "images/niqob_sleeves_1786098361398.jpg"
  },
  {
    id: 7,
    name: "Executive Wool Blend Material",
    category: "Executive",
    tag: "New Arrival",
    desc: "High-grade wrinkle-resistant suiting fabric for corporate and ceremonial wear.",
    image: "images/hero_fabrics_1786083472064.jpg"
  },
  {
    id: 8,
    name: "Flowing Nida Abaya Material",
    category: "Abaya",
    tag: "Popular",
    desc: "Original Dubai Nida fabric with rich color tone and cooling touch.",
    image: "images/abaya_material_1786083502735.jpg"
  }
];

// Cart State
let cart = [];

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
  renderProducts(productsData);
  initNavigation();
  initCartDrawer();
});

// Render Product Grid
function renderProducts(items) {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  if (items.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: rgba(255,255,255,0.7);">
        <i class="fa-solid fa-box-open" style="font-size: 3rem; margin-bottom: 1rem; color: var(--accent-gold);"></i>
        <h3>No materials found</h3>
        <p>Try searching for another term or selecting a different category.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = items.map(product => `
    <div class="product-card">
      <span class="product-tag">${product.tag}</span>
      <div class="product-thumb">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
      </div>
      <div class="product-body">
        <h3 class="product-name">${product.name}</h3>
        <p class="product-desc">${product.desc}</p>
        <div class="product-actions">
          <button class="btn btn-primary w-100" onclick="addToCart(${product.id})">
            <i class="fa-solid fa-plus"></i> Add To Order
          </button>
          <a href="https://wa.me/23462761948?text=Hello%20Al%20Halal%20Ventures,%20I%20am%20interested%20in%20${encodeURIComponent(product.name)}" target="_blank" class="btn btn-whatsapp" aria-label="Inquire via WhatsApp">
            <i class="fa-brands fa-whatsapp"></i>
          </a>
        </div>
      </div>
    </div>
  `).join('');
}

// Category Filter
function filterCategory(category) {
  // Update Active Filter Button
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('onclick').includes(`'${category}'`)) {
      btn.classList.add('active');
    }
  });

  if (category === 'all') {
    renderProducts(productsData);
  } else {
    const filtered = productsData.filter(p => p.category === category);
    renderProducts(filtered);
  }
}

// Search Filter
function searchProducts() {
  const query = document.getElementById('searchInput').value.toLowerCase().trim();
  const filtered = productsData.filter(p => 
    p.name.toLowerCase().includes(query) || 
    p.desc.toLowerCase().includes(query) ||
    p.category.toLowerCase().includes(query)
  );
  renderProducts(filtered);
}

// Cart Functions
function addToCart(productId) {
  const item = productsData.find(p => p.id === productId);
  if (!item) return;

  const existing = cart.find(c => c.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...item, qty: 1 });
  }

  updateCartUI();
  openCartDrawer();
}

function removeFromCart(productId) {
  cart = cart.filter(c => c.id !== productId);
  updateCartUI();
}

function updateCartUI() {
  const countBadge = document.getElementById('cartCount');
  const totalCountText = document.getElementById('cartTotalItems');
  const cartContainer = document.getElementById('cartItemsContainer');

  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);

  if (countBadge) countBadge.textContent = totalQty;
  if (totalCountText) totalCountText.textContent = `${totalQty} item${totalQty !== 1 ? 's' : ''}`;

  if (!cartContainer) return;

  if (cart.length === 0) {
    cartContainer.innerHTML = `
      <div style="text-align: center; margin-top: 3rem; color: rgba(255,255,255,0.6);">
        <i class="fa-solid fa-basket-shopping" style="font-size: 2.5rem; margin-bottom: 1rem; color: var(--accent-lilac);"></i>
        <p>Your order list is empty.</p>
        <small>Add materials from the catalog above!</small>
      </div>
    `;
    return;
  }

  cartContainer.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" class="cart-item-img" alt="${item.name}">
      <div class="cart-item-details">
        <div class="cart-item-name">${item.name}</div>
        <small style="color: var(--accent-gold);">Quantity: ${item.qty}</small>
      </div>
      <button class="remove-cart-item" onclick="removeFromCart(${item.id})" title="Remove">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </div>
  `).join('');
}

function checkoutWhatsApp() {
  if (cart.length === 0) {
    alert("Please add at least one material to your order list first.");
    return;
  }

  let message = "Hello Al Halāl Ventures! 👋 I would like to make an inquiry / place an order for the following cloth materials:\n\n";
  cart.forEach((item, index) => {
    message += `${index + 1}. *${item.name}* (Qty: ${item.qty})\n`;
  });
  message += "\nPlease let me know the total price and payment/delivery details. Thank you!";

  const waUrl = `https://wa.me/23462761948?text=${encodeURIComponent(message)}`;
  window.open(waUrl, '_blank');
}

// Navigation & Drawer Handlers
function initNavigation() {
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const closeMobileNav = document.getElementById('closeMobileNav');
  const mobileNavOverlay = document.getElementById('mobileNavOverlay');
  const mobileLinks = document.querySelectorAll('.mobile-link');

  if (mobileMenuBtn && mobileNavOverlay) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileNavOverlay.classList.add('active');
    });
  }

  if (closeMobileNav && mobileNavOverlay) {
    closeMobileNav.addEventListener('click', () => {
      mobileNavOverlay.classList.remove('active');
    });
  }

  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (mobileNavOverlay) mobileNavOverlay.classList.remove('active');
    });
  });
}

function initCartDrawer() {
  const cartBtn = document.getElementById('cartBtn');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const cartOverlay = document.getElementById('cartOverlay');

  if (cartBtn && cartOverlay) {
    cartBtn.addEventListener('click', openCartDrawer);
  }

  if (closeCartBtn && cartOverlay) {
    closeCartBtn.addEventListener('click', closeCartDrawer);
  }

  if (cartOverlay) {
    cartOverlay.addEventListener('click', (e) => {
      if (e.target === cartOverlay) closeCartDrawer();
    });
  }
}

function openCartDrawer() {
  const cartOverlay = document.getElementById('cartOverlay');
  if (cartOverlay) cartOverlay.classList.add('active');
}

function closeCartDrawer() {
  const cartOverlay = document.getElementById('cartOverlay');
  if (cartOverlay) cartOverlay.classList.remove('active');
}

// Contact Form Handler
function handleFormSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('name').value;
  const phone = document.getElementById('phone').value;
  const material = document.getElementById('material').value;
  const message = document.getElementById('message').value;

  const text = `Hello Al Halāl Ventures! 👋\n\nName: *${name}*\nPhone: ${phone}\nInterested Material: *${material}*\n\nMessage/Quantity:\n${message}`;

  const waUrl = `https://wa.me/23462761948?text=${encodeURIComponent(text)}`;
  window.open(waUrl, '_blank');
}
