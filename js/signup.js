document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');

    if (signupForm) {
        signupForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Form Inputs වලින් Values ලබා ගැනීම
            const name = document.getElementById('fullname').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();
            
            const alertMsg = document.getElementById('alert-msg');
            const btnSubmit = document.getElementById('btnSubmit');

            // UI Elements Loading State එකට සැකසීම
            alertMsg.style.display = 'none';
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = 'Creating Account... <i class="fa-solid fa-spinner fa-spin"></i>';

            try {
                // Backend Endpoint Call එක (v1/users/register)
                // Register Request එක යවන ස්ථානය
const response = await fetch('http://localhost:8082/v1/users/register', { // හෝ ඔයාගේ Sign Up API URL එක
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        name: name,
        email: email,
        password: password,
        role: 'CUSTOMER' // <-- මෙන්න මේ පේළිය අනිවාර්යයෙන්ම එකතු කරන්න
    })
});

                const data = await response.json();

                if (response.ok || response.status === 201) {
                    // Success Message එක පෙන්වීම
                    alertMsg.style.display = 'block';
                    alertMsg.style.backgroundColor = '#d4edda';
                    alertMsg.style.color = '#155724';
                    alertMsg.innerText = 'Account created successfully! Redirecting to login...';

                    // Form එක Clear කිරීම
                    signupForm.reset();

                    // තත්පර 1.5 කින් Login Page එකට Redirect කිරීම
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 1500);

                } else {
                    // Backend එකෙන් error message එකක් ආවොත් ඒක Throw කිරීම
                    throw new Error(data.message || 'Registration failed');
                }
            } catch (error) {
                // Error එක Alert Box එකේ පෙන්වීම
                alertMsg.style.display = 'block';
                alertMsg.style.backgroundColor = '#f8d7da';
                alertMsg.style.color = '#721c24';
                alertMsg.innerText = error.message || 'Server connection failed';
                
                // Submit Button එක නැවත Normal state එකට පත්කිරීම
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = 'Create Account <i class="fa-solid fa-user-plus"></i>';
            }
        });
    }
});