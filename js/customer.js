document.addEventListener('DOMContentLoaded', function () {

    const BASE_URL = 'http://localhost:8082/v1';

    const rawToken = localStorage.getItem('token');

    if (!rawToken || rawToken === 'undefined' || rawToken === 'null') {
        window.location.href = 'login.html';
        return;
    }

    const authHeader =
        rawToken.startsWith('Bearer ')
            ? rawToken
            : 'Bearer ' + rawToken.trim();

    let currentUser = null;

    try {
        currentUser =
            JSON.parse(localStorage.getItem('user')) ||
            JSON.parse(localStorage.getItem('loggedUser'));
    } catch (error) {
        console.error('Cannot read logged user:', error);
    }

    if (!currentUser) {
        alert('User information not found. Please login again.');
        localStorage.clear();
        window.location.href = 'login.html';
        return;
    }

    console.log('Current Customer:', currentUser);


    /* =========================
       USER
       ========================= */

    function getCurrentUserId() {

        if (
            currentUser &&
            currentUser.userId !== null &&
            currentUser.userId !== undefined
        ) {
            return Number(currentUser.userId);
        }

        return null;
    }


    function loadUserInformation() {

        const username =
            currentUser.username ||
            currentUser.name ||
            'Customer';

        const email =
            currentUser.email || '';

        const role =
            String(currentUser.role || 'CUSTOMER')
                .toUpperCase()
                .replace('ROLE_', '');

        const displayUser =
            document.getElementById('display-user');

        if (displayUser) {
            displayUser.textContent = username;
        }

        const welcome =
            document.getElementById('userWelcomeMsg');

        if (welcome) {
            welcome.textContent =
                'Welcome Back, ' + username + '!';
        }

        const profileName =
            document.getElementById('profileName');

        if (profileName) {
            profileName.value = username;
        }

        const profileEmail =
            document.getElementById('profileEmail');

        if (profileEmail) {
            profileEmail.value = email;
        }

        const profileRole =
            document.getElementById('profileRole');

        if (profileRole) {
            profileRole.value = role;
        }
    }

    loadUserInformation();


    /* =========================
       TIME
       ========================= */

    function updateCurrentTime() {

        const element =
            document.getElementById('current-time');

        if (!element) return;

        const now = new Date();

        element.textContent =
            now.toLocaleDateString() +
            ' ' +
            now.toLocaleTimeString();
    }

    updateCurrentTime();

    setInterval(updateCurrentTime, 1000);


    /* =========================
       API REQUEST
       ========================= */

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

            if (
                response.status === 401 ||
                response.status === 403
            ) {

                alert(
                    'Session expired. Please login again.'
                );

                localStorage.clear();

                window.location.href =
                    'login.html';

                return null;
            }


            const contentType =
                response.headers.get('content-type');


            if (!response.ok) {

                let errorMessage =
                    'HTTP Error: ' + response.status;

                try {

                    if (
                        contentType &&
                        contentType.includes(
                            'application/json'
                        )
                    ) {

                        const errorData =
                            await response.json();

                        console.error(
                            'Backend Error:',
                            errorData
                        );

                        errorMessage =
                            errorData.message ||
                            errorData.error ||
                            errorMessage;

                    } else {

                        const text =
                            await response.text();

                        console.error(
                            'Backend Error:',
                            text
                        );

                        if (text) {
                            errorMessage = text;
                        }
                    }

                } catch (error) {
                    console.error(
                        'Error reading backend error:',
                        error
                    );
                }

                throw new Error(errorMessage);
            }


            if (
                contentType &&
                contentType.includes(
                    'application/json'
                )
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

            throw error;
        }
    }


    /* =========================
       RESPONSE LIST
       ========================= */

    function extractList(response) {

        if (!response) return [];

        if (Array.isArray(response)) {
            return response;
        }

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


    /* =========================
       CART
       ========================= */

    let cart =
        JSON.parse(
            localStorage.getItem(
                'customerCart'
            ) || '[]'
        );


    function saveCart() {

        localStorage.setItem(
            'customerCart',
            JSON.stringify(cart)
        );
    }


    function getCartQuantity() {

        return cart.reduce(
            function (total, item) {

                return total +
                    Number(item.quantity);

            },
            0
        );
    }


    function getCartTotal() {

        return cart.reduce(
            function (total, item) {

                return total +
                    Number(item.price) *
                    Number(item.quantity);

            },
            0
        );
    }


    /* =========================
       MENU
       ========================= */

    async function fetchMenuItems() {

        const menuGrid =
            document.getElementById(
                'menuGrid'
            );

        if (!menuGrid) return;


        menuGrid.innerHTML = `
            <div class="panel"
                 style="grid-column:1/-1;text-align:center;">
                <i class="fa-solid fa-spinner fa-spin"></i>
                Loading menu...
            </div>
        `;


        try {

            const response =
                await apiRequest(
                    'menu-item'
                );

            console.log(
                'Menu Response:',
                response
            );


            const items =
                extractList(response);

            menuGrid.innerHTML = '';


            if (items.length === 0) {

                menuGrid.innerHTML = `
                    <div class="panel"
                         style="grid-column:1/-1;text-align:center;">
                        No menu items available.
                    </div>
                `;

                return;
            }


            items.forEach(function (item) {

                const id =
                    item.itemId ||
                    item.menuItemId ||
                    item.id;


                const name =
                    item.itemName ||
                    item.menuItemName ||
                    item.name ||
                    'Food Item';


                const category =
                    item.categoryName ||
                    item.category ||
                    item.categoryId ||
                    'Food';


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


                const card =
                    document.createElement(
                        'div'
                    );

                card.className =
                    'food-card' +
                    (
                        !availability
                            ? ' unavailable'
                            : ''
                    );


                card.innerHTML = `
                    <div class="food-image">
                        <i class="fa-solid fa-bowl-food"></i>
                    </div>

                    <div class="food-content">

                        <h3>
                            ${escapeHtml(name)}
                        </h3>

                        <div class="food-category">
                            ${escapeHtml(
                                String(category)
                            )}
                        </div>

                        <div class="food-bottom">

                            <span class="food-price">
                                Rs. ${price.toFixed(2)}
                            </span>

                            <button
                                class="btn btn-primary"
                                ${!availability ? 'disabled' : ''}
                                onclick="addToCart(
                                    ${Number(id)},
                                    '${escapeJs(name)}',
                                    ${price}
                                )">

                                <i class="fa-solid fa-cart-plus"></i>
                                Add

                            </button>

                        </div>

                    </div>
                `;


                menuGrid.appendChild(card);

            });

        } catch (error) {

            console.error(
                'Failed to load menu:',
                error
            );

            menuGrid.innerHTML = `
                <div class="panel"
                     style="grid-column:1/-1;text-align:center;">

                    Failed to load menu items.

                </div>
            `;
        }
    }


    window.addToCart =
        function (id, name, price) {

            const existing =
                cart.find(
                    item =>
                        Number(item.id) ===
                        Number(id)
                );


            if (existing) {

                existing.quantity++;

            } else {

                cart.push({

                    id: Number(id),

                    name: name,

                    price: Number(price),

                    quantity: 1
                });
            }


            saveCart();

            updateCartUI();

            alert(
                name +
                ' added to cart.'
            );
        };


    /* =========================
       CART UI
       ========================= */

    function updateCartUI() {

        const container =
            document.getElementById(
                'cartItems'
            );

        if (!container) return;


        container.innerHTML = '';


        if (cart.length === 0) {

            container.innerHTML = `
                <div style="
                    text-align:center;
                    padding:50px;
                    color:#64748b;
                ">

                    <i
                        class="fa-solid fa-cart-shopping"
                        style="
                            font-size:45px;
                            margin-bottom:15px;
                        ">
                    </i>

                    <h3 style="
                        color:white;
                        margin-bottom:8px;
                    ">
                        Your cart is empty
                    </h3>

                    <p>
                        Add some delicious food
                        from our menu.
                    </p>

                </div>
            `;

        } else {

            cart.forEach(
                function (item, index) {

                    const subtotal =
                        Number(item.price) *
                        Number(item.quantity);


                    container.innerHTML += `
                        <div class="cart-item">

                            <div class="cart-item-info">

                                <h3>
                                    ${escapeHtml(
                                        item.name
                                    )}
                                </h3>

                                <span>
                                    Rs.
                                    ${Number(
                                        item.price
                                    ).toFixed(2)}
                                    each
                                </span>

                            </div>


                            <div class="quantity-control">

                                <button
                                    class="qty-btn"
                                    onclick="changeQuantity(
                                        ${index},
                                        -1
                                    )">
                                    −
                                </button>


                                <strong>
                                    ${item.quantity}
                                </strong>


                                <button
                                    class="qty-btn"
                                    onclick="changeQuantity(
                                        ${index},
                                        1
                                    )">
                                    +
                                </button>

                            </div>


                            <strong
                                style="color:#fbbf24;">

                                Rs.
                                ${subtotal.toFixed(2)}

                            </strong>


                            <button
                                class="btn btn-danger"
                                onclick="removeFromCart(
                                    ${index}
                                )">

                                <i
                                    class="fa-solid fa-trash">
                                </i>

                            </button>

                        </div>
                    `;
                }
            );
        }


        const quantity =
            getCartQuantity();

        const total =
            getCartTotal();


        const itemCount =
            document.getElementById(
                'cartItemCount'
            );

        const subtotal =
            document.getElementById(
                'cartSubtotal'
            );

        const totalElement =
            document.getElementById(
                'cartTotal'
            );

        const dashboardCart =
            document.getElementById(
                'dashboard-cart-count'
            );


        if (itemCount) {
            itemCount.textContent =
                quantity;
        }

        if (subtotal) {
            subtotal.textContent =
                'Rs. ' +
                total.toFixed(2);
        }

        if (totalElement) {
            totalElement.textContent =
                'Rs. ' +
                total.toFixed(2);
        }

        if (dashboardCart) {
            dashboardCart.textContent =
                quantity;
        }


        updateCheckoutSummary();
    }


    window.changeQuantity =
        function (index, amount) {

            if (!cart[index]) return;


            cart[index].quantity +=
                amount;


            if (
                cart[index].quantity <= 0
            ) {

                cart.splice(index, 1);
            }


            saveCart();

            updateCartUI();
        };


    window.removeFromCart =
        function (index) {

            cart.splice(index, 1);

            saveCart();

            updateCartUI();
        };


    /* =========================
       CHECKOUT
       ========================= */

    window.goToCheckout =
        function () {

            if (cart.length === 0) {

                alert(
                    'Your cart is empty.'
                );

                return;
            }


            showSection(
                'checkout-section'
            );

            updateCheckoutSummary();
        };


    function updateCheckoutSummary() {

        const container =
            document.getElementById(
                'checkoutSummary'
            );

        const totalElement =
            document.getElementById(
                'checkoutTotal'
            );


        if (!container) return;


        container.innerHTML = '';


        cart.forEach(
            function (item) {

                const subtotal =
                    Number(item.price) *
                    Number(item.quantity);


                container.innerHTML += `
                    <div class="summary-row">

                        <span>
                            ${escapeHtml(
                                item.name
                            )}
                            ×
                            ${item.quantity}
                        </span>

                        <span>
                            Rs.
                            ${subtotal.toFixed(2)}
                        </span>

                    </div>
                `;
            }
        );


        if (totalElement) {

            totalElement.textContent =
                'Rs. ' +
                getCartTotal()
                    .toFixed(2);
        }
    }


    /* =========================
       PAYMENT
       ========================= */

    let selectedPayment = null;


    window.selectPayment =
        function (method) {

            selectedPayment =
                method;


            const cashOption =
                document.getElementById(
                    'cashOption'
                );

            const cardOption =
                document.getElementById(
                    'cardOption'
                );

            const cardDetails =
                document.getElementById(
                    'cardDetails'
                );


            if (cashOption) {
                cashOption.classList.remove(
                    'selected'
                );
            }

            if (cardOption) {
                cardOption.classList.remove(
                    'selected'
                );
            }


            if (method === 'CASH') {

                if (cashOption) {
                    cashOption.classList.add(
                        'selected'
                    );
                }


                const cashRadio =
                    document.querySelector(
                        'input[value="CASH"]'
                    );

                if (cashRadio) {
                    cashRadio.checked = true;
                }


                if (cardDetails) {
                    cardDetails.style.display =
                        'none';
                }
            }


            if (method === 'CARD') {

                if (cardOption) {
                    cardOption.classList.add(
                        'selected'
                    );
                }


                const cardRadio =
                    document.querySelector(
                        'input[value="CARD"]'
                    );

                if (cardRadio) {
                    cardRadio.checked = true;
                }


                if (cardDetails) {
                    cardDetails.style.display =
                        'block';
                }
            }
        };


    /* =========================
       CONFIRM ORDER
       ========================= */

    window.confirmOrder =
        async function () {

            if (cart.length === 0) {

                alert(
                    'Your cart is empty.'
                );

                return;
            }


            if (!selectedPayment) {

                alert(
                    'Please select a payment method.'
                );

                return;
            }


            if (
                selectedPayment === 'CARD'
            ) {

                const cardNumber =
                    document.getElementById(
                        'cardNumber'
                    );


                if (
                    !cardNumber ||
                    !cardNumber.value.trim()
                ) {

                    alert(
                        'Please enter your card number.'
                    );

                    return;
                }
            }


            const userId =
                getCurrentUserId();


            if (!userId) {

                alert(
                    'User ID not found. Please login again.'
                );

                return;
            }


            const total =
                getCartTotal();


            const confirmButton =
                document.querySelector(
                    '#checkout-section button[onclick="confirmOrder()"]'
                );


            if (confirmButton) {

                confirmButton.disabled =
                    true;

                confirmButton.innerHTML =
                    '<i class="fa-solid fa-spinner fa-spin"></i> Placing Order...';
            }


            try {

                /* =========================
                   1. CREATE ORDER
                   ========================= */

                const orderData = {

                    orderDate:
                        new Date().toISOString(),

                    totalAmount:
                        total,

                    status:
                        'PENDING',

                    userId:
                        userId,

                    tableId:
                        0,

                    discountCouponId:
                        0
                };


                console.log(
                    'Order Request:',
                    orderData
                );


                const orderResponse =
                    await apiRequest(
                        'orders',
                        {
                            method: 'POST',

                            body:
                                JSON.stringify(
                                    orderData
                                )
                        }
                    );


                console.log(
                    'Order Response:',
                    orderResponse
                );


                const orderId =
                    Number(
                        orderResponse
                    );


                if (
                    !orderId ||
                    orderId <= 0
                ) {

                    throw new Error(
                        'Invalid Order ID received from backend.'
                    );
                }


                console.log(
                    'Created Order ID:',
                    orderId
                );


                /* =========================
                   2. CREATE ORDER DETAILS
                   ========================= */

                for (
                    const item of cart
                ) {

                    const orderDetailData = {

                        quantity:
                            Number(
                                item.quantity
                            ),

                        unitPrice:
                            Number(
                                item.price
                            ),

                        orderId:
                            orderId,

                        menuItemId:
                            Number(
                                item.id
                            )
                    };


                    console.log(
                        'Order Detail Request:',
                        orderDetailData
                    );


                    await apiRequest(
                        'order-details',
                        {
                            method: 'POST',

                            body:
                                JSON.stringify(
                                    orderDetailData
                                )
                        }
                    );
                }


                /* =========================
                   3. CREATE PAYMENT
                   ========================= */

                const paymentData = {

                    amount:
                        total,

                    paymentDate:
                        new Date().toISOString(),

                    paymentMethod:
                        selectedPayment,

                    orderId:
                        orderId
                };


                console.log(
                    'Payment Request:',
                    paymentData
                );


                await apiRequest(
                    'payments',
                    {
                        method: 'POST',

                        body:
                            JSON.stringify(
                                paymentData
                            )
                    }
                );


                /* =========================
                   4. CLEAR CART
                   ========================= */

                cart = [];

                saveCart();

                updateCartUI();


                /* =========================
                   5. RESET PAYMENT
                   ========================= */

                selectedPayment =
                    null;


                const cashOption =
                    document.getElementById(
                        'cashOption'
                    );

                const cardOption =
                    document.getElementById(
                        'cardOption'
                    );

                const cardDetails =
                    document.getElementById(
                        'cardDetails'
                    );

                const cardNumber =
                    document.getElementById(
                        'cardNumber'
                    );


                if (cashOption) {

                    cashOption.classList.remove(
                        'selected'
                    );
                }


                if (cardOption) {

                    cardOption.classList.remove(
                        'selected'
                    );
                }


                if (cardDetails) {

                    cardDetails.style.display =
                        'none';
                }


                if (cardNumber) {

                    cardNumber.value = '';
                }


                /* =========================
                   6. SUCCESS
                   ========================= */

                alert(
                    'Order placed successfully!\n\n' +
                    'Order ID: #' +
                    orderId +
                    '\nTotal: Rs. ' +
                    total.toFixed(2)
                );


                /* =========================
                   7. MY ORDERS
                   ========================= */

                showSection(
                    'orders-section'
                );

            } catch (error) {

                console.error(
                    'Order creation failed:',
                    error
                );


                alert(
                    'Failed to place order.\n\n' +
                    error.message
                );

            } finally {

                if (confirmButton) {

                    confirmButton.disabled =
                        false;

                    confirmButton.innerHTML =
                        '<i class="fa-solid fa-check"></i> Confirm Order';
                }
            }
        };


    /* =========================
       ORDERS
       ========================= */

    async function fetchMyOrders() {

        const tbody =
            document.getElementById(
                'ordersTableBody'
            );

        if (!tbody) return;


        tbody.innerHTML = `
            <tr>
                <td colspan="6"
                    style="text-align:center;padding:25px;">
                    Loading orders...
                </td>
            </tr>
        `;


        try {

            const response =
                await apiRequest(
                    'orders'
                );


            const orders =
                extractList(response);


            const userId =
                getCurrentUserId();


            const myOrders =
                orders.filter(
                    function (order) {

                        return Number(
                            order.userId
                        ) === userId;
                    }
                );


            tbody.innerHTML = '';


            if (myOrders.length === 0) {

                tbody.innerHTML = `
                    <tr>
                        <td colspan="6"
                            style="
                                text-align:center;
                                padding:30px;
                                color:#64748b;
                            ">
                            You have no orders yet.
                        </td>
                    </tr>
                `;

                renderRecentOrders([]);

                updateDashboardOrderStats([]);

                return;
            }


            myOrders.forEach(
                function (order) {

                    const orderId =
                        order.orderId || '-';

                    const date =
                        order.orderDate || '-';

                    const table =
                        order.tableNumber ||
                        order.tableId ||
                        '-';

                    const amount =
                        Number(
                            order.totalAmount || 0
                        );

                    const status =
                        order.status ||
                        'Pending';


                    tbody.innerHTML += `
                        <tr>

                            <td>
                                #${orderId}
                            </td>

                            <td>
                                ${formatDate(date)}
                            </td>

                            <td>
                                ${table}
                            </td>

                            <td>
                                Rs.
                                ${amount.toFixed(2)}
                            </td>

                            <td>
                                <span class="status-badge">
                                    ${escapeHtml(
                                        status
                                    )}
                                </span>
                            </td>

                            <td>

                                <button
                                    class="btn btn-primary"
                                    onclick="viewOrderDetails(
                                        ${orderId}
                                    )">

                                    <i
                                        class="fa-solid fa-eye">
                                    </i>

                                    View

                                </button>

                            </td>

                        </tr>
                    `;
                }
            );


            renderRecentOrders(
                myOrders
            );

            updateDashboardOrderStats(
                myOrders
            );

        } catch (error) {

            console.error(
                'Failed to load orders:',
                error
            );

            tbody.innerHTML = `
                <tr>
                    <td colspan="6"
                        style="text-align:center;padding:30px;">
                        Failed to load orders.
                    </td>
                </tr>
            `;
        }
    }


    function renderRecentOrders(
        orders
    ) {

        const tbody =
            document.getElementById(
                'recentOrdersTableBody'
            );

        if (!tbody) return;


        tbody.innerHTML = '';


        const recent =
            orders
                .slice()
                .reverse()
                .slice(0, 5);


        if (recent.length === 0) {

            tbody.innerHTML = `
                <tr>

                    <td colspan="4"
                        style="
                            text-align:center;
                            padding:25px;
                            color:#64748b;
                        ">

                        No recent orders.

                    </td>

                </tr>
            `;

            return;
        }


        recent.forEach(
            function (order) {

                tbody.innerHTML += `
                    <tr>

                        <td>
                            #${order.orderId || '-'}
                        </td>

                        <td>
                            ${formatDate(
                                order.orderDate || '-'
                            )}
                        </td>

                        <td>
                            Rs.
                            ${Number(
                                order.totalAmount || 0
                            ).toFixed(2)}
                        </td>

                        <td>

                            <span class="status-badge">

                                ${escapeHtml(
                                    order.status ||
                                    'Pending'
                                )}

                            </span>

                        </td>

                    </tr>
                `;
            }
        );
    }


    function updateDashboardOrderStats(
        orders
    ) {

        const pending =
            orders.filter(
                function (order) {

                    const status =
                        String(
                            order.status || ''
                        ).toLowerCase();

                    return (
                        status === 'pending' ||
                        status === 'processing' ||
                        status === 'preparing'
                    );
                }
            ).length;


        const pendingElement =
            document.getElementById(
                'dashboard-pending-count'
            );


        if (pendingElement) {

            pendingElement.textContent =
                pending;
        }


        const orderCount =
            document.getElementById(
                'dashboard-order-count'
            );


        if (orderCount) {

            orderCount.textContent =
                orders.length;
        }
    }


    /* =========================
       ORDER DETAILS
       ========================= */

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


            if (!container || !tbody) {
                return;
            }


            container.style.display =
                'block';


            tbody.innerHTML = `
                <tr>

                    <td colspan="5"
                        style="
                            text-align:center;
                            padding:20px;
                        ">

                        Loading...

                    </td>

                </tr>
            `;


            try {

                const response =
                    await apiRequest(
                        'order-details/order/' +
                        orderId
                    );


                const details =
                    extractList(response);


                const title =
                    document.getElementById(
                        'selectedOrderTitle'
                    );

                const info =
                    document.getElementById(
                        'selectedOrderInfo'
                    );


                if (title) {

                    title.textContent =
                        'Order #' +
                        orderId;
                }


                if (info) {

                    info.textContent =
                        'Order details';
                }


                tbody.innerHTML = '';


                if (details.length === 0) {

                    tbody.innerHTML = `
                        <tr>

                            <td colspan="5"
                                style="
                                    text-align:center;
                                    padding:20px;
                                    color:#64748b;
                                ">

                                No order details found.

                            </td>

                        </tr>
                    `;

                    return;
                }


                details.forEach(
                    function (detail) {

                        const detailId =
                            detail.orderDetailId ||
                            detail.id ||
                            '-';


                        const itemId =
                            detail.menuItemId ||
                            detail.itemId ||
                            '-';


                        const quantity =
                            Number(
                                detail.quantity || 0
                            );


                        const unitPrice =
                            Number(
                                detail.unitPrice ||
                                detail.price ||
                                0
                            );


                        const subtotal =
                            Number(
                                detail.subtotal ||
                                unitPrice *
                                quantity
                            );


                        tbody.innerHTML += `
                            <tr>

                                <td>
                                    ${detailId}
                                </td>

                                <td>
                                    ${itemId}
                                </td>

                                <td>
                                    ${quantity}
                                </td>

                                <td>
                                    Rs.
                                    ${unitPrice.toFixed(2)}
                                </td>

                                <td>
                                    Rs.
                                    ${subtotal.toFixed(2)}
                                </td>

                            </tr>
                        `;
                    }
                );

            } catch (error) {

                console.error(
                    'Failed to load order details:',
                    error
                );

                tbody.innerHTML = `
                    <tr>

                        <td colspan="5"
                            style="text-align:center;padding:20px;">

                            Failed to load order details.

                        </td>

                    </tr>
                `;
            }
        };


    window.closeOrderDetails =
        function () {

            const container =
                document.getElementById(
                    'orderDetailsContainer'
                );

            if (container) {

                container.style.display =
                    'none';
            }
        };


    /* =========================
       RESERVATIONS
       ========================= */

    /* =========================
   RESERVATIONS
   ========================= */

async function fetchMyReservations() {

    const tbody =
        document.getElementById(
            'reservationTableBody'
        );

    if (!tbody) {
        console.error(
            'reservationTableBody not found.'
        );
        return;
    }

    tbody.innerHTML = `
        <tr>
            <td colspan="5"
                style="
                    text-align:center;
                    padding:25px;
                ">
                Loading reservations...
            </td>
        </tr>
    `;

    try {

        const response =
            await apiRequest(
                'reservations'
            );

        console.log(
            'Reservations API Response:',
            response
        );

        const reservations =
            extractList(response);

        console.log(
            'All Reservations:',
            reservations
        );

        const userId =
            getCurrentUserId();

        console.log(
            'Current User ID:',
            userId
        );

        const myReservations =
            reservations.filter(
                function (reservation) {

                    return Number(
                        reservation.userId
                    ) === Number(userId);

                }
            );

        console.log(
            'My Reservations:',
            myReservations
        );

        tbody.innerHTML = '';

        if (
            myReservations.length === 0
        ) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="5"
                        style="
                            text-align:center;
                            padding:30px;
                            color:#64748b;
                        ">

                        You have no reservations yet.

                    </td>
                </tr>
            `;

            updateReservationCount(0);

            return;
        }


        myReservations.forEach(
            function (reservation) {

                const id =
                    reservation.reservationId ||
                    '-';


                const table =
                    reservation.tableNumber ||
                    (
                        reservation.tableId
                            ? 'Table ' +
                              reservation.tableId
                            : '-'
                    );


                const dateTime =
                    reservation.reservationTime ||
                    '-';


                const status =
                    reservation.status ||
                    'PENDING';


                const statusText =
                    String(status)
                        .toUpperCase();


                tbody.innerHTML += `

                    <tr>

                        <td>
                            #${id}
                        </td>

                        <td>
                            ${escapeHtml(
                                String(table)
                            )}
                        </td>

                        <td>
                            ${extractDate(
                                dateTime
                            )}
                        </td>

                        <td>
                            ${extractTime(
                                dateTime
                            )}
                        </td>

                        <td>

                            <span class="status-badge">
                                ${escapeHtml(
                                    statusText
                                )}
                            </span>

                        </td>

                    </tr>

                `;

            }
        );


        updateReservationCount(
            myReservations.length
        );


    } catch (error) {

        console.error(
            'Failed to load reservations:',
            error
        );

        tbody.innerHTML = `
            <tr>
                <td colspan="5"
                    style="
                        text-align:center;
                        padding:30px;
                        color:#ef4444;
                    ">

                    Failed to load reservations.

                </td>
            </tr>
        `;

        updateReservationCount(0);

    }
}


/* =========================
   RESERVATION COUNT
   ========================= */

function updateReservationCount(
    count
) {

    const reservationCount =
        document.getElementById(
            'dashboard-reservation-count'
        );

    if (reservationCount) {

        reservationCount.textContent =
            count;

    }
}


/* =========================
   TABLE SELECTION
   ========================= */

let selectedTableId = null;


window.selectTable =
    function (
        element,
        tableId
    ) {

        document
            .querySelectorAll(
                '.restaurant-table'
            )
            .forEach(
                function (table) {

                    table.classList.remove(
                        'selected'
                    );

                }
            );


        element.classList.add(
            'selected'
        );


        selectedTableId =
            Number(tableId);


        console.log(
            'Selected Table ID:',
            selectedTableId
        );

    };


/* =========================
   CONFIRM RESERVATION
   ========================= */

window.confirmReservation =
    async function () {

        const date =
            document.getElementById(
                'reservationDate'
            ).value;


        const time =
            document.getElementById(
                'reservationTime'
            ).value;


        const guests =
            document.getElementById(
                'guestCount'
            ).value;


        /* -------------------------
           VALIDATION
           ------------------------- */

        if (!date) {

            alert(
                'Please select a reservation date.'
            );

            return;
        }


        if (!time) {

            alert(
                'Please select a reservation time.'
            );

            return;
        }


        if (!selectedTableId) {

            alert(
                'Please select a table.'
            );

            return;
        }


        if (
            !guests ||
            Number(guests) < 1
        ) {

            alert(
                'Please enter the number of guests.'
            );

            return;
        }


        const userId =
            getCurrentUserId();


        if (!userId) {

            alert(
                'User ID not found. Please login again.'
            );

            return;
        }


        /* -------------------------
           CREATE LOCAL DATE TIME
           ------------------------- */

        const reservationDateTime =
            date +
            'T' +
            time;


        console.log(
            'Reservation Date Time:',
            reservationDateTime
        );


        /* -------------------------
           REQUEST BODY
           ------------------------- */

        const reservationData = {

            reservationTime:
                reservationDateTime,

            status:
                'PENDING',

            userId:
                Number(userId),

            tableId:
                Number(selectedTableId)

        };


        console.log(
            'Reservation Request:',
            reservationData
        );


        /* -------------------------
           SEND TO BACKEND
           ------------------------- */

        try {

            const response =
                await apiRequest(
                    'reservations',
                    {
                        method: 'POST',

                        body:
                            JSON.stringify(
                                reservationData
                            )
                    }
                );


            console.log(
                'Reservation Save Response:',
                response
            );


            /* -------------------------
               SUCCESS
               ------------------------- */

            alert(
                'Table reservation successfully created.'
            );


            /* -------------------------
               RESET
               ------------------------- */

            selectedTableId = null;


            document
                .querySelectorAll(
                    '.restaurant-table'
                )
                .forEach(
                    function (table) {

                        table.classList.remove(
                            'selected'
                        );

                    }
                );


            document.getElementById(
                'reservationDate'
            ).value = '';


            document.getElementById(
                'reservationTime'
            ).value = '';


            document.getElementById(
                'guestCount'
            ).value = '2';


            /* -------------------------
               LOAD NEW DATA
               ------------------------- */

            await fetchMyReservations();


            /* -------------------------
               SHOW RESERVATION PAGE
               ------------------------- */

            showSection(
                'reservation-section'
            );


        } catch (error) {

            console.error(
                'Reservation creation failed:',
                error
            );


            alert(
                'Failed to create reservation.\n\n' +
                error.message
            );

        }

    };

    /* =========================
       SECTION NAVIGATION
       ========================= */

    window.showSection =
        function (
            sectionId,
            clickedItem = null
        ) {

            const sections =
                document.querySelectorAll(
                    '.content-view, #dashboard-section'
                );


            sections.forEach(
                function (section) {

                    section.style.display =
                        'none';
                }
            );


            const selected =
                document.getElementById(
                    sectionId
                );


            if (!selected) {

                console.error(
                    'Section not found:',
                    sectionId
                );

                return;
            }


            selected.style.display =
                'block';


            document
                .querySelectorAll(
                    '.nav-item'
                )
                .forEach(
                    function (item) {

                        item.classList.remove(
                            'active'
                        );
                    }
                );


            if (clickedItem) {

                clickedItem.classList.add(
                    'active'
                );
            }


            switch (sectionId) {

                case 'dashboard-section':
                    loadDashboard();
                    break;

                case 'menu-section':
                    fetchMenuItems();
                    break;

                case 'cart-section':
                    updateCartUI();
                    break;

                case 'checkout-section':
                    updateCheckoutSummary();
                    break;

                case 'orders-section':
                    fetchMyOrders();
                    break;

                case 'reservation-section':
                    fetchMyReservations();
                    break;

                case 'profile-section':
                    loadUserInformation();
                    break;
            }
        };


    /* =========================
       DASHBOARD
       ========================= */

    async function loadDashboard() {

    await Promise.all([
        fetchMyOrders(),
        fetchMyReservations()
    ]);

    updateCartUI();
}


    /* =========================
       CHANGE PASSWORD
       ========================= */

    const passwordForm =
        document.getElementById(
            'changePasswordForm'
        );


    if (passwordForm) {

        passwordForm.addEventListener(
            'submit',
            async function (event) {

                event.preventDefault();


                const currentPassword =
                    document.getElementById(
                        'currentPassword'
                    ).value.trim();


                const newPassword =
                    document.getElementById(
                        'newPassword'
                    ).value.trim();


                const confirmPassword =
                    document.getElementById(
                        'confirmPassword'
                    ).value.trim();


                if (
                    newPassword !==
                    confirmPassword
                ) {

                    alert(
                        'New password and confirm password do not match.'
                    );

                    return;
                }


                if (
                    !currentPassword ||
                    !newPassword
                ) {

                    alert(
                        'Please fill all password fields.'
                    );

                    return;
                }


                const userId =
                    getCurrentUserId();


                if (!userId) {

                    alert(
                        'User ID not found.'
                    );

                    return;
                }


                const updateData = {

                    userId:
                        userId,

                    username:
                        currentUser.username,

                    password:
                        newPassword,

                    email:
                        currentUser.email,

                    role:
                        currentUser.role
                };


                try {

                    const response =
                        await apiRequest(
                            'users',
                            {
                                method: 'PUT',

                                body:
                                    JSON.stringify(
                                        updateData
                                    )
                            }
                        );


                    if (response) {

                        alert(
                            'Password changed successfully.'
                        );

                        passwordForm.reset();
                    }

                } catch (error) {

                    alert(
                        'Failed to change password.\n\n' +
                        error.message
                    );
                }
            }
        );
    }


    /* =========================
       LOGOUT
       ========================= */

    window.logout =
        function () {

            localStorage.clear();

            window.location.href =
                'login.html';
        };


    /* =========================
       DATE / TIME
       ========================= */

    function formatDate(date) {

        if (
            !date ||
            date === '-'
        ) {
            return '-';
        }


        try {

            return new Date(
                date
            ).toLocaleDateString();

        } catch (error) {

            return date;
        }
    }


    function extractDate(dateTime) {

        if (
            !dateTime ||
            dateTime === '-'
        ) {
            return '-';
        }


        const value =
            String(dateTime);


        if (
            value.includes('T')
        ) {

            return value.split(
                'T'
            )[0];
        }


        return formatDate(
            dateTime
        );
    }


    function extractTime(dateTime) {

        if (
            !dateTime ||
            dateTime === '-'
        ) {
            return '-';
        }


        const value =
            String(dateTime);


        if (
            value.includes('T')
        ) {

            return value
                .split('T')[1]
                .substring(0, 8);
        }


        return '-';
    }


    /* =========================
       ESCAPE
       ========================= */

    function escapeHtml(value) {

        return String(value)
            .replace(
                /&/g,
                '&amp;'
            )
            .replace(
                /</g,
                '&lt;'
            )
            .replace(
                />/g,
                '&gt;'
            )
            .replace(
                /"/g,
                '&quot;'
            )
            .replace(
                /'/g,
                '&#039;'
            );
    }


    function escapeJs(value) {

        return String(value)
            .replace(
                /\\/g,
                '\\\\'
            )
            .replace(
                /'/g,
                "\\'"
            );
    }


    /* =========================
       INITIAL LOAD
       ========================= */

    updateCartUI();

    loadDashboard();

});

// =====================================================
// RESTMANAGER CHATBOT
// Dynamic chatbot using real menu/order/reservation data
// =====================================================

const CHATBOT_BASE_URL = "http://localhost:8082/v1";


// =====================================================
// CHATBOT TOGGLE
// =====================================================

function toggleChatbot() {

    const chatbotWindow =
        document.getElementById("chatbotWindow");

    if (!chatbotWindow) return;

    if (chatbotWindow.style.display === "flex") {

        chatbotWindow.style.display = "none";

    } else {

        chatbotWindow.style.display = "flex";

        const input =
            document.getElementById("chatbotInput");

        if (input) {
            input.focus();
        }
    }
}


// =====================================================
// ENTER KEY
// =====================================================

function handleChatbotKey(event) {

    if (event.key === "Enter") {

        event.preventDefault();

        sendChatbotMessage();
    }
}


// =====================================================
// ADD MESSAGE
// =====================================================

function addChatbotMessage(message, sender) {

    const messages =
        document.getElementById("chatbotMessages");

    if (!messages) return;


    const messageDiv =
        document.createElement("div");

    messageDiv.className =
        sender === "user"
            ? "message user-message"
            : "message bot-message";


    const avatar =
        document.createElement("div");

    avatar.className = "message-avatar";


    const icon =
        document.createElement("i");

    icon.className =
        sender === "user"
            ? "fas fa-user"
            : "fas fa-robot";


    avatar.appendChild(icon);


    const content =
        document.createElement("div");

    content.className = "message-content";


    const paragraph =
        document.createElement("p");

    paragraph.innerHTML =
        escapeChatbotHTML(message)
            .replace(/\n/g, "<br>");


    content.appendChild(paragraph);


    messageDiv.appendChild(avatar);

    messageDiv.appendChild(content);

    messages.appendChild(messageDiv);


    messages.scrollTop =
        messages.scrollHeight;
}


// =====================================================
// TYPING
// =====================================================

function showChatbotTyping() {

    const messages =
        document.getElementById("chatbotMessages");

    if (!messages) return;


    const typing =
        document.createElement("div");

    typing.id = "chatbotTyping";

    typing.className =
        "message bot-message";


    typing.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>

        <div class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;


    messages.appendChild(typing);

    messages.scrollTop =
        messages.scrollHeight;
}


// =====================================================
// REMOVE TYPING
// =====================================================

function removeChatbotTyping() {

    const typing =
        document.getElementById("chatbotTyping");

    if (typing) {
        typing.remove();
    }
}


// =====================================================
// GET MENU ITEMS
// =====================================================

async function getChatbotMenuItems() {

    try {

        const token =
            localStorage.getItem("token");

        if (!token) {
            return [];
        }


        const authHeader =
            token.startsWith("Bearer ")
                ? token
                : "Bearer " + token.trim();


        const response =
            await fetch(
                `${CHATBOT_BASE_URL}/menu-item`,
                {
                    method: "GET",

                    headers: {
                        "Authorization": authHeader,
                        "Content-Type": "application/json"
                    }
                }
            );


        if (!response.ok) {

            console.error(
                "Chatbot menu API error:",
                response.status
            );

            return [];
        }


        const data =
            await response.json();


        /*
         * API එක array එකක් හෝ
         * { data: [...] } වගේ response එකක්
         * return කළත් handle කරන්න.
         */

        if (Array.isArray(data)) {
            return data;
        }


        if (Array.isArray(data.data)) {
            return data.data;
        }


        if (Array.isArray(data.content)) {
            return data.content;
        }


        return [];

    } catch (error) {

        console.error(
            "Chatbot menu loading error:",
            error
        );

        return [];
    }
}


// =====================================================
// FIND FIELD
// =====================================================

function getMenuField(item, possibleNames) {

    for (const name of possibleNames) {

        if (
            item[name] !== undefined &&
            item[name] !== null
        ) {

            return item[name];
        }
    }

    return null;
}


// =====================================================
// FORMAT PRICE
// =====================================================

function formatChatbotPrice(price) {

    const number =
        Number(price);

    if (Number.isNaN(number)) {
        return price;
    }

    return `Rs. ${number.toLocaleString("en-LK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}


// =====================================================
// MENU DATA RESPONSE
// =====================================================

async function getMenuBasedAnswer(message) {

    const menuItems =
        await getChatbotMenuItems();


    if (!menuItems.length) {

        return "Sorry, I couldn't load the menu data right now. Please try again. 😔";
    }


    const text =
        message.toLowerCase();


    // =================================================
    // MOST EXPENSIVE
    // =================================================

    if (
        text.includes("most expensive") ||
        text.includes("highest price") ||
        text.includes("highest priced") ||
        text.includes("maximum price") ||
        text.includes("max price") ||
        text.includes("expensive item")
    ) {

        const validItems =
            menuItems
                .map(item => {

                    const name =
                        getMenuField(item, [
                            "itemName",
                            "menuItemName",
                            "name"
                        ]);

                    const price =
                        getMenuField(item, [
                            "price",
                            "unitPrice",
                            "sellingPrice"
                        ]);


                    return {
                        name: name,
                        price: Number(price)
                    };

                })
                .filter(item =>
                    item.name &&
                    !Number.isNaN(item.price)
                );


        if (!validItems.length) {

            return "I couldn't find valid menu prices.";
        }


        const expensive =
            validItems.reduce(
                (max, item) =>
                    item.price > max.price
                        ? item
                        : max
            );


        return `The most expensive menu item is ${expensive.name}, priced at ${formatChatbotPrice(expensive.price)}. 🍽️`;
    }


    // =================================================
    // CHEAPEST
    // =================================================

    if (
        text.includes("cheapest") ||
        text.includes("lowest price") ||
        text.includes("least expensive") ||
        text.includes("cheapest item")
    ) {

        const validItems =
            menuItems
                .map(item => {

                    const name =
                        getMenuField(item, [
                            "itemName",
                            "menuItemName",
                            "name"
                        ]);

                    const price =
                        getMenuField(item, [
                            "price",
                            "unitPrice",
                            "sellingPrice"
                        ]);


                    return {
                        name: name,
                        price: Number(price)
                    };

                })
                .filter(item =>
                    item.name &&
                    !Number.isNaN(item.price)
                );


        if (!validItems.length) {

            return "I couldn't find valid menu prices.";
        }


        const cheapest =
            validItems.reduce(
                (min, item) =>
                    item.price < min.price
                        ? item
                        : min
            );


        return `The cheapest menu item is ${cheapest.name}, priced at ${formatChatbotPrice(cheapest.price)}. 💰`;
    }


    // =================================================
    // SHOW ALL MENU
    // =================================================

    if (
        text.includes("menu") ||
        text.includes("food") ||
        text.includes("items") ||
        text.includes("available food")
    ) {

        let answer =
            "Here are the available menu items:\n\n";


        menuItems.forEach((item, index) => {

            const name =
                getMenuField(item, [
                    "itemName",
                    "menuItemName",
                    "name"
                ]);


            const price =
                getMenuField(item, [
                    "price",
                    "unitPrice",
                    "sellingPrice"
                ]);


            if (name) {

                answer +=
                    `${index + 1}. ${name}`;

                if (
                    price !== null &&
                    price !== undefined
                ) {

                    answer +=
                        ` - ${formatChatbotPrice(price)}`;
                }


                answer += "\n";
            }
        });


        return answer.trim();
    }


    // =================================================
    // PRICE QUESTION
    // =================================================

    const mentionedItem =
        menuItems.find(item => {

            const name =
                getMenuField(item, [
                    "itemName",
                    "menuItemName",
                    "name"
                ]);


            return name &&
                text.includes(
                    String(name).toLowerCase()
                );
        });


    if (
        mentionedItem &&
        (
            text.includes("price") ||
            text.includes("cost") ||
            text.includes("how much")
        )
    ) {

        const name =
            getMenuField(
                mentionedItem,
                [
                    "itemName",
                    "menuItemName",
                    "name"
                ]
            );


        const price =
            getMenuField(
                mentionedItem,
                [
                    "price",
                    "unitPrice",
                    "sellingPrice"
                ]
            );


        return `${name} is priced at ${formatChatbotPrice(price)}. 💰`;
    }


    return null;
}


// =====================================================
// CHATBOT RESPONSE
// =====================================================

async function getChatbotResponse(message) {

    const text =
        message.toLowerCase().trim();


    // =================================================
    // GREETING
    // =================================================

    if (
        text === "hi" ||
        text === "hello" ||
        text === "hey" ||
        text.includes("good morning") ||
        text.includes("good afternoon") ||
        text.includes("good evening")
    ) {

        return "Hi! 👋 I'm RESTManager Assistant. How can I help you today?";
    }


    // =================================================
    // MENU
    // =================================================

    if (
        text.includes("menu") ||
        text.includes("food") ||
        text.includes("item") ||
        text.includes("price") ||
        text.includes("expensive") ||
        text.includes("cheapest") ||
        text.includes("cost")
    ) {

        const menuAnswer =
            await getMenuBasedAnswer(message);


        if (menuAnswer) {
            return menuAnswer;
        }
    }


    // =================================================
    // ORDER
    // =================================================

    if (
        text.includes("order") &&
        !text.includes("my order")
    ) {

        return "You can place an order from the Menu section. Select your food items, add them to the cart, and continue to checkout. 🛒";
    }


    // =================================================
    // CART
    // =================================================

    if (
        text.includes("cart")
    ) {

        return "You can check your selected items in the Cart section. 🛒";
    }


    // =================================================
    // CHECKOUT
    // =================================================

    if (
        text.includes("checkout") ||
        text.includes("check out")
    ) {

        return "After adding items to your cart, go to Checkout to confirm your order and continue with payment. 💳";
    }


    // =================================================
    // PAYMENT
    // =================================================

    if (
        text.includes("payment") ||
        text.includes("pay")
    ) {

        return "You can complete your order payment through the Checkout section. 💳";
    }


    // =================================================
    // RESERVATION
    // =================================================

    if (
        text.includes("reservation") ||
        text.includes("reserve") ||
        text.includes("booking") ||
        text.includes("book a table")
    ) {

        return "You can make a table reservation from the Reservations section. Select your date, time, and available table. 🪑";
    }


    // =================================================
    // PROFILE
    // =================================================

    if (
        text.includes("profile") ||
        text.includes("my account")
    ) {

        return "You can view and update your customer information from the Profile section. 👤";
    }


    // =================================================
    // PASSWORD
    // =================================================

    if (
        text.includes("password") ||
        text.includes("change password")
    ) {

        return "You can change your password from the Change Password section. 🔐";
    }


    // =================================================
    // THANKS
    // =================================================

    if (
        text.includes("thank") ||
        text === "thanks"
    ) {

        return "You're welcome! 😊";
    }


    // =================================================
    // BYE
    // =================================================

    if (
        text === "bye" ||
        text.includes("goodbye")
    ) {

        return "Goodbye! 👋 Have a great day!";
    }


    // =================================================
    // DEFAULT
    // =================================================

    return "I can help you with RESTManager menu items, prices, orders, cart, payments, reservations, and your account. 😊";
}


// =====================================================
// SEND MESSAGE
// =====================================================

async function sendChatbotMessage() {

    const input =
        document.getElementById("chatbotInput");

    const sendButton =
        document.getElementById("chatbotSendBtn");


    if (!input) return;


    const message =
        input.value.trim();


    if (!message) return;


    // User message
    addChatbotMessage(
        message,
        "user"
    );


    input.value = "";


    if (sendButton) {
        sendButton.disabled = true;
    }


    showChatbotTyping();


    try {

        const response =
            await getChatbotResponse(message);


        /*
         * Small delay so chatbot
         * looks natural.
         */
        await new Promise(
            resolve =>
                setTimeout(resolve, 500)
        );


        removeChatbotTyping();


        addChatbotMessage(
            response,
            "bot"
        );


    } catch (error) {

        console.error(
            "Chatbot error:",
            error
        );


        removeChatbotTyping();


        addChatbotMessage(
            "Sorry, something went wrong while getting the information. 😔",
            "bot"
        );

    } finally {

        if (sendButton) {
            sendButton.disabled = false;
        }


        input.focus();
    }
}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeChatbotHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        String(text);

    return div.innerHTML;
}