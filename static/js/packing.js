// BULLETPROOF PACKING JS - ZERO LAYOUT IMPACT
document.addEventListener('DOMContentLoaded', function() {
    console.log('HERA Packing loaded - Rock solid edition');
    initializePage();
});

function initializePage() {
    updateAllProgress();
    console.log('Packing page ready - No layout shifts guaranteed');
}

// Toggle item packed status
function toggleItemPacked(itemId) {
    const item = document.querySelector(`[data-item-id="${itemId}"]`);
    const checkbox = item?.querySelector('.packing-checkbox');

    if (!item || !checkbox) {
        console.error('Item not found:', itemId);
        return;
    }

    // Simple loading state - just opacity, no size changes
    item.style.opacity = '0.6';

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

            // Success flash animation (no layout change)
            item.classList.add('packed-animation');
            setTimeout(() => item.classList.remove('packed-animation'), 800);

            updateAllProgress();
        }
    })
    .catch(error => {
        console.error('Toggle failed:', error);
        alert('Failed to update item');
    })
    .finally(() => {
        item.style.opacity = '';
    });
}

// Mark all items as packed
function markAllPacked() {
    const unpacked = document.querySelectorAll('.packing-item:not(.packed)');

    if (unpacked.length === 0) {
        alert('All items are already packed! 🎉');
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

    if (confirm(`${action} all ${targets.length} items in ${category}?`)) {
        targets.forEach((item, index) => {
            const itemId = parseInt(item.dataset.itemId);
            setTimeout(() => toggleItemPacked(itemId), index * 150);
        });
    }
}

// Open add item modal
function openAddItemModal(category = 'Essential') {
    const modal = document.getElementById('add-item-modal');
    const categorySelect = document.getElementById('item-category');
    const form = document.getElementById('add-item-form');

    if (modal && categorySelect && form) {
        form.reset();
        categorySelect.value = category;
        modal.classList.add('active');

        // Focus first input
        setTimeout(() => {
            const nameInput = document.getElementById('item-name');
            if (nameInput) nameInput.focus();
        }, 100);
    }
}

// Edit item
function editItem(itemId, itemName) {
    const modal = document.getElementById('edit-item-modal');
    const idInput = document.getElementById('edit-item-id');
    const nameInput = document.getElementById('edit-item-name');

    if (modal && idInput && nameInput) {
        idInput.value = itemId;
        nameInput.value = itemName;
        modal.classList.add('active');

        setTimeout(() => nameInput.focus(), 100);
    }
}

// Delete item
function deleteItem(itemId, itemName) {
    if (!confirm(`Delete "${itemName}"?\n\nThis cannot be undone.`)) return;

    const item = document.querySelector(`[data-item-id="${itemId}"]`);
    if (item) item.style.opacity = '0.3';

    fetch(`/api/packing/delete/${itemId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Simple fade out and remove
            if (item) {
                item.style.transition = 'opacity 0.3s ease';
                item.style.opacity = '0';
                setTimeout(() => {
                    item.remove();
                    updateAllProgress();
                }, 300);
            }
        } else {
            throw new Error('Delete failed');
        }
    })
    .catch(error => {
        console.error('Delete failed:', error);
        alert('Failed to delete item');
        if (item) item.style.opacity = '';
    });
}

// Handle add item form
function handleAddItem(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    const data = {
        item_name: formData.get('item').trim(),
        category: formData.get('category'),
        notes: formData.get('notes')?.trim() || ''
    };

    if (!data.item_name) {
        alert('Item name is required');
        return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Adding...';
    submitBtn.disabled = true;

    fetch('/api/packing/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            closeModal();
            alert('Item added! 🎉');
            setTimeout(() => window.location.reload(), 500);
        } else {
            throw new Error(data.error || 'Add failed');
        }
    })
    .catch(error => {
        console.error('Add failed:', error);
        alert('Failed to add item: ' + error.message);
    })
    .finally(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
}

// Handle edit item form
function handleEditItem(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    const itemId = formData.get('id');
    const newName = formData.get('item').trim();
    const newNotes = formData.get('notes')?.trim() || '';

    if (!newName) {
        alert('Item name is required');
        return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Updating...';
    submitBtn.disabled = true;

    fetch('/api/packing/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: parseInt(itemId),
            field: 'item',
            value: newName,
            notes: newNotes
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update DOM immediately
            const item = document.querySelector(`[data-item-id="${itemId}"]`);
            if (item) {
                const nameEl = item.querySelector('.packing-name');
                const notesEl = item.querySelector('.packing-notes');

                if (nameEl) nameEl.textContent = newName;

                if (newNotes) {
                    if (notesEl) {
                        notesEl.textContent = newNotes;
                    } else {
                        const contentDiv = item.querySelector('.packing-content');
                        const notesDiv = document.createElement('div');
                        notesDiv.className = 'packing-notes';
                        notesDiv.textContent = newNotes;
                        contentDiv.appendChild(notesDiv);
                    }
                } else if (notesEl) {
                    notesEl.remove();
                }
            }

            closeModal();
            alert('Item updated! ✓');
        } else {
            throw new Error(data.error || 'Update failed');
        }
    })
    .catch(error => {
        console.error('Update failed:', error);
        alert('Failed to update: ' + error.message);
    })
    .finally(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
}

// Close modal
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

// ESC key to close modals
document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeModal();
});

console.log('Bulletproof packing JS loaded! 🎒');