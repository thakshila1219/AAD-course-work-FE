let cart = [];
const BASE_URL = 'http://localhost:8082/api/v1';

document.addEventListener('DOMContentLoaded', () => {

    // Auth Check
    const rawToken = localStorage.getItem('token');
    if (!rawToken) {
        window.location.href = 'login.html';
        return;
    }

    // 1. Check Logged User
    const userStr = localStorage.getItem('user') || localStorage.getItem('loggedUser');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            document.getElementById('loggedUserName').innerText = user.name || user.username || 'Customer';
        } catch (e) {
            document.getElementById('loggedUserName').innerText = userStr;
        }
    }

    // 2. Cart Drawer Controls
    const cartDrawer = document.getElementById('cartDrawer');
    const cartOverlay = document.getElementById('cartOverlay');
    
    document.getElementById('btnCart').addEventListener('click', () => {
        cartDrawer.classList.add('open');
        cartOverlay.classList.add('show');
    });

    document.getElementById('btnCloseCart').addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);

    function closeCart() {
        cartDrawer.classList.remove('open');
        cartOverlay.classList.remove('show');
    }

    // Logout Functionality
    document.getElementById('btnLogout').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'login.html';
    });

    // Load Items
    loadMenuItems();

    // Handle Reservation Submit
    const resForm = document.getElementById('reservationForm');
    if (resForm) {
        resForm.addEventListener('submit', submitReservation);
    }
});

// Headers Helper
function getAuthHeaders() {
    const rawToken = localStorage.getItem('token') || '';
    const cleanToken = rawToken.replace('Bearer ', '').trim();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanToken}`
    };
}

// Fetch Menu Items for Customer
async function loadMenuItems() {
    try {
        const response = await fetch(`${BASE_URL}/items`, {
            headers: getAuthHeaders()
        });

        if (response.status === 401 || response.status === 403) {
            localStorage.clear();
            window.location.href = 'login.html';
            return;
        }

        const data = await response.json();
        const items = Array.isArray(data) ? data : (data?.data || []);
        const menuGrid = document.getElementById('menuGrid');

        if (!menuGrid) return;
        menuGrid.innerHTML = '';

        if (items.length === 0) {
            menuGrid.innerHTML = '<div class="col-12"><p class="text-center text-muted">No menu items available.</p></div>';
            return;
        }

        items.forEach(item => {
            const itemId = item.id || item.itemId;
            const name = item.name || item.itemName || 'Food Item';
            const price = item.price || 0;
            const image = item.image || item.imageUrl || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400';

            const card = `
                <div class="col-md-4 col-lg-3">
                    <div class="card food-card h-100 shadow-sm p-2">
                        <img src="${image}" class="card-img-top rounded" style="height: 180px; object-fit: cover;" alt="${name}">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title fs-6 fw-bold">${name}</h5>
                            <div class="mt-auto d-flex justify-content-between align-items-center pt-2">
                                <span class="fw-bold text-success">Rs. ${Number(price).toFixed(2)}</span>
                                <button class="btn btn-sm btn-warning" onclick="addToCart(${itemId}, '${name.replace(/'/g, "\\'")}', ${price})">
                                    <i class="fa-solid fa-plus"></i> Add
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            menuGrid.innerHTML += card;
        });

    } catch (err) {
        console.error('Error fetching menu:', err);
    }
}

// Add to Cart Logic
function addToCart(id, name, price) {
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ id, name, price, qty: 1 });
    }
    renderCart();
}

// Render Cart Items
function renderCart() {
    const container = document.getElementById('cartItemsContainer');
    const badge = document.getElementById('cartBadge');
    const totalElement = document.getElementById('cartTotal');
    
    container.innerHTML = '';
    let total = 0;
    let count = 0;

    if (cart.length === 0) {
        container.innerHTML = '<p class="text-muted text-center my-4">Cart is empty</p>';
    } else {
        cart.forEach((item, index) => {
            total += item.price * item.qty;
            count += item.qty;
            container.innerHTML += `
                <div class="d-flex justify-content-between align-items-center border-bottom py-2">
                    <div>
                        <h6 class="m-0">${item.name}</h6>
                        <small class="text-muted">Rs. ${item.price} x ${item.qty}</small>
                    </div>
                    <div class="d-flex gap-1 align-items-center">
                        <button class="btn btn-sm btn-outline-secondary px-2" onclick="updateQty(${index}, -1)">-</button>
                        <span>${item.qty}</span>
                        <button class="btn btn-sm btn-outline-secondary px-2" onclick="updateQty(${index}, 1)">+</button>
                    </div>
                </div>
            `;
        });
    }

    badge.innerText = count;
    totalElement.innerText = `Rs. ${total.toFixed(2)}`;
}

function updateQty(index, delta) {
    cart[index].qty += delta;
    if (cart[index].qty <= 0) cart.splice(index, 1);
    renderCart();
}

// Place Customer Order
async function placeCustomerOrder() {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    const userStr = localStorage.getItem('user') || localStorage.getItem('loggedUser');
    let user = null;
    if (userStr) {
        try { user = JSON.parse(userStr); } catch (e) {}
    }
    
    const orderData = {
        userId: user ? (user.id || user.userId) : null,
        items: cart,
        totalAmount: cart.reduce((sum, item) => sum + (item.price * item.qty), 0)
    };

    try {
        const response = await fetch(`${BASE_URL}/orders`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(orderData)
        });

        if (response.ok) {
            alert("Order placed successfully!");
            cart = [];
            renderCart();
            const cartDrawer = document.getElementById('cartDrawer');
            const cartOverlay = document.getElementById('cartOverlay');
            cartDrawer.classList.remove('open');
            cartOverlay.classList.remove('show');
        } else {
            alert("Failed to place the order. Please check backend controllers.");
        }
    } catch (err) {
        console.error(err);
        alert("An error occurred while sending the order!");
    }
}

// Reserve Table
async function submitReservation(e) {
    e.preventDefault();

    const date = document.getElementById('resDate').value;
    const time = document.getElementById('resTime').value;
    const guests = document.getElementById('resGuests').value;

    const userStr = localStorage.getItem('user') || localStorage.getItem('loggedUser');
    let user = null;
    if (userStr) {
        try { user = JSON.parse(userStr); } catch (e) {}
    }

    const reservationData = {
        userId: user ? (user.id || user.userId) : null,
        reservationDate: date,
        reservationTime: time,
        guestCount: guests
    };

    try {
        const response = await fetch(`${BASE_URL}/reservations`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(reservationData)
        });

        if (response.ok) {
            alert("Table reserved successfully!");
            const modalEl = document.getElementById('reservationModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
        } else {
            alert("Failed to reserve table.");
        }
    } catch (err) {
        console.error(err);
        alert("Error occurred while reserving table!");
    }
}