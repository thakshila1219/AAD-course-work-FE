document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const alertMsg = document.getElementById('alert-msg');
            const btnSubmit = document.getElementById('btnSubmit');

            alertMsg.style.display = 'none';
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = 'Signing In... <i class="fa-solid fa-spinner fa-spin"></i>';

            try {
                const response = await fetch('http://localhost:8082/v1/users/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                });

                const text = await response.text();
                let data = {};
                if (text) {
                    try {
                        data = JSON.parse(text);
                    } catch (err) {
                        console.log("Response text is not valid JSON");
                    }
                }

                if (response.ok) {
                    console.log("Full Backend Response:", data);

                    // Extract role from common API wrapper formats
                    const userRole = data.role || 
                                     (data.data && data.data.role) || 
                                     (data.user && data.user.role) || 
                                     '';

                    console.log("Extracted Role:", userRole);

                    localStorage.setItem('token', data.token || (data.data && data.data.token) || 'dummy-token');
                    localStorage.setItem('userRole', userRole);
                    localStorage.setItem('user', JSON.stringify(data.user || { email: email }));

                    alertMsg.style.display = 'block';
                    alertMsg.style.backgroundColor = '#d4edda';
                    alertMsg.style.color = '#155724';
                    alertMsg.innerText = 'Login successful! Redirecting...';

                    setTimeout(() => {
                        if (userRole.toUpperCase() === 'ADMIN') {
                            window.location.href = 'admin_dashbord.html';
                        } else {
                            window.location.href = 'user_dashbord.html';
                        }
                    }, 1000);

                } else {
                    throw new Error(data.message || 'Login failed! Status: ' + response.status);
                }
            } catch (error) {
                alertMsg.style.display = 'block';
                alertMsg.style.backgroundColor = '#f8d7da';
                alertMsg.style.color = '#721c24';
                alertMsg.innerText = error.message || 'Server connection failed';

                btnSubmit.disabled = false;
                btnSubmit.innerHTML = 'Sign In <i class="fa-solid fa-arrow-right"></i>';
            }
        });
    }
});