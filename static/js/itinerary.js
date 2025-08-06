// Complete HERA Itinerary JavaScript with Full CRUD Operations
// Works with your existing API endpoints

document.addEventListener('DOMContentLoaded', function() {
    initializeItineraryPage();
});

function initializeItineraryPage() {
    console.log('🎯 Initializing HERA Itinerary with Full CRUD...');
    setupActivityEvents();
    setupActivityForms();
    setupModals();
    updateAllProgress();
    updateActivityCounts();
    console.log('✅ Itinerary initialized successfully');
}

// =============================================================================
// EVENT SETUP
// =============================================================================
function setupActivityEvents(container = document) {
    // Setup checkbox events for completion toggle
    const checkboxes = container.querySelectorAll('.activity-item input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const item = this.closest('.activity-item');
            toggleActivityComplete(item);
        });
    });

    // Setup editable text events for inline editing
    const editableElements = container.querySelectorAll('.editable-text');
    editableElements.forEach(element => {
        element.addEventListener('click', function() {
            makeElementEditable(this);
        });
    });

    // Setup edit button events
    const editButtons = container.querySelectorAll('.edit-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const item = this.closest('.activity-item');
            openEditActivityModal(item);
        });
    });

    // Setup delete button events
    const deleteButtons = container.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            deleteActivity(this);
        });
    });
}

function setupModals() {
    // Close modal when clicking backdrop
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            const modalId = e.target.id;
            closeModal(modalId);
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal.show');
            if (openModal) {
                closeModal(openModal.id);
            }
        }
    });
}

// =============================================================================
// MODAL MANAGEMENT
// =============================================================================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';

        // Focus first input after modal opens
        setTimeout(() => {
            const firstInput = modal.querySelector('input, select, textarea');
            if (firstInput) {
                firstInput.focus();
            }
        }, 300);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

function openAddActivityModal() {
    // Reset form
    const form = document.getElementById('add-activity-form');
    if (form) {
        form.reset();
    }
    openModal('add-activity-modal');
}

function openEditActivityModal(activityItem) {
    if (!activityItem) return;

    const activityId = activityItem.dataset.activityId;
    const day = activityItem.closest('.activities-list').dataset.day;

    // Get current data from the DOM
    const time = activityItem.querySelector('.activity-time')?.textContent || '';
    const titleElement = activityItem.querySelector('.activity-title');
    const title = titleElement ? titleElement.textContent.replace('💍', '').trim() : '';
    const locationElement = activityItem.querySelector('.activity-location span');
    const location = locationElement ? locationElement.textContent : '';
    const notesElement = activityItem.querySelector('.activity-notes');
    const notes = notesElement ? notesElement.textContent : '';
    const isProposal = activityItem.classList.contains('proposal-activity');

    // Populate edit form
    document.getElementById('edit-activity-id').value = activityId;
    document.getElementById('edit-activity-day').value = day;
    document.getElementById('edit-activity-time').value = time;
    document.getElementById('edit-activity-name').value = title;
    document.getElementById('edit-activity-location').value = location;
    document.getElementById('edit-activity-notes').value = notes;
    document.getElementById('edit-is-proposal').checked = isProposal;

    openModal('edit-activity-modal');
}

// =============================================================================
// ACTIVITY COMPLETION TOGGLE
// =============================================================================
function toggleActivityComplete(item) {
    const activityId = item.dataset.activityId;
    const checkbox = item.querySelector('.activity-checkbox input[type="checkbox"]');
    const isCompleted = checkbox.checked;

    // Update UI immediately for better UX
    item.dataset.completed = isCompleted;
    if (isCompleted) {
        item.classList.add('completed');
    } else {
        item.classList.remove('completed');
    }

    updateAllProgress(); // Update progress immediately

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
            showNotification(`Activity ${isCompleted ? 'completed' : 'reopened'}`, 'success');
        } else {
            // Revert on error
            checkbox.checked = !isCompleted;
            item.dataset.completed = !isCompleted;
            item.classList.toggle('completed', !isCompleted);
            showNotification(data.error || 'Failed to update activity', 'error');
            updateAllProgress();
        }
    })
    .catch(error => {
        console.error('Error updating activity:', error);
        checkbox.checked = !isCompleted;
        item.dataset.completed = !isCompleted;
        item.classList.toggle('completed', !isCompleted);
        showNotification('Error updating activity', 'error');
        updateAllProgress();
    });
}

// =============================================================================
// INLINE EDITING
// =============================================================================
function makeElementEditable(element) {
    if (element.classList.contains('editing')) return;

    const originalValue = element.textContent.trim().replace('💍', '').trim();
    const field = element.dataset.field;
    const activityId = element.dataset.itemId;

    element.classList.add('editing');
    element.contentEditable = true;
    element.textContent = originalValue; // Remove any icons temporarily
    element.focus();

    // Select all text
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    function finishEditing() {
        const newValue = element.textContent.trim();
        element.classList.remove('editing');
        element.contentEditable = false;

        if (newValue !== originalValue && newValue !== '') {
            updateActivityField(activityId, field, newValue, element, originalValue);
        } else {
            // Restore original value and any icons
            restoreElementContent(element, originalValue);
        }
    }

    element.addEventListener('blur', finishEditing);
    element.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            finishEditing();
        }
        if (e.key === 'Escape') {
            element.textContent = originalValue;
            finishEditing();
        }
    });
}

function restoreElementContent(element, value) {
    const activityItem = element.closest('.activity-item');
    const isProposal = activityItem && activityItem.classList.contains('proposal-activity');

    if (element.classList.contains('activity-title') && isProposal) {
        element.innerHTML = value + ' <span class="proposal-indicator">💍</span>';
    } else {
        element.textContent = value;
    }
}

function updateActivityField(activityId, field, value, element, originalValue) {
    const data = {
        id: parseInt(activityId),
        field: field,
        value: value
    };

    fetch('/api/itinerary/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Activity updated', 'success');
            restoreElementContent(element, value);
        } else {
            showNotification('Failed to update activity', 'error');
            restoreElementContent(element, originalValue);
        }
    })
    .catch(error => {
        console.error('Update error:', error);
        showNotification('Failed to update activity', 'error');
        restoreElementContent(element, originalValue);
    });
}

// =============================================================================
// DELETE ACTIVITY
// =============================================================================
function deleteActivity(button) {
    const item = button.closest('.activity-item');
    if (!item) return;

    if (!confirm('Are you sure you want to delete this activity?')) {
        return;
    }

    const activityId = item.dataset.activityId;

    // Visual feedback
    item.style.opacity = '0.5';
    item.style.pointerEvents = 'none';

    fetch(`/api/itinerary/delete/${activityId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Remove from DOM with animation
            item.style.transition = 'all 0.3s ease';
            item.style.transform = 'translateX(-100%)';

            setTimeout(() => {
                item.remove();
                updateAllProgress();
                updateActivityCounts();
            }, 300);

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
    const data = {
        day: parseInt(formData.get('day')),
        time: formData.get('time'),
        activity: formData.get('activity'),
        location: formData.get('location') || '',
        notes: formData.get('notes') || '',
        isProposal: formData.get('isProposal') === 'on'
    };

    // Validate required fields
    if (!data.time || !data.activity) {
        showNotification('Time and activity name are required', 'error');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Adding...';
    submitBtn.disabled = true;

    fetch('/api/itinerary/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(response => {
        if (response.success) {
            addActivityToDay(response.itinerary_item);
            closeModal('add-activity-modal');
            e.target.reset();
            showNotification('Activity added successfully', 'success');
        } else {
            showNotification(response.error || 'Failed to add activity', 'error');
        }
    })
    .catch(error => {
        console.error('Error adding activity:', error);
        showNotification('Error adding activity', 'error');
    })
    .finally(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
}

function handleEditActivity(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = {
        id: parseInt(formData.get('id')),
        day: parseInt(formData.get('day')),
        time: formData.get('time'),
        activity: formData.get('activity'),
        location: formData.get('location') || '',
        notes: formData.get('notes') || '',
        isProposal: formData.get('isProposal') === 'on'
    };

    // Validate required fields
    if (!data.time || !data.activity) {
        showNotification('Time and activity name are required', 'error');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;

    fetch('/api/itinerary/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(response => {
        if (response.success) {
            updateActivityInDay(data);
            closeModal('edit-activity-modal');
            showNotification('Activity updated successfully', 'success');
        } else {
            showNotification(response.error || 'Failed to update activity', 'error');
        }
    })
    .catch(error => {
        console.error('Error updating activity:', error);
        showNotification('Error updating activity', 'error');
    })
    .finally(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
}

// =============================================================================
// DOM MANIPULATION
// =============================================================================
function addActivityToDay(activityData) {
    const dayList = document.querySelector(`.activities-list[data-day="${activityData.day}"]`);
    if (!dayList) return;

    const activityItem = createActivityItem(activityData);

    // Insert in correct time order
    const existingItems = dayList.querySelectorAll('.activity-item');
    let inserted = false;

    for (let item of existingItems) {
        const itemTime = item.querySelector('.activity-time')?.textContent || '00:00';
        if (activityData.time < itemTime) {
            dayList.insertBefore(activityItem, item);
            inserted = true;
            break;
        }
    }

    if (!inserted) {
        dayList.appendChild(activityItem);
    }

    setupActivityEvents(activityItem);
    updateAllProgress();
    updateActivityCounts();
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

    updateAllProgress();
    updateActivityCounts();
}

function createActivityItem(activity) {
    const item = document.createElement('div');
    item.className = `activity-item ${activity.isProposal ? 'proposal-activity' : ''}`;
    item.dataset.activityId = activity.id;
    item.dataset.completed = activity.completed ? 'true' : 'false';

    const proposalIndicator = activity.isProposal ? '<span class="proposal-indicator">💍</span>' : '';
    const locationHtml = activity.location ? `
        <div class="activity-location">
            <i class="fas fa-map-marker-alt"></i>
            <span class="editable-text" data-field="location" data-item-id="${activity.id}">${activity.location}</span>
        </div>
    ` : '';

    const notesHtml = activity.notes ? `
        <div class="activity-notes editable-text" data-field="notes" data-item-id="${activity.id}">
            ${activity.notes}
        </div>
    ` : '';

    item.innerHTML = `
        <div class="activity-checkbox">
            <input type="checkbox" ${activity.completed ? 'checked' : ''}>
        </div>

        <div class="activity-content">
            <div class="activity-time">${activity.time}</div>
            <div class="activity-details">
                <h4 class="activity-title editable-text" data-field="activity" data-item-id="${activity.id}">
                    ${activity.activity}${proposalIndicator}
                </h4>
                ${locationHtml}
                ${notesHtml}
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
    if (timeElement) {
        timeElement.textContent = activityData.time;
    }

    // Update title
    const titleElement = item.querySelector('.activity-title');
    if (titleElement) {
        const proposalIndicator = activityData.isProposal ? '<span class="proposal-indicator">💍</span>' : '';
        titleElement.innerHTML = activityData.activity + proposalIndicator;
        titleElement.dataset.itemId = activityData.id;
    }

    // Update or create location
    let locationElement = item.querySelector('.activity-location span');
    const locationContainer = item.querySelector('.activity-location');

    if (activityData.location) {
        if (locationElement) {
            locationElement.textContent = activityData.location;
        } else {
            // Create location element
            const detailsContainer = item.querySelector('.activity-details');
            const locationDiv = document.createElement('div');
            locationDiv.className = 'activity-location';
            locationDiv.innerHTML = `
                <i class="fas fa-map-marker-alt"></i>
                <span class="editable-text" data-field="location" data-item-id="${activityData.id}">${activityData.location}</span>
            `;
            detailsContainer.appendChild(locationDiv);
        }
    } else if (locationContainer) {
        locationContainer.remove();
    }

    // Update or create notes
    let notesElement = item.querySelector('.activity-notes');

    if (activityData.notes) {
        if (notesElement) {
            notesElement.textContent = activityData.notes;
        } else {
            // Create notes element
            const detailsContainer = item.querySelector('.activity-details');
            const notesDiv = document.createElement('div');
            notesDiv.className = 'activity-notes editable-text';
            notesDiv.dataset.field = 'notes';
            notesDiv.dataset.itemId = activityData.id;
            notesDiv.textContent = activityData.notes;
            detailsContainer.appendChild(notesDiv);
        }
    } else if (notesElement) {
        notesElement.remove();
    }

    // Update proposal class
    if (activityData.isProposal) {
        item.classList.add('proposal-activity');
    } else {
        item.classList.remove('proposal-activity');
    }
}

// =============================================================================
// PROGRESS TRACKING
// =============================================================================
function updateAllProgress() {
    const days = document.querySelectorAll('.day-card');

    days.forEach(dayCard => {
        const dayNumber = dayCard.dataset.day;
        const activitiesInDay = dayCard.querySelectorAll('.activity-item');
        const completedInDay = dayCard.querySelectorAll('.activity-item[data-completed="true"]');

        const total = activitiesInDay.length;
        const completed = completedInDay.length;
        const percentage = total > 0 ? (completed / total) * 100 : 0;

        // Update progress bar
        const progressFill = dayCard.querySelector('.day-progress-fill');
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }

        // Update completion text
        const completionText = dayCard.querySelector('.day-completion');
        if (completionText) {
            completionText.textContent = `${completed}/${total}`;
        }
    });

    // Update overall progress
    updateOverallProgress();
}

function updateOverallProgress() {
    const allActivities = document.querySelectorAll('.activity-item');
    const completedActivities = document.querySelectorAll('.activity-item[data-completed="true"]');

    const total = allActivities.length;
    const completed = completedActivities.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    // Update overall progress if element exists
    const overallProgress = document.querySelector('.overall-progress-fill');
    if (overallProgress) {
        overallProgress.style.width = `${percentage}%`;
    }

    const overallText = document.querySelector('.overall-completion');
    if (overallText) {
        overallText.textContent = `${completed}/${total} Activities Complete`;
    }
}

function updateActivityCounts() {
    // Update any activity count displays
    const totalActivities = document.querySelectorAll('.activity-item').length;
    const countElements = document.querySelectorAll('.activity-count');

    countElements.forEach(element => {
        element.textContent = totalActivities;
    });
}

// =============================================================================
// NOTIFICATION SYSTEM
// =============================================================================
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Add styles if notification container doesn't exist
    let container = document.querySelector('.notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 12px;
            pointer-events: none;
        `;
        document.body.appendChild(container);

        // Add notification styles to head
        if (!document.getElementById('notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    background: white;
                    border-radius: 8px;
                    padding: 16px;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                    border: 1px solid #e5e7eb;
                    border-left: 4px solid;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    min-width: 300px;
                    transform: translateX(400px);
                    animation: slideInRight 0.3s ease-out forwards;
                    pointer-events: all;
                }
                .notification-success { border-left-color: #10b981; }
                .notification-error { border-left-color: #ef4444; }
                .notification-warning { border-left-color: #f59e0b; }
                .notification-info { border-left-color: #3b82f6; }
                .notification-content { display: flex; align-items: center; gap: 8px; flex: 1; font-size: 14px; }
                .notification-success .notification-content i { color: #10b981; }
                .notification-error .notification-content i { color: #ef4444; }
                .notification-warning .notification-content i { color: #f59e0b; }
                .notification-info .notification-content i { color: #3b82f6; }
                .notification-close {
                    background: none; border: none; cursor: pointer; color: #9ca3af;
                    padding: 4px; border-radius: 4px; transition: all 0.2s ease;
                }
                .notification-close:hover { background: rgba(0, 0, 0, 0.1); color: #374151; }
                @keyframes slideInRight {
                    from { transform: translateX(400px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(400px); opacity: 0; }
                }
            `;
            document.head.appendChild(styles);
        }
    }

    container.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease-out forwards';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}