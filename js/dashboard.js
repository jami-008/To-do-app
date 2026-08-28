// js/dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    // =========================================
    // ১. সেসন এবং ইনিশিয়াল স্টেট লোড
    // =========================================
    const currentUser = StorageManager.getCurrentUser();
    if (!currentUser) return; // app.js handles routing

    let tasks = StorageManager.getTasks(currentUser.id) || [];
    let currentFilter = 'all';
    let searchQuery = '';
    let currentSort = 'newest';

    // DOM Elements
    const taskForm = document.getElementById('task-form');
    const taskTitleInput = document.getElementById('task-title');
    const taskDueDateInput = document.getElementById('task-due-date');
    const taskPriorityInput = document.getElementById('task-priority');
    const taskCategoryInput = document.getElementById('task-category');

    const taskList = document.getElementById('task-list');
    const searchInput = document.getElementById('search-task');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const sortSelect = document.getElementById('sort-task');

    const progressText = document.getElementById('progress-text');
    const progressFill = document.getElementById('progress-fill');

    // প্রথমবার পেজ লোডে টাস্ক রেন্ডার করা
    renderTasks();

    // =========================================
    // ২. Task Create (Add Task)
    // =========================================
    if (taskForm) {
        taskForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const title = taskTitleInput.value.trim();
            const dueDate = taskDueDateInput.value;
            const priority = taskPriorityInput.value;
            const category = taskCategoryInput.value;

            if (!title) return;

            const newTask = {
                id: 'task_' + Date.now(),
                title: title,
                dueDate: dueDate,
                priority: priority,
                category: category,
                completed: false,
                createdAt: Date.now()
            };

            tasks.unshift(newTask);
            saveAndRender();
            taskForm.reset();
        });
    }

    // =========================================
    // ৩. Live Search & Filters
    // =========================================
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            renderTasks();
        });
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });

    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            renderTasks();
        });
    }

    // =========================================
    // ৪. Event Delegation (Toggle & Delete)
    // =========================================
    if (taskList) {
        taskList.addEventListener('click', (e) => {
            const taskItem = e.target.closest('.task-item');
            if (!taskItem) return;

            const taskId = taskItem.dataset.id;

            // Task Completion Toggle
            if (e.target.classList.contains('task-checkbox') || e.target.classList.contains('task-text')) {
                toggleTaskStatus(taskId);
            }

            // Task Delete
            if (e.target.closest('.delete-btn')) {
                deleteTask(taskId);
            }
        });
    }

    function toggleTaskStatus(id) {
        tasks = tasks.map(task => {
            if (task.id === id) {
                return { ...task, completed: !task.completed };
            }
            return task;
        });
        saveAndRender();
    }

    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        saveAndRender();
    }

    function saveAndRender() {
        StorageManager.saveTasks(currentUser.id, tasks);
        renderTasks();
    }

    // =========================================
    // ৫. Dynamic Progress Bar Logic
    // =========================================
    function updateProgress() {
        if (!progressText || !progressFill) return;

        if (tasks.length === 0) {
            progressText.textContent = '0%';
            progressFill.style.width = '0%';
            return;
        }

        const completedTasks = tasks.filter(t => t.completed).length;
        const percentage = Math.round((completedTasks / tasks.length) * 100);

        progressText.textContent = `${percentage}%`;
        progressFill.style.width = `${percentage}%`;
    }

    // =========================================
    // ৬. Data Processing (Filtering & Sorting)
    // =========================================
    function getProcessedTasks() {
        return tasks
            .filter(task => {
                const matchesSearch = task.title.toLowerCase().includes(searchQuery);

                let matchesFilter = true;
                if (currentFilter === 'active') matchesFilter = !task.completed;
                if (currentFilter === 'completed') matchesFilter = task.completed;

                return matchesSearch && matchesFilter;
            })
            .sort((a, b) => {
                if (currentSort === 'priority') {
                    const weight = { 'High': 3, 'Medium': 2, 'Low': 1 };
                    return weight[b.priority] - weight[a.priority];
                }
                if (currentSort === 'due') {
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                }
                // Default: Newest first
                return b.createdAt - a.createdAt;
            });
    }

    // =========================================
    // ৭. DOM Rendering
    // =========================================
    function renderTasks() {
        updateProgress();
        const processedTasks = getProcessedTasks();

        if (processedTasks.length === 0) {
            taskList.innerHTML = `
                <li style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
                    <i class='bx bx-clipboard' style="font-size: 48px; margin-bottom: 10px;"></i>
                    <p>No tasks found.</p>
                </li>
            `;
            return;
        }

        taskList.innerHTML = processedTasks.map(task => {
            const formattedDate = task.dueDate 
                ? new Date(task.dueDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) 
                : 'No due date';

            return `
                <li class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                    <div class="task-content">
                        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                            <span class="task-text">${escapeHTML(task.title)}</span>
                            <div style="display: flex; gap: 8px; align-items: center; font-size: 12px; color: var(--text-muted);">
                                <span style="font-weight: 600; padding: 2px 6px; border-radius: 4px; background: rgba(99, 102, 241, 0.1); color: var(--primary-color);">
                                    ${task.priority}
                                </span>
                                <span style="padding: 2px 6px; border-radius: 4px; background: var(--border-color);">
                                    ${task.category}
                                </span>
                                <span><i class='bx bx-time'></i> ${formattedDate}</span>
                            </div>
                        </div>
                    </div>
                    <button class="delete-btn" title="Delete Task">
                        <i class='bx bx-trash'></i>
                    </button>
                </li>
            `;
        }).join('');
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }
});