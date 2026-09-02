(function () {
    const STORAGE_KEY = "todoApp.todos";
    const OLD_STORAGE_KEY = "todo-app-todos";
    const PRIORITIES = ["low", "medium", "high"];

    const state = {
        todos: [],
        filter: "all",
        search: "",
        editingId: null,
        pendingDeleteId: null
    };

    let isSaving = false;

    const form = document.getElementById("todo-form");
    const titleInput = document.getElementById("todo-title");
    const priorityInput = document.getElementById("todo-priority");
    const dueDateInput = document.getElementById("todo-due-date");
    const submitBtn = document.getElementById("submit-btn");
    const formError = document.getElementById("form-error");
    const searchInput = document.getElementById("search-input");
    const todoList = document.getElementById("todo-list");
    const emptyState = document.getElementById("empty-state");
    const emptyTitle = document.getElementById("empty-title");
    const emptyCopy = document.getElementById("empty-copy");
    const listStatus = document.getElementById("list-status");
    const clearCompletedBtn = document.getElementById("clear-completed-btn");
    const countTotal = document.getElementById("count-total");
    const countActive = document.getElementById("count-active");
    const countCompleted = document.getElementById("count-completed");
    const headerCount = document.getElementById("header-count");
    const remainingCount = document.getElementById("remaining-count");
    const filterButtons = document.querySelectorAll(".filter-btn");
    const deleteModal = document.getElementById("delete-modal");
    const deleteCancelBtn = document.getElementById("delete-cancel-btn");
    const deleteConfirmBtn = document.getElementById("delete-confirm-btn");
    const toastRegion = document.getElementById("toast-region");

    function createId() {
        return "todo_" + Date.now() + "_" + Math.random().toString(16).slice(2);
    }

    function normalizePriority(value) {
        return PRIORITIES.indexOf(value) === -1 ? "medium" : value;
    }

    function normalizeDueDate(value) {
        if (!value || typeof value !== "string") {
            return null;
        }

        return value;
    }

    function normalizeTodo(todo) {
        if (!todo || typeof todo !== "object") {
            return null;
        }

        const title = typeof todo.title === "string" ? todo.title.trim() : "";
        if (!title) {
            return null;
        }

        return {
            id: todo.id ? String(todo.id) : createId(),
            title: title,
            completed: Boolean(todo.completed),
            priority: normalizePriority(todo.priority),
            dueDate: normalizeDueDate(todo.dueDate),
            createdAt: typeof todo.createdAt === "number" ? todo.createdAt : Date.now()
        };
    }

    function loadTodos() {
        try {
            let raw = localStorage.getItem(STORAGE_KEY);

            if (!raw) {
                raw = localStorage.getItem(OLD_STORAGE_KEY);
            }

            const parsed = raw ? JSON.parse(raw) : [];
            const list = Array.isArray(parsed) ? parsed : [];

            state.todos = list.map(normalizeTodo).filter(Boolean);
        } catch (error) {
            state.todos = [];
        }
    }

    function saveTodos() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.todos));
    }

    function pad(value) {
        return String(value).padStart(2, "0");
    }

    function getTodayIso() {
        const now = new Date();
        return now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate());
    }

    function formatDisplayDate(dueDate) {
        const date = new Date(dueDate + "T00:00:00");
        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return date.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    }

    function getDueInfo(todo) {
        if (!todo.dueDate) {
            return { label: "", overdue: false };
        }

        const today = getTodayIso();

        if (!todo.completed && todo.dueDate < today) {
            return { label: "OVERDUE", overdue: true };
        }

        if (todo.dueDate === today) {
            return { label: "TODAY", overdue: false };
        }

        return { label: formatDisplayDate(todo.dueDate), overdue: false };
    }

    function pluralize(count, word) {
        return count + " " + word + (count === 1 ? "" : "s");
    }

    function getCounts() {
        const total = state.todos.length;
        const completed = state.todos.filter(function (todo) {
            return todo.completed;
        }).length;

        return {
            total: total,
            completed: completed,
            active: total - completed
        };
    }

    function matchesStatusFilter(todo) {
        if (state.filter === "active") {
            return !todo.completed;
        }

        if (state.filter === "completed") {
            return todo.completed;
        }

        return true;
    }

    function matchesSearch(todo) {
        if (!state.search) {
            return true;
        }

        return todo.title.toLowerCase().includes(state.search);
    }

    function getVisibleTodos() {
        return state.todos.filter(function (todo) {
            return matchesStatusFilter(todo) && matchesSearch(todo);
        });
    }

    function showFormError(message) {
        formError.textContent = message;
        formError.classList.toggle("hidden", !message);
    }

    function showToast(message) {
        const toast = document.createElement("div");
        toast.className = "toast";
        toast.textContent = message;
        toastRegion.appendChild(toast);

        window.setTimeout(function () {
            toast.remove();
        }, 2400);
    }

    function resetAddForm() {
        form.reset();
        priorityInput.value = "medium";
        showFormError("");
    }

    function addTodo(title, priority, dueDate) {
        state.todos.unshift({
            id: createId(),
            title: title,
            completed: false,
            priority: priority,
            dueDate: dueDate,
            createdAt: Date.now()
        });
    }

    function updateTodo(id, title, priority, dueDate) {
        state.todos = state.todos.map(function (todo) {
            if (todo.id !== id) {
                return todo;
            }

            return {
                id: todo.id,
                title: title,
                completed: todo.completed,
                priority: priority,
                dueDate: dueDate,
                createdAt: todo.createdAt
            };
        });
    }

    function deleteTodo(id) {
        state.todos = state.todos.filter(function (todo) {
            return todo.id !== id;
        });

        if (state.editingId === id) {
            state.editingId = null;
        }
    }

    function setTodoCompleted(id, completed) {
        state.todos = state.todos.map(function (todo) {
            if (todo.id !== id) {
                return todo;
            }

            return {
                id: todo.id,
                title: todo.title,
                completed: completed,
                priority: todo.priority,
                dueDate: todo.dueDate,
                createdAt: todo.createdAt
            };
        });
    }

    function clearCompleted() {
        if (state.editingId) {
            const editing = state.todos.find(function (todo) {
                return todo.id === state.editingId;
            });
            if (editing && editing.completed) {
                state.editingId = null;
            }
        }

        state.todos = state.todos.filter(function (todo) {
            return !todo.completed;
        });
    }

    function persistAndRender() {
        saveTodos();
        renderTodos();
    }

    function openDeleteModal(id) {
        state.pendingDeleteId = id;
        deleteModal.classList.remove("hidden");
        deleteConfirmBtn.focus();
    }

    function closeDeleteModal() {
        state.pendingDeleteId = null;
        deleteModal.classList.add("hidden");
    }

    function createEditForm(todo) {
        const editForm = document.createElement("form");
        editForm.className = "edit-form";
        editForm.dataset.id = todo.id;

        const titleField = document.createElement("input");
        titleField.type = "text";
        titleField.className = "edit-title";
        titleField.name = "title";
        titleField.value = todo.title;
        titleField.maxLength = 200;
        titleField.required = true;
        titleField.setAttribute("aria-label", "Edit title");

        const priorityField = document.createElement("select");
        priorityField.name = "priority";
        priorityField.setAttribute("aria-label", "Edit priority");
        PRIORITIES.forEach(function (value) {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value.charAt(0).toUpperCase() + value.slice(1);
            if (value === todo.priority) {
                option.selected = true;
            }
            priorityField.appendChild(option);
        });

        const dueField = document.createElement("input");
        dueField.type = "date";
        dueField.name = "dueDate";
        dueField.value = todo.dueDate || "";
        dueField.setAttribute("aria-label", "Edit due date");

        const actions = document.createElement("div");
        actions.className = "edit-actions";

        const saveBtn = document.createElement("button");
        saveBtn.type = "submit";
        saveBtn.className = "btn btn-primary";
        saveBtn.textContent = "Save changes";

        const cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.className = "btn btn-secondary";
        cancelBtn.dataset.action = "cancel-edit";
        cancelBtn.textContent = "Cancel";

        actions.appendChild(cancelBtn);
        actions.appendChild(saveBtn);

        editForm.appendChild(titleField);
        editForm.appendChild(priorityField);
        editForm.appendChild(dueField);
        editForm.appendChild(actions);

        return editForm;
    }

    function createTodoCard(todo) {
        const item = document.createElement("li");
        item.className = "todo-card" + (todo.completed ? " is-completed" : "");
        item.dataset.id = todo.id;

        if (state.editingId === todo.id) {
            item.classList.add("is-editing");
            item.appendChild(createEditForm(todo));
            return item;
        }

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = todo.completed;
        checkbox.className = "todo-toggle";
        checkbox.setAttribute("aria-label", todo.completed ? "Mark as active" : "Mark as completed");

        const main = document.createElement("div");
        main.className = "todo-main";
        const title = document.createElement("p");
        title.className = "todo-title";
        title.textContent = todo.title;
        main.appendChild(title);

        const dueInfo = getDueInfo(todo);
        const meta = document.createElement("div");
        meta.className = "todo-meta" + (dueInfo.overdue ? " is-overdue" : "");
        meta.textContent = dueInfo.label;

        const priority = document.createElement("span");
        priority.className = "priority priority-" + todo.priority;
        priority.textContent = todo.priority;

        const actions = document.createElement("div");
        actions.className = "todo-actions";

        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "icon-btn edit";
        editBtn.dataset.action = "edit";
        editBtn.setAttribute("aria-label", "Edit task");
        editBtn.textContent = "Edit";

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "icon-btn delete";
        deleteBtn.dataset.action = "delete";
        deleteBtn.setAttribute("aria-label", "Delete task");
        deleteBtn.textContent = "Delete";

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        item.appendChild(checkbox);
        item.appendChild(main);
        item.appendChild(meta);
        item.appendChild(priority);
        item.appendChild(actions);

        return item;
    }

    function renderCounts() {
        const counts = getCounts();
        countTotal.textContent = String(counts.total);
        countActive.textContent = String(counts.active);
        countCompleted.textContent = String(counts.completed);
        headerCount.textContent = pluralize(counts.total, "task");
        remainingCount.textContent = pluralize(counts.active, "task") + " remaining";
    }

    function renderEmptyState(visibleTodos) {
        const hasAnyTodos = state.todos.length > 0;
        const isEmpty = visibleTodos.length === 0;

        emptyState.classList.toggle("hidden", !isEmpty);

        if (!isEmpty) {
            listStatus.textContent = "";
            return;
        }

        if (!hasAnyTodos) {
            emptyTitle.textContent = "No tasks yet";
            emptyCopy.textContent = "Add your first task above";
        } else {
            emptyTitle.textContent = "No matching tasks";
            emptyCopy.textContent = "Try a different search term.";
        }

        listStatus.textContent = emptyTitle.textContent + ". " + emptyCopy.textContent;
    }

    function renderTodos() {
        const visibleTodos = getVisibleTodos();

        todoList.replaceChildren();
        visibleTodos.forEach(function (todo) {
            todoList.appendChild(createTodoCard(todo));
        });

        renderCounts();
        renderEmptyState(visibleTodos);
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        if (isSaving) {
            return;
        }

        const title = titleInput.value.trim();
        const priority = normalizePriority(priorityInput.value);
        const dueDate = normalizeDueDate(dueDateInput.value.trim());

        if (!title) {
            showFormError("Please enter a todo title.");
            titleInput.focus();
            return;
        }

        isSaving = true;
        submitBtn.disabled = true;

        addTodo(title, priority, dueDate);
        persistAndRender();
        resetAddForm();
        showToast("Task added");

        isSaving = false;
        submitBtn.disabled = false;
        titleInput.focus();
    });

    searchInput.addEventListener("input", function (event) {
        state.search = event.target.value.toLowerCase().trim();
        renderTodos();
    });

    filterButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            state.filter = button.dataset.filter;
            filterButtons.forEach(function (item) {
                const isActive = item === button;
                item.classList.toggle("is-active", isActive);
                item.setAttribute("aria-pressed", isActive ? "true" : "false");
            });
            renderTodos();
        });
    });

    clearCompletedBtn.addEventListener("click", function () {
        if (getCounts().completed === 0) {
            return;
        }

        clearCompleted();
        persistAndRender();
        showToast("Completed tasks cleared");
    });

    todoList.addEventListener("change", function (event) {
        const target = event.target;
        if (!target.classList.contains("todo-toggle")) {
            return;
        }

        const card = target.closest(".todo-card");
        if (!card) {
            return;
        }

        setTodoCompleted(card.dataset.id, target.checked);
        persistAndRender();

        if (target.checked) {
            showToast("Task completed");
        }
    });

    todoList.addEventListener("submit", function (event) {
        const editForm = event.target.closest(".edit-form");
        if (!editForm) {
            return;
        }

        event.preventDefault();

        const title = editForm.title.value.trim();
        if (!title) {
            editForm.title.focus();
            return;
        }

        updateTodo(
            editForm.dataset.id,
            title,
            normalizePriority(editForm.priority.value),
            normalizeDueDate(editForm.dueDate.value)
        );
        state.editingId = null;
        persistAndRender();
        showToast("Task updated");
    });

    todoList.addEventListener("click", function (event) {
        const button = event.target.closest("button[data-action]");
        if (!button) {
            return;
        }

        const card = button.closest(".todo-card");
        if (!card) {
            return;
        }

        const id = card.dataset.id;

        if (button.dataset.action === "cancel-edit") {
            state.editingId = null;
            renderTodos();
            return;
        }

        const todo = state.todos.find(function (item) {
            return item.id === id;
        });

        if (!todo) {
            return;
        }

        if (button.dataset.action === "edit") {
            state.editingId = todo.id;
            renderTodos();
            const editTitle = todoList.querySelector(".edit-title");
            if (editTitle) {
                editTitle.focus();
            }
            return;
        }

        if (button.dataset.action === "delete") {
            openDeleteModal(id);
        }
    });

    deleteCancelBtn.addEventListener("click", function () {
        closeDeleteModal();
    });

    deleteModal.addEventListener("click", function (event) {
        if (event.target.dataset.modalDismiss === "true") {
            closeDeleteModal();
        }
    });

    deleteConfirmBtn.addEventListener("click", function () {
        if (!state.pendingDeleteId) {
            return;
        }

        deleteTodo(state.pendingDeleteId);
        closeDeleteModal();
        persistAndRender();
        showToast("Task deleted");
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && !deleteModal.classList.contains("hidden")) {
            closeDeleteModal();
        }
    });

    loadTodos();
    renderTodos();
})();
