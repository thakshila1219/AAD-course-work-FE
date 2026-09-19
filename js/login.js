document.addEventListener('DOMContentLoaded', () => {

    const loginForm = document.getElementById('loginForm');

    if (!loginForm) {
        return;
    }


    loginForm.addEventListener('submit', async function (e) {

        e.preventDefault();
        e.stopPropagation();


        // Clear previous login data
        localStorage.clear();


        const emailInput =
            document.getElementById('email');

        const passwordInput =
            document.getElementById('password');

        const alertMsg =
            document.getElementById('alert-msg');

        const btnSubmit =
            document.getElementById('btnSubmit');


        const email =
            emailInput
                ? emailInput.value.trim()
                : '';


        const password =
            passwordInput
                ? passwordInput.value.trim()
                : '';


        if (alertMsg) {
            alertMsg.style.display = 'none';
        }


        if (btnSubmit) {
            btnSubmit.disabled = true;
        }


        try {

            // =====================================
            // LOGIN REQUEST
            // =====================================

            const response = await fetch(
                'http://localhost:8082/v1/users/login',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json'
                    },

                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                }
            );


            const responseData =
                await response.json();


            console.log(
                'Full Server Response:',
                responseData
            );


            // =====================================
            // CHECK RESPONSE
            // =====================================

            if (!response.ok) {

                throw new Error(
                    responseData.message ||
                    'Invalid email or password'
                );
            }


            // =====================================
            // GET RESPONSE OBJECT
            // =====================================

            const resObj =
                responseData.data ||
                responseData;


            console.log(
                'Login Data:',
                resObj
            );


            // =====================================
            // GET JWT TOKEN
            // =====================================

            let token =
                responseData.token ||
                resObj.token ||
                responseData.jwt ||
                resObj.jwt ||
                responseData.accessToken ||
                resObj.accessToken ||
                '';


            // JWT must exist
            if (!token) {

                console.error(
                    'No JWT token received from backend.'
                );

                throw new Error(
                    'Login successful, but backend did not return a JWT token.'
                );
            }


            // Remove Bearer if included
            token =
                token.replace(
                    /^Bearer\s+/i,
                    ''
                );


            console.log(
                'JWT token received successfully.'
            );


            // =====================================
            // GET USER DATA
            // =====================================

            const userData =
                resObj.user ||
                responseData.user ||
                resObj;


            console.log(
                'User Data:',
                userData
            );


            // =====================================
            // GET ROLE
            // =====================================

            let rawRole =
                userData?.role?.name ||
                userData?.role ||
                responseData?.role ||
                resObj?.role ||
                '';


            // Normalize role
            const role =
                rawRole
                    .toString()
                    .toUpperCase()
                    .replace('ROLE_', '')
                    .trim();


            console.log(
                '================================'
            );

            console.log(
                'LOGIN ROLE:',
                role
            );

            console.log(
                '================================'
            );


            // =====================================
            // CHECK ROLE
            // =====================================

            if (!role) {

                console.error(
                    'Role was not received from backend.'
                );

                throw new Error(
                    'Login successful, but user role was not received.'
                );
            }


            // =====================================
            // SAVE LOGIN DATA
            // =====================================

            localStorage.setItem(
                'token',
                token
            );


            localStorage.setItem(
                'user',
                JSON.stringify(userData)
            );


            localStorage.setItem(
                'loggedUser',
                JSON.stringify(userData)
            );


            localStorage.setItem(
                'userRole',
                role
            );


            console.log(
                'Token saved successfully.'
            );


            console.log(
                'Role saved successfully:',
                role
            );


            // =====================================
            // SUCCESS MESSAGE
            // =====================================

            if (alertMsg) {

                alertMsg.style.display = 'block';

                alertMsg.style.backgroundColor =
                    '#d4edda';

                alertMsg.style.color =
                    '#155724';

                alertMsg.innerText =
                    'Login successful! Redirecting...';
            }


            // =====================================
            // ROLE BASED REDIRECT
            // =====================================

            setTimeout(() => {


                // ADMIN
                if (role === 'ADMIN') {

                    console.log(
                        'Redirecting to ADMIN dashboard...'
                    );

                    window.location.href =
                        'admin_dashbord.html';

                }


                // STAFF
                else if (role === 'STAFF') {

                    console.log(
                        'Redirecting to STAFF dashboard...'
                    );

                    window.location.href =
                        'user_dashbord.html';

                }


                // CUSTOMER
                else if (role === 'CUSTOMER') {

                    console.log(
                        'Redirecting to CUSTOMER dashboard...'
                    );

                    window.location.href =
                        'customer-dashbord.html';

                }


                // UNKNOWN ROLE
                else {

                    console.error(
                        'Unknown user role:',
                        role
                    );

                    alert(
                        'Unknown user role: ' + role
                    );

                    window.location.href =
                        'customer-dashbord.html';
                }


            }, 400);


        } catch (error) {

            console.error(
                'Login Error:',
                error
            );


            if (alertMsg) {

                alertMsg.style.display = 'block';

                alertMsg.style.backgroundColor =
                    '#f8d7da';

                alertMsg.style.color =
                    '#721c24';

                alertMsg.innerText =
                    error.message ||
                    'Server connection failed';
            }


            if (btnSubmit) {
                btnSubmit.disabled = false;
            }
        }


        return false;

    });

});