// Al Halāl Ventures - Admin Dashboard JavaScript (Supabase-powered)
let dbProducts = [];
let allOrders = [];
let isAdminUnlocked = false;

document.addEventListener('DOMContentLoaded', () => {
  checkSessionUnlock();
  if (isAdminUnlocked) initAdminPanel();
});

function checkSessionUnlock() {
  const session = sessionStorage.getItem('al_halal_admin_unlocked');
  if (session === 'true') {
    isAdminUnlocked = true;
    document.getElementById('adminLockScreen').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
  }
}

function unlockAdminPortal(e) {
  e.preventDefault();
  const password = document.getElementById('adminPass').value;
  if (password === 'Adeola@1') {
    isAdminUnlocked = true;
    sessionStorage.setItem('al_halal_admin_unlocked', 'true');
    document.getElementById('adminLockScreen').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    initAdminPanel();
  } else {
    alert("Incorrect password. Access denied.");
  }
}

function lockAdminPortal() {
  isAdminUnlocked = false;
  sessionStorage.removeItem('al_halal_admin_unlocked');
  document.getElementById('adminDashboard').style.display = 'none';
  document.getElementById('adminLockScreen').style.display = 'block';
  document.getElementById('adminPass').value = '';
}

async function initAdminPanel() {
  showToast("Loading data from cloud...");
  await loadProductsFromSupabase();
  await loadOrdersFromSupabase();
  renderStats();
  renderPricingList();
  renderOrdersQueue();
  renderMasterRegister();
}

// ---- LOAD FROM SUPABASE ----
async function loadProductsFromSupabase() {
  try {
    const { data, error } = await supabaseClient
      .from('products')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;
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
  } catch (err) {
    console.error("Error loading products:", err);
    // Fall back to localStorage
    const saved = localStorage.getItem('al_halal_products_db');
    if (saved) dbProducts = JSON.parse(saved);
  }
}

async function loadOrdersFromSupabase() {
  try {
    const { data, error } = await supabaseClient
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    // Normalise to match existing UI expectations
    allOrders = data.map(o => ({
      orderId: o.order_code,
      date: new Date(o.created_at).toLocaleString('en-NG', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }),
      fullName: o.customer_name,
      contactPhone: o.customer_phone,
      altPhone: o.alt_phone,
      deliveryAddress: o.delivery_address,
      paymentRef: o.payment_ref,
      items: Array.isArray(o.items) ? o.items : [],
      subtotal: o.subtotal,
      deliveryFee: o.delivery_fee,
      total: o.grand_total,
      status: o.status,
      created_at: o.created_at,
      supabase_id: o.id
    }));
  } catch (err) {
    console.error("Error loading orders:", err);
    // Fall back to localStorage orders
    const saved = localStorage.getItem('al_halal_orders');
    if (saved) allOrders = JSON.parse(saved);
  }
}

// ---- STATS ----
function renderStats() {
  const activeCount = document.getElementById('statProductCount');
  const totalCount = document.getElementById('statTotalOrders');
  const revenueCount = document.getElementById('statTotalRevenue');

  if (activeCount) activeCount.textContent = dbProducts.length;
  if (totalCount) totalCount.textContent = allOrders.length;
  if (revenueCount) {
    const totalRev = allOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    revenueCount.textContent = `₦${totalRev.toLocaleString()}`;
  }
}

// ---- PRICING CONTROLS ----
function renderPricingList() {
  const container = document.getElementById('pricingControlsList');
  if (!container) return;

  container.innerHTML = dbProducts.map(product => `
    <div class="pricing-control-card" style="background: rgba(0,0,0,0.2); padding: 1.2rem; border-radius: var(--radius-md); border: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; gap: 0.8rem;">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <img src="${product.image}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: var(--radius-sm);">
        <div>
          <strong style="display: block; font-size: 1rem; color: #fff;">${product.name}</strong>
          <small style="opacity: 0.7; color: var(--accent-lavender);">${product.category} | Currently: ₦${product.price.toLocaleString()} per ${product.unit}</small>
        </div>
      </div>
      <div style="display: flex; gap: 1rem; align-items: center; margin-top: 0.3rem;">
        <div style="flex: 1;">
          <input type="number" id="priceInput-${product.id}" value="${product.price}" min="0" placeholder="New price..."
            style="width: 100%; padding: 0.6rem 1rem; background: rgba(18,2,36,0.6); border: 1px solid var(--glass-border); border-radius: var(--radius-sm); color: #fff;">
        </div>
        <span style="opacity: 0.8;">₦ per ${product.unit}</span>
      </div>
    </div>
  `).join('');
}

// Save prices to Supabase
async function saveAllPrices() {
  const updates = dbProducts.map(product => {
    const input = document.getElementById(`priceInput-${product.id}`);
    const newPrice = input ? parseInt(input.value) || 0 : product.price;
    return { id: product.id, new_price: newPrice };
  });

  let successCount = 0;
  for (const update of updates) {
    try {
      const { error } = await supabaseClient
        .from('products')
        .update({ price: update.new_price, updated_at: new Date().toISOString() })
        .eq('id', update.id);

      if (!error) {
        successCount++;
        const p = dbProducts.find(p => p.id === update.id);
        if (p) p.price = update.new_price;
      } else {
        console.error(`Failed to update product ${update.id}:`, error.message);
      }
    } catch (err) {
      console.error(`Error updating product ${update.id}:`, err);
    }
  }

  if (successCount === updates.length) {
    showToast(`✅ All ${successCount} prices published to cloud!`);
  } else {
    showToast(`⚠️ ${successCount}/${updates.length} prices saved. Check console for errors.`);
  }

  renderStats();
  renderPricingList();
}

// ---- ORDERS QUEUE ----
function renderOrdersQueue() {
  const container = document.getElementById('adminOrdersQueue');
  if (!container) return;

  if (allOrders.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: rgba(255,255,255,0.4);">
        <i class="fa-solid fa-scissors" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
        Tailor queue is empty. Orders will appear here when customers checkout.
      </div>
    `;
    return;
  }

  container.innerHTML = allOrders.map(order => {
    const hasMeasurements = order.items.some(i => i.measurements != null);
    return `
      <div class="order-queue-card" style="background: var(--bg-card); border: 1px solid var(--glass-border); border-radius: var(--radius-md); padding: 1.5rem; transition: var(--transition); display: flex; flex-direction: column; gap: 0.6rem;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: var(--accent-gold); font-size: 1.05rem;">${order.orderId}</strong>
          <span style="font-size: 0.8rem; opacity: 0.7;">${order.date}</span>
        </div>
        <div>
          <span style="display: block; font-weight: 600; color: #fff;">${order.fullName}</span>
          <span style="font-size: 0.85rem; opacity: 0.85; display: block;"><i class="fa-brands fa-whatsapp" style="color: #25D366;"></i> ${order.contactPhone}</span>
        </div>
        <div style="border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 0.6rem; margin-top: 0.2rem;">
          <small style="text-transform: uppercase; font-size: 0.65rem; color: var(--accent-lavender); display: block; margin-bottom: 0.3rem;">Fabric Details</small>
          <div style="font-size: 0.9rem; line-height: 1.4;">
            ${order.items.map(i => `• ${i.name} (Qty: <strong>${i.qty} ${i.unit}s</strong>)`).join('<br>')}
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.05);">
          ${hasMeasurements ? `
            <span style="background: rgba(224,169,109,0.15); color: var(--accent-gold); border: 1px solid rgba(224,169,109,0.25); padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">
              <i class="fa-solid fa-scissors"></i> Custom Specs
            </span>
          ` : `
            <span style="background: rgba(255,255,255,0.05); opacity: 0.6; padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.75rem;">No Tailor Specs</span>
          `}
          <button onclick="inspectOrder('${order.orderId}')" class="btn" style="background: var(--primary-light); color: #fff; padding: 0.4rem 0.9rem; border-radius: var(--radius-sm); border: none; font-size: 0.8rem; font-weight: 600; cursor: pointer;">
            Inspect
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Inspect order in modal
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
    <p><strong>Order Total:</strong> ₦${order.total.toLocaleString()}</p>
    <p><strong>Status:</strong> <span class="status-badge ${order.status === 'Verified' ? 'status-verified' : 'status-pending'}">${order.status}</span></p>
    <div style="border-top: 1px solid rgba(255,255,255,0.1); margin-top: 1rem; padding-top: 1rem;">
      <h4 style="color: var(--accent-gold); font-family: var(--font-heading); margin-bottom: 0.5rem;">Fabric Items:</h4>
      <ul style="list-style-position: inside; padding-left: 0.5rem; display: flex; flex-direction: column; gap: 0.8rem;">
  `;

  order.items.forEach(item => {
    html += `
      <li style="border-bottom: 1px dashed rgba(255,255,255,0.05); padding-bottom: 0.5rem;">
        <strong>${item.name}</strong> — ${item.qty} ${item.unit}${item.qty !== 1 ? 's' : ''}
        ${item.measurements ? `
          <div style="background: rgba(224,169,109,0.1); padding: 0.5rem; border-radius: var(--radius-sm); border-left: 2px solid var(--accent-gold); margin-top: 0.3rem; font-size: 0.85rem;">
            <strong>Trouser Measurements (inches):</strong><br>
            Waist: ${item.measurements.waist}" | Length: ${item.measurements.length}" | Thigh: ${item.measurements.thigh}" | Ankle: ${item.measurements.ankle}"
          </div>
        ` : `<div style="font-size: 0.8rem; opacity: 0.6; margin-top: 0.1rem;">No tailor measurements requested.</div>`}
      </li>
    `;
  });

  html += `</ul></div>`;
  inspectContent.innerHTML = html;
  document.getElementById('orderInspectOverlay').style.display = 'flex';
}

function closeInspectModal() {
  document.getElementById('orderInspectOverlay').style.display = 'none';
}

// ---- MASTER REGISTER ----
function renderMasterRegister() {
  const tableBody = document.getElementById('adminMasterTableBody');
  if (!tableBody) return;

  if (allOrders.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 3rem; color: rgba(255,255,255,0.4);">No registered orders found in the cloud database.</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = allOrders.map(order => {
    const itemsDescription = order.items.map(i => `${i.name} (Qty: ${i.qty})`).join(', ');
    return `
      <tr>
        <td class="text-gold" style="font-weight: 600;">${order.orderId}</td>
        <td>${order.date}</td>
        <td>${order.fullName}</td>
        <td>${order.contactPhone}</td>
        <td style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${itemsDescription}">${itemsDescription}</td>
        <td style="font-weight: 600;">₦${order.total.toLocaleString()}</td>
        <td>${order.paymentRef || 'N/A'}</td>
      </tr>
    `;
  }).join('');
}

// Refresh all data from cloud
async function refreshFromCloud() {
  showToast("Refreshing from cloud...");
  await loadProductsFromSupabase();
  await loadOrdersFromSupabase();
  renderStats();
  renderPricingList();
  renderOrdersQueue();
  renderMasterRegister();
  showToast("✅ Data refreshed from cloud!");
}

// Clear orders (now clears Supabase too - use carefully!)
async function clearOrdersDatabase() {
  if (confirm("WARNING: This will permanently delete ALL order records from the cloud database. This CANNOT be undone. Are you absolutely sure?")) {
    try {
      const { error } = await supabaseClient.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (!error) {
        allOrders = [];
        localStorage.removeItem('al_halal_orders');
        renderStats();
        renderOrdersQueue();
        renderMasterRegister();
        showToast("⚠️ All orders cleared from cloud.");
      } else {
        showToast("Error clearing: " + error.message);
      }
    } catch (err) {
      showToast("Network error. Check console.");
      console.error(err);
    }
  }
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }
}
