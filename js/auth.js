// js/auth.js

document.addEventListener('DOMContentLoaded', () => {
    // =========================================
    // ১. আগেই লগইন করা থাকলে Dashboard-এ রিডাইরেক্ট করা
    // =========================================
    const currentUser = StorageManager.getCurrentUser();
    if (currentUser) {
        window.location.href = '../index.html';
        return;
    }

    // =========================================
    // ২. Password Show / Hide Toggle
    // =========================================
    const togglePasswordIcon = document.getElementById('toggle-password');
    if (togglePasswordIcon) {
        togglePasswordIcon.addEventListener('click', function () {
            const passwordInput = this.previousElementSibling;
            if (passwordInput) {
                const isPassword = passwordInput.getAttribute('type') === 'password';
                
                // Input Type পরিবর্তন
                passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
                
                // Boxicon Class পরিবর্তন (bx-hide <-> bx-show)
                this.classList.toggle('bx-hide', !isPassword);
                this.classList.toggle('bx-show', isPassword);
            }
        });
    }

    // =========================================
    // ৩. Sign Up Form Validation & Registration
    // =========================================
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('signup-name').value.trim();
            const email = document.getElementById('signup-email').value.trim().toLowerCase();
            const password = document.getElementById('signup-password').value;

            // Form Validation
            if (!name || !email || !password) {
                alert('Please fill in all required fields.');
                return;
            }

            if (password.length < 6) {
                alert('Password must be at least 6 characters long.');
                return;
            }

            // চেক করা যে ইমেইলটি আগে থেকেই রেজিস্টার্ড কিনা
            const existingUsers = StorageManager.getUsers();
            const isEmailTaken = existingUsers.some(user => user.email === email);

            if (isEmailTaken) {
                alert('An account with this email already exists!');
                return;
            }

            // নতুন User Object তৈরি
            const newUser = {
                id: 'user_' + Date.now(),
                name: name,
                email: email,
                password: password
            };

            // LocalStorage-এ সেভ এবং Auto-Login
            StorageManager.registerUser(newUser);
            StorageManager.setCurrentUser(newUser);

            alert('Account created successfully! Redirecting to dashboard...');
            window.location.href = '../index.html';
        });
    }

    // =========================================
    // ৪. Login Form Validation & Authentication
    // =========================================
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const email = document.getElementById('login-email').value.trim().toLowerCase();
            const password = document.getElementById('login-password').value;

            if (!email || !password) {
                alert('Please enter both email and password.');
                return;
            }

            // User খুঁজে বের করা
            const existingUsers = StorageManager.getUsers();
            const matchedUser = existingUsers.find(
                user => user.email === email && user.password === password
            );

            if (!matchedUser) {
                alert('Invalid email or password. Please try again.');
                return;
            }

            // Session সেভ করা এবং Dashboard-এ রিডাইরেক্ট করা
            StorageManager.setCurrentUser(matchedUser);
            window.location.href = '../index.html';
        });
    }
});