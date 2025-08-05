// Budget JavaScript functionality - FIXED VERSION
// Budget management, inline editing, and summary calculations

document.addEventListener('DOMContentLoaded', function() {
    initializeBudget();
    setupBudgetCards();
    setupBudgetModals();
    updateBudgetSummary();
});

function initializeBudget() {
    console.log('Initializing budget page...');

    // Setup event listeners for all budget interactions
    setupInlineEditing();
    setupStatusToggling();
    setupAddBudgetForm();

    // Calculate and display summary
    updateBudgetSummary();
    updateBudgetProgress();
}

// Budget Summary Calculations - FIXED
function updateBudgetSummary() {
    const budgetItems = document.querySelectorAll('.budget-card');
    let totalBudget = 0;
    let totalSaved = 0;
    let totalRemaining = 0;

    budgetItems.forEach(card => {
        const budgetAmount = parseFloat(card.dataset.budget || '0');
        const savedAmount = parseFloat(card.dataset.saved || '0');

        totalBudget += budgetAmount;
        totalSaved += savedAmount;
    });

    totalRemaining = totalBudget - totalSaved;
    const progress = totalBudget > 0 ? (totalSaved / totalBudget) * 100 : 0;

    // Update summary cards
    updateSummaryCard('total-budget', totalBudget);
    updateSummaryCard('total-saved', totalSaved);
    updateSummaryCard('total-remaining', totalRemaining);

    // Update progress bar
    const progressBar = document.querySelector('.budget-progress-fill');
    const progressText = document.querySelector('.progress-percentage');

    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }

    if (progressText) {
        progressText.textContent = `${Math.round(progress)}%`;
    }

    console.log(`Budget Summary - Total: $${totalBudget}, Saved: $${totalSaved}, Remaining: $${totalRemaining}`);
}

function updateSummaryCard(cardId, amount) {
    const card = document.getElementById(cardId);
    if (card) {
        const amountElement = card.querySelector('.summary-amount');
        if (amountElement) {
            amountElement.textContent = `$${amount.toLocaleString()}`;
        }
    }
}

// Budget Cards Setup - FIXED
function setupBudgetCards() {
    const budgetCards = document.querySelectorAll('.budget-card');

    budgetCards.forEach(card => {
        // Add hover effects for edit buttons
        card.addEventListener('mouseenter', function() {
            const editBtn = this.querySelector('.edit-btn');
            if (editBtn) {
                editBtn.style.opacity = '1';
            }
        });

        card.addEventListener('mouseleave', function() {
            const editBtn = this.querySelector('.edit-btn');
            if (editBtn) {
                editBtn.style.opacity = '0';
            }
        });

        // Setup edit button click
        const editBtn = card.querySelector('.edit-btn');
        if (editBtn) {
            editBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                openEditBudgetModal(card);
            });
        }

        // Setup status toggle
        const statusBadge = card.querySelector('.status-badge');
        if (statusBadge) {
            statusBadge.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleBudgetStatus(card);
            });
        }
    });
}

// Inline Editing Setup - FIXED
function setupInlineEditing() {
    const editableElements = document.querySelectorAll('[data-editable]');

    editableElements.forEach(element => {
        element.addEventListener('click', function() {
            if (!this.classList.contains('editing')) {
                startInlineEdit(this);
            }
        });
    });
}

function startInlineEdit(element) {
    const currentValue = element.textContent.replace('$', '').replace(',', '');
    const fieldType = element.dataset.editable;

    element.classList.add('editing');

    const input = document.createElement('input');
    input.type = fieldType === 'amount' ? 'number' : 'text';
    input.value = currentValue;
    input.className = 'inline-edit-input';

    // Style the input
    input.style.cssText = `
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid #d4af37;
        border-radius: 4px;
        padding: 4px 8px;
        color: white;
        font-size: inherit;
        width: 100%;
        max-width: 120px;
    `;

    element.innerHTML = '';
    element.appendChild(input);
    input.focus();
    input.select();

    // Save on Enter or blur
    function saveEdit() {
        const newValue = input.value;
        element.classList.remove('editing');

        if (fieldType === 'amount') {
            element.textContent = `$${parseFloat(newValue || 0).toLocaleString()}`;
            // Update data attribute for calculations
            const card = element.closest('.budget-card');
            if (element.dataset.editable === 'budget') {
                card.dataset.budget = newValue;
            } else if (element.dataset.editable === 'saved') {
                card.dataset.saved = newValue;
            }
        } else {
            element.textContent = newValue;
        }

        // Save to backend
        saveBudgetEdit(element, newValue);

        // Update summary
        updateBudgetSummary();
    }

    input.addEventListener('blur', saveEdit);
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveEdit();
        } else if (e.key === 'Escape') {
            element.classList.remove('editing');
            element.textContent = fieldType === 'amount' ? `$${currentValue}` : currentValue;
        }
    });
}

// Status Toggling - FIXED
function toggleBudgetStatus(card) {
    const statusBadge = card.querySelector('.status-badge');
    const currentStatus = statusBadge.textContent.trim();
    const newStatus = currentStatus === 'Paid' ? 'Outstanding' : 'Paid';

    statusBadge.textContent = newStatus;
    statusBadge.className = `status-badge ${newStatus.toLowerCase()}`;

    // If marking as paid, auto-update saved amount to budget amount
    if (newStatus === 'Paid') {
        const budgetAmount = card.dataset.budget || '0';
        const savedElement = card.querySelector('[data-editable="saved"]');
        if (savedElement) {
            savedElement.textContent = `$${parseFloat(budgetAmount).toLocaleString()}`;
            card.dataset.saved = budgetAmount;
        }
    }

    // Save to backend
    const itemId = card.dataset.itemId;
    if (itemId) {
        fetch(`/api/budget/${itemId}/toggle`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                console.error('Failed to toggle status:', data.error);
                // Revert on error
                statusBadge.textContent = currentStatus;
                statusBadge.className = `status-badge ${currentStatus.toLowerCase()}`;
            }
        })
        .catch(error => {
            console.error('Error toggling status:', error);
        });
    }

    updateBudgetSummary();
}

// Modal Management - FIXED
function setupBudgetModals() {
    // Add Budget Modal
    const addBudgetBtn = document.querySelector('.add-budget-btn');
    if (addBudgetBtn) {
        addBudgetBtn.addEventListener('click', openAddBudgetModal);
    }

    // Close modal handlers
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-overlay')) {
            closeAllModals();
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

function openAddBudgetModal() {
    const modal = document.getElementById('add-budget-modal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('modal-show');

        // Focus first input
        const firstInput = modal.querySelector('input');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

function openEditBudgetModal(card) {
    // Create or show edit modal
    let modal = document.getElementById('edit-budget-modal');

    if (!modal) {
        modal = createEditBudgetModal();
        document.body.appendChild(modal);
    }

    // Populate with current data
    const category = card.querySelector('.budget-category').textContent;
    const amount = card.dataset.budget || '0';
    const saved = card.dataset.saved || '0';
    const status = card.querySelector('.status-badge').textContent;

    modal.querySelector('#edit-budget-category').value = category;
    modal.querySelector('#edit-budget-amount').value = amount;
    modal.querySelector('#edit-budget-saved').value = saved;
    modal.querySelector('#edit-budget-status').value = status;

    modal.dataset.editingCard = card.dataset.itemId || '';
    modal.style.display = 'flex';
    modal.classList.add('modal-show');
}

function createEditBudgetModal() {
    const modal = document.createElement('div');
    modal.id = 'edit-budget-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Edit Budget Item</h3>
                <button class="modal-close">&times;</button>
            </div>
            <form class="modal-form" id="edit-budget-form">
                <div class="form-group">
                    <label>Category</label>
                    <input type="text" id="edit-budget-category" required>
                </div>
                <div class="form-group">
                    <label>Budget Amount</label>
                    <input type="number" id="edit-budget-amount" step="0.01" required>
                </div>
                <div class="form-group">
                    <label>Saved Amount</label>
                    <input type="number" id="edit-budget-saved" step="0.01">
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select id="edit-budget-status">
                        <option value="Outstanding">Outstanding</option>
                        <option value="Paid">Paid</option>
                    </select>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" onclick="closeAllModals()">Cancel</button>
                    <button type="submit" class="btn-primary">Save Changes</button>
                </div>
            </form>
        </div>
    `;

    // Setup form submission
    modal.querySelector('#edit-budget-form').addEventListener('submit', handleEditBudgetSubmit);
    modal.querySelector('.modal-close').addEventListener('click', closeAllModals);

    return modal;
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.style.display = 'none';
        modal.classList.remove('modal-show');
    });
}

// Form Handlers - FIXED
function setupAddBudgetForm() {
    const form = document.getElementById('add-budget-form');
    if (form) {
        form.addEventListener('submit', handleAddBudgetSubmit);
    }
}

function handleAddBudgetSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const budgetData = {
        category: formData.get('category'),
        amount: parseFloat(formData.get('amount')),
        saved: parseFloat(formData.get('saved') || '0'),
        status: formData.get('status') || 'Outstanding'
    };

    // Add to UI immediately
    addBudgetCardToUI(budgetData);
    closeAllModals();
    updateBudgetSummary();

    // Save to backend
    fetch('/api/budget/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(budgetData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Budget item added successfully');
            // Update the card with the new ID
            const newCard = document.querySelector('.budget-card:last-child');
            if (newCard && data.id) {
                newCard.dataset.itemId = data.id;
            }
        } else {
            console.error('Failed to add budget item:', data.error);
        }
    })
    .catch(error => {
        console.error('Error adding budget item:', error);
    });

    // Reset form
    e.target.reset();
}

function handleEditBudgetSubmit(e) {
    e.preventDefault();

    const modal = e.target.closest('.modal-overlay');
    const itemId = modal.dataset.editingCard;

    const formData = new FormData(e.target);
    const budgetData = {
        category: formData.get('category'),
        amount: parseFloat(formData.get('amount')),
        saved: parseFloat(formData.get('saved') || '0'),
        status: formData.get('status')
    };

    // Update UI
    updateBudgetCardInUI(itemId, budgetData);
    closeAllModals();
    updateBudgetSummary();

    // Save to backend
    fetch(`/api/budget/${itemId}/update`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(budgetData)
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            console.error('Failed to update budget item:', data.error);
        }
    })
    .catch(error => {
        console.error('Error updating budget item:', error);
    });
}

// UI Updates - FIXED
function addBudgetCardToUI(budgetData) {
    const container = document.querySelector('.budget-grid');
    if (!container) return;

    const card = document.createElement('div');
    card.className = 'budget-card';
    card.dataset.budget = budgetData.amount;
    card.dataset.saved = budgetData.saved;
    card.dataset.itemId = Date.now(); // Temporary ID

    card.innerHTML = `
        <div class="budget-card-header">
            <h4 class="budget-category">${budgetData.category}</h4>
            <button class="edit-btn" style="opacity: 0;">
                <i class="fas fa-edit"></i>
            </button>
        </div>
        <div class="budget-amounts">
            <div class="amount-item">
                <span class="amount-label">Budget</span>
                <span class="amount-value" data-editable="budget">$${budgetData.amount.toLocaleString()}</span>
            </div>
            <div class="amount-item">
                <span class="amount-label">Saved</span>
                <span class="amount-value" data-editable="saved">$${budgetData.saved.toLocaleString()}</span>
            </div>
            <div class="amount-item">
                <span class="amount-label">Remaining</span>
                <span class="amount-value">$${(budgetData.amount - budgetData.saved).toLocaleString()}</span>
            </div>
        </div>
        <div class="budget-status">
            <span class="status-badge ${budgetData.status.toLowerCase()}">${budgetData.status}</span>
        </div>
    `;

    container.appendChild(card);

    // Setup events for new card
    setupBudgetCards();
    setupInlineEditing();
}

function updateBudgetCardInUI(itemId, budgetData) {
    const card = document.querySelector(`[data-item-id="${itemId}"]`);
    if (!card) return;

    card.dataset.budget = budgetData.amount;
    card.dataset.saved = budgetData.saved;

    card.querySelector('.budget-category').textContent = budgetData.category;
    card.querySelector('[data-editable="budget"]').textContent = `$${budgetData.amount.toLocaleString()}`;
    card.querySelector('[data-editable="saved"]').textContent = `$${budgetData.saved.toLocaleString()}`;

    const remainingElement = card.querySelector('.amount-value:last-child');
    remainingElement.textContent = `$${(budgetData.amount - budgetData.saved).toLocaleString()}`;

    const statusBadge = card.querySelector('.status-badge');
    statusBadge.textContent = budgetData.status;
    statusBadge.className = `status-badge ${budgetData.status.toLowerCase()}`;
}

// Backend Communication - FIXED
function saveBudgetEdit(element, newValue) {
    const card = element.closest('.budget-card');
    const itemId = card.dataset.itemId;
    const field = element.dataset.editable;

    if (!itemId) return;

    fetch(`/api/budget/${itemId}/update-field`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ field, value: newValue })
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            console.error('Failed to save edit:', data.error);
        }
    })
    .catch(error => {
        console.error('Error saving edit:', error);
    });
}

// Progress Updates - FIXED
function updateBudgetProgress() {
    const progressContainer = document.querySelector('.budget-progress');
    if (!progressContainer) return;

    const budgetItems = document.querySelectorAll('.budget-card');
    let totalBudget = 0;
    let totalSaved = 0;

    budgetItems.forEach(card => {
        totalBudget += parseFloat(card.dataset.budget || '0');
        totalSaved += parseFloat(card.dataset.saved || '0');
    });

    const progress = totalBudget > 0 ? (totalSaved / totalBudget) * 100 : 0;

    const progressBar = progressContainer.querySelector('.progress-fill');
    const progressText = progressContainer.querySelector('.progress-text');

    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }

    if (progressText) {
        progressText.textContent = `${Math.round(progress)}% Complete`;
    }
}

// Export functions for global access
window.BudgetManager = {
    updateSummary: updateBudgetSummary,
    toggleStatus: toggleBudgetStatus,
    openAddModal: openAddBudgetModal,
    refreshData: initializeBudget
};