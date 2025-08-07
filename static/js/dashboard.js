// Complete HERA Dashboard JavaScript
// Handles all dashboard interactions, modals, and functionality

let currentEditingTaskId = null;
let currentEditingBudgetId = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

function initializeDashboard() {
    console.log('🎯 Initializing HERA Dashboard...');

    setupModals();
    setupInteractiveElements();
    setupKeyboardShortcuts();
    setupProgressAnimations();

    console.log('✅ Dashboard initialized successfully');
}

// =============================================================================
// MODAL MANAGEMENT
// =============================================================================

function setupModals() {
    // Close modals when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            const modalId = e.target.id;
            closeModal(modalId);
        }
    });

    // Close modals with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal.show');
            if (openModal) {
                closeModal(openModal.id);
            }
        }
    });

    // Setup form submissions
    setupFormSubmissions();
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevent background scroll

        // Focus first input if available
        const firstInput = modal.querySelector('input, textarea, select');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = ''; // Restore scroll

        // Reset form if it exists
        const form = modal.querySelector('form');
        if (form) form.reset();

        // Clear editing IDs
        currentEditingTaskId = null;
        currentEditingBudgetId = null;
    }
}

// =============================================================================
// TASK MANAGEMENT
// =============================================================================

function toggleTaskStatus(taskId) {
    console.log('Toggling task status:', taskId);

    const taskItem = document.querySelector(`[data-task-id="${taskId}"]`);
    const checkbox = document.querySelector(`#task-${taskId}`);

    if (!taskItem || !checkbox) return;

    // Add loading state
    taskItem.classList.add('completing');

    // Determine new status
    const newCompleted = checkbox.checked;
    const newStatus = newCompleted ? 'Complete' : 'In Progress';

    // Make API call
    fetch(`/api/tasks/${taskId}/toggle`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            completed: newCompleted,
            status: newStatus
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update UI
            if (newCompleted) {
                taskItem.classList.add('completed');
            } else {
                taskItem.classList.remove('completed');
            }

            // Update task status display
            const statusElement = taskItem.querySelector('.task-status');
            if (statusElement) {
                statusElement.textContent = newStatus;
                statusElement.className = `task-status status-${newStatus.toLowerCase().replace(' ', '-')}`;
            }

            // Update progress
            updateTaskProgress();

            showNotification(
                newCompleted ? 'Task marked as complete!' : 'Task marked as in progress',
                'success'
            );
        } else {
            // Revert checkbox if failed
            checkbox.checked = !newCompleted;
            showNotification('Failed to update task status', 'error');
        }
    })
    .catch(error => {
        console.error('Error toggling task:', error);
        checkbox.checked = !newCompleted;
        showNotification('Error updating task', 'error');
    })
    .finally(() => {
        taskItem.classList.remove('completing');
    });
}

function editTask(taskId) {
    console.log('Editing task:', taskId);

    // Find task data
    const taskData = window.HERA_DATA?.tasks?.find(t => t.id === taskId);
    if (!taskData) {
        console.error('Task data not found:', taskId);
        return;
    }

    currentEditingTaskId = taskId;

    // Populate edit modal (create if doesn't exist)
    showTaskEditModal(taskData);
}

function showTaskEditModal(taskData) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('edit-task-modal');
    if (!modal) {
        modal = createTaskEditModal();
        document.body.appendChild(modal);
    }

    // Populate form
    const form = modal.querySelector('form');
    if (form) {
        form.querySelector('#edit-task-name').value = taskData.task || '';
        form.querySelector('#edit-task-deadline').value = taskData.deadline || '';
        form.querySelector('#edit-task-status').value = taskData.status || '';
        form.querySelector('#edit-task-notes').value = taskData.notes || '';
    }

    openModal('edit-task-modal');
}

function createTaskEditModal() {
    const modal = document.createElement('div');
    modal.id = 'edit-task-modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Edit Task</h3>
                <button class="modal-close" onclick="closeModal('edit-task-modal')">&times;</button>
            </div>
            <form id="edit-task-form">
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Task Name</label>
                        <input type="text" class="form-input" id="edit-task-name" required>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Deadline</label>
                        <input type="date" class="form-input" id="edit-task-deadline">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Status</label>
                        <select class="form-select" id="edit-task-status">
                            <option value="Not Started">Not Started</option>
                            <option value="In Progress">In Progress</option>
                            <option value="In Progress, On Schedule">In Progress, On Schedule</option>
                            <option value="In Progress, Behind Schedule">In Progress, Behind Schedule</option>
                            <option value="Complete">Complete</option>
                            <option value="Complete, On Schedule">Complete, On Schedule</option>
                            <option value="Ahead Schedule, Complete">Ahead Schedule, Complete</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Notes</label>
                        <textarea class="form-textarea" id="edit-task-notes" rows="3"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('edit-task-modal')">Cancel</button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i>
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    `;
    return modal;
}

function saveTaskChanges() {
    if (!currentEditingTaskId) return;

    const form = document.getElementById('edit-task-form');
    const formData = new FormData(form);

    const data = {
        task: form.querySelector('#edit-task-name').value,
        deadline: form.querySelector('#edit-task-deadline').value,
        status: form.querySelector('#edit-task-status').value,
        notes: form.querySelector('#edit-task-notes').value
    };

    fetch(`/api/tasks/${currentEditingTaskId}/update`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Task updated successfully!', 'success');
            closeModal('edit-task-modal');

            // Update task display
            updateTaskDisplay(currentEditingTaskId, data.task);
        } else {
            showNotification('Failed to update task', 'error');
        }
    })
    .catch(error => {
        console.error('Error updating task:', error);
        showNotification('Error updating task', 'error');
    });
}

function updateTaskDisplay(taskId, taskData) {
    const taskItem = document.querySelector(`[data-task-id="${taskId}"]`);
    if (!taskItem) return;

    // Update task name
    const nameElement = taskItem.querySelector('.task-name');
    if (nameElement) nameElement.textContent = taskData.task;

    // Update deadline
    const deadlineElement = taskItem.querySelector('.task-deadline');
    if (deadlineElement) deadlineElement.textContent = `Due: ${taskData.deadline}`;

    // Update status
    const statusElement = taskItem.querySelector('.task-status');
    if (statusElement) {
        statusElement.textContent = taskData.status;
        statusElement.className = `task-status status-${taskData.status.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    }

    // Update notes
    const notesElement = taskItem.querySelector('.task-notes');
    if (notesElement) {
        if (taskData.notes) {
            notesElement.textContent = taskData.notes;
            notesElement.style.display = 'block';
        } else {
            notesElement.style.display = 'none';
        }
    }
}

function updateTaskProgress() {
    const taskItems = document.querySelectorAll('.task-item');
    const completedTasks = document.querySelectorAll('.task-item.completed');

    const totalTasks = taskItems.length;
    const completed = completedTasks.length;
    const percentage = totalTasks > 0 ? (completed / totalTasks) * 100 : 0;

    // Update progress bar
    const progressBar = document.querySelector('.task-progress-bar .progress-fill');
    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }

    // Update progress text
    const progressText = document.querySelector('.task-progress-bar .progress-text');
    if (progressText) {
        progressText.textContent = `${Math.round(percentage)}% Complete`;
    }

    // Update widget subtitle
    const subtitle = document.querySelector('.widget-title + .widget-subtitle');
    if (subtitle && subtitle.textContent.includes('completed')) {
        subtitle.textContent = `${completed} of ${totalTasks} completed`;
    }

    // Update stats card
    const statsNumber = document.querySelector('.stat-card .stat-number');
    if (statsNumber && statsNumber.textContent.includes('/')) {
        statsNumber.textContent = `${completed}/${totalTasks}`;
    }
}

// =============================================================================
// BUDGET MANAGEMENT
// =============================================================================

function openBudgetModal(budgetId) {
    console.log('Opening budget modal for:', budgetId);

    // Find budget data
    const budgetData = window.HERA_DATA?.budget?.find(b => b.id === budgetId);
    if (!budgetData) return;

    currentEditingBudgetId = budgetId;
    showBudgetEditModal(budgetData);
}

function showBudgetEditModal(budgetData) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('edit-budget-modal');
    if (!modal) {
        modal = createBudgetEditModal();
        document.body.appendChild(modal);
    }

    // Populate form
    const form = modal.querySelector('form');
    if (form) {
        form.querySelector('#edit-budget-category').value = budgetData.category || '';
        form.querySelector('#edit-budget-amount').value = budgetData.budget || '';
        form.querySelector('#edit-budget-saved').value = budgetData.saved || '';
        form.querySelector('#edit-budget-status').value = budgetData.status || '';
        form.querySelector('#edit-budget-notes').value = budgetData.notes || '';
    }

    openModal('edit-budget-modal');
}

function createBudgetEditModal() {
    const modal = document.createElement('div');
    modal.id = 'edit-budget-modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Edit Budget Item</h3>
                <button class="modal-close" onclick="closeModal('edit-budget-modal')">&times;</button>
            </div>
            <form id="edit-budget-form">
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Category</label>
                        <input type="text" class="form-input" id="edit-budget-category" required>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Budget Amount</label>
                            <input type="number" class="form-input" id="edit-budget-amount" step="0.01" min="0" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Amount Saved</label>
                            <input type="number" class="form-input" id="edit-budget-saved" step="0.01" min="0">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Status</label>
                        <select class="form-select" id="edit-budget-status">
                            <option value="Outstanding">Outstanding</option>
                            <option value="Paid">Paid</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Notes</label>
                        <textarea class="form-textarea" id="edit-budget-notes" rows="3"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('edit-budget-modal')">Cancel</button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i>
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    `;
    return modal;
}

// =============================================================================
// INTERACTIVE ELEMENTS
// =============================================================================

function setupInteractiveElements() {
    // Setup hover effects for cards
    setupCardHovers();

    // Setup click handlers for navigation
    setupNavigationHandlers();

    // Setup budget item interactions
    setupBudgetInteractions();
}

function setupCardHovers() {
    const cards = document.querySelectorAll('.stat-card, .action-card, .task-item, .budget-item-compact');

    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

function setupNavigationHandlers() {
    // Quick action cards
    const actionCards = document.querySelectorAll('.action-card');
    actionCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Prevent double-click issues
            if (e.detail > 1) return;

            const href = this.getAttribute('onclick');
            if (href && href.includes('window.location.href')) {
                // Extract URL from onclick
                const url = href.match(/'([^']+)'/)[1];
                window.location.href = url;
            }
        });
    });
}

function setupBudgetInteractions() {
    const budgetItems = document.querySelectorAll('.budget-item-compact');

    budgetItems.forEach(item => {
        item.addEventListener('click', function() {
            // Extract budget ID from data attribute or other method
            const budgetId = this.dataset.budgetId;
            if (budgetId) {
                openBudgetModal(parseInt(budgetId));
            }
        });
    });
}

// =============================================================================
// FORM SUBMISSIONS
// =============================================================================

function setupFormSubmissions() {
    // Task edit form
    document.addEventListener('submit', function(e) {
        if (e.target.id === 'edit-task-form') {
            e.preventDefault();
            saveTaskChanges();
        }

        if (e.target.id === 'edit-budget-form') {
            e.preventDefault();
            saveBudgetChanges();
        }
    });
}

function saveBudgetChanges() {
    if (!currentEditingBudgetId) return;

    const form = document.getElementById('edit-budget-form');
    const data = {
        category: form.querySelector('#edit-budget-category').value,
        budget_amount: parseFloat(form.querySelector('#edit-budget-amount').value),
        budget_saved: parseFloat(form.querySelector('#edit-budget-saved').value),
        status: form.querySelector('#edit-budget-status').value,
        notes: form.querySelector('#edit-budget-notes').value
    };

    fetch(`/api/budget/update`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: currentEditingBudgetId, ...data })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Budget item updated successfully!', 'success');
            closeModal('edit-budget-modal');

            // Refresh page or update display
            setTimeout(() => window.location.reload(), 1000);
        } else {
            showNotification('Failed to update budget item', 'error');
        }
    })
    .catch(error => {
        console.error('Error updating budget:', error);
        showNotification('Error updating budget item', 'error');
    });
}

// =============================================================================
// KEYBOARD SHORTCUTS
// =============================================================================

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Only activate shortcuts when not in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        // Escape key - close any open modal
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal.show');
            if (openModal) {
                closeModal(openModal.id);
                e.preventDefault();
            }
        }

        // Ctrl/Cmd + B - Go to budget page
        if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
            e.preventDefault();
            window.location.href = '/budget';
        }

        // Ctrl/Cmd + T - Go to travel page
        if ((e.ctrlKey || e.metaKey) && e.key === 't') {
            e.preventDefault();
            window.location.href = '/travel';
        }

        // Ctrl/Cmd + I - Go to itinerary page
        if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
            e.preventDefault();
            window.location.href = '/itinerary';
        }

        // Ctrl/Cmd + P - Go to packing page
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            window.location.href = '/packing';
        }

        // R key - Go to ring page
        if (e.key === 'r' || e.key === 'R') {
            e.preventDefault();
            window.location.href = '/ring';
        }

        // F key - Go to family page
        if (e.key === 'f' || e.key === 'F') {
            e.preventDefault();
            window.location.href = '/family';
        }
    });
}

// =============================================================================
// PROGRESS ANIMATIONS
// =============================================================================

function setupProgressAnimations() {
    // Animate progress bars on load
    const progressBars = document.querySelectorAll('.progress-fill');

    progressBars.forEach(bar => {
        const width = bar.style.width;
        bar.style.width = '0%';

        // Animate to target width after short delay
        setTimeout(() => {
            bar.style.width = width;
        }, 500);
    });

    // Animate stat numbers counting up
    animateStatNumbers();
}

function animateStatNumbers() {
    const statNumbers = document.querySelectorAll('.stat-number');

    statNumbers.forEach(stat => {
        const text = stat.textContent;

        // Only animate pure numbers, not text with slashes or symbols
        if (/^\d+$/.test(text)) {
            const finalValue = parseInt(text);
            animateNumber(stat, 0, finalValue, 1000);
        }
    });
}

function animateNumber(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16); // 60fps
    let current = start;

    const timer = setInterval(() => {
        current += increment;

        if (current >= end) {
            current = end;
            clearInterval(timer);
        }

        element.textContent = Math.floor(current);
    }, 16);
}

// =============================================================================
// FAMILY MEMBER INTERACTIONS
// =============================================================================

function toggleFamilyMemberStatus(memberId) {
    console.log('Toggling family member status:', memberId);

    fetch(`/api/family/${memberId}/toggle`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Find and update the family member display
            const memberElement = document.querySelector(`[data-member-id="${memberId}"]`);
            if (memberElement) {
                const statusElement = memberElement.querySelector('.member-status');
                if (statusElement) {
                    statusElement.textContent = data.status;
                    statusElement.className = `member-status status-${data.status.toLowerCase().replace(' ', '-')}`;
                }
            }

            showNotification(`Family member status updated to: ${data.status}`, 'success');

            // Update family progress
            updateFamilyProgress();
        } else {
            showNotification('Failed to update family member status', 'error');
        }
    })
    .catch(error => {
        console.error('Error toggling family status:', error);
        showNotification('Error updating family member', 'error');
    });
}

function updateFamilyProgress() {
    // Count approved family members
    const familyMembers = document.querySelectorAll('.family-member');
    const approvedMembers = document.querySelectorAll('.status-approved');

    const total = familyMembers.length;
    const approved = approvedMembers.length;
    const percentage = total > 0 ? (approved / total) * 100 : 0;

    // Update progress bar
    const progressBar = document.querySelector('.family-progress .progress-fill');
    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }

    // Update progress text
    const progressText = document.querySelector('.family-progress .progress-text');
    if (progressText) {
        progressText.textContent = `${Math.round(percentage)}% Approved`;
    }

    // Update widget subtitle
    const familySubtitle = document.querySelector('.widget:has(.family-grid) .widget-subtitle');
    if (familySubtitle) {
        familySubtitle.textContent = `${approved} of ${total} approved`;
    }
}

// =============================================================================
// NOTIFICATION SYSTEM
// =============================================================================

function showNotification(message, type = 'info', duration = 4000) {
    console.log(`${type.toUpperCase()}: ${message}`);

    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Style notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10001;
        min-width: 300px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        justify-content: space-between;
        animation: slideInRight 0.3s ease, fadeOut 0.3s ease ${duration - 300}ms forwards;
    `;

    // Set background color based on type
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };

    notification.style.backgroundColor = colors[type] || colors.info;

    // Add to DOM
    document.body.appendChild(notification);

    // Auto-remove after duration
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, duration);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };

    return icons[type] || icons.info;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// =============================================================================
// DATA REFRESH & SYNC
// =============================================================================

function refreshDashboardData() {
    console.log('🔄 Refreshing dashboard data...');

    fetch('/api/dashboard/data')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update global data
                window.HERA_DATA = data.data;

                // Update progress bars and stats
                updateTaskProgress();
                updateFamilyProgress();

                showNotification('Dashboard data refreshed!', 'success');
            } else {
                showNotification('Failed to refresh data', 'error');
            }
        })
        .catch(error => {
            console.error('Error refreshing data:', error);
            showNotification('Error refreshing dashboard data', 'error');
        });
}

// Auto-refresh data every 5 minutes
setInterval(refreshDashboardData, 5 * 60 * 1000);

// =============================================================================
// EXPORT FUNCTIONS FOR GLOBAL ACCESS
// =============================================================================

// Make functions globally accessible
window.toggleTaskStatus = toggleTaskStatus;
window.editTask = editTask;
window.openBudgetModal = openBudgetModal;
window.toggleFamilyMemberStatus = toggleFamilyMemberStatus;
window.showNotification = showNotification;
window.closeModal = closeModal;
window.openModal = openModal;

// Dashboard utilities
window.HERA_Dashboard = {
    refresh: refreshDashboardData,
    showNotification: showNotification,
    formatCurrency: formatCurrency,
    formatDate: formatDate
};

// Add CSS for notifications and animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes fadeOut {
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }

    .notification-content {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
    }

    .notification-close {
        background: none;
        border: none;
        color: currentColor;
        cursor: pointer;
        padding: 4px;
        opacity: 0.7;
        transition: opacity 0.2s ease;
    }

    .notification-close:hover {
        opacity: 1;
    }

    /* Task completion animation */
    .task-item.completing {
        opacity: 0.7;
        transform: scale(0.98);
        transition: all 0.2s ease;
    }

    /* Budget item animation */
    .budget-item-compact:hover {
        background: rgba(212, 175, 55, 0.05);
        border-radius: 4px;
        margin: -4px;
        padding: 4px;
    }

    /* Family member hover effect */
    .family-member:hover {
        transform: translateX(2px);
        transition: transform 0.2s ease;
    }

    /* Progress bar smooth animation */
    .progress-fill {
        transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Modal form styling */
    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
    }

    .form-group {
        margin-bottom: 16px;
    }

    .form-label {
        display: block;
        margin-bottom: 4px;
        font-weight: 500;
        color: var(--text-primary);
        font-size: 13px;
    }

    .form-input,
    .form-select,
    .form-textarea {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid var(--border);
        border-radius: 4px;
        font-size: 14px;
        transition: border-color 0.2s ease;
    }

    .form-input:focus,
    .form-select:focus,
    .form-textarea:focus {
        outline: none;
        border-color: var(--accent-gold);
        box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
    }
`;

document.head.appendChild(style);

function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
        return;
    }

    console.log('Deleting task:', taskId);

    fetch(`/api/tasks/${taskId}/delete`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Task deleted successfully!', 'success');

            // Remove task from UI
            const taskItem = document.querySelector(`[data-task-id="${taskId}"]`);
            if (taskItem) {
                taskItem.style.opacity = '0';
                taskItem.style.transform = 'translateX(-100%)';
                setTimeout(() => {
                    taskItem.remove();
                    updateTaskProgress();
                }, 300);
            }

            // Update global data
            if (window.HERA_DATA && window.HERA_DATA.tasks) {
                window.HERA_DATA.tasks = window.HERA_DATA.tasks.filter(t => t.id !== taskId);
            }
        } else {
            showNotification('Failed to delete task', 'error');
        }
    })
    .catch(error => {
        console.error('Error deleting task:', error);
        showNotification('Error deleting task', 'error');
    });
}

// =============================================================================
// COMPLETE FORM SUBMISSIONS SETUP
// =============================================================================

function setupFormSubmissions() {
    // Wait for DOM to ensure forms are loaded
    setTimeout(() => {
        // Add task form
        const addTaskForm = document.getElementById('add-task-form');
        if (addTaskForm) {
            addTaskForm.addEventListener('submit', function(e) {
                e.preventDefault();
                submitNewTask();
            });
        }

        // Setup edit form when it gets created
        document.addEventListener('submit', function(e) {
            if (e.target && e.target.id === 'edit-task-form') {
                e.preventDefault();
                saveTaskChanges();
            }
        });
    }, 100);
}

function submitNewTask() {
    const form = document.getElementById('add-task-form');
    if (!form) {
        showNotification('Add task form not found', 'error');
        return;
    }

    const data = {
        task: form.querySelector('#add-task-name').value,
        deadline: form.querySelector('#add-task-deadline').value,
        status: form.querySelector('#add-task-status').value,
        notes: form.querySelector('#add-task-notes').value
    };

    // Validate required fields
    if (!data.task.trim()) {
        showNotification('Please enter a task name', 'warning');
        return;
    }

    if (!data.deadline) {
        showNotification('Please select a deadline', 'warning');
        return;
    }

    fetch('/api/tasks/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Task added successfully!', 'success');
            closeModal('add-task-modal');

            // Add to global data
            if (window.HERA_DATA && window.HERA_DATA.tasks) {
                window.HERA_DATA.tasks.push(data.task);
            }

            // Refresh the page to show new task
            setTimeout(() => window.location.reload(), 1000);
        } else {
            showNotification('Failed to add task: ' + (data.error || 'Unknown error'), 'error');
        }
    })
    .catch(error => {
        console.error('Error adding task:', error);
        showNotification('Error adding task', 'error');
    });
}

// =============================================================================
// ENHANCE EXISTING EDIT MODAL CREATION
// =============================================================================

function createTaskEditModal() {
    const modal = document.createElement('div');
    modal.id = 'edit-task-modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Edit Task</h3>
                <button class="modal-close" type="button" onclick="closeModal('edit-task-modal')">&times;</button>
            </div>
            <form id="edit-task-form">
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Task Name</label>
                        <input type="text" class="form-input" id="edit-task-name" required>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Deadline</label>
                        <input type="date" class="form-input" id="edit-task-deadline" required>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Status</label>
                        <select class="form-select" id="edit-task-status">
                            <option value="Not Started">Not Started</option>
                            <option value="In Progress">In Progress</option>
                            <option value="In Progress, On Schedule">In Progress, On Schedule</option>
                            <option value="In Progress, Behind Schedule">In Progress, Behind Schedule</option>
                            <option value="Complete">Complete</option>
                            <option value="Complete, On Schedule">Complete, On Schedule</option>
                            <option value="Complete, Behind Schedule">Complete, Behind Schedule</option>
                            <option value="Ahead Schedule, Complete">Ahead Schedule, Complete</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Notes</label>
                        <textarea class="form-textarea" id="edit-task-notes" rows="3"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('edit-task-modal')">Cancel</button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i>
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    `;
    return modal;
}

// =============================================================================
// ENHANCED SAVE TASK CHANGES
// =============================================================================

function saveTaskChanges() {
    if (!currentEditingTaskId) {
        showNotification('No task selected for editing', 'error');
        return;
    }

    const form = document.getElementById('edit-task-form');
    if (!form) {
        showNotification('Edit form not found', 'error');
        return;
    }

    const data = {
        task: form.querySelector('#edit-task-name').value.trim(),
        deadline: form.querySelector('#edit-task-deadline').value,
        status: form.querySelector('#edit-task-status').value,
        notes: form.querySelector('#edit-task-notes').value.trim()
    };

    // Validate required fields
    if (!data.task) {
        showNotification('Please enter a task name', 'warning');
        return;
    }

    if (!data.deadline) {
        showNotification('Please select a deadline', 'warning');
        return;
    }

    fetch(`/api/tasks/${currentEditingTaskId}/update`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Task updated successfully!', 'success');
            closeModal('edit-task-modal');

            // Update task display
            updateTaskDisplay(currentEditingTaskId, data.task);

            // Update global data
            if (window.HERA_DATA && window.HERA_DATA.tasks) {
                const taskIndex = window.HERA_DATA.tasks.findIndex(t => t.id === currentEditingTaskId);
                if (taskIndex !== -1) {
                    Object.assign(window.HERA_DATA.tasks[taskIndex], data.task);
                }
            }

            // Update progress after changes
            updateTaskProgress();
        } else {
            showNotification('Failed to update task: ' + (data.error || 'Unknown error'), 'error');
        }
    })
    .catch(error => {
        console.error('Error updating task:', error);
        showNotification('Error updating task', 'error');
    });
}