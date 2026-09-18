document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            e.stopPropagation();

            localStorage.clear();

            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            const alertMsg = document.getElementById('alert-msg');
            const btnSubmit = document.getElementById('btnSubmit');

            const email = emailInput ? emailInput.value.trim() : '';
            const password = passwordInput ? passwordInput.value.trim() : '';

            if (alertMsg) alertMsg.style.display = 'none';
            if (btnSubmit) btnSubmit.disabled = true;

            try {
                const response = await fetch('http://localhost:8082/v1/users/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email, password: password })
                });

                const responseData = await response.json();
                console.log("Full Server Response:", responseData);

                if (response.ok) {
                    const resObj = responseData.data || responseData;
                    let token = responseData.token || resObj.token || responseData.jwt || resObj.jwt || responseData.accessToken || resObj.accessToken || '';
                    let userData = resObj.user || resObj;

                    // Role Extraction
                    let rawRole = userData?.role?.name || userData?.role || responseData?.role || 'CUSTOMER';
                    const role = rawRole.toString().toUpperCase().replace('ROLE_', '').trim();
                    
                    console.log("Extracted Role:", role);

                    if (!token) {
                        token = 'Bearer dummy_session_token_' + Date.now();
                    } else if (!token.startsWith('Bearer ')) {
                        token = 'Bearer ' + token;
                    }

                    localStorage.setItem('token', token);
                    localStorage.setItem('user', JSON.stringify(userData));
                    localStorage.setItem('loggedUser', JSON.stringify(userData));
                    localStorage.setItem('userRole', role);

                    if (alertMsg) {
                        alertMsg.style.display = 'block';
                        alertMsg.style.backgroundColor = '#d4edda';
                        alertMsg.style.color = '#155724';
                        alertMsg.innerText = 'Login successful! Redirecting...';
                    }

                    // Flexible Redirection Logic
                    setTimeout(() => {
                        if (role.includes('ADMIN')) {
                            window.location.href = 'admin_dashbord.html';
                        } else if (role.includes('STAFF') || role.includes('KITCHEN') || role.includes('USER')) {
                            window.location.href = 'user_dashbord.html';
                        } else if (role.includes('CUSTOMER')) {
                            window.location.href = 'customer-dashbord.html';
                        } else {
                            window.location.href = 'customer-dashbord.html';
                        }
                    }, 400);

                } else {
                    throw new Error(responseData.message || 'Invalid email or password');
                }
            } catch (error) {
                console.error("Login Error:", error);
                if (alertMsg) {
                    alertMsg.style.display = 'block';
                    alertMsg.style.backgroundColor = '#f8d7da';
                    alertMsg.style.color = '#721c24';
                    alertMsg.innerText = error.message || 'Server connection failed';
                }
                if (btnSubmit) btnSubmit.disabled = false;
            }

            return false;
        });
    }
});