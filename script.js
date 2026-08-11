/* ==========================================================================
   AL HALAL VENTURES - INTERACTIVE JAVASCRIPT
   Product Catalog Data, Filtering, Cart Drawer & WhatsApp Integration
   Now powered by Supabase for real-time product pricing
   ========================================================================== */

// Fallback product dataset (used if Supabase is unavailable)
const productsData = [
  {
    id: 1,
    name: "Executive Suiting Material (Navy/Grey)",
    category: "Executive",
    tag: "Top Seller",
    desc: "Crisp, premium structured fabric for bespoke suits, agbada, and executive suits.",
    image: "images/executive_market.jpg",
    price: 8500,
    unit: "yard"
  },
  {
    id: 3,
    name: "Royal Duchess Satin Material",
    category: "Duchess",
    tag: "Glamour",
    desc: "Heavyweight glossy satin fabric roll for royal occasions, gowns, and luxury wear.",
    image: "images/duchess_material.jpg",
    price: 6000,
    unit: "yard"
  },
  {
    id: 4,
    name: "Textured Jonkoso Fabric",
    category: "Jonkoso",
    tag: "Traditional",
    desc: "Enduring woven pattern textile crafted for traditional and contemporary styles.",
    image: "images/jonkoso_material.jpg",
    price: 7500,
    unit: "yard"
  },
  {
    id: 5,
    name: "Premium Breathable Niqob Set",
    category: "ModestWear",
    tag: "Essentials",
    desc: "Comfortable, double-layer breathable chiffon niqob designed for ease and elegance.",
    image: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=800&q=80",
    price: 4500,
    unit: "set"
  },
  {
    id: 7,
    name: "Executive Wool Blend Material",
    category: "Executive",
    tag: "New Arrival",
    desc: "High-grade wrinkle-resistant suiting fabric for corporate and ceremonial wear.",
    image: "images/executive_market.jpg",
    price: 9500,
    unit: "yard"
  }
];

// Live product list (populated from Supabase or fallback)
let dbProducts = [];

// Cart State (still local for session speed)
let cart = [];
try {
  const savedCart = localStorage.getItem('al_halal_cart_state');
  if (savedCart) cart = JSON.parse(savedCart);
} catch (e) {
  console.error("Error loading cart state", e);
}

// ---- INITIALISE ----
document.addEventListener('DOMContentLoaded', async () => {
  showProductLoadingState();
  await loadProductsFromSupabase();
  initNavigation();
  initCartDrawer();
  initHeroSlider();
  updateCartUI();
});

// Show a loading spinner in the product grid
function showProductLoadingState() {
  const grid = document.getElementById('productGrid');
  if (grid) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; color: rgba(255,255,255,0.7);">
        <i class="fa-solid fa-spinner fa-spin" style="font-size: 2.5rem; color: var(--accent-gold); margin-bottom: 1rem; display: block;"></i>
        <p>Loading latest catalog & prices...</p>
      </div>
    `;
  }
}

// Load products from Supabase (with localStorage fallback)
async function loadProductsFromSupabase() {
  try {
    const { data, error } = await supabaseClient
      .from('products')
      .select('*')
      .order('id', { ascending: true });

    if (error || !data || data.length === 0) {
      console.warn("Supabase unavailable, using fallback products.");
      dbProducts = [...productsData];
    } else {
      dbProducts = data.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        tag: p.tag,
        desc: p.description,
        image: p.image,
        price: p.price,
        unit: p.unit
      }));
    }
  } catch (err) {
    console.error("Error loading products from Supabase:", err);
    dbProducts = [...productsData];
  }

  renderProducts(dbProducts);
}

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
        <div class="product-price-box" style="margin-bottom: 1.2rem; font-family: var(--font-body); display: flex; align-items: baseline; gap: 0.3rem;">
          <span class="product-price" style="font-size: 1.3rem; font-weight: 700; color: var(--accent-gold);">₦${product.price.toLocaleString()}</span>
          <span style="font-size: 0.85rem; opacity: 0.8; color: var(--text-light);">/ ${product.unit}</span>
        </div>
        <div class="product-actions">
          <button class="btn btn-primary w-100" onclick="addToCart(${product.id})">
            <i class="fa-solid fa-bag-shopping"></i> Buy Now
          </button>
          <a href="https://wa.me/2349071351283?text=Hello%20Al%20Halal%20Ventures,%20I%20am%20interested%20in%20${encodeURIComponent(product.name)}" target="_blank" class="btn btn-whatsapp" aria-label="Inquire via WhatsApp">
            <i class="fa-brands fa-whatsapp"></i>
          </a>
        </div>
      </div>
    </div>
  `).join('');
}

// Category Filter
function filterCategory(category) {
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`'${category}'`)) {
      btn.classList.add('active');
    }
  });

  if (category === 'all') {
    renderProducts(dbProducts);
  } else {
    const filtered = dbProducts.filter(p => p.category === category);
    renderProducts(filtered);
  }
}

// Search Filter
function searchProducts() {
  const query = document.getElementById('searchInput').value.toLowerCase().trim();
  const filtered = dbProducts.filter(p =>
    p.name.toLowerCase().includes(query) ||
    p.desc.toLowerCase().includes(query) ||
    p.category.toLowerCase().includes(query)
  );
  renderProducts(filtered);
}

// Cart Functions
function addToCart(productId) {
  openTailorModal(productId);
}

function removeFromCart(productId) {
  cart = cart.filter(c => c.id !== productId);
  localStorage.setItem('al_halal_cart_state', JSON.stringify(cart));
  updateCartUI();
}

function updateCartUI() {
  const countBadge = document.getElementById('cartCount');
  const totalCountText = document.getElementById('cartTotalItems');
  const cartContainer = document.getElementById('cartItemsContainer');
  const subtotalEl = document.getElementById('cartSubtotal');

  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  if (countBadge) countBadge.textContent = totalQty;
  if (totalCountText) totalCountText.textContent = `${totalQty} item${totalQty !== 1 ? 's' : ''}`;
  if (subtotalEl) subtotalEl.textContent = `₦${subtotal.toLocaleString()}`;

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
    <div class="cart-item" style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05);">
      <img src="${item.image}" class="cart-item-img" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: var(--radius-sm);">
      <div class="cart-item-details" style="flex: 1;">
        <div class="cart-item-name" style="font-weight: 600; font-size: 0.95rem; line-height: 1.3; margin-bottom: 0.2rem;">${item.name}</div>
        <div style="font-size: 0.85rem; display: flex; flex-direction: column; gap: 0.1rem;">
          <span style="color: var(--accent-gold);">Qty: ${item.qty} ${item.unit}${item.qty !== 1 ? 's' : ''}</span>
          <span style="opacity: 0.7;">₦${item.price.toLocaleString()} per ${item.unit}</span>
          ${item.measurements ? `
            <span class="tailor-badge" style="color: var(--accent-lavender); font-size: 0.75rem; margin-top: 0.15rem; display: block; border-left: 2px solid var(--accent-gold); padding-left: 0.4rem; line-height: 1.3;">
              Waist: ${item.measurements.waist}" | Length: ${item.measurements.length}" | Thigh: ${item.measurements.thigh}" | Ankle: ${item.measurements.ankle}"
            </span>
          ` : ''}
          <strong style="color: var(--text-light); font-weight: 600; margin-top: 0.1rem;">Total: ₦${(item.price * item.qty).toLocaleString()}</strong>
        </div>
      </div>
      <button class="remove-cart-item" onclick="removeFromCart(${item.id})" title="Remove" style="background: none; border: none; color: #ff5252; cursor: pointer; padding: 0.5rem; transition: var(--transition);">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </div>
  `).join('');
}

// Tailoring & Custom Measurements Modal Logic
function openTailorModal(productId) {
  const item = dbProducts.find(p => p.id === productId);
  if (!item) return;

  document.getElementById('tailorModalProductId').value = productId;
  document.getElementById('tailorModalProductName').textContent = item.name;

  const yardsLabel = document.getElementById('tailorYardsLabel');
  const trouserSpecsGroup = document.getElementById('trouserSpecsGroup');
  const includeTrouserCheckbox = document.getElementById('includeTrouserSpecs');
  const trouserFields = document.getElementById('trouserSpecsFields');

  // Reset fields
  document.getElementById('tailorYards').value = item.category === "ModestWear" ? "1" : "4";
  includeTrouserCheckbox.checked = false;
  trouserFields.style.display = "none";

  // Clear inputs
  document.getElementById('trouserWaist').value = "";
  document.getElementById('trouserLength').value = "";
  document.getElementById('trouserThigh').value = "";
  document.getElementById('trouserAnkle').value = "";

  if (item.category === "ModestWear") {
    yardsLabel.textContent = "How many sets/packs do you need?";
    trouserSpecsGroup.style.display = "none";
  } else {
    yardsLabel.textContent = "How many yards do you need?";
    trouserSpecsGroup.style.display = "block";

    // Auto-fill measurements if user is logged in
    const currentUserStr = localStorage.getItem('al_halal_current_user');
    if (currentUserStr) {
      try {
        const user = JSON.parse(currentUserStr);
        if (user.measurements) {
          includeTrouserCheckbox.checked = true;
          trouserFields.style.display = "block";
          document.getElementById('trouserWaist').value = user.measurements.waist || "";
          document.getElementById('trouserLength').value = user.measurements.length || "";
          document.getElementById('trouserThigh').value = user.measurements.thigh || "";
          document.getElementById('trouserAnkle').value = user.measurements.ankle || "";
        }
      } catch (e) {
        console.error(e);
      }
    }
  }

  const overlay = document.getElementById('tailorModalOverlay');
  if (overlay) overlay.style.display = "flex";
}

function closeTailorModal() {
  const overlay = document.getElementById('tailorModalOverlay');
  if (overlay) overlay.style.display = "none";
}

function toggleTrouserSpecs(checkbox) {
  const fields = document.getElementById('trouserSpecsFields');
  if (fields) fields.style.display = checkbox.checked ? "block" : "none";
}

function confirmTailorSpecs(e) {
  e.preventDefault();
  const productId = parseInt(document.getElementById('tailorModalProductId').value);
  const qty = parseFloat(document.getElementById('tailorYards').value) || 1;
  const includeTrouser = document.getElementById('includeTrouserSpecs').checked;

  const item = dbProducts.find(p => p.id === productId);
  if (!item) return;

  let measurements = null;
  if (includeTrouser && item.category !== "ModestWear") {
    measurements = {
      waist: parseFloat(document.getElementById('trouserWaist').value) || 0,
      length: parseFloat(document.getElementById('trouserLength').value) || 0,
      thigh: parseFloat(document.getElementById('trouserThigh').value) || 0,
      ankle: parseFloat(document.getElementById('trouserAnkle').value) || 0
    };
  }

  // Check if item with exact specs exists in cart
  const existingIndex = cart.findIndex(c => c.id === productId && JSON.stringify(c.measurements) === JSON.stringify(measurements));
  if (existingIndex > -1) {
    cart[existingIndex].qty += qty;
  } else {
    cart.push({ ...item, qty: qty, measurements: measurements });
  }

  localStorage.setItem('al_halal_cart_state', JSON.stringify(cart));
  updateCartUI();
  closeTailorModal();
  openCartDrawer();
}

function checkoutWhatsApp() {
  if (cart.length === 0) {
    alert("Please add at least one material to your order list first.");
    return;
  }
  localStorage.setItem('al_halal_pending_cart', JSON.stringify(cart));
  window.location.href = 'payment.html';
}

// Navigation & Drawer Handlers
function initNavigation() {
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const closeMobileNav = document.getElementById('closeMobileNav');
  const mobileNavOverlay = document.getElementById('mobileNavOverlay');
  const mobileLinks = document.querySelectorAll('.mobile-link');

  if (mobileMenuBtn && mobileNavOverlay) {
    mobileMenuBtn.addEventListener('click', () => { mobileNavOverlay.classList.add('active'); });
  }
  if (closeMobileNav && mobileNavOverlay) {
    closeMobileNav.addEventListener('click', () => { mobileNavOverlay.classList.remove('active'); });
  }
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => { if (mobileNavOverlay) mobileNavOverlay.classList.remove('active'); });
  });
}

function initCartDrawer() {
  const cartBtn = document.getElementById('cartBtn');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const cartOverlay = document.getElementById('cartOverlay');

  if (cartBtn && cartOverlay) cartBtn.addEventListener('click', openCartDrawer);
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeCartDrawer);
  if (cartOverlay) {
    cartOverlay.addEventListener('click', (e) => { if (e.target === cartOverlay) closeCartDrawer(); });
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
  window.open(`https://wa.me/2349071351283?text=${encodeURIComponent(text)}`, '_blank');
}

// Hero Slider Carousel Logic
let currentSlideIndex = 0;
let heroSliderTimer = null;

const heroSlideBadgeData = [
  { title: "Executive Fabrics", subtitle: "Specialist Collection" },
  { title: "Executive Suiting", subtitle: "Corporate & Ceremony" },
  { title: "Duchess Satin", subtitle: "Royal Celebration Rolls" },
  { title: "Jonkoso Materials", subtitle: "Textured Fabric Display" }
];

function initHeroSlider() {
  const slides = document.querySelectorAll('#heroSliderSlides .slide');
  if (!slides || slides.length === 0) return;
  startHeroSliderTimer();
}

function startHeroSliderTimer() {
  stopHeroSliderTimer();
  heroSliderTimer = setInterval(() => { moveHeroSlide(1); }, 4500);
}

function stopHeroSliderTimer() {
  if (heroSliderTimer) clearInterval(heroSliderTimer);
}

function setHeroSlide(index) {
  const slides = document.querySelectorAll('#heroSliderSlides .slide');
  const dots = document.querySelectorAll('#heroSliderDots .dot');
  const badgeTitle = document.getElementById('heroBadgeTitle');
  const badgeSubtitle = document.getElementById('heroBadgeSubtitle');

  if (!slides.length) return;
  if (index >= slides.length) currentSlideIndex = 0;
  else if (index < 0) currentSlideIndex = slides.length - 1;
  else currentSlideIndex = index;

  slides.forEach((slide, idx) => {
    if (idx === currentSlideIndex) slide.classList.add('active');
    else slide.classList.remove('active');
  });
  dots.forEach((dot, idx) => {
    if (idx === currentSlideIndex) dot.classList.add('active');
    else dot.classList.remove('active');
  });

  if (badgeTitle && badgeSubtitle && heroSlideBadgeData[currentSlideIndex]) {
    badgeTitle.textContent = heroSlideBadgeData[currentSlideIndex].title;
    badgeSubtitle.textContent = heroSlideBadgeData[currentSlideIndex].subtitle;
  }
  startHeroSliderTimer();
}

function moveHeroSlide(direction) {
  setHeroSlide(currentSlideIndex + direction);
}
