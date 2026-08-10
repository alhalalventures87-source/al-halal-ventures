// Al Halāl Ventures - Customer Profile & Auth Javascript
let usersDB = [];
let currentUser = null;
let allOrders = [];

document.addEventListener('DOMContentLoaded', () => {
  loadUsersDatabase();
  checkUserSession();
  loadAllOrders();
  renderProfileDashboard();
});

// Load registered user list
function loadUsersDatabase() {
  const usersStr = localStorage.getItem('al_halal_users_db');
  if (usersStr) {
    try {
      usersDB = JSON.parse(usersStr);
    } catch(e) {
      usersDB = [];
    }
  }
}

// Load user sessions
function checkUserSession() {
  const userStr = localStorage.getItem('al_halal_current_user');
  if (userStr) {
    try {
      currentUser = JSON.parse(userStr);
    } catch(e) {
      currentUser = null;
    }
  }
}

// Load master orders database
function loadAllOrders() {
  const ordersStr = localStorage.getItem('al_halal_orders');
  if (ordersStr) {
    try {
      allOrders = JSON.parse(ordersStr);
    } catch(e) {
      allOrders = [];
    }
  }
}

// Render Dashboard based on Authentication State
function renderProfileDashboard() {
  const authContainer = document.getElementById('authContainer');
  const profileContainer = document.getElementById('profileContainer');
  const welcomeTitle = document.getElementById('welcomeUserTitle');
  
  if (!authContainer || !profileContainer) return;
  
  if (currentUser) {
    // User is logged in
    authContainer.style.display = "none";
    profileContainer.style.display = "block";
    if (welcomeTitle) welcomeTitle.innerHTML = `<span class="highlight">Welcome, ${currentUser.name}</span>`;
    
    // Fill in saved measurements
    if (currentUser.measurements) {
      document.getElementById('profileWaist').value = currentUser.measurements.waist || "";
      document.getElementById('profileLength').value = currentUser.measurements.length || "";
      document.getElementById('profileThigh').value = currentUser.measurements.thigh || "";
      document.getElementById('profileAnkle').value = currentUser.measurements.ankle || "";
    }
    if (currentUser.address) {
      document.getElementById('profileAddress').value = currentUser.address;
    }
    
    renderCustomerOrders();
  } else {
    // User is logged out
    authContainer.style.display = "block";
    profileContainer.style.display = "none";
  }
}

// Switch between Login and Register Tabs
function switchAuthTab(tab) {
  const tabLogin = document.getElementById('tabLoginBtn');
  const tabRegister = document.getElementById('tabRegisterBtn');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  
  if (tab === 'login') {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
  } else {
    tabLogin.classList.remove('active');
    tabRegister.classList.add('active');
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
  }
}

// Handle Account Register
function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim().toLowerCase();
  const phone = document.getElementById('registerPhone').value.trim();
  const password = document.getElementById('registerPassword').value;
  
  // Check duplicate email
  if (usersDB.some(u => u.email === email)) {
    alert("An account with this email address already exists.");
    return;
  }
  
  const newUser = {
    name: name,
    email: email,
    phone: phone,
    password: password,
    measurements: null,
    address: ""
  };
  
  usersDB.push(newUser);
  localStorage.setItem('al_halal_users_db', JSON.stringify(usersDB));
  
  // Log in user immediately
  currentUser = newUser;
  localStorage.setItem('al_halal_current_user', JSON.stringify(currentUser));
  
  showToast("Account Created Successfully!");
  renderProfileDashboard();
}

// Handle Account Login
function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  
  const user = usersDB.find(u => u.email === email && u.password === password);
  if (!user) {
    alert("Invalid email or password. Please try again.");
    return;
  }
  
  currentUser = user;
  localStorage.setItem('al_halal_current_user', JSON.stringify(currentUser));
  
  showToast("Welcome Back!");
  renderProfileDashboard();
}

// Handle Logout
function handleLogout() {
  currentUser = null;
  localStorage.removeItem('al_halal_current_user');
  renderProfileDashboard();
}

// Save Tailoring specs to profile
function saveMeasurements(e) {
  e.preventDefault();
  if (!currentUser) return;
  
  const waist = parseFloat(document.getElementById('profileWaist').value);
  const length = parseFloat(document.getElementById('profileLength').value);
  const thigh = parseFloat(document.getElementById('profileThigh').value);
  const ankle = parseFloat(document.getElementById('profileAnkle').value);
  const address = document.getElementById('profileAddress').value.trim();
  
  // Update current session user
  currentUser.measurements = {
    waist: waist,
    length: length,
    thigh: thigh,
    ankle: ankle
  };
  currentUser.address = address;
  localStorage.setItem('al_halal_current_user', JSON.stringify(currentUser));
  
  // Update database record
  usersDB = usersDB.map(u => {
    if (u.email === currentUser.email) {
      return { ...u, measurements: currentUser.measurements, address: currentUser.address };
    }
    return u;
  });
  localStorage.setItem('al_halal_users_db', JSON.stringify(usersDB));
  
  showToast("Measurements Profile Saved!");
}

// Render orders relating to this customer account
function renderCustomerOrders() {
  const tableBody = document.getElementById('profileHistoryTableBody');
  const countBadge = document.getElementById('profileHistoryCount');
  
  if (!tableBody) return;
  
  // Filter master order list matching user details
  const myOrders = allOrders.filter(order => 
    order.contactPhone === currentUser.phone || 
    order.fullName.toLowerCase() === currentUser.name.toLowerCase()
  );
  
  if (countBadge) countBadge.textContent = `${myOrders.length} Order${myOrders.length !== 1 ? 's' : ''}`;
  
  if (myOrders.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 3rem; color: rgba(255,255,255,0.4);">
          <i class="fa-solid fa-receipt" style="font-size: 2rem; margin-bottom: 0.5rem; display: block; color: var(--accent-gold);"></i>
          You have not placed any orders yet.
        </td>
      </tr>
    `;
    return;
  }
  
  const sortedOrders = [...myOrders].reverse();
  tableBody.innerHTML = sortedOrders.map(order => {
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
