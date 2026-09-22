document.addEventListener('DOMContentLoaded', () => {

    const BASE_URL = 'http://localhost:8082/v1';

    // =========================================================
    // AUTHENTICATION
    // =========================================================

    let rawToken = localStorage.getItem('token');

    console.log("Current Token in LocalStorage:", rawToken);

    if (!rawToken ||
        rawToken === "undefined" ||
        rawToken === "null") {

        console.warn(
            'No valid token found. Redirecting to login...'
        );

        window.location.href = 'login.html';
        return;
    }

    let authHeader =
        rawToken.startsWith('Bearer ')
            ? rawToken
            : `Bearer ${rawToken.trim()}`;


    // =========================================================
    // CURRENT TIME
    // =========================================================

    setInterval(() => {

        const timeElement =
            document.getElementById('current-time');

        if (timeElement) {
            timeElement.innerText =
                new Date().toLocaleTimeString();
        }

    }, 1000);


    // =========================================================
    // DISPLAY LOGGED USER
    // =========================================================

    const storedUser =
        localStorage.getItem('user') ||
        localStorage.getItem('loggedUser');

    let nameToShow = 'User';

    if (storedUser) {

        try {

            const uObj =
                JSON.parse(storedUser);

            nameToShow =
                uObj.name ||
                uObj.username ||
                uObj.fullName ||
                uObj.email ||
                nameToShow;

        } catch (e) {

            nameToShow = storedUser;
        }
    }


    const displayUser =
        document.getElementById('display-user');

    const userWelcomeMsg =
        document.getElementById('userWelcomeMsg');


    if (displayUser) {
        displayUser.innerText = nameToShow;
    }

    if (userWelcomeMsg) {
        userWelcomeMsg.innerText =
            `Welcome Back, ${nameToShow}!`;
    }


    // =========================================================
    // SECTION NAVIGATION
    // =========================================================

    window.showSection = function (sectionId) {

        const mainViews =
            document.querySelectorAll(
                '.main-dashboard-view'
            );

        const contentViews =
            document.querySelectorAll(
                '.content-view'
            );


        // =====================================================
        // DASHBOARD
        // =====================================================

        if (
            sectionId === 'dashboard-section' ||
            !sectionId
        ) {

            mainViews.forEach(view => {
                view.style.display = 'block';
            });

            contentViews.forEach(view => {
                view.style.display = 'none';
            });

            fetchDashboardMetrics();

            return;
        }


        // =====================================================
        // HIDE OTHER SECTIONS
        // =====================================================

        mainViews.forEach(view => {
            view.style.display = 'none';
        });

        contentViews.forEach(view => {
            view.style.display = 'none';
        });


        // =====================================================
        // SHOW SELECTED SECTION
        // =====================================================

        const targetSection =
            document.getElementById(sectionId);

        if (targetSection) {

            targetSection.style.display = 'block';

            targetSection.classList.add('fade-in');
        }


        // =====================================================
        // LOAD DATA ACCORDING TO SECTION
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
                loadProfile();
                break;
        }
    };


    // =========================================================
    // SHOW DASHBOARD
    // =========================================================

    window.showDashboard = function () {

        showSection('dashboard-section');

    };


    // =========================================================
    // MENU BUTTON
    // =========================================================

    const btnViewMenu =
        document.getElementById('btnViewMenu');

    if (btnViewMenu) {

        btnViewMenu.addEventListener('click', () => {

            showSection('menu-section');

        });
    }


    // =========================================================
    // ORDERS BUTTON
    // =========================================================

    const btnViewOrders =
        document.getElementById('btnViewOrders');

    if (btnViewOrders) {

        btnViewOrders.addEventListener('click', () => {

            showSection('orders-section');

        });
    }


    // =========================================================
    // API REQUEST
    // =========================================================

    async function apiRequest(
        endpoint,
        options = {}
    ) {

        try {

            console.log(
                `API Request: ${BASE_URL}/${endpoint}`
            );


            const response =
                await fetch(
                    `${BASE_URL}/${endpoint}`,
                    {
                        ...options,

                        headers: {

                            'Content-Type':
                                'application/json',

                            'Authorization':
                                authHeader,

                            ...(options.headers || {})
                        }
                    }
                );


            // =================================================
            // UNAUTHORIZED
            // =================================================

            if (
                response.status === 401 ||
                response.status === 403
            ) {

                console.error(
                    `Unauthorized access for ${endpoint}. Status: ${response.status}`
                );

                return null;
            }


            // =================================================
            // OTHER API ERROR
            // =================================================

            if (!response.ok) {

                console.error(
                    `API Error for ${endpoint}: ${response.status}`
                );

                return null;
            }


            // =================================================
            // CHECK RESPONSE TYPE
            // =================================================

            const contentType =
                response.headers.get(
                    'content-type'
                );


            if (
                contentType &&
                contentType.includes(
                    'application/json'
                )
            ) {

                return await response.json();
            }


            return true;


        } catch (error) {

            console.error(
                `Fetch error for ${endpoint}:`,
                error
            );

            return null;
        }
    }


    // =========================================================
    // EXTRACT LIST FROM API RESPONSE
    // =========================================================

    function extractList(response) {

        if (Array.isArray(response)) {

            return response;
        }


        if (
            response &&
            Array.isArray(response.data)
        ) {

            return response.data;
        }


        return [];
    }


    // =========================================================
    // DASHBOARD METRICS
    // =========================================================

    async function fetchDashboardMetrics() {

        try {

            // =================================================
            // LOAD ALL DASHBOARD DATA TOGETHER
            // =================================================

            const [
                ordersResponse,
                ingredientsResponse,
                reservationsResponse
            ] = await Promise.all([

                apiRequest('orders'),

                apiRequest('ingredient'),

                apiRequest('reservations')

            ]);


            // =================================================
            // EXTRACT DATA
            // =================================================

            const orderList =
                extractList(
                    ordersResponse
                );

            const ingredientList =
                extractList(
                    ingredientsResponse
                );

            const reservationList =
                extractList(
                    reservationsResponse
                );


            console.log(
                "Dashboard Orders:",
                orderList
            );

            console.log(
                "Dashboard Ingredients:",
                ingredientList
            );

            console.log(
                "Dashboard Reservations:",
                reservationList
            );


            // =================================================
            // TODAY
            // =================================================

            const today =
                new Date()
                    .toISOString()
                    .split('T')[0];


            // =================================================
            // TODAY'S ORDERS
            // =================================================

            const todayOrders =
                orderList.filter(order => {

                    if (!order.orderDate) {

                        return false;
                    }

                    return order.orderDate
                        .startsWith(today);

                });


            // =================================================
            // PENDING ORDERS
            // =================================================

            const pendingOrders =
                orderList.filter(order => {

                    return String(
                        order.status || ''
                    ).toUpperCase() === 'PENDING';

                });


            // =================================================
            // COMPLETED ORDERS
            // =================================================

            const completedOrders =
                orderList.filter(order => {

                    return String(
                        order.status || ''
                    ).toUpperCase() === 'COMPLETED';

                });


            // =================================================
            // TODAY'S SALES
            // =================================================

            const todaySales =
                todayOrders.reduce(
                    (total, order) => {

                        return total +
                            Number(
                                order.totalAmount || 0
                            );

                    },
                    0
                );


            // =================================================
            // UPDATE DASHBOARD CARDS
            // =================================================

            const orderElem =
                document.getElementById(
                    'dashboard-order-count'
                );

            const pendingElem =
                document.getElementById(
                    'dashboard-pending-count'
                );

            const completedElem =
                document.getElementById(
                    'dashboard-completed-count'
                );

            const salesElem =
                document.getElementById(
                    'dashboard-sales'
                );


            if (orderElem) {

                orderElem.innerText =
                    todayOrders.length;
            }


            if (pendingElem) {

                pendingElem.innerText =
                    pendingOrders.length;
            }


            if (completedElem) {

                completedElem.innerText =
                    completedOrders.length;
            }


            if (salesElem) {

                salesElem.innerText =
                    `LKR ${todaySales.toFixed(2)}`;
            }


            // =================================================
            // RECENT ORDERS
            // =================================================

            renderRecentOrders(
                orderList
            );


            // =================================================
            // LOW STOCK
            // =================================================

            renderLowStockItems(
                ingredientList
            );


            // =================================================
            // TODAY'S RESERVATIONS
            // =================================================

            renderTodayReservations(
                reservationList
            );


        } catch (error) {

            console.error(
                "Dashboard loading error:",
                error
            );
        }
    }


    // =========================================================
    // RECENT ORDERS
    // =========================================================

    function renderRecentOrders(
        orderList
    ) {

        const tableBody =
            document.getElementById(
                'recentOrdersTableBody'
            );


        if (!tableBody) {

            return;
        }


        tableBody.innerHTML = '';


        if (orderList.length === 0) {

            tableBody.innerHTML = `
                <tr>

                    <td colspan="4"
                        style="
                        padding:20px;
                        text-align:center;
                        color:#94a3b8;">

                        No recent orders found.

                    </td>

                </tr>
            `;

            return;
        }


        const recentOrders =
            [...orderList]
                .sort((a, b) => {

                    return new Date(
                        b.orderDate || 0
                    ) -
                    new Date(
                        a.orderDate || 0
                    );

                })
                .slice(0, 5);


        recentOrders.forEach(order => {

            const orderId =
                order.orderId || '-';

            const customer =
                order.username ||
                order.name ||
                order.customerName ||
                '-';

            const amount =
                Number(
                    order.totalAmount || 0
                ).toFixed(2);

            const status =
                order.status ||
                'PENDING';


            const row = `
                <tr
                    style="
                    border-bottom:
                    1px solid
                    rgba(255,255,255,0.05);">

                    <td style="padding:12px;">
                        #${orderId}
                    </td>

                    <td style="padding:12px;">
                        ${customer}
                    </td>

                    <td
                        style="
                        padding:12px;
                        color:#4ade80;">

                        LKR ${amount}

                    </td>

                    <td style="padding:12px;">

                        <span
                            style="
                            color:#ff758c;
                            font-weight:600;">

                            ${status}

                        </span>

                    </td>

                </tr>
            `;

            tableBody.innerHTML += row;

        });
    }


    // =========================================================
    // LOW STOCK ITEMS
    // =========================================================

    function renderLowStockItems(
        ingredientList
    ) {

        const tableBody =
            document.getElementById(
                'lowStockTableBody'
            );


        if (!tableBody) {

            return;
        }


        tableBody.innerHTML = '';


        const lowStockItems =
            ingredientList.filter(
                ingredient => {

                    return Number(
                        ingredient.quantityOnHand || 0
                    ) < 10;

                }
            );


        if (lowStockItems.length === 0) {

            tableBody.innerHTML = `
                <tr>

                    <td colspan="3"
                        style="
                        padding:20px;
                        text-align:center;
                        color:#4ade80;">

                        No low stock items.

                    </td>

                </tr>
            `;

            return;
        }


        lowStockItems.forEach(
            ingredient => {

                const name =
                    ingredient.name || '-';

                const quantity =
                    Number(
                        ingredient.quantityOnHand || 0
                    );

                const unit =
                    ingredient.unit || '';


                const row = `
                    <tr
                        style="
                        border-bottom:
                        1px solid
                        rgba(255,255,255,0.05);">

                        <td style="padding:12px;">
                            ${name}
                        </td>

                        <td style="padding:12px;">
                            ${quantity} ${unit}
                        </td>

                        <td
                            style="
                            padding:12px;
                            color:#ff758c;
                            font-weight:600;">

                            LOW STOCK

                        </td>

                    </tr>
                `;

                tableBody.innerHTML += row;

            }
        );
    }


    // =========================================================
    // TODAY'S RESERVATIONS
    // =========================================================

    function renderTodayReservations(
        reservationList
    ) {

        const tableBody =
            document.getElementById(
                'todayReservationsTableBody'
            );


        if (!tableBody) {

            return;
        }


        tableBody.innerHTML = '';


        const today =
            new Date()
                .toISOString()
                .split('T')[0];


        const todayReservations =
            reservationList.filter(
                reservation => {

                    if (
                        !reservation.reservationTime
                    ) {

                        return false;
                    }


                    return reservation
                        .reservationTime
                        .startsWith(today);

                }
            );


        if (todayReservations.length === 0) {

            tableBody.innerHTML = `
                <tr>

                    <td colspan="5"
                        style="
                        padding:20px;
                        text-align:center;
                        color:#94a3b8;">

                        No reservations for today.

                    </td>

                </tr>
            `;

            return;
        }


        todayReservations.forEach(
            reservation => {

                const reservationId =
                    reservation.reservationId || '-';

                const customer =
                    reservation.username ||
                    '-';

                const table =
                    reservation.tableNumber ||
                    reservation.tableId ||
                    '-';

                const dateTime =
                    reservation.reservationTime;


                let date = '-';
                let time = '-';


                try {

                    const parsedDate =
                        new Date(dateTime);

                    date =
                        parsedDate
                            .toLocaleDateString();

                    time =
                        parsedDate
                            .toLocaleTimeString(
                                [],
                                {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                }
                            );

                } catch (error) {

                    console.error(
                        error
                    );
                }


                const status =
                    reservation.status ||
                    'PENDING';


                const row = `
                    <tr
                        style="
                        border-bottom:
                        1px solid
                        rgba(255,255,255,0.05);">

                        <td style="padding:12px;">
                            #${reservationId}
                        </td>

                        <td style="padding:12px;">
                            ${customer}
                        </td>

                        <td style="padding:12px;">
                            ${table}
                        </td>

                        <td style="padding:12px;">
                            ${time}
                        </td>

                        <td style="padding:12px;">

                            <span
                                style="
                                color:#38bdf8;
                                font-weight:600;">

                                ${status}

                            </span>

                        </td>

                    </tr>
                `;

                tableBody.innerHTML += row;

            }
        );
    }


    // =========================================================
    // FETCH MENU ITEMS
    // =========================================================

    async function fetchMenuItems() {

        const response =
            await apiRequest('items');


        const menuList =
            extractList(response);


        const tableBody =
            document.getElementById(
                'menuTableBody'
            );


        if (!tableBody) {

            return;
        }


        tableBody.innerHTML = '';


        if (menuList.length === 0) {

            tableBody.innerHTML = `
                <tr>

                    <td colspan="5"
                        style="
                        padding:20px;
                        text-align:center;
                        color:#94a3b8;">

                        No food items available in the menu.

                    </td>

                </tr>
            `;

            return;
        }


        menuList.forEach(
            (item, index) => {

                const itemId =
                    item.itemId ||
                    item.id ||
                    (index + 1);


                const itemName =
                    item.itemName ||
                    item.name ||
                    item.title ||
                    'N/A';


                const category =
                    item.categoryName ||
                    item.category ||
                    '-';


                const price =
                    Number(
                        item.price || 0
                    ).toFixed(2);


                const availability =
                    item.availability ||
                    item.status ||
                    'AVAILABLE';


                const row = `
                    <tr
                        style="
                        border-bottom:
                        1px solid
                        rgba(255,255,255,0.05);">

                        <td style="padding:12px;">
                            #${itemId}
                        </td>

                        <td style="padding:12px;">
                            ${itemName}
                        </td>

                        <td style="padding:12px;">
                            ${category}
                        </td>

                        <td
                            style="
                            padding:12px;
                            color:#4ade80;">

                            LKR ${price}

                        </td>

                        <td style="padding:12px;">
                            ${availability}
                        </td>

                    </tr>
                `;

                tableBody.innerHTML += row;

            }
        );
    }


    // =========================================================
    // FETCH ALL ORDERS
    // =========================================================

    async function fetchOrders() {

        const response =
            await apiRequest('orders');


        const orderList =
            extractList(response);


        const tableBody =
            document.getElementById(
                'ordersTableBody'
            );


        if (!tableBody) {

            return;
        }


        tableBody.innerHTML = '';


        if (orderList.length === 0) {

            tableBody.innerHTML = `
                <tr>

                    <td colspan="6"
                        style="
                        padding:20px;
                        text-align:center;
                        color:#94a3b8;">

                        No orders found.

                    </td>

                </tr>
            `;

            return;
        }


        orderList.forEach(order => {

            const orderId =
                order.orderId;


            const customer =
                order.username ||
                order.name ||
                order.customerName ||
                '-';


            const orderDate =
                formatDate(
                    order.orderDate
                );


            const total =
                Number(
                    order.totalAmount || 0
                ).toFixed(2);


            const status =
                order.status ||
                'PENDING';


            const row = `
                <tr
                    style="
                    border-bottom:
                    1px solid
                    rgba(255,255,255,0.05);">

                    <td style="padding:12px;">
                        #${orderId}
                    </td>

                    <td style="padding:12px;">
                        ${customer}
                    </td>

                    <td style="padding:12px;">
                        ${orderDate}
                    </td>

                    <td
                        style="
                        padding:12px;
                        color:#4ade80;">

                        LKR ${total}

                    </td>

                    <td style="padding:12px;">

                        <span
                            style="
                            color:#ff758c;
                            font-weight:600;">

                            ${status}

                        </span>

                    </td>

                    <td style="padding:12px;">

                        <button
                            type="button"
                            class="btn btn-primary"
                            onclick="viewOrderDetails(${orderId})">

                            <i
                                class="fa-solid
                                fa-eye">
                            </i>

                            View

                        </button>

                    </td>

                </tr>
            `;

            tableBody.innerHTML += row;

        });
    }


    // =========================================================
    // GET ORDER DETAILS
    // =========================================================

    async function fetchOrderDetails(
        orderId
    ) {

        if (!orderId) {

            console.error(
                'Order ID is required.'
            );

            return [];
        }


        const response =
            await apiRequest(
                `order-details/order/${orderId}`
            );


        const detailList =
            extractList(response);


        console.log(
            `Order Details for Order #${orderId}:`,
            detailList
        );


        return detailList;
    }


    // =========================================================
    // VIEW ORDER DETAILS
    // =========================================================

    window.viewOrderDetails =
        async function(orderId) {

            const container =
                document.getElementById(
                    'orderDetailsContainer'
                );

            const tableBody =
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


            if (!container ||
                !tableBody) {

                return;
            }


            container.style.display =
                'block';


            tableBody.innerHTML = `
                <tr>

                    <td colspan="5"
                        style="
                        padding:20px;
                        text-align:center;
                        color:#94a3b8;">

                        Loading order details...

                    </td>

                </tr>
            `;


            const detailList =
                await fetchOrderDetails(
                    orderId
                );


            if (title) {

                title.innerText =
                    `Order #${orderId} Details`;
            }


            if (info) {

                info.innerText =
                    `Details for Order #${orderId}`;
            }


            tableBody.innerHTML = '';


            if (detailList.length === 0) {

                tableBody.innerHTML = `
                    <tr>

                        <td colspan="5"
                            style="
                            padding:20px;
                            text-align:center;
                            color:#94a3b8;">

                            No order details found.

                        </td>

                    </tr>
                `;

                return;
            }


            detailList.forEach(detail => {

                const detailId =
                    detail.orderDetailId ||
                    detail.id ||
                    '-';


                const menuItemId =
                    detail.itemId ||
                    detail.menuItemId ||
                    '-';


                const quantity =
                    detail.quantity || 0;


                const unitPrice =
                    Number(
                        detail.unitPrice || 0
                    ).toFixed(2);


                const subtotal =
                    Number(
                        detail.subtotal ||
                        (
                            quantity *
                            Number(
                                detail.unitPrice || 0
                            )
                        )
                    ).toFixed(2);


                const row = `
                    <tr>

                        <td style="padding:12px;">
                            #${detailId}
                        </td>

                        <td style="padding:12px;">
                            #${menuItemId}
                        </td>

                        <td style="padding:12px;">
                            ${quantity}
                        </td>

                        <td style="padding:12px;">
                            LKR ${unitPrice}
                        </td>

                        <td
                            style="
                            padding:12px;
                            color:#4ade80;">

                            LKR ${subtotal}

                        </td>

                    </tr>
                `;

                tableBody.innerHTML += row;

            });
        };


    // =========================================================
    // CLOSE ORDER DETAILS
    // =========================================================

    window.closeOrderDetails =
        function() {

            const container =
                document.getElementById(
                    'orderDetailsContainer'
                );

            if (container) {

                container.style.display =
                    'none';
            }
        };


    // =========================================================
    // FETCH RESERVATIONS
    // =========================================================

    async function fetchReservations() {

        const response =
            await apiRequest(
                'reservations'
            );


        const reservationList =
            extractList(response);


        const tableBody =
            document.getElementById(
                'reservationTableBody'
            );


        if (!tableBody) {

            return;
        }


        tableBody.innerHTML = '';


        if (reservationList.length === 0) {

            tableBody.innerHTML = `
                <tr>

                    <td colspan="6"
                        style="
                        padding:20px;
                        text-align:center;
                        color:#94a3b8;">

                        No reservations found.

                    </td>

                </tr>
            `;

            return;
        }


        reservationList.forEach(
            reservation => {

                const reservationId =
                    reservation.reservationId ||
                    '-';


                const customer =
                    reservation.username ||
                    '-';


                const table =
                    reservation.tableNumber ||
                    reservation.tableId ||
                    '-';


                const reservationDate =
                    formatDate(
                        reservation.reservationTime
                    );


                const time =
                    formatTime(
                        reservation.reservationTime
                    );


                const status =
                    reservation.status ||
                    'PENDING';


                const row = `
                    <tr>

                        <td style="padding:12px;">
                            #${reservationId}
                        </td>

                        <td style="padding:12px;">
                            ${customer}
                        </td>

                        <td style="padding:12px;">
                            ${table}
                        </td>

                        <td style="padding:12px;">
                            ${reservationDate}
                        </td>

                        <td style="padding:12px;">
                            ${time}
                        </td>

                        <td style="padding:12px;">

                            <span
                                style="
                                color:#38bdf8;
                                font-weight:600;">

                                ${status}

                            </span>

                        </td>

                    </tr>
                `;

                tableBody.innerHTML += row;

            }
        );
    }


    // =========================================================
    // FETCH CUSTOMERS
    // =========================================================

    async function fetchCustomers() {

        const response =
            await apiRequest('users');


        const customerList =
            extractList(response);


        const tableBody =
            document.getElementById(
                'customersTableBody'
            );


        if (!tableBody) {

            return;
        }


        tableBody.innerHTML = '';


        if (customerList.length === 0) {

            tableBody.innerHTML = `
                <tr>

                    <td colspan="5"
                        style="
                        padding:20px;
                        text-align:center;
                        color:#94a3b8;">

                        No customers found.

                    </td>

                </tr>
            `;

            return;
        }


        customerList.forEach(
            customer => {

                const id =
                    customer.userId ||
                    customer.id ||
                    '-';


                const name =
                    customer.name ||
                    customer.username ||
                    customer.fullName ||
                    '-';


                const email =
                    customer.email ||
                    '-';


                const phone =
                    customer.phone ||
                    customer.contact ||
                    customer.mobile ||
                    '-';


                const orders =
                    customer.orderCount ||
                    customer.ordersCount ||
                    0;


                const row = `
                    <tr>

                        <td style="padding:12px;">
                            #${id}
                        </td>

                        <td style="padding:12px;">
                            ${name}
                        </td>

                        <td style="padding:12px;">
                            ${email}
                        </td>

                        <td style="padding:12px;">
                            ${phone}
                        </td>

                        <td style="padding:12px;">
                            ${orders}
                        </td>

                    </tr>
                `;

                tableBody.innerHTML += row;

            }
        );
    }


    // =========================================================
    // FETCH INVENTORY
    // =========================================================

    async function fetchInventory() {

        const response =
            await apiRequest(
                'ingredient'
            );


        const ingredientList =
            extractList(response);


        const tableBody =
            document.getElementById(
                'inventoryTableBody'
            );


        if (!tableBody) {

            return;
        }


        tableBody.innerHTML = '';


        if (ingredientList.length === 0) {

            tableBody.innerHTML = `
                <tr>

                    <td colspan="5"
                        style="
                        padding:20px;
                        text-align:center;
                        color:#94a3b8;">

                        No inventory items found.

                    </td>

                </tr>
            `;

            return;
        }


        ingredientList.forEach(
            ingredient => {

                const id =
                    ingredient.ingredientId ||
                    '-';


                const name =
                    ingredient.name ||
                    '-';


                const category =
                    ingredient.category ||
                    ingredient.unit ||
                    '-';


                const quantity =
                    Number(
                        ingredient.quantityOnHand || 0
                    );


                const unit =
                    ingredient.unit ||
                    '';


                let status =
                    'AVAILABLE';


                let statusColor =
                    '#4ade80';


                if (quantity < 10) {

                    status =
                        'LOW STOCK';

                    statusColor =
                        '#ff758c';

                }


                if (quantity <= 0) {

                    status =
                        'OUT OF STOCK';

                    statusColor =
                        '#ef4444';
                }


                const row = `
                    <tr>

                        <td style="padding:12px;">
                            #${id}
                        </td>

                        <td style="padding:12px;">
                            ${name}
                        </td>

                        <td style="padding:12px;">
                            ${category}
                        </td>

                        <td style="padding:12px;">
                            ${quantity} ${unit}
                        </td>

                        <td
                            style="
                            padding:12px;
                            color:${statusColor};
                            font-weight:600;">

                            ${status}

                        </td>

                    </tr>
                `;

                tableBody.innerHTML += row;

            }
        );
    }


    // =========================================================
    // FETCH PAYMENTS
    // =========================================================

    async function fetchPayments() {

        const response =
            await apiRequest(
                'payments'
            );


        const paymentList =
            extractList(response);


        const tableBody =
            document.getElementById(
                'paymentsTableBody'
            );


        if (!tableBody) {

            return;
        }


        tableBody.innerHTML = '';


        if (paymentList.length === 0) {

            tableBody.innerHTML = `
                <tr>

                    <td colspan="6"
                        style="
                        padding:20px;
                        text-align:center;
                        color:#94a3b8;">

                        No payment records found.

                    </td>

                </tr>
            `;

            return;
        }


        paymentList.forEach(
            payment => {

                const paymentId =
                    payment.paymentId ||
                    payment.id ||
                    '-';


                const orderId =
                    payment.orderId ||
                    '-';


                const customer =
                    payment.username ||
                    payment.customerName ||
                    payment.name ||
                    '-';


                const amount =
                    Number(
                        payment.amount ||
                        payment.totalAmount ||
                        0
                    ).toFixed(2);


                const method =
                    payment.paymentMethod ||
                    payment.method ||
                    '-';


                const status =
                    payment.status ||
                    'PENDING';


                const row = `
                    <tr>

                        <td style="padding:12px;">
                            #${paymentId}
                        </td>

                        <td style="padding:12px;">
                            #${orderId}
                        </td>

                        <td style="padding:12px;">
                            ${customer}
                        </td>

                        <td
                            style="
                            padding:12px;
                            color:#4ade80;">

                            LKR ${amount}

                        </td>

                        <td style="padding:12px;">
                            ${method}
                        </td>

                        <td style="padding:12px;">

                            <span
                                style="
                                color:#38bdf8;
                                font-weight:600;">

                                ${status}

                            </span>

                        </td>

                    </tr>
                `;

                tableBody.innerHTML += row;

            }
        );
    }


    // =========================================================
    // PROFILE
    // =========================================================

    function loadProfile() {

        let user = null;


        try {

            user =
                JSON.parse(
                    localStorage.getItem('user') ||
                    localStorage.getItem('loggedUser')
                );

        } catch (error) {

            console.error(
                'Unable to parse stored user:',
                error
            );
        }


        if (!user) {

            return;
        }


        const profileName =
            document.getElementById(
                'profileName'
            );

        const profileEmail =
            document.getElementById(
                'profileEmail'
            );

        const profilePhone =
            document.getElementById(
                'profilePhone'
            );


        if (profileName) {

            profileName.value =
                user.name ||
                user.username ||
                user.fullName ||
                '';
        }


        if (profileEmail) {

            profileEmail.value =
                user.email ||
                '';
        }


        if (profilePhone) {

            profilePhone.value =
                user.phone ||
                user.contact ||
                user.mobile ||
                '';
        }
    }


    // =========================================================
    // DATE FORMAT
    // =========================================================

    function formatDate(
        dateValue
    ) {

        if (!dateValue) {

            return '-';
        }


        try {

            const date =
                new Date(dateValue);


            if (
                isNaN(
                    date.getTime()
                )
            ) {

                return dateValue;
            }


            return date.toLocaleDateString();


        } catch (error) {

            return dateValue;
        }
    }


    // =========================================================
    // TIME FORMAT
    // =========================================================

    function formatTime(
        dateValue
    ) {

        if (!dateValue) {

            return '-';
        }


        try {

            const date =
                new Date(dateValue);


            if (
                isNaN(
                    date.getTime()
                )
            ) {

                return '-';
            }


            return date.toLocaleTimeString(
                [],
                {
                    hour: '2-digit',
                    minute: '2-digit'
                }
            );


        } catch (error) {

            return '-';
        }
    }


    // =========================================================
    // CHANGE PASSWORD
    // =========================================================

    const changePasswordForm =
        document.getElementById(
            'changePasswordForm'
        );


    if (changePasswordForm) {

        changePasswordForm.addEventListener(
            'submit',
            async function(event) {

                event.preventDefault();


                const currentPassword =
                    document.getElementById(
                        'currentPassword'
                    )?.value;


                const newPassword =
                    document.getElementById(
                        'newPassword'
                    )?.value;


                const confirmPassword =
                    document.getElementById(
                        'confirmPassword'
                    )?.value;


                if (
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword
                ) {

                    alert(
                        'Please fill all password fields.'
                    );

                    return;
                }


                if (
                    newPassword !==
                    confirmPassword
                ) {

                    alert(
                        'New passwords do not match.'
                    );

                    return;
                }


                /*
                 * Password endpoint depends on
                 * your existing UserController.
                 *
                 * So we do not call a guessed
                 * endpoint here.
                 */

                alert(
                    'Password change API needs to be connected to your UserController.'
                );

            }
        );
    }


    // =========================================================
    // INITIAL LOAD
    // =========================================================

    fetchDashboardMetrics();

});


// =============================================================
// LOGOUT
// =============================================================

function logout() {

    localStorage.clear();

    window.location.href =
        "login.html";
}