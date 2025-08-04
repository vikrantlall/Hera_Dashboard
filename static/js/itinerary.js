// Itinerary Page JavaScript with Drag-and-Drop Functionality

document.addEventListener('DOMContentLoaded', function() {
    initializeItineraryPage();
    initializeInlineEditing();
    initializeDragAndDrop();
    initializeTimelineControls();
    initializeModals();
    setupAutoSave();
});

let currentEditingElement = null;
let originalValue = null;
let itineraryActivities = [];
let draggedActivity = null;

function initializeItineraryPage() {
    // Load itinerary activities data
    loadItineraryActivities();
    
    // Setup itinerary-specific features
    setupItineraryAnimations();
    setupActivityCards();
    updateItineraryInsights();
    
    // Highlight proposal day activities
    highlightProposalDay();
}

function loadItineraryActivities() {
    const activityCards = document.querySelectorAll('.activity-card');
    itineraryActivities = [];
    
    activityCards.forEach(card => {
        const activityId = card.dataset.activityId;
        const activityElement = card.querySelector('.editable-text[data-field="activity"]');
        const dayElement = card.closest('.timeline-day');
        
        if (activityId && activityElement && dayElement) {
            itineraryActivities.push({
                id: activityId,
                activity: activityElement.textContent.trim(),
                day: dayElement.dataset.day,
                special: card.dataset.special === 'true',
                element: card
            });
        }
    });
}

function setupActivityCards() {
    const activityCards = document.querySelectorAll('.activity-card');
    
    activityCards.forEach(card => {
        const activityId = card.dataset.activityId;
        
        // Time input changes
        const timeInputs = card.querySelectorAll('.time-input');
        timeInputs.forEach(input => {
            input.addEventListener('change', function() {
                const field = this.dataset.field;
                updateItineraryActivity(activityId, { [field]: this.value });
            });
        });
        
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
        const editBtn = card.querySelector('.edit-activity');
        if (editBtn) {
            editBtn.addEventListener('click', function() {
                enableEditMode(card);
                menu.classList.remove('active');
            });
        }
        
        // Toggle special button
        const specialBtn = card.querySelector('.toggle-special');
        if (specialBtn) {
            specialBtn.addEventListener('click', function() {
                const isSpecial = card.dataset.special === 'true';
                toggleSpecialActivity(activityId, !isSpecial);
                menu.classList.remove('active');
            });
        }
        
        // Delete button
        const deleteBtn = card.querySelector('.delete-activity');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function() {
                const activityName = card.querySelector('.editable-text[data-field="activity"]').textContent;
                showDeleteModal(activityId, activityName);
                menu.classList.remove('active');
            });
        }
        
        // Add hover effects
        card.addEventListener('mouseenter', function() {
            if (!this.classList.contains('dragging')) {
                this.style.transform = 'translateX(4px)';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            if (!this.classList.contains('dragging')) {
                this.style.transform = '';
            }
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
        element.style.minHeight = '80px';
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
    const activityCard = currentEditingElement.closest('.activity-card');
    const activityId = activityCard.dataset.activityId;
    
    if (newValue !== originalValue) {
        // Validate input
        if (field === 'activity' && !newValue) {
            utils.showNotification('Activity name cannot be empty', 'error');
            cancelEdit();
            return;
        }
        
        // Show loading state
        activityCard.classList.add('saving');
        showLoadingIndicator(currentEditingElement);
        
        // Prepare update data
        const updateData = { [field]: newValue };
        
        // Send update to server
        updateItineraryActivity(activityId, updateData)
            .then(() => {
                activityCard.classList.remove('saving');
                activityCard.classList.add('saved');
                hideLoadingIndicator(currentEditingElement);
                showSuccessIndicator(currentEditingElement);
                
                setTimeout(() => activityCard.classList.remove('saved'), 2000);
                
                // Update local data
                const activity = itineraryActivities.find(a => a.id === activityId);
                if (activity && field === 'activity') {
                    activity.activity = newValue;
                }
                
                updateItineraryInsights();
                utils.showNotification('Activity updated successfully', 'success');
            })
            .catch(error => {
                activityCard.classList.remove('saving');
                activityCard.classList.add('error');
                hideLoadingIndicator(currentEditingElement);
                showErrorIndicator(currentEditingElement);
                
                setTimeout(() => activityCard.classList.remove('error'), 2000);
                
                currentEditingElement.textContent = originalValue;
                utils.showNotification('Failed to update activity', 'error');
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

function updateItineraryActivity(activityId, data) {
    return utils.ajax(`/api/itinerary/${activityId}`, {
        method: 'PUT',
        data: data
    });
}

function toggleSpecialActivity(activityId, isSpecial) {
    const activityCard = document.querySelector(`[data-activity-id="${activityId}"]`);
    
    if (activityCard) {
        activityCard.classList.add('loading');
        
        updateItineraryActivity(activityId, { special: isSpecial })
            .then(() => {
                activityCard.classList.remove('loading');
                activityCard.dataset.special = isSpecial.toString();
                
                // Update visual indicators
                const specialBadge = activityCard.querySelector('.special-badge');
                const menuBtn = activityCard.querySelector('.toggle-special');
                
                if (isSpecial) {
                    if (!specialBadge) {
                        const badge = document.createElement('span');
                        badge.className = 'special-badge';
                        badge.innerHTML = '<i class="fas fa-star"></i> Special';
                        activityCard.querySelector('.activity-title').appendChild(badge);
                    }
                    if (menuBtn) {
                        menuBtn.innerHTML = '<i class="fas fa-star"></i> Remove Special';
                    }
                    activityCard.classList.add('special-activity');
                } else {
                    if (specialBadge) {
                        specialBadge.remove();
                    }
                    if (menuBtn) {
                        menuBtn.innerHTML = '<i class="fas fa-star"></i> Mark Special';
                    }
                    activityCard.classList.remove('special-activity');
                }
                
                updateItineraryInsights();
                utils.showNotification(`Activity ${isSpecial ? 'marked as special' : 'unmarked as special'}`, 'success');
            })
            .catch(error => {
                activityCard.classList.remove('loading');
                utils.showNotification('Failed to update activity', 'error');
            });
    }
}

function enableEditMode(activityCard) {
    const editableElements = activityCard.querySelectorAll('.editable-text, .editable-textarea');
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

function initializeDragAndDrop() {
    const activityCards = document.querySelectorAll('.activity-card');
    const dayActivities = document.querySelectorAll('.day-activities');
    
    // Make activity cards draggable
    activityCards.forEach(card => {
        card.draggable = true;
        
        card.addEventListener('dragstart', function(e) {
            draggedActivity = this;
            this.classList.add('dragging');
            this.style.opacity = '0.5';
            
            // Store data for transfer
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', this.outerHTML);
        });
        
        card.addEventListener('dragend', function(e) {
            this.classList.remove('dragging');
            this.style.opacity = '';
            draggedActivity = null;
        });
    });
    
    // Make day containers droppable
    dayActivities.forEach(dayContainer => {
        dayContainer.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            // Add drop zone styling
            this.classList.add('drag-over');
            
            // Find insertion point
            const afterElement = getDragAfterElement(this, e.clientY);
            const dragPreview = this.querySelector('.drag-preview');
            
            if (dragPreview) {
                dragPreview.remove();
            }
            
            if (afterElement == null) {
                this.appendChild(createDragPreview());
            } else {
                this.insertBefore(createDragPreview(), afterElement);
            }
        });
        
        dayContainer.addEventListener('dragleave', function(e) {
            // Only remove styling if leaving the container entirely
            if (!this.contains(e.relatedTarget)) {
                this.classList.remove('drag-over');
                const dragPreview = this.querySelector('.drag-preview');
                if (dragPreview) {
                    dragPreview.remove();
                }
            }
        });
        
        dayContainer.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
            
            const dragPreview = this.querySelector('.drag-preview');
            if (dragPreview && draggedActivity) {
                // Move the actual element
                const newDay = this.dataset.day;
                const oldDay = draggedActivity.closest('.timeline-day').dataset.day;
                
                this.insertBefore(draggedActivity, dragPreview);
                dragPreview.remove();
                
                // Update order and day on server
                updateActivityOrder(draggedActivity.dataset.activityId, newDay);
                
                // Update local data
                const activity = itineraryActivities.find(a => a.id === draggedActivity.dataset.activityId);
                if (activity) {
                    activity.day = newDay;
                }
                
                utils.showNotification(`Activity moved to Day ${newDay}`, 'success');
            }
        });
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.activity-card:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function createDragPreview() {
    const preview = document.createElement('div');
    preview.className = 'drag-preview';
    preview.innerHTML = `
        <div class="preview-content">
            <i class="fas fa-arrows-alt"></i>
            <span>Drop activity here</span>
        </div>
    `;
    preview.style.cssText = `
        border: 2px dashed var(--accent-gold);
        border-radius: 8px;
        padding: 1rem;
        margin: 0.75rem 0;
        background: rgba(212, 175, 55, 0.05);
        text-align: center;
        color: var(--accent-gold);
        font-weight: 500;
    `;
    return preview;
}

function updateActivityOrder(activityId, newDay) {
    const dayContainer = document.querySelector(`[data-day="${newDay}"]`);
    const activityCards = dayContainer.querySelectorAll('.activity-card');
    const orderData = [];
    
    activityCards.forEach((card, index) => {
        orderData.push({
            id: card.dataset.activityId,
            order: index,
            day: newDay
        });
    });
    
    // Update specific activity
    return utils.ajax(`/api/itinerary/${activityId}`, {
        method: 'PUT',
        data: { day: parseInt(newDay), order: orderData.find(item => item.id === activityId)?.order || 0 }
    });
}

function initializeTimelineControls() {
    const timelineButtons = document.querySelectorAll('.timeline-btn');
    const timelineDays = document.querySelectorAll('.timeline-day');
    
    timelineButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active button
            timelineButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const view = this.dataset.view;
            
            // Show/hide timeline days
            timelineDays.forEach(day => {
                if (view === 'all') {
                    day.classList.remove('hidden');
                } else {
                    const dayNum = day.dataset.day;
                    if (view === `day${dayNum}`) {
                        day.classList.remove('hidden');
                    } else {
                        day.classList.add('hidden');
                    }
                }
            });
            
            // Special handling for proposal day
            if (view === 'day3') {
                highlightProposalDay();
            }
        });
    });
}

function highlightProposalDay() {
    const proposalDay = document.querySelector('[data-special="proposal"]');
    if (proposalDay) {
        proposalDay.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add special animation
        proposalDay.style.animation = 'proposalHighlight 2s ease-in-out';
        setTimeout(() => {
            proposalDay.style.animation = '';
        }, 2000);
    }
}

function initializeModals() {
    // Setup add activity modal
    const addBtn = document.getElementById('add-itinerary-activity');
    const addDayBtns = document.querySelectorAll('.add-day-activity');
    const addModal = document.getElementById('add-activity-modal');
    const addForm = document.getElementById('add-activity-form');
    
    if (addBtn && addModal && addForm) {
        addBtn.addEventListener('click', function() {
            addModal.classList.add('active');
            addForm.reset();
            
            // Focus on first input
            const firstInput = addForm.querySelector('select[name="day"]');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        });
        
        addDayBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const day = this.dataset.day;
                addModal.classList.add('active');
                addForm.reset();
                
                // Pre-select the day
                const daySelect = addForm.querySelector('select[name="day"]');
                if (daySelect) {
                    daySelect.value = day;
                }
            });
        });
        
        addForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addItineraryActivity();
        });
    }
    
    // Setup delete confirmation modal
    setupDeleteModal();
    
    // Setup modal close handlers
    setupModalCloseHandlers();
}

function addItineraryActivity() {
    const form = document.getElementById('add-activity-form');
    const formData = new FormData(form);
    
    const data = {
        day: parseInt(formData.get('day')),
        activity: formData.get('activity'),
        location: formData.get('location') || '',
        start_time: formData.get('start_time') || null,
        end_time: formData.get('end_time') || null,
        notes: formData.get('notes') || '',
        special: formData.get('special') === 'on',
        order: 0 // Will be set based on position
    };
    
    // Validate data
    if (!data.activity.trim()) {
        utils.showNotification('Activity name is required', 'error');
        return;
    }
    
    if (!data.day || data.day < 1 || data.day > 3) {
        utils.showNotification('Please select a valid day', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    submitBtn.disabled = true;
    
    // Add new itinerary activity
    utils.ajax('/api/itinerary', {
        method: 'POST',
        data: data
    })
    .then(response => {
        if (response.success) {
            addItineraryActivityToDOM(response.item);
            updateItineraryInsights();
            document.getElementById('add-activity-modal').classList.remove('active');
            utils.showNotification('Activity added successfully', 'success');
        } else {
            throw new Error(response.error || 'Failed to add activity');
        }
    })
    .catch(error => {
        utils.showNotification('Failed to add activity', 'error');
    })
    .finally(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
}

function addItineraryActivityToDOM(activity) {
    const dayContainer = document.querySelector(`[data-day="${activity.day}"] .day-activities`);
    const emptyDay = dayContainer.querySelector('.empty-day');
    
    // Remove empty day message if it exists
    if (emptyDay) {
        emptyDay.remove();
    }
    
    const newActivityHTML = createItineraryActivityHTML(activity);
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = newActivityHTML;
    const newActivityCard = tempDiv.firstChild;
    
    newActivityCard.classList.add('new-itinerary-activity');
    dayContainer.appendChild(newActivityCard);
    
    // Add to itinerary activities array
    itineraryActivities.push({
        id: activity.id,
        activity: activity.activity,
        day: activity.day.toString(),
        special: activity.special,
        element: newActivityCard
    });
    
    // Setup event listeners for new activity
    setupActivityCards();
    initializeInlineEditing();
    initializeDragAndDrop();
    
    // Scroll to new activity
    newActivityCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Remove new activity class after animation
    setTimeout(() => {
        newActivityCard.classList.remove('new-itinerary-activity');
    }, 1000);
}

function createItineraryActivityHTML(activity) {
    const startTime = activity.start_time || '';
    const endTime = activity.end_time || '';
    const location = activity.location || '';
    const notes = activity.notes || '';
    const isSpecial = activity.special;
    const isProposalDay = activity.day === 3;
    
    return `
        <div class="activity-card" data-activity-id="${activity.id}" ${isSpecial ? 'data-special="true"' : ''}>
            <div class="activity-timeline-marker">
                <div class="timeline-dot ${isSpecial ? 'special' : ''}"></div>
                <div class="timeline-line"></div>
            </div>
            
            <div class="activity-content">
                <div class="activity-header">
                    <div class="activity-time">
                        <input type="time" class="time-input" data-field="start_time" value="${startTime}">
                        <span class="time-separator">-</span>
                        <input type="time" class="time-input" data-field="end_time" value="${endTime}">
                    </div>
                    
                    <div class="activity-actions">
                        <div class="action-menu">
                            <button class="menu-toggle">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <div class="menu-dropdown">
                                <button class="menu-item edit-activity">
                                    <i class="fas fa-edit"></i>
                                    Edit
                                </button>
                                <button class="menu-item toggle-special">
                                    <i class="fas fa-star"></i>
                                    ${isSpecial ? 'Remove Special' : 'Mark Special'}
                                </button>
                                <button class="menu-item delete-activity">
                                    <i class="fas fa-trash"></i>
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="activity-info">
                    <h4 class="activity-title">
                        <span class="editable-text" data-field="activity">${activity.activity}</span>
                        ${isSpecial ? '<span class="special-badge"><i class="fas fa-star"></i> Special</span>' : ''}
                    </h4>
                    
                    <div class="activity-location">
                        <i class="fas fa-map-marker-alt"></i>
                        <span class="editable-text" data-field="location" data-placeholder="Add location">${location || 'Location'}</span>
                    </div>
                </div>
                
                ${notes ? `
                <div class="activity-notes">
                    <div class="notes-content">
                        <div class="editable-textarea" data-field="notes" data-placeholder="Add notes about this activity...">${notes}</div>
                    </div>
                </div>
                ` : ''}
                
                ${isSpecial && isProposalDay ? `
                <div class="proposal-highlight-box">
                    <div class="highlight-icon">
                        <i class="fas fa-heart"></i>
                    </div>
                    <div class="highlight-text">
                        <strong>This is it!</strong> The moment you've been planning for.
                    </div>
                    <div class="highlight-sparkles">✨💍✨</div>
                </div>
                ` : ''}
            </div>
        </div>
    `;
}

function setupDeleteModal() {
    const deleteModal = document.getElementById('delete-activity-modal');
    const confirmBtn = document.getElementById('confirm-delete-activity');
    
    let activityToDelete = null;
    
    window.showDeleteModal = function(activityId, activityName) {
        activityToDelete = activityId;
        deleteModal.classList.add('active');
        
        // Update modal content if needed
        const modalBody = deleteModal.querySelector('.modal-body p');
        if (modalBody) {
            modalBody.textContent = `Are you sure you want to delete "${activityName}"? This action cannot be undone.`;
        }
    };
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            if (activityToDelete) {
                deleteItineraryActivity(activityToDelete);
            }
        });
    }
}

function deleteItineraryActivity(activityId) {
    const activityCard = document.querySelector(`[data-activity-id="${activityId}"]`);
    
    if (activityCard) {
        activityCard.classList.add('loading');
        
        utils.ajax(`/api/itinerary/${activityId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.success) {
                // Animate removal
                activityCard.style.transform = 'translateX(-100%)';
                activityCard.style.opacity = '0';
                
                setTimeout(() => {
                    const dayContainer = activityCard.closest('.day-activities');
                    activityCard.remove();
                    
                    // Remove from itinerary activities array
                    itineraryActivities = itineraryActivities.filter(a => a.id !== activityId);
                    
                    // Show empty day message if no activities left
                    const remainingActivities = dayContainer.querySelectorAll('.activity-card');
                    if (remainingActivities.length === 0) {
                        showEmptyDayState(dayContainer);
                    }
                    
                    updateItineraryInsights();
                }, 300);
                
                document.getElementById('delete-activity-modal').classList.remove('active');
                utils.showNotification('Activity deleted successfully', 'success');
            } else {
                throw new Error(response.error || 'Failed to delete activity');
            }
        })
        .catch(error => {
            activityCard.classList.remove('loading');
            utils.showNotification('Failed to delete activity', 'error');
        });
    }
}

function showEmptyDayState(dayContainer) {
    const day = dayContainer.dataset.day;
    const emptyDayHTML = `
        <div class="empty-day">
            <div class="empty-icon">
                <i class="fas fa-calendar-plus"></i>
            </div>
            <p>No activities planned for this day yet</p>
            <button class="btn btn-primary add-day-activity" data-day="${day}">
                <i class="fas fa-plus"></i>
                Add First Activity
            </button>
        </div>
    `;
    dayContainer.innerHTML = emptyDayHTML;
    
    // Re-initialize the add day activity button
    initializeModals();
}

function updateItineraryInsights() {
    const activityCards = document.querySelectorAll('.activity-card');
    const specialActivities = document.querySelectorAll('.activity-card[data-special="true"]');
    
    // Update insight displays
    const insightNumbers = document.querySelectorAll('.insight-number');
    if (insightNumbers.length >= 4) {
        insightNumbers[0].textContent = activityCards.length;
        insightNumbers[1].textContent = specialActivities.length;
        insightNumbers[2].textContent = '3'; // Always 3 days
        insightNumbers[3].textContent = '1'; // Always 1 life-changing moment
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

function setupItineraryAnimations() {
    // Add entrance animations to activity cards
    const activityCards = document.querySelectorAll('.activity-card');
    activityCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });
    
    // Add special animations for proposal day
    const proposalDayCards = document.querySelectorAll('[data-special="proposal"] .activity-card');
    proposalDayCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.boxShadow = '0 0 25px rgba(236, 72, 153, 0.3)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.boxShadow = '';
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
window.itineraryPageUtils = {
    updateItineraryInsights,
    addItineraryActivityToDOM,
    deleteItineraryActivity,
    showDeleteModal,
    highlightProposalDay
};