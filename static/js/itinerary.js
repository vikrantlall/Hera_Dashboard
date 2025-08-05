// HERA Itinerary JavaScript - Day Cards Layout
// Handles day-based activity management, progress tracking, and editing

document.addEventListener('DOMContentLoaded', function() {
    initializeItinerary();
});

function initializeItinerary() {
    console.log('🎯 Initializing HERA Day Cards Itinerary...');

    // Core functionality
    setupActivityManagement();
    setupInlineEditing();
    setupModals();

    // Initial calculations
    updateAllProgress();
    updateActivityCounts();

    console.log('✅ Day Cards Itinerary initialized successfully');
}

// =============================================================================
// ACTIVITY MANAGEMENT
// =============================================================================
function setupActivityManagement() {
    // Setup existing activity items
    const activityItems = document.querySelectorAll('.activity-item');
    activityItems.forEach(setupActivityEvents);

    // Setup forms
    setupActivityForms();
}

function setupActivityEvents(item) {
    // Complete checkbox
    const checkbox = item.querySelector('.activity-checkbox input[type="checkbox"]');
    if (checkbox) {
        checkbox.addEventListener('change', (e) => {
            e.stopPropagation();
            toggleActivityComplete(item);
        });
    }

    // Edit button
    const editBtn = item.querySelector('.edit-btn');
    if (editBtn) {
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openEditActivityModal(item);
        });
    }

    // Delete button
    const deleteBtn = item.querySelector('.delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteActivity(item);
        });
    }
}

function toggleActivityComplete(item) {
    const activityId = item.dataset.activityId;
    const checkbox = item.querySelector('.activity-checkbox input[type="checkbox"]');
    const isCompleted = checkbox.checked;

    // Update UI immediately
    item.dataset.completed = isCompleted;

    // Send to backend
    fetch(`/api/itinerary/${activityId}/complete`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: isCompleted })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updateAllProgress();
            showNotification(`Activity ${isCompleted ? 'completed' : 'reopened'}`, 'success');
        } else {
            // Revert on error
            checkbox.checked = !isCompleted;
            item.dataset.completed = !isCompleted;
            showNotification(data.error || 'Failed to update activity', 'error');
        }
    })
    .catch(error => {
        console.error('Error updating activity:', error);
        checkbox.checked = !isCompleted;
        item.dataset.completed = !isCompleted;
        showNotification('Error updating activity', 'error');
    });
}

function deleteActivity(item) {
    if (!confirm('Are you sure you want to delete this activity?')) {
        return;
    }

    const activityId = item.dataset.activityId;

    // Visual feedback
    item.style.opacity = '0.5';
    item.style.pointerEvents = 'none';

    fetch(`/api/itinerary/${activityId}/delete`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Remove from DOM
            item.remove();
            updateAllProgress();
            updateActivityCounts();
            showNotification('Activity deleted successfully', 'success');
        } else {
            // Revert visual feedback
            item.style.opacity = '1';
            item.style.pointerEvents = 'auto';
            showNotification(data.error || 'Failed to delete activity', 'error');
        }
    })
    .catch(error => {
        console.error('Error deleting activity:', error);
        item.style.opacity = '1';
        item.style.pointerEvents = 'auto';
        showNotification('Error deleting activity', 'error');
    });
}

// =============================================================================
// ACTIVITY FORMS (Add/Edit)
// =============================================================================
function setupActivityForms() {
    const addForm = document.getElementById('add-activity-form');
    const editForm = document.getElementById('edit-activity-form');

    if (addForm) {
        addForm.addEventListener('submit', handleAddActivity);
    }

    if (editForm) {
        editForm.addEventListener('submit', handleEditActivity);
    }
}

function handleAddActivity(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const activityData = {
        day: parseInt(formData.get('day')),
        time: formData.get('time'),
        activity: formData.get('activity'),
        location: formData.get('location') || '',
        notes: formData.get('notes') || '',
        isProposal: formData.get('isProposal') === 'on'
    };

    // Basic validation
    if (!activityData.activity.trim()) {
        showNotification('Activity name is required', 'error');
        return;
    }

    // Send to backend
    fetch('/api/itinerary/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Add to UI
            addActivityToDay(data.activity);
            updateAllProgress();
            updateActivityCounts();

            // Close modal and reset form
            closeModal('add-activity-modal');
            e.target.reset();

            showNotification('Activity added successfully', 'success');
        } else {
            showNotification(data.error || 'Failed to add activity', 'error');
        }
    })
    .catch(error => {
        console.error('Error adding activity:', error);
        showNotification('Error adding activity', 'error');
    });
}

function handleEditActivity(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const activityData = {
        id: parseInt(formData.get('id')),
        day: parseInt(formData.get('day')),
        time: formData.get('time'),
        activity: formData.get('activity'),
        location: formData.get('location') || '',
        notes: formData.get('notes') || '',
        isProposal: formData.get('isProposal') === 'on'
    };

    // Send to backend
    fetch('/api/itinerary/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update UI
            updateActivityInDay(activityData);
            updateAllProgress();
            updateActivityCounts();

            // Close modal
            closeModal('edit-activity-modal');

            showNotification('Activity updated successfully', 'success');
        } else {
            showNotification(data.error || 'Failed to update activity', 'error');
        }
    })
    .catch(error => {
        console.error('Error updating activity:', error);
        showNotification('Error updating activity', 'error');
    });
}

function addActivityToDay(activityData) {
    // Find the correct day's activities list
    const activitiesList = document.querySelector(`.activities-list[data-day="${activityData.day}"]`);
    if (!activitiesList) return;

    // Create new activity item
    const activityItem = createActivityItem(activityData);

    // Insert in chronological order
    const existingItems = activitiesList.querySelectorAll('.activity-item');
    let inserted = false;

    for (let item of existingItems) {
        const itemTime = item.querySelector('.activity-time')?.textContent || '00:00';
        if (activityData.time < itemTime) {
            activitiesList.insertBefore(activityItem, item);
            inserted = true;
            break;
        }
    }

    if (!inserted) {
        activitiesList.appendChild(activityItem);
    }

    setupActivityEvents(activityItem);
}

function updateActivityInDay(activityData) {
    // Find existing activity item
    const existingItem = document.querySelector(`.activity-item[data-activity-id="${activityData.id}"]`);
    if (!existingItem) return;

    // Check if day changed
    const currentDay = existingItem.closest('.activities-list').dataset.day;
    if (parseInt(currentDay) !== activityData.day) {
        // Remove from current day and add to new day
        existingItem.remove();
        addActivityToDay(activityData);
    } else {
        // Update in place
        updateActivityItem(existingItem, activityData);

        // Re-sort if time changed
        const activitiesList = existingItem.closest('.activities-list');
        const activities = Array.from(activitiesList.querySelectorAll('.activity-item'));
        activities.sort((a, b) => {
            const timeA = a.querySelector('.activity-time')?.textContent || '00:00';
            const timeB = b.querySelector('.activity-time')?.textContent || '00:00';
            return timeA.localeCompare(timeB);
        });

        activities.forEach(item => activitiesList.appendChild(item));
    }
}

function createActivityItem(activity) {
    const item = document.createElement('div');
    item.className = `activity-item ${activity.isProposal ? 'proposal-activity' : ''}`;
    item.dataset.activityId = activity.id;
    item.dataset.completed = 'false';

    item.innerHTML = `
        <div class="activity-checkbox">
            <input type="checkbox">
        </div>

        <div class="activity-content">
            <div class="activity-time">${activity.time}</div>
            <div class="activity-details">
                <h4 class="activity-title editable-text" data-field="activity" data-item-id="${activity.id}">
                    ${activity.activity}
                    ${activity.isProposal ? '<span class="proposal-indicator">💍</span>' : ''}
                </h4>
                ${activity.location ? `
                    <div class="activity-location">
                        <i class="fas fa-map-marker-alt"></i>
                        <span class="editable-text" data-field="location" data-item-id="${activity.id}">${activity.location}</span>
                    </div>
                ` : ''}
                ${activity.notes ? `
                    <div class="activity-notes">
                        <p class="editable-text" data-field="notes" data-item-id="${activity.id}">${activity.notes}</p>
                    </div>
                ` : ''}
            </div>
        </div>

        <div class="activity-actions">
            <button class="action-btn edit-btn" data-tooltip="Edit">
                <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn delete-btn" data-tooltip="Delete">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    return item;
}

function updateActivityItem(item, activityData) {
    // Update time
    const timeElement = item.querySelector('.activity-time');
    if (timeElement) timeElement.textContent = activityData.time;

    // Update title
    const titleElement = item.querySelector('.activity-title');
    if (titleElement) {
        titleElement.innerHTML = activityData.activity +
            (activityData.isProposal ? '<span class="proposal-indicator">💍</span>' : '');
    }

    // Update location
    const locationElement = item.querySelector('.activity-location span');
    if (locationElement) {
        locationElement.textContent = activityData.location;
    } else if (activityData.location) {
        // Add location if it didn't exist
        const detailsElement = item.querySelector('.activity-details');
        const locationDiv = document.createElement('div');
        locationDiv.className = 'activity-location';
        locationDiv.innerHTML = `
            <i class="fas fa-map-marker-alt"></i>
            <span class="editable-text" data-field="location" data-item-id="${activityData.id}">${activityData.location}</span>
        `;
        detailsElement.appendChild(locationDiv);
    }

    // Update notes
    const notesElement = item.querySelector('.activity-notes p');
    if (notesElement) {
        notesElement.textContent = activityData.notes;
    } else if (activityData.notes) {
        // Add notes if they didn't exist
        const detailsElement = item.querySelector('.activity-details');
        const notesDiv = document.createElement('div');
        notesDiv.className = 'activity-notes';
        notesDiv.innerHTML = `<p class="editable-text" data-field="notes" data-item-id="${activityData.id}">${activityData.notes}</p>`;
        detailsElement.appendChild(notesDiv);
    }

    // Update proposal status
    if (activityData.isProposal) {
        item.classList.add('proposal-activity');
    } else {
        item.classList.remove('proposal-activity');
    }
}

// =============================================================================
// MODAL MANAGEMENT
// =============================================================================
function setupModals() {
    // Close modal when clicking backdrop
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });

    // ESC key to close modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal[style*="flex"]');
            if (openModal) {
                closeModal(openModal.id);
            }
        }
    });
}

function openAddActivityModal() {
    const modal = document.getElementById('add-activity-modal');
    if (modal) {
        modal.style.display = 'flex';

        // Focus first input
        setTimeout(() => {
            const firstInput = modal.querySelector('select, input');
            if (firstInput) firstInput.focus();
        }, 100);
    }
}

function openEditActivityModal(item) {
    const modal = document.getElementById('edit-activity-modal');
    if (!modal) return;

    const activityId = item.dataset.activityId;
    const dayCard = item.closest('.day-card');
    const day = dayCard ? dayCard.dataset.day : '1';

    // Extract data from DOM
    const title = item.querySelector('.activity-title')?.textContent?.replace('💍', '').trim() || '';
    const location = item.querySelector('.activity-location span')?.textContent?.trim() || '';
    const notes = item.querySelector('.activity-notes p')?.textContent?.trim() || '';
    const time = item.querySelector('.activity-time')?.textContent?.trim() || '';
    const isProposal = item.classList.contains('proposal-activity');

    // Populate form
    document.getElementById('edit-activity-id').value = activityId;
    document.getElementById('edit-activity-day').value = day;
    document.getElementById('edit-activity-time').value = time;
    document.getElementById('edit-activity-title').value = title;
    document.getElementById('edit-activity-location').value = location;
    document.getElementById('edit-activity-notes').value = notes;
    document.getElementById('edit-is-proposal').checked = isProposal;

    modal.style.display = 'flex';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';

        // Reset form if it exists
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
    }
}

// =============================================================================
// INLINE EDITING
// =============================================================================
function setupInlineEditing() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('editable-text') && !e.target.classList.contains('editing')) {
            startInlineEdit(e.target);
        }
    });
}

function startInlineEdit(element) {
    if (element.classList.contains('editing')) return;

    const originalText = element.textContent;
    const field = element.dataset.field;
    const itemId = element.dataset.itemId;

    // Create input
    const input = document.createElement(field === 'notes' ? 'textarea' : 'input');
    input.type = 'text';
    input.value = originalText;
    input.className = 'inline-edit-input';

    // Style the input
    Object.assign(input.style, {
        width: '100%',
        border: '1px solid var(--accent-gold)',
        borderRadius: '4px',
        padding: '4px 8px',
        font: 'inherit',
        background: 'white',
        resize: field === 'notes' ? 'vertical' : 'none'
    });

    if (field === 'notes') {
        input.rows = 2;
    }

    element.classList.add('editing');
    element.innerHTML = '';
    element.appendChild(input);
    input.focus();
    input.select();

    function saveChanges() {
        const newValue = input.value.trim();

        if (newValue !== originalText) {
            // Send to backend
            fetch('/api/itinerary/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: parseInt(itemId),
                    field: field,
                    value: newValue
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    element.textContent = newValue;
                    showNotification('Updated successfully', 'success');
                } else {
                    element.textContent = originalText;
                    showNotification(data.error || 'Failed to update', 'error');
                }
            })
            .catch(error => {
                console.error('Error updating:', error);
                element.textContent = originalText;
                showNotification('Error updating', 'error');
            });
        } else {
            element.textContent = originalText;
        }

        element.classList.remove('editing');
    }

    function cancelEdit() {
        element.textContent = originalText;
        element.classList.remove('editing');
    }

    // Event listeners
    input.addEventListener('blur', saveChanges);
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            saveChanges();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelEdit();
        }
    });
}

// =============================================================================
// PROGRESS TRACKING & STATISTICS
// =============================================================================
function updateAllProgress() {
    updateTripProgress();
    updateDayProgress();
}

function updateTripProgress() {
    const allActivities = document.querySelectorAll('.activity-item');
    const completedActivities = document.querySelectorAll('.activity-item[data-completed="true"]');

    const total = allActivities.length;
    const completed = completedActivities.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Update UI
    const progressFill = document.getElementById('trip-progress-fill');
    const progressText = document.getElementById('trip-percentage');

    if (progressFill) {
        progressFill.style.width = `${percentage}%`;
    }

    if (progressText) {
        progressText.textContent = `${percentage}%`;
    }
}

function updateDayProgress() {
    for (let day = 1; day <= 6; day++) {
        const dayCard = document.querySelector(`.day-card[data-day="${day}"]`);
        if (!dayCard) continue;

        const dayActivities = dayCard.querySelectorAll('.activity-item');
        const dayCompleted = dayCard.querySelectorAll('.activity-item[data-completed="true"]');

        const total = dayActivities.length;
        const completed = dayCompleted.length;
        const percentage = total > 0 ? (completed / total) * 100 : 0;

        // Update day progress bar
        const dayProgressFill = dayCard.querySelector('.day-progress-fill');
        if (dayProgressFill) {
            dayProgressFill.style.width = `${percentage}%`;
        }

        // Update completion count
        const dayCompletion = dayCard.querySelector('.day-completion');
        if (dayCompletion) {
            dayCompletion.textContent = `${completed}/${total}`;
        }
    }
}

function updateActivityCounts() {
    // This is handled by updateDayProgress now
    updateDayProgress();
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================
function showNotification(message, type = 'info') {
    // Use global notification system if available
    if (window.HERA && window.HERA.showNotification) {
        window.HERA.showNotification(message, type);
        return;
    }

    // Fallback notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 16px',
        background: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6',
        color: 'white',
        borderRadius: '8px',
        zIndex: '10000',
        animation: 'slideInRight 0.3s ease'
    });

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// =============================================================================
// GLOBAL FUNCTIONS (called from HTML)
// =============================================================================
window.openAddActivityModal = openAddActivityModal;
window.openEditActivityModal = openEditActivityModal;
window.closeModal = closeModal;
window.toggleActivityComplete = toggleActivityComplete;
window.deleteActivity = deleteActivity;

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeItinerary,
        updateAllProgress,
        updateActivityCounts
    };
}