document.addEventListener('DOMContentLoaded', function () {

    const signupForm = document.getElementById('signupForm');

    if (!signupForm) {
        console.error('signupForm not found');
        return;
    }

    signupForm.addEventListener('submit', async function (e) {

        e.preventDefault();

        const usernameElement = document.getElementById('fullname');
        const emailElement = document.getElementById('email');
        const phoneElement = document.getElementById('phoneNumber');
        const passwordElement = document.getElementById('password');

        const alertMsg = document.getElementById('alert-msg');
        const btnSubmit = document.getElementById('btnSubmit');

        if (!usernameElement || !emailElement || !phoneElement || !passwordElement) {
            console.error('One or more signup fields are missing.');
            return;
        }

        const username = usernameElement.value.trim();
        const email = emailElement.value.trim();
        const phoneNumber = phoneElement.value.trim();
        const password = passwordElement.value.trim();

        console.log('========== SIGNUP START ==========');
        console.log('Username:', username);
        console.log('Email:', email);
        console.log('Phone:', phoneNumber);

        const phonePattern = /^0[0-9]{9}$/;

        if (!phonePattern.test(phoneNumber)) {

            if (alertMsg) {
                alertMsg.style.display = 'block';
                alertMsg.style.backgroundColor = '#f8d7da';
                alertMsg.style.color = '#721c24';
                alertMsg.innerText =
                    'Please enter a valid Sri Lankan mobile number. Example: 0771234567';
            }

            return;
        }

        if (alertMsg) {
            alertMsg.style.display = 'none';
        }

        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.innerHTML =
                'Creating Account... <i class="fa-solid fa-spinner fa-spin"></i>';
        }

        try {

            const response = await fetch(
                'http://localhost:8082/v1/users/register',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: username,
                        email: email,
                        phoneNumber: phoneNumber,
                        password: password,
                        role: 'CUSTOMER'
                    })
                }
            );

            console.log('Register HTTP Status:', response.status);

            let data = {};

            try {
                data = await response.json();
            } catch (error) {
                console.log('Response has no JSON body.');
            }

            console.log('Register Response:', data);

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    data.error ||
                    'Registration failed'
                );
            }

            console.log('========== REGISTER SUCCESS ==========');

            if (alertMsg) {
                alertMsg.style.display = 'block';
                alertMsg.style.backgroundColor = '#d4edda';
                alertMsg.style.color = '#155724';
                alertMsg.innerText =
                    'Account created successfully! Redirecting to login...';
            }

            signupForm.reset();

            setTimeout(function () {
                window.location.href = 'login.html';
            }, 1500);

        } catch (error) {

            console.error('Registration Error:', error);

            if (alertMsg) {
                alertMsg.style.display = 'block';
                alertMsg.style.backgroundColor = '#f8d7da';
                alertMsg.style.color = '#721c24';
                alertMsg.innerText =
                    error.message || 'Server connection failed';
            }

            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML =
                    'Create Account <i class="fa-solid fa-user-plus"></i>';
            }
        }
    });
});