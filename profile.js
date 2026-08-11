/* ==========================================================================
   AL HALAL VENTURES - CUSTOMER ACCOUNT (Supabase Auth)
   ========================================================================== */

let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthState();

  // Listen for auth state changes (login/logout from other tabs)
  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      currentUser = session.user;
      await onUserLoggedIn();
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      localStorage.removeItem('al_halal_current_user');
      showAuthScreen();
    }
  });
});

async function checkAuthState() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    currentUser = session.user;
    await onUserLoggedIn();
  } else {
    showAuthScreen();
  }
}

// Called whenever a user is confirmed as logged in
async function onUserLoggedIn() {
  showProfileDashboard();
  await loadMeasurements();
  await loadOrderHistory();

  // If user was redirected here after clicking Buy Now, take them back to catalog to complete order
  const redirectProductId = localStorage.getItem('al_halal_redirect_product');
  if (redirectProductId) {
    showToast('Signed in successfully! Redirecting to complete your order...');
    setTimeout(() => {
      window.location.href = 'index.html#catalog';
    }, 1000);
  }
}

// ---- AUTH TAB SWITCHING ----
function switchAuthTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const tabLoginBtn = document.getElementById('tabLoginBtn');
  const tabRegisterBtn = document.getElementById('tabRegisterBtn');

  if (tab === 'login') {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    tabLoginBtn.classList.add('active');
    tabRegisterBtn.classList.remove('active');
  } else {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    tabLoginBtn.classList.remove('active');
    tabRegisterBtn.classList.add('active');
  }
}

// ---- LOGIN ----
async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn = event.target.querySelector('button[type="submit"]');

  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing in...';
  btn.disabled = true;

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    showToast('Login failed: ' + error.message, true);
    btn.innerHTML = 'Sign In';
    btn.disabled = false;
    return;
  }

  currentUser = data.user;
  await onUserLoggedIn();
}

// ---- REGISTER ----
async function handleRegister(event) {
  event.preventDefault();
  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const phone = document.getElementById('registerPhone').value.trim();
  const password = document.getElementById('registerPassword').value;
  const btn = event.target.querySelector('button[type="submit"]');

  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating account...';
  btn.disabled = true;

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name, phone: phone }
    }
  });

  if (error) {
    showToast('Registration failed: ' + error.message, true);
    btn.innerHTML = 'Create Account';
    btn.disabled = false;
    return;
  }

  // Check if email confirmation is required
  if (data.user && !data.session) {
    showToast('Account created! Please check your email to confirm your account before logging in.');
    btn.innerHTML = 'Create Account';
    btn.disabled = false;
    return;
  }

  currentUser = data.user;
  await onUserLoggedIn();
}

// ---- LOGOUT ----
async function handleLogout() {
  await supabaseClient.auth.signOut();
  currentUser = null;
  localStorage.removeItem('al_halal_current_user');
  showAuthScreen();
}

// ---- UI VIEWS ----
function showAuthScreen() {
  document.getElementById('authContainer').style.display = 'block';
  document.getElementById('profileContainer').style.display = 'none';
}

function showProfileDashboard() {
  document.getElementById('authContainer').style.display = 'none';
  document.getElementById('profileContainer').style.display = 'block';

  const name = currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'Customer';
  const el = document.getElementById('welcomeUserTitle');
  if (el) el.textContent = `Welcome, ${name.split(' ')[0]}!`;
}

// ---- MEASUREMENTS ----
async function loadMeasurements() {
  if (!currentUser) return;

  const { data, error } = await supabaseClient
    .from('measurements')
    .select('*')
    .eq('user_id', currentUser.id)
    .maybeSingle();

  if (data) {
    document.getElementById('profileWaist').value = data.waist || '';
    document.getElementById('profileLength').value = data.trouser_length || '';
    document.getElementById('profileThigh').value = data.thigh || '';
    document.getElementById('profileAnkle').value = data.ankle || '';
    document.getElementById('profileAddress').value = data.default_address || '';

    // Sync to localStorage so product cart modal can auto-fill
    syncMeasurementsToLocalStorage(data);
  }
}

async function saveMeasurements(event) {
  event.preventDefault();
  if (!currentUser) return;

  const waist = parseFloat(document.getElementById('profileWaist').value) || null;
  const trouser_length = parseFloat(document.getElementById('profileLength').value) || null;
  const thigh = parseFloat(document.getElementById('profileThigh').value) || null;
  const ankle = parseFloat(document.getElementById('profileAnkle').value) || null;
  const default_address = document.getElementById('profileAddress').value.trim();

  const record = {
    user_id: currentUser.id,
    waist,
    trouser_length,
    thigh,
    ankle,
    default_address,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabaseClient
    .from('measurements')
    .upsert(record, { onConflict: 'user_id' });

  if (error) {
    showToast('Error saving: ' + error.message, true);
    return;
  }

  syncMeasurementsToLocalStorage(record);
  showToast('Profile & measurements saved! ✅');
}

function syncMeasurementsToLocalStorage(data) {
  // Used by openTailorModal in script.js for auto-fill
  localStorage.setItem('al_halal_current_user', JSON.stringify({
    id: currentUser?.id,
    name: currentUser?.user_metadata?.full_name || '',
    email: currentUser?.email || '',
    phone: currentUser?.user_metadata?.phone || '',
    address: data.default_address || '',
    measurements: {
      waist: data.waist,
      length: data.trouser_length,
      thigh: data.thigh,
      ankle: data.ankle
    }
  }));
}

// ---- ORDER HISTORY ----
async function loadOrderHistory() {
  if (!currentUser) return;

  const { data: orders, error } = await supabaseClient
    .from('orders')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false });

  const tbody = document.getElementById('profileHistoryTableBody');
  const countEl = document.getElementById('profileHistoryCount');

  if (!orders || orders.length === 0) {
    if (countEl) countEl.textContent = '0 Orders';
    if (tbody) tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2rem; opacity: 0.6;">
          <i class="fa-solid fa-folder-open" style="display: block; font-size: 2rem; margin-bottom: 0.5rem; color: var(--accent-lilac);"></i>
          No orders yet. Your order history will appear here after your first purchase.
        </td>
      </tr>
    `;
    return;
  }

  if (countEl) countEl.textContent = `${orders.length} Order${orders.length !== 1 ? 's' : ''}`;

  if (tbody) {
    tbody.innerHTML = orders.map(order => {
      const items = Array.isArray(order.items) ? order.items : [];
      const itemsList = items.map(i => `${i.name} (${i.qty} ${i.unit})`).join(', ');
      const date = new Date(order.created_at).toLocaleString('en-NG', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      const isVerified = order.status === 'Verified';
      return `
        <tr>
          <td class="text-gold" style="font-weight: 600;">#${order.order_code}</td>
          <td>${date}</td>
          <td style="max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${itemsList}">${itemsList}</td>
          <td style="font-weight: 600;">₦${order.grand_total.toLocaleString()}</td>
          <td>${order.payment_ref}</td>
          <td>
            <span class="status-badge ${isVerified ? 'status-verified' : 'status-pending'}">
              <i class="fa-solid ${isVerified ? 'fa-circle-check' : 'fa-clock'}"></i>
              ${order.status}
            </span>
          </td>
        </tr>
      `;
    }).join('');
  }
}

// ---- TOAST ----
function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.style.background = isError ? 'linear-gradient(135deg, #ff5252, #c62828)' : '';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}
