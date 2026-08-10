// Al Halāl Ventures - Admin Dashboard JavaScript
let dbProducts = [];
let allOrders = [];
let isAdminUnlocked = false;

document.addEventListener('DOMContentLoaded', () => {
  checkSessionUnlock();
  if (isAdminUnlocked) {
    initAdminPanel();
  }
});

function checkSessionUnlock() {
  const session = sessionStorage.getItem('al_halal_admin_unlocked');
  if (session === 'true') {
    isAdminUnlocked = true;
    document.getElementById('adminLockScreen').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
  }
}

// Unlock Admin Password verification
function unlockAdminPortal(e) {
  e.preventDefault();
  const password = document.getElementById('adminPass').value;
  
  if (password === 'admin123') {
    isAdminUnlocked = true;
    sessionStorage.setItem('al_halal_admin_unlocked', 'true');
    document.getElementById('adminLockScreen').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    initAdminPanel();
  } else {
    alert("Incorrect password. Access denied.");
  }
}

// Initialise Admin features
function initAdminPanel() {
  loadProductsDB();
  loadOrdersDB();
  renderStats();
  renderPricingList();
  renderOrdersQueue();
  renderMasterRegister();
}

function loadProductsDB() {
  const savedDB = localStorage.getItem('al_halal_products_db');
  if (savedDB) {
    try {
      dbProducts = JSON.parse(savedDB);
    } catch (e) {
      dbProducts = [];
    }
  }
}

function loadOrdersDB() {
  const savedOrders = localStorage.getItem('al_halal_orders');
  if (savedOrders) {
    try {
      allOrders = JSON.parse(savedOrders);
    } catch (e) {
      allOrders = [];
    }
  }
}

// Calculate dashboard analytics metrics
function renderStats() {
  const activeCount = document.getElementById('statProductCount');
  const totalCount = document.getElementById('statTotalOrders');
  const revenueCount = document.getElementById('statTotalRevenue');
  
  if (activeCount) activeCount.textContent = dbProducts.length;
  if (totalCount) totalCount.textContent = allOrders.length;
  
  if (revenueCount) {
    const totalRev = allOrders.reduce((sum, order) => sum + order.total, 0);
    revenueCount.textContent = `₦${totalRev.toLocaleString()}`;
  }
}

// Render dynamic inputs for setting prices
function renderPricingList() {
  const container = document.getElementById('pricingControlsList');
  if (!container) return;
  
  container.innerHTML = dbProducts.map(product => `
    <div class="pricing-control-card" style="background: rgba(0, 0, 0, 0.2); padding: 1.2rem; border-radius: var(--radius-md); border: 1px solid rgba(255, 255, 255, 0.05); display: flex; flex-direction: column; gap: 0.8rem;">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <img src="${product.image}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: var(--radius-sm);">
        <div>
          <strong style="display: block; font-size: 1rem; color: #fff;">${product.name}</strong>
          <small style="opacity: 0.7; color: var(--accent-lavender);">${product.category} | Currently: ₦${product.price.toLocaleString()} per ${product.unit}</small>
        </div>
      </div>
      <div style="display: flex; gap: 1rem; align-items: center; margin-top: 0.3rem;">
        <div style="flex: 1;">
          <input type="number" id="priceInput-${product.id}" value="${product.price}" min="0" placeholder="New price..." style="width: 100%; padding: 0.6rem 1rem; background: rgba(18, 2, 36, 0.6); border: 1px solid var(--glass-border); border-radius: var(--radius-sm); color: #fff;">
        </div>
        <span style="opacity: 0.8;">₦ per ${product.unit}</span>
      </div>
    </div>
  `).join('');
}

// Save pricing configurations
function saveAllPrices() {
  dbProducts = dbProducts.map(product => {
    const input = document.getElementById(`priceInput-${product.id}`);
    if (input) {
      const newPrice = parseFloat(input.value) || 0;
      return { ...product, price: newPrice };
    }
    return product;
  });
  
  localStorage.setItem('al_halal_products_db', JSON.stringify(dbProducts));
  showToast("Prices Published Successfully!");
  renderStats();
  renderPricingList();
}

// Render tailoring card list
function renderOrdersQueue() {
  const container = document.getElementById('adminOrdersQueue');
  if (!container) return;
  
  if (allOrders.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: rgba(255,255,255,0.4);">
        <i class="fa-solid fa-scissors" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
        Tailor queue is empty.
      </div>
    `;
    return;
  }
  
  const sortedOrders = [...allOrders].reverse();
  
  container.innerHTML = sortedOrders.map(order => {
    // Check if order has tailoring measurements
    const hasMeasurements = order.items.some(i => i.measurements !== null);
    
    return `
      <div class="order-queue-card" style="background: var(--bg-card); border: 1px solid var(--glass-border); border-radius: var(--radius-md); padding: 1.5rem; transition: var(--transition); display: flex; flex-direction: column; gap: 0.6rem;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: var(--accent-gold); font-size: 1.05rem;">${order.orderId}</strong>
          <span style="font-size: 0.8rem; opacity: 0.7;">${order.date}</span>
        </div>
        <div>
          <span style="display: block; font-weight: 600; color: #fff;">${order.fullName}</span>
          <span style="font-size: 0.85rem; opacity: 0.85; display: block;"><i class="fa-brands fa-whatsapp text-green"></i> ${order.contactPhone}</span>
        </div>
        
        <div style="border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 0.6rem; margin-top: 0.2rem;">
          <small style="text-transform: uppercase; font-size: 0.65rem; color: var(--accent-lavender); display: block; margin-bottom: 0.3rem;">Fabric Details</small>
          <div style="font-size: 0.9rem; line-height: 1.4;">
            ${order.items.map(i => `• ${i.name} (Qty: <strong>${i.qty} ${i.unit}s</strong>)`).join('<br>')}
          </div>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.05);">
          ${hasMeasurements ? `
            <span style="background: rgba(224, 169, 109, 0.15); color: var(--accent-gold); border: 1px solid rgba(224, 169, 109, 0.25); padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">
              <i class="fa-solid fa-scissors"></i> Custom Specs
            </span>
          ` : `
            <span style="background: rgba(255,255,255,0.05); opacity: 0.6; padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.75rem;">
              No Tailor Specs
            </span>
          `}
          <button onclick="inspectOrder('${order.orderId}')" class="btn" style="background: var(--primary-light); color: #fff; padding: 0.4rem 0.9rem; border-radius: var(--radius-sm); border: none; font-size: 0.8rem; font-weight: 600; cursor: pointer;">
            Inspect
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Inspect tailor coordinates inside modal
function inspectOrder(orderId) {
  const order = allOrders.find(o => o.orderId === orderId);
  if (!order) return;
  
  const inspectContent = document.getElementById('inspectModalContent');
  if (!inspectContent) return;
  
  let html = `
    <p><strong>Customer Name:</strong> ${order.fullName}</p>
    <p><strong>WhatsApp Line:</strong> ${order.contactPhone}</p>
    <p><strong>Alt Phone:</strong> ${order.altPhone || 'None'}</p>
    <p><strong>Address:</strong> ${order.deliveryAddress}</p>
    <p><strong>Payment Sender Ref:</strong> ${order.paymentRef || 'N/A'}</p>
    <p><strong>Order total:</strong> ₦${order.total.toLocaleString()}</p>
    
    <div style="border-top: 1px solid rgba(255,255,255,0.1); margin-top: 1rem; padding-top: 1rem;">
      <h4 style="color: var(--accent-gold); font-family: var(--font-heading); margin-bottom: 0.5rem;">Fabric Items:</h4>
      <ul style="list-style-position: inside; padding-left: 0.5rem; display: flex; flex-direction: column; gap: 0.8rem;">
  `;
  
  order.items.forEach(item => {
    html += `
      <li style="border-bottom: 1px dashed rgba(255,255,255,0.05); padding-bottom: 0.5rem;">
        <strong>${item.name}</strong> - ${item.qty} ${item.unit}${item.qty !== 1 ? 's' : ''}
        ${item.measurements ? `
          <div style="background: rgba(224, 169, 109, 0.1); padding: 0.5rem; border-radius: var(--radius-sm); border-left: 2px solid var(--accent-gold); margin-top: 0.3rem; font-size: 0.85rem;">
            <strong>Trouser Measurements (inches):</strong><br>
            Waist: ${item.measurements.waist}" | Length: ${item.measurements.length}" | Thigh: ${item.measurements.thigh}" | Ankle: ${item.measurements.ankle}"
          </div>
        ` : `<div style="font-size: 0.8rem; opacity: 0.6; margin-top: 0.1rem;">No tailor measurements requested.</div>`}
      </li>
    `;
  });
  
  html += `
      </ul>
    </div>
  `;
  
  inspectContent.innerHTML = html;
  document.getElementById('orderInspectOverlay').style.display = 'flex';
}

function closeInspectModal() {
  document.getElementById('orderInspectOverlay').style.display = 'none';
}

// Render master ledger register tables
function renderMasterRegister() {
  const tableBody = document.getElementById('adminMasterTableBody');
  if (!tableBody) return;
  
  if (allOrders.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 3rem; color: rgba(255,255,255,0.4);">
          No registered orders found.
        </td>
      </tr>
    `;
    return;
  }
  
  const sortedRegister = [...allOrders].reverse();
  
  tableBody.innerHTML = sortedRegister.map(order => {
    const itemsDescription = order.items.map(i => `${i.name} (Qty: ${i.qty})`).join(', ');
    return `
      <tr>
        <td class="text-gold" style="font-weight: 600;">${order.orderId}</td>
        <td>${order.date}</td>
        <td>${order.fullName}</td>
        <td>${order.contactPhone}</td>
        <td style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${itemsDescription}">
          ${itemsDescription}
        </td>
        <td style="font-weight: 600;">₦${order.total.toLocaleString()}</td>
        <td>${order.paymentRef || 'N/A'}</td>
      </tr>
    `;
  }).join('');
}

// Reset Order History
function clearOrdersDatabase() {
  if (confirm("WARNING: This will wipe out all order records and history metrics. Are you sure you want to reset?")) {
    allOrders = [];
    localStorage.removeItem('al_halal_orders');
    initAdminPanel();
    showToast("Database Cleared");
  }
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }
}
