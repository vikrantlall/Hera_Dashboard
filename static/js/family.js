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

    // Simulate API call delay
    setTimeout(() => {
        // Update card status
        updateCardStatus(card, newStatus);

        // Update progress bar
        updateProgressBar();

        // Show success notification
        showNotification(`${card.querySelector('.member-name').textContent}'s status updated to ${newStatus}`, 'success');

        // Remove loading state
        card.classList.remove('loading');
    }, 500);
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

    const data = {
        id: memberId,
        name: name,
        status: status,
        notes: notes
    };

    // Simulate API call
    setTimeout(() => {
        try {
            // Update the card with new data
            updateMemberCard(memberId, data);

            // Update progress bar
            updateProgressBar();

            // Show success message
            showNotification('Member details updated successfully', 'success');

            // Close modal
            closeModal();
        } catch (error) {
            console.error('Error updating member:', error);
            showNotification('Failed to update member details', 'error');
        } finally {
            // Reset button state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }, 800);
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