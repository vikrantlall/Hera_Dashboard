// Family.js - Matching HERA Design System

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

    // Show loading state
    card.classList.add('loading');

    // Update card styling immediately for better UX
    updateCardStatus(card, newStatus);

    // Prepare data for API call
    const data = {
        id: memberId,
        status: newStatus
    };

    // Simulate API call (replace with actual fetch to your Flask route)
    setTimeout(() => {
        console.log('Status updated:', data);

        // Update progress and stats
        updateProgressBar();
        updateHeaderStats();

        // Remove loading state
        card.classList.remove('loading');

        // Show success notification
        showNotification('Status updated successfully', 'success');
    }, 800);

    // TODO: Replace setTimeout with actual API call:
    /*
    fetch('/api/family/update-status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updateProgressBar();
            updateHeaderStats();
            showNotification('Status updated successfully', 'success');
        } else {
            throw new Error(data.message || 'Update failed');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Failed to update status', 'error');
        // Revert the select value
        selectElement.value = card.dataset.originalStatus;
        updateCardStatus(card, card.dataset.originalStatus);
    })
    .finally(() => {
        card.classList.remove('loading');
    });
    */
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

    // Focus first input
    setTimeout(() => {
        document.getElementById('edit-name').focus();
        document.getElementById('edit-name').select();
    }, 300);
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
        console.log('Member updated:', data);

        // Update the card in DOM
        updateMemberCard(memberId, data);

        // Update progress and stats
        updateProgressBar();
        updateHeaderStats();

        // Close modal
        closeModal();

        // Show success
        showNotification('Family member updated successfully', 'success');

        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }, 1000);

    // TODO: Replace with actual API call
    /*
    fetch('/api/family/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updateMemberCard(memberId, data.member);
            updateProgressBar();
            updateHeaderStats();
            closeModal();
            showNotification('Family member updated successfully', 'success');
        } else {
            throw new Error(data.message || 'Update failed');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Failed to update family member', 'error');
    })
    .finally(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
    */
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

function updateHeaderStats() {
    const cards = document.querySelectorAll('.family-card');
    const approvedCards = document.querySelectorAll('.family-card[data-status="approved"]');

    const total = cards.length;
    const approved = approvedCards.length;

    // Update header stats
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length >= 2) {
        statNumbers[0].textContent = approved;
        statNumbers[1].textContent = total;
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;

    const iconMap = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-triangle',
        'warning': 'fa-exclamation-circle',
        'info': 'fa-info-circle'
    };

    const colorMap = {
        'success': '#10b981',
        'error': '#ef4444',
        'warning': '#f59e0b',
        'info': '#3b82f6'
    };

    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <i class="fas ${iconMap[type]}"></i>
            <span>${message}</span>
        </div>
    `;

    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 24px;
        right: 24px;
        background: ${colorMap[type]};
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
        z-index: 10000;
        font-weight: 500;
        font-size: 14px;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        min-width: 300px;
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Auto remove
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Utility function for CSRF token (if needed)
function getCSRFToken() {
    const token = document.querySelector('meta[name="csrf-token"]');
    return token ? token.getAttribute('content') : '';
}