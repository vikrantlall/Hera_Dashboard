// Budget Page JavaScript with Complete AJAX Editing

document.addEventListener('DOMContentLoaded', function() {
    initializeBudgetPage();
    initializeInlineEditing();
    initializeModals();
    initializeDragAndDrop();
    updateBudgetSummary();
});

let currentEditingElement = null;
let originalValue = null;

function initializeBudgetPage() {
    // Add event listeners for budget items
    setupBudgetItemListeners();
    setupAddBudgetForm();
    setupDeleteConfirmation();
    
    // Initialize tooltips and animations
    initializeBudgetAnimations();
    
    // Auto-save functionality
    setupAutoSave();
}

function setupBudgetItemListeners() {
    const budgetItems = document.querySelectorAll('.budget-item');
    
    budgetItems.forEach(item => {
        const itemId = item.dataset.itemId;
        
        // Status select change
        const statusSelect = item.querySelector('.status-select');
        if (statusSelect) {
            statusSelect.addEventListener('change', function() {
                updateBudgetItem(itemId, { status: this.value });
                updateProgressBar(item, this.value);
            });
        }
        
        // Menu toggle
        const menuToggle = item.querySelector('.menu-toggle');
        const menu = item.querySelector('.item-menu');
        if (menuToggle && menu) {
            menuToggle.addEventListener('click', function(e) {
                e.stopPropagation();
                closeAllMenus();
                menu.classList.toggle('active');
            });
        }
        
        // Edit button
        const editBtn = item.querySelector('.edit-item');
        if (editBtn) {
            editBtn.addEventListener('click', function() {
                enableEditMode(item);
                menu.classList.remove('active');
            });
        }
        
        // Delete button
        const deleteBtn = item.querySelector('.delete-item');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function() {
                showDeleteModal(itemId, item.querySelector('.item-category .editable-text').textContent);
                menu.classList.remove('active');
            });
        }
    });
    
    // Close menus when clicking outside
    document.addEventListener('click', closeAllMenus);
}

function initializeInlineEditing() {
    const editableElements = document.querySelectorAll('.editable-text, .editable-number, .editable-emoji');
    
    editableElements.forEach(element => {
        element.addEventListener('click', function() {
            if (currentEditingElement && currentEditingElement !== this) {
                cancelEdit();
            }
            startEdit(this);
        });
        
        element.addEventListener('blur', function() {
            if (this === currentEditingElement) {
                saveEdit();
            }
        });
        
        element.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEdit();
            } else if (e.key === 'Escape') {
                cancelEdit();
            }
        });
    });
}

function startEdit(element) {
    if (currentEditingElement) return;
    
    currentEditingElement = element;
    originalValue = element.textContent.trim();
    
    element.classList.add('editing');
    element.contentEditable = true;
    element.focus();
    
    // Select all text
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    
    // Show edit controls
    const budgetItem = element.closest('.budget-item');
    const editControls = budgetItem.querySelector('.edit-controls');
    if (editControls) {
        editControls.style.display = 'flex';
        
        // Setup save/cancel buttons
        const saveBtn = editControls.querySelector('.save-btn');
        const cancelBtn = editControls.querySelector('.cancel-btn');
        
        saveBtn.onclick = saveEdit;
        cancelBtn.onclick = cancelEdit;
    }
}

function saveEdit() {
    if (!currentEditingElement) return;
    
    const newValue = currentEditingElement.textContent.trim();
    const field = currentEditingElement.dataset.field;
    const budgetItem = currentEditingElement.closest('.budget-item');
    const itemId = budgetItem.dataset.itemId;
    
    if (newValue !== originalValue && newValue !== '') {
        // Validate input
        if (field === 'amount') {
            const numValue = parseFloat(newValue);
            if (isNaN(numValue) || numValue < 0) {
                utils.showNotification('Please enter a valid amount', 'error');
                cancelEdit();
                return;
            }
        }
        
        // Show loading state
        budgetItem.classList.add('saving');
        
        // Prepare update data
        const updateData = {};
        if (field === 'amount') {
            updateData[field] = parseFloat(newValue);
        } else {
            updateData[field] = newValue;
        }
        
        // Send update to server
        updateBudgetItem(itemId, updateData)
            .then(() => {
                budgetItem.classList.remove('saving');
                budgetItem.classList.add('saved');
                setTimeout(() => budgetItem.classList.remove('saved'), 2000);
                
                // Update summary if amount changed
                if (field === 'amount') {
                    updateBudgetSummary();
                }
                
                utils.showNotification('Budget item updated successfully', 'success');
            })
            .catch(error => {
                budgetItem.classList.remove('saving');
                budgetItem.classList.add('error');
                setTimeout(() => budgetItem.classList.remove('error'), 2000);
                
                currentEditingElement.textContent = originalValue;
                utils.showNotification('Failed to update budget item', 'error');
            });
    }
    
    endEdit();
}

function cancelEdit() {
    if (!currentEditingElement) return;
    
    currentEditingElement.textContent = originalValue;
    endEdit();
}

function endEdit() {
    if (currentEditingElement) {
        currentEditingElement.classList.remove('editing');
        currentEditingElement.contentEditable = false;
        
        const budgetItem = currentEditingElement.closest('.budget-item');
        const editControls = budgetItem.querySelector('.edit-controls');
        if (editControls) {
            editControls.style.display = 'none';
        }
        
        currentEditingElement = null;
        originalValue = null;
    }
}

function updateBudgetItem(itemId, data) {
    return utils.ajax(`/api/budget/${itemId}`, {
        method: 'PUT',
        data: data
    });
}

function enableEditMode(budgetItem) {
    const editableElements = budgetItem.querySelectorAll('.editable-text, .editable-number, .editable-emoji');
    editableElements.forEach(element => {
        element.classList.add('edit-mode-highlight');
    });
    
    setTimeout(() => {
        editableElements.forEach(element => {
            element.classList.remove('edit-mode-highlight');
        });
    }, 2000);
    
    utils.showNotification('Click any field to edit', 'info');
}

function updateProgressBar(budgetItem, status) {
    const progressBar = budgetItem.querySelector('.progress-fill');
    if (progressBar) {
        progressBar.className = 'progress-fill';
        
        if (status === 'Paid') {
            progressBar.classList.add('completed');
            progressBar.style.width = '100%';
        } else if (status === 'Partial') {
            progressBar.classList.add('partial');
            progressBar.style.width = '50%';
        } else {
            progressBar.classList.add('outstanding');
            progressBar.style.width = '10%';
        }
    }
}

function setupAddBudgetForm() {
    const addBtn = document.getElementById('add-budget-item');
    const modal = document.getElementById('add-item-modal');
    const form = document.getElementById('add-item-form');
    
    if (addBtn && modal && form) {
        addBtn.addEventListener('click', function() {
            modal.classList.add('active');
            form.reset();
            
            // Focus on first input
            const firstInput = form.querySelector('input[name="category"]');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        });
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(form);
            const data = {
                category: formData.get('category'),
                amount: parseFloat(formData.get('amount')) || 0,
                status: formData.get('status'),
                emoji: formData.get('emoji') || '💰',
                notes: formData.get('notes') || ''
            };
            
            // Validate data
            if (!data.category.trim()) {
                utils.showNotification('Category name is required', 'error');
                return;
            }
            
            if (data.amount < 0) {
                utils.showNotification('Amount must be positive', 'error');
                return;
            }
            
            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
            submitBtn.disabled = true;
            
            // Add new budget item
            utils.ajax('/api/budget', {
                method: 'POST',
                data: data
            })
            .then(response => {
                if (response.success) {
                    addBudgetItemToDOM(response.item);
                    updateBudgetSummary();
                    modal.classList.remove('active');
                    utils.showNotification('Budget category added successfully', 'success');
                } else {
                    throw new Error(response.error || 'Failed to add budget item');
                }
            })
            .catch(error => {
                utils.showNotification('Failed to add budget category', 'error');
            })
            .finally(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            });
        });
    }
}

function addBudgetItemToDOM(item) {
    const budgetList = document.getElementById('budget-items-list');
    const newItemHTML = createBudgetItemHTML(item);
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = newItemHTML;
    const newItem = tempDiv.firstChild;
    
    newItem.classList.add('new-budget-item');
    budgetList.appendChild(newItem);
    
    // Setup event listeners for new item
    setupBudgetItemListeners();
    
    // Scroll to new item
    newItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Remove new item class after animation
    setTimeout(() => {
        newItem.classList.remove('new-budget-item');
    }, 1000);
}

function createBudgetItemHTML(item) {
    return `
        <div class="budget-item" data-item-id="${item.id}">
            <div class="budget-item-content">
                <div class="item-emoji">
                    <span class="editable-emoji" data-field="emoji">${item.emoji}</span>
                </div>
                
                <div class="item-details">
                    <div class="item-header">
                        <h3 class="item-category">
                            <span class="editable-text" data-field="category">${item.category}</span>
                        </h3>
                        <div class="item-status">
                            <select class="status-select" data-field="status">
                                <option value="Outstanding" ${item.status === 'Outstanding' ? 'selected' : ''}>Outstanding</option>
                                <option value="Paid" ${item.status === 'Paid' ? 'selected' : ''}>Paid</option>
                                <option value="Partial" ${item.status === 'Partial' ? 'selected' : ''}>Partial</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="item-amount">
                        <span class="currency-symbol">$</span>
                        <span class="editable-number" data-field="amount">${item.amount.toFixed(2)}</span>
                    </div>
                    
                    <div class="item-notes">
                        <span class="editable-text" data-field="notes" data-placeholder="Add notes...">${item.notes}</span>
                    </div>
                </div>
                
                <div class="item-actions">
                    <div class="edit-controls" style="display: none;">
                        <button class="btn btn-sm btn-success save-btn">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-sm btn-secondary cancel-btn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="item-menu">
                        <button class="menu-toggle">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <div class="menu-dropdown">
                            <button class="menu-item edit-item">
                                <i class="fas fa-edit"></i>
                                Edit
                            </button>
                            <button class="menu-item delete-item">
                                <i class="fas fa-trash"></i>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="budget-item-progress">
                <div class="progress-bar">
                    <div class="progress-fill ${getProgressClass(item.status)}" 
                         style="width: ${getProgressWidth(item.status)}%;"></div>
                </div>
            </div>
        </div>
    `;
}

function getProgressClass(status) {
    switch (status) {
        case 'Paid': return 'completed';
        case 'Partial': return 'partial';
        default: return 'outstanding';
    }
}

function getProgressWidth(status) {
    switch (status) {
        case 'Paid': return 100;
        case 'Partial': return 50;
        default: return 10;
    }
}

function setupDeleteConfirmation() {
    const deleteModal = document.getElementById('delete-modal');
    const confirmBtn = document.getElementById('confirm-delete');
    
    let itemToDelete = null;
    
    window.showDeleteModal = function(itemId, categoryName) {
        itemToDelete = itemId;
        deleteModal.classList.add('active');
        
        // Update modal content
        const modalContent = deleteModal.querySelector('.modal-content p');
        if (modalContent) {
            modalContent.innerHTML = `Are you sure you want to delete the <strong>${categoryName}</strong> budget category? This action cannot be undone.`;
        }
    };
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            if (itemToDelete) {
                deleteBudgetItem(itemToDelete);
            }
        });
    }
}

function deleteBudgetItem(itemId) {
    const budgetItem = document.querySelector(`[data-item-id="${itemId}"]`);
    
    if (budgetItem) {
        budgetItem.classList.add('loading');
        
        utils.ajax(`/api/budget/${itemId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.success) {
                // Animate removal
                budgetItem.style.transform = 'translateX(-100%)';
                budgetItem.style.opacity = '0';
                
                setTimeout(() => {
                    budgetItem.remove();
                    updateBudgetSummary();
                }, 300);
                
                document.getElementById('delete-modal').classList.remove('active');
                utils.showNotification('Budget category deleted successfully', 'success');
            } else {
                throw new Error(response.error || 'Failed to delete budget item');
            }
        })
        .catch(error => {
            budgetItem.classList.remove('loading');
            utils.showNotification('Failed to delete budget category', 'error');
        });
    }
}

function updateBudgetSummary() {
    const budgetItems = document.querySelectorAll('.budget-item');
    let total = 0;
    let paid = 0;
    let remaining = 0;
    
    budgetItems.forEach(item => {
        const amountElement = item.querySelector('.editable-number[data-field="amount"]');
        const statusSelect = item.querySelector('.status-select');
        
        if (amountElement && statusSelect) {
            const amount = parseFloat(amountElement.textContent) || 0;
            total += amount;
            
            if (statusSelect.value === 'Paid') {
                paid += amount;
            } else {
                remaining += amount;
            }
        }
    });
    
    // Update summary displays
    const totalDisplay = document.getElementById('total-budget');
    const paidDisplay = document.getElementById('total-paid');
    const remainingDisplay = document.getElementById('total-remaining');
    const progressDisplay = document.getElementById('budget-progress');
    
    if (totalDisplay) totalDisplay.textContent = `$${total.toFixed(2)}`;
    if (paidDisplay) paidDisplay.textContent = `$${paid.toFixed(2)}`;
    if (remainingDisplay) remainingDisplay.textContent = `$${remaining.toFixed(2)}`;
    if (progressDisplay) {
        const progress = total > 0 ? (paid / total * 100) : 0;
        progressDisplay.textContent = `${progress.toFixed(1)}%`;
    }
    
    // Update breakdown section
    updateCategoryBreakdown();
}

function updateCategoryBreakdown() {
    const breakdown = document.getElementById('category-breakdown');
    if (!breakdown) return;
    
    const budgetItems = document.querySelectorAll('.budget-item');
    let total = 0;
    
    // Calculate total first
    budgetItems.forEach(item => {
        const amountElement = item.querySelector('.editable-number[data-field="amount"]');
        if (amountElement) {
            total += parseFloat(amountElement.textContent) || 0;
        }
    });
    
    // Clear and rebuild breakdown
    breakdown.innerHTML = '';
    
    budgetItems.forEach(item => {
        const categoryElement = item.querySelector('.editable-text[data-field="category"]');
        const amountElement = item.querySelector('.editable-number[data-field="amount"]');
        const emojiElement = item.querySelector('.editable-emoji[data-field="emoji"]');
        
        if (categoryElement && amountElement) {
            const category = categoryElement.textContent;
            const amount = parseFloat(amountElement.textContent) || 0;
            const emoji = emojiElement ? emojiElement.textContent : '💰';
            const percentage = total > 0 ? (amount / total * 100) : 0;
            
            const breakdownItem = document.createElement('div');
            breakdownItem.className = 'breakdown-item';
            breakdownItem.innerHTML = `
                <div class="breakdown-info">
                    <span class="breakdown-emoji">${emoji}</span>
                    <span class="breakdown-category">${category}</span>
                </div>
                <div class="breakdown-amount">$${amount.toFixed(2)}</div>
                <div class="breakdown-percentage">${percentage.toFixed(1)}%</div>
            `;
            
            breakdown.appendChild(breakdownItem);
        }
    });
}

function initializeModals() {
    // Setup modal close buttons
    const modalCloses = document.querySelectorAll('.modal-close, [data-modal]');
    modalCloses.forEach(button => {
        button.addEventListener('click', function() {
            const modalId = this.dataset.modal;
            if (modalId) {
                const modal = document.getElementById(modalId);
                if (modal) {
                    modal.classList.remove('active');
                }
            }
        });
    });
    
    // Close modals on overlay click
    const overlays = document.querySelectorAll('.glass-overlay');
    overlays.forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                overlay.classList.remove('active');
            }
        });
    });
    
    // ESC key to close modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const activeModal = document.querySelector('.glass-overlay.active');
            if (activeModal) {
                activeModal.classList.remove('active');
            }
        }
    });
}

function initializeDragAndDrop() {
    // Add drag and drop functionality for reordering budget items
    const budgetList = document.getElementById('budget-items-list');
    
    if (budgetList) {
        let draggedElement = null;
        
        budgetList.addEventListener('dragstart', function(e) {
            if (e.target.classList.contains('budget-item')) {
                draggedElement = e.target;
                e.target.style.opacity = '0.5';
            }
        });
        
        budgetList.addEventListener('dragend', function(e) {
            if (e.target.classList.contains('budget-item')) {
                e.target.style.opacity = '';
                draggedElement = null;
            }
        });
        
        budgetList.addEventListener('dragover', function(e) {
            e.preventDefault();
        });
        
        budgetList.addEventListener('drop', function(e) {
            e.preventDefault();
            
            if (draggedElement && e.target.closest('.budget-item')) {
                const targetElement = e.target.closest('.budget-item');
                if (targetElement !== draggedElement) {
                    const rect = targetElement.getBoundingClientRect();
                    const midY = rect.top + rect.height / 2;
                    
                    if (e.clientY < midY) {
                        budgetList.insertBefore(draggedElement, targetElement);
                    } else {
                        budgetList.insertBefore(draggedElement, targetElement.nextSibling);
                    }
                }
            }
        });
        
        // Make items draggable
        const budgetItems = budgetList.querySelectorAll('.budget-item');
        budgetItems.forEach(item => {
            item.draggable = true;
        });
    }
}

function setupAutoSave() {
    let autoSaveTimeout;
    
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('editable-text') || 
            e.target.classList.contains('editable-number') || 
            e.target.classList.contains('editable-emoji')) {
            
            clearTimeout(autoSaveTimeout);
            autoSaveTimeout = setTimeout(() => {
                if (currentEditingElement === e.target) {
                    saveEdit();
                }
            }, 2000); // Auto-save after 2 seconds of inactivity
        }
    });
}

function initializeBudgetAnimations() {
    // Add entrance animations to budget items
    const budgetItems = document.querySelectorAll('.budget-item');
    budgetItems.forEach((item, index) => {
        item.style.animationDelay = `${index * 0.1}s`;
    });
    
    // Add hover effects to summary cards
    const summaryCards = document.querySelectorAll('.summary-card');
    summaryCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
}

function closeAllMenus() {
    const activeMenus = document.querySelectorAll('.item-menu.active');
    activeMenus.forEach(menu => {
        menu.classList.remove('active');
    });
}

// Export functions for external use
window.budgetPageUtils = {
    updateBudgetSummary,
    addBudgetItemToDOM,
    deleteBudgetItem,
    showDeleteModal
};