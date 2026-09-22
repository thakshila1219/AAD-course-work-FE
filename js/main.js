document.addEventListener('DOMContentLoaded', function () {

    const BASE_URL = 'http://localhost:8082/v1';

    // =========================================================
    // TOKEN
    // =========================================================

    const rawToken = localStorage.getItem('token');

    if (!rawToken || rawToken === 'undefined' || rawToken === 'null') {
        window.location.href = 'login.html';
        return;
    }

    const authHeader = rawToken.startsWith('Bearer ')
        ? rawToken
        : 'Bearer ' + rawToken.trim();


    // =========================================================
    // CURRENT TIME
    // =========================================================

    function updateCurrentTime() {

        const timeElement = document.getElementById('current-time');

        if (!timeElement) return;

        const now = new Date();

        timeElement.textContent =
            now.toLocaleDateString() +
            ' ' +
            now.toLocaleTimeString();
    }

    updateCurrentTime();

    setInterval(updateCurrentTime, 1000);


    // =========================================================
    // USER INFORMATION
    // =========================================================

    function loadUserInformation() {

        let user = null;

        try {

            user =
                JSON.parse(localStorage.getItem('user')) ||
                JSON.parse(localStorage.getItem('loggedUser'));

        } catch (error) {

            console.log('User information not available');

        }


        if (!user) return;


        const name =
            user.name ||
            user.userName ||
            user.username ||
            user.fullName ||
            'Staff';


        const email =
            user.email ||
            '';


        const phone =
            user.phone ||
            user.contact ||
            '';


        const displayUser =
            document.getElementById('display-user');

        if (displayUser) {
            displayUser.textContent = name;
        }


        const welcome =
            document.getElementById('userWelcomeMsg');

        if (welcome) {

            welcome.textContent =
                'Welcome Back, ' + name + '!';
        }


        const profileName =
            document.getElementById('profileName');

        if (profileName) {
            profileName.value = name;
        }


        const profileEmail =
            document.getElementById('profileEmail');

        if (profileEmail) {
            profileEmail.value = email;
        }


        const profilePhone =
            document.getElementById('profilePhone');

        if (profilePhone) {
            profilePhone.value = phone;
        }
    }


    loadUserInformation();


    // =========================================================
    // API REQUEST
    // =========================================================

    async function apiRequest(endpoint, options = {}) {

        try {

            const response = await fetch(
                BASE_URL + '/' + endpoint,
                {
                    ...options,

                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': authHeader,
                        ...(options.headers || {})
                    }
                }
            );


            if (response.status === 401 || response.status === 403) {

                alert('Session expired. Please login again.');

                localStorage.clear();

                window.location.href = 'login.html';

                return null;
            }


            if (!response.ok) {

                throw new Error(
                    'HTTP Error: ' + response.status
                );
            }


            const contentType =
                response.headers.get('content-type');


            if (
                contentType &&
                contentType.includes('application/json')
            ) {

                return await response.json();
            }


            return await response.text();

        } catch (error) {

            console.error(
                'API Error:',
                endpoint,
                error
            );

            return null;
        }
    }


    // =========================================================
    // EXTRACT ARRAY
    // =========================================================

    function extractList(response) {

        if (!response) {
            return [];
        }


        // Backend directly returns List<DTO>

        if (Array.isArray(response)) {
            return response;
        }


        // CommonResponse / wrapped response

        if (
            response.data &&
            Array.isArray(response.data)
        ) {

            return response.data;
        }


        if (
            response.data &&
            Array.isArray(response.data.content)
        ) {

            return response.data.content;
        }


        if (Array.isArray(response.content)) {

            return response.content;
        }


        if (
            response.result &&
            Array.isArray(response.result)
        ) {

            return response.result;
        }


        if (
            response.result &&
            Array.isArray(response.result.content)
        ) {

            return response.result.content;
        }


        return [];
    }


    // =========================================================
    // SHOW SECTION
    // =========================================================

    window.showSection = function (sectionId) {

        const dashboard =
            document.getElementById('dashboard-section');

        const sections =
            document.querySelectorAll(
                '.content-view'
            );


        // Hide dashboard

        if (dashboard) {
            dashboard.style.display = 'none';
        }


        // Hide all other sections

        sections.forEach(function (section) {

            section.style.display = 'none';

        });


        // Show selected section

        const selected =
            document.getElementById(sectionId);


        if (!selected) {

            console.error(
                'Section not found:',
                sectionId
            );

            return;
        }


        selected.style.display = 'block';


        // =====================================================
        // LOAD DATA FOR SELECTED SECTION
        // =====================================================

        switch (sectionId) {

            case 'menu-section':

                fetchMenuItems();

                break;


            case 'orders-section':

                fetchOrders();

                break;


            case 'reservation-section':

                fetchReservations();

                break;


            case 'customers-section':

                fetchCustomers();

                break;


            case 'inventory-section':

                fetchInventory();

                break;


            case 'payments-section':

                fetchPayments();

                break;


            case 'profile-section':

                loadUserInformation();

                break;

        }
    };


    // =========================================================
    // SHOW DASHBOARD
    // =========================================================

    window.showDashboard = function () {

        const dashboard =
            document.getElementById('dashboard-section');


        const sections =
            document.querySelectorAll(
                '.content-view'
            );


        // Hide all content sections

        sections.forEach(function (section) {

            section.style.display = 'none';

        });


        // Show dashboard

        if (dashboard) {

            dashboard.style.display = 'block';
        }


        // Load dashboard data

        fetchDashboardMetrics();
    };


    // =========================================================
    // DASHBOARD METRICS
    // =========================================================

    async function fetchDashboardMetrics() {

        try {

            const ordersResponse =
                await apiRequest('orders');


            const ingredientsResponse =
                await apiRequest('ingredient');


            const reservationsResponse =
                await apiRequest('reservations');


            const orders =
                extractList(ordersResponse);


            const ingredients =
                extractList(ingredientsResponse);


            const reservations =
                extractList(reservationsResponse);


            console.log('Dashboard Orders:', orders);

            console.log(
                'Dashboard Ingredients:',
                ingredients
            );

            console.log(
                'Dashboard Reservations:',
                reservations
            );


            // =================================================
            // TODAY'S DATE
            // =================================================

            const today =
                new Date().toISOString().split('T')[0];


            const todayOrders =
                orders.filter(function (order) {

                    const date =
                        order.orderDate ||
                        order.date ||
                        order.createdDate ||
                        order.createdAt;

                    if (!date) return true;

                    return String(date).startsWith(today);
                });


            // =================================================
            // ORDER COUNTS
            // =================================================

            const totalOrders =
                todayOrders.length;


            const pendingOrders =
                todayOrders.filter(function (order) {

                    const status =
                        String(
                            order.status ||
                            ''
                        ).toLowerCase();

                    return (
                        status === 'pending' ||
                        status === 'processing'
                    );

                }).length;


            const completedOrders =
                todayOrders.filter(function (order) {

                    const status =
                        String(
                            order.status ||
                            ''
                        ).toLowerCase();

                    return (
                        status === 'completed' ||
                        status === 'complete'
                    );

                }).length;


            // =================================================
            // SALES
            // =================================================

            const sales =
                todayOrders.reduce(
                    function (total, order) {

                        const amount =
                            Number(
                                order.totalAmount ||
                                order.total ||
                                order.amount ||
                                0
                            );

                        return total + amount;

                    },
                    0
                );


            // =================================================
            // UPDATE CARDS
            // =================================================

            const orderCountElement =
                document.getElementById(
                    'dashboard-order-count'
                );

            if (orderCountElement) {

                orderCountElement.textContent =
                    totalOrders;
            }


            const pendingElement =
                document.getElementById(
                    'dashboard-pending-count'
                );

            if (pendingElement) {

                pendingElement.textContent =
                    pendingOrders;
            }


            const completedElement =
                document.getElementById(
                    'dashboard-completed-count'
                );

            if (completedElement) {

                completedElement.textContent =
                    completedOrders;
            }


            const salesElement =
                document.getElementById(
                    'dashboard-sales'
                );

            if (salesElement) {

                salesElement.textContent =
                    'Rs. ' +
                    sales.toFixed(2);
            }


            // =================================================
            // DASHBOARD TABLES
            // =================================================

            renderRecentOrders(orders);

            renderLowStockItems(ingredients);

            renderTodayReservations(
                reservations
            );


        } catch (error) {

            console.error(
                'Dashboard loading error:',
                error
            );
        }
    }


    // =========================================================
    // RECENT ORDERS
    // =========================================================

    function renderRecentOrders(orders) {

        const tbody =
            document.getElementById(
                'recentOrdersTableBody'
            );


        if (!tbody) return;


        tbody.innerHTML = '';


        if (!orders || orders.length === 0) {

            tbody.innerHTML =
                '<tr>' +
                '<td colspan="4" style="text-align:center;padding:20px;color:#94a3b8;">' +
                'No recent orders found.' +
                '</td>' +
                '</tr>';

            return;
        }


        orders
            .slice()
            .reverse()
            .slice(0, 5)
            .forEach(function (order) {

                const orderId =
                    order.orderId ||
                    order.id ||
                    '-';


                const customer =
                    order.username ||
                    order.customerName ||
                    order.customer ||
                    order.userId ||
                    '-';


                const amount =
                    Number(
                        order.totalAmount ||
                        order.total ||
                        order.amount ||
                        0
                    );


                const status =
                    order.status ||
                    'Pending';


                tbody.innerHTML +=

                    '<tr>' +

                    '<td>' +
                    orderId +
                    '</td>' +

                    '<td>' +
                    customer +
                    '</td>' +

                    '<td>Rs. ' +
                    amount.toFixed(2) +
                    '</td>' +

                    '<td>' +
                    status +
                    '</td>' +

                    '</tr>';
            });
    }


    // =========================================================
    // LOW STOCK
    // =========================================================

    function renderLowStockItems(ingredients) {

        const tbody =
            document.getElementById(
                'lowStockTableBody'
            );


        if (!tbody) return;


        tbody.innerHTML = '';


        if (!ingredients || ingredients.length === 0) {

            tbody.innerHTML =
                '<tr>' +
                '<td colspan="3" style="text-align:center;padding:20px;color:#94a3b8;">' +
                'No inventory data found.' +
                '</td>' +
                '</tr>';

            return;
        }


        const lowStock =
            ingredients.filter(function (item) {

                // Backend IngredientDTO field
                const quantity =
                    Number(
                        item.quantityOnHand ?? 0
                    );

                return quantity <= 10;

            });


        const displayItems =
            lowStock.length > 0
                ? lowStock
                : ingredients.slice(0, 5);


        displayItems.forEach(function (item) {

            const name =
                item.ingredientName ||
                item.name ||
                item.itemName ||
                '-';


            // Backend IngredientDTO field
            const quantity =
                Number(
                    item.quantityOnHand ?? 0
                );


            const status =
                quantity <= 10
                    ? 'Low Stock'
                    : 'Available';


            tbody.innerHTML +=

                '<tr>' +

                '<td>' +
                name +
                '</td>' +

                '<td>' +
                quantity +
                '</td>' +

                '<td>' +
                status +
                '</td>' +

                '</tr>';
        });
    }


    // =========================================================
    // TODAY RESERVATIONS
    // =========================================================

    function renderTodayReservations(
        reservations
    ) {

        const tbody =
            document.getElementById(
                'todayReservationsTableBody'
            );


        if (!tbody) return;


        tbody.innerHTML = '';


        if (
            !reservations ||
            reservations.length === 0
        ) {

            tbody.innerHTML =
                '<tr>' +
                '<td colspan="5" style="text-align:center;padding:20px;color:#94a3b8;">' +
                'No reservations found.' +
                '</td>' +
                '</tr>';

            return;
        }


        reservations
            .slice(0, 5)
            .forEach(function (reservation) {

                const reservationId =
                    reservation.reservationId ||
                    reservation.id ||
                    '-';


                const customer =
                    reservation.username ||
                    reservation.customerName ||
                    reservation.customer ||
                    reservation.userId ||
                    '-';


                const table =
                    reservation.tableNumber ||
                    reservation.diningTableId ||
                    reservation.tableId ||
                    '-';


                const date =
                    reservation.reservationDate ||
                    reservation.date ||
                    '-';


                const time =
                    reservation.reservationTime ||
                    reservation.time ||
                    '-';


                const status =
                    reservation.status ||
                    'Pending';


                tbody.innerHTML +=

                    '<tr>' +

                    '<td>' +
                    reservationId +
                    '</td>' +

                    '<td>' +
                    customer +
                    '</td>' +

                    '<td>' +
                    table +
                    '</td>' +

                    '<td>' +
                    time +
                    '</td>' +

                    '<td>' +
                    status +
                    '</td>' +

                    '</tr>';
            });
    }


    // =========================================================
    // FOOD MENU
    // =========================================================

    async function fetchMenuItems() {

        const tbody =
            document.getElementById(
                'menuTableBody'
            );


        if (!tbody) return;


        tbody.innerHTML =
            '<tr>' +
            '<td colspan="5" style="text-align:center;padding:20px;">' +
            'Loading menu...' +
            '</td>' +
            '</tr>';


        const response =
            await apiRequest('menu-items');


        const items =
            extractList(response);


        console.log(
            'Menu Items:',
            items
        );


        tbody.innerHTML = '';


        if (items.length === 0) {

            tbody.innerHTML =
                '<tr>' +
                '<td colspan="5" style="text-align:center;padding:20px;color:#94a3b8;">' +
                'No menu items found.' +
                '</td>' +
                '</tr>';

            return;
        }


        items.forEach(function (item) {

            const id =
                item.itemId ||
                item.menuItemId ||
                item.id ||
                '-';


            const name =
                item.itemName ||
                item.menuItemName ||
                item.name ||
                '-';


            const category =
                item.categoryName ||
                item.category ||
                item.categoryId ||
                '-';


            const price =
                Number(
                    item.price ||
                    item.unitPrice ||
                    0
                );


            const availability =
                item.availability ??
                item.available ??
                true;


            tbody.innerHTML +=

                '<tr>' +

                '<td>' +
                id +
                '</td>' +

                '<td>' +
                name +
                '</td>' +

                '<td>' +
                category +
                '</td>' +

                '<td>Rs. ' +
                price.toFixed(2) +
                '</td>' +

                '<td>' +
                (availability ? 'Available' : 'Unavailable') +
                '</td>' +

                '</tr>';
        });
    }


    // =========================================================
    // ORDERS
    // =========================================================

    async function fetchOrders() {

        const tbody =
            document.getElementById(
                'ordersTableBody'
            );


        if (!tbody) return;


        tbody.innerHTML =
            '<tr>' +
            '<td colspan="6" style="text-align:center;padding:20px;">' +
            'Loading orders...' +
            '</td>' +
            '</tr>';


        const response =
            await apiRequest('orders');


        const orders =
            extractList(response);


        console.log(
            'Orders:',
            orders
        );


        tbody.innerHTML = '';


        if (orders.length === 0) {

            tbody.innerHTML =
                '<tr>' +
                '<td colspan="6" style="text-align:center;padding:20px;color:#94a3b8;">' +
                'No orders found.' +
                '</td>' +
                '</tr>';

            return;
        }


        orders.forEach(function (order) {

            const orderId =
                order.orderId ||
                order.id ||
                '-';


            const customer =
                order.username ||
                order.customerName ||
                order.customer ||
                order.userId ||
                '-';


            const date =
                order.orderDate ||
                order.date ||
                order.createdDate ||
                '-';


            const amount =
                Number(
                    order.totalAmount ||
                    order.total ||
                    order.amount ||
                    0
                );


            const status =
                order.status ||
                'Pending';


            tbody.innerHTML +=

                '<tr>' +

                '<td>' +
                orderId +
                '</td>' +

                '<td>' +
                customer +
                '</td>' +

                '<td>' +
                formatDate(date) +
                '</td>' +

                '<td>Rs. ' +
                amount.toFixed(2) +
                '</td>' +

                '<td>' +
                status +
                '</td>' +

                '<td>' +

                '<button class="btn btn-primary" ' +
                'type="button" ' +
                'onclick="viewOrderDetails(' +
                orderId +
                ')">' +

                '<i class="fa-solid fa-eye"></i> View' +

                '</button>' +

                '</td>' +

                '</tr>';
        });
    }


    // =========================================================
    // ORDER DETAILS
    // =========================================================

    window.viewOrderDetails =
        async function (orderId) {

            const container =
                document.getElementById(
                    'orderDetailsContainer'
                );


            const tbody =
                document.getElementById(
                    'orderDetailsTableBody'
                );


            const title =
                document.getElementById(
                    'selectedOrderTitle'
                );


            const info =
                document.getElementById(
                    'selectedOrderInfo'
                );


            if (!container || !tbody) {
                return;
            }


            container.style.display = 'block';


            tbody.innerHTML =
                '<tr>' +
                '<td colspan="5" style="text-align:center;padding:20px;">' +
                'Loading order details...' +
                '</td>' +
                '</tr>';


            const response =
                await apiRequest(
                    'order-details/order/' +
                    orderId
                );


            const details =
                extractList(response);


            console.log(
                'Order Details:',
                details
            );


            if (title) {

                title.textContent =
                    'Order #' + orderId;
            }


            if (info) {

                info.textContent =
                    'Order details for order #' +
                    orderId;
            }


            tbody.innerHTML = '';


            if (details.length === 0) {

                tbody.innerHTML =
                    '<tr>' +
                    '<td colspan="5" style="text-align:center;padding:20px;color:#94a3b8;">' +
                    'No order details found.' +
                    '</td>' +
                    '</tr>';

                return;
            }


            details.forEach(function (detail) {

                const detailId =
                    detail.orderDetailId ||
                    detail.id ||
                    '-';


                const itemId =
                    detail.menuItemId ||
                    detail.itemId ||
                    '-';


                const quantity =
                    detail.quantity ||
                    0;


                const unitPrice =
                    Number(
                        detail.unitPrice ||
                        detail.price ||
                        0
                    );


                const subtotal =
                    Number(
                        detail.subtotal ||
                        unitPrice * quantity
                    );


                tbody.innerHTML +=

                    '<tr>' +

                    '<td>' +
                    detailId +
                    '</td>' +

                    '<td>' +
                    itemId +
                    '</td>' +

                    '<td>' +
                    quantity +
                    '</td>' +

                    '<td>Rs. ' +
                    unitPrice.toFixed(2) +
                    '</td>' +

                    '<td>Rs. ' +
                    subtotal.toFixed(2) +
                    '</td>' +

                    '</tr>';
            });
        };


    // =========================================================
    // CLOSE ORDER DETAILS
    // =========================================================

    window.closeOrderDetails = function () {

        const container =
            document.getElementById(
                'orderDetailsContainer'
            );


        if (container) {

            container.style.display = 'none';
        }
    };


    // =========================================================
    // RESERVATIONS
    // =========================================================

    async function fetchReservations() {

        const tbody =
            document.getElementById(
                'reservationTableBody'
            );


        if (!tbody) return;


        tbody.innerHTML =
            '<tr>' +
            '<td colspan="6" style="text-align:center;padding:20px;">' +
            'Loading reservations...' +
            '</td>' +
            '</tr>';


        const response =
            await apiRequest('reservations');


        const reservations =
            extractList(response);


        console.log(
            'Reservations:',
            reservations
        );


        tbody.innerHTML = '';


        if (reservations.length === 0) {

            tbody.innerHTML =
                '<tr>' +
                '<td colspan="6" style="text-align:center;padding:20px;color:#94a3b8;">' +
                'No reservations found.' +
                '</td>' +
                '</tr>';

            return;
        }


        reservations.forEach(function (reservation) {

            const id =
                reservation.reservationId ||
                reservation.id ||
                '-';


            const customer =
                reservation.username ||
                reservation.customerName ||
                reservation.customer ||
                reservation.userId ||
                '-';


            const table =
                reservation.tableNumber ||
                reservation.diningTableId ||
                reservation.tableId ||
                '-';


            const date =
                reservation.reservationDate ||
                reservation.date ||
                '-';


            const time =
                reservation.reservationTime ||
                reservation.time ||
                '-';


            const status =
                reservation.status ||
                'Pending';


            tbody.innerHTML +=

                '<tr>' +

                '<td>' +
                id +
                '</td>' +

                '<td>' +
                customer +
                '</td>' +

                '<td>' +
                table +
                '</td>' +

                '<td>' +
                formatDate(date) +
                '</td>' +

                '<td>' +
                time +
                '</td>' +

                '<td>' +
                status +
                '</td>' +

                '</tr>';
        });
    }


    // =========================================================
    // CUSTOMERS
    // =========================================================

    async function fetchCustomers() {

        const tbody =
            document.getElementById(
                'customersTableBody'
            );


        if (!tbody) return;


        tbody.innerHTML =
            '<tr>' +
            '<td colspan="5" style="text-align:center;padding:20px;">' +
            'Loading customers...' +
            '</td>' +
            '</tr>';


        const response =
            await apiRequest('users');


        const users =
            extractList(response);


        console.log(
            'Customers:',
            users
        );


        tbody.innerHTML = '';


        if (users.length === 0) {

            tbody.innerHTML =
                '<tr>' +
                '<td colspan="5" style="text-align:center;padding:20px;color:#94a3b8;">' +
                'No customers found.' +
                '</td>' +
                '</tr>';

            return;
        }


        users.forEach(function (user) {

            const id =
                user.userId ||
                user.id ||
                '-';


            const name =
                user.name ||
                user.fullName ||
                user.username ||
                '-';


            const email =
                user.email ||
                '-';


            const phone =
                user.phone ||
                user.contact ||
                '-';


            const orders =
                user.orderCount ||
                user.orders ||
                0;


            tbody.innerHTML +=

                '<tr>' +

                '<td>' +
                id +
                '</td>' +

                '<td>' +
                name +
                '</td>' +

                '<td>' +
                email +
                '</td>' +

                '<td>' +
                phone +
                '</td>' +

                '<td>' +
                orders +
                '</td>' +

                '</tr>';
        });
    }


    // =========================================================
    // INVENTORY
    // =========================================================

    async function fetchInventory() {

        const tbody =
            document.getElementById(
                'inventoryTableBody'
            );


        if (!tbody) return;


        tbody.innerHTML =
            '<tr>' +
            '<td colspan="5" style="text-align:center;padding:20px;">' +
            'Loading inventory...' +
            '</td>' +
            '</tr>';


        const response =
            await apiRequest('ingredient');


        const ingredients =
            extractList(response);


        console.log(
            'Inventory:',
            ingredients
        );


        tbody.innerHTML = '';


        if (ingredients.length === 0) {

            tbody.innerHTML =
                '<tr>' +
                '<td colspan="5" style="text-align:center;padding:20px;color:#94a3b8;">' +
                'No inventory found.' +
                '</td>' +
                '</tr>';

            return;
        }


        ingredients.forEach(function (item) {

            const id =
                item.ingredientId ||
                item.id ||
                '-';


            const name =
                item.ingredientName ||
                item.name ||
                item.itemName ||
                '-';


            /*
             * Category is kept exactly as before.
             * Current IngredientDTO does not contain
             * a category field.
             */
            const category =
                item.categoryName ||
                item.category ||
                item.categoryId ||
                '-';


            /*
             * IMPORTANT:
             * Backend IngredientDTO uses:
             *
             * quantityOnHand
             *
             * NOT quantity / qty / stock
             */
            const quantity =
                Number(
                    item.quantityOnHand ?? 0
                );


            const status =
                quantity <= 10
                    ? 'Low Stock'
                    : 'Available';


            tbody.innerHTML +=

                '<tr>' +

                '<td>' +
                id +
                '</td>' +

                '<td>' +
                name +
                '</td>' +

                '<td>' +
                category +
                '</td>' +

                '<td>' +
                quantity +
                '</td>' +

                '<td>' +
                status +
                '</td>' +

                '</tr>';
        });
    }


    // =========================================================
    // PAYMENTS
    // =========================================================

    async function fetchPayments() {

        const tbody =
            document.getElementById(
                'paymentsTableBody'
            );


        if (!tbody) return;


        tbody.innerHTML =
            '<tr>' +
            '<td colspan="6" style="text-align:center;padding:20px;">' +
            'Loading payments...' +
            '</td>' +
            '</tr>';


        const response =
            await apiRequest('payments');


        const payments =
            extractList(response);


        console.log(
            'Payments:',
            payments
        );


        tbody.innerHTML = '';


        if (payments.length === 0) {

            tbody.innerHTML =
                '<tr>' +
                '<td colspan="6" style="text-align:center;padding:20px;color:#94a3b8;">' +
                'No payment records found.' +
                '</td>' +
                '</tr>';

            return;
        }


        payments.forEach(function (payment) {

            const id =
                payment.paymentId ||
                payment.id ||
                '-';


            const orderId =
                payment.orderId ||
                '-';


            const customer =
                payment.customerName ||
                payment.customer ||
                payment.customerId ||
                '-';


            const amount =
                Number(
                    payment.amount ||
                    payment.totalAmount ||
                    0
                );


            const method =
                payment.paymentMethod ||
                payment.method ||
                '-';


            const status =
                payment.status ||
                'Pending';


            tbody.innerHTML +=

                '<tr>' +

                '<td>' +
                id +
                '</td>' +

                '<td>' +
                orderId +
                '</td>' +

                '<td>' +
                customer +
                '</td>' +

                '<td>Rs. ' +
                amount.toFixed(2) +
                '</td>' +

                '<td>' +
                method +
                '</td>' +

                '<td>' +
                status +
                '</td>' +

                '</tr>';
        });
    }


    // =========================================================
    // DATE FORMAT
    // =========================================================

    function formatDate(date) {

        if (!date || date === '-') {
            return '-';
        }


        try {

            return new Date(date)
                .toLocaleDateString();

        } catch (error) {

            return date;
        }
    }


    // =========================================================
    // MENU BUTTON
    // =========================================================

    const menuButton =
        document.getElementById(
            'btnViewMenu'
        );


    if (menuButton) {

        menuButton.addEventListener(
            'click',
            function () {

                showSection(
                    'menu-section'
                );
            }
        );
    }


    // =========================================================
    // ORDERS BUTTON
    // =========================================================

    const ordersButton =
        document.getElementById(
            'btnViewOrders'
        );


    if (ordersButton) {

        ordersButton.addEventListener(
            'click',
            function () {

                showSection(
                    'orders-section'
                );
            }
        );
    }


    // =========================================================
    // INITIAL DASHBOARD LOAD
    // =========================================================

    showDashboard();

});


// =============================================================
// LOGOUT
// =============================================================

function logout() {

    localStorage.clear();

    window.location.href =
        'login.html';
}

//\\