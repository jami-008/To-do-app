// js/storage.js

class StorageManager {
    // =========================================
    // 1. Theme Management (Light / Dark Mode)
    // =========================================
    static getTheme() {
        return localStorage.getItem('prodo_theme') || 'light';
    }

    static setTheme(theme) {
        localStorage.setItem('prodo_theme', theme);
    }

    // =========================================
    // 2. User Authentication & Session Storage
    // =========================================
    static getUsers() {
        return JSON.parse(localStorage.getItem('prodo_users')) || [];
    }

    static registerUser(user) {
        const users = this.getUsers();
        users.push(user);
        localStorage.setItem('prodo_users', JSON.stringify(users));
    }

    static getCurrentUser() {
        return JSON.parse(localStorage.getItem('prodo_current_user')) || null;
    }

    static setCurrentUser(user) {
        // পাসওয়ার্ড ছাড়া কেবল প্রয়োজনীয় ইনফো সেসন হিসেবে সেভ করা
        const sessionUser = {
            id: user.id,
            name: user.name,
            email: user.email
        };
        localStorage.setItem('prodo_current_user', JSON.stringify(sessionUser));
    }

    static clearCurrentUser() {
        localStorage.removeItem('prodo_current_user');
    }

    // =========================================
    // 3. User-Specific Task Storage
    // =========================================
    static getTasks(userId) {
        if (!userId) return [];
        const allTasks = JSON.parse(localStorage.getItem('prodo_tasks')) || {};
        return allTasks[userId] || [];
    }

    static saveTasks(userId, tasks) {
        if (!userId) return;
        const allTasks = JSON.parse(localStorage.getItem('prodo_tasks')) || {};
        allTasks[userId] = tasks;
        localStorage.setItem('prodo_tasks', JSON.stringify(allTasks));
    }
}