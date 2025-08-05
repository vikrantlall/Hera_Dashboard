// Itinerary JavaScript functionality - FIXED VERSION
// Day-by-day activity management, timeline view, and progress tracking

document.addEventListener('DOMContentLoaded', function() {
    initializeItinerary();
    setupActivityManagement();
    setupViewToggling();
    updateDayProgress();
});

function initializeItinerary() {
    console.log('Initializing itinerary page...');

    // Setup all itinerary functionality
    setupActivityItems();
    setupInlineEditing();
    setupFiltering();
    setupProgressTracking();

    console.log('Itinerary page initialized successfully');
}

// Activity Management - FIXED
function setupActivityManagement() {
    // Setup activity completion toggles
    const activityItems = document.querySelectorAll('.activity-item');
    activityItems.forEach(item => {
        setupActivityEvents(item);
    });

    // Setup add activity form
    const addForm = document.getElementById('add-activity-form');
    if (addForm) {
        addForm.addEventListener('submit', handleAddActivity);
    }

    // Setup edit activity form
    const editForm = document.getElementById('edit-activity-form');
    if (editForm) {
        editForm.addEventListener('submit', handleEditActivity);
    }
}

function setupActivityEvents(activityItem) {
    const activityId = activityItem.dataset.activityId;

    // Complete button
    const completeBtn = activityItem.querySelector('.complete-btn');
    if (completeBtn) {
        completeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleActivityComplete(activityItem);
        });
    }

    // Edit button
    const editBtn = activityItem.querySelector('.edit-btn');
    if (editBtn) {
        editBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            openEditActivityModal(activityItem);
        });
    }

    // Delete button
    const deleteBtn = activityItem.querySelector('.delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            deleteActivity(activityItem);
        });
    }

    // Checkbox in list view
    const checkbox = activityItem.querySelector('.activity-checkbox');
    if (checkbox) {
        checkbox.addEventListener('change', function() {
            toggleActivityComplete(activityItem, this.checked);
        });
    }
}

// Activity Completion - FIXED
function toggleActivityComplete(activityElement, forceState = null) {
    let activityItem;

    // Handle different element types
    if (activityElement.classList.contains('activity-item') || activityElement.classList.contains('list-activity-item')) {
        activityItem = activityElement;
    } else {
        activity_item = activityElement.closest('.activity-item, .list-activity-item');
    }

    if (!activityItem) return;

    const activityId = activityItem.dataset.activityId;
    const currentCompleted = activityItem.dataset.completed === 'true';
    const newCompleted = forceState !== null ? forceState : !currentCompleted;

    // Update UI
    activityItem.dataset.completed = newCompleted;
    activityItem.classList.toggle('completed', newCompleted);

    // Update button states
    const completeBtn = activityItem.querySelector('.complete-btn');
    const checkbox = activityItem.querySelector('.activity-checkbox');

    if (completeBtn) {
        const icon = completeBtn.querySelector('i');
        if (newCompleted) {
            icon.className = 'fas fa-check-circle';
            completeBtn.classList.add('completed');
            completeBtn.title = 'Mark Incomplete';
        } else {
            icon.className = 'fas fa-check';
            completeBtn.classList.remove('completed');
            completeBtn.title = 'Mark Complete';
        }
    }

    if (checkbox) {
        checkbox.checked = newCompleted;
    }

    // Update progress
    updateDayProgress();
    updateOverallProgress();

    // Save to backend
    if (activityId) {
        saveActivityCompletion(activityId, newCompleted);
    }

    // Show celebration for proposal activity
    if (newCompleted && activityItem.classList.contains('proposal-activity')) {
        showProposalCelebration();
    }
}

function saveActivityCompletion(activityId, completed) {
    fetch(`/api/itinerary/${activityId}/complete`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed })
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            console.error('Failed to save completion status:', data.error);
            showNotification('Failed to save completion status', 'error');
        }
    })
    .catch(error => {
        console.error('Error saving completion:', error);
        showNotification('Error saving completion status', 'error');
    });
}

// Progress Tracking - FIXED
function updateDayProgress() {
    const days = [1, 2, 3];

    days.forEach(day => {
        const dayActivities = document.querySelectorAll(`[data-day="${day}"]`);
        const completedActivities = document.querySelectorAll(`[data-day="${day}"][data-completed="true"]`);

        const total = dayActivities.length;
        const completed = completedActivities.length;
        const percentage = total > 0 ? (completed / total) * 100 : 0;

        // Update day progress bar
        const progressFill = document.querySelector(`.day-progress-fill[data-day="${day}"]`);
        const progressText = document.querySelector(`.day-progress-text[data-day="${day}"]`);

        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }

        if (progressText) {
            progressText.textContent = `${completed}/${total}`;
        }

        // Update day block completion state
        const dayBlock = document.querySelector(`.day-block[data-day="${day}"]`);
        if (dayBlock) {
            dayBlock.classList.toggle('day-complete', percentage === 100);
        }
    });
}

function updateOverallProgress() {
    const allActivities = document.querySelectorAll('.activity-item, .list-activity-item');
    const completedActivities = document.querySelectorAll('[data-completed="true"]');

    const total = allActivities.length;
    const completed = completedActivities.length;

    // Update header stats
    const completedCount = document.getElementById('completed-count');
    if (completedCount) {
        completedCount.textContent = completed;
    }

    // Update overall progress if there's a progress bar
    const overallProgress = document.querySelector('.overall-progress-fill');
    if (overallProgress) {
        const percentage = total > 0 ? (completed / total) * 100 : 0;
        overallProgress.style.width = `${percentage}%`;
    }
}

// View Toggling - FIXED
function setupViewToggling() {
    const viewToggle = document.getElementById('view-toggle');
    if (viewToggle) {
        viewToggle.addEventListener('click', toggleView);
    }

    // Setup list view filters
    setupListFilters();
}

function toggleView() {
    const timelineView = document.getElementById('timeline-view');
    const listView = document.getElementById('list-view');
    const toggleBtn = document.getElementById('view-toggle');

    if (!timelineView || !listView || !toggleBtn) return;

    const isTimelineVisible = timelineView.style.display !== 'none';

    if (isTimelineVisible) {
        // Switch to list view
        timelineView.style.display = 'none';
        listView.style.display = 'block';

        toggleBtn.innerHTML = '<i class="fas fa-calendar-alt"></i><span>Timeline View</span>';
    } else {
        // Switch to timeline view
        timelineView.style.display = 'block';
        listView.style.display = 'none';

        toggleBtn.innerHTML = '<i class="fas fa-list"></i><span>List View</span>';
    }

    // Update progress after view switch
    setTimeout(updateDayProgress, 100);
}

function setupListFilters() {
    const dayFilter = document.getElementById('day-filter');
    const statusFilter = document.getElementById('status-filter');
    const searchInput = document.getElementById('search-activities');

    if (dayFilter) {
        dayFilter.addEventListener('change', filterActivities);
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', filterActivities);
    }

    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterActivities, 300));
    }
}

function filterActivities() {
    const dayFilter = document.getElementById('day-filter')?.value || 'all';
    const statusFilter = document.getElementById('status-filter')?.value || 'all';
    const searchTerm = document.getElementById('search-activities')?.value?.toLowerCase() || '';

    const listActivities = document.querySelectorAll('.list-activity-item');

    listActivities.forEach(activity => {
        const day = activity.dataset.day;
        const completed = activity.dataset.completed === 'true';
        const title = activity.querySelector('.list-activity-title')?.textContent?.toLowerCase() || '';
        const location = activity.querySelector('.list-activity-location span')?.textContent?.toLowerCase() || '';

        let shouldShow = true;

        // Day filter
        if (dayFilter !== 'all' && day !== dayFilter) {
            shouldShow = false;
        }

        // Status filter
        if (statusFilter !== 'all') {
            if (statusFilter === 'completed' && !completed) shouldShow = false;
            if (statusFilter === 'pending' && completed) shouldShow = false;
        }

        // Search filter
        if (searchTerm && !title.includes(searchTerm) && !location.includes(searchTerm)) {
            shouldShow = false;
        }

        activity.style.display = shouldShow ? 'flex' : 'none';
    });
}

// Modal Management - FIXED
function openAddActivityModal() {
    const modal = document.getElementById('add-activity-modal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('modal-show');

        // Focus first input
        const firstInput = modal.querySelector('input, select');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

function openEditActivityModal(activityElement) {
    const modal = document.getElementById('edit-activity-modal');
    if (!modal) return;

    const activityId = activityElement.dataset.activityId;
    const day = activityElement.dataset.day;

    // Get activity data from the element
    const title = activityElement.querySelector('.activity-title, .list-activity-title')?.textContent?.trim() || '';
    const location = activityElement.querySelector('.activity-location span, .list-activity-location span')?.textContent?.trim() || '';
    const notes = activityElement.querySelector('.activity-notes p, .list-activity-notes p')?.textContent?.trim() || '';
    const timeRange = activityElement.querySelector('.time-range, .activity-time')?.textContent?.trim() || '';
    const isProposal = activityElement.classList.contains('proposal-activity');

    // Populate form
    document.getElementById('edit-activity-id').value = activityId;
    document.getElementById('edit-activity-day').value = day;
    document.getElementById('edit-activity-time').value = timeRange;
    document.getElementById('edit-activity-title').value = title;
    document.getElementById('edit-activity-location').value = location;
    document.getElementById('edit-activity-notes').value = notes;
    document.getElementById('edit-is-proposal').checked = isProposal;

    modal.style.display = 'flex';
    modal.classList.add('modal-show');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('modal-show');
    }
}

// Form Handlers - FIXED
function handleAddActivity(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const activityData = {
        day: parseInt(formData.get('day')),
        time_range: formData.get('time_range'),
        activity: formData.get('activity'),
        location: formData.get('location'),
        notes: formData.get('notes'),
        isProposal: formData.get('isProposal') === 'on'
    };

    // Add to UI
    addActivityToUI(activityData);

    // Close modal and reset form
    closeModal('add-activity-modal');
    e.target.reset();

    // Save to backend
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
            showNotification('Activity added successfully!', 'success');

            // Update the activity with server ID
            const newActivity = document.querySelector('[data-activity-id="temp"]');
            if (newActivity && data.id) {
                newActivity.dataset.activityId = data.id;
            }
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
    const activityId = formData.get('id') || document.getElementById('edit-activity-id').value;

    const activityData = {
        day: parseInt(formData.get('day')),
        time_range: formData.get('time_range'),
        activity: formData.get('activity'),
        location: formData.get('location'),
        notes: formData.get('notes'),
        isProposal: formData.get('isProposal') === 'on'
    };

    // Update UI
    updateActivityInUI(activityId, activityData);

    // Close modal
    closeModal('edit-activity-modal');

    // Save to backend
    fetch(`/api/itinerary/${activityId}/update`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Activity updated successfully!', 'success');
        } else {
            showNotification(data.error || 'Failed to update activity', 'error');
        }
    })
    .catch(error => {
        console.error('Error updating activity:', error);
        showNotification('Error updating activity', 'error');
    });
}

function deleteActivity(activityElement) {
    if (!confirm('Are you sure you want to delete this activity?')) {
        return;
    }

    const activityId = activityElement.dataset.activityId;

    // Fade out
    activityElement.style.opacity = '0.5';

    // Delete from backend
    fetch(`/api/itinerary/${activityId}/delete`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            activityElement.remove();
            updateDayProgress();
            updateOverallProgress();
            showNotification('Activity deleted successfully', 'success');
        } else {
            activityElement.style.opacity = '1';
            showNotification('Failed to delete activity', 'error');
        }
    })
    .catch(error => {
        activityElement.style.opacity = '1';
        console.error('Error deleting activity:', error);
        showNotification('Error deleting activity', 'error');
    });
}

// UI Updates - FIXED
function addActivityToUI(activityData) {
    const dayBlock = document.querySelector(`.day-block[data-day="${activityData.day}"]`);
    if (!dayBlock) return;

    const activitiesContainer = dayBlock.querySelector('.day-activities');
    if (!activitiesContainer) return;

    const activityElement = createActivityElement(activityData, 'temp');
    activitiesContainer.appendChild(activityElement);

    // Add to list view as well
    addActivityToListView(activityData, 'temp');

    // Update progress
    updateDayProgress();
    updateOverallProgress();
}

function updateActivityInUI(activityId, activityData) {
    const timelineActivity = document.querySelector(`.activity-item[data-activity-id="${activityId}"]`);
    const listActivity = document.querySelector(`.list-activity-item[data-activity-id="${activityId}"]`);

    if (timelineActivity) {
        updateActivityElement(timelineActivity, activityData);
    }

    if (listActivity) {
        updateListActivityElement(listActivity, activityData);
    }

    // Check if day changed - if so, move the activity
    if (timelineActivity && timelineActivity.dataset.day !== activityData.day.toString()) {
        moveActivityToDay(timelineActivity, activityData.day);
    }

    updateDayProgress();
}

function createActivityElement(activityData, activityId) {
    const activityDiv = document.createElement('div');
    activityDiv.className = `activity-item ${activityData.isProposal ? 'proposal-activity' : ''}`;
    activityDiv.dataset.activityId = activityId;
    activityDiv.dataset.day = activityData.day;
    activityDiv.dataset.completed = 'false';

    activityDiv.innerHTML = `
        <div class="activity-time">
            <div class="time-display">
                <span class="time-range">${activityData.time_range || 'All Day'}</span>
            </div>
            ${activityData.isProposal ? `
                <div class="proposal-badge">
                    <i class="fas fa-heart"></i>
                    <span>THE MOMENT</span>
                </div>
            ` : ''}
        </div>

        <div class="activity-content">
            <div class="activity-main">
                <h4 class="activity-title" data-editable="activity">
                    ${activityData.activity}
                </h4>

                ${activityData.location ? `
                <div class="activity-location">
                    <i class="fas fa-map-marker-alt"></i>
                    <span data-editable="location">${activityData.location}</span>
                </div>
                ` : ''}

                ${activityData.notes ? `
                <div class="activity-notes">
                    <p data-editable="notes">${activityData.notes}</p>
                </div>
                ` : ''}
            </div>

            <div class="activity-actions">
                <button class="activity-action-btn complete-btn" onclick="toggleActivityComplete(this)" title="Mark Complete">
                    <i class="fas fa-check"></i>
                </button>
                <button class="activity-action-btn edit-btn" onclick="openEditActivityModal(this)" title="Edit Activity">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="activity-action-btn delete-btn" onclick="deleteActivity(this)" title="Delete Activity">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;

    setupActivityEvents(activityDiv);
    return activityDiv;
}

function addActivityToListView(activityData, activityId) {
    const listContainer = document.querySelector('.activities-list');
    if (!listContainer) return;

    const listElement = document.createElement('div');
    listElement.className = 'list-activity-item';
    listElement.dataset.activityId = activityId;
    listElement.dataset.day = activityData.day;
    listElement.dataset.completed = 'false';

    listElement.innerHTML = `
        <div class="list-activity-checkbox">
            <input type="checkbox" class="activity-checkbox" onchange="toggleActivityComplete(this)">
        </div>

        <div class="list-activity-content">
            <div class="list-activity-header">
                <h4 class="list-activity-title">${activityData.activity}</h4>
                <div class="list-activity-meta">
                    <span class="activity-day">Day ${activityData.day}</span>
                    <span class="activity-time">${activityData.time_range || 'All Day'}</span>
                </div>
            </div>

            ${activityData.location ? `
            <div class="list-activity-location">
                <i class="fas fa-map-marker-alt"></i>
                <span>${activityData.location}</span>
            </div>
            ` : ''}

            ${activityData.notes ? `
            <div class="list-activity-notes">
                <p>${activityData.notes}</p>
            </div>
            ` : ''}
        </div>

        <div class="list-activity-actions">
            <button class="activity-action-btn edit-btn" onclick="openEditActivityModal(this)" title="Edit">
                <i class="fas fa-edit"></i>
            </button>
            <button class="activity-action-btn delete-btn" onclick="deleteActivity(this)" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    listContainer.appendChild(listElement);
    setupActivityEvents(listElement);
}

// Inline Editing - FIXED
function setupInlineEditing() {
    const editableFields = document.querySelectorAll('[data-editable]');
    editableFields.forEach(field => {
        field.addEventListener('click', function() {
            if (!this.classList.contains('editing')) {
                startInlineEdit(this);
            }
        });
    });
}

function startInlineEdit(element) {
    const currentValue = element.textContent.trim();
    const fieldType = element.dataset.editable;

    element.classList.add('editing');

    let input;
    if (fieldType === 'notes') {
        input = document.createElement('textarea');
        input.rows = 2;
    } else {
        input = document.createElement('input');
        input.type = 'text';
    }

    input.value = currentValue;
    input.className = 'inline-edit-input';

    input.style.cssText = `
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid #d4af37;
        border-radius: 4px;
        padding: 6px 10px;
        color: white;
        font-size: inherit;
        font-family: inherit;
        width: 100%;
        resize: vertical;
    `;

    element.innerHTML = '';
    element.appendChild(input);
    input.focus();
    input.select();

    function saveEdit() {
        const newValue = input.value.trim();
        element.classList.remove('editing');
        element.textContent = newValue;

        // Save to backend
        saveInlineEdit(element, fieldType, newValue);
    }

    input.addEventListener('blur', saveEdit);
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            saveEdit();
        } else if (e.key === 'Escape') {
            element.classList.remove('editing');
            element.textContent = currentValue;
        }
    });
}

function saveInlineEdit(element, field, value) {
    const activityItem = element.closest('.activity-item, .list-activity-item');
    const activityId = activityItem?.dataset.activityId;

    if (!activityId) return;

    fetch(`/api/itinerary/${activityId}/update-field`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ field, value })
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            console.error('Failed to save inline edit:', data.error);
            showNotification('Failed to save changes', 'error');
        }
    })
    .catch(error => {
        console.error('Error saving inline edit:', error);
        showNotification('Error saving changes', 'error');
    });
}

// Special Effects - FIXED
function showProposalCelebration() {
    // Create celebration overlay
    const celebration = document.createElement('div');
    celebration.className = 'proposal-celebration';
    celebration.innerHTML = `
        <div class="celebration-content">
            <div class="celebration-icon">💍</div>
            <h2>THE MOMENT IS COMPLETE!</h2>
            <p>Congratulations on your engagement! 🎉</p>
            <div class="celebration-hearts">
                <span>💕</span>
                <span>❤️</span>
                <span>💖</span>
                <span>💕</span>
                <span>❤️</span>
            </div>
        </div>
    `;

    document.body.appendChild(celebration);

    setTimeout(() => celebration.classList.add('show'), 100);
    setTimeout(() => {
        celebration.classList.remove('show');
        setTimeout(() => celebration.remove(), 1000);
    }, 5000);
}

// Export Functions - FIXED
function exportItinerary() {
    const itineraryData = {
        trip: {
            title: 'Emerald Lake Adventure',
            dates: 'September 24-26, 2025',
            location: 'Emerald Lake, Canada'
        },
        activities: []
    };

    // Collect all activities
    const activities = document.querySelectorAll('.activity-item');
    activities.forEach(activity => {
        const data = {
            day: activity.dataset.day,
            time: activity.querySelector('.time-range')?.textContent || '',
            title: activity.querySelector('.activity-title')?.textContent || '',
            location: activity.querySelector('.activity-location span')?.textContent || '',
            notes: activity.querySelector('.activity-notes p')?.textContent || '',
            completed: activity.dataset.completed === 'true',
            isProposal: activity.classList.contains('proposal-activity')
        };

        itineraryData.activities.push(data);
    });

    // Create and download file
    const dataStr = JSON.stringify(itineraryData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'emerald-lake-itinerary.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('Itinerary exported successfully!', 'success');
}

// Utility Functions - FIXED
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Global function exports for onclick handlers
window.toggleActivityComplete = toggleActivityComplete;
window.openEditActivityModal = openEditActivityModal;
window.deleteActivity = deleteActivity;
window.openAddActivityModal = openAddActivityModal;
window.closeModal = closeModal;
window.toggleView = toggleView;
window.exportItinerary = exportItinerary;

// Export functions for global access
window.ItineraryManager = {
    updateProgress: updateDayProgress,
    toggleComplete: toggleActivityComplete,
    addActivity: addActivityToUI,
    refreshData: initializeItinerary
};