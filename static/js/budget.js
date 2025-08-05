// Budget JavaScript functionality - FIXED VERSION
// This file should be saved as static/js/budget.js

document.addEventListener('DOMContentLoaded', function() {
    initializeBudgetPage();
});

function initializeBudgetPage() {
    console.log('Initializing budget page...');

    // Setup all budget functionality
    setupEditableText();
    setupItemMenus();
    setupModals();
    setupKeyboardShortcuts();

    console.log('Budget page initialized successfully');
}

// Editable Text System
function setupEditableText() {
    const editableElements = document.querySelectorAll('.editable-text');

    editableElements.forEach(element => {
        element.addEventListener('click', function() {
            if (!this.classList.contains('editing')) {
                enableInlineEdit(this);
            }
        });

        element.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                saveInlineEdit(this);
            } else if (e.key === 'Escape') {
                cancelInlineEdit(this);
            }
        });

        element.addEventListener('blur', function() {
            if (this.classList.contains('editing')) {
                saveInlineEdit(this);
            }
        });
    });
}

function enableInlineEdit(element) {
    const originalValue = element.textContent.trim();
    element.setAttribute('data-original', originalValue);
    element.classList.add('editing');
    element.contentEditable = true;
    element.focus();

    // Select all text
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
}

function saveInlineEdit(element) {
    const itemId = element.getAttribute('data-item-id');
    const field = element.getAttribute('data-field');
    const newValue = element.textContent.trim();
    const originalValue = element.getAttribute('data-original');

    if (newValue !== originalValue) {
        // Save to backend
        saveBudgetField(itemId, field, newValue)
            .then(() => {
                element.classList.remove('editing');
                element.contentEditable = false;
                element.removeAttribute('data-original');
                showNotification('Updated successfully!', 'success');
                updateBudgetSummary();
            })
            .catch(error => {
                console.error('Save failed:', error);
                element.textContent = originalValue;
                showNotification('Failed to save changes', 'error');
            });
    } else {
        cancelInlineEdit(element);
    }
}

function cancelInlineEdit(element) {
    const originalValue = element.getAttribute('data-original');
    element.textContent = originalValue;
    element.classList.remove('editing');
    element.contentEditable = false;
    element.removeAttribute('data-original');
}

// Item Menu System
function setupItemMenus() {
    document.addEventListener('click', function(e) {
        // Close all menus when clicking outside
        const openMenus = document.querySelectorAll('.item-menu.active');
        openMenus.forEach(menu => {
            if (!menu.contains(e.target)) {
                menu.classList.remove('active');
            }
        });
    });
}

function toggleItemMenu(itemId) {
    const menu = document.querySelector(`[data-item-id="${itemId}"] .item-menu`);
    if (menu) {
        menu.classList.toggle('active');
    }
}

function enableEditMode(itemId) {
    const item = document.querySelector(`[data-item-id="${itemId}"]`);
    if (item) {
        const editableElements = item.querySelectorAll('.editable-text');
        editableElements.forEach(element => {
            element.classList.add('editable-active');
        });

        // Show edit controls
        const editControls = item.querySelector('.edit-controls');
        const itemMenu = item.querySelector('.item-menu');

        if (editControls) editControls.style.display = 'flex';
        if (itemMenu) itemMenu.style.display = 'none';
    }

    // Close menu
    toggleItemMenu(itemId);
}

// Budget Item CRUD Operations
function toggleBudgetStatus(itemId) {
    const item = document.querySelector(`[data-item-id="${itemId}"]`);
    const currentStatus = item.classList.contains('paid') ? 'Paid' : 'Outstanding';
    const newStatus = currentStatus === 'Paid' ? 'Outstanding' : 'Paid';

    saveBudgetField(itemId, 'status', newStatus)
        .then(() => {
            // Update UI
            item.classList.toggle('paid');
            item.classList.toggle('outstanding');

            const statusElement = item.querySelector('.item-status');
            updateStatusDisplay(statusElement, newStatus);

            showNotification(`Status updated to ${newStatus}`, 'success');
            updateBudgetSummary();
        })
        .catch(error => {
            console.error('Status update failed:', error);
            showNotification('Failed to update status', 'error');
        });

    // Close menu
    toggleItemMenu(itemId);
}

function deleteBudgetItem(itemId) {
    if (!confirm('Are you sure you want to delete this budget item?')) {
        return;
    }

    const item = document.querySelector(`[data-item-id="${itemId}"]`);
    setLoadingState(item, true);

    // Make delete request
    makeRequest(`/api/budget/${itemId}`, {
        method: 'DELETE'
    })
    .then(() => {
        // Remove from UI with animation
        item.style.transform = 'translateX(100%)';
        item.style.opacity = '0';

        setTimeout(() => {
            item.remove();
            updateBudgetSummary();
            showNotification('Budget item deleted', 'success');
        }, 300);
    })
    .catch(error => {
        console.error('Delete failed:', error);
        setLoadingState(item, false);
        showNotification('Failed to delete item', 'error');
    });

    // Close menu
    toggleItemMenu(itemId);
}

function saveBudgetItem(itemId) {
    const item = document.querySelector(`[data-item-id="${itemId}"]`);
    const editableElements = item.querySelectorAll('.editable-text');

    const data = {};
    editableElements.forEach(element => {
        const field = element.getAttribute('data-field');
        const value = element.textContent.trim();
        data[field] = value;
    });

    setLoadingState(item, true);

    makeRequest(`/api/budget/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    })
    .then(() => {
        setLoadingState(item, false);

        // Hide edit controls
        const editControls = item.querySelector('.edit-controls');
        const itemMenu = item.querySelector('.item-menu');

        if (editControls) editControls.style.display = 'none';
        if (itemMenu) itemMenu.style.display = 'block';

        // Remove edit state
        editableElements.forEach(element => {
            element.classList.remove('editable-active', 'editing');
            element.contentEditable = false;
        });

        showNotification('Changes saved successfully!', 'success');
        updateBudgetSummary();
    })
    .catch(error => {
        console.error('Save failed:', error);
        setLoadingState(item, false);
        showNotification('Failed to save changes', 'error');
    });
}

function cancelBudgetEdit(itemId) {
    const item = document.querySelector(`[data-item-id="${itemId}"]`);
    const editableElements = item.querySelectorAll('.editable-text');

    // Restore original values
    editableElements.forEach(element => {
        const originalValue = element.getAttribute('data-original');
        if (originalValue) {
            element.textContent = originalValue;
        }
        element.classList.remove('editable-active', 'editing');
        element.contentEditable = false;
        element.removeAttribute('data-original');
    });

    // Hide edit controls
    const editControls = item.querySelector('.edit-controls');
    const itemMenu = item.querySelector('.item-menu');

    if (editControls) editControls.style.display = 'none';
    if (itemMenu) itemMenu.style.display = 'block';
}

// Modal System
function setupModals() {
    // Close modal when clicking backdrop
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

function openAddBudgetModal() {
    const modal = document.getElementById('add-budget-modal');
    if (modal) {
        modal.classList.add('show');

        // Focus first input
        const firstInput = modal.querySelector('input[type="text"]');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 300);
        }
    }
}

function closeAddBudgetModal() {
    const modal = document.getElementById('add-budget-modal');
    if (modal) {
        modal.classList.remove('show');

        // Reset form
        const form = modal.querySelector('form');
        if (form) form.reset();
    }
}

function openBudgetModal(itemId) {
    // Find the budget item data
    const budgetItem = window.BUDGET_DATA.items.find(item => item.id === itemId);
    if (!budgetItem) return;

    const modal = document.getElementById('budget-modal');
    if (modal) {
        // Populate form
        document.getElementById('budget-item-id').value = budgetItem.id || '';
        document.getElementById('budget-category').value = budgetItem.category || '';
        document.getElementById('budget-amount').value = budgetItem.budget || '';
        document.getElementById('budget-saved').value = budgetItem.saved || '';
        document.getElementById('budget-status').value = budgetItem.status || 'Outstanding';
        document.getElementById('budget-notes').value = budgetItem.notes || '';

        modal.classList.add('show');

        // Focus first input
        setTimeout(() => document.getElementById('budget-category').focus(), 300);
    }
}

function closeBudgetModal() {
    const modal = document.getElementById('budget-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal.show');
    modals.forEach(modal => modal.classList.remove('show'));
}

// Form Submission Handlers
function addBudgetItem(event) {
    event.preventDefault();

    const formData = {
        category: document.getElementById('add-budget-category').value,
        budget: parseFloat(document.getElementById('add-budget-amount').value),
        saved: parseFloat(document.getElementById('add-budget-saved').value) || 0,
        status: document.getElementById('add-budget-status').value,
        notes: document.getElementById('add-budget-notes').value
    };

    makeRequest('/api/budget', {
        method: 'POST',
        body: JSON.stringify(formData)
    })
    .then(response => {
        // Add new item to UI
        addBudgetItemToUI(response.item);
        closeAddBudgetModal();
        showNotification('Budget item added successfully!', 'success');
        updateBudgetSummary();
    })
    .catch(error => {
        console.error('Add failed:', error);
        showNotification('Failed to add budget item', 'error');
    });
}

function updateBudgetItem(event) {
    event.preventDefault();

    const itemId = document.getElementById('budget-item-id').value;
    const formData = {
        category: document.getElementById('budget-category').value,
        budget: parseFloat(document.getElementById('budget-amount').value),
        saved: parseFloat(document.getElementById('budget-saved').value) || 0,
        status: document.getElementById('budget-status').value,
        notes: document.getElementById('budget-notes').value
    };

    makeRequest(`/api/budget/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
    })
    .then(response => {
        // Update UI
        updateBudgetItemInUI(itemId, response.item);
        closeBudgetModal();
        showNotification('Budget item updated successfully!', 'success');
        updateBudgetSummary();
    })
    .catch(error => {
        console.error('Update failed:', error);
        showNotification('Failed to update budget item', 'error');
    });
}

// UI Update Helpers
function addBudgetItemToUI(item) {
    const container = document.querySelector('.budget-items-list');
    const itemHTML = createBudgetItemHTML(item);

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = itemHTML;
    const newItem = tempDiv.firstElementChild;

    container.appendChild(newItem);

    // Animate in
    newItem.style.opacity = '0';
    newItem.style.transform = 'translateX(20px)';

    setTimeout(() => {
        newItem.style.transition = 'all 0.3s ease';
        newItem.style.opacity = '1';
        newItem.style.transform = 'translateX(0)';
    }, 10);

    // Re-setup event listeners for new item
    setupNewItemListeners(newItem);
}

function updateBudgetItemInUI(itemId, updatedItem) {
    const item = document.querySelector(`[data-item-id="${itemId}"]`);
    if (item) {
        // Update content
        const nameElement = item.querySelector('.item-name');
        const savedElement = item.querySelector('.item-saved');
        const budgetElement = item.querySelector('.item-budget');
        const statusElement = item.querySelector('.item-status');
        const notesElement = item.querySelector('.item-notes span');
        const progressBar = item.querySelector('.progress-fill');
        const progressText = item.querySelector('.progress-percentage');

        if (nameElement) nameElement.textContent = updatedItem.category;
        if (savedElement) savedElement.textContent = `$${updatedItem.saved.toLocaleString()}`;
        if (budgetElement) budgetElement.textContent = `$${updatedItem.budget.toLocaleString()}`;
        if (statusElement) updateStatusDisplay(statusElement, updatedItem.status);
        if (notesElement) notesElement.textContent = updatedItem.notes;

        // Update progress
        const progress = updatedItem.budget > 0 ? (updatedItem.saved / updatedItem.budget * 100) : 0;
        if (progressBar) progressBar.style.width = `${progress}%`;
        if (progressText) progressText.textContent = `${Math.round(progress)}%`;

        // Update item classes
        item.classList.toggle('paid', updatedItem.status === 'Paid');
        item.classList.toggle('outstanding', updatedItem.status === 'Outstanding');
    }
}

function updateStatusDisplay(statusElement, status) {
    statusElement.className = `item-status status-${status.toLowerCase().replace(' ', '-')}`;

    const icon = statusElement.querySelector('i');
    const text = statusElement.querySelector('span');

    if (status === 'Paid') {
        icon.className = 'fas fa-check-circle';
        text.textContent = 'PAID';
    } else {
        icon.className = 'fas fa-clock';
        text.textContent = status.toUpperCase();
    }
}

// Budget Summary Updates
function updateBudgetSummary() {
    // Recalculate budget stats from current UI
    const items = document.querySelectorAll('.budget-item');
    let totalBudget = 0;
    let totalSaved = 0;

    items.forEach(item => {
        const budgetText = item.querySelector('.item-budget').textContent.replace(/[$,]/g, '');
        const savedText = item.querySelector('.item-saved').textContent.replace(/[$,]/g, '');

        totalBudget += parseFloat(budgetText) || 0;
        totalSaved += parseFloat(savedText) || 0;
    });

    const totalRemaining = totalBudget - totalSaved;
    const progress = totalBudget > 0 ? (totalSaved / totalBudget * 100) : 0;

    // Update summary cards
    const totalBudgetElement = document.getElementById('total-budget');
    const totalPaidElement = document.getElementById('total-paid');
    const totalRemainingElement = document.getElementById('total-remaining');
    const progressElement = document.getElementById('budget-progress');

    if (totalBudgetElement) totalBudgetElement.textContent = `$${totalBudget.toLocaleString()}`;
    if (totalPaidElement) totalPaidElement.textContent = `$${totalSaved.toLocaleString()}`;
    if (totalRemainingElement) totalRemainingElement.textContent = `$${totalRemaining.toLocaleString()}`;
    if (progressElement) progressElement.textContent = `${progress.toFixed(1)}%`;
}

// API Helper Functions
function saveBudgetField(itemId, field, value) {
    return makeRequest(`/api/budget/${itemId}/field`, {
        method: 'PATCH',
        body: JSON.stringify({ field, value })
    });
}

// Keyboard Shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + N: Add new budget item
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            openAddBudgetModal();
        }

        // Escape: Close modals or cancel editing
        if (e.key === 'Escape') {
            const editingElements = document.querySelectorAll('.editable-text.editing');
            if (editingElements.length > 0) {
                editingElements.forEach(element => cancelInlineEdit(element));
            } else {
                closeAllModals();
            }
        }
    });
}

// Utility Functions
function createBudgetItemHTML(item) {
    const progress = item.budget > 0 ? (item.saved / item.budget * 100) : 0;
    const statusClass = item.status.toLowerCase().replace(' ', '-');
    const itemClass = item.status === 'Paid' ? 'paid' : 'outstanding';

    return `
        <div class="budget-item ${itemClass}" data-item-id="${item.id}">
            <div class="budget-item-content">
                <div class="item-emoji">${item.emoji || '💰'}</div>

                <div class="item-details">
                    <div class="item-header">
                        <h3 class="item-name editable-text" data-field="category" data-item-id="${item.id}">
                            ${item.category}
                        </h3>
                        <div class="item-amounts">
                            <span class="item-saved editable-text" data-field="saved" data-item-id="${item.id}">
                                $${item.saved.toLocaleString()}
                            </span>
                            <span class="amount-separator">/</span>
                            <span class="item-budget editable-text" data-field="budget" data-item-id="${item.id}">
                                $${item.budget.toLocaleString()}
                            </span>
                        </div>
                        <div class="item-status status-${statusClass}">
                            <i class="fas fa-${item.status === 'Paid' ? 'check-circle' : 'clock'}"></i>
                            <span>${item.status.toUpperCase()}</span>
                        </div>
                    </div>

                    <div class="item-progress">
                        <div class="progress-bar">
                            <div class="progress-fill ${item.status !== 'Paid' ? 'pending' : ''}"
                                 style="width: ${progress}%"></div>
                        </div>
                        <div class="progress-percentage">${Math.round(progress)}%</div>
                    </div>

                    ${item.notes ? `
                    <div class="item-notes editable-text" data-field="notes" data-item-id="${item.id}">
                        <i class="fas fa-sticky-note"></i>
                        <span>${item.notes}</span>
                    </div>
                    ` : ''}
                </div>

                <div class="item-actions">
                    <div class="edit-controls" style="display: none;">
                        <button class="btn save-btn" onclick="saveBudgetItem(${item.id})">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn cancel-btn" onclick="cancelBudgetEdit(${item.id})">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <div class="item-menu">
                        <button class="menu-toggle" onclick="toggleItemMenu(${item.id})">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <div class="menu-dropdown">
                            <button class="menu-item edit-item" onclick="enableEditMode(${item.id})">
                                <i class="fas fa-edit"></i>
                                Edit
                            </button>
                            <button class="menu-item toggle-status" onclick="toggleBudgetStatus(${item.id})">
                                <i class="fas fa-${item.status === 'Paid' ? 'undo' : 'check'}"></i>
                                ${item.status === 'Paid' ? 'Mark Outstanding' : 'Mark Paid'}
                            </button>
                            <button class="menu-item delete-item" onclick="deleteBudgetItem(${item.id})">
                                <i class="fas fa-trash"></i>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function setupNewItemListeners(item) {
    // Re-setup editable text listeners
    const editableElements = item.querySelectorAll('.editable-text');
    editableElements.forEach(element => {
        element.addEventListener('click', function() {
            if (!this.classList.contains('editing')) {
                enableInlineEdit(this);
            }
        });

        element.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                saveInlineEdit(this);
            } else if (e.key === 'Escape') {
                cancelInlineEdit(this);
            }
        });

        element.addEventListener('blur', function() {
            if (this.classList.contains('editing')) {
                saveInlineEdit(this);
            }
        });
    });
}

// Notification System (using base.js if available)
function showNotification(message, type = 'info') {
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        // Fallback notification
        console.log(`[${type.toUpperCase()}] ${message}`);

        // Simple toast notification
        const toast = document.createElement('div');
        toast.className = `notification ${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: var(--${type === 'error' ? 'error' : type === 'success' ? 'success' : 'info'});
            color: white;
            border-radius: 8px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Loading state helper (using base.js if available)
function setLoadingState(element, loading = true) {
    if (typeof window.setLoadingState === 'function') {
        window.setLoadingState(element, loading);
    } else {
        if (loading) {
            element.classList.add('loading');
            element.style.pointerEvents = 'none';
        } else {
            element.classList.remove('loading');
            element.style.pointerEvents = '';
        }
    }
}

// AJAX helper (using base.js if available)
function makeRequest(url, options = {}) {
    if (typeof window.makeRequest === 'function') {
        return window.makeRequest(url, options);
    } else {
        // Fallback AJAX implementation
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const finalOptions = { ...defaultOptions, ...options };

        return fetch(url, finalOptions)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .catch(error => {
                console.error('Request failed:', error);
                showNotification('Request failed: ' + error.message, 'error');
                throw error;
            });
    }
}