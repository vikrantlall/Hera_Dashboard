// Packing Page JavaScript with Interactive Checklist

document.addEventListener('DOMContentLoaded', function() {
    initializePackingPage();
    initializeInlineEditing();
    initializeChecklistInteractions();
    initializeFiltering();
    initializeModals();
    initializeQuickAdd();
    setupAutoSave();
});

let currentEditingElement = null;
let originalValue = null;
let packingItems = [];

function initializePackingPage() {
    // Load packing items data
    loadPackingItems();
    
    // Setup packing-specific features
    setupPackingAnimations();
    setupPackingItems();
    updatePackingProgress();
    updatePackingInsights();
    
    // Initialize category toggles
    initializeCategoryToggles();
}

function loadPackingItems() {
    const itemElements = document.querySelectorAll('.packing-item');
    packingItems = [];
    
    itemElements.forEach(item => {
        const itemId = item.dataset.itemId;
        const nameElement = item.querySelector('.editable-text[data-field="item"]');
        const checkbox = item.querySelector('.item-checkbox');
        
        if (itemId && nameElement && checkbox) {
            packingItems.push({
                id: itemId,
                name: nameElement.textContent.trim(),
                packed: checkbox.checked,
                priority: item.dataset.priority,
                element: item
            });
        }
    });
}

function setupPackingItems() {
    const packingItemElements = document.querySelectorAll('.packing-item');
    
    packingItemElements.forEach(item => {
        const itemId = item.dataset.itemId;
        
        // Checkbox change
        const checkbox = item.querySelector('.item-checkbox');
        if (checkbox) {
            checkbox.addEventListener('change', function() {
                togglePackingItem(itemId, this.checked);
            });
        }
        
        // Priority select change
        const prioritySelect = item.querySelector('.priority-select');
        if (prioritySelect) {
            prioritySelect.addEventListener('change', function() {
                updatePackingItem(itemId, { priority: this.value });
                updateItemPriorityAppearance(item, this.value);
                updatePackingInsights();
            });
        }
        
        // Menu toggle
        const menuToggle = item.querySelector('.menu-toggle');
        const menu = item.querySelector('.action-menu');
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
                const itemName = item.querySelector('.editable-text[data-field="item"]').textContent;
                showDeleteModal(itemId, itemName);
                menu.classList.remove('active');
            });
        }
        
        // Add hover effects
        item.addEventListener('mouseenter', function() {
            if (!this.classList.contains('loading')) {
                this.style.transform = 'translateY(-1px)';
            }
        });
        
        item.addEventListener('mouseleave', function() {
            if (!this.classList.contains('loading')) {
                this.style.transform = '';
            }
        });
    });
    
    // Close menus when clicking outside
    document.addEventListener('click', closeAllMenus);
}

function initializeChecklistInteractions() {
    // Add click animation to checkboxes
    const checkboxes = document.querySelectorAll('.item-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const item = this.closest('.packing-item');
            if (this.checked) {
                item.classList.add('packing-complete');
                setTimeout(() => {
                    item.classList.remove('packing-complete');
                }, 500);
            }
        });
    });
}

function togglePackingItem(itemId, packed) {
    const item = document.querySelector(`[data-item-id="${itemId}"]`);
    
    if (item) {
        item.classList.add('loading');
        
        // Call the toggle API endpoint
        utils.ajax(`/api/packing/toggle/${itemId}`, {
            method: 'PUT'
        })
        .then(response => {
            if (response.success) {
                item.classList.remove('loading');
                item.dataset.packed = packed.toString();
                
                // Update visual indicators
                const status = item.querySelector('.item-status');
                if (status) {
                    if (packed) {
                        status.innerHTML = `
                            <div class="packed-indicator">
                                <i class="fas fa-check-circle"></i>
                                <span>Packed</span>
                            </div>
                        `;
                    } else {
                        status.innerHTML = `
                            <div class="unpacked-indicator">
                                <i class="fas fa-circle"></i>
                                <span>To Pack</span>
                            </div>
                        `;
                    }
                }
                
                // Update local data
                const packingItem = packingItems.find(p => p.id === itemId);
                if (packingItem) {
                    packingItem.packed = packed;
                }
                
                updatePackingProgress();
                updatePackingInsights();
                
                utils.showNotification(
                    packed ? 'Item marked as packed' : 'Item marked as unpacked', 
                    'success'
                );
            } else {
                throw new Error(response.error || 'Failed to update packing status');
            }
        })
        .catch(error => {
            item.classList.remove('loading');
            // Revert checkbox state
            const checkbox = item.querySelector('.item-checkbox');
            if (checkbox) {
                checkbox.checked = !packed;
            }
            utils.showNotification('Failed to update packing status', 'error');
        });
    }
}

function initializeInlineEditing() {
    const editableElements = document.querySelectorAll('.editable-text, .editable-textarea, .editable-number');
    
    editableElements.forEach(element => {
        element.addEventListener('click', function() {
            if (currentEditingElement && currentEditingElement !== this) {
                cancelEdit();
            }
            startEdit(this);
        });
        
        element.addEventListener('blur', function() {
            if (this === currentEditingElement) {
                setTimeout(() => {
                    if (document.activeElement !== this) {
                        saveEdit();
                    }
                }, 100);
            }
        });
        
        element.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey && !this.classList.contains('editable-textarea')) {
                e.preventDefault();
                saveEdit();
            } else if (e.key === 'Escape') {
                cancelEdit();
            }
        });
        
        // Add hover effects
        element.addEventListener('mouseenter', function() {
            if (!this.classList.contains('editing')) {
                this.style.background = 'rgba(212, 175, 55, 0.1)';
            }
        });
        
        element.addEventListener('mouseleave', function() {
            if (!this.classList.contains('editing')) {
                this.style.background = '';
            }
        });
    });
}

function startEdit(element) {
    if (currentEditingElement) return;
    
    currentEditingElement = element;
    originalValue = element.textContent.trim();
    
    element.classList.add('editing');
    element.style.background = '';
    
    if (element.classList.contains('editable-textarea')) {
        element.contentEditable = true;
        element.style.minHeight = '60px';
    } else {
        element.contentEditable = true;
    }
    
    element.focus();
    
    // Select all text
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    
    // Add edit indicator
    showEditIndicator(element);
}

function saveEdit() {
    if (!currentEditingElement) return;
    
    const newValue = currentEditingElement.textContent.trim();
    const field = currentEditingElement.dataset.field;
    const packingItem = currentEditingElement.closest('.packing-item');
    const itemId = packingItem.dataset.itemId;
    
    if (newValue !== originalValue) {
        // Validate input
        if (field === 'item' && !newValue) {
            utils.showNotification('Item name cannot be empty', 'error');
            cancelEdit();
            return;
        }
        
        if (field === 'quantity') {
            const numValue = parseInt(newValue);
            if (isNaN(numValue) || numValue < 1) {
                utils.showNotification('Quantity must be a positive number', 'error');
                cancelEdit();
                return;
            }
        }
        
        // Show loading state
        packingItem.classList.add('saving');
        showLoadingIndicator(currentEditingElement);
        
        // Prepare update data
        const updateData = {};
        if (field === 'quantity') {
            updateData[field] = parseInt(newValue);
        } else {
            updateData[field] = newValue;
        }
        
        // Send update to server
        updatePackingItem(itemId, updateData)
            .then(() => {
                packingItem.classList.remove('saving');
                packingItem.classList.add('saved');
                hideLoadingIndicator(currentEditingElement);
                showSuccessIndicator(currentEditingElement);
                
                setTimeout(() => packingItem.classList.remove('saved'), 2000);
                
                // Update local data
                const item = packingItems.find(p => p.id === itemId);
                if (item && field === 'item') {
                    item.name = newValue;
                }
                
                updatePackingInsights();
                utils.showNotification('Packing item updated successfully', 'success');
            })
            .catch(error => {
                packingItem.classList.remove('saving');
                packingItem.classList.add('error');
                hideLoadingIndicator(currentEditingElement);
                showErrorIndicator(currentEditingElement);
                
                setTimeout(() => packingItem.classList.remove('error'), 2000);
                
                currentEditingElement.textContent = originalValue;
                utils.showNotification('Failed to update packing item', 'error');
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
        currentEditingElement.style.minHeight = '';
        
        hideEditIndicator(currentEditingElement);
        
        currentEditingElement = null;
        originalValue = null;
    }
}

function updatePackingItem(itemId, data) {
    return utils.ajax(`/api/packing/${itemId}`, {
        method: 'PUT',
        data: data
    });
}

function enableEditMode(packingItem) {
    const editableElements = packingItem.querySelectorAll('.editable-text, .editable-textarea, .editable-number');
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

function updateItemPriorityAppearance(item, priority) {
    // Update priority badge
    const priorityBadge = item.querySelector('.priority-badge');
    if (priorityBadge) {
        priorityBadge.className = `priority-badge priority-${priority.toLowerCase()}`;
        
        let icon = 'fas fa-minus';
        if (priority === 'High') icon = 'fas fa-exclamation';
        else if (priority === 'Medium') icon = 'fas fa-circle';
        
        priorityBadge.innerHTML = `<i class="${icon}"></i> ${priority}`;
    }
    
    // Update item border
    item.className = item.className.replace(/priority-\w+/, '');
    item.dataset.priority = priority.toLowerCase();
    item.classList.add(`priority-${priority.toLowerCase()}`);
    
    // Add animation for priority change
    item.style.transform = 'scale(1.02)';
    setTimeout(() => {
        item.style.transform = '';
    }, 200);
}

function initializeFiltering() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const packingItemElements = document.querySelectorAll('.packing-item');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active filter button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.dataset.filter;
            
            // Filter packing items
            packingItemElements.forEach(item => {
                const isPacked = item.dataset.packed === 'true';
                const priority = item.dataset.priority;
                
                if (filter === 'all') {
                    item.classList.remove('filtered-out');
                } else if (filter === 'packed' && isPacked) {
                    item.classList.remove('filtered-out');
                } else if (filter === 'unpacked' && !isPacked) {
                    item.classList.remove('filtered-out');
                } else if (filter === 'high' && priority === 'high') {
                    item.classList.remove('filtered-out');
                } else {
                    item.classList.add('filtered-out');
                }
            });
            
            // Update filter counts
            updateFilterCounts();
        });
    });
}

function updateFilterCounts() {
    const visibleItems = document.querySelectorAll('.packing-item:not(.filtered-out)');
    const visibleCount = visibleItems.length;
    
    // Could add count badges to filter buttons here
}

function initializeCategoryToggles() {
    const categoryHeaders = document.querySelectorAll('.category-header');
    
    categoryHeaders.forEach(header => {
        const toggle = header.querySelector('.category-toggle');
        const categoryName = header.querySelector('.category-title').textContent;
        const items = document.querySelector(`[data-category="${categoryName.toLowerCase().replace(' ', '-')}"]`);
        
        if (toggle && items) {
            toggle.addEventListener('click', function() {
                const isExpanded = !items.classList.contains('collapsed');
                
                if (isExpanded) {
                    items.classList.add('collapsed');
                    toggle.classList.remove('expanded');
                } else {
                    items.classList.remove('collapsed');
                    toggle.classList.add('expanded');
                }
            });
        }
    });
}

function initializeModals() {
    // Setup add packing item modal
    const addBtn = document.getElementById('add-packing-item');
    const addFirstBtn = document.getElementById('add-first-item');
    const addModal = document.getElementById('add-item-modal');
    const addForm = document.getElementById('add-item-form');
    
    if (addBtn && addModal && addForm) {
        addBtn.addEventListener('click', function() {
            addModal.classList.add('active');
            addForm.reset();
            
            // Focus on first input
            const firstInput = addForm.querySelector('select[name="category"]');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        });
        
        if (addFirstBtn) {
            addFirstBtn.addEventListener('click', function() {
                addModal.classList.add('active');
                addForm.reset();
            });
        }
        
        addForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addPackingItem();
        });
    }
    
    // Setup delete confirmation modal
    setupDeleteModal();
    
    // Setup modal close handlers
    setupModalCloseHandlers();
}

function addPackingItem() {
    const form = document.getElementById('add-item-form');
    const formData = new FormData(form);
    
    const data = {
        category: formData.get('category'),
        item: formData.get('item'),
        quantity: parseInt(formData.get('quantity')) || 1,
        priority: formData.get('priority') || 'Medium',
        notes: formData.get('notes') || '',
        packed: formData.get('packed') === 'on'
    };
    
    // Validate data
    if (!data.category.trim()) {
        utils.showNotification('Category is required', 'error');
        return;
    }
    
    if (!data.item.trim()) {
        utils.showNotification('Item name is required', 'error');
        return;
    }
    
    if (data.quantity < 1) {
        utils.showNotification('Quantity must be positive', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    submitBtn.disabled = true;
    
    // Add new packing item
    utils.ajax('/api/packing', {
        method: 'POST',
        data: data
    })
    .then(response => {
        if (response.success) {
            addPackingItemToDOM(response.item);
            updatePackingProgress();
            updatePackingInsights();
            document.getElementById('add-item-modal').classList.remove('active');
            utils.showNotification('Packing item added successfully', 'success');
        } else {
            throw new Error(response.error || 'Failed to add packing item');
        }
    })
    .catch(error => {
        utils.showNotification('Failed to add packing item', 'error');
    })
    .finally(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
}

function addPackingItemToDOM(item) {
    const categoriesContainer = document.getElementById('packing-categories');
    const emptyState = categoriesContainer.querySelector('.empty-state');
    
    // Remove empty state if it exists
    if (emptyState) {
        emptyState.remove();
    }
    
    // Find or create category section
    let categorySection = findOrCreateCategorySection(item.category);
    const categoryItems = categorySection.querySelector('.category-items');
    
    const newItemHTML = createPackingItemHTML(item);
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = newItemHTML;
    const newItemElement = tempDiv.firstChild;
    
    newItemElement.classList.add('new-packing-item');
    categoryItems.appendChild(newItemElement);
    
    // Add to packing items array
    packingItems.push({
        id: item.id,
        name: item.item,
        packed: item.packed,
        priority: item.priority.toLowerCase(),
        element: newItemElement
    });
    
    // Setup event listeners for new item
    setupPackingItems();
    initializeInlineEditing();
    initializeChecklistInteractions();
    
    // Scroll to new item
    newItemElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Remove new item class after animation
    setTimeout(() => {
        newItemElement.classList.remove('new-packing-item');
    }, 1000);
}

function findOrCreateCategorySection(categoryName) {
    const categoryKey = categoryName.toLowerCase().replace(' ', '-');
    let categorySection = document.querySelector(`[data-category="${categoryKey}"]`);
    
    if (!categorySection) {
        // Create new category section
        const categoriesContainer = document.getElementById('packing-categories');
        const categoryHTML = createCategorySectionHTML(categoryName);
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = categoryHTML;
        categorySection = tempDiv.firstChild;
        
        categoriesContainer.appendChild(categorySection);
        initializeCategoryToggles();
    }
    
    return categorySection;
}

function createCategorySectionHTML(categoryName) {
    const categoryKey = categoryName.toLowerCase().replace(' ', '-');
    const icon = getCategoryIcon(categoryName);
    
    return `
        <div class="category-section" data-category="${categoryKey}">
            <div class="category-header">
                <div class="category-icon">
                    <i class="fas fa-${icon}"></i>
                </div>
                
                <div class="category-info">
                    <h3 class="category-title">${categoryName}</h3>
                    <div class="category-progress">0/0 packed</div>
                </div>
                
                <div class="category-actions">
                    <button class="category-toggle expanded" data-category="${categoryKey}">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                </div>
            </div>
            
            <div class="category-items" data-category="${categoryKey}">
            </div>
        </div>
    `;
}

function getCategoryIcon(categoryName) {
    switch (categoryName.toLowerCase()) {
        case 'clothing': return 'tshirt';
        case 'electronics': return 'laptop';
        case 'toiletries': return 'pump-soap';
        case 'documents': return 'passport';
        case 'accessories': return 'watch';
        case 'proposal': return 'gem';
        default: return 'box';
    }
}

function createPackingItemHTML(item) {
    const priorityIcon = item.priority === 'High' ? 'exclamation' : item.priority === 'Medium' ? 'circle' : 'minus';
    
    return `
        <div class="packing-item" data-item-id="${item.id}" data-priority="${item.priority.toLowerCase()}" data-packed="${item.packed}">
            <div class="item-checkbox-section">
                <label class="checkbox-container">
                    <input type="checkbox" class="item-checkbox" ${item.packed ? 'checked' : ''}>
                    <span class="checkmark"></span>
                </label>
            </div>
            
            <div class="item-content">
                <div class="item-header">
                    <div class="item-info">
                        <h4 class="item-name">
                            <span class="editable-text" data-field="item">${item.item}</span>
                            ${item.quantity > 1 ? `<span class="item-quantity">x<span class="editable-number" data-field="quantity">${item.quantity}</span></span>` : ''}
                        </h4>
                        
                        <div class="item-meta">
                            <div class="priority-badge priority-${item.priority.toLowerCase()}">
                                <i class="fas fa-${priorityIcon}"></i>
                                ${item.priority}
                            </div>
                        </div>
                    </div>
                    
                    <div class="item-actions">
                        <div class="priority-selector">
                            <select class="priority-select" data-field="priority">
                                <option value="High" ${item.priority === 'High' ? 'selected' : ''}>High</option>
                                <option value="Medium" ${item.priority === 'Medium' ? 'selected' : ''}>Medium</option>
                                <option value="Low" ${item.priority === 'Low' ? 'selected' : ''}>Low</option>
                            </select>
                        </div>
                        
                        <div class="action-menu">
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
                
                ${item.notes ? `
                <div class="item-notes">
                    <div class="notes-content">
                        <div class="editable-textarea" data-field="notes" data-placeholder="Add notes about this item...">${item.notes}</div>
                    </div>
                </div>
                ` : ''}
            </div>
            
            <div class="item-status">
                ${item.packed ? `
                    <div class="packed-indicator">
                        <i class="fas fa-check-circle"></i>
                        <span>Packed</span>
                    </div>
                ` : `
                    <div class="unpacked-indicator">
                        <i class="fas fa-circle"></i>
                        <span>To Pack</span>
                    </div>
                `}
            </div>
        </div>
    `;
}

function initializeQuickAdd() {
    const quickItems = document.querySelectorAll('.quick-item');
    
    quickItems.forEach(item => {
        item.addEventListener('click', function() {
            const itemName = this.dataset.item;
            const priority = this.dataset.priority || 'Medium';
            const category = this.closest('.quick-category').dataset.category;
            
            // Quick add the item
            const data = {
                category: category,
                item: itemName,
                quantity: 1,
                priority: priority,
                notes: '',
                packed: false
            };
            
            // Show loading state
            this.style.opacity = '0.6';
            this.style.pointerEvents = 'none';
            
            utils.ajax('/api/packing', {
                method: 'POST',
                data: data
            })
            .then(response => {
                if (response.success) {
                    addPackingItemToDOM(response.item);
                    updatePackingProgress();
                    updatePackingInsights();
                    utils.showNotification(`${itemName} added to packing list`, 'success');
                } else {
                    throw new Error(response.error || 'Failed to add item');
                }
            })
            .catch(error => {
                utils.showNotification(`Failed to add ${itemName}`, 'error');
            })
            .finally(() => {
                this.style.opacity = '';
                this.style.pointerEvents = '';
            });
        });
    });
}

function setupDeleteModal() {
    const deleteModal = document.getElementById('delete-item-modal');
    const confirmBtn = document.getElementById('confirm-delete-item');
    
    let itemToDelete = null;
    
    window.showDeleteModal = function(itemId, itemName) {
        itemToDelete = itemId;
        deleteModal.classList.add('active');
        
        // Update modal content if needed
        const modalBody = deleteModal.querySelector('.modal-body p');
        if (modalBody) {
            modalBody.textContent = `Are you sure you want to delete "${itemName}" from your packing list? This action cannot be undone.`;
        }
    };
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            if (itemToDelete) {
                deletePackingItem(itemToDelete);
            }
        });
    }
}

function deletePackingItem(itemId) {
    const packingItem = document.querySelector(`[data-item-id="${itemId}"]`);
    
    if (packingItem) {
        packingItem.classList.add('loading');
        
        utils.ajax(`/api/packing/${itemId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.success) {
                // Animate removal
                packingItem.style.transform = 'translateX(-100%)';
                packingItem.style.opacity = '0';
                
                setTimeout(() => {
                    const categoryItems = packingItem.closest('.category-items');
                    packingItem.remove();
                    
                    // Remove from packing items array
                    packingItems = packingItems.filter(p => p.id !== itemId);
                    
                    // Update category progress
                    updateCategoryProgress(categoryItems);
                    
                    // Check if category is now empty
                    const remainingItems = categoryItems.querySelectorAll('.packing-item');
                    if (remainingItems.length === 0) {
                        const categorySection = categoryItems.closest('.category-section');
                        categorySection.remove();
                    }
                    
                    updatePackingProgress();
                    updatePackingInsights();
                    
                    // Show empty state if no items left
                    const allItems = document.querySelectorAll('.packing-item');
                    if (allItems.length === 0) {
                        showEmptyState();
                    }
                }, 300);
                
                document.getElementById('delete-item-modal').classList.remove('active');
                utils.showNotification('Packing item deleted successfully', 'success');
            } else {
                throw new Error(response.error || 'Failed to delete packing item');
            }
        })
        .catch(error => {
            packingItem.classList.remove('loading');
            utils.showNotification('Failed to delete packing item', 'error');
        });
    }
}

function showEmptyState() {
    const categoriesContainer = document.getElementById('packing-categories');
    const emptyStateHTML = `
        <div class="empty-state">
            <div class="empty-icon">
                <i class="fas fa-suitcase"></i>
            </div>
            <h3>No Packing Items Yet</h3>
            <p>Start building your packing checklist for the perfect proposal trip</p>
            <button class="btn btn-primary" id="add-first-item">
                <i class="fas fa-plus"></i>
                Add First Item
            </button>
        </div>
    `;
    categoriesContainer.innerHTML = emptyStateHTML;
    
    // Re-initialize the add first item button
    initializeModals();
}

function updatePackingProgress() {
    const allItems = document.querySelectorAll('.packing-item');
    const packedItems = document.querySelectorAll('.packing-item[data-packed="true"]');
    
    const totalItems = allItems.length;
    const packedCount = packedItems.length;
    const progress = totalItems > 0 ? (packedCount / totalItems * 100) : 0;
    
    // Update progress displays
    const progressFill = document.querySelector('.progress-bar .progress-fill');
    const progressPercentage = document.querySelector('.progress-percentage');
    const packedStat = document.querySelector('.stat-number');
    const totalStat = document.querySelectorAll('.stat-number')[1];
    
    if (progressFill) progressFill.style.width = `${progress}%`;
    if (progressPercentage) progressPercentage.textContent = `${Math.round(progress)}%`;
    if (packedStat) packedStat.textContent = packedCount;
    if (totalStat) totalStat.textContent = totalItems;
    
    // Update category progress
    document.querySelectorAll('.category-items').forEach(categoryItems => {
        updateCategoryProgress(categoryItems);
    });
}

function updateCategoryProgress(categoryItems) {
    const categorySection = categoryItems.closest('.category-section');
    const categoryProgress = categorySection.querySelector('.category-progress');
    
    const items = categoryItems.querySelectorAll('.packing-item');
    const packedItems = categoryItems.querySelectorAll('.packing-item[data-packed="true"]');
    
    if (categoryProgress) {
        categoryProgress.textContent = `${packedItems.length}/${items.length} packed`;
    }
}

function updatePackingInsights() {
    const allItems = document.querySelectorAll('.packing-item');
    const highPriorityItems = document.querySelectorAll('.packing-item[data-priority="high"]');
    const unpackedItems = document.querySelectorAll('.packing-item[data-packed="false"]');
    const categories = document.querySelectorAll('.category-section');
    
    const totalItems = allItems.length;
    const packedItems = document.querySelectorAll('.packing-item[data-packed="true"]');
    const progress = totalItems > 0 ? (packedItems.length / totalItems * 100) : 0;
    
    // Update insight displays
    const insightNumbers = document.querySelectorAll('.insight-number');
    if (insightNumbers.length >= 4) {
        insightNumbers[0].textContent = highPriorityItems.length;
        insightNumbers[1].textContent = categories.length;
        insightNumbers[2].textContent = unpackedItems.length;
        insightNumbers[3].textContent = `${Math.round(progress)}%`;
    }
}

function setupModalCloseHandlers() {
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

function setupPackingAnimations() {
    // Add entrance animations to category sections
    const categorySections = document.querySelectorAll('.category-section');
    categorySections.forEach((section, index) => {
        section.style.animationDelay = `${index * 0.1}s`;
    });
    
    // Add hover effects to insight cards
    const insightItems = document.querySelectorAll('.insight-item');
    insightItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px) scale(1.05)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
}

function setupAutoSave() {
    let autoSaveTimeout;
    
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('editable-text') || 
            e.target.classList.contains('editable-textarea') ||
            e.target.classList.contains('editable-number')) {
            
            clearTimeout(autoSaveTimeout);
            autoSaveTimeout = setTimeout(() => {
                if (currentEditingElement === e.target) {
                    saveEdit();
                }
            }, 3000); // Auto-save after 3 seconds of inactivity
        }
    });
}

function closeAllMenus() {
    const activeMenus = document.querySelectorAll('.action-menu.active');
    activeMenus.forEach(menu => {
        menu.classList.remove('active');
    });
}

function showEditIndicator(element) {
    const indicator = document.createElement('div');
    indicator.className = 'edit-indicator';
    indicator.innerHTML = '<i class="fas fa-edit"></i>';
    indicator.style.cssText = `
        position: absolute;
        top: -10px;
        right: -10px;
        background: var(--accent-gold);
        color: var(--primary-dark);
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.7rem;
        z-index: 10;
    `;
    element.style.position = 'relative';
    element.appendChild(indicator);
}

function hideEditIndicator(element) {
    const indicator = element.querySelector('.edit-indicator');
    if (indicator) {
        indicator.remove();
    }
}

function showLoadingIndicator(element) {
    element.classList.add('loading');
    const indicator = document.createElement('div');
    indicator.className = 'loading-indicator';
    indicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    indicator.style.cssText = `
        position: absolute;
        top: 50%;
        right: -25px;
        transform: translateY(-50%);
        color: var(--accent-gold);
        z-index: 10;
    `;
    element.style.position = 'relative';
    element.appendChild(indicator);
}

function hideLoadingIndicator(element) {
    element.classList.remove('loading');
    const indicator = element.querySelector('.loading-indicator');
    if (indicator) {
        indicator.remove();
    }
}

function showSuccessIndicator(element) {
    element.classList.add('success');
    const indicator = document.createElement('div');
    indicator.className = 'success-indicator';
    indicator.innerHTML = '<i class="fas fa-check"></i>';
    indicator.style.cssText = `
        position: absolute;
        top: 50%;
        right: -25px;
        transform: translateY(-50%);
        color: var(--success);
        z-index: 10;
    `;
    element.style.position = 'relative';
    element.appendChild(indicator);
    
    setTimeout(() => {
        element.classList.remove('success');
        if (indicator.parentNode) {
            indicator.remove();
        }
    }, 2000);
}

function showErrorIndicator(element) {
    element.classList.add('error');
    setTimeout(() => {
        element.classList.remove('error');
    }, 2000);
}

// Export functions for external use
window.packingPageUtils = {
    updatePackingProgress,
    updatePackingInsights,
    addPackingItemToDOM,
    deletePackingItem,
    showDeleteModal,
    togglePackingItem
};