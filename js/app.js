// js/app.js

document.addEventListener('DOMContentLoaded', () => {
    // =========================================
    // ১. সেসন গার্ড (Authentication Check)
    // =========================================
    const isDashboardPage = window.location.pathname.endsWith('index.html') || 
                            window.location.pathname === '/' || 
                            window.location.pathname.endsWith('/todo-app/');
                            
    const currentUser = StorageManager.getCurrentUser();

    // ইউজার লগইন না থাকলে Login পেজে রিডাইরেক্ট করা
    if (isDashboardPage && !currentUser) {
        window.location.href = 'pages/login.html';
        return;
    }

    // ড্যাশবোর্ডে ইউজারের নাম আপডেট করা
    const userNameElement = document.getElementById('user-name');
    if (userNameElement && currentUser) {
        userNameElement.textContent = currentUser.name;
    }

    // =========================================
    // ২. Global Theme Toggle (Light / Dark Mode)
    // =========================================
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeText = document.getElementById('theme-text');
    const htmlElement = document.documentElement;

    // পূর্বে সেভ করা থিম ইনিশিয়ালাইজেশন
    const savedTheme = StorageManager.getTheme();
    applyTheme(savedTheme);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            applyTheme(newTheme);
            StorageManager.setTheme(newTheme);
        });
    }

    function applyTheme(theme) {
        htmlElement.setAttribute('data-theme', theme);
        
        if (themeToggleBtn) {
            const icon = themeToggleBtn.querySelector('i');
            if (theme === 'dark') {
                if (icon) icon.className = 'bx bx-sun';
                if (themeText) themeText.textContent = 'Light Mode';
            } else {
                if (icon) icon.className = 'bx bx-moon';
                if (themeText) themeText.textContent = 'Dark Mode';
            }
        }
    }

    // =========================================
    // ৩. Global Logout Handler
    // =========================================
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to log out?')) {
                StorageManager.clearCurrentUser();
                window.location.href = 'pages/login.html';
            }
        });
    }
});