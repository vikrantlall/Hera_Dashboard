// Base JavaScript for HERA Dashboard
// Core functionality, modals, and utilities

// Global variables
let currentDeleteCallback = null;
let currentImageUploadType = null;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    setupInlineEditing();
});

function initializeApp() {
    console.log('HERA Dashboard initialized');

    // Setup drag and drop for file uploads
    setupFileUpload();

    // Setup tooltips
    setupTooltips();

    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
}

function setupEventListeners() {
    // Close modals when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            const modal = e.target;
            closeModal(modal.id);
        }
    });

    // ESC key to close modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal.show');
            if (openModal) {
                closeModal(openModal.id);
            }
        }
    });
}

// Modal Management
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';

        // Focus first input
        const firstInput = modal.querySelector('input, select, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';

        // Reset form if exists
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
    }
}

// Delete Confirmation
function confirmDelete(message, callback) {
    currentDeleteCallback = callback;

    const modal = document.getElementById('delete-modal');
    const modalBody = modal.querySelector('.modal-body p');
    modalBody.textContent = message;

    openModal('delete-modal');
}

function closeDeleteModal() {
    closeModal('delete-modal');
    currentDeleteCallback = null;
}

// Execute confirmed delete
document.addEventListener('DOMContentLoaded', function() {
    const confirmBtn = document.getElementById('confirm-delete-btn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            if (currentDeleteCallback) {
                currentDeleteCallback();
                closeDeleteModal();
            }
        });
    }
});

// Inline Editing System
function setupInlineEditing() {
    const editableElements = document.querySelectorAll('.editable-text, .editable-select');

    editableElements.forEach(element => {
        element.addEventListener('click', function() {
            if (!this.classList.contains('editing')) {
                startInlineEdit(this);
            }
        });
    });
}

function startInlineEdit(element) {
    const originalValue = element.textContent.trim();
    const field = element.dataset.field;
    const itemId = element.dataset.itemId;

    element.classList.add('editing');

    if (element.classList.contains('editable-select')) {
        // Create select dropdown
        const options = element.dataset.options.split('|');
        const select = document.createElement('select');
        select.className = 'inline-edit-select';

        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            if (option === originalValue) {
                optionElement.selected = true;
            }
            select.appendChild(optionElement);
        });

        element.innerHTML = '';
        element.appendChild(select);
        select.focus();

        function finishSelectEdit() {
            const newValue = select.value;
            element.textContent = newValue;
            element.classList.remove('editing');

            if (newValue !== originalValue) {
                saveInlineEdit(itemId, field, newValue, element);
            }
        }

        select.addEventListener('blur', finishSelectEdit);
        select.addEventListener('change', finishSelectEdit);

    } else {
        // Create text input
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'inline-edit-input';
        input.value = originalValue;

        element.innerHTML = '';
        element.appendChild(input);
        input.focus();
        input.select();

        function finishTextEdit() {
            const newValue = input.value.trim();
            element.textContent = newValue || originalValue;
            element.classList.remove('editing');

            if (newValue && newValue !== originalValue) {
                saveInlineEdit(itemId, field, newValue, element);
            }
        }

        input.addEventListener('blur', finishTextEdit);
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                finishTextEdit();
            } else if (e.key === 'Escape') {
                element.textContent = originalValue;
                element.classList.remove('editing');
            }
        });
    }
}

function saveInlineEdit(itemId, field, value, element) {
    // Show loading state
    element.style.opacity = '0.6';

    // Determine endpoint based on current page
    let endpoint = '/api/update-item';
    const currentPage = window.location.pathname;

    if (currentPage.includes('/budget')) {
        endpoint = '/api/budget/update';
    } else if (currentPage.includes('/ring')) {
        endpoint = '/api/ring/update';
    } else if (currentPage.includes('/family')) {
        endpoint = '/api/family/update';
    } else if (currentPage.includes('/travel')) {
        endpoint = '/api/travel/update';
    } else if (currentPage.includes('/itinerary')) {
        endpoint = '/api/itinerary/update';
    } else if (currentPage.includes('/packing')) {
        endpoint = '/api/packing/update';
    }

    fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id: itemId,
            field: field,
            value: value
        })
    })
    .then(response => response.json())
    .then(data => {
        element.style.opacity = '1';
        if (data.success) {
            showNotification('Changes saved successfully', 'success');
            element.classList.add('success');
            setTimeout(() => element.classList.remove('success'), 1000);
        } else {
            showNotification('Error saving changes: ' + data.error, 'error');
            element.classList.add('error');
            setTimeout(() => element.classList.remove('error'), 1000);
        }
    })
    .catch(error => {
        element.style.opacity = '1';
        console.error('Error:', error);
        showNotification('Error saving changes', 'error');
    });
}

// File Upload Management
function setupFileUpload() {
    const uploadAreas = document.querySelectorAll('.image-upload-area, .file-upload-area');

    uploadAreas.forEach(area => {
        area.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('dragover');
        });

        area.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
        });

        area.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');

            const files = e.dataTransfer.files;
            handleFileUpload(files, this);
        });

        // Click to upload
        area.addEventListener('click', function() {
            const input = this.querySelector('input[type="file"]');
            if (input) {
                input.click();
            }
        });
    });
}

function handleFileUpload(files, uploadArea) {
    const fileArray = Array.from(files);
    const uploadType = uploadArea.dataset.uploadType || 'general';

    // Validate files
    const validFiles = fileArray.filter(file => {
        if (uploadType === 'image') {
            return file.type.startsWith('image/');
        }
        return true; // Allow all files for general uploads
    });

    if (validFiles.length === 0) {
        showNotification('No valid files selected', 'warning');
        return;
    }

    // Show file previews
    showFilePreview(validFiles, uploadArea);
}

function showFilePreview(files, uploadArea) {
    let previewContainer = uploadArea.parentNode.querySelector('.file-preview, .image-preview-grid');

    if (!previewContainer) {
        previewContainer = document.createElement('div');
        previewContainer.className = 'file-preview';
        uploadArea.parentNode.appendChild(previewContainer);
    }

    files.forEach(file => {
        const previewItem = document.createElement('div');
        previewItem.className = 'file-preview-item';

        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.onload = () => URL.revokeObjectURL(img.src);
            previewItem.appendChild(img);
        } else {
            const icon = document.createElement('i');
            icon.className = 'fas fa-file';
            previewItem.appendChild(icon);
        }

        const fileName = document.createElement('div');
        fileName.className = 'file-name';
        fileName.textContent = file.name;
        previewItem.appendChild(fileName);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'file-remove';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.onclick = () => previewItem.remove();
        previewItem.appendChild(removeBtn);

        previewContainer.appendChild(previewItem);
    });
}

// Image Management
function openImageUpload(type) {
    currentImageUploadType = type;
    openModal('image-modal');
}

function closeImageModal() {
    closeModal('image-modal');
    currentImageUploadType = null;

    // Clear previews
    const previewGrid = document.getElementById('image-preview-grid');
    if (previewGrid) {
        previewGrid.innerHTML = '';
    }
}

// Notifications
function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Add to page
    let container = document.querySelector('.notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
    }

    container.appendChild(notification);

    // Auto remove
    if (duration > 0) {
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);
    }
}

// Tooltips
function setupTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');

    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            showTooltip(this, this.dataset.tooltip);
        });

        element.addEventListener('mouseleave', function() {
            hideTooltip();
        });
    });
}

function showTooltip(element, text) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip-popup';
    tooltip.textContent = text;

    document.body.appendChild(tooltip);

    const rect = element.getBoundingClientRect();
    tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
    tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
}

function hideTooltip() {
    const tooltip = document.querySelector('.tooltip-popup');
    if (tooltip) {
        tooltip.remove();
    }
}

// Keyboard Shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + S to save (prevent default and trigger save)
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            const openForm = document.querySelector('.modal.show form');
            if (openForm) {
                openForm.dispatchEvent(new Event('submit'));
            }
        }

        // Ctrl/Cmd + N to add new item
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            const addBtn = document.querySelector('.add-btn');
            if (addBtn) {
                addBtn.click();
            }
        }
    });
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));

    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

// Loading States
function setLoadingState(element, loading = true) {
    if (loading) {
        element.classList.add('loading');
        element.style.pointerEvents = 'none';
    } else {
        element.classList.remove('loading');
        element.style.pointerEvents = '';
    }
}

// AJAX Helper
function makeRequest(url, options = {}) {
    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    };

    const finalOptions = { ...defaultOptions, ...options };

    return fetch(url, finalOptions)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error('Request failed:', error);
            showNotification('Request failed: ' + error.message, 'error');
            throw error;
        });
}

// Form Validation
function validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('error');
            isValid = false;
        } else {
            field.classList.remove('error');
        }
    });

    return isValid;
}

// Animation Helpers
function animateElement(element, animation, duration = 300) {
    element.style.animation = `${animation} ${duration}ms ease`;

    return new Promise(resolve => {
        setTimeout(() => {
            element.style.animation = '';
            resolve();
        }, duration);
    });
}

// Local Storage Helpers (Note: These won't work in Claude artifacts but will work in your Flask app)
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.warn('Could not save to localStorage:', error);
    }
}

function loadFromLocalStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.warn('Could not load from localStorage:', error);
        return defaultValue;
    }
}

// Export Functions
window.HERA = {
    openModal,
    closeModal,
    confirmDelete,
    showNotification,
    formatCurrency,
    formatDate,
    formatTime,
    setLoadingState,
    makeRequest,
    validateForm,
    animateElement
};