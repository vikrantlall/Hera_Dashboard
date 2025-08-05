// Dashboard JavaScript functionality
// Budget management, task tracking, and overview widgets

document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    setupBudgetManagement();
    setupTaskManagement();
});

function initializeDashboard() {
    updateBudgetProgress();
    updateNavBadges();
    setupQuickActions();
}

// Budget Management
function setupBudgetManagement() {
    // Budget form submission
    const budgetForm = document.getElementById('budget-form');
    if (budgetForm) {
        budgetForm.addEventListener('submit', handleBudgetSubmit);
    }

    // Add budget form submission
    const addBudgetForm = document.getElementById('add-budget-form');
    if (addBudgetForm) {
        addBudgetForm.addEventListener('submit', handleAddBudgetSubmit);
    }

    // Auto-update saved amount when status changes to "Paid"
    const budgetStatus = document.getElementById('budget-status');
    if (budgetStatus) {
        budgetStatus.addEventListener('change', function() {
            if (this.value === 'Paid') {
                const budgetAmount = document.getElementById('budget-amount').value;
                document.getElementById('budget-saved').value = budgetAmount;
            }
        });
    }
}

function handleBudgetSubmit(e) {
    e.preventDefault();

    if (!HERA.validateForm(e.target)) {
        HERA.showNotification('Please fill in all required fields', 'error');
        return;
    }

    const formData = new FormData(e.target);
    const budgetData = Object.fromEntries(formData.entries());
    budgetData.id = document.getElementById('budget-item-id').value;

    HERA.setLoadingState(e.target, true);

    const endpoint = budgetData.id ? '/api/budget/update' : '/api/budget/add';

    HERA.makeRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(budgetData)
    })
    .then(data => {
        if (data.success) {
            HERA.showNotification('Budget updated successfully', 'success');
            updateBudgetItem(data.budget_item);
            updateBudgetProgress();
            updateNavBadges();
            closeBudgetModal();
        } else {
            HERA.showNotification('Error updating budget: ' + data.error, 'error');
        }
    })
    .catch(error => {
        HERA.showNotification('Error updating budget', 'error');
    })
    .finally(() => {
        HERA.setLoadingState(e.target, false);
    });
}

function handleAddBudgetSubmit(e) {
    e.preventDefault();

    if (!HERA.validateForm(e.target)) {
        HERA.showNotification('Please fill in all required fields', 'error');
        return;
    }

    const formData = new FormData(e.target);
    const budgetData = Object.fromEntries(formData.entries());

    // Handle new category selection
    if (budgetData.category === 'new') {
        const newCategory = document.getElementById('new-category-name').value;
        if (!newCategory) {
            HERA.showNotification('Please enter a category name', 'error');
            return;
        }
        budgetData.category = newCategory;
    }

    HERA.setLoadingState(e.target, true);

    HERA.makeRequest('/api/budget/add', {
        method: 'POST',
        body: JSON.stringify(budgetData)
    })
    .then(data => {
        if (data.success) {
            HERA.showNotification('Budget item added successfully', 'success');
            addBudgetItemToDOM(data.budget_item);
            updateBudgetProgress();
            updateNavBadges();
            closeAddBudgetModal();
        } else {
            HERA.showNotification('Error adding budget item: ' + data.error, 'error');
        }
    })
    .catch(error => {
        HERA.showNotification('Error adding budget item', 'error');
    })
    .finally(() => {
        HERA.setLoadingState(e.target, false);
    });
}

// Modal Functions
function openBudgetModal(budgetId) {
    const budgetItem = window.HERA_DATA.budget.find(item => item.id === budgetId);
    if (!budgetItem) return;

    document.getElementById('budget-modal-title').textContent = `Edit ${budgetItem.category}`;
    document.getElementById('budget-item-id').value = budgetItem.id;
    document.getElementById('budget-category').value = budgetItem.category;
    document.getElementById('budget-amount').value = budgetItem.budget;
    document.getElementById('budget-saved').value = budgetItem.saved;
    document.getElementById('budget-status').value = budgetItem.status;
    document.getElementById('budget-priority').value = budgetItem.priority || 'medium';
    document.getElementById('budget-notes').value = budgetItem.notes || '';

    HERA.openModal('budget-modal');
}

function closeBudgetModal() {
    HERA.closeModal('budget-modal');
}

function openAddBudgetModal() {
    document.getElementById('add-budget-form').reset();
    HERA.openModal('add-budget-modal');
}

function closeAddBudgetModal() {
    HERA.closeModal('add-budget-modal');

    // Hide new category field
    const newCategoryGroup = document.getElementById('new-category-group');
    if (newCategoryGroup) {
        newCategoryGroup.style.display = 'none';
    }
}

// Handle category selection change
document.addEventListener('DOMContentLoaded', function() {
    const categorySelect = document.getElementById('new-item-category');
    if (categorySelect) {
        categorySelect.addEventListener('change', function() {
            const newCategoryGroup = document.getElementById('new-category-group');
            if (this.value === 'new') {
                newCategoryGroup.style.display = 'block';
                document.getElementById('new-category-name').required = true;
            } else {
                newCategoryGroup.style.display = 'none';
                document.getElementById('new-category-name').required = false;
            }
        });
    }
});

// Delete Budget Item
function deleteBudgetItem(budgetId) {
    HERA.confirmDelete('Are you sure you want to delete this budget item?', () => {
        HERA.makeRequest(`/api/budget/delete/${budgetId}`, {
            method: 'DELETE'
        })
        .then(data => {
            if (data.success) {
                HERA.showNotification('Budget item deleted successfully', 'success');
                removeBudgetItemFromDOM(budgetId);
                updateBudgetProgress();
                updateNavBadges();
            } else {
                HERA.showNotification('Error deleting budget item: ' + data.error, 'error');
            }
        })
        .catch(error => {
            HERA.showNotification('Error deleting budget item', 'error');
        });
    });
}

// Task Management
function setupTaskManagement() {
    const taskCheckboxes = document.querySelectorAll('.task-checkbox');
    taskCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('click', function() {
            const taskId = this.closest('.task-item').dataset.taskId;
            toggleTaskComplete(taskId);
        });
    });
}

function toggleTaskComplete(taskId) {
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    const checkbox = taskElement.querySelector('.task-checkbox');
    const taskName = taskElement.querySelector('.task-name');

    // Optimistic update
    const wasCompleted = checkbox.classList.contains('completed');

    if (wasCompleted) {
        checkbox.classList.remove('completed');
        checkbox.innerHTML = '';
        taskName.classList.remove('completed');
    } else {
        checkbox.classList.add('completed');
        checkbox.innerHTML = '<i class="fas fa-check"></i>';
        taskName.classList.add('completed');
        taskElement.classList.add('completing');
    }

    // Send to server
    HERA.makeRequest(`/api/tasks/toggle/${taskId}`, {
        method: 'POST'
    })
    .then(data => {
        if (data.success) {
            if (!wasCompleted) {
                HERA.showNotification('Task completed!', 'success');
                setTimeout(() => {
                    taskElement.classList.remove('completing');
                }, 300);
            }
            updateNavBadges();
        } else {
            // Revert optimistic update
            if (wasCompleted) {
                checkbox.classList.add('completed');
                checkbox.innerHTML = '<i class="fas fa-check"></i>';
                taskName.classList.add('completed');
            } else {
                checkbox.classList.remove('completed');
                checkbox.innerHTML = '';
                taskName.classList.remove('completed');
                taskElement.classList.remove('completing');
            }
            HERA.showNotification('Error updating task: ' + data.error, 'error');
        }
    })
    .catch(error => {
        // Revert optimistic update
        if (wasCompleted) {
            checkbox.classList.add('completed');
            checkbox.innerHTML = '<i class="fas fa-check"></i>';
            taskName.classList.add('completed');
        } else {
            checkbox.classList.remove('completed');
            checkbox.innerHTML = '';
            taskName.classList.remove('completed');
            taskElement.classList.remove('completing');
        }
        HERA.showNotification('Error updating task', 'error');
    });
}

// Update Functions
function updateBudgetProgress() {
    if (!window.HERA_DATA) return;

    const totalBudget = window.HERA_DATA.budget.reduce((sum, item) => sum + parseFloat(item.budget || 0), 0);
    const totalSaved = window.HERA_DATA.budget.reduce((sum, item) => sum + parseFloat(item.saved || 0), 0);

    // Update stats
    const budgetStatElement = document.querySelector('.stat-card:nth-child(2) .stat-number');
    if (budgetStatElement) {
        budgetStatElement.textContent = HERA.formatCurrency(totalSaved);
    }

    const budgetSubElement = document.querySelector('.stat-card:nth-child(2) .stat-sublabel');
    if (budgetSubElement) {
        budgetSubElement.textContent = `${HERA.formatCurrency(totalSaved)} of ${HERA.formatCurrency(totalBudget)}`;
    }

    // Update widget subtitle
    const budgetSubtitle = document.querySelector('.widget-subtitle');
    if (budgetSubtitle) {
        budgetSubtitle.textContent = `${HERA.formatCurrency(totalSaved)} saved of ${HERA.formatCurrency(totalBudget)} total`;
    }
}

function updateBudgetItem(budgetItem) {
    const itemElement = document.querySelector(`[data-item-id="${budgetItem.id}"]`);
    if (!itemElement) return;

    // Update the item in the data
    const dataIndex = window.HERA_DATA.budget.findIndex(item => item.id === budgetItem.id);
    if (dataIndex !== -1) {
        window.HERA_DATA.budget[dataIndex] = budgetItem;
    }

    // Update DOM elements
    const nameElement = itemElement.querySelector('.budget-name');
    const amountElement = itemElement.querySelector('.budget-amount');
    const progressElement = itemElement.querySelector('.progress-fill');
    const statusElement = itemElement.querySelector('.status-badge');

    if (nameElement) nameElement.textContent = budgetItem.category;
    if (amountElement) amountElement.textContent = `${HERA.formatCurrency(budgetItem.saved)} / ${HERA.formatCurrency(budgetItem.budget)}`;

    if (progressElement) {
        const progress = budgetItem.budget > 0 ? (budgetItem.saved / budgetItem.budget * 100) : 0;
        progressElement.style.width = `${progress}%`;
        progressElement.className = `progress-fill ${budgetItem.status === 'Paid' ? '' : 'pending'}`;
    }

    if (statusElement) {
        statusElement.textContent = budgetItem.status;
        statusElement.className = `status-badge ${budgetItem.status === 'Paid' ? 'paid' : 'outstanding'}`;
    }

    // Add success animation
    itemElement.classList.add('success');
    setTimeout(() => itemElement.classList.remove('success'), 1000);
}

function addBudgetItemToDOM(budgetItem) {
    const budgetItems = document.querySelector('.budget-items');
    if (!budgetItems) return;

    const progress = budgetItem.budget > 0 ? (budgetItem.saved / budgetItem.budget * 100) : 0;
    const statusClass = budgetItem.status === 'Paid' ? 'paid' : 'outstanding';
    const progressClass = budgetItem.status === 'Paid' ? '' : 'pending';

    const itemHTML = `
        <div class="budget-item fade-in" data-item-id="${budgetItem.id}">
            <div class="budget-info">
                <div class="budget-name">${budgetItem.category}</div>
                <div class="budget-amount">${HERA.formatCurrency(budgetItem.saved)} / ${HERA.formatCurrency(budgetItem.budget)}</div>
            </div>
            <div class="budget-progress">
                <div class="progress-bar">
                    <div class="progress-fill ${progressClass}" style="width: ${progress}%"></div>
                </div>
            </div>
            <div class="budget-status">
                <span class="status-badge ${statusClass}">${budgetItem.status}</span>
            </div>
            <div class="budget-actions">
                <button class="action-btn edit-btn" onclick="openBudgetModal(${budgetItem.id})" data-tooltip="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteBudgetItem(${budgetItem.id})" data-tooltip="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;

    budgetItems.insertAdjacentHTML('beforeend', itemHTML);

    // Add to data
    window.HERA_DATA.budget.push(budgetItem);
}

function removeBudgetItemFromDOM(budgetId) {
    const itemElement = document.querySelector(`[data-item-id="${budgetId}"]`);
    if (itemElement) {
        HERA.animateElement(itemElement, 'fadeOut').then(() => {
            itemElement.remove();
        });
    }

    // Remove from data
    window.HERA_DATA.budget = window.HERA_DATA.budget.filter(item => item.id !== budgetId);
}

function updateNavBadges() {
    if (!window.HERA_DATA) return;

    // Budget badge
    const totalRemaining = window.HERA_DATA.budget.reduce((sum, item) => sum + (item.budget - item.saved), 0);
    const budgetBadge = document.getElementById('nav-budget-badge');
    if (budgetBadge) {
        budgetBadge.textContent = HERA.formatCurrency(totalRemaining).replace(', '');
    }

    // Family badge (if data available)
    if (window.HERA_DATA.family) {
        const approvedFamily = window.HERA_DATA.family.filter(f => f.status === 'Approved').length;
        const totalFamily = window.HERA_DATA.family.length;
        const familyBadge = document.getElementById('nav-family-badge');
        if (familyBadge) {
            familyBadge.textContent = `${approvedFamily}/${totalFamily}`;
        }
    }

    // Tasks badge (if data available)
    if (window.HERA_DATA.tasks) {
        const completedTasks = window.HERA_DATA.tasks.filter(t => t.status.includes('Complete')).length;
        const totalTasks = window.HERA_DATA.tasks.length;
        const tasksBadge = document.getElementById('nav-tasks-badge');
        if (tasksBadge) {
            tasksBadge.textContent = `${completedTasks}/${totalTasks}`;
        }
    }
}

// Quick Actions Setup
function setupQuickActions() {
    // Add click handlers for quick action cards
    const actionCards = document.querySelectorAll('.action-card');
    actionCards.forEach(card => {
        card.addEventListener('click', function() {
            const action = this.dataset.action;
            handleQuickAction(action);
        });
    });
}

function handleQuickAction(action) {
    switch (action) {
        case 'add-budget':
            openAddBudgetModal();
            break;
        case 'view-ring':
            window.location.href = '/ring';
            break;
        case 'check-family':
            window.location.href = '/family';
            break;
        case 'view-itinerary':
            window.location.href = '/itinerary';
            break;
        case 'manage-travel':
            window.location.href = '/travel';
            break;
        case 'check-packing':
            window.location.href = '/packing';
            break;
        default:
            console.log('Unknown action:', action);
    }
}

// Budget Analytics
function getBudgetAnalytics() {
    if (!window.HERA_DATA) return {};

    const budget = window.HERA_DATA.budget;
    const totalBudget = budget.reduce((sum, item) => sum + item.budget, 0);
    const totalSaved = budget.reduce((sum, item) => sum + item.saved, 0);
    const totalRemaining = totalBudget - totalSaved;

    const paidItems = budget.filter(item => item.status === 'Paid').length;
    const outstandingItems = budget.length - paidItems;

    const criticalItems = budget.filter(item => item.priority === 'critical');
    const highPriorityItems = budget.filter(item => item.priority === 'high');

    return {
        totalBudget,
        totalSaved,
        totalRemaining,
        percentSaved: (totalSaved / totalBudget * 100).toFixed(1),
        paidItems,
        outstandingItems,
        criticalItems: criticalItems.length,
        highPriorityItems: highPriorityItems.length,
        budgetOnTrack: totalSaved >= (totalBudget * 0.7) // 70% threshold
    };
}

// Dashboard Refresh
function refreshDashboard() {
    updateBudgetProgress();
    updateNavBadges();

    // Refresh countdown
    if (window.CountdownManager) {
        window.CountdownManager.updateCountdown();
    }

    HERA.showNotification('Dashboard refreshed', 'info', 2000);
}

// Auto-save functionality
let autoSaveTimeout;

function scheduleAutoSave() {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
        saveDashboardState();
    }, 5000); // Auto-save after 5 seconds of inactivity
}

function saveDashboardState() {
    const dashboardState = {
        lastUpdated: new Date().toISOString(),
        budgetData: window.HERA_DATA.budget,
        analytics: getBudgetAnalytics()
    };

    // Save to localStorage (for offline persistence)
    try {
        localStorage.setItem('hera-dashboard-state', JSON.stringify(dashboardState));
    } catch (error) {
        console.warn('Could not save dashboard state:', error);
    }
}

// Export dashboard data
function exportDashboardData() {
    const analytics = getBudgetAnalytics();
    const exportData = {
        exportDate: new Date().toISOString(),
        analytics,
        budgetItems: window.HERA_DATA.budget,
        tasks: window.HERA_DATA.tasks,
        family: window.HERA_DATA.family
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `hera-dashboard-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

// Keyboard shortcuts for dashboard
document.addEventListener('keydown', function(e) {
    // Alt + B for budget
    if (e.altKey && e.key === 'b') {
        e.preventDefault();
        openAddBudgetModal();
    }

    // Alt + R for refresh
    if (e.altKey && e.key === 'r') {
        e.preventDefault();
        refreshDashboard();
    }

    // Alt + E for export
    if (e.altKey && e.key === 'e') {
        e.preventDefault();
        exportDashboardData();
    }
});

// Initialize tooltips for keyboard shortcuts
document.addEventListener('DOMContentLoaded', function() {
    // Add keyboard shortcut hints to buttons
    const addBudgetBtn = document.querySelector('[onclick="openAddBudgetModal()"]');
    if (addBudgetBtn && !addBudgetBtn.dataset.tooltip) {
        addBudgetBtn.dataset.tooltip = 'Add Budget Item (Alt+B)';
    }
});

// Performance monitoring
function logPerformanceMetrics() {
    if (window.performance) {
        const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
        console.log(`Dashboard loaded in ${loadTime}ms`);

        // Log to analytics if available
        if (window.analytics) {
            window.analytics.track('Dashboard Load Time', { loadTime });
        }
    }
}

// Call performance logging after load
window.addEventListener('load', logPerformanceMetrics);

// Export functions for global access
window.DashboardManager = {
    refreshDashboard,
    updateBudgetProgress,
    updateNavBadges,
    getBudgetAnalytics,
    exportDashboardData,
    saveDashboardState
};