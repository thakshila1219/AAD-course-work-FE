// ============================================================
// RESTManager - Admin Dashboard JavaScript
// Backend: Spring Boot REST API
// ============================================================

const BASE_URL = "http://localhost:8082";


// ============================================================
// GLOBAL STATE
// ============================================================

let editingCategoryId = null;
let editingMenuItemId = null;
let editingDiningTableId = null;
let editingReservationId = null;
let editingIngredientId = null;
let editingSupplierId = null;
let editingUserId = null;

let menuItemCategories = [];
let reservationUsers = [];
let reservationTables = [];
let reservations = [];
let suppliers = [];


// ============================================================
// DOM READY
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {

    console.log("====================================");
    console.log("Admin Dashboard JavaScript Loaded");
    console.log("Backend:", BASE_URL);
    console.log("====================================");

    setupSidebar();
    setupLogout();
    setupForms();

    loadLoggedUser();

    // Load independently so one failure does not stop others
    await loadDashboard();

    await loadUsers();
    await loadCategories();
    await loadMenuItems();
    await loadDiningTables();
    await loadReservations();
    await loadSuppliers();
    await loadIngredients();
    await loadOrders();

});


// ============================================================
// COMMON HELPERS
// ============================================================

function showAlert(message, type = "success") {

    const alertBox =
        document.getElementById("alert-msg");

    if (!alertBox) {

        console.log(
            `[${type.toUpperCase()}] ${message}`
        );

        return;
    }

    alertBox.textContent = message;
    alertBox.style.display = "block";

    if (type === "success") {

        alertBox.style.background = "#dcfce7";
        alertBox.style.color = "#166534";

    } else {

        alertBox.style.background = "#fee2e2";
        alertBox.style.color = "#991b1b";

    }

    setTimeout(() => {

        alertBox.style.display = "none";

    }, 4000);

}


// ============================================================
// TOKEN
// ============================================================

function getToken() {

    return localStorage.getItem("token");

}


// ============================================================
// HEADERS
// ============================================================

function getHeaders(includeJson = false) {

    const headers = {};

    if (includeJson) {

        headers["Content-Type"] =
            "application/json";

    }

    const token = getToken();

    if (token) {

        headers["Authorization"] =
            `Bearer ${token}`;

    }

    return headers;

}


// ============================================================
// RESPONSE HANDLER
// ============================================================

async function parseResponse(response) {

    const text =
        await response.text();

    if (!text) {

        return {};

    }

    try {

        return JSON.parse(text);

    } catch (error) {

        return {
            message: text
        };

    }

}


// ============================================================
// RESPONSE MESSAGE
// ============================================================

function getResponseMessage(data) {

    if (!data) {

        return "Operation completed.";

    }

    return (
        data.message ||
        data.data?.message ||
        data.statusMessage ||
        "Operation completed successfully."
    );

}


// ============================================================
// ARRAY EXTRACTOR
// ============================================================

function extractArray(data) {

    if (Array.isArray(data)) {

        return data;

    }

    if (
        data &&
        typeof data === "object"
    ) {

        if (Array.isArray(data.data)) {

            return data.data;

        }

        if (Array.isArray(data.content)) {

            return data.content;

        }

        if (Array.isArray(data.result)) {

            return data.result;

        }

        if (Array.isArray(data.items)) {

            return data.items;

        }

        if (
            data.data &&
            typeof data.data === "object" &&
            Array.isArray(data.data.content)
        ) {

            return data.data.content;

        }

        if (
            data.data &&
            typeof data.data === "object" &&
            Array.isArray(data.data.result)
        ) {

            return data.data.result;

        }

        if (
            data.data &&
            typeof data.data === "object" &&
            Array.isArray(data.data.items)
        ) {

            return data.data.items;

        }

        if (
            data.result &&
            typeof data.result === "object" &&
            Array.isArray(data.result.content)
        ) {

            return data.result.content;

        }

    }

    return [];

}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ============================================================
// TABLE ERROR MESSAGE
// ============================================================

function showTableError(
    tableBodyId,
    colspan,
    message
) {

    const tbody =
        document.getElementById(
            tableBodyId
        );

    if (!tbody) {

        console.error(
            `Table body #${tableBodyId} not found.`
        );

        return;

    }

    tbody.innerHTML = `
        <tr>
            <td colspan="${colspan}"
                style="
                    text-align:center;
                    color:#dc2626;
                    padding:20px;
                ">
                ${escapeHtml(message)}
            </td>
        </tr>
    `;

}


// ============================================================
// DATE FORMAT
// ============================================================

function formatDateTime(dateTime) {

    if (!dateTime) {

        return "-";

    }

    try {

        const date =
            new Date(dateTime);

        if (Number.isNaN(date.getTime())) {

            return String(dateTime);

        }

        return date.toLocaleString(
            "en-GB",
            {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false
            }
        );

    } catch (error) {

        console.error(
            "Date formatting error:",
            error
        );

        return String(dateTime);

    }

}


// ============================================================
// DATE FORMAT FOR INPUT
// ============================================================

function formatDateTimeForInput(dateTime) {

    if (!dateTime) {

        return "";

    }

    try {

        const date =
            new Date(dateTime);

        if (Number.isNaN(date.getTime())) {

            return "";

        }

        const year =
            date.getFullYear();

        const month =
            String(
                date.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                date.getDate()
            ).padStart(2, "0");

        const hours =
            String(
                date.getHours()
            ).padStart(2, "0");

        const minutes =
            String(
                date.getMinutes()
            ).padStart(2, "0");

        return `${year}-${month}-${day}T${hours}:${minutes}`;

    } catch (error) {

        console.error(
            "Date formatting error:",
            error
        );

        return "";

    }

}


// ============================================================
// CLEAR FORM
// ============================================================

function clearForm(formId) {

    const form =
        document.getElementById(formId);

    if (!form) return;

    form.reset();


    if (formId === "form-category") {

        editingCategoryId = null;

        const idField =
            document.getElementById("cat-id");

        if (idField) {

            idField.value = "";

        }

    }


    if (formId === "form-menu-item") {

        editingMenuItemId = null;

        const idField =
            document.getElementById("menu-id");

        if (idField) {

            idField.value = "";

        }

    }


    if (formId === "form-table") {

        editingDiningTableId = null;

        const idField =
            document.getElementById("table-db-id");

        if (idField) {

            idField.value = "";

        }

        const cancelBtn =
            document.getElementById(
                "table-cancel-btn"
            );

        if (cancelBtn) {

            cancelBtn.style.display =
                "none";

        }

    }


    if (formId === "form-reservation") {

        editingReservationId = null;

        const idField =
            document.getElementById(
                "reservation-id"
            );

        const userField =
            document.getElementById(
                "reservation-user"
            );

        const tableField =
            document.getElementById(
                "reservation-table"
            );

        const timeField =
            document.getElementById(
                "reservation-time"
            );


        if (idField) {

            idField.value = "";

        }


        if (userField) {

            userField.value = "";

            delete userField.dataset.userId;

        }


        if (tableField) {

            tableField.value = "";

            delete tableField.dataset.tableId;

        }


        if (timeField) {

            timeField.value = "";

        }


        const updateBtn =
            document.getElementById(
                "reservation-update-btn"
            );

        const cancelBtn =
            document.getElementById(
                "reservation-cancel-btn"
            );


        if (updateBtn) {

            updateBtn.style.display =
                "none";

        }


        if (cancelBtn) {

            cancelBtn.style.display =
                "none";

        }

    }


    if (formId === "form-ingredient") {

        editingIngredientId = null;

        const idField =
            document.getElementById("ing-id");

        if (idField) {

            idField.value = "";

        }

    }


    if (formId === "form-supplier") {

        editingSupplierId = null;

        const idField =
            document.getElementById("sup-id");

        if (idField) {

            idField.value = "";

        }

    }


    if (formId === "form-user") {

        editingUserId = null;

        const idField =
            document.getElementById("usr-id");

        if (idField) {

            idField.value = "";

        }

        const password =
            document.getElementById(
                "usr-password"
            );

        if (password) {

            password.value = "";

        }

    }

}


// ============================================================
// SIDEBAR
// ============================================================

function setupSidebar() {

    const navItems =
        document.querySelectorAll(
            ".nav-item"
        );

    navItems.forEach(item => {

        item.addEventListener(
            "click",
            () => {

                const sectionId =
                    item.dataset.section;

                navItems.forEach(nav => {

                    nav.classList.remove(
                        "active"
                    );

                });

                item.classList.add(
                    "active"
                );


                document
                    .querySelectorAll(
                        ".admin-section"
                    )
                    .forEach(section => {

                        section.style.display =
                            "none";

                        section.classList.remove(
                            "active"
                        );

                    });


                const selectedSection =
                    document.getElementById(
                        sectionId
                    );

                if (selectedSection) {

                    selectedSection.style.display =
                        "block";

                    selectedSection.classList.add(
                        "active"
                    );

                }


                updatePageTitle(
                    sectionId
                );

            }
        );

    });

}


// ============================================================
// PAGE TITLE
// ============================================================

function updatePageTitle(sectionId) {

    const title =
        document.getElementById(
            "page-title"
        );

    const subtitle =
        document.getElementById(
            "page-subtitle"
        );


    const titles = {

        "sec-overview": [
            "Admin Dashboard",
            "Full System Control & Entity Management"
        ],

        "sec-category": [
            "Categories",
            "Manage restaurant menu categories"
        ],

        "sec-menu-item": [
            "Menu Items",
            "Manage restaurant menu items"
        ],

        "sec-table": [
            "Dining Tables",
            "Manage restaurant dining tables"
        ],

        "sec-reservation": [
            "Reservations",
            "View and manage customer reservations"
        ],

        "sec-order": [
            "Orders & Details",
            "View and manage customer orders"
        ],

        "sec-ingredient": [
            "Ingredients",
            "Manage restaurant stock and ingredients"
        ],

        "sec-supplier": [
            "Suppliers",
            "Manage ingredient suppliers"
        ],

        "sec-user": [
            "Users Management",
            "Manage system users"
        ],

        "sec-role": [
            "User Roles",
            "System security roles"
        ]

    };


    if (
        titles[sectionId] &&
        title &&
        subtitle
    ) {

        title.textContent =
            titles[sectionId][0];

        subtitle.textContent =
            titles[sectionId][1];

    }

}


// ============================================================
// LOGOUT
// ============================================================

function setupLogout() {

    const logoutButton =
        document.getElementById(
            "btnLogout"
        );

    if (!logoutButton) return;


    logoutButton.addEventListener(
        "click",
        () => {

            localStorage.removeItem(
                "token"
            );

            localStorage.removeItem(
                "user"
            );

            window.location.href =
                "login.html";

        }
    );

}


// ============================================================
// LOGGED USER
// ============================================================

function loadLoggedUser() {

    const userNameElement =
        document.getElementById(
            "display-user-name"
        );

    if (!userNameElement) return;


    const savedUser =
        localStorage.getItem("user");


    if (!savedUser) {

        return;

    }


    try {

        const user =
            JSON.parse(savedUser);

        userNameElement.textContent =
            user.username ||
            user.email ||
            "System Administrator";

    } catch (error) {

        console.error(
            "Unable to read logged user.",
            error
        );

    }

}


// ============================================================
// FORM SETUP
// ============================================================

function setupForms() {

    const forms =
        document.querySelectorAll(
            "form"
        );

    forms.forEach(form => {

        form.addEventListener(
            "submit",
            event => {

                event.preventDefault();

            }
        );

    });

}


// ============================================================
// DASHBOARD
// ============================================================

async function loadDashboard() {

    try {

        const ordersResponse =
            await fetch(
                `${BASE_URL}/v1/orders`,
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );


        const ordersData =
            await parseResponse(
                ordersResponse
            );


        const orders =
            ordersResponse.ok
                ? extractArray(ordersData)
                : [];


        let revenue = 0;


        orders.forEach(order => {

            revenue += Number(
                order.totalAmount || 0
            );

        });


        const usersResponse =
            await fetch(
                `${BASE_URL}/v1/users`,
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );


        const usersData =
            await parseResponse(
                usersResponse
            );


        const users =
            usersResponse.ok
                ? extractArray(usersData)
                : [];


        const ingredientResponse =
            await fetch(
                `${BASE_URL}/v1/ingredient`,
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );


        const ingredientData =
            await parseResponse(
                ingredientResponse
            );


        const ingredients =
            ingredientResponse.ok
                ? extractArray(ingredientData)
                : [];


        let lowStock = 0;


        ingredients.forEach(
            ingredient => {

                const quantity =
                    Number(
                        ingredient.quantityOnHand ||
                        0
                    );


                if (quantity < 10) {

                    lowStock++;

                }

            }
        );


        const revenueElement =
            document.getElementById(
                "dash-revenue"
            );

        const ordersElement =
            document.getElementById(
                "dash-orders"
            );

        const usersElement =
            document.getElementById(
                "dash-users"
            );

        const stockElement =
            document.getElementById(
                "dash-stock"
            );


        if (revenueElement) {

            revenueElement.textContent =
                `Rs. ${revenue.toFixed(2)}`;

        }


        if (ordersElement) {

            ordersElement.textContent =
                orders.length;

        }


        if (usersElement) {

            usersElement.textContent =
                users.length;

        }


        if (stockElement) {

            stockElement.textContent =
                `${lowStock} Items`;

        }


    } catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );

    }

}


// ============================================================
// USERS
// ============================================================

async function loadUsers() {

    try {

        const response =
            await fetch(
                `${BASE_URL}/v1/users`,
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );


        const data =
            await parseResponse(response);


        if (!response.ok) {

            throw new Error(
                getResponseMessage(data)
            );

        }


        const users =
            extractArray(data);


        console.log(
            "Users loaded:",
            users
        );


        reservationUsers =
            users;


        renderUsers(users);


    } catch (error) {

        console.error(
            "Load users error:",
            error
        );


        showTableError(
            "table-user",
            5,
            "Failed to load users: " +
            error.message
        );

    }

}


// ============================================================
// RENDER USERS
// ============================================================

function renderUsers(users) {

    const tbody =
        document.getElementById(
            "table-user"
        );


    if (!tbody) {

        console.error(
            "#table-user not found."
        );

        return;

    }


    tbody.innerHTML = "";


    if (
        !Array.isArray(users) ||
        users.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td colspan="5"
                    style="text-align:center;">
                    No users found.
                </td>
            </tr>
        `;

        return;

    }


    users.forEach(user => {

        const userId =
            user.userId ??
            user.id ??
            "";


        const username =
            user.username ??
            "";


        const email =
            user.email ??
            "";


        const role =
            user.role ??
            "CUSTOMER";


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                ${escapeHtml(userId)}
            </td>

            <td>
                ${escapeHtml(username)}
            </td>

            <td>
                ${escapeHtml(email)}
            </td>

            <td>
                ${escapeHtml(role)}
            </td>

            <td>

                <button
                    class="btn btn-primary"
                    type="button"
                    onclick="editUser(${Number(userId)})">

                    <i class="fa-solid fa-pen"></i>

                </button>

                <button
                    class="btn btn-danger"
                    type="button"
                    onclick="deleteUser(${Number(userId)})">

                    <i class="fa-solid fa-trash"></i>

                </button>

            </td>

        `;


        tbody.appendChild(row);

    });

}


// ============================================================
// SAVE USER
// ============================================================

async function saveUser() {

    const id =
        document.getElementById(
            "usr-id"
        )?.value || "";


    const username =
        document.getElementById(
            "usr-name"
        )?.value.trim() || "";


    const password =
        document.getElementById(
            "usr-password"
        )?.value || "";


    const email =
        document.getElementById(
            "usr-email"
        )?.value.trim() || "";


    const role =
        document.getElementById(
            "usr-role"
        )?.value || "CUSTOMER";


    if (!username || !email) {

        showAlert(
            "Username and email are required.",
            "error"
        );

        return;

    }


    const user = {

        username: username,

        email: email,

        role: role

    };


    if (password) {

        user.password =
            password;

    }


    if (id) {

        user.userId =
            Number(id);

    }


    try {

        const method =
            id ? "PUT" : "POST";


        const response =
            await fetch(
                `${BASE_URL}/v1/users`,
                {
                    method: method,
                    headers: getHeaders(true),
                    body: JSON.stringify(user)
                }
            );


        const data =
            await parseResponse(response);


        if (!response.ok) {

            throw new Error(
                getResponseMessage(data)
            );

        }


        showAlert(
            id
                ? "User updated successfully."
                : "User saved successfully."
        );


        clearForm("form-user");


        await loadUsers();
        await loadDashboard();


    } catch (error) {

        console.error(
            "Save user error:",
            error
        );


        showAlert(
            "Failed to save user: " +
            error.message,
            "error"
        );

    }

}


// ============================================================
// EDIT USER
// ============================================================

async function editUser(id) {

    try {

        const response =
            await fetch(
                `${BASE_URL}/v1/users`,
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );


        const data =
            await parseResponse(response);


        if (!response.ok) {

            throw new Error(
                getResponseMessage(data)
            );

        }


        const users =
            extractArray(data);


        const user =
            users.find(
                u =>
                    Number(u.userId) ===
                    Number(id)
            );


        if (!user) {

            showAlert(
                "User not found.",
                "error"
            );

            return;

        }


        document.getElementById(
            "usr-id"
        ).value =
            user.userId || "";


        document.getElementById(
            "usr-name"
        ).value =
            user.username || "";


        document.getElementById(
            "usr-email"
        ).value =
            user.email || "";


        document.getElementById(
            "usr-role"
        ).value =
            user.role || "CUSTOMER";


        const password =
            document.getElementById(
                "usr-password"
            );


        if (password) {

            password.value = "";

        }


        editingUserId =
            user.userId;


    } catch (error) {

        console.error(
            "Edit user error:",
            error
        );

        showAlert(
            "Failed to load user: " +
            error.message,
            "error"
        );

    }

}


// ============================================================
// DELETE USER
// ============================================================

async function deleteUser(id) {

    if (
        !confirm(
            "Are you sure you want to delete this user?"
        )
    ) {

        return;

    }


    try {

        const response =
            await fetch(
                `${BASE_URL}/v1/users/${id}`,
                {
                    method: "DELETE",
                    headers: getHeaders()
                }
            );


        const data =
            await parseResponse(response);


        if (!response.ok) {

            throw new Error(
                getResponseMessage(data)
            );

        }


        showAlert(
            "User deleted successfully."
        );


        await loadUsers();
        await loadDashboard();


    } catch (error) {

        console.error(
            "Delete user error:",
            error
        );


        showAlert(
            "Failed to delete user: " +
            error.message,
            "error"
        );

    }

}


// ============================================================
// CATEGORIES
// ============================================================

async function loadCategories() {

    try {

        const response =
            await fetch(
                `${BASE_URL}/api/v1/categories`,
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );


        const data =
            await parseResponse(response);


        if (!response.ok) {

            throw new Error(
                getResponseMessage(data)
            );

        }


        const categories =
            extractArray(data);


        console.log(
            "Categories loaded:",
            categories
        );


        menuItemCategories =
            categories;


        renderCategories(categories);

        populateCategoryDropdown(
            categories
        );


    } catch (error) {

        console.error(
            "Load categories error:",
            error
        );


        showTableError(
            "table-category",
            4,
            "Failed to load categories: " +
            error.message
        );

    }

}


// ============================================================
// CATEGORY DROPDOWN
// ============================================================

function populateCategoryDropdown(
    categories
) {

    const select =
        document.getElementById(
            "menu-category"
        );


    if (!select) return;


    select.innerHTML = `
        <option value="">
            Select Category
        </option>
    `;


    categories.forEach(category => {

        const id =
            category.categoryId ??
            category.id;


        const name =
            category.name ??
            category.categoryName ??
            "";


        select.innerHTML += `

            <option value="${escapeHtml(id)}">
                ${escapeHtml(name)}
            </option>

        `;

    });

}


// ============================================================
// RENDER CATEGORIES
// ============================================================

function renderCategories(categories) {

    const tbody =
        document.getElementById(
            "table-category"
        );


    if (!tbody) {

        console.error(
            "#table-category not found."
        );

        return;

    }


    tbody.innerHTML = "";


    if (
        !Array.isArray(categories) ||
        categories.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td colspan="4"
                    style="text-align:center;">
                    No categories found.
                </td>
            </tr>
        `;

        return;

    }


    categories.forEach(category => {

        const id =
            category.categoryId ??
            category.id;


        const name =
            category.name ??
            category.categoryName ??
            "";


        const description =
            category.description ??
            category.desc ??
            "";


        tbody.innerHTML += `

            <tr>

                <td>
                    ${escapeHtml(id)}
                </td>

                <td>
                    ${escapeHtml(name)}
                </td>

                <td>
                    ${escapeHtml(description)}
                </td>

                <td>

                    <button
                        class="btn btn-primary"
                        type="button"
                        onclick="editCategory(${Number(id)})">

                        <i class="fa-solid fa-pen"></i>

                    </button>

                    <button
                        class="btn btn-danger"
                        type="button"
                        onclick="deleteCategory(${Number(id)})">

                        <i class="fa-solid fa-trash"></i>

                    </button>

                </td>

            </tr>

        `;

    });

}


// ============================================================
// SAVE CATEGORY
// ============================================================

async function saveCategory() {

    const id =
        document.getElementById(
            "cat-id"
        )?.value || "";


    const name =
        document.getElementById(
            "cat-name"
        )?.value.trim() || "";


    const description =
        document.getElementById(
            "cat-desc"
        )?.value.trim() || "";


    if (!name) {

        showAlert(
            "Category name is required.",
            "error"
        );

        return;

    }


    const category = {

        name: name,

        description: description

    };


    if (id) {

        category.categoryId =
            Number(id);

    }


    try {

        const response =
            await fetch(
                `${BASE_URL}/api/v1/categories`,
                {
                    method: id ? "PUT" : "POST",
                    headers: getHeaders(true),
                    body: JSON.stringify(category)
                }
            );


        const data =
            await parseResponse(response);


        if (!response.ok) {

            throw new Error(
                getResponseMessage(data)
            );

        }


        showAlert(
            id
                ? "Category updated successfully."
                : "Category saved successfully."
        );


        clearForm("form-category");

        await loadCategories();


    } catch (error) {

        console.error(
            "Save category error:",
            error
        );


        showAlert(
            "Failed to save category: " +
            error.message,
            "error"
        );

    }

}


// ============================================================
// EDIT CATEGORY
// ============================================================

async function editCategory(id) {

    try {

        let category =
            menuItemCategories.find(
                c =>
                    Number(
                        c.categoryId ??
                        c.id
                    ) === Number(id)
            );


        if (!category) {

            const response =
                await fetch(
                   `${BASE_URL}/api/v1/categories`,
                    {
                        method: "GET",
                        headers: getHeaders()
                    }
                );


            const data =
                await parseResponse(response);


            if (!response.ok) {

                throw new Error(
                    getResponseMessage(data)
                );

            }


            const categories =
                extractArray(data);


            category =
                categories.find(
                    c =>
                        Number(
                            c.categoryId ??
                            c.id
                        ) === Number(id)
                );

        }


        if (!category) {

            showAlert(
                "Category not found.",
                "error"
            );

            return;

        }


        fillCategoryForm(category);


    } catch (error) {

        console.error(
            "Edit category error:",
            error
        );


        showAlert(
            "Failed to load category: " +
            error.message,
            "error"
        );

    }

}


// ============================================================
// FILL CATEGORY FORM
// ============================================================

function fillCategoryForm(category) {

    if (!category) return;


    const id =
        category.categoryId ??
        category.id;


    const name =
        category.name ??
        category.categoryName ??
        "";


    const description =
        category.description ??
        category.desc ??
        "";


    const idField =
        document.getElementById("cat-id");

    const nameField =
        document.getElementById("cat-name");

    const descriptionField =
        document.getElementById("cat-desc");


    if (idField) {

        idField.value =
            id || "";

    }


    if (nameField) {

        nameField.value =
            name;

    }


    if (descriptionField) {

        descriptionField.value =
            description;

    }


    editingCategoryId =
        id;

}


// ============================================================
// DELETE CATEGORY
// ============================================================

async function deleteCategory(id) {

    if (
        !confirm(
            "Are you sure you want to delete this category?"
        )
    ) {

        return;

    }


    try {

        const response =
            await fetch(
                `${BASE_URL}/api/v1/categories`,
                {
                    method: "DELETE",
                    headers: getHeaders()
                }
            );


        const data =
            await parseResponse(response);


        if (!response.ok) {

            throw new Error(
                getResponseMessage(data)
            );

        }


        showAlert(
            "Category deleted successfully."
        );


        await loadCategories();


    } catch (error) {

        console.error(
            "Delete category error:",
            error
        );


        showAlert(
            "Failed to delete category: " +
            error.message,
            "error"
        );

    }

}


// ============================================================
// MENU ITEMS
// ============================================================

async function loadMenuItems() {

    try {

        const response =
            await fetch(
                `${BASE_URL}/v1/menu-item`,
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );


        const data =
            await parseResponse(response);


        if (!response.ok) {

            throw new Error(
                getResponseMessage(data)
            );

        }


        const items =
            extractArray(data);


        console.log(
            "Menu items loaded:",
            items
        );


        renderMenuItems(items);


    } catch (error) {

        console.error(
            "Load menu items error:",
            error
        );


        showTableError(
            "table-menu-item",
            6,
            "Failed to load menu items: " +
            error.message
        );

    }

}


// ============================================================
// RENDER MENU ITEMS
// ============================================================

function renderMenuItems(items) {

    const tbody =
        document.getElementById(
            "table-menu-item"
        );


    if (!tbody) {

        console.error(
            "#table-menu-item not found."
        );

        return;

    }


    tbody.innerHTML = "";


    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td colspan="6"
                    style="text-align:center;">
                    No menu items found.
                </td>
            </tr>
        `;

        return;

    }


    items.forEach(item => {

        const id =
            item.itemId ??
            item.menuItemId;


        const categoryName =
            item.category?.name ??
            item.categoryName ??
            findCategoryName(
                item.categoryId
            );


        tbody.innerHTML += `

            <tr>

                <td>
                    ${escapeHtml(id)}
                </td>

                <td>
                    ${escapeHtml(item.name)}
                </td>

                <td>
                    ${escapeHtml(
                        categoryName || "-"
                    )}
                </td>

                <td>
                    Rs.
                    ${Number(
                        item.price || 0
                    ).toFixed(2)}
                </td>

                <td>
                    ${escapeHtml(
                        item.description || ""
                    )}
                </td>

                <td>

                    <button
                        class="btn btn-primary"
                        type="button"
                        onclick="editMenuItem(${Number(id)})">

                        <i class="fa-solid fa-pen"></i>

                    </button>

                    <button
                        class="btn btn-danger"
                        type="button"
                        onclick="deleteMenuItem(${Number(id)})">

                        <i class="fa-solid fa-trash"></i>

                    </button>

                </td>

            </tr>

        `;

    });

}


// ============================================================
// FIND CATEGORY NAME
// ============================================================

function findCategoryName(categoryId) {

    if (!categoryId) return "";


    const category =
        menuItemCategories.find(
            c =>
                Number(
                    c.categoryId ??
                    c.id
                ) === Number(categoryId)
        );


    if (!category) return "";


    return (
        category.name ??
        category.categoryName ??
        ""
    );

}


// ============================================================
// SAVE MENU ITEM
// ============================================================

async function saveMenuItem() {

    const id =
        document.getElementById(
            "menu-id"
        )?.value || "";


    const name =
        document.getElementById(
            "menu-name"
        )?.value.trim() || "";


    const categoryId =
        document.getElementById(
            "menu-category"
        )?.value || "";


    const price =
        document.getElementById(
            "menu-price"
        )?.value || "";


    const description =
        document.getElementById(
            "menu-description"
        )?.value.trim() || "";


    if (
        !name ||
        !categoryId ||
        !price
    ) {

        showAlert(
            "Name, category and price are required.",
            "error"
        );

        return;

    }


    const item = {

        name: name,

        price: Number(price),

        description: description,

        categoryId:
            Number(categoryId)

    };


    if (id) {

        item.itemId =
            Number(id);

    }


    try {

        const response =
            await fetch(
                `${BASE_URL}/v1/menu-item`,
                {
                    method: id ? "PUT" : "POST",
                    headers: getHeaders(true),
                    body: JSON.stringify(item)
                }
            );


        const data =
            await parseResponse(response);


        if (!response.ok) {

            throw new Error(
                getResponseMessage(data)
            );

        }


        showAlert(
            id
                ? "Menu item updated successfully."
                : "Menu item saved successfully."
        );


        clearForm("form-menu-item");

        await loadMenuItems();


    } catch (error) {

        console.error(
            "Save menu item error:",
            error
        );


        showAlert(
            "Failed to save menu item: " +
            error.message,
            "error"
        );

    }

}


// ============================================================
// EDIT MENU ITEM
// ============================================================

async function editMenuItem(id) {

    try {

        const response =
            await fetch(
                `${BASE_URL}/v1/menu-item`,
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );


        const data =
            await parseResponse(response);


        if (!response.ok) {

            throw new Error(
                getResponseMessage(data)
            );

        }


        const items =
            extractArray(data);


        const item =
            items.find(
                i =>
                    Number(
                        i.itemId ??
                        i.menuItemId
                    ) === Number(id)
            );


        if (!item) {

            showAlert(
                "Menu item not found.",
                "error"
            );

            return;

        }


        const itemId =
            item.itemId ??
            item.menuItemId;


        const categoryId =
            item.categoryId ??
            item.category?.categoryId ??
            item.category?.id;


        document.getElementById(
            "menu-id"
        ).value =
            itemId || "";


        document.getElementById(
            "menu-name"
        ).value =
            item.name || "";


        document.getElementById(
            "menu-category"
        ).value =
            categoryId || "";


        document.getElementById(
            "menu-price"
        ).value =
            item.price || "";


        document.getElementById(
            "menu-description"
        ).value =
            item.description || "";


        editingMenuItemId =
            itemId;


    } catch (error) {

        console.error(
            "Edit menu item error:",
            error
        );


        showAlert(
            "Failed to load menu item: " +
            error.message,
            "error"
        );

    }

}


// ============================================================
// DELETE MENU ITEM
// ============================================================

async function deleteMenuItem(id) {

    if (
        !confirm(
            "Are you sure you want to delete this menu item?"
        )
    ) {

        return;

    }


    try {

        const response =
            await fetch(
                `${BASE_URL}/v1/menu-item/${id}`,
                {
                    method: "DELETE",
                    headers: getHeaders()
                }
            );


        const data =
            await parseResponse(response);


        if (!response.ok) {

            throw new Error(
                getResponseMessage(data)
            );

        }


        showAlert(
            "Menu item deleted successfully."
        );


        await loadMenuItems();


    } catch (error) {

        console.error(
            "Delete menu item error:",
            error
        );


        showAlert(
            "Failed to delete menu item: " +
            error.message,
            "error"
        );

    }

}


// ============================================================
// DINING TABLES
// ============================================================

async function loadDiningTables() {

    try {

        const response =
            await fetch(
                `${BASE_URL}/v1/dining-tables`,
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );


        const data =
            await parseResponse(response);


        if (!response.ok) {

            throw new Error(
                getResponseMessage(data)
            );

        }


        const tables =
            extractArray(data);


        console.log(
            "Dining tables loaded:",
            tables
        );


        reservationTables =
            tables;


        renderDiningTables(tables);


        await loadReservationUsers();


    } catch (error) {

        console.error(
            "Load dining tables error:",
            error
        );


        showTableError(
            "table-dining-table",
            5,
            "Failed to load dining tables: " +
            error.message
        );

    }

}


// ============================================================
// RENDER DINING TABLES
// ============================================================

function renderDiningTables(tables) {

    const tbody =
        document.getElementById(
            "table-dining-table"
        );


    if (!tbody) {

        console.error(
            "#table-dining-table not found."
        );

        return;

    }


    tbody.innerHTML = "";


    if (
        !Array.isArray(tables) ||
        tables.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td colspan="5"
                    style="text-align:center;">
                    No dining tables found.
                </td>
            </tr>
        `;

        return;

    }


    tables.forEach(table => {

        const id =
            table.tableId ??
            table.id;


        const tableNumber =
            table.tableNumber ??
            table.number ??
            table.name ??
            "-";


        const capacity =
            table.capacity ??
            table.seatingCapacity ??
            0;


        const status =
            table.status ??
            "AVAILABLE";


        tbody.innerHTML += `

            <tr>

                <td>
                    ${escapeHtml(id)}
                </td>

                <td>
                    ${escapeHtml(tableNumber)}
                </td>

                <td>
                    ${escapeHtml(capacity)}
                </td>

                <td>
                    ${escapeHtml(status)}
                </td>

                <td>

                    <button
                        class="btn btn-primary"
                        type="button"
                        onclick="editTable(${Number(id)})">

                        <i class="fa-solid fa-pen"></i>

                    </button>

                    <button
                        class="btn btn-danger"
                        type="button"
                        onclick="deleteTable(${Number(id)})">

                        <i class="fa-solid fa-trash"></i>

                    </button>

                </td>

            </tr>

        `;

    });

}


// ============================================================
// SAVE TABLE
// ============================================================

async function saveTable() {

    const id =
        document.getElementById(
            "table-db-id"
        )?.value || "";


    const tableNumber =
        document.getElementById(
            "table-id"
        )?.value.trim() || "";


    const capacity =
        document.getElementById(
            "table-capacity"
        )?.value || "";


    const status =
        document.getElementById(
            "table-status"
        )?.value || "AVAILABLE";


    if (
        !tableNumber ||
        !capacity
    ) {

        showAlert(
            "Table number and capacity are required.",
            "error"
        );

        return;

    }


    const table = {

        tableNumber: tableNumber,

        capacity:
            Number(capacity),

        status: status

    };


    if (id) {

        table.tableId =
            Number(id);

    }


    try {

        const response =
            await fetch(
                `${BASE_URL}/v1/dining-tables`,
                {
                    method: id ? "PUT" : "POST",
                    headers: getHeaders(true),
                    body: JSON.stringify(table)
                }
            );


        const data =
            await parseResponse(response);


        if (!response.ok) {

            throw new Error(
                getResponseMessage(data)
            );

        }


        showAlert(
            id
                ? "Dining table updated successfully."
                : "Dining table saved successfully."
        );


        clearForm("form-table");

        await loadDiningTables();


    } catch (error) {

        console.error(
            "Save table error:",
            error
        );


        showAlert(
            "Failed to save table: " +
            error.message,
            "error"
        );

    }

}


// ============================================================
// EDIT TABLE
// ============================================================

async function editTable(id) {

    try {

        const response =
            await fetch(
                `${BASE_URL}/v1/dining-tables`,
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );


        const data =
            await parseResponse(response);


        if (!response.ok) {

            throw new Error(
                getResponseMessage(data)
            );

        }


        const tables =
            extractArray(data);


        const table =
            tables.find(
                t =>
                    Number(
                        t.tableId ??
                        t.id
                    ) === Number(id)
            );


        if (!table) {

            showAlert(
                "Dining table not found.",
                "error"
            );

            return;

        }


        document.getElementById(
            "table-db-id"
        ).value =
            table.tableId ??
            table.id;


        document.getElementById(
            "table-id"
        ).value =
            table.tableNumber ??
            table.number ??
            table.name ??
            "";


        document.getElementById(
            "table-capacity"
        ).value =
            table.capacity ??
            table.seatingCapacity ??
            "";


        document.getElementById(
            "table-status"
        ).value =
            table.status ??
            "AVAILABLE";


        editingDiningTableId =
            table.tableId ??
            table.id;


        const cancelBtn =
            document.getElementById(
                "table-cancel-btn"
            );


        if (cancelBtn) {

            cancelBtn.style.display =
                "inline-block";

        }


    } catch (error) {

        console.error(
            "Edit table error:",
            error
        );


        showAlert(
            "Failed to load table: " +
            error.message,
            "error"
        );

    }

}


// ============================================================
// DELETE TABLE
// ============================================================

async function deleteTable(id) {

    if (
        !confirm(
            "Are you sure you want to delete this dining table?"
        )
    ) {

        return;

    }


    try {

        const response =
            await fetch(
                `${BASE_URL}/v1/dining-tables/${id}`,
                {
                    method: "DELETE",
                    headers: getHeaders()
                }
            );


        const data =
            await parseResponse(response);


        if (!response.ok) {

            throw new Error(
                getResponseMessage(data)
            );

        }


        showAlert(
            "Dining table deleted successfully."
        );


        await loadDiningTables();


    } catch (error) {

        console.error(
            "Delete table error:",
            error
        );


        showAlert(
            "Failed to delete table: " +
            error.message,
            "error"
        );

    }

}


// ============================================================
// RESERVATION USERS
// ============================================================

async function loadReservationUsers() {

    try {

        const response =
            await fetch(
                `${BASE_URL}/v1/users`,
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );


        const data =
            await parseResponse(response);


        if (!response.ok) {

            throw new Error(
                getResponseMessage(data)
            );

        }


        reservationUsers =
            extractArray(data);


    } catch (error) {

        console.error(
            "Load reservation users error:",
            error
        );

    }

}


// ============================================================
// RESERVATIONS
// ============================================================

async function loadReservations() {

    try {

        const response =
            await fetch(
                `${BASE_URL}/v1/reservations`,
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );


        const data =
            await parseResponse(response);


        if (!response.ok) {

            throw new Error(
                getResponseMessage(data)
            );

        }


        reservations =
            extractArray(data);


        console.log(
            "Reservations loaded:",
            reservations
        );


        renderReservations(
            reservations
        );


    } catch (error) {

        console.error(
            "Load reservations error:",
            error
        );


        showTableError(
            "table-reservation",
            6,
            "Failed to load reservations: " +
            error.message
        );

    }

}


// ============================================================
// RENDER RESERVATIONS
// ============================================================

function renderReservations(
    reservationList
) {

    const tbody =
        document.getElementById(
            "table-reservation"
        );


    if (!tbody) {

        console.error(
            "#table-reservation not found."
        );

        return;

    }


    tbody.innerHTML = "";


    if (
        !Array.isArray(reservationList) ||
        reservationList.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td colspan="6"
                    style="text-align:center;">
                    No reservations found.
                </td>
            </tr>
        `;

        return;

    }


    reservationList.forEach(
        reservation => {

            const id =
                reservation.reservationId;


            const username =
                reservation.username ||
                findUserName(
                    reservation.userId
                ) ||
                `User #${reservation.userId}`;


            const tableNumber =
                reservation.tableNumber ||
                findTableNumber(
                    reservation.tableId
                ) ||
                `Table #${reservation.tableId}`;


            const status =
                reservation.status ||
                "PENDING";


            const reservationTime =
                formatDateTime(
                    reservation.reservationTime
                );


            tbody.innerHTML += `

                <tr>

                    <td>
                        ${escapeHtml(id)}
                    </td>

                    <td>
                        ${escapeHtml(username)}
                    </td>

                    <td>
                        ${escapeHtml(tableNumber)}
                    </td>

                    <td>
                        ${escapeHtml(reservationTime)}
                    </td>

                    <td>
                        ${escapeHtml(status)}
                    </td>

                    <td>

                        <button
                            class="btn btn-primary"
                            type="button"
                            onclick="editReservation(${Number(id)})">

                            <i class="fa-solid fa-pen"></i>

                        </button>

                        <button
                            class="btn btn-danger"
                            type="button"
                            onclick="deleteReservation(${Number(id)})">

                            <i class="fa-solid fa-trash"></i>

                        </button>

                    </td>

                </tr>

            `;

        }
    );

}


// ============================================================
// FIND USER NAME
// ============================================================

function findUserName(userId) {

    const user =
        reservationUsers.find(
            u =>
                Number(u.userId) ===
                Number(userId)
        );


    return user?.username || "";

}


// ============================================================
// FIND TABLE NUMBER
// ============================================================

function findTableNumber(tableId) {

    const table =
        reservationTables.find(
            t =>
                Number(
                    t.tableId ??
                    t.id
                ) ===
                Number(tableId)
        );


    if (!table) return "";


    return (
        table.tableNumber ??
        table.number ??
        table.name ??
        ""
    );

}


// ============================================================
// EDIT RESERVATION
// IMPORTANT:
// Backend DOES NOT have GET /v1/reservations/{id}
// ============================================================

async function editReservation(id) {

    try {

        const reservation =
            reservations.find(
                r =>
                    Number(
                        r.reservationId
                    ) === Number(id)
            );


        if (!reservation) {

            showAlert(
                "Reservation not found.",
                "error"
            );

            return;

        }


        editingReservationId =
            reservation.reservationId;


        const idField =
            document.getElementById(
                "reservation-id"
            );


        const userField =
            document.getElementById(
                "reservation-user"
            );


        const tableField =
            document.getElementById(
                "reservation-table"
            );


        const timeField =
            document.getElementById(
                "reservation-time"
            );


        const statusField =
            document.getElementById(
                "reservation-status"
            );


        if (idField) {

            idField.value =
                reservation.reservationId;

        }


        if (userField) {

            if (
                userField.tagName ===
                "SELECT"
            ) {

                userField.value =
                    reservation.userId ?? "";

            } else {

                userField.value =
                    reservation.username ||
                    reservation.userId ||
                    "";


                userField.dataset.userId =
                    reservation.userId ?? "";

            }

        }


        if (tableField) {

            if (
                tableField.tagName ===
                "SELECT"
            ) {

                tableField.value =
                    reservation.tableId ?? "";

            } else {

                tableField.value =
                    reservation.tableNumber ||
                    reservation.tableId ||
                    "";


                tableField.dataset.tableId =
                    reservation.tableId ?? "";

            }

        }


        if (timeField) {

            timeField.value =
                formatDateTimeForInput(
                    reservation.reservationTime
                );

        }


        if (statusField) {

            statusField.value =
                reservation.status ||
                "PENDING";

        }


        const updateBtn =
            document.getElementById(
                "reservation-update-btn"
            );


        const cancelBtn =
            document.getElementById(
                "reservation-cancel-btn"
            );


        if (updateBtn) {

            updateBtn.style.display =
                "inline-flex";

        }


        if (cancelBtn) {

            cancelBtn.style.display =
                "inline-flex";

        }


        const form =
            document.getElementById(
                "form-reservation"
            );


        if (form) {

            form.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

        }


    } catch (error) {

        console.error(
            "Edit reservation error:",
            error
        );


        showAlert(
            "Failed to load reservation: " +
            error.message,
            "error"
        );

    }

}


// ============================================================
// UPDATE RESERVATION
// PUT /v1/reservations
// ============================================================

async function updateReservation() {

    try {

        const idField =
            document.getElementById(
                "reservation-id"
            );


        const userField =
            document.getElementById(
                "reservation-user"
            );


        const tableField =
            document.getElementById(
                "reservation-table"
            );


        const timeField =
            document.getElementById(
                "reservation-time"
            );


        const statusField =
            document.getElementById(
                "reservation-status"
            );


        const reservationId =
            Number(
                idField?.value || 0
            );


        let userId = 0;

        let tableId = 0;


        if (userField) {

            if (
                userField.tagName ===
                "SELECT"
            ) {

                userId =
                    Number(
                        userField.value
                    );

            } else {

                userId =
                    Number(
                        userField.dataset.userId ||
                        userField.value
                    );

            }

        }


        if (tableField) {

            if (
                tableField.tagName ===
                "SELECT"
            ) {

                tableId =
                    Number(
                        tableField.value
                    );

            } else {

                tableId =
                    Number(
                        tableField.dataset.tableId ||
                        tableField.value
                    );

            }

        }


        const reservationTime =
            timeField?.value || "";


        const status =
            statusField?.value || "";


        if (!reservationId) {

            showAlert(
                "Invalid reservation ID.",
                "error"
            );

            return;

        }


        if (
            !Number.isFinite(userId) ||
            userId <= 0
        ) {

            showAlert(
                "Valid User ID is required.",
                "error"
            );

            return;

        }


        if (
            !Number.isFinite(tableId) ||
            tableId <= 0
        ) {

            showAlert(
                "Valid Table ID is required.",
                "error"
            );

            return;

        }


        if (!reservationTime) {

            showAlert(
                "Reservation time is required.",
                "error"
            );

            return;

        }


        if (!status) {

            showAlert(
                "Reservation status is required.",
                "error"
            );

            return;

        }


        const payload = {

            reservationId:
                reservationId,

            reservationTime:
                reservationTime,

            status:
                status,

            userId:
                userId,

            tableId:
                tableId

        };


        console.log(
            "Updating reservation:",
            payload
        );


        const response =
            await fetch(
                `${BASE_URL}/v1/reservations`,
                {
                    method: "PUT",
                    headers: getHeaders(true),
                    body: JSON.stringify(
                        payload
                    )
                }
            );


        const result =
            await parseResponse(response);


        if (!response.ok) {

            throw new Error(
                getResponseMessage(result)
            );

        }


        showAlert(
            "Reservation updated successfully.",
            "success"
        );


        clearForm(
            "form-reservation"
        );


        await loadReservations();


    } catch (error) {

        console.error(
            "Update reservation error:",
            error
        );


        showAlert(
            "Failed to update reservation: " +
            error.message,
            "error"
        );

    }

}


// ============================================================
// DELETE RESERVATION
// ============================================================

async function deleteReservation(id) {

    if (
        !confirm(
            "Are you sure you want to delete this reservation?"
        )
    ) {

        return;

    }


    try {

        const response =
            await fetch(
                `${BASE_URL}/v1/reservations/${id}`,
                {
                    method: "DELETE",
                    headers: getHeaders()
                }
            );


        const data =
            await parseResponse(response);


        if (!response.ok) {

            throw new Error(
                getResponseMessage(data)
            );

        }


        showAlert(
            "Reservation deleted successfully."
        );


        await loadReservations();


    } catch (error) {

        console.error(
            "Delete reservation error:",
            error
        );


        showAlert(
            "Failed to delete reservation: " +
            error.message,
            "error"
        );

    }

}


// ============================================================
// SUPPLIERS
// ============================================================

async function loadSuppliers() {

    try {

        const response =
            await fetch(
                `${BASE_URL}/v1/suppliers`,
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );


        const data =
            await parseResponse(response);


        if (!response.ok) {

            throw new Error(
                getResponseMessage(data)
            );

        }


        const supplierList =
            extractArray(data);


        suppliers =
            supplierList;


        renderSuppliers(
            supplierList
        );


        populateSupplierDropdown(
            supplierList
        );


    } catch (error) {

        console.error(
            "Load suppliers error:",
            error
        );


        showTableError(
            "table-supplier",
            5,
            "Failed to load suppliers: " +
            error.message
        );

    }

}


// ============================================================
// SUPPLIER DROPDOWN
// ============================================================

function populateSupplierDropdown(
    supplierList
) {

    const select =
        document.getElementById(
            "ing-supplier"
        );


    if (!select) return;


    select.innerHTML = `
        <option value="">
            Select Supplier
        </option>
    `;


    supplierList.forEach(
        supplier => {

            select.innerHTML += `

                <option
                    value="${escapeHtml(
                        supplier.supplierId
                    )}">

                    ${escapeHtml(
                        supplier.name
                    )}

                </option>

            `;

        }
    );

}


// ============================================================
// RENDER SUPPLIERS
// ============================================================

function renderSuppliers(
    supplierList
) {

    const tbody =
        document.getElementById(
            "table-supplier"
        );


    if (!tbody) {

        console.error(
            "#table-supplier not found."
        );

        return;

    }


    tbody.innerHTML = "";


    if (
        !Array.isArray(supplierList) ||
        supplierList.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td colspan="5"
                    style="text-align:center;">
                    No suppliers found.
                </td>
            </tr>
        `;

        return;

    }


    supplierList.forEach(
        supplier => {

            tbody.innerHTML += `

                <tr>

                    <td>
                        ${escapeHtml(
                            supplier.supplierId
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            supplier.name
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            supplier.contactNumber
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            supplier.email
                        )}
                    </td>

                    <td>

                        <button
                            class="btn btn-primary"
                            type="button"
                            onclick="editSupplier(
                                ${Number(
                                    supplier.supplierId
                                )}
                            )">

                            <i class="fa-solid fa-pen"></i>

                        </button>

                        <button
                            class="btn btn-danger"
                            type="button"
                            onclick="deleteSupplier(
                                ${Number(
                                    supplier.supplierId
                                )}
                            )">

                            <i class="fa-solid fa-trash"></i>

                        </button>

                    </td>

                </tr>

            `;

        }
    );

}


// ============================================================
// SAVE SUPPLIER
// ============================================================

async function saveSupplier() {

    const id =
        document.getElementById(
            "sup-id"
        )?.value || "";


    const name =
        document.getElementById(
            "sup-name"
        )?.value.trim() || "";


    const contactNumber =
        document.getElementById(
            "sup-contact"
        )?.value.trim() || "";


    const email =
        document.getElementById(
            "sup-phone"
        )?.value.trim() || "";


    if (
        !name ||
        !contactNumber ||
        !email
    ) {

        showAlert(
            "Supplier name, contact number and email are required.",
            "error"
        );

        return;

    }


    const supplier = {

        name: name,

        contactNumber:
            contactNumber,

        email: email

    };


    if (id) {

        supplier.supplierId =
            Number(id);

    }


    try {

        const response =
            await fetch(
                `${BASE_URL}/v1/suppliers`,
                {
                    method: id ? "PUT" : "POST",
                    headers: getHeaders(true),
                    body: JSON.stringify(
                        supplier
                    )
                }
            );


        const data =
            await parseResponse(response);


        if (!response.ok) {

            throw new Error(
                getResponseMessage(data)
            );

        }


        showAlert(
            id
                ? "Supplier updated successfully."
                : "Supplier saved successfully."
        );


        clearForm(
            "form-supplier"
        );


        await loadSuppliers();


    } catch (error) {

        console.error(
            "Save supplier error:",
            error
        );


        showAlert(
            "Failed to save supplier: " +
            error.message,
            "error"
        );

    }

}


// ============================================================
// EDIT SUPPLIER
// ============================================================

async function editSupplier(id) {

    const supplier =
        suppliers.find(
            s =>
                Number(
                    s.supplierId
                ) === Number(id)
        );


    if (!supplier) {

        showAlert(
            "Supplier not found.",
            "error"
        );

        return;

    }


    document.getElementById(
        "sup-id"
    ).value =
        supplier.supplierId || "";


    document.getElementById(
        "sup-name"
    ).value =
        supplier.name || "";


    document.getElementById(
        "sup-contact"
    ).value =
        supplier.contactNumber || "";


    document.getElementById(
        "sup-phone"
    ).value =
        supplier.email || "";


    editingSupplierId =
        supplier.supplierId;

}


// ============================================================
// DELETE SUPPLIER
// ============================================================

async function deleteSupplier(id) {

    if (
        !confirm(
            "Are you sure you want to delete this supplier?"
        )
    ) {

        return;

    }


    try {

        const response =
            await fetch(
                `${BASE_URL}/v1/suppliers/${id}`,
                {
                    method: "DELETE",
                    headers: getHeaders()
                }
            );


        const data =
            await parseResponse(response);


        if (!response.ok) {

            throw new Error(
                getResponseMessage(data)
            );

        }


        showAlert(
            "Supplier deleted successfully."
        );


        await loadSuppliers();


    } catch (error) {

        console.error(
            "Delete supplier error:",
            error
        );


        showAlert(
            "Failed to delete supplier: " +
            error.message,
            "error"
        );

    }

}


// ============================================================
// INGREDIENTS
// ============================================================

async function loadIngredients() {

    try {

        const response =
            await fetch(
                `${BASE_URL}/v1/ingredient`,
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );


        const data =
            await parseResponse(response);


        if (!response.ok) {

            throw new Error(
                getResponseMessage(data)
            );

        }


        const ingredients =
            extractArray(data);


        renderIngredients(
            ingredients
        );


    } catch (error) {

        console.error(
            "Load ingredients error:",
            error
        );


        showTableError(
            "table-ingredient",
            6,
            "Failed to load ingredients: " +
            error.message
        );

    }

}


// ============================================================
// RENDER INGREDIENTS
// ============================================================

function renderIngredients(
    ingredients
) {

    const tbody =
        document.getElementById(
            "table-ingredient"
        );


    if (!tbody) {

        console.error(
            "#table-ingredient not found."
        );

        return;

    }


    tbody.innerHTML = "";


    if (
        !Array.isArray(ingredients) ||
        ingredients.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td colspan="6"
                    style="text-align:center;">
                    No ingredients found.
                </td>
            </tr>
        `;

        return;

    }


    ingredients.forEach(
        ingredient => {

            const supplierName =
                findSupplierName(
                    ingredient.supplierId
                );


            tbody.innerHTML += `

                <tr>

                    <td>
                        ${escapeHtml(
                            ingredient.ingredientId
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            ingredient.name
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            ingredient.quantityOnHand
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            ingredient.unit
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            supplierName ||
                            ingredient.supplierId ||
                            "-"
                        )}
                    </td>

                    <td>

                        <button
                            class="btn btn-primary"
                            type="button"
                            onclick="editIngredient(
                                ${Number(
                                    ingredient.ingredientId
                                )}
                            )">

                            <i class="fa-solid fa-pen"></i>

                        </button>

                        <button
                            class="btn btn-danger"
                            type="button"
                            onclick="deleteIngredient(
                                ${Number(
                                    ingredient.ingredientId
                                )}
                            )">

                            <i class="fa-solid fa-trash"></i>

                        </button>

                    </td>

                </tr>

            `;

        }
    );

}


// ============================================================
// FIND SUPPLIER
// ============================================================

function findSupplierName(
    supplierId
) {

    const supplier =
        suppliers.find(
            s =>
                Number(
                    s.supplierId
                ) ===
                Number(supplierId)
        );


    return supplier?.name || "";

}


// ============================================================
// SAVE INGREDIENT
// ============================================================

async function saveIngredient() {

    const id =
        document.getElementById(
            "ing-id"
        )?.value || "";


    const name =
        document.getElementById(
            "ing-name"
        )?.value.trim() || "";


    const quantity =
        document.getElementById(
            "ing-qty"
        )?.value || "";


    const unit =
        document.getElementById(
            "ing-unit"
        )?.value.trim() || "";


    const supplierId =
        document.getElementById(
            "ing-supplier"
        )?.value || "";


    if (
        !name ||
        !quantity ||
        !unit ||
        !supplierId
    ) {

        showAlert(
            "Please fill all ingredient fields.",
            "error"
        );

        return;

    }


    const ingredient = {

        name: name,

        quantityOnHand:
            Number(quantity),

        unit: unit,

        supplierId:
            Number(supplierId)

    };


    if (id) {

        ingredient.ingredientId =
            Number(id);

    }


    try {

        const response =
            await fetch(
                `${BASE_URL}/v1/ingredient`,
                {
                    method: id ? "PUT" : "POST",
                    headers: getHeaders(true),
                    body: JSON.stringify(
                        ingredient
                    )
                }
            );


        const data =
            await parseResponse(response);


        if (!response.ok) {

            throw new Error(
                getResponseMessage(data)
            );

        }


        showAlert(
            id
                ? "Ingredient updated successfully."
                : "Ingredient saved successfully."
        );


        clearForm(
            "form-ingredient"
        );


        await loadIngredients();
        await loadDashboard();


    } catch (error) {

        console.error(
            "Save ingredient error:",
            error
        );


        showAlert(
            "Failed to save ingredient: " +
            error.message,
            "error"
        );

    }

}


// ============================================================
// EDIT INGREDIENT
// ============================================================

async function editIngredient(id) {

    try {

        const response =
            await fetch(
                `${BASE_URL}/v1/ingredient`,
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );


        const data =
            await parseResponse(response);


        if (!response.ok) {

            throw new Error(
                getResponseMessage(data)
            );

        }


        const ingredients =
            extractArray(data);


        const ingredient =
            ingredients.find(
                i =>
                    Number(
                        i.ingredientId
                    ) === Number(id)
            );


        if (!ingredient) {

            showAlert(
                "Ingredient not found.",
                "error"
            );

            return;

        }


        document.getElementById(
            "ing-id"
        ).value =
            ingredient.ingredientId || "";


        document.getElementById(
            "ing-name"
        ).value =
            ingredient.name || "";


        document.getElementById(
            "ing-qty"
        ).value =
            ingredient.quantityOnHand ?? "";


        document.getElementById(
            "ing-unit"
        ).value =
            ingredient.unit || "";


        document.getElementById(
            "ing-supplier"
        ).value =
            ingredient.supplierId || "";


        editingIngredientId =
            ingredient.ingredientId;


    } catch (error) {

        console.error(
            "Edit ingredient error:",
            error
        );


        showAlert(
            "Failed to load ingredient: " +
            error.message,
            "error"
        );

    }

}


// ============================================================
// DELETE INGREDIENT
// ============================================================

async function deleteIngredient(id) {

    if (
        !confirm(
            "Are you sure you want to delete this ingredient?"
        )
    ) {

        return;

    }


    try {

        const response =
            await fetch(
                `${BASE_URL}/v1/ingredient/${id}`,
                {
                    method: "DELETE",
                    headers: getHeaders()
                }
            );


        const data =
            await parseResponse(response);


        if (!response.ok) {

            throw new Error(
                getResponseMessage(data)
            );

        }


        showAlert(
            "Ingredient deleted successfully."
        );


        await loadIngredients();
        await loadDashboard();


    } catch (error) {

        console.error(
            "Delete ingredient error:",
            error
        );


        showAlert(
            "Failed to delete ingredient: " +
            error.message,
            "error"
        );

    }

}


// ============================================================
// ORDERS
// ============================================================

async function loadOrders() {

    try {

        const response =
            await fetch(
                `${BASE_URL}/v1/orders`,
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );


        const data =
            await parseResponse(response);


        if (!response.ok) {

            throw new Error(
                getResponseMessage(data)
            );

        }


        const orders =
            extractArray(data);


        console.log(
            "Orders loaded:",
            orders
        );


        renderOrders(orders);


    } catch (error) {

        console.error(
            "Load orders error:",
            error
        );


        showTableError(
            "table-order",
            6,
            "Failed to load orders: " +
            error.message
        );

    }

}


// ============================================================
// RENDER ORDERS
// ============================================================

function renderOrders(orders) {

    const tbody =
        document.getElementById(
            "table-order"
        );


    if (!tbody) {

        console.error(
            "#table-order not found."
        );

        return;

    }


    tbody.innerHTML = "";


    if (
        !Array.isArray(orders) ||
        orders.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td colspan="6"
                    style="text-align:center;">
                    No orders found.
                </td>
            </tr>
        `;

        return;

    }


    orders.forEach(order => {

        const customer =
            order.username ||
            `User #${order.userId}`;


        const table =
            order.tableNumber ||
            `Table #${order.tableId}`;


        const status =
            order.status ||
            "PENDING";


        tbody.innerHTML += `

            <tr>

                <td>
                    ${escapeHtml(
                        order.orderId
                    )}
                </td>

                <td>

                    ${escapeHtml(
                        customer
                    )}

                    <br>

                    <small>
                        ${escapeHtml(
                            table
                        )}
                    </small>

                </td>

                <td>
                    Rs.
                    ${Number(
                        order.totalAmount || 0
                    ).toFixed(2)}
                </td>

                <td>
                    ${escapeHtml(status)}
                </td>

                <td>

                    <select
                        id="order-status-${Number(
                            order.orderId
                        )}">

                        <option
                            value="PENDING"
                            ${
                                status ===
                                "PENDING"
                                    ? "selected"
                                    : ""
                            }>
                            PENDING
                        </option>

                        <option
                            value="CONFIRMED"
                            ${
                                status ===
                                "CONFIRMED"
                                    ? "selected"
                                    : ""
                            }>
                            CONFIRMED
                        </option>

                        <option
                            value="PREPARING"
                            ${
                                status ===
                                "PREPARING"
                                    ? "selected"
                                    : ""
                            }>
                            PREPARING
                        </option>

                        <option
                            value="READY"
                            ${
                                status ===
                                "READY"
                                    ? "selected"
                                    : ""
                            }>
                            READY
                        </option>

                        <option
                            value="COMPLETED"
                            ${
                                status ===
                                "COMPLETED"
                                    ? "selected"
                                    : ""
                            }>
                            COMPLETED
                        </option>

                        <option
                            value="CANCELLED"
                            ${
                                status ===
                                "CANCELLED"
                                    ? "selected"
                                    : ""
                            }>
                            CANCELLED
                        </option>

                    </select>

                </td>

                <td>

                    <button
                        class="btn btn-primary"
                        type="button"
                        onclick="updateOrderStatus(
                            ${Number(order.orderId)}
                        )">

                        <i class="fa-solid fa-pen"></i>

                    </button>

                    <button
                        class="btn btn-danger"
                        type="button"
                        onclick="deleteOrder(
                            ${Number(order.orderId)}
                        )">

                        <i class="fa-solid fa-trash"></i>

                    </button>

                </td>

            </tr>

        `;

    });

}


// ============================================================
// UPDATE ORDER STATUS
// PATCH /v1/orders/{orderId}
// ============================================================

async function updateOrderStatus(orderId) {

    const select =
        document.getElementById(
            `order-status-${orderId}`
        );


    if (!select) {

        showAlert(
            "Order status field not found.",
            "error"
        );

        return;

    }


    const status =
        select.value;


    try {

        const response =
            await fetch(
                `${BASE_URL}/v1/orders/${orderId}`,
                {
                    method: "PATCH",
                    headers: getHeaders(true),
                    body: JSON.stringify({
                        status: status
                    })
                }
            );


        const data =
            await parseResponse(response);


        if (!response.ok) {

            throw new Error(
                getResponseMessage(data)
            );

        }


        showAlert(
            "Order status updated successfully."
        );


        await loadOrders();
        await loadDashboard();


    } catch (error) {

        console.error(
            "Update order status error:",
            error
        );


        showAlert(
            "Failed to update order status: " +
            error.message,
            "error"
        );

    }

}


// ============================================================
// DELETE ORDER
// ============================================================

async function deleteOrder(orderId) {

    if (
        !confirm(
            "Are you sure you want to delete this order?"
        )
    ) {

        return;

    }


    try {

        const response =
            await fetch(
                `${BASE_URL}/v1/orders/${orderId}`,
                {
                    method: "DELETE",
                    headers: getHeaders()
                }
            );


        const data =
            await parseResponse(response);


        if (!response.ok) {

            throw new Error(
                getResponseMessage(data)
            );

        }


        showAlert(
            "Order deleted successfully."
        );


        await loadOrders();
        await loadDashboard();


    } catch (error) {

        console.error(
            "Delete order error:",
            error
        );


        showAlert(
            "Failed to delete order: " +
            error.message,
            "error"
        );

    }

}


// ============================================================
// LOGIN HELPER
// ============================================================

async function loginUser(
    email,
    password
) {

    try {

        const response =
            await fetch(
                `${BASE_URL}/v1/users/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({

                        email: email,

                        password: password

                    })
                }
            );


        const data =
            await parseResponse(response);


        if (!response.ok) {

            throw new Error(
                getResponseMessage(data)
            );

        }


        const loginData =
            data.data ||
            data;


        if (loginData.token) {

            localStorage.setItem(
                "token",
                loginData.token
            );

        }


        if (loginData.user) {

            localStorage.setItem(
                "user",
                JSON.stringify(
                    loginData.user
                )
            );

        }


        return loginData;


    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        throw error;

    }

}