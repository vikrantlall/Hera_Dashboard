// Travel Page JavaScript with Complete Booking Management

document.addEventListener('DOMContentLoaded', function() {
    initializeTravelPage();
    initializeInlineEditing();
    initializeFiltering();
    initializeModals();
    setupAutoSave();
});

let currentEditingElement = null;
let originalValue = null;
let travelBookings = [];

function initializeTravelPage() {
    // Load travel bookings data
    loadTravelBookings();
    
    // Setup travel-specific features
    setupTravelAnimations();
    setupBookingCards();
    updateTravelInsights();
    
    // Initialize drag and drop for reordering
    initializeDragAndDrop();
}

function loadTravelBookings() {
    const bookingCards = document.querySelectorAll('.travel-booking-card');
    travelBookings = [];
    
    bookingCards.forEach(card => {
        const bookingId = card.dataset.bookingId;
        const typeElement = card.querySelector('.editable-text[data-field="type"]');
        const statusSelect = card.querySelector('.status-select[data-field="status"]');
        
        if (bookingId && typeElement && statusSelect) {
            travelBookings.push({
                id: bookingId,
                type: typeElement.textContent.trim(),
                status: statusSelect.value,
                element: card
            });
        }
    });
}

function setupBookingCards() {
    const bookingCards = document.querySelectorAll('.travel-booking-card');
    
    bookingCards.forEach(card => {
        const bookingId = card.dataset.bookingId;
        
        // Status select change
        const statusSelect = card.querySelector('.status-select');
        if (statusSelect) {
            statusSelect.addEventListener('change', function() {
                updateTravelBooking(bookingId, { status: this.value });
                updateCardAppearance(card, this.value);
                updateTravelInsights();
            });
        }
        
        // Date and time input changes
        const dateInput = card.querySelector('.date-input');
        if (dateInput) {
            dateInput.addEventListener('change', function() {
                updateTravelBooking(bookingId, { date: this.value });
            });
        }
        
        const timeInput = card.querySelector('.time-input');
        if (timeInput) {
            timeInput.addEventListener('change', function() {
                updateTravelBooking(bookingId, { time: this.value });
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
        const editBtn = card.querySelector('.edit-booking');
        if (editBtn) {
            editBtn.addEventListener('click', function() {
                enableEditMode(card);
                menu.classList.remove('active');
            });
        }
        
        // Delete button
        const deleteBtn = card.querySelector('.delete-booking');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function() {
                const bookingType = card.querySelector('.editable-text[data-field="type"]').textContent;
                showDeleteModal(bookingId, bookingType);
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
    const editableElements = document.querySelectorAll('.editable-text, .editable-textarea, .editable-number');
    
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
    const bookingCard = currentEditingElement.closest('.travel-booking-card');
    const bookingId = bookingCard.dataset.bookingId;
    
    if (newValue !== originalValue) {
        // Validate input
        if (field === 'cost') {
            const numValue = parseFloat(newValue);
            if (isNaN(numValue) || numValue < 0) {
                utils.showNotification('Please enter a valid cost amount', 'error');
                cancelEdit();
                return;
            }
        }
        
        if (field === 'type' && !newValue) {
            utils.showNotification('Booking type cannot be empty', 'error');
            cancelEdit();
            return;
        }
        
        // Show loading state
        bookingCard.classList.add('saving');
        showLoadingIndicator(currentEditingElement);
        
        // Prepare update data
        const updateData = {};
        if (field === 'cost') {
            updateData[field] = parseFloat(newValue);
        } else {
            updateData[field] = newValue;
        }
        
        // Send update to server
        updateTravelBooking(bookingId, updateData)
            .then(() => {
                bookingCard.classList.remove('saving');
                bookingCard.classList.add('saved');
                hideLoadingIndicator(currentEditingElement);
                showSuccessIndicator(currentEditingElement);
                
                setTimeout(() => bookingCard.classList.remove('saved'), 2000);
                
                // Update local data
                const booking = travelBookings.find(b => b.id === bookingId);
                if (booking && field === 'type') {
                    booking.type = newValue;
                }
                
                updateTravelInsights();
                utils.showNotification('Travel booking updated successfully', 'success');
            })
            .catch(error => {
                bookingCard.classList.remove('saving');
                bookingCard.classList.add('error');
                hideLoadingIndicator(currentEditingElement);
                showErrorIndicator(currentEditingElement);
                
                setTimeout(() => bookingCard.classList.remove('error'), 2000);
                
                currentEditingElement.textContent = originalValue;
                utils.showNotification('Failed to update travel booking', 'error');
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

function updateTravelBooking(bookingId, data) {
    return utils.ajax(`/api/travel/${bookingId}`, {
        method: 'PUT',
        data: data
    });
}

function enableEditMode(bookingCard) {
    const editableElements = bookingCard.querySelectorAll('.editable-text, .editable-textarea, .editable-number');
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
    // Update card styling based on status
    card.classList.remove('status-booked', 'status-pending', 'status-cancelled');
    card.classList.add(`status-${status.toLowerCase()}`);
    
    // Add animation for status change
    card.style.transform = 'scale(1.02)';
    setTimeout(() => {
        card.style.transform = '';
    }, 200);
}

function initializeFiltering() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const bookingCards = document.querySelectorAll('.travel-booking-card');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active filter button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.dataset.filter;
            
            // Filter booking cards
            bookingCards.forEach(card => {
                const cardType = card.dataset.type;
                
                if (filter === 'all') {
                    card.classList.remove('filtered-out');
                } else if (filter === cardType) {
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
    const visibleCards = document.querySelectorAll('.travel-booking-card:not(.filtered-out)');
    const visibleCount = visibleCards.length;
    
    // Update filter button badges if needed
    // This could show counts like "Flights (3)", "Hotels (2)", etc.
}

function initializeModals() {
    // Setup add travel booking modal
    const addBtn = document.getElementById('add-travel-booking');
    const addFirstBtn = document.getElementById('add-first-booking');
    const addModal = document.getElementById('add-booking-modal');
    const addForm = document.getElementById('add-booking-form');
    
    if (addBtn && addModal && addForm) {
        addBtn.addEventListener('click', function() {
            addModal.classList.add('active');
            addForm.reset();
            
            // Focus on first input
            const firstInput = addForm.querySelector('select[name="type"]');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        });
        
        if (addFirstBtn) {
            addFirstBtn.addEventListener('click', function() {
                addModal.classList.add('active');
                addForm.reset();
            });
        }
        
        addForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addTravelBooking();
        });
    }
    
    // Setup delete confirmation modal
    setupDeleteModal();
    
    // Setup modal close handlers
    setupModalCloseHandlers();
}

function addTravelBooking() {
    const form = document.getElementById('add-booking-form');
    const formData = new FormData(form);
    
    const data = {
        type: formData.get('type'),
        provider: formData.get('provider') || '',
        details: formData.get('details') || '',
        date: formData.get('date') || null,
        time: formData.get('time') || null,
        confirmation: formData.get('confirmation') || '',
        cost: parseFloat(formData.get('cost')) || 0,
        status: formData.get('status') || 'Booked',
        notes: formData.get('notes') || ''
    };
    
    // Validate data
    if (!data.type.trim()) {
        utils.showNotification('Booking type is required', 'error');
        return;
    }
    
    if (data.cost < 0) {
        utils.showNotification('Cost must be positive', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    submitBtn.disabled = true;
    
    // Add new travel booking
    utils.ajax('/api/travel', {
        method: 'POST',
        data: data
    })
    .then(response => {
        if (response.success) {
            addTravelBookingToDOM(response.item);
            updateTravelInsights();
            document.getElementById('add-booking-modal').classList.remove('active');
            utils.showNotification('Travel booking added successfully', 'success');
        } else {
            throw new Error(response.error || 'Failed to add travel booking');
        }
    })
    .catch(error => {
        utils.showNotification('Failed to add travel booking', 'error');
    })
    .finally(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
}

function addTravelBookingToDOM(booking) {
    const bookingsGrid = document.getElementById('travel-bookings-grid');
    const emptyState = bookingsGrid.querySelector('.empty-state');
    
    // Remove empty state if it exists
    if (emptyState) {
        emptyState.remove();
    }
    
    const newBookingHTML = createTravelBookingHTML(booking);
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = newBookingHTML;
    const newBookingCard = tempDiv.firstChild;
    
    newBookingCard.classList.add('new-travel-booking');
    bookingsGrid.appendChild(newBookingCard);
    
    // Add to travel bookings array
    travelBookings.push({
        id: booking.id,
        type: booking.type,
        status: booking.status,
        element: newBookingCard
    });
    
    // Setup event listeners for new booking
    setupBookingCards();
    initializeInlineEditing();
    
    // Scroll to new booking
    newBookingCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Remove new booking class after animation
    setTimeout(() => {
        newBookingCard.classList.remove('new-travel-booking');
    }, 1000);
}

function createTravelBookingHTML(booking) {
    const typeIcon = getTypeIcon(booking.type);
    const date = booking.date || '';
    const time = booking.time || '';
    const provider = booking.provider || '';
    const details = booking.details || '';
    const confirmation = booking.confirmation || '';
    const notes = booking.notes || '';
    
    return `
        <div class="travel-booking-card" data-booking-id="${booking.id}" data-type="${booking.type.toLowerCase()}">
            <div class="booking-header">
                <div class="booking-type-icon">
                    <i class="fas fa-${typeIcon}"></i>
                </div>
                
                <div class="booking-info">
                    <h3 class="booking-type">
                        <span class="editable-text" data-field="type">${booking.type}</span>
                    </h3>
                    <div class="booking-provider">
                        <span class="editable-text" data-field="provider" data-placeholder="Provider name">${provider}</span>
                    </div>
                </div>
                
                <div class="booking-actions">
                    <div class="action-menu">
                        <button class="menu-toggle">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <div class="menu-dropdown">
                            <button class="menu-item edit-booking">
                                <i class="fas fa-edit"></i>
                                Edit Details
                            </button>
                            <button class="menu-item delete-booking">
                                <i class="fas fa-trash"></i>
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="booking-content">
                <div class="booking-details-section">
                    <div class="details-header">
                        <h4 class="details-title">
                            <i class="fas fa-info-circle"></i>
                            Booking Details
                        </h4>
                    </div>
                    
                    <div class="details-content">
                        <div class="detail-field">
                            <label class="field-label">Details:</label>
                            <div class="editable-textarea" data-field="details" data-placeholder="Flight details, hotel room info, etc.">${details}</div>
                        </div>
                        
                        <div class="detail-row">
                            <div class="detail-field">
                                <label class="field-label">Date:</label>
                                <input type="date" class="date-input" data-field="date" value="${date}">
                            </div>
                            <div class="detail-field">
                                <label class="field-label">Time:</label>
                                <input type="time" class="time-input" data-field="time" value="${time}">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="confirmation-section">
                    <div class="confirmation-header">
                        <h4 class="confirmation-title">
                            <i class="fas fa-ticket-alt"></i>
                            Confirmation
                        </h4>
                    </div>
                    <div class="confirmation-content">
                        <div class="confirmation-field">
                            <label class="field-label">Confirmation #:</label>
                            <div class="editable-text" data-field="confirmation" data-placeholder="Booking confirmation number">${confirmation}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="booking-footer">
                <div class="cost-section">
                    <div class="cost-label">Cost:</div>
                    <div class="cost-amount">
                        <span class="currency-symbol">$</span>
                        <span class="editable-number" data-field="cost">${booking.cost.toFixed(2)}</span>
                    </div>
                </div>
                
                <div class="status-section">
                    <select class="status-select" data-field="status">
                        <option value="Booked" ${booking.status === 'Booked' ? 'selected' : ''}>✅ Booked</option>
                        <option value="Pending" ${booking.status === 'Pending' ? 'selected' : ''}>⏳ Pending</option>
                        <option value="Cancelled" ${booking.status === 'Cancelled' ? 'selected' : ''}>❌ Cancelled</option>
                    </select>
                </div>
                
                <div class="last-updated">
                    <i class="fas fa-clock"></i>
                    <span>Just added</span>
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
                    <div class="editable-textarea" data-field="notes" data-placeholder="Add any additional notes about this booking...">${notes}</div>
                </div>
            </div>
        </div>
    `;
}

function getTypeIcon(type) {
    switch (type.toLowerCase()) {
        case 'flight': return 'plane';
        case 'hotel': return 'bed';
        case 'car rental': return 'car';
        case 'train': return 'train';
        default: return 'map-marker-alt';
    }
}

function setupDeleteModal() {
    const deleteModal = document.getElementById('delete-booking-modal');
    const confirmBtn = document.getElementById('confirm-delete-booking');
    
    let bookingToDelete = null;
    
    window.showDeleteModal = function(bookingId, bookingType) {
        bookingToDelete = bookingId;
        deleteModal.classList.add('active');
        
        // Update modal content if needed
        const modalBody = deleteModal.querySelector('.modal-body p');
        if (modalBody) {
            modalBody.textContent = `Are you sure you want to delete this ${bookingType} booking? This action cannot be undone.`;
        }
    };
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            if (bookingToDelete) {
                deleteTravelBooking(bookingToDelete);
            }
        });
    }
}

function deleteTravelBooking(bookingId) {
    const bookingCard = document.querySelector(`[data-booking-id="${bookingId}"]`);
    
    if (bookingCard) {
        bookingCard.classList.add('loading');
        
        utils.ajax(`/api/travel/${bookingId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.success) {
                // Animate removal
                bookingCard.style.transform = 'translateX(-100%)';
                bookingCard.style.opacity = '0';
                
                setTimeout(() => {
                    bookingCard.remove();
                    
                    // Remove from travel bookings array
                    travelBookings = travelBookings.filter(b => b.id !== bookingId);
                    
                    updateTravelInsights();
                    
                    // Show empty state if no bookings left
                    const remainingCards = document.querySelectorAll('.travel-booking-card');
                    if (remainingCards.length === 0) {
                        showEmptyState();
                    }
                }, 300);
                
                document.getElementById('delete-booking-modal').classList.remove('active');
                utils.showNotification('Travel booking deleted successfully', 'success');
            } else {
                throw new Error(response.error || 'Failed to delete travel booking');
            }
        })
        .catch(error => {
            bookingCard.classList.remove('loading');
            utils.showNotification('Failed to delete travel booking', 'error');
        });
    }
}

function showEmptyState() {
    const bookingsGrid = document.getElementById('travel-bookings-grid');
    const emptyStateHTML = `
        <div class="empty-state">
            <div class="empty-icon">
                <i class="fas fa-plane"></i>
            </div>
            <h3>No Travel Bookings Yet</h3>
            <p>Add your first travel booking to start planning your journey</p>
            <button class="btn btn-primary" id="add-first-booking">
                <i class="fas fa-plus"></i>
                Add First Booking
            </button>
        </div>
    `;
    bookingsGrid.innerHTML = emptyStateHTML;
    
    // Re-initialize the add first booking button
    initializeModals();
}

function updateTravelInsights() {
    const bookingCards = document.querySelectorAll('.travel-booking-card');
    
    // Count different types of bookings
    const insights = {
        flights: 0,
        hotels: 0,
        transport: 0,
        totalCost: 0
    };
    
    bookingCards.forEach(card => {
        const type = card.dataset.type;
        const costElement = card.querySelector('.editable-number[data-field="cost"]');
        const cost = costElement ? parseFloat(costElement.textContent) || 0 : 0;
        
        insights.totalCost += cost;
        
        switch (type) {
            case 'flight':
                insights.flights++;
                break;
            case 'hotel':
                insights.hotels++;
                break;
            case 'car':
            case 'train':
                insights.transport++;
                break;
        }
    });
    
    // Update insight displays
    const insightNumbers = document.querySelectorAll('.insight-number');
    if (insightNumbers.length >= 4) {
        insightNumbers[0].textContent = insights.flights;
        insightNumbers[1].textContent = insights.hotels;
        insightNumbers[2].textContent = insights.transport;
        insightNumbers[3].textContent = `$${insights.totalCost.toFixed(0)}`;
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

function initializeDragAndDrop() {
    // Add drag and drop functionality for reordering travel bookings
    const bookingsGrid = document.getElementById('travel-bookings-grid');
    
    if (bookingsGrid) {
        let draggedElement = null;
        
        bookingsGrid.addEventListener('dragstart', function(e) {
            if (e.target.classList.contains('travel-booking-card')) {
                draggedElement = e.target;
                e.target.style.opacity = '0.5';
            }
        });
        
        bookingsGrid.addEventListener('dragend', function(e) {
            if (e.target.classList.contains('travel-booking-card')) {
                e.target.style.opacity = '';
                draggedElement = null;
            }
        });
        
        bookingsGrid.addEventListener('dragover', function(e) {
            e.preventDefault();
        });
        
        bookingsGrid.addEventListener('drop', function(e) {
            e.preventDefault();
            
            if (draggedElement && e.target.closest('.travel-booking-card')) {
                const targetElement = e.target.closest('.travel-booking-card');
                if (targetElement !== draggedElement) {
                    const rect = targetElement.getBoundingClientRect();
                    const midY = rect.top + rect.height / 2;
                    
                    if (e.clientY < midY) {
                        bookingsGrid.insertBefore(draggedElement, targetElement);
                    } else {
                        bookingsGrid.insertBefore(draggedElement, targetElement.nextSibling);
                    }
                }
            }
        });
        
        // Make cards draggable
        const bookingCards = bookingsGrid.querySelectorAll('.travel-booking-card');
        bookingCards.forEach(card => {
            card.draggable = true;
        });
    }
}

function setupTravelAnimations() {
    // Add entrance animations to booking cards
    const bookingCards = document.querySelectorAll('.travel-booking-card');
    bookingCards.forEach((card, index) => {
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
            e.target.classList.contains('editable-textarea') ||
            e.target.classList.contains('editable-number')) {
            
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
window.travelPageUtils = {
    updateTravelInsights,
    addTravelBookingToDOM,
    deleteTravelBooking,
    showDeleteModal
};