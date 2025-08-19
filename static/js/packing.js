// HERA Packing Page JavaScript - FIXED VERSION
// Handles all packing list functionality with working modals

document.addEventListener('DOMContentLoaded', function() {
    initializePackingPage();
});

function initializePackingPage() {
    console.log('🎯 Initializing Packing Page...');

    setupModals();
    setupFormSubmissions();
    setupCategoryDropdown();
    setupKeyboardShortcuts();
    updateAllProgress();

    console.log('✅ Packing page initialized successfully');
}

// =============================================================================
// MODAL MANAGEMENT - FIXED
// =============================================================================

function setupModals() {
    // Close modals when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeModal();
        }
    });
}

function openAddItemModal(defaultCategory = '') {
    const modal = document.getElementById('add-item-modal');
    const categorySelect = document.getElementById('item-category');

    if (!modal) {
        console.error('Add item modal not found!');
        return;
    }

    // Reset form
    const form = document.getElementById('add-item-form');
    if (form) form.reset();

    document.getElementById('item-name').value = '';
    document.getElementById('item-notes').value = '';
    const packedCheckbox = document.getElementById('item-packed');
    if (packedCheckbox) packedCheckbox.checked = false;

    const newCategoryInput = document.getElementById('new-category');
    const newCategoryGroup = document.getElementById('new-category-group');
    if (newCategoryInput) newCategoryInput.value = '';
    if (newCategoryGroup) newCategoryGroup.style.display = 'none';

    // Set default category if provided
    if (defaultCategory && categorySelect) {
        categorySelect.value = defaultCategory;
    }

    modal.classList.add('active');

    // Focus first input
    setTimeout(() => {
        document.getElementById('item-name').focus();
    }, 100);
}

function editItem(itemId) {
    const item = document.querySelector(`[data-item-id="${itemId}"]`);
    if (!item) {
        console.error('Item not found:', itemId);
        return;
    }

    const modal = document.getElementById('edit-item-modal');
    if (!modal) {
        console.error('Edit modal not found!');
        return;
    }

    const name = item.querySelector('.packing-name').textContent.trim();
    const notes = item.querySelector('.packing-notes')?.textContent.trim() || '';
    const packed = item.classList.contains('packed');

    // Populate form
    document.getElementById('edit-item-id').value = itemId;
    document.getElementById('edit-item-name').value = name;
    document.getElementById('edit-item-notes').value = notes;

    const packedCheckbox = document.getElementById('edit-item-packed');
    if (packedCheckbox) packedCheckbox.checked = packed;

    modal.classList.add('active');

    // Focus first input
    setTimeout(() => {
        document.getElementById('edit-item-name').focus();
    }, 100);
}

function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => modal.classList.remove('active'));
}

// =============================================================================
// FORM SUBMISSIONS - FIXED
// =============================================================================

function setupFormSubmissions() {
    // Add item form
    const addForm = document.getElementById('add-item-form');
    if (addForm) {
        addForm.addEventListener('submit', handleAddItem);
    }

    // Edit item form
    const editForm = document.getElementById('edit-item-form');
    if (editForm) {
        editForm.addEventListener('submit', handleEditItem);
    }
}

function handleAddItem(event) {
    event.preventDefault();

    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    const itemName = document.getElementById('item-name').value.trim();
    const category = document.getElementById('item-category').value;
    const newCategoryName = document.getElementById('new-category').value.trim();
    const notes = document.getElementById('item-notes').value.trim();
    const packed = document.getElementById('item-packed')?.checked || false;

    if (!itemName) {
        showNotification('Item name is required', 'error');
        document.getElementById('item-name').focus();
        return;
    }

    // Determine final category
    const finalCategory = category === 'new' ? newCategoryName : category;

    if (category === 'new' && !newCategoryName) {
        showNotification('New category name is required', 'error');
        document.getElementById('new-category').focus();
        return;
    }

    // Show loading state
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    submitBtn.disabled = true;

    // Simulate API call
    setTimeout(() => {
        try {
            // Create new item element
            const newItemId = Date.now(); // Simulate ID
            createNewItemElement(newItemId, itemName, finalCategory, notes, packed);

            // Close modal and reset
            closeModal();
            updateAllProgress();
            showNotification('Item added successfully!', 'success');

        } catch (error) {
            console.error('Error adding item:', error);
            showNotification('Failed to add item', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }, 800);
}

function handleEditItem(event) {
    event.preventDefault();

    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    const itemId = document.getElementById('edit-item-id').value;
    const name = document.getElementById('edit-item-name').value.trim();
    const notes = document.getElementById('edit-item-notes').value.trim();
    const packed = document.getElementById('edit-item-packed')?.checked || false;

    if (!name) {
        showNotification('Item name is required', 'error');
        document.getElementById('edit-item-name').focus();
        return;
    }

    // Show loading state
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitBtn.disabled = true;

    // Simulate API call
    setTimeout(() => {
        try {
            updateItemElement(itemId, name, notes, packed);
            closeModal();
            updateAllProgress();
            showNotification('Item updated successfully', 'success');
        } catch (error) {
            console.error('Error updating item:', error);
            showNotification('Failed to update item', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }, 600);
}

// =============================================================================
// ITEM MANAGEMENT
// =============================================================================

function toggleItemPacked(itemId) {
    const item = document.querySelector(`[data-item-id="${itemId}"]`);
    if (!item) return;

    const checkbox = item.querySelector('.packing-checkbox');
    const isPacked = item.classList.contains('packed');

    // Toggle packed state
    item.classList.toggle('packed');

    // Update checkbox visual
    if (item.classList.contains('packed')) {
        checkbox.innerHTML = '<i class="fas fa-check"></i>';
        checkbox.classList.add('checked');
    } else {
        checkbox.innerHTML = '';
        checkbox.classList.remove('checked');
    }

    // Update progress
    updateAllProgress();

    // Show notification
    const itemName = item.querySelector('.packing-name').textContent;
    const action = item.classList.contains('packed') ? 'packed' : 'unpacked';
    showNotification(`${itemName} ${action}`, 'success');
}

function deleteItem(itemId) {
    const item = document.querySelector(`[data-item-id="${itemId}"]`);
    if (!item) return;

    const itemName = item.querySelector('.packing-name').textContent;

    if (confirm(`Are you sure you want to delete "${itemName}"?`)) {
        // Add fade out animation
        item.style.opacity = '0.5';
        item.style.pointerEvents = 'none';

        setTimeout(() => {
            const category = item.closest('.packing-category');
            item.remove();

            // Check if category is now empty
            const remainingItems = category.querySelectorAll('.packing-item');
            if (remainingItems.length === 0) {
                const itemsContainer = category.querySelector('.packing-items');
                if (itemsContainer) {
                    itemsContainer.innerHTML = '<div class="empty-category">No items yet</div>';
                }
            }

            updateAllProgress();
            showNotification(`${itemName} deleted`, 'success');
        }, 300);
    }
}

// =============================================================================
// CATEGORY MANAGEMENT
// =============================================================================

function toggleCategoryPacked(category) {
    const categoryDiv = document.querySelector(`[data-category="${category}"]`);
    if (!categoryDiv) return;

    const items = categoryDiv.querySelectorAll('.packing-item');
    const packed = categoryDiv.querySelectorAll('.packing-item.packed');
    const unpacked = categoryDiv.querySelectorAll('.packing-item:not(.packed)');

    const action = unpacked.length === 0 ? 'unpack' : 'pack';
    const targets = unpacked.length === 0 ?
        categoryDiv.querySelectorAll('.packing-item.packed') : unpacked;

    if (targets.length === 0) return;

    const actionText = action === 'pack' ? 'Pack' : 'Unpack';
    if (confirm(`${actionText} all ${targets.length} items in ${category}?`)) {
        targets.forEach((item, index) => {
            const itemId = parseInt(item.dataset.itemId);
            setTimeout(() => toggleItemPacked(itemId), index * 100);
        });
    }
}

function createNewCategory(categoryName) {
    const categoryHTML = `
        <div class="packing-category" data-category="${categoryName}">
            <div class="category-header">
                <div class="category-info">
                    <h3 class="category-title">${categoryName}</h3>
                    <p class="category-subtitle">0 / 0 packed</p>
                </div>
                <div class="category-actions">
                    <button class="action-btn" onclick="toggleCategoryPacked('${categoryName}')" title="Toggle All">
                        <i class="fas fa-check-circle"></i>
                    </button>
                    <button class="action-btn" onclick="openAddItemModal('${categoryName}')" title="Add Item">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
            <div class="packing-items">
                <div class="empty-category">No items yet</div>
            </div>
        </div>
    `;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = categoryHTML;
    return tempDiv.firstElementChild;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function createNewItemElement(itemId, name, category, notes, packed) {
    // Find or create category
    let categoryDiv = document.querySelector(`[data-category="${category}"]`);

    if (!categoryDiv) {
        // Create new category if it doesn't exist
        categoryDiv = createNewCategory(category);
        document.querySelector('.packing-grid').appendChild(categoryDiv);
    }

    // Remove empty state if exists
    const emptyState = categoryDiv.querySelector('.empty-category');
    if (emptyState) {
        emptyState.remove();
    }

    // Create item HTML
    const itemHTML = `
        <div class="packing-item ${packed ? 'packed' : ''}" data-item-id="${itemId}">
            <div class="packing-checkbox ${packed ? 'checked' : ''}" onclick="toggleItemPacked(${itemId})">
                ${packed ? '<i class="fas fa-check"></i>' : ''}
            </div>
            <div class="packing-content">
                <div class="packing-name">${name}</div>
                ${notes ? `<div class="packing-notes">${notes}</div>` : ''}
            </div>
            <div class="packing-actions">
                <button class="action-btn edit-btn" onclick="editItem(${itemId})" title="Edit Item">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteItem(${itemId})" title="Delete Item">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;

    categoryDiv.querySelector('.packing-items').insertAdjacentHTML('beforeend', itemHTML);
}

function updateItemElement(itemId, name, notes, packed) {
    const item = document.querySelector(`[data-item-id="${itemId}"]`);
    if (!item) return;

    // Update content
    const nameEl = item.querySelector('.packing-name');
    const notesEl = item.querySelector('.packing-notes');
    const checkbox = item.querySelector('.packing-checkbox');

    if (nameEl) nameEl.textContent = name;

    // Handle notes
    if (notes) {
        if (notesEl) {
            notesEl.textContent = notes;
        } else {
            // Add notes element if it doesn't exist
            const content = item.querySelector('.packing-content');
            content.insertAdjacentHTML('beforeend', `<div class="packing-notes">${notes}</div>`);
        }
    } else if (notesEl) {
        notesEl.remove();
    }

    // Update packed state
    if (packed !== item.classList.contains('packed')) {
        item.classList.toggle('packed');
        checkbox.classList.toggle('checked');
        checkbox.innerHTML = packed ? '<i class="fas fa-check"></i>' : '';
    }
}

function setupCategoryDropdown() {
    const categorySelect = document.getElementById('item-category');
    if (!categorySelect) return;

    categorySelect.addEventListener('change', function() {
        const newCategoryGroup = document.getElementById('new-category-group');
        if (this.value === 'new') {
            newCategoryGroup.style.display = 'block';
            document.getElementById('new-category').focus();
        } else {
            newCategoryGroup.style.display = 'none';
        }
    });
}

// Update all progress indicators
function updateAllProgress() {
    const total = document.querySelectorAll('.packing-item').length;
    const packed = document.querySelectorAll('.packing-item.packed').length;
    const percentage = total > 0 ? Math.round((packed / total) * 100) : 0;

    // Update main progress
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    const subtitle = document.querySelector('.widget-subtitle');

    if (progressFill) progressFill.style.width = percentage + '%';
    if (progressText) progressText.textContent = `${packed} / ${total} items packed`;
    if (subtitle) subtitle.textContent = `${packed} of ${total} items packed (${percentage}% complete)`;

    // Update category progress
    document.querySelectorAll('.packing-category').forEach(category => {
        const categoryItems = category.querySelectorAll('.packing-item');
        const categoryPacked = category.querySelectorAll('.packing-item.packed');
        const categorySubtitle = category.querySelector('.category-subtitle');

        if (categorySubtitle) {
            categorySubtitle.textContent = `${categoryPacked.length} / ${categoryItems.length} packed`;
        }

        // Add completed class if all packed
        if (categoryItems.length > 0 && categoryPacked.length === categoryItems.length) {
            category.classList.add('completed');
        } else {
            category.classList.remove('completed');
        }
    });

    console.log(`Progress: ${packed}/${total} (${percentage}%)`);
}

// Notification System
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Add to page
    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);

    // Auto-hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // ESC key to close modals
        if (e.key === 'Escape') {
            closeModal();
        }

        // Ctrl/Cmd + N to add new item
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            if (!document.querySelector('.modal.active')) {
                e.preventDefault();
                openAddItemModal();
            }
        }

        // Space to toggle first unpacked item (if no modals open)
        if (e.key === ' ' && !e.target.matches('input, textarea, select, button') && !document.querySelector('.modal.active')) {
            e.preventDefault();
            const firstUnpacked = document.querySelector('.packing-item:not(.packed)');
            if (firstUnpacked) {
                const itemId = parseInt(firstUnpacked.dataset.itemId);
                toggleItemPacked(itemId);
            }
        }
    });
}

// Export functions for testing or external use
window.PackingModule = {
    toggleItemPacked,
    toggleCategoryPacked,
    openAddItemModal,
    editItem,
    deleteItem,
    updateAllProgress
};

console.log('Compact packing JS loaded! 🎒✨');