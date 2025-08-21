// Family.js - Matching HERA Dashboard Design System

document.addEventListener('DOMContentLoaded', function() {
    initializeFamilyPage();
});

function initializeFamilyPage() {
    setupStatusSelects();
    setupEditButtons();
    setupModal();
    updateProgressBar();
}

function setupStatusSelects() {
    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', function() {
            updateMemberStatus(this);
        });
    });
}

function setupEditButtons() {
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const memberId = this.dataset.memberId;
            openEditModal(memberId);
        });
    });
}

function setupModal() {
    const modal = document.getElementById('edit-modal');
    const form = document.getElementById('edit-form');
    const closeButtons = document.querySelectorAll('.modal-close');

    // Close button handlers
    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    // Close on overlay click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        saveMemberChanges();
    });
}

function updateMemberStatus(selectElement) {
    const memberId = selectElement.dataset.memberId;
    const newStatus = selectElement.value;
    const card = selectElement.closest('.family-card');

    if (!card) return;

    // Show loading state
    card.classList.add('loading');

    // Store original status in case we need to revert
    const originalStatus = card.dataset.status;
    card.dataset.originalStatus = originalStatus;

    // FIXED: Make actual API call instead of setTimeout simulation
    fetch(`/api/family/update`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id: parseInt(memberId),
            field: 'status',
            value: newStatus
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update card status
            updateCardStatus(card, newStatus);

            // Update progress bar
            updateProgressBar();

            // Show success notification
            showNotification(`${card.querySelector('.member-name').textContent}'s status updated to ${newStatus}`, 'success');
        } else {
            // Revert the select dropdown on error
            selectElement.value = originalStatus.replace('-', ' ');
            showNotification('Failed to update family member status', 'error');
        }

        // Remove loading state
        card.classList.remove('loading');
    })
    .catch(error => {
        console.error('Error updating family status:', error);

        // Revert the select dropdown on error
        selectElement.value = originalStatus.replace('-', ' ');
        showNotification('Error updating family member', 'error');

        // Remove loading state
        card.classList.remove('loading');
    });
}

function updateCardStatus(card, status) {
    const statusKey = status.toLowerCase().replace(' ', '-');

    // Update card data attribute
    card.setAttribute('data-status', statusKey);

    // Update status indicator
    const statusIndicator = card.querySelector('.status-indicator');
    if (statusIndicator) {
        statusIndicator.className = `status-indicator status-${statusKey}`;
    }

    // Update status badge
    const statusBadge = card.querySelector('.status-badge');
    if (statusBadge) {
        statusBadge.className = `status-badge status-${statusKey}`;
        statusBadge.innerHTML = getStatusBadgeContent(status);
    }
}

function getStatusBadgeContent(status) {
    const statusMap = {
        'Approved': '<i class="fas fa-check-circle"></i><span>Approved</span>',
        'Pending': '<i class="fas fa-clock"></i><span>Pending</span>',
        'Declined': '<i class="fas fa-times-circle"></i><span>Declined</span>',
        'Not Asked': '<i class="fas fa-question-circle"></i><span>Not Asked</span>'
    };
    return statusMap[status] || statusMap['Not Asked'];
}

function openEditModal(memberId) {
    const card = document.querySelector(`[data-member-id="${memberId}"]`);
    if (!card) return;

    const modal = document.getElementById('edit-modal');

    // Get current member data
    const name = card.querySelector('.member-name').textContent.trim();
    const status = card.querySelector('.status-select').value;
    const notesElement = card.querySelector('.notes-text');
    const notes = notesElement ? notesElement.textContent.trim() : '';

    // Populate form
    document.getElementById('edit-member-id').value = memberId;
    document.getElementById('edit-name').value = name;
    document.getElementById('edit-status').value = status;
    document.getElementById('edit-notes').value = notes;

    // Show modal
    modal.classList.add('active');

    // Focus first input with small delay for animation
    setTimeout(() => {
        document.getElementById('edit-name').focus();
        document.getElementById('edit-name').select();
    }, 100);
}

function closeModal() {
    const modal = document.getElementById('edit-modal');
    modal.classList.remove('active');
}

function saveMemberChanges() {
    const form = document.getElementById('edit-form');
    const submitBtn = form.querySelector('button[type="submit"]');

    // Get form data
    const memberId = document.getElementById('edit-member-id').value;
    const name = document.getElementById('edit-name').value.trim();
    const status = document.getElementById('edit-status').value;
    const notes = document.getElementById('edit-notes').value.trim();

    // Validate
    if (!name) {
        showNotification('Name is required', 'error');
        document.getElementById('edit-name').focus();
        return;
    }

    // Show loading state
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitBtn.disabled = true;

    // REAL API CALL - Update all fields at once
    const updates = [
        { field: 'name', value: name },
        { field: 'status', value: status },
        { field: 'notes', value: notes }
    ];

    // Chain multiple update calls or use batch update
    Promise.all(updates.map(update =>
        fetch('/api/family/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: parseInt(memberId),
                field: update.field,
                value: update.value
            })
        }).then(response => response.json())
    ))
    .then(results => {
        const allSuccessful = results.every(result => result.success);

        if (allSuccessful) {
            // Update the UI
            const card = document.querySelector(`[data-member-id="${memberId}"]`);
            if (card) {
                // Update name
                const nameElement = card.querySelector('.member-name');
                if (nameElement) nameElement.textContent = name;

                // Update status
                updateCardStatus(card, status);
                const statusSelect = card.querySelector('.status-select');
                if (statusSelect) statusSelect.value = status;

                // Update notes
                let notesElement = card.querySelector('.notes-text');
                if (notes) {
                    if (!notesElement) {
                        // Create notes section if it doesn't exist
                        const notesContainer = document.createElement('div');
                        notesContainer.className = 'member-notes';
                        notesContainer.innerHTML = `
                            <div class="notes-content">
                                <i class="fas fa-quote-left"></i>
                                <p class="notes-text">${notes}</p>
                            </div>
                        `;
                        card.querySelector('.card-content').appendChild(notesContainer);
                    } else {
                        notesElement.textContent = notes;
                    }
                } else if (notesElement) {
                    // Remove notes section if empty
                    const notesContainer = notesElement.closest('.member-notes');
                    if (notesContainer) notesContainer.remove();
                }
            }

            updateProgressBar();
            showNotification('Family member updated successfully', 'success');
            closeModal();
        } else {
            showNotification('Failed to update family member', 'error');
        }
    })
    .catch(error => {
        console.error('Error updating family member:', error);
        showNotification('Error updating family member', 'error');
    })
    .finally(() => {
        // Restore button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
}

function updateMemberCard(memberId, data) {
    const card = document.querySelector(`[data-member-id="${memberId}"]`);
    if (!card) return;

    // Update name
    const nameElement = card.querySelector('.member-name');
    if (nameElement) {
        nameElement.textContent = data.name;
    }

    // Update status select
    const statusSelect = card.querySelector('.status-select');
    if (statusSelect) {
        statusSelect.value = data.status;
    }

    // Update card status styling
    updateCardStatus(card, data.status);

    // Update or create notes section
    const existingNotes = card.querySelector('.member-notes');
    if (data.notes && data.notes.trim()) {
        if (existingNotes) {
            // Update existing notes
            const notesText = existingNotes.querySelector('.notes-text');
            if (notesText) {
                notesText.textContent = data.notes;
            }
        } else {
            // Create new notes section
            const notesHTML = `
                <div class="member-notes">
                    <div class="notes-content">
                        <i class="fas fa-quote-left"></i>
                        <p class="notes-text">${data.notes}</p>
                    </div>
                </div>
            `;
            const memberFooter = card.querySelector('.member-footer');
            memberFooter.insertAdjacentHTML('beforebegin', notesHTML);
        }
    } else if (existingNotes) {
        // Remove notes section if no notes
        existingNotes.remove();
    }
}

function updateProgressBar() {
    const cards = document.querySelectorAll('.family-card');
    const approvedCards = document.querySelectorAll('.family-card[data-status="approved"]');

    const total = cards.length;
    const approved = approvedCards.length;
    const percentage = total > 0 ? (approved / total) * 100 : 0;

    // Update progress bar
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) {
        progressFill.style.width = `${percentage}%`;
    }

    // Update progress text
    const progressText = document.querySelector('.progress-text');
    if (progressText) {
        progressText.textContent = `${approved}/${total} Complete`;
    }
}

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
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Utility function to handle API errors
function handleApiError(error, defaultMessage = 'An error occurred') {
    console.error('API Error:', error);

    let message = defaultMessage;
    if (error.response && error.response.data && error.response.data.message) {
        message = error.response.data.message;
    } else if (error.message) {
        message = error.message;
    }

    showNotification(message, 'error');
}

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + S to save when modal is open
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        const modal = document.getElementById('edit-modal');
        if (modal && modal.classList.contains('active')) {
            e.preventDefault();
            const form = document.getElementById('edit-form');
            if (form) {
                saveMemberChanges();
            }
        }
    }
});

// Initialize tooltips if using a tooltip library
function initializeTooltips() {
    // This would initialize tooltips if you're using a library like Tippy.js
    // Example: tippy('[title]', { theme: 'light' });
}

// Export functions for testing or external use
window.FamilyPage = {
    updateMemberStatus,
    openEditModal,
    closeModal,
    saveMemberChanges,
    updateProgressBar,
    showNotification
};