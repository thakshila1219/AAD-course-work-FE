document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');

    if (signupForm) {
        signupForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const name = document.getElementById('fullname').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();
            
            const alertMsg = document.getElementById('alert-msg');
            const btnSubmit = document.getElementById('btnSubmit');

            alertMsg.style.display = 'none';
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = 'Creating Account... <i class="fa-solid fa-spinner fa-spin"></i>';

            try {
                
const response = await fetch('http://localhost:8082/v1/users/register', { 
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        name: name,
        email: email,
        password: password,
        role: 'CUSTOMER' 
    })
});

                const data = await response.json();

                if (response.ok || response.status === 201) {
                    alertMsg.style.display = 'block';
                    alertMsg.style.backgroundColor = '#d4edda';
                    alertMsg.style.color = '#155724';
                    alertMsg.innerText = 'Account created successfully! Redirecting to login...';

                    signupForm.reset();

                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 1500);

                } else {
                    throw new Error(data.message || 'Registration failed');
                }
            } catch (error) {
                alertMsg.style.display = 'block';
                alertMsg.style.backgroundColor = '#f8d7da';
                alertMsg.style.color = '#721c24';
                alertMsg.innerText = error.message || 'Server connection failed';
                
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = 'Create Account <i class="fa-solid fa-user-plus"></i>';
            }
        });
    }
});
