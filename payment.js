// Al Halāl Ventures - Payment & Checkout JavaScript (Supabase-powered)
let pendingCart = [];

document.addEventListener('DOMContentLoaded', async () => {
  loadPendingCart();
  renderCheckoutSummary();
  await autoFillCustomerDetails();
  await loadAndRenderOrderHistory();
});

// Auto-fill form fields from Supabase auth session or localStorage
async function autoFillCustomerDetails() {
  try {
    // Try to get Supabase session
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (session) {
      const user = session.user;
      const name = user.user_metadata?.full_name || '';
      const phone = user.user_metadata?.phone || '';

      const nameInput = document.getElementById('fullName');
      const phoneInput = document.getElementById('contactPhone');
      if (nameInput && name) nameInput.value = name;
      if (phoneInput && phone) phoneInput.value = phone;

      // Also try to get their saved default address from measurements table
      const { data: meas } = await supabaseClient
        .from('measurements')
        .select('default_address')
        .eq('user_id', user.id)
        .maybeSingle();

      const addressInput = document.getElementById('deliveryAddress');
      if (addressInput && meas?.default_address) addressInput.value = meas.default_address;

    } else {
      // Fall back to localStorage
      const userStr = localStorage.getItem('al_halal_current_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const nameInput = document.getElementById('fullName');
        const phoneInput = document.getElementById('contactPhone');
        const addressInput = document.getElementById('deliveryAddress');
        if (nameInput) nameInput.value = user.name || '';
        if (phoneInput) phoneInput.value = user.phone || '';
        if (addressInput) addressInput.value = user.address || '';
      }
    }
  } catch (e) {
    console.error("Auto-fill error", e);
  }
}

// Load pending order list from Local Storage
function loadPendingCart() {
  const cartData = localStorage.getItem('al_halal_pending_cart');
  if (cartData) {
    try {
      pendingCart = JSON.parse(cartData);
    } catch (e) {
      pendingCart = [];
    }
  }

  if (pendingCart.length === 0) {
    alert("Your order cart is empty. Redirecting back to fabric gallery...");
    window.location.href = "index.html#catalog";
  }
}

// Render Order Summary items and calculate totals
function renderCheckoutSummary() {
  const itemsContainer = document.getElementById('checkoutItemsList');
  const subtotalEl = document.getElementById('summarySubtotal');
  const grandTotalEl = document.getElementById('summaryGrandTotal');

  if (!itemsContainer) return;

  let subtotal = 0;

  itemsContainer.innerHTML = pendingCart.map(item => {
    const itemTotal = item.price * item.qty;
    subtotal += itemTotal;
    return `
      <div class="checkout-summary-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.8rem 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
        <div style="display: flex; align-items: center; gap: 0.8rem;">
          <img src="${item.image}" alt="${item.name}" style="width: 40px; height: 40px; object-fit: cover; border-radius: var(--radius-sm);">
          <div>
            <div style="font-weight: 500; font-size: 0.95rem;">${item.name}</div>
            <small style="color: var(--accent-gold); display: block; font-size: 0.8rem; margin-top: 0.1rem;">₦${item.price.toLocaleString()} x ${item.qty} ${item.unit}${item.qty !== 1 ? 's' : ''}</small>
            ${item.measurements ? `
              <div style="font-size: 0.75rem; color: var(--accent-lavender); margin-top: 0.2rem; border-left: 2px solid var(--accent-gold); padding-left: 0.4rem; line-height: 1.3;">
                Waist: ${item.measurements.waist}" | Length: ${item.measurements.length}" | Thigh: ${item.measurements.thigh}" | Ankle: ${item.measurements.ankle}"
              </div>
            ` : ''}
          </div>
        </div>
        <strong style="font-size: 0.95rem;">₦${itemTotal.toLocaleString()}</strong>
      </div>
    `;
  }).join('');

  const deliveryFee = 3500;
  const grandTotal = subtotal + deliveryFee;
  if (subtotalEl) subtotalEl.textContent = `₦${subtotal.toLocaleString()}`;
  if (grandTotalEl) grandTotalEl.textContent = `₦${grandTotal.toLocaleString()}`;
}

// Load and render order history from Supabase
async function loadAndRenderOrderHistory() {
  const tableBody = document.getElementById('historyTableBody');
  const countBadge = document.getElementById('historyCount');

  if (!tableBody) return;

  try {
    // Try to get current user
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session) {
      // Not logged in — show local order if available
      const localOrders = JSON.parse(localStorage.getItem('al_halal_orders') || '[]');
      renderLocalHistory(localOrders, tableBody, countBadge);
      return;
    }

    // Fetch orders from Supabase for this user
    const { data: orders, error } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!orders || orders.length === 0) {
      if (countBadge) countBadge.textContent = '0 Orders';
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 3rem; color: rgba(255,255,255,0.4);">
            <i class="fa-solid fa-folder-open" style="font-size: 2rem; margin-bottom: 0.5rem; display: block; color: var(--accent-lilac);"></i>
            No orders yet. Your history will appear here after checkout.
          </td>
        </tr>
      `;
      return;
    }

    if (countBadge) countBadge.textContent = `${orders.length} Order${orders.length !== 1 ? 's' : ''}`;

    tableBody.innerHTML = orders.map(order => {
      const items = Array.isArray(order.items) ? order.items : [];
      const itemsDescription = items.map(i => `${i.name} (Qty: ${i.qty})`).join(', ');
      const date = new Date(order.created_at).toLocaleString('en-NG', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      const isVerified = order.status === 'Verified';
      return `
        <tr>
          <td class="text-gold" style="font-weight: 600;">#${order.order_code}</td>
          <td>${date}</td>
          <td style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${itemsDescription}">${itemsDescription}</td>
          <td style="font-weight: 600;">₦${order.grand_total.toLocaleString()}</td>
          <td>${order.payment_ref || 'N/A'}</td>
          <td>
            <span class="status-badge ${isVerified ? 'status-verified' : 'status-pending'}">
              <i class="fa-solid ${isVerified ? 'fa-circle-check' : 'fa-clock fa-spin'}" style="font-size: 0.75rem; margin-right: 0.2rem;"></i>
              ${order.status}
            </span>
          </td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    console.error("Error loading order history:", err);
    const localOrders = JSON.parse(localStorage.getItem('al_halal_orders') || '[]');
    renderLocalHistory(localOrders, tableBody, countBadge);
  }
}

// Fallback renderer for non-logged-in users (localStorage)
function renderLocalHistory(localOrders, tableBody, countBadge) {
  if (countBadge) countBadge.textContent = `${localOrders.length} Order${localOrders.length !== 1 ? 's' : ''}`;
  if (localOrders.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 3rem; color: rgba(255,255,255,0.4);">
          <i class="fa-solid fa-folder-open" style="font-size: 2rem; margin-bottom: 0.5rem; display: block; color: var(--accent-lilac);"></i>
          No transaction history found. <a href="profile.html" style="color: var(--accent-gold);">Log in</a> to see your order history across all devices.
        </td>
      </tr>
    `;
    return;
  }
  const sorted = [...localOrders].reverse();
  tableBody.innerHTML = sorted.map(order => {
    const itemsDescription = order.items.map(i => `${i.name} (Qty: ${i.qty})`).join(', ');
    return `
      <tr>
        <td class="text-gold" style="font-weight: 600;">${order.orderId}</td>
        <td>${order.date}</td>
        <td style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${itemsDescription}</td>
        <td style="font-weight: 600;">₦${order.total.toLocaleString()}</td>
        <td>${order.paymentRef || 'N/A'}</td>
        <td><span class="status-badge status-pending"><i class="fa-solid fa-clock" style="font-size: 0.75rem;"></i> Pending</span></td>
      </tr>
    `;
  }).join('');
}

// Copy account number helper
function copyAccountNumber() {
  navigator.clipboard.writeText("09071351283").then(() => {
    showToast("Account number copied!");
  }).catch(err => console.error("Failed to copy text", err));
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }
}

// Form validation trigger
function triggerCheckoutForm() {
  const hiddenSubmit = document.getElementById('hiddenSubmitBtn');
  if (hiddenSubmit) hiddenSubmit.click();
}

// Handle final form submit — Save to Supabase and open WhatsApp
async function processOrderCheckout(e) {
  e.preventDefault();

  const fullName = document.getElementById('fullName').value.trim();
  const contactPhone = document.getElementById('contactPhone').value.trim();
  const altPhone = document.getElementById('altPhone').value.trim() || "None";
  const deliveryAddress = document.getElementById('deliveryAddress').value.trim();
  const paymentRef = document.getElementById('paymentRef').value.trim();

  // Calculate Totals
  let subtotal = 0;
  pendingCart.forEach(item => { subtotal += item.price * item.qty; });
  const deliveryFee = 3500;
  const grandTotal = subtotal + deliveryFee;

  // Generate order reference
  const randNum = Math.floor(100000 + Math.random() * 900000);
  const orderCode = `AHV-${randNum}`;
  const now = new Date();
  const dateString = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Get current user ID (if logged in)
  let userId = null;
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) userId = session.user.id;
  } catch (e) {}

  // Build Supabase order record
  const orderRecord = {
    order_code: orderCode,
    user_id: userId,
    customer_name: fullName,
    customer_phone: contactPhone,
    alt_phone: altPhone,
    delivery_address: deliveryAddress,
    payment_ref: paymentRef,
    items: pendingCart.map(item => ({
      id: item.id,
      name: item.name,
      qty: item.qty,
      unit: item.unit,
      price: item.price,
      measurements: item.measurements || null
    })),
    subtotal: subtotal,
    delivery_fee: deliveryFee,
    grand_total: grandTotal,
    status: 'Pending Verification'
  };

  // Save to Supabase
  let savedToCloud = false;
  try {
    const { error } = await supabaseClient.from('orders').insert(orderRecord);
    if (!error) savedToCloud = true;
    else console.warn("Supabase insert error:", error.message);
  } catch (err) {
    console.warn("Could not save to Supabase:", err);
  }

  // Also save locally as a backup
  const localRecord = {
    orderId: orderCode, date: dateString, items: pendingCart,
    subtotal, deliveryFee, total: grandTotal,
    fullName, contactPhone, altPhone, deliveryAddress, paymentRef
  };
  const localOrders = JSON.parse(localStorage.getItem('al_halal_orders') || '[]');
  localOrders.push(localRecord);
  localStorage.setItem('al_halal_orders', JSON.stringify(localOrders));

  // Clear cart
  localStorage.removeItem('al_halal_pending_cart');
  localStorage.setItem('al_halal_cart_state', JSON.stringify([]));

  // Build WhatsApp message
  let waMessage = `Hello Al Halāl Ventures! 👋\n\n`;
  waMessage += `I have made a bank transfer payment and would like to verify my order.\n\n`;
  waMessage += `📋 *ORDER ID: ${orderCode}*\n`;
  waMessage += `📅 Date: ${dateString}\n`;
  if (savedToCloud) waMessage += `✅ _Order saved to cloud_\n`;
  waMessage += `\n👤 *CUSTOMER DETAILS:*\n`;
  waMessage += `• Name: *${fullName}*\n`;
  waMessage += `• WhatsApp: ${contactPhone}\n`;
  waMessage += `• Alt Phone: ${altPhone}\n`;
  waMessage += `• Delivery Address: *${deliveryAddress}*\n\n`;
  waMessage += `📦 *ORDER ITEMS:*\n`;
  pendingCart.forEach((item, index) => {
    waMessage += `${index + 1}. *${item.name}* (Qty: ${item.qty} ${item.unit}${item.qty !== 1 ? 's' : ''}) - ₦${(item.price * item.qty).toLocaleString()}\n`;
    if (item.measurements) {
      waMessage += `   📏 _Tailor Specs:_ Waist: ${item.measurements.waist}" | Length: ${item.measurements.length}" | Thigh: ${item.measurements.thigh}" | Ankle: ${item.measurements.ankle}"\n`;
    }
  });
  waMessage += `\n💳 *COST BREAKDOWN:*\n`;
  waMessage += `• Subtotal: ₦${subtotal.toLocaleString()}\n`;
  waMessage += `• Shipping Fee: ₦${deliveryFee.toLocaleString()}\n`;
  waMessage += `• *Grand Total: ₦${grandTotal.toLocaleString()}*\n\n`;
  waMessage += `🔑 *BANK DETAILS REFERENCE:*\n`;
  waMessage += `• Transfer Sender/Ref Name: *${paymentRef}*\n`;
  waMessage += `• Destination Account: Access Bank (09071351283)\n\n`;
  waMessage += `*(I will send the payment receipt/screenshot directly below this message)*`;

  const waUrl = `https://wa.me/2349071351283?text=${encodeURIComponent(waMessage)}`;

  alert(`Order ${orderCode} Created Successfully!\nClick OK to open WhatsApp and send your transfer receipt.`);
  window.open(waUrl, '_blank');

  setTimeout(() => { window.location.href = "index.html#home"; }, 1000);
}
