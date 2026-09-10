document.addEventListener('DOMContentLoaded', () => {

    const BASE_URL = 'http://localhost:8082/api/v1';
    let rawToken = localStorage.getItem('token');

    console.log("Current Token in LocalStorage:", rawToken); 

    if (!rawToken || rawToken === "undefined" || rawToken === "null") {
        console.warn('No valid token found. Redirecting to login...');
        window.location.href = 'login.html';
        return;
    }

    let authHeader = rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken.trim()}`;

    // Live Clock Display
    setInterval(() => {
        const timeElement = document.getElementById('current-time');
        if (timeElement) {
            timeElement.innerText = new Date().toLocaleTimeString();
        }
    }, 1000);

    // 2. Load User Info
    const storedUser = localStorage.getItem('user') || localStorage.getItem('loggedUser');
    let nameToShow = 'User';

    if (storedUser) {
        try {
            const uObj = JSON.parse(storedUser);
            nameToShow = uObj.name || uObj.username || uObj.fullName || uObj.email || nameToShow;
        } catch (e) {
            nameToShow = storedUser;
        }
    }

    const displayUser = document.getElementById('display-user');
    const userWelcomeMsg = document.getElementById('userWelcomeMsg');

    if (displayUser) displayUser.innerText = nameToShow;
    if (userWelcomeMsg) userWelcomeMsg.innerText = `Welcome Back, ${nameToShow}!`;

    // 3. Navigation Controls
    window.showSection = function(sectionId) {
        const mainViews = document.querySelectorAll('.main-dashboard-view');
        const contentViews = document.querySelectorAll('.content-view');

        if (sectionId === 'dashboard-section' || !sectionId) {
            mainViews.forEach(v => v.style.display = 'block');
            contentViews.forEach(v => v.style.display = 'none');
            fetchDashboardMetrics();
        } else {
            mainViews.forEach(v => v.style.display = 'none');
            contentViews.forEach(v => v.style.display = 'none');

            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.style.display = 'block';
            }
        }
    };

    window.showDashboard = function() {
        showSection('dashboard-section');
    };

    // Button Event Bindings
    const btnViewMenu = document.getElementById('btnViewMenu');
    const btnViewOrders = document.getElementById('btnViewOrders');

    if (btnViewMenu) {
        btnViewMenu.addEventListener('click', () => {
            showSection('menu-section');
            fetchMenuItems();
        });
    }

    if (btnViewOrders) {
        btnViewOrders.addEventListener('click', () => {
            showSection('orders-section');
            fetchOrders();
        });
    }

    // Generic REST API Helper
    async function apiRequest(endpoint) {
        try {
            const response = await fetch(`${BASE_URL}/${endpoint}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                }
            });
            
            if (response.status === 401 || response.status === 403) {
                console.error(`Unauthorized access for ${endpoint}. Status: ${response.status}`);
                // කෙලින්ම redirect නොකර Console එකේ Error එක සටහන් කරයි.
                return null;
            }

            if (!response.ok) {
                console.error(`API Error for ${endpoint}: ${response.status}`);
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error(`Fetch error for ${endpoint}:`, error);
            return null;
        }
    }

    // 4. Restaurant Backend API Calls
    async function fetchDashboardMetrics() {
        const orders = await apiRequest('orders');
        const tables = await apiRequest('tables');
        const reservations = await apiRequest('reservations');

        const orderList = Array.isArray(orders) ? orders : (orders?.data || []);
        const tableList = Array.isArray(tables) ? tables : (tables?.data || []);
        const resList = Array.isArray(reservations) ? reservations : (reservations?.data || []);

        const orderElem = document.getElementById('dashboard-order-count');
        const tableElem = document.getElementById('dashboard-table-count');
        const resElem = document.getElementById('dashboard-res-count');

        if (orderElem) orderElem.innerText = orderList.length;
        if (tableElem) tableElem.innerText = tableList.length;
        if (resElem) resElem.innerText = resList.length;
    }

    async function fetchMenuItems() {
        const response = await apiRequest('items');
        const menuList = Array.isArray(response) ? response : (response?.data || []);
        const tableBody = document.getElementById('menuTableBody');

        if (tableBody) {
            tableBody.innerHTML = '';
            if (menuList.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="3" style="padding: 20px; text-align: center; color: #94a3b8;">No food items available in the menu.</td></tr>`;
                return;
            }

            menuList.forEach((item, index) => {
                const itemId = item.id || item.itemId || (index + 1);
                const itemName = item.name || item.itemName || item.title || 'N/A';
                const priceVal = item.price ? Number(item.price).toFixed(2) : '0.00';

                const row = `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <td style="padding: 12px;">#${itemId}</td>
                        <td style="padding: 12px;">${itemName}</td>
                        <td style="padding: 12px; color: #4ade80;">LKR ${priceVal}</td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            });
        }
    }

    async function fetchOrders() {
        const response = await apiRequest('orders');
        const orderList = Array.isArray(response) ? response : (response?.data || []);
        const tableBody = document.getElementById('ordersTableBody');

        if (tableBody) {
            tableBody.innerHTML = '';
            if (orderList.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="4" style="padding: 20px; text-align: center; color: #94a3b8;">No orders found.</td></tr>`;
                return;
            }

            orderList.forEach((order, index) => {
                const orderId = order.id || order.orderId || (index + 1);
                const customer = order.customerName || (order.user ? (order.user.name || order.user.username) : 'Customer');
                const totalVal = order.totalAmount || order.total || 0;
                const statusVal = order.status || 'PENDING';

                const row = `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <td style="padding: 12px;">#${orderId}</td>
                        <td style="padding: 12px;">${customer}</td>
                        <td style="padding: 12px; color: #4ade80;">LKR ${Number(totalVal).toFixed(2)}</td>
                        <td style="padding: 12px;"><span style="color: #ff758c; font-weight: 600;">${statusVal}</span></td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            });
        }
    }

    // Initial Dashboard Load
    fetchDashboardMetrics();
});

// Logout Function
function logout() {
    localStorage.clear();
    window.location.href = "login.html";
}
