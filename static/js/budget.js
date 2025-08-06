// Budget Page JavaScript - Dashboard Compatible
// This file should be saved as static/js/budget.js

// Initialize budget page
function initializeBudgetPage() {
    setupModals();
    setupEventListeners();
    console.log('Budget page initialized');
}

// Setup event listeners
function setupEventListeners() {
    // Form submissions
    const addForm = document.getElementById('add-budget-form');
    const editForm = document.getElementById('budget-form');

    if (addForm) {
        addForm.addEventListener('submit', addBudgetItem);
    }

    if (editForm) {
        editForm.addEventListener('submit', updateBudgetItem);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Escape key closes modals
        if (e.key === 'Escape') {
            closeAllModals();
        }
        // Ctrl/Cmd + N opens add modal
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            openAddBudgetModal();
        }
    });
}

// Modal Management
function setupModals() {
    // Close modal when clicking backdrop
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
}

function openAddBudgetModal() {
    const modal = document.getElementById('add-budget-modal');
    if (modal) {
        modal.classList.add('show');

        // Focus first input after animation
        setTimeout(() => {
            const firstInput = modal.querySelector('#add-budget-category');
            if (firstInput) {
                firstInput.focus();
            }
        }, 300);
    }
}

function closeAddBudgetModal() {
    const modal = document.getElementById('add-budget-modal');
    if (modal) {
        modal.classList.remove('show');

        // Reset form after animation
        setTimeout(() => {
            const form = modal.querySelector('form');
            if (form) {
                form.reset();
            }
        }, 300);
    }
}

function openBudgetModal(itemId) {
    // Find the budget item data
    const budgetItem = window.BUDGET_DATA.items.find(item => item.id === itemId);
    if (!budgetItem) {
        showNotification('Budget item not found', 'error');
        return;
    }

    const modal = document.getElementById('budget-modal');
    if (modal) {
        // Populate form with current data
        document.getElementById('budget-item-id').value = budgetItem.id || '';
        document.getElementById('budget-category').value = budgetItem.category || '';
        document.getElementById('budget-amount').value = budgetItem.budget || '';
        document.getElementById('budget-saved').value = budgetItem.saved || '';
        document.getElementById('budget-status').value = budgetItem.status || 'Outstanding';
        document.getElementById('budget-notes').value = budgetItem.notes || '';

        modal.classList.add('show');

        // Focus category input after animation
        setTimeout(() => {
            const categoryInput = document.getElementById('budget-category');
            if (categoryInput) {
                categoryInput.focus();
                categoryInput.select();
            }
        }, 300);
    }
}

function closeBudgetModal() {
    const modal = document.getElementById('budget-modal');
    if (modal) {
        modal.classList.remove('show');

        // Reset form after animation
        setTimeout(() => {
            const form = modal.querySelector('form');
            if (form) {
                form.reset();
            }
        }, 300);
    }
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal.show');
    modals.forEach(modal => {
        modal.classList.remove('show');
    });

    // Reset all forms after animation
    setTimeout(() => {
        const forms = document.querySelectorAll('.modal form');
        forms.forEach(form => form.reset());
    }, 300);
}

// Budget Item Management
function addBudgetItem(event) {
    event.preventDefault();

    const formData = {
        category: document.getElementById('add-budget-category').value,
        budget: parseFloat(document.getElementById('add-budget-amount').value),
        saved: parseFloat(document.getElementById('add-budget-saved').value) || 0,
        status: document.getElementById('add-budget-status').value,
        notes: document.getElementById('add-budget-notes').value,
        emoji: '💰' // Default emoji
    };

    // Validate data
    if (!formData.category || !formData.budget) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    if (formData.saved > formData.budget) {
        showNotification('Amount saved cannot exceed budget amount', 'error');
        return;
    }

    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    submitBtn.disabled = true;

    // Make API call - using the budget add API structure
    fetch('/api/budget/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Budget item added successfully', 'success');
            closeAddBudgetModal();

            // Add to local data
            if (data.budget_item) {
                window.BUDGET_DATA.items.push(data.budget_item);
            }

            // Refresh the page to show updates
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showNotification(data.error || 'Failed to add budget item', 'error');
        }
    })
    .catch(error => {
        console.error('Error adding budget item:', error);
        showNotification('Failed to add budget item', 'error');
    })
    .finally(() => {
        // Reset button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
}

function updateBudgetItem(event) {
    event.preventDefault();

    const itemId = document.getElementById('budget-item-id').value;
    const formData = {
        id: parseInt(itemId),
        category: document.getElementById('budget-category').value,
        budget: parseFloat(document.getElementById('budget-amount').value),
        saved: parseFloat(document.getElementById('budget-saved').value) || 0,
        status: document.getElementById('budget-status').value,
        notes: document.getElementById('budget-notes').value
    };

    // Validate data
    if (!formData.category || !formData.budget) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    if (formData.saved > formData.budget) {
        showNotification('Amount saved cannot exceed budget amount', 'error');
        return;
    }

    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitBtn.disabled = true;

    // Make API call - using the budget update API structure
    fetch('/api/budget/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Budget item updated successfully', 'success');
            closeBudgetModal();

            // Update local data
            const itemIndex = window.BUDGET_DATA.items.findIndex(item => item.id === formData.id);
            if (itemIndex > -1) {
                window.BUDGET_DATA.items[itemIndex] = { ...window.BUDGET_DATA.items[itemIndex], ...formData };
            }

            // Refresh the page to show updates
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showNotification(data.error || 'Failed to update budget item', 'error');
        }
    })
    .catch(error => {
        console.error('Error updating budget item:', error);
        showNotification('Failed to update budget item', 'error');
    })
    .finally(() => {
        // Reset button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
}

function toggleBudgetStatus(itemId) {
    const budgetItem = window.BUDGET_DATA.items.find(item => item.id === itemId);
    if (!budgetItem) {
        showNotification('Budget item not found', 'error');
        return;
    }

    const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
    if (itemElement) {
        // Add loading state
        itemElement.style.opacity = '0.7';
        itemElement.style.pointerEvents = 'none';
    }

    const newStatus = budgetItem.status === 'Paid' ? 'Outstanding' : 'Paid';

    fetch(`/api/budget/${itemId}/toggle`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update local data
            budgetItem.status = newStatus;

            // Update UI
            if (itemElement) {
                itemElement.className = `budget-item ${newStatus.toLowerCase() === 'paid' ? 'paid' : 'outstanding'}`;

                // Update status text
                const statusElement = itemElement.querySelector('.item-category');
                if (statusElement) {
                    statusElement.textContent = newStatus;
                }

                // Update button icon
                const toggleBtn = itemElement.querySelector('.pay-btn i');
                if (toggleBtn) {
                    toggleBtn.className = `fas fa-${newStatus === 'Paid' ? 'undo' : 'check'}`;
                }
            }

            showNotification(`Item marked as ${newStatus.toLowerCase()}`, 'success');
            updateBudgetSummary();
        } else {
            showNotification(data.error || 'Failed to update status', 'error');
        }
    })
    .catch(error => {
        console.error('Error toggling status:', error);
        showNotification('Failed to update status', 'error');
    })
    .finally(() => {
        // Remove loading state
        if (itemElement) {
            itemElement.style.opacity = '';
            itemElement.style.pointerEvents = '';
        }
    });
}

function deleteBudgetItem(itemId) {
    if (!confirm('Are you sure you want to delete this budget item? This action cannot be undone.')) {
        return;
    }

    const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
    if (itemElement) {
        // Add loading state
        itemElement.style.opacity = '0.7';
        itemElement.style.pointerEvents = 'none';
    }

    fetch(`/api/budget/${itemId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Remove from local data
            const itemIndex = window.BUDGET_DATA.items.findIndex(item => item.id === itemId);
            if (itemIndex > -1) {
                window.BUDGET_DATA.items.splice(itemIndex, 1);
            }

            // Animate out and remove element
            if (itemElement) {
                itemElement.style.transition = 'all 0.3s ease';
                itemElement.style.transform = 'translateX(100%)';
                itemElement.style.opacity = '0';

                setTimeout(() => {
                    itemElement.remove();
                }, 300);
            }

            showNotification('Budget item deleted successfully', 'success');
            updateBudgetSummary();
        } else {
            showNotification(data.error || 'Failed to delete budget item', 'error');

            // Remove loading state on error
            if (itemElement) {
                itemElement.style.opacity = '';
                itemElement.style.pointerEvents = '';
            }
        }
    })
    .catch(error => {
        console.error('Error deleting budget item:', error);
        showNotification('Failed to delete budget item', 'error');

        // Remove loading state on error
        if (itemElement) {
            itemElement.style.opacity = '';
            itemElement.style.pointerEvents = '';
        }
    });
}

// UI Updates
function refreshBudgetList() {
    // In a full implementation, you'd reload the list from the server
    // For now, we'll just reload the page
    window.location.reload();
}

function updateBudgetSummary() {
    // Recalculate stats from current data
    const items = window.BUDGET_DATA.items;
    let totalBudget = 0;
    let totalSaved = 0;

    items.forEach(item => {
        totalBudget += parseFloat(item.budget || 0);
        totalSaved += parseFloat(item.saved || 0);
    });

    const totalRemaining = totalBudget - totalSaved;
    const budgetProgress = totalBudget > 0 ? (totalSaved / totalBudget) * 100 : 0;

    // Update summary cards
    const totalBudgetEl = document.getElementById('total-budget');
    const totalPaidEl = document.getElementById('total-paid');
    const totalRemainingEl = document.getElementById('total-remaining');
    const budgetProgressEl = document.getElementById('budget-progress');

    if (totalBudgetEl) {
        totalBudgetEl.textContent = `$${totalBudget.toLocaleString()}`;
    }
    if (totalPaidEl) {
        totalPaidEl.textContent = `$${totalSaved.toLocaleString()}`;
    }
    if (totalRemainingEl) {
        totalRemainingEl.textContent = `$${totalRemaining.toLocaleString()}`;
    }
    if (budgetProgressEl) {
        budgetProgressEl.textContent = `${budgetProgress.toFixed(1)}%`;
    }

    // Update global data
    window.BUDGET_DATA.stats = {
        total_budget: totalBudget,
        total_saved: totalSaved,
        total_remaining: totalRemaining,
        budget_progress: budgetProgress
    };
}

// Notification System
function showNotification(message, type = 'info') {
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

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        padding: 12px 16px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        max-width: 350px;
        background: ${getNotificationColor(type)};
    `;

    // Add to page
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
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

function getNotificationColor(type) {
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    return colors[type] || colors.info;
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function formatPercentage(value) {
    return `${Math.round(value * 10) / 10}%`;
}

// Export for global access
window.budgetManager = {
    openAddBudgetModal,
    closeAddBudgetModal,
    openBudgetModal,
    closeBudgetModal,
    toggleBudgetStatus,
    deleteBudgetItem,
    showNotification
};