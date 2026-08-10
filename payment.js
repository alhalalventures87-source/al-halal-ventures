// Al Halāl Ventures - Payment & Checkout JavaScript
let pendingCart = [];
let orderHistory = [];

document.addEventListener('DOMContentLoaded', () => {
  loadPendingCart();
  loadOrderHistory();
  renderCheckoutSummary();
  renderOrderHistoryTable();
});

// Load pending order list from Local Storage
function loadPendingCart() {
  const cartData = localStorage.getItem('al_halal_pending_cart');
  if (cartData) {
    try {
      pendingCart = JSON.parse(cartData);
    } catch (e) {
      console.error("Error parsing pending cart data", e);
      pendingCart = [];
    }
  }
  
  if (pendingCart.length === 0) {
    // If cart is empty, redirect back to index
    alert("Your order cart is empty. Redirecting back to fabric gallery...");
    window.location.href = "index.html#catalog";
  }
}

// Load transaction history list from Local Storage
function loadOrderHistory() {
  const historyData = localStorage.getItem('al_halal_orders');
  if (historyData) {
    try {
      orderHistory = JSON.parse(historyData);
    } catch (e) {
      console.error("Error parsing order history data", e);
      orderHistory = [];
    }
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
            <small style="color: var(--accent-gold); font-size: 0.8rem;">₦${item.price.toLocaleString()} x ${item.qty} ${item.unit}${item.qty !== 1 ? 's' : ''}</small>
          </div>
        </div>
        <strong style="font-size: 0.95rem;">₦${itemTotal.toLocaleString()}</strong>
      </div>
    `;
  }).join('');
  
  const deliveryFee = 3500; // Nationwide Flat Rate
  const grandTotal = subtotal + deliveryFee;
  
  if (subtotalEl) subtotalEl.textContent = `₦${subtotal.toLocaleString()}`;
  if (grandTotalEl) grandTotalEl.textContent = `₦${grandTotal.toLocaleString()}`;
}

// Render local storage transaction records to the table
function renderOrderHistoryTable() {
  const tableBody = document.getElementById('historyTableBody');
  const countBadge = document.getElementById('historyCount');
  
  if (!tableBody) return;
  
  if (countBadge) countBadge.textContent = `${orderHistory.length} Order${orderHistory.length !== 1 ? 's' : ''}`;
  
  if (orderHistory.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 3rem; color: rgba(255,255,255,0.4);">
          <i class="fa-solid fa-folder-open" style="font-size: 2rem; margin-bottom: 0.5rem; display: block; color: var(--accent-lilac);"></i>
          No transaction history found on this browser.
        </td>
      </tr>
    `;
    return;
  }
  
  // Render newest orders first
  const sortedHistory = [...orderHistory].reverse();
  
  tableBody.innerHTML = sortedHistory.map(order => {
    const itemsDescription = order.items.map(i => `${i.name} (Qty: ${i.qty})`).join(', ');
    
    return `
      <tr>
        <td class="text-gold" style="font-weight: 600;">${order.orderId}</td>
        <td>${order.date}</td>
        <td style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${itemsDescription}">
          ${itemsDescription}
        </td>
        <td style="font-weight: 600;">₦${order.total.toLocaleString()}</td>
        <td>${order.paymentRef || 'N/A'}</td>
        <td>
          <span class="status-badge status-pending">
            <i class="fa-solid fa-clock-spin fa-spin" style="font-size: 0.75rem; margin-right: 0.2rem;"></i> Pending Verification
          </span>
        </td>
      </tr>
    `;
  }).join('');
}

// Copy account number helper
function copyAccountNumber() {
  const accountNum = "09071351283";
  navigator.clipboard.writeText(accountNum).then(() => {
    showToast();
  }).catch(err => {
    console.error("Failed to copy text", err);
  });
}

function showToast() {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }
}

// Form validation trigger
function triggerCheckoutForm() {
  const hiddenSubmit = document.getElementById('hiddenSubmitBtn');
  if (hiddenSubmit) {
    hiddenSubmit.click();
  }
}

// Handle final form submit: Save to History and open WhatsApp receipt verification
function processOrderCheckout(e) {
  e.preventDefault();
  
  const fullName = document.getElementById('fullName').value.trim();
  const contactPhone = document.getElementById('contactPhone').value.trim();
  const altPhone = document.getElementById('altPhone').value.trim() || "None";
  const deliveryAddress = document.getElementById('deliveryAddress').value.trim();
  const paymentRef = document.getElementById('paymentRef').value.trim();
  
  // Calculate Totals
  let subtotal = 0;
  pendingCart.forEach(item => {
    subtotal += item.price * item.qty;
  });
  const deliveryFee = 3500;
  const grandTotal = subtotal + deliveryFee;
  
  // Generate random order reference code
  const randNum = Math.floor(100000 + Math.random() * 900000);
  const orderId = `AHV-${randNum}`;
  
  // Date/Time String
  const now = new Date();
  const dateString = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // Create Order Record
  const newOrder = {
    orderId: orderId,
    date: dateString,
    items: pendingCart,
    subtotal: subtotal,
    deliveryFee: deliveryFee,
    total: grandTotal,
    fullName: fullName,
    contactPhone: contactPhone,
    altPhone: altPhone,
    deliveryAddress: deliveryAddress,
    paymentRef: paymentRef
  };
  
  // Add to local history list
  orderHistory.push(newOrder);
  localStorage.setItem('al_halal_orders', JSON.stringify(orderHistory));
  
  // Clear cart keys so cart on main page is emptied (completed order)
  localStorage.removeItem('al_halal_pending_cart');
  
  // Try to empty the main cart in script.js by setting cart key if used there
  // (Main script page uses memory cart array, but on next reload it should check localStorage if it was saved.
  // Currently index.html uses memory, we will let it reset on main page if needed, or we can set an empty cart array in localStorage)
  localStorage.setItem('al_halal_cart_state', JSON.stringify([]));
  
  // Build professional receipt message
  let waMessage = `Hello Al Halāl Ventures! 👋\n\n`;
  waMessage += `I have made a bank transfer payment and would like to verify my order.\n\n`;
  waMessage += `📋 *ORDER ID: ${orderId}*\n`;
  waMessage += `📅 Date: ${dateString}\n\n`;
  
  waMessage += `👤 *CUSTOMER DETAILS:*\n`;
  waMessage += `• Name: *${fullName}*\n`;
  waMessage += `• WhatsApp: ${contactPhone}\n`;
  waMessage += `• Alt Phone: ${altPhone}\n`;
  waMessage += `• Delivery Address: *${deliveryAddress}*\n\n`;
  
  waMessage += `📦 *ORDER ITEMS:*\n`;
  pendingCart.forEach((item, index) => {
    waMessage += `${index + 1}. *${item.name}* (Qty: ${item.qty} ${item.unit}${item.qty !== 1 ? 's' : ''}) - ₦${(item.price * item.qty).toLocaleString()}\n`;
  });
  
  waMessage += `\n💳 *COST BREAKDOWN:*\n`;
  waMessage += `• Subtotal: ₦${subtotal.toLocaleString()}\n`;
  waMessage += `• Shipping Fee: ₦${deliveryFee.toLocaleString()}\n`;
  waMessage += `• *Grand Total: ₦${grandTotal.toLocaleString()}*\n\n`;
  
  waMessage += `🔑 *BANK DETAILS REFERENCE:*\n`;
  waMessage += `• Transfer Sender/Ref Name: *${paymentRef}*\n`;
  waMessage += `• Destination Account: Access Bank (09071351283)\n\n`;
  waMessage += `*(I will send the payment receipt/screenshot directly below this message)*`;
  
  // Format WhatsApp deep link
  const waUrl = `https://wa.me/2349071351283?text=${encodeURIComponent(waMessage)}`;
  
  // Update the UI immediately
  renderOrderHistoryTable();
  
  // Alert and redirect
  alert(`Order ${orderId} Created Successfully!\nClick OK to open WhatsApp and send your transfer receipt.`);
  window.open(waUrl, '_blank');
  
  // Redirect back to fabric gallery after a short delay
  setTimeout(() => {
    window.location.href = "index.html#home";
  }, 1000);
}
