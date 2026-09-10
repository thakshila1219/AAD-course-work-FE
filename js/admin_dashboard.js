document.addEventListener('DOMContentLoaded', () => {

    // 1. Authentication Check & User Profile Setup
    const rawData = localStorage.getItem('user') || localStorage.getItem('loggedUser');
    const token = localStorage.getItem('token');

    if (!rawData || !token) {
        alert("Please login first!");
        window.location.href = 'login.html';
        return;
    }

    const userData = JSON.parse(rawData);
    const user = userData.data ? userData.data : userData;

    // Check Role Flexibly
    let isUserAdmin = false;
    if (user) {
        if (typeof user.role === 'string' && user.role.toUpperCase() === 'ADMIN') {
            isUserAdmin = true;
        } else if (Array.isArray(user.roles)) {
            isUserAdmin = user.roles.some(r => {
                const rName = typeof r === 'string' ? r : (r.roleName || r.name || '');
                return rName.toUpperCase().includes('ADMIN');
            });
        } else if (Array.isArray(user.userRoles)) {
            isUserAdmin = user.userRoles.some(ur => {
                const rName = ur.role ? (ur.role.roleName || ur.role.name || '') : '';
                return rName.toUpperCase().includes('ADMIN');
            });
        }
    }

    if (!isUserAdmin) {
        alert("Access Denied! Only Admins can access this page.");
        window.location.href = 'login.html';
        return;
    }

    // Display Profile Details
    const displayNameElem = document.getElementById('display-user-name');
    if (displayNameElem) {
        displayNameElem.innerText = user.name || user.username || user.email || 'Administrator';
    }

    // API Base Configurations
    const BASE_URL = 'http://localhost:8082/v1';
    let currentEntity = '';

    // Initial Dashboard Data Fetching
    fetchAuditLogs();

    // 2. Navigation Handling
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function () {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            const entity = this.getAttribute('data-entity');
            const isDashboard = this.getAttribute('data-section') === 'admin-dashboard';

            if (isDashboard) {
                currentEntity = '';
                document.getElementById('admin-dashboard').style.display = 'block';
                document.getElementById('admin-entity-section').style.display = 'none';
                document.getElementById('page-title').innerText = "Admin Dashboard";
                document.getElementById('page-subtitle').innerText = "Full System Control & Entity Management";
                fetchAuditLogs();
            } else {
                currentEntity = entity;
                document.getElementById('admin-dashboard').style.display = 'none';
                document.getElementById('admin-entity-section').style.display = 'block';
                document.getElementById('page-title').innerText = entity + " Management";
                document.getElementById('page-subtitle').innerText = `Manage, Edit & Delete ${entity} records`;
                document.getElementById('entity-form-title').innerHTML = `<i class="fa-solid fa-sliders text-primary"></i> ${entity} Configuration`;
                document.getElementById('entity-table-title').innerText = `${entity} Database Records`;

                clearForm();
                fetchEntityData(entity);
            }
        });
    });

    // Helper: Map Entity Names to REST Endpoints
    function getEndpoint(entity) {
        const endpointMap = {
            'Category': 'categories',
            'MenuItem': 'menu-items',
            'DiningTable': 'dining-tables',
            'Reservation': 'reservations',
            'RecipeItem': 'recipe-items',
            'Order': 'orders',
            'OrderDetail': 'order-details',
            'Payment': 'payments',
            'DiscountCoupon': 'discount-coupons',
            'Ingredient': 'ingredients',
            'Supplier': 'suppliers',
            'User': 'users',
            'Role': 'roles',
            'UserRole': 'user-roles',
            'StaffAssignment': 'staff-assignments'
        };
        return endpointMap[entity] || entity.toLowerCase() + 's';
    }

    // Helper: Alert Banners
    function showAlert(msg, isSuccess = true) {
        const alertMsg = document.getElementById('alert-msg');
        if (!alertMsg) return;
        alertMsg.style.display = 'block';
        alertMsg.style.backgroundColor = isSuccess ? '#d4edda' : '#f8d7da';
        alertMsg.style.color = isSuccess ? '#155724' : '#721c24';
        alertMsg.innerText = msg;
        setTimeout(() => alertMsg.style.display = 'none', 3000);
    }

    // 3. GET Operation: Fetch Entity Data
    async function fetchEntityData(entity, query = '') {
        const tbody = document.getElementById('admin-table-body');
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Loading ${entity} data...</td></tr>`;

        try {
            const endpoint = query 
                ? `${BASE_URL}/${getEndpoint(entity)}/filter?query=${encodeURIComponent(query)}`
                : `${BASE_URL}/${getEndpoint(entity)}`;

            const response = await fetch(endpoint, {
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                }
            });

            if (!response.ok) throw new Error('Failed to fetch data');

            const result = await response.json();
            const list = Array.isArray(result) ? result : (result.data || result.body || []);

            tbody.innerHTML = '';
            if (list.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No records found for ${entity}.</td></tr>`;
                return;
            }

            list.forEach(item => {
                const id = item.id || item.code || item[`${entity.toLowerCase()}Id`] || '-';
                const name = item.name || item.title || item.description || item.username || item.userName || '-';
                const detail = item.detail || item.price || item.status || item.amount || item.roleName || '-';
                const status = item.status || 'ACTIVE';

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>#${id}</td>
                    <td>${name}</td>
                    <td><span class="badge ${status === 'ACTIVE' ? 'badge-success' : 'badge-admin'}">${status}</span> (${detail})</td>
                    <td>
                        <button class="btn-sm btn-warning edit-btn" data-id="${id}" data-name="${name}" data-detail="${detail}" data-status="${status}"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-sm btn-danger delete-btn" data-id="${id}"><i class="fa-solid fa-trash"></i></button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            bindTableEvents();
        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:red;">Error loading records. Check backend connection.</td></tr>`;
        }
    }

    // 4. GET Operation: Fetch System Audit Logs
    async function fetchAuditLogs() {
        const tbody = document.getElementById('audit-logs-table-body');
        if (!tbody) return;

        try {
            const response = await fetch(`${BASE_URL}/logs`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Logs API not available');

            const result = await response.json();
            const logs = Array.isArray(result) ? result : (result.data || result.body || []);

            tbody.innerHTML = '';
            if (logs.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No audit logs available.</td></tr>`;
                return;
            }

            logs.forEach(log => {
                tbody.innerHTML += `
                    <tr>
                        <td>#${log.id || log.logId || '-'}</td>
                        <td>${log.username || log.userName || log.user || 'System'}</td>
                        <td>${log.action || log.description || log.message || '-'}</td>
                        <td>${log.timestamp || log.createdAt || '-'}</td>
                    </tr>
                `;
            });
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:gray;">System logs unavailable or endpoint not mapped.</td></tr>`;
        }
    }

    // Search / Filter Button Functionality
    const btnSearch = document.getElementById('btnSearch');
    const searchInput = document.getElementById('search-input');
    if (btnSearch && searchInput) {
        btnSearch.addEventListener('click', () => {
            if (currentEntity) fetchEntityData(currentEntity, searchInput.value.trim());
        });

        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter' && currentEntity) {
                fetchEntityData(currentEntity, searchInput.value.trim());
            }
        });
    }

    // Event Bindings for Dynamic Edit & Delete Buttons
    function bindTableEvents() {
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                document.getElementById('admin-id').value = this.getAttribute('data-id');
                document.getElementById('admin-name').value = this.getAttribute('data-name');
                document.getElementById('admin-detail').value = this.getAttribute('data-detail');
                document.getElementById('admin-status').value = this.getAttribute('data-status');
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const id = this.getAttribute('data-id');
                deleteRecord(id);
            });
        });
    }

    // 5. POST Operation: Save Record
    const btnSave = document.getElementById('btnSave');
    if (btnSave) {
        btnSave.addEventListener('click', async () => {
            if (!currentEntity) return;

            const payload = {
                id: document.getElementById('admin-id').value,
                name: document.getElementById('admin-name').value,
                detail: document.getElementById('admin-detail').value,
                status: document.getElementById('admin-status').value
            };

            try {
                const response = await fetch(`${BASE_URL}/${getEndpoint(currentEntity)}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    showAlert(`${currentEntity} record saved successfully!`);
                    clearForm();
                    fetchEntityData(currentEntity);
                } else {
                    throw new Error('Save operation failed');
                }
            } catch (err) {
                showAlert(err.message, false);
            }
        });
    }

    // 6. PUT Operation: Update Record
    const btnUpdate = document.getElementById('btnUpdate');
    if (btnUpdate) {
        btnUpdate.addEventListener('click', async () => {
            const id = document.getElementById('admin-id').value;
            if (!currentEntity || !id) {
                showAlert('Please select or enter an ID to update', false);
                return;
            }

            const payload = {
                id: id,
                name: document.getElementById('admin-name').value,
                detail: document.getElementById('admin-detail').value,
                status: document.getElementById('admin-status').value
            };

            try {
                const response = await fetch(`${BASE_URL}/${getEndpoint(currentEntity)}/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    showAlert(`${currentEntity} record updated successfully!`);
                    clearForm();
                    fetchEntityData(currentEntity);
                } else {
                    throw new Error('Update operation failed');
                }
            } catch (err) {
                showAlert(err.message, false);
            }
        });
    }

    // 7. DELETE Operation
    async function deleteRecord(id) {
        if (!id) id = document.getElementById('admin-id').value;
        if (!currentEntity || !id) {
            showAlert('Select a record to delete', false);
            return;
        }

        if (!confirm(`Are you sure you want to delete this ${currentEntity} record?`)) return;

        try {
            const response = await fetch(`${BASE_URL}/${getEndpoint(currentEntity)}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                showAlert(`${currentEntity} deleted successfully!`);
                clearForm();
                fetchEntityData(currentEntity);
            } else {
                throw new Error('Delete operation failed');
            }
        } catch (err) {
            showAlert(err.message, false);
        }
    }

    const btnDelete = document.getElementById('btnDelete');
    if (btnDelete) {
        btnDelete.addEventListener('click', () => deleteRecord());
    }

    function clearForm() {
        const form = document.getElementById('admin-crud-form');
        if (form) form.reset();
    }

    // 8. Logout Logic
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'login.html';
        });
    }
});