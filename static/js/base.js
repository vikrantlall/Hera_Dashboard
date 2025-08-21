// Base JavaScript for HERA Dashboard
// Core functionality, modals, and utilities

// Global variables
let currentDeleteCallback = null;
let currentImageUploadType = null;

// Single initialization point
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    console.log('HERA Dashboard initialized');

    // Core setup
    setupEventListeners();
    setupInlineEditing();
    setupNavigation();
    setupFlashMessages();

    // File and upload management
    setupFileUpload();
    setupTooltips();
    setupKeyboardShortcuts();

    // Add styles for animations and auto-logout
    addMiniCountdownStyles();
    addAutoLogoutStyles();

    // Initialize countdown and auto-logout
    updateCountdown();
    window.autoLogout = new AutoLogout(1); // 1 minute timeout

    // Update countdown every minute
    setInterval(updateCountdown, 60000);
}

// =============================================================================
// EVENT LISTENERS & SETUP
// =============================================================================

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

    // Setup delete confirmation button
    const confirmBtn = document.getElementById('confirm-delete-btn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            if (currentDeleteCallback) {
                currentDeleteCallback();
                closeDeleteModal();
            }
        });
    }
}

function setupNavigation() {
    // Add active state management
    const navItems = document.querySelectorAll('.nav-item');
    const currentPath = window.location.pathname;

    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (currentPath === href || (currentPath === '/' && href.includes('dashboard'))) {
            item.classList.add('active');
        }
    });
}

function setupFlashMessages() {
    // Auto-hide flash messages after 5 seconds
    const flashMessages = document.querySelectorAll('.flash-message');

    flashMessages.forEach(message => {
        setTimeout(() => {
            message.style.transition = 'all 0.5s ease';
            message.style.opacity = '0';
            message.style.transform = 'translateX(100%)';

            setTimeout(() => {
                message.remove();
            }, 500);
        }, 5000);
    });
}

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

// =============================================================================
// DUAL-PHASE COUNTDOWN SYSTEM
// =============================================================================

function updateCountdown() {
    const countdownElement = document.getElementById('countdown-text');
    const countdownContainer = document.getElementById('countdown-mini');
    if (!countdownElement) return;

    // Trip and proposal dates
    const tripDate = new Date('2025-09-24T08:00:00-06:00');
    const proposalDate = new Date('2025-09-26T08:00:00-06:00');
    const tripEndDate = new Date('2025-09-29T23:59:59-06:00');
    const today = new Date();

    if (today < tripDate) {
        // Phase 1: Until trip departure
        const diffTime = tripDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        countdownElement.textContent = `${diffDays} days until trip`;

        // Style for trip phase
        if (countdownContainer) {
            countdownContainer.style.background = 'linear-gradient(135deg, var(--accent-gold), var(--secondary-gold))';
            countdownContainer.style.animation = 'none';
        }

    } else if (today >= tripDate && today < proposalDate) {
        // Phase 2: Until proposal moment
        const diffTime = proposalDate - today;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));

        // Format display based on time remaining
        if (diffDays > 0) {
            countdownElement.textContent = `${diffDays}d until proposal 💍`;
        } else if (diffHours > 0) {
            countdownElement.textContent = `${diffHours}h until proposal 💍`;
        } else if (diffMinutes > 0) {
            countdownElement.textContent = `${diffMinutes}m until proposal 💍`;
        } else {
            countdownElement.textContent = `Proposal time! 💍`;
        }

        // Style for proposal phase - red/pink with pulse animation
        if (countdownContainer) {
            countdownContainer.style.background = 'linear-gradient(135deg, #dc2626, #991b1b)';
            countdownContainer.style.animation = 'proposal-pulse 2s ease-in-out infinite';
        }

    } else if (today >= proposalDate && today < tripEndDate) {
        // Phase 3: Trip in progress, proposal happened
        countdownElement.textContent = 'Engaged! 💍🎉';

        // Style for engaged phase - green with celebration colors
        if (countdownContainer) {
            countdownContainer.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            countdownContainer.style.animation = 'celebration-glow 3s ease-in-out infinite';
        }

    } else {
        // Phase 4: Trip complete
        countdownElement.textContent = 'Mission Complete! ✅';

        // Style for completion phase
        if (countdownContainer) {
            countdownContainer.style.background = 'linear-gradient(135deg, #6366f1, #4f46e5)';
            countdownContainer.style.animation = 'none';
        }
    }
}

function addMiniCountdownStyles() {
    if (document.getElementById('mini-countdown-animations')) return;

    const style = document.createElement('style');
    style.id = 'mini-countdown-animations';
    style.textContent = `
        @keyframes proposal-pulse {
            0%, 100% {
                transform: scale(1);
                box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
            }
            50% {
                transform: scale(1.05);
                box-shadow: 0 4px 16px rgba(220, 38, 38, 0.5);
            }
        }

        @keyframes celebration-glow {
            0%, 100% {
                box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
            }
            50% {
                box-shadow: 0 4px 20px rgba(16, 185, 129, 0.6);
            }
        }

        .countdown-mini.proposal-phase i {
            animation: proposal-heartbeat 1.5s ease-in-out infinite;
        }

        @keyframes proposal-heartbeat {
            0%, 100% { transform: scale(1); }
            25% { transform: scale(1.3); }
            50% { transform: scale(1.1); }
            75% { transform: scale(1.4); }
        }
    `;

    document.head.appendChild(style);
}

// =============================================================================
// MODAL MANAGEMENT
// =============================================================================

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

function confirmDelete(message, callback) {
    currentDeleteCallback = callback;

    const modal = document.getElementById('delete-modal');
    if (modal) {
        const modalBody = modal.querySelector('.modal-body p');
        if (modalBody) {
            modalBody.textContent = message;
        }
        openModal('delete-modal');
    }
}

function closeDeleteModal() {
    closeModal('delete-modal');
    currentDeleteCallback = null;
}

// =============================================================================
// INLINE EDITING SYSTEM
// =============================================================================

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

// =============================================================================
// FILE UPLOAD MANAGEMENT
// =============================================================================

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

// =============================================================================
// AUTO-LOGOUT SYSTEM
// =============================================================================

class AutoLogout {
    constructor(timeoutMinutes = 1) {
        this.timeoutDuration = timeoutMinutes * 60 * 1000;
        this.warningTime = 10 * 1000;
        this.timer = null;
        this.warningTimer = null;
        this.warningShown = false;
        this.events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        this.init();
    }

    init() {
        // Only run if NOT on login page or games page
        if (window.location.pathname === '/login' || window.location.pathname === '/games') {
            return;
        }

        // Check if user has HERA access
        this.checkHERAAccess().then(hasAccess => {
            if (hasAccess) {
                this.startTimer();
                this.bindEvents();
                this.createWarningModal();
                this.startSessionCheck();
            }
        });
    }

    async checkHERAAccess() {
        try {
            const response = await fetch('/api/check-session');
            const data = await response.json();
            return data.hera_access || false;
        } catch (error) {
            return false;
        }
    }

    startTimer() {
        this.clearTimer();
        this.warningTimer = setTimeout(() => this.showWarning(), this.timeoutDuration - this.warningTime);
        this.timer = setTimeout(() => this.logout(), this.timeoutDuration);
    }

    clearTimer() {
        if (this.timer) clearTimeout(this.timer);
        if (this.warningTimer) clearTimeout(this.warningTimer);
        this.timer = null;
        this.warningTimer = null;
        this.hideWarning();
    }

    resetTimer() {
        this.startTimer();
    }

    bindEvents() {
        this.events.forEach(event => {
            document.addEventListener(event, () => this.resetTimer(), true);
        });
    }

    createWarningModal() {
        if (document.getElementById('auto-logout-warning')) return;

        const modal = document.createElement('div');
        modal.id = 'auto-logout-warning';
        modal.innerHTML = `
            <div class="auto-logout-overlay">
                <div class="auto-logout-modal">
                    <div class="auto-logout-icon">
                        <i class="fas fa-clock"></i>
                    </div>
                    <h3>Session Timeout Warning</h3>
                    <p>You will be automatically logged out in <span id="countdown">10</span> seconds due to inactivity.</p>
                    <div class="auto-logout-buttons">
                        <button id="stay-logged-in" class="btn-primary">
                            <i class="fas fa-hand-paper"></i>
                            Stay Logged In
                        </button>
                        <button id="logout-now" class="btn-secondary">
                            <i class="fas fa-sign-out-alt"></i>
                            Logout Now
                        </button>
                    </div>
                </div>
            </div>
        `;

        modal.style.display = 'none';
        document.body.appendChild(modal);

        document.getElementById('stay-logged-in').addEventListener('click', () => this.resetTimer());
        document.getElementById('logout-now').addEventListener('click', () => this.logout());
    }

    showWarning() {
        if (this.warningShown) return;

        this.warningShown = true;
        const modal = document.getElementById('auto-logout-warning');
        modal.style.display = 'block';

        let countdown = 10;
        const countdownEl = document.getElementById('countdown');

        const countdownTimer = setInterval(() => {
            countdown--;
            countdownEl.textContent = countdown;
            if (countdown <= 0) clearInterval(countdownTimer);
        }, 1000);
    }

    hideWarning() {
        this.warningShown = false;
        const modal = document.getElementById('auto-logout-warning');
        if (modal) modal.style.display = 'none';
    }

    async logout() {
        try {
            this.clearTimer();
            this.showLogoutMessage();
            setTimeout(() => {
                window.location.href = '/logout?auto=true';
            }, 1500);
        } catch (error) {
            window.location.href = '/logout?auto=true';
        }
    }

    showLogoutMessage() {
        const message = document.createElement('div');
        message.innerHTML = `
            <div class="auto-logout-overlay">
                <div class="auto-logout-modal logout-message">
                    <div class="auto-logout-icon">
                        <i class="fas fa-lock"></i>
                    </div>
                    <h3>Session Expired</h3>
                    <p>You have been automatically logged out due to inactivity.</p>
                    <div class="spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                        Redirecting...
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(message);
    }

    startSessionCheck() {
        setInterval(async () => {
            try {
                const response = await fetch('/api/check-session');
                const data = await response.json();

                if (!data.authenticated || !data.hera_access) {
                    window.location.href = '/logout?auto=true';
                }
                window.sessionCheckFailures = 0;

            } catch (error) {
                if (!window.sessionCheckFailures) window.sessionCheckFailures = 0;
                window.sessionCheckFailures++;

                if (window.sessionCheckFailures >= 5) {
                    window.location.href = '/logout?auto=true';
                }
            }
        }, 30000);
    }
}

function addAutoLogoutStyles() {
    if (document.getElementById('auto-logout-styles')) return;

    const style = document.createElement('style');
    style.id = 'auto-logout-styles';
    style.textContent = `
        .auto-logout-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            backdrop-filter: blur(5px);
        }

        .auto-logout-modal {
            background: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            max-width: 400px;
            margin: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
            from { opacity: 0; transform: translateY(-50px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .auto-logout-icon {
            font-size: 48px;
            color: #ff6b35;
            margin-bottom: 20px;
        }

        .auto-logout-modal h3 {
            margin: 0 0 15px 0;
            color: #2c3e50;
            font-size: 24px;
            font-weight: 600;
        }

        .auto-logout-modal p {
            margin: 0 0 25px 0;
            color: #666;
            font-size: 16px;
            line-height: 1.5;
        }

        .auto-logout-buttons {
            display: flex;
            gap: 15px;
            justify-content: center;
        }

        .auto-logout-buttons button {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s ease;
        }

        .btn-primary {
            background: #007bff;
            color: white;
        }

        .btn-primary:hover {
            background: #0056b3;
            transform: translateY(-2px);
        }

        .btn-secondary {
            background: #6c757d;
            color: white;
        }

        .btn-secondary:hover {
            background: #545b62;
            transform: translateY(-2px);
        }

        .logout-message {
            background: #f8f9fa;
            border: 2px solid #dee2e6;
        }

        .logout-message .auto-logout-icon {
            color: #28a745;
        }

        .spinner {
            margin-top: 20px;
            color: #007bff;
            font-size: 14px;
        }

        #countdown {
            font-weight: bold;
            color: #dc3545;
            font-size: 18px;
        }
    `;

    document.head.appendChild(style);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function showNotification(message, type = 'info', duration = 3000) {
    const flashContainer = document.querySelector('.flash-messages') || createFlashContainer();

    const notification = document.createElement('div');
    notification.className = `flash-message flash-${type}`;
    notification.innerHTML = `
        ${message}
        <button class="flash-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    flashContainer.appendChild(notification);

    if (duration > 0) {
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.transition = 'all 0.5s ease';
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 500);
            }
        }, duration);
    }
}

function createFlashContainer() {
    const container = document.createElement('div');
    container.className = 'flash-messages';

    const pageContent = document.querySelector('.page-content');
    if (pageContent) {
        pageContent.insertBefore(container, pageContent.firstChild);
    } else {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.insertBefore(container, mainContent.firstChild);
        }
    }

    return container;
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

function setLoadingState(element, loading = true) {
    if (loading) {
        element.classList.add('loading');
        element.style.pointerEvents = 'none';
    } else {
        element.classList.remove('loading');
        element.style.pointerEvents = '';
    }
}

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

function animateElement(element, animation, duration = 300) {
    element.style.animation = `${animation} ${duration}ms ease`;

    return new Promise(resolve => {
        setTimeout(() => {
            element.style.animation = '';
            resolve();
        }, duration);
    });
}

// Mobile navigation toggle
function toggleMobileNav() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('show');
    }
}

// Handle logo fallback
function handleLogoError(img) {
    if (img) {
        img.style.display = 'none';
        const fallbackText = img.nextElementSibling;
        if (fallbackText) {
            fallbackText.style.display = 'block';
        }
    }
}

// =============================================================================
// GLOBAL HERA OBJECT - Export functions for other modules
// =============================================================================

window.HERA = {
    // Core functions
    openModal,
    closeModal,
    confirmDelete,
    showNotification,

    // Formatting utilities
    formatCurrency,
    formatDate,
    formatTime,

    // UI helpers
    setLoadingState,
    animateElement,
    toggleMobileNav,
    handleLogoError,

    // System functions
    updateCountdown,
    setupNavigation,

    // Network utilities
    makeRequest,
    validateForm
};