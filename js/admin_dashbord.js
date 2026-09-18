// ==========================================
// 0. CONFIGURATION & HELPERS
// ==========================================
const BASE_URL = 'http://localhost:8082';

// Dynamic Alert Message Helper Function
function showAlert(message, type = 'success') {
    const alertBox = document.getElementById('alert-msg');
    if (alertBox) {
        alertBox.innerText = message;
        alertBox.style.display = 'block';
        alertBox.style.backgroundColor = type === 'success' ? '#d4edda' : '#f8d7da';
        alertBox.style.color = type === 'success' ? '#155724' : '#721c24';
        alertBox.style.border = `1px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'}`;
        
        setTimeout(() => { alertBox.style.display = 'none'; }, 3000);
    } else {
        alert(message);
    }
}

// Common Headers for API Requests
function getHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("Admin Dashboard JS Successfully Loaded!");

    loadUsers();

    // ==========================================
    // 1. AUTHENTICATION & LOGOUT LOGIC
    // ==========================================
    const rawData = localStorage.getItem('user') || localStorage.getItem('loggedUser');
    if (rawData) {
        try {
            const userData = JSON.parse(rawData);
            const user = userData.data ? userData.data : userData;
            const displayNameElem = document.getElementById('display-user-name');
            if (displayNameElem && user) {
                displayNameElem.innerText = user.name || user.username || user.email || 'Administrator';
            }
        } catch (e) {
            console.error("Error parsing user data:", e);
        }
    }

    // Logout Button Event Listener
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm("Are you sure you want to logout?")) {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = 'login.html';
            }
        });
    }

    // ==========================================
    // 2. SIDEBAR NAVIGATION CLICK LOGIC
    // ==========================================
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function () {
            navItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            const sections = document.querySelectorAll('.admin-section');
            sections.forEach(sec => sec.style.display = 'none');

            const targetSectionId = this.getAttribute('data-section');
            const activeSection = document.getElementById(targetSectionId);

            if (activeSection) {
                activeSection.style.display = 'block';

                const menuName = this.innerText.trim();
                const titleElem = document.getElementById('page-title');
                const subtitleElem = document.getElementById('page-subtitle');
                if (titleElem) titleElem.innerText = menuName;
                if (subtitleElem) subtitleElem.innerText = `Manage system details for ${menuName}`;

                if (targetSectionId === 'users' || targetSectionId === 'users-management') {
                    loadUsers();
                }
            }
        });
    });
});

// Global Form Clear Function
window.clearForm = function(formId) {
    const form = document.getElementById(formId);
    if (form) form.reset();
};

// ==========================================
// 3. FETCH / LOAD FUNCTIONS
// ==========================================

async function loadUsers() {
    const userTableBody = document.querySelector('#system-users-table tbody') || document.querySelector('.admin-section table tbody');
    
    try {
        const response = await fetch(`${BASE_URL}/v1/users`, {
            method: 'GET',
            headers: getHeaders()
        });

        if (response.ok) {
            const result = await response.json();
            const users = Array.isArray(result) ? result : (result.data || []);

            if (userTableBody) {
                userTableBody.innerHTML = ''; 

                if (users.length === 0) {
                    userTableBody.innerHTML = `<tr><td colspan="5" class="text-center">No users found</td></tr>`;
                    return;
                }

                users.forEach(user => {
                    const row = `
                        <tr>
                            <td>${user.userId || user.id || '-'}</td>
                            <td>${user.name || user.fullName || '-'}</td>
                            <td>${user.email || '-'}</td>
                            <td><span class="badge bg-info">${user.role || 'USER'}</span></td>
                            <td>
                                <button class="btn btn-sm btn-warning" onclick="editUser('${user.id || user.userId}')">Edit</button>
                                <button class="btn btn-sm btn-danger" onclick="deleteUser('${user.id || user.userId}')">Delete</button>
                            </td>
                        </tr>
                    `;
                    userTableBody.innerHTML += row;
                });
            }
        } else {
            console.error('Failed to load users');
        }
    } catch (error) {
        console.error('Error fetching users:', error);
    }
}

// ==========================================
// 4. REAL API SAVE FUNCTIONS (Mapped to Controllers)
// ==========================================

// Save Category (URL: http://localhost:8082/v1/categories)
window.saveCategory = async function() {
    const name = document.getElementById('cat-name')?.value;
    const description = document.getElementById('cat-desc')?.value;

    if (!name) return showAlert('Please enter Category Name!', 'error');

    try {
        const response = await fetch(`${BASE_URL}/v1/categories`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ name, description })
        });
        if (response.ok) {
            showAlert('Category saved to Database successfully!');
            clearForm('form-category');
        } else {
            showAlert('Failed to save category!', 'error');
        }
    } catch (error) {
        showAlert('Backend Connection Error!', 'error');
    }
};

// Save Menu Item (URL: http://localhost:8082/v1/menu-items)
window.saveMenuItem = async function() {
    const itemData = {
        code: document.getElementById('menu-id')?.value,
        name: document.getElementById('menu-name')?.value,
        categoryId: document.getElementById('menu-category')?.value,
        price: parseFloat(document.getElementById('menu-price')?.value || 0),
        status: document.getElementById('menu-status')?.value
    };

    if (!itemData.name) return showAlert('Please enter Menu Item Name!', 'error');

    try {
        const response = await fetch(`${BASE_URL}/v1/menu-items`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(itemData)
        });
        if (response.ok) {
            showAlert('Menu Item saved to Database!');
            clearForm('form-menu-item');
        } else {
            showAlert('Failed to save Menu Item!', 'error');
        }
    } catch (error) {
        showAlert('Backend Connection Error!', 'error');
    }
};

// Save Dining Table (URL: http://localhost:8082/v1/dining-tables)
window.saveTable = async function() {
    const tableData = {
        tableNumber: document.getElementById('table-id')?.value,
        capacity: parseInt(document.getElementById('table-capacity')?.value || 0),
        status: document.getElementById('table-status')?.value
    };

    if (!tableData.tableNumber) return showAlert('Please enter Table Number / ID!', 'error');

    try {
        const response = await fetch(`${BASE_URL}/v1/dining-tables`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(tableData)
        });
        if (response.ok) {
            showAlert('Dining Table saved to Database!');
            clearForm('form-table');
        } else {
            showAlert('Failed to save Dining Table!', 'error');
        }
    } catch (error) {
        showAlert('Backend Connection Error!', 'error');
    }
};

// Save Ingredient (URL: http://localhost:8082/v1/ingredients)
window.saveIngredient = async function() {
    const ingData = {
        code: document.getElementById('ing-id')?.value,
        name: document.getElementById('ing-name')?.value,
        quantity: parseFloat(document.getElementById('ing-qty')?.value || 0),
        unit: document.getElementById('ing-unit')?.value
    };

    if (!ingData.name) return showAlert('Please enter Ingredient Name!', 'error');

    try {
        const response = await fetch(`${BASE_URL}/v1/ingredients`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(ingData)
        });
        if (response.ok) {
            showAlert('Ingredient saved to Database!');
            clearForm('form-ingredient');
        } else {
            showAlert('Failed to save Ingredient!', 'error');
        }
    } catch (error) {
        showAlert('Backend Connection Error!', 'error');
    }
};

// Save Supplier (URL: http://localhost:8082/v1/suppliers)
window.saveSupplier = async function() {
    const supplierData = {
        supplierId: document.getElementById('sup-id')?.value,
        name: document.getElementById('sup-name')?.value,
        contactPerson: document.getElementById('sup-contact')?.value,
        phone: document.getElementById('sup-phone')?.value
    };

    if (!supplierData.name) return showAlert('Please enter Supplier Name!', 'error');

    try {
        const response = await fetch(`${BASE_URL}/v1/suppliers`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(supplierData)
        });
        if (response.ok) {
            showAlert('Supplier saved to Database!');
            clearForm('form-supplier');
        } else {
            showAlert('Failed to save Supplier!', 'error');
        }
    } catch (error) {
        showAlert('Backend Connection Error!', 'error');
    }
};

// Save User (URL: http://localhost:8082/v1/users)
window.saveUser = async function() {
    const userData = {
        userId: document.getElementById('usr-id')?.value,
        name: document.getElementById('usr-name')?.value,
        email: document.getElementById('usr-email')?.value,
        role: document.getElementById('usr-role')?.value
    };

    if (!userData.name || !userData.email) return showAlert('Please fill required fields!', 'error');

    try {
        const response = await fetch(`${BASE_URL}/v1/users`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(userData)
        });
        if (response.ok) {
            showAlert('User saved to Database!');
            clearForm('form-user');
            loadUsers(); 
        } else {
            showAlert('Failed to save User!', 'error');
        }
    } catch (error) {
        showAlert('Backend Connection Error!', 'error');
    }
};