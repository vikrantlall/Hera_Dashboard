// Family Page JavaScript with Complete Inline Editing

document.addEventListener('DOMContentLoaded', function() {
    initializeFamilyPage();
    initializeInlineEditing();
    initializeFiltering();
    initializeModals();
    initializeStatusUpdates();
    setupAutoSave();
});

let currentEditingElement = null;
let originalValue = null;
let familyMembers = [];

function initializeFamilyPage() {
    // Load family members data
    loadFamilyMembers();
    
    // Setup family-specific features
    setupFamilyAnimations();
    setupMemberCards();
    updateFamilyInsights();
    
    // Initialize drag and drop for reordering
    initializeDragAndDrop();
}

function loadFamilyMembers() {
    const memberCards = document.querySelectorAll('.family-member-card');
    familyMembers = [];
    
    memberCards.forEach(card => {
        const memberId = card.dataset.memberId;
        const nameElement = card.querySelector('.editable-text[data-field="name"]');
        const statusSelect = card.querySelector('.status-select[data-field="status"]');
        
        if (memberId && nameElement && statusSelect) {
            familyMembers.push({
                id: memberId,
                name: nameElement.textContent.trim(),
                status: statusSelect.value,
                element: card
            });
        }
    });
}

function setupMemberCards() {
    const memberCards = document.querySelectorAll('.family-member-card');
    
    memberCards.forEach(card => {
        const memberId = card.dataset.memberId;
        
        // Status select change
        const statusSelect = card.querySelector('.status-select');
        if (statusSelect) {
            statusSelect.addEventListener('change', function() {
                updateFamilyMember(memberId, { status: this.value });
                updateCardAppearance(card, this.value);
                updateFamilyProgress();
                updateFamilyInsights();
            });
        }
        
        // Date input change
        const dateInput = card.querySelector('.date-input');
        if (dateInput) {
            dateInput.addEventListener('change', function() {
                updateFamilyMember(memberId, { conversation_date: this.value });
            });
        }
        
        // Menu toggle
        const menuToggle = card.querySelector('.menu-toggle');
        const menu = card.querySelector('.action-menu');
        if (menuToggle && menu) {
            menuToggle.addEventListener('click', function(e) {
                e.stopPropagation();
                closeAllMenus();
                menu.classList.toggle('active');
            });
        }
        
        // Edit button
        const editBtn = card.querySelector('.edit-member');
        if (editBtn) {
            editBtn.addEventListener('click', function() {
                enableEditMode(card);
                menu.classList.remove('active');
            });
        }
        
        // Delete button
        const deleteBtn = card.querySelector('.delete-member');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function() {
                const memberName = card.querySelector('.member-name .editable-text').textContent;
                showDeleteModal(memberId, memberName);
                menu.classList.remove('active');
            });
        }
        
        // Add hover effects
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
    
    // Close menus when clicking outside
    document.addEventListener('click', closeAllMenus);
}

function initializeInlineEditing() {
    const editableElements = document.querySelectorAll('.editable-text, .editable-textarea');
    
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
    const memberCard = currentEditingElement.closest('.family-member-card');
    const memberId = memberCard.dataset.memberId;
    
    if (newValue !== originalValue) {
        // Validate input
        if (field === 'name' && !newValue) {
            utils.showNotification('Name cannot be empty', 'error');
            cancelEdit();
            return;
        }
        
        // Show loading state
        memberCard.classList.add('saving');
        showLoadingIndicator(currentEditingElement);
        
        // Prepare update data
        const updateData = { [field]: newValue };
        
        // Send update to server
        updateFamilyMember(memberId, updateData)
            .then(() => {
                memberCard.classList.remove('saving');
                memberCard.classList.add('saved');
                hideLoadingIndicator(currentEditingElement);
                showSuccessIndicator(currentEditingElement);
                
                setTimeout(() => memberCard.classList.remove('saved'), 2000);
                
                // Update local data
                const member = familyMembers.find(m => m.id === memberId);
                if (member && field === 'name') {
                    member.name = newValue;
                }
                
                utils.showNotification('Family member updated successfully', 'success');
            })
            .catch(error => {
                memberCard.classList.remove('saving');
                memberCard.classList.add('error');
                hideLoadingIndicator(currentEditingElement);
                showErrorIndicator(currentEditingElement);
                
                setTimeout(() => memberCard.classList.remove('error'), 2000);
                
                currentEditingElement.textContent = originalValue;
                utils.showNotification('Failed to update family member', 'error');
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

function updateFamilyMember(memberId, data) {
    return utils.ajax(`/api/family/${memberId}`, {
        method: 'PUT',
        data: data
    });
}

function enableEditMode(memberCard) {
    const editableElements = memberCard.querySelectorAll('.editable-text, .editable-textarea');
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

function updateCardAppearance(card, status) {
    // Update card data attribute and styling
    card.dataset.status = status.toLowerCase().replace(' ', '');
    
    // Update visual indicators
    const statusBadge = card.querySelector('.status-select');
    if (statusBadge) {
        statusBadge.className = 'status-select';
        statusBadge.classList.add(`status-${status.toLowerCase().replace(' ', '-')}`);
    }
    
    // Add animation for status change
    card.style.transform = 'scale(1.02)';
    setTimeout(() => {
        card.style.transform = '';
    }, 200);
}

function initializeFiltering() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const memberCards = document.querySelectorAll('.family-member-card');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active filter button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.dataset.filter;
            
            // Filter member cards
            memberCards.forEach(card => {
                const cardStatus = card.dataset.status;
                
                if (filter === 'all') {
                    card.classList.remove('filtered-out');
                } else if (filter === 'approved' && cardStatus === 'approved') {
                    card.classList.remove('filtered-out');
                } else if (filter === 'pending' && (cardStatus === 'pending' || cardStatus === 'notasked')) {
                    card.classList.remove('filtered-out');
                } else {
                    card.classList.add('filtered-out');
                }
            });
            
            // Update count display
            updateFilterCounts();
        });
    });
}

function updateFilterCounts() {
    const memberCards = document.querySelectorAll('.family-member-card:not(.filtered-out)');
    const visibleCount = memberCards.length;
    
    // You could add count displays to filter buttons here
    // For example: "Approved (3)", "Pending (2)", etc.
}

function initializeModals() {
    // Setup add family member modal
    const addBtn = document.getElementById('add-family-member');
    const addModal = document.getElementById('add-member-modal');
    const addForm = document.getElementById('add-member-form');
    
    if (addBtn && addModal && addForm) {
        addBtn.addEventListener('click', function() {
            addModal.classList.add('active');
            addForm.reset();
            
            // Focus on first input
            const firstInput = addForm.querySelector('input[name="name"]');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        });
        
        addForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addFamilyMember();
        });
    }
    
    // Setup delete confirmation modal
    setupDeleteModal();
    
    // Setup modal close handlers
    setupModalCloseHandlers();
}

function addFamilyMember() {
    const form = document.getElementById('add-member-form');
    const formData = new FormData(form);
    
    const data = {
        name: formData.get('name'),
        status: formData.get('status'),
        conversation_date: formData.get('conversation_date') || null,
        reaction: formData.get('reaction') || '',
        notes: formData.get('notes') || ''
    };
    
    // Validate data
    if (!data.name.trim()) {
        utils.showNotification('Name is required', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    submitBtn.disabled = true;
    
    // Add new family member
    utils.ajax('/api/family', {
        method: 'POST',
        data: data
    })
    .then(response => {
        if (response.success) {
            addFamilyMemberToDOM(response.member);
            updateFamilyProgress();
            updateFamilyInsights();
            document.getElementById('add-member-modal').classList.remove('active');
            utils.showNotification('Family member added successfully', 'success');
        } else {
            throw new Error(response.error || 'Failed to add family member');
        }
    })
    .catch(error => {
        utils.showNotification('Failed to add family member', 'error');
    })
    .finally(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
}

function addFamilyMemberToDOM(member) {
    const membersGrid = document.getElementById('family-members-grid');
    const newMemberHTML = createFamilyMemberHTML(member);
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = newMemberHTML;
    const newMemberCard = tempDiv.firstChild;
    
    newMemberCard.classList.add('new-family-member');
    membersGrid.appendChild(newMemberCard);
    
    // Add to family members array
    familyMembers.push({
        id: member.id,
        name: member.name,
        status: member.status,
        element: newMemberCard
    });
    
    // Setup event listeners for new member
    setupMemberCards();
    initializeInlineEditing();
    
    // Scroll to new member
    newMemberCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Remove new member class after animation
    setTimeout(() => {
        newMemberCard.classList.remove('new-family-member');
    }, 1000);
}

function createFamilyMemberHTML(member) {
    const conversationDate = member.conversation_date || '';
    const reaction = member.reaction || '';
    const notes = member.notes || '';
    
    return `
        <div class="family-member-card" data-member-id="${member.id}" data-status="${member.status.toLowerCase().replace(' ', '')}">
            <div class="member-header">
                <div class="member-avatar">
                    <i class="fas fa-user"></i>
                </div>
                
                <div class="member-info">
                    <h3 class="member-name">
                        <span class="editable-text" data-field="name">${member.name}</span>
                    </h3>
                    
                    <div class="member-status">
                        <select class="status-select" data-field="status">
                            <option value="Approved" ${member.status === 'Approved' ? 'selected' : ''}>✅ Approved</option>
                            <option value="Pending" ${member.status === 'Pending' ? 'selected' : ''}>⏳ Pending</option>
                            <option value="Not Asked" ${member.status === 'Not Asked' ? 'selected' : ''}>❓ Not Asked</option>
                            <option value="Declined" ${member.status === 'Declined' ? 'selected' : ''}>❌ Declined</option>
                        </select>
                    </div>
                </div>
                
                <div class="member-actions">
                    <div class="action-menu">
                        <button class="menu-toggle">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <div class="menu-dropdown">
                            <button class="menu-item edit-member">
                                <i class="fas fa-edit"></i>
                                Edit Details
                            </button>
                            <button class="menu-item delete-member">
                                <i class="fas fa-trash"></i>
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="member-content">
                <div class="conversation-section">
                    <div class="conversation-header">
                        <h4 class="conversation-title">
                            <i class="fas fa-comments"></i>
                            Conversation
                        </h4>
                        <div class="conversation-date">
                            <i class="fas fa-calendar"></i>
                            <input type="date" class="date-input" data-field="conversation_date" value="${conversationDate}">
                        </div>
                    </div>
                    
                    <div class="conversation-content">
                        <div class="reaction-field">
                            <label class="field-label">Reaction:</label>
                            <div class="editable-text" data-field="reaction" data-placeholder="How did they react?">${reaction}</div>
                        </div>
                    </div>
                </div>

                <div class="notes-section">
                    <div class="notes-header">
                        <h4 class="notes-title">
                            <i class="fas fa-sticky-note"></i>
                            Notes
                        </h4>
                    </div>
                    <div class="notes-content">
                        <div class="editable-textarea" data-field="notes" data-placeholder="Add any additional notes...">${notes}</div>
                    </div>
                </div>
            </div>

            <div class="member-footer">
                <div class="last-updated">
                    <i class="fas fa-clock"></i>
                    <span>Just added</span>
                </div>
            </div>
        </div>
    `;
}

function setupDeleteModal() {
    const deleteModal = document.getElementById('delete-member-modal');
    const confirmBtn = document.getElementById('confirm-delete-member');
    
    let memberToDelete = null;
    
    window.showDeleteModal = function(memberId, memberName) {
        memberToDelete = memberId;
        deleteModal.classList.add('active');
        
        // Update modal content
        const nameSpan = document.getElementById('member-to-delete-name');
        if (nameSpan) {
            nameSpan.textContent = memberName;
        }
    };
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            if (memberToDelete) {
                deleteFamilyMember(memberToDelete);
            }
        });
    }
}

function deleteFamilyMember(memberId) {
    const memberCard = document.querySelector(`[data-member-id="${memberId}"]`);
    
    if (memberCard) {
        memberCard.classList.add('loading');
        
        utils.ajax(`/api/family/${memberId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.success) {
                // Animate removal
                memberCard.style.transform = 'translateX(-100%)';
                memberCard.style.opacity = '0';
                
                setTimeout(() => {
                    memberCard.remove();
                    
                    // Remove from family members array
                    familyMembers = familyMembers.filter(m => m.id !== memberId);
                    
                    updateFamilyProgress();
                    updateFamilyInsights();
                }, 300);
                
                document.getElementById('delete-member-modal').classList.remove('active');
                utils.showNotification('Family member removed successfully', 'success');
            } else {
                throw new Error(response.error || 'Failed to delete family member');
            }
        })
        .catch(error => {
            memberCard.classList.remove('loading');
            utils.showNotification('Failed to remove family member', 'error');
        });
    }
}

function updateFamilyProgress() {
    const memberCards = document.querySelectorAll('.family-member-card');
    const totalMembers = memberCards.length;
    const approvedMembers = document.querySelectorAll('.family-member-card[data-status="approved"]').length;
    
    // Update progress displays
    const approvedCount = document.getElementById('approved-count');
    const totalCount = document.getElementById('total-count');
    const progressBar = document.querySelector('.progress-bar .progress-fill');
    const progressPercentage = document.querySelector('.progress-percentage');
    
    if (approvedCount) approvedCount.textContent = approvedMembers;
    if (totalCount) totalCount.textContent = totalMembers;
    
    const progress = totalMembers > 0 ? (approvedMembers / totalMembers * 100) : 0;
    
    if (progressBar) progressBar.style.width = `${progress}%`;
    if (progressPercentage) progressPercentage.textContent = `${Math.round(progress)}%`;
}

function updateFamilyInsights() {
    const memberCards = document.querySelectorAll('.family-member-card');
    
    // Count different types of reactions
    let excitedCount = 0;
    let supportiveCount = 0;
    let pendingCount = 0;
    
    memberCards.forEach(card => {
        const status = card.dataset.status;
        const reactionElement = card.querySelector('.editable-text[data-field="reaction"]');
        const reaction = reactionElement ? reactionElement.textContent.toLowerCase() : '';
        
        if (status === 'approved') {
            supportiveCount++;
            if (reaction.includes('excited') || reaction.includes('happy') || reaction.includes('thrilled')) {
                excitedCount++;
            }
        } else if (status === 'pending' || status === 'notasked') {
            pendingCount++;
        }
    });
    
    // Update insight displays
    const insightNumbers = document.querySelectorAll('.insight-number');
    if (insightNumbers.length >= 3) {
        insightNumbers[0].textContent = excitedCount;
        insightNumbers[1].textContent = supportiveCount;
        insightNumbers[2].textContent = pendingCount;
    }
}

function initializeStatusUpdates() {
    // Quick status update functionality
    const statusModal = document.getElementById('status-update-modal');
    const statusOptions = document.querySelectorAll('.status-option');
    
    statusOptions.forEach(option => {
        option.addEventListener('click', function() {
            const status = this.dataset.status;
            // Implementation for quick status updates
            statusModal.classList.remove('active');
            utils.showNotification(`Status updated to ${status}`, 'success');
        });
    });
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

function initializeDragAndDrop() {
    // Add drag and drop functionality for reordering family members
    const membersGrid = document.getElementById('family-members-grid');
    
    if (membersGrid) {
        let draggedElement = null;
        
        membersGrid.addEventListener('dragstart', function(e) {
            if (e.target.classList.contains('family-member-card')) {
                draggedElement = e.target;
                e.target.style.opacity = '0.5';
            }
        });
        
        membersGrid.addEventListener('dragend', function(e) {
            if (e.target.classList.contains('family-member-card')) {
                e.target.style.opacity = '';
                draggedElement = null;
            }
        });
        
        membersGrid.addEventListener('dragover', function(e) {
            e.preventDefault();
        });
        
        membersGrid.addEventListener('drop', function(e) {
            e.preventDefault();
            
            if (draggedElement && e.target.closest('.family-member-card')) {
                const targetElement = e.target.closest('.family-member-card');
                if (targetElement !== draggedElement) {
                    const rect = targetElement.getBoundingClientRect();
                    const midY = rect.top + rect.height / 2;
                    
                    if (e.clientY < midY) {
                        membersGrid.insertBefore(draggedElement, targetElement);
                    } else {
                        membersGrid.insertBefore(draggedElement, targetElement.nextSibling);
                    }
                }
            }
        });
        
        // Make cards draggable
        const memberCards = membersGrid.querySelectorAll('.family-member-card');
        memberCards.forEach(card => {
            card.draggable = true;
        });
    }
}

function setupFamilyAnimations() {
    // Add entrance animations to family member cards
    const memberCards = document.querySelectorAll('.family-member-card');
    memberCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
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
            e.target.classList.contains('editable-textarea')) {
            
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
window.familyPageUtils = {
    updateFamilyProgress,
    updateFamilyInsights,
    addFamilyMemberToDOM,
    deleteFamilyMember,
    showDeleteModal
};