// Packing.js - Matching HERA Dashboard Design System

document.addEventListener('DOMContentLoaded', function() {
    console.log('HERA Packing loaded - Compact edition');
    initializePage();
});

function initializePage() {
    setupCategoryDropdown();
    updateAllProgress();
    console.log('Packing page ready - Compact and stable');
}

// Toggle individual item packed status
function toggleItemPacked(itemId) {
    const item = document.querySelector(`[data-item-id="${itemId}"]`);
    const checkbox = item?.querySelector('.packing-checkbox');

    if (!item || !checkbox) {
        console.error('Item not found:', itemId);
        return;
    }

    // Simple loading state - just opacity, no size changes
    item.style.opacity = '0.7';

    // Simulate API call
    setTimeout(() => {
        try {
            const isPacked = item.classList.contains('packed');

            if (isPacked) {
                // Unpack item
                item.classList.remove('packed');
                checkbox.classList.remove('checked');
                checkbox.innerHTML = '';
                showNotification('Item unpacked', 'info');
            } else {
                // Pack item
                item.classList.add('packed');
                checkbox.classList.add('checked');
                checkbox.innerHTML = '<i class="fas fa-check"></i>';
                showNotification('Item packed!', 'success');
            }

            // Success flash animation (no layout change)
            item.classList.add('packed-animation');
            setTimeout(() => item.classList.remove('packed-animation'), 800);

            updateAllProgress();
        } catch (error) {
            console.error('Toggle failed:', error);
            showNotification('Failed to update item', 'error');
        } finally {
            item.style.opacity = '';
        }
    }, 300);

    /* Real API implementation would be:
    fetch(`/api/packing/${itemId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update UI based on packed state
            if (data.packed) {
                item.classList.add('packed');
                checkbox.classList.add('checked');
                checkbox.innerHTML = '<i class="fas fa-check"></i>';
            } else {
                item.classList.remove('packed');
                checkbox.classList.remove('checked');
                checkbox.innerHTML = '';
            }
            updateAllProgress();
        }
    })
    .catch(error => {
        console.error('Toggle failed:', error);
        showNotification('Failed to update item', 'error');
    })
    .finally(() => {
        item.style.opacity = '';
    });
    */
}

// Mark all items as packed
function markAllPacked() {
    const unpacked = document.querySelectorAll('.packing-item:not(.packed)');

    if (unpacked.length === 0) {
        showNotification('All items are already packed! 🎉', 'success');
        return;
    }

    if (confirm(`Pack all ${unpacked.length} remaining items?`)) {
        unpacked.forEach((item, index) => {
            const itemId = parseInt(item.dataset.itemId);
            setTimeout(() => toggleItemPacked(itemId), index * 100);
        });
    }
}

// Toggle all items in a category
function toggleCategoryPacked(category) {
    const categoryDiv = document.querySelector(`[data-category="${category}"]`);
    const items = categoryDiv?.querySelectorAll('.packing-item');
    const unpacked = categoryDiv?.querySelectorAll('.packing-item:not(.packed)');

    if (!items || items.length === 0) return;

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

// Modal Management
function openAddItemModal(defaultCategory = '') {
    const modal = document.getElementById('add-item-modal');
    const categorySelect = document.getElementById('item-category');

    // Reset form
    document.getElementById('item-name').value = '';
    document.getElementById('item-notes').value = '';
    document.getElementById('item-packed').checked = false;
    document.getElementById('new-category').value = '';
    document.getElementById('new-category-group').style.display = 'none';

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
    if (!item) return;

    const modal = document.getElementById('edit-item-modal');
    const name = item.querySelector('.packing-name').textContent.trim();
    const notes = item.querySelector('.packing-notes')?.textContent.trim() || '';
    const packed = item.classList.contains('packed');
    const category = item.closest('.packing-category')?.dataset.category || '';

    // Populate form
    document.getElementById('edit-item-id').value = itemId;
    document.getElementById('edit-item-name').value = name;
    document.getElementById('edit-item-notes').value = notes;
    document.getElementById('edit-item-packed').checked = packed;
    document.getElementById('edit-item-category').value = category;

    modal.classList.add('active');

    // Focus first input
    setTimeout(() => {
        document.getElementById('edit-item-name').focus();
        document.getElementById('edit-item-name').select();
    }, 100);
}

function deleteItem(itemId) {
    const item = document.querySelector(`[data-item-id="${itemId}"]`);
    if (!item) return;

    const itemName = item.querySelector('.packing-name').textContent.trim();

    if (confirm(`Delete "${itemName}" from packing list?`)) {
        // Fade out animation
        item.style.opacity = '0';
        item.style.transform = 'scale(0.95)';

        setTimeout(() => {
            item.remove();
            updateAllProgress();
            showNotification('Item deleted', 'info');
        }, 300);

        // Real implementation would call API
        /*
        fetch(`/api/packing/${itemId}/delete`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                item.remove();
                updateAllProgress();
                showNotification('Item deleted', 'info');
            } else {
                showNotification('Failed to delete item', 'error');
                item.style.opacity = '';
                item.style.transform = '';
            }
        });
        */
    }
}

// Form Submissions
function addNewItem(event) {
    event.preventDefault();

    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    // Get form data
    const itemName = document.getElementById('item-name').value.trim();
    const category = document.getElementById('item-category').value;
    const newCategory = document.getElementById('new-category').value.trim();
    const notes = document.getElementById('item-notes').value.trim();
    const packed = document.getElementById('item-packed').checked;

    // Validation
    if (!itemName) {
        showNotification('Item name is required', 'error');
        document.getElementById('item-name').focus();
        return;
    }

    if (category === 'new' && !newCategory) {
        showNotification('New category name is required', 'error');
        document.getElementById('new-category').focus();
        return;
    }

    // Show loading state
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    submitBtn.disabled = true;

    const finalCategory = category === 'new' ? newCategory : category;

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

function saveItemChanges(event) {
    event.preventDefault();

    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    const itemId = document.getElementById('edit-item-id').value;
    const name = document.getElementById('edit-item-name').value.trim();
    const category = document.getElementById('edit-item-category').value;
    const notes = document.getElementById('edit-item-notes').value.trim();
    const packed = document.getElementById('edit-item-packed').checked;

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
            updateItemElement(itemId, name, category, notes, packed);
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

// Helper Functions
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
            <div class="packing-items"></div>
        </div>
    `;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = categoryHTML;
    return tempDiv.firstElementChild;
}

function updateItemElement(itemId, name, category, notes, packed) {
    const item = document.querySelector(`[data-item-id="${itemId}"]`);
    if (!item) return;

    // Update item content
    item.querySelector('.packing-name').textContent = name;

    // Update notes
    const existingNotes = item.querySelector('.packing-notes');
    if (notes) {
        if (existingNotes) {
            existingNotes.textContent = notes;
        } else {
            const notesHTML = `<div class="packing-notes">${notes}</div>`;
            item.querySelector('.packing-content').insertAdjacentHTML('beforeend', notesHTML);
        }
    } else if (existingNotes) {
        existingNotes.remove();
    }

    // Update packed status
    const checkbox = item.querySelector('.packing-checkbox');
    if (packed) {
        item.classList.add('packed');
        checkbox.classList.add('checked');
        checkbox.innerHTML = '<i class="fas fa-check"></i>';
    } else {
        item.classList.remove('packed');
        checkbox.classList.remove('checked');
        checkbox.innerHTML = '';
    }

    // Move to different category if needed
    const currentCategory = item.closest('.packing-category').dataset.category;
    if (category !== currentCategory) {
        // Find target category
        let targetCategory = document.querySelector(`[data-category="${category}"]`);
        if (!targetCategory) {
            targetCategory = createNewCategory(category);
            document.querySelector('.packing-grid').appendChild(targetCategory);
        }

        // Remove empty state in target
        const emptyState = targetCategory.querySelector('.empty-category');
        if (emptyState) {
            emptyState.remove();
        }

        // Move item
        targetCategory.querySelector('.packing-items').appendChild(item);
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

function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => modal.classList.remove('active'));
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

// Export functions for testing or external use
window.PackingModule = {
    toggleItemPacked,
    markAllPacked,
    toggleCategoryPacked,
    openAddItemModal,
    editItem,
    deleteItem,
    updateAllProgress
};

console.log('Compact packing JS loaded! 🎒✨');