// Travel JavaScript functionality - FIXED VERSION
// Flight map, travel management, and booking tracking

document.addEventListener('DOMContentLoaded', function() {
    initializeTravelPage();
    setupFlightMap();
    setupTravelManagement();
});

function initializeTravelPage() {
    console.log('Initializing travel page...');

    // Setup all travel functionality
    setupFlightTracking();
    setupBookingManagement();
    setupEditableTravelItems();

    console.log('Travel page initialized successfully');
}

// Flight Map with Leaflet - FIXED
function setupFlightMap() {
    // Check if map container exists
    const mapContainer = document.getElementById('flight-map');
    if (!mapContainer) {
        console.log('No map container found');
        return;
    }

    // Initialize Leaflet map
    try {
        const map = L.map('flight-map', {
            center: [45.0, -100.0], // Center of North America
            zoom: 4,
            zoomControl: true,
            scrollWheelZoom: true
        });

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(map);

        // Flight route coordinates
        const airports = {
            'IAD': [38.9445, -77.4558], // Washington Dulles
            'DEN': [39.8617, -104.6737], // Denver
            'YYC': [51.1315, -114.0106], // Calgary
            'YYZ': [43.6777, -79.6248], // Toronto
            'DCA': [38.8521, -77.0377]  // Washington Reagan
        };

        // Define flight path
        const flightPath = [
            airports.IAD, // Washington
            airports.DEN, // Denver
            airports.YYC, // Calgary
            airports.YYZ, // Toronto
            airports.DCA  // Washington (return)
        ];

        // Add airport markers
        Object.entries(airports).forEach(([code, coords]) => {
            const marker = L.marker(coords).addTo(map);

            let airportName = '';
            switch(code) {
                case 'IAD': airportName = 'Washington Dulles (IAD)'; break;
                case 'DEN': airportName = 'Denver (DEN)'; break;
                case 'YYC': airportName = 'Calgary (YYC)'; break;
                case 'YYZ': airportName = 'Toronto (YYZ)'; break;
                case 'DCA': airportName = 'Washington Reagan (DCA)'; break;
            }

            marker.bindPopup(`<strong>${airportName}</strong>`);

            // Style markers differently for origin/destination vs connections
            if (code === 'IAD' || code === 'DCA') {
                marker.setIcon(L.divIcon({
                    className: 'airport-marker origin',
                    html: '<i class="fas fa-plane-departure"></i>',
                    iconSize: [24, 24]
                }));
            } else if (code === 'YYC') {
                marker.setIcon(L.divIcon({
                    className: 'airport-marker destination',
                    html: '<i class="fas fa-heart"></i>',
                    iconSize: [24, 24]
                }));
            } else {
                marker.setIcon(L.divIcon({
                    className: 'airport-marker connection',
                    html: '<i class="fas fa-plane"></i>',
                    iconSize: [20, 20]
                }));
            }
        });

        // Add flight path polylines
        const pathSegments = [
            [airports.IAD, airports.DEN], // Outbound 1
            [airports.DEN, airports.YYC], // Outbound 2
            [airports.YYC, airports.YYZ], // Return 1
            [airports.YYZ, airports.DCA]  // Return 2
        ];

        pathSegments.forEach((segment, index) => {
            const isReturn = index >= 2;

            L.polyline(segment, {
                color: isReturn ? '#ff6b6b' : '#4ecdc4',
                weight: 3,
                opacity: 0.8,
                dashArray: isReturn ? '10, 5' : null
            }).addTo(map);
        });

        // Fit map to show all points
        const group = new L.featureGroup(Object.values(airports).map(coords => L.marker(coords)));
        map.fitBounds(group.getBounds().pad(0.1));

        console.log('Flight map initialized successfully');

    } catch (error) {
        console.error('Error initializing map:', error);
        // Fallback: Show static route text
        mapContainer.innerHTML = `
            <div class="map-fallback">
                <div class="route-display">
                    <div class="route-item">
                        <i class="fas fa-plane-departure"></i>
                        <span>Washington (IAD)</span>
                    </div>
                    <div class="route-arrow">→</div>
                    <div class="route-item">
                        <i class="fas fa-plane"></i>
                        <span>Denver (DEN)</span>
                    </div>
                    <div class="route-arrow">→</div>
                    <div class="route-item">
                        <i class="fas fa-heart"></i>
                        <span>Calgary (YYC)</span>
                    </div>
                    <div class="route-arrow">→</div>
                    <div class="route-item">
                        <i class="fas fa-plane"></i>
                        <span>Toronto (YYZ)</span>
                    </div>
                    <div class="route-arrow">→</div>
                    <div class="route-item">
                        <i class="fas fa-plane-arrival"></i>
                        <span>Washington (DCA)</span>
                    </div>
                </div>
                <p class="map-error">Interactive map unavailable - showing route overview</p>
            </div>
        `;
    }
}

// Travel Management - FIXED
function setupTravelManagement() {
    // Setup travel card interactions
    const travelCards = document.querySelectorAll('.travel-card');
    travelCards.forEach(card => {
        setupTravelCardEvents(card);
    });

    // Setup add travel buttons
    const addButtons = document.querySelectorAll('.add-btn[onclick*="Flight"], .add-btn[onclick*="Hotel"], .add-btn[onclick*="Transport"]');
    addButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const type = this.getAttribute('onclick').match(/\('(\w+)'\)/)?.[1] || 'flight';
            openAddTravelModal(type);
        });
    });
}

function setupTravelCardEvents(card) {
    // Edit button
    const editBtn = card.querySelector('.edit-btn');
    if (editBtn) {
        editBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            openEditTravelModal(card);
        });
    }

    // Status toggle
    const statusBadge = card.querySelector('.status-badge');
    if (statusBadge) {
        statusBadge.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleTravelStatus(card);
        });
    }

    // Confirmation number editing
    const confirmationField = card.querySelector('[data-editable="confirmation"]');
    if (confirmationField) {
        confirmationField.addEventListener('click', function() {
            startInlineEdit(this, 'text');
        });
    }

    // Price editing
    const priceField = card.querySelector('[data-editable="price"]');
    if (priceField) {
        priceField.addEventListener('click', function() {
            startInlineEdit(this, 'number');
        });
    }
}

// Flight Tracking - FIXED
function setupFlightTracking() {
    // Setup flight status updates
    const flightCards = document.querySelectorAll('.flight-card');
    flightCards.forEach(card => {
        const flightNumber = card.querySelector('.flight-number')?.textContent;
        if (flightNumber) {
            // You could integrate with a flight tracking API here
            checkFlightStatus(flightNumber, card);
        }
    });

    // Setup departure/arrival time editing
    const timeFields = document.querySelectorAll('.flight-time[data-editable]');
    timeFields.forEach(field => {
        field.addEventListener('click', function() {
            startTimeEdit(this);
        });
    });
}

function checkFlightStatus(flightNumber, card) {
    // Placeholder for flight status checking
    // In a real app, you'd call a flight tracking API
    const statusElement = card.querySelector('.flight-status');
    if (statusElement) {
        // Simulate status check
        setTimeout(() => {
            const statuses = ['On Time', 'Delayed', 'Boarding', 'Departed'];
            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

            if (randomStatus !== statusElement.textContent.trim()) {
                statusElement.textContent = randomStatus;
                statusElement.className = `flight-status ${randomStatus.toLowerCase().replace(' ', '-')}`;

                // Show notification for status changes
                showTravelNotification(`Flight ${flightNumber} status updated: ${randomStatus}`, 'info');
            }
        }, 2000);
    }
}

// Booking Management - FIXED
function setupBookingManagement() {
    // Setup booking confirmation tracking
    const bookingFields = document.querySelectorAll('[data-booking-field]');
    bookingFields.forEach(field => {
        field.addEventListener('blur', function() {
            saveTravelField(this);
        });
    });

    // Setup file upload for booking confirmations
    setupBookingFileUpload();
}

function setupBookingFileUpload() {
    const uploadButtons = document.querySelectorAll('.upload-confirmation-btn');
    uploadButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.pdf,.jpg,.jpeg,.png';
            input.onchange = function(e) {
                uploadBookingConfirmation(e.target.files[0], btn.closest('.travel-card'));
            };
            input.click();
        });
    });
}

function uploadBookingConfirmation(file, travelCard) {
    if (!file) return;

    const formData = new FormData();
    formData.append('confirmation', file);
    formData.append('travel_id', travelCard.dataset.travelId);

    const progressIndicator = showUploadProgress(file.name);

    fetch('/api/travel/upload-confirmation', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        hideUploadProgress(progressIndicator);

        if (data.success) {
            showTravelNotification('Confirmation uploaded successfully!', 'success');

            // Add download link to card
            addConfirmationLink(travelCard, data.filename, data.url);
        } else {
            showTravelNotification(data.error || 'Upload failed', 'error');
        }
    })
    .catch(error => {
        hideUploadProgress(progressIndicator);
        console.error('Upload error:', error);
        showTravelNotification('Upload failed. Please try again.', 'error');
    });
}

// Editable Fields - FIXED
function setupEditableTravelItems() {
    const editableFields = document.querySelectorAll('[data-editable]');
    editableFields.forEach(field => {
        field.addEventListener('click', function() {
            if (!this.classList.contains('editing')) {
                const fieldType = this.dataset.editable;
                let inputType = 'text';

                if (fieldType === 'price') inputType = 'number';
                if (fieldType === 'time') inputType = 'time';
                if (fieldType === 'date') inputType = 'date';

                startInlineEdit(this, inputType);
            }
        });
    });
}

function startInlineEdit(element, inputType = 'text') {
    const currentValue = element.textContent.trim().replace('$', '').replace(',', '');

    element.classList.add('editing');

    const input = document.createElement('input');
    input.type = inputType;
    input.value = currentValue;
    input.className = 'inline-edit-input';

    // Style the input
    input.style.cssText = `
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid #d4af37;
        border-radius: 4px;
        padding: 4px 8px;
        color: white;
        font-size: inherit;
        width: 100%;
        max-width: 150px;
    `;

    element.innerHTML = '';
    element.appendChild(input);
    input.focus();
    input.select();

    function saveEdit() {
        const newValue = input.value.trim();
        element.classList.remove('editing');

        // Format value based on type
        let displayValue = newValue;
        if (element.dataset.editable === 'price') {
            displayValue = `$${parseFloat(newValue || 0).toLocaleString()}`;
        }

        element.textContent = displayValue;

        // Save to backend
        saveTravelField(element, newValue);
    }

    input.addEventListener('blur', saveEdit);
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveEdit();
        } else if (e.key === 'Escape') {
            element.classList.remove('editing');
            element.textContent = currentValue;
        }
    });
}

function startTimeEdit(element) {
    const currentTime = element.textContent.trim();

    element.classList.add('editing');

    const input = document.createElement('input');
    input.type = 'time';
    input.value = convertTo24Hour(currentTime);
    input.className = 'inline-edit-input';

    input.style.cssText = `
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid #d4af37;
        border-radius: 4px;
        padding: 4px 8px;
        color: white;
        font-size: inherit;
    `;

    element.innerHTML = '';
    element.appendChild(input);
    input.focus();

    function saveTimeEdit() {
        const newTime = input.value;
        element.classList.remove('editing');
        element.textContent = convertTo12Hour(newTime);

        saveTravelField(element, newTime);
    }

    input.addEventListener('blur', saveTimeEdit);
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveTimeEdit();
        }
    });
}

// Modal Management - FIXED
function openAddTravelModal(type) {
    let modal = document.getElementById(`add-${type}-modal`);

    if (!modal) {
        modal = createTravelModal(type, 'add');
        document.body.appendChild(modal);
    }

    modal.style.display = 'flex';
    modal.classList.add('modal-show');

    // Focus first input
    const firstInput = modal.querySelector('input, select');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
    }
}

function openEditTravelModal(travelCard) {
    const travelType = getTravelType(travelCard);
    let modal = document.getElementById(`edit-${travelType}-modal`);

    if (!modal) {
        modal = createTravelModal(travelType, 'edit');
        document.body.appendChild(modal);
    }

    // Populate with current data
    populateTravelModal(modal, travelCard);

    modal.style.display = 'flex';
    modal.classList.add('modal-show');
}

function createTravelModal(type, mode) {
    const modal = document.createElement('div');
    modal.id = `${mode}-${type}-modal`;
    modal.className = 'modal-overlay';

    const title = mode === 'add' ? `Add ${type}` : `Edit ${type}`;

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close" onclick="closeTravelModal('${modal.id}')">&times;</button>
            </div>

            <form class="modal-form" id="${mode}-${type}-form">
                <input type="hidden" id="${mode}-${type}-id">
                ${getTravelFormFields(type, mode)}

                <div class="modal-actions">
                    <button type="button" class="btn-secondary" onclick="closeTravelModal('${modal.id}')">Cancel</button>
                    <button type="submit" class="btn-primary">${mode === 'add' ? 'Add' : 'Save'} ${type}</button>
                </div>
            </form>
        </div>
    `;

    // Setup form submission
    modal.querySelector('form').addEventListener('submit', function(e) {
        e.preventDefault();
        handleTravelFormSubmit(e, type, mode);
    });

    return modal;
}

function getTravelFormFields(type, mode) {
    const prefix = `${mode}-${type}`;

    switch (type) {
        case 'flight':
            return `
                <div class="form-row">
                    <div class="form-group">
                        <label>Flight Number</label>
                        <input type="text" id="${prefix}-number" required>
                    </div>
                    <div class="form-group">
                        <label>Route</label>
                        <input type="text" id="${prefix}-route" placeholder="e.g., IAD - DEN" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Departure</label>
                        <input type="datetime-local" id="${prefix}-departure" required>
                    </div>
                    <div class="form-group">
                        <label>Arrival</label>
                        <input type="datetime-local" id="${prefix}-arrival" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Price</label>
                        <input type="number" id="${prefix}-price" step="0.01" min="0">
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select id="${prefix}-status">
                            <option value="Booked">Booked</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Checked In">Checked In</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Confirmation Number</label>
                    <input type="text" id="${prefix}-confirmation">
                </div>
            `;

        case 'hotel':
            return `
                <div class="form-group">
                    <label>Hotel Name</label>
                    <input type="text" id="${prefix}-name" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Check-in</label>
                        <input type="date" id="${prefix}-checkin" required>
                    </div>
                    <div class="form-group">
                        <label>Check-out</label>
                        <input type="date" id="${prefix}-checkout" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Price per Night</label>
                        <input type="number" id="${prefix}-price" step="0.01" min="0">
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select id="${prefix}-status">
                            <option value="Reserved">Reserved</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Checked In">Checked In</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Confirmation Number</label>
                    <input type="text" id="${prefix}-confirmation">
                </div>
                <div class="form-group">
                    <label>Address</label>
                    <textarea id="${prefix}-address" rows="2"></textarea>
                </div>
            `;

        case 'transport':
            return `
                <div class="form-group">
                    <label>Transport Type</label>
                    <select id="${prefix}-type" required>
                        <option value="Rental Car">Rental Car</option>
                        <option value="Taxi">Taxi</option>
                        <option value="Shuttle">Shuttle</option>
                        <option value="Train">Train</option>
                        <option value="Bus">Bus</option>
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Pickup Date</label>
                        <input type="datetime-local" id="${prefix}-pickup" required>
                    </div>
                    <div class="form-group">
                        <label>Return Date</label>
                        <input type="datetime-local" id="${prefix}-return">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Price</label>
                        <input type="number" id="${prefix}-price" step="0.01" min="0">
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select id="${prefix}-status">
                            <option value="Reserved">Reserved</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Picked Up">Picked Up</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Confirmation Number</label>
                    <input type="text" id="${prefix}-confirmation">
                </div>
            `;

        default:
            return '';
    }
}

// Utility Functions - FIXED
function getTravelType(card) {
    if (card.classList.contains('flight-card')) return 'flight';
    if (card.classList.contains('hotel-card')) return 'hotel';
    if (card.classList.contains('transport-card')) return 'transport';
    return 'flight';
}

function convertTo24Hour(time12h) {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');

    if (hours === '12') {
        hours = '00';
    }

    if (modifier === 'PM') {
        hours = parseInt(hours, 10) + 12;
    }

    return `${hours}:${minutes}`;
}

function convertTo12Hour(time24h) {
    const [hours, minutes] = time24h.split(':');
    const hour = parseInt(hours, 10);
    const modifier = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;

    return `${displayHour}:${minutes} ${modifier}`;
}

function toggleTravelStatus(card) {
    const statusBadge = card.querySelector('.status-badge');
    const currentStatus = statusBadge.textContent.trim();

    // Define status progression
    const statusFlow = {
        'Pending': 'Booked',
        'Booked': 'Confirmed',
        'Confirmed': 'Complete',
        'Complete': 'Pending'
    };

    const newStatus = statusFlow[currentStatus] || 'Booked';

    statusBadge.textContent = newStatus;
    statusBadge.className = `status-badge ${newStatus.toLowerCase()}`;

    // Save to backend
    const travelId = card.dataset.travelId;
    if (travelId) {
        saveTravelField(statusBadge, newStatus);
    }
}

function saveTravelField(element, value) {
    const card = element.closest('.travel-card');
    const travelId = card?.dataset.travelId;
    const field = element.dataset.editable || 'status';

    if (!travelId) return;

    fetch(`/api/travel/${travelId}/update`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ field, value })
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            console.error('Failed to save travel field:', data.error);
            showTravelNotification('Failed to save changes', 'error');
        }
    })
    .catch(error => {
        console.error('Error saving travel field:', error);
        showTravelNotification('Error saving changes', 'error');
    });
}

function showTravelNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `travel-notification ${type}`;
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
    }, 4000);
}

function showUploadProgress(filename) {
    const progressDiv = document.createElement('div');
    progressDiv.className = 'upload-progress';
    progressDiv.innerHTML = `
        <div class="upload-item">
            <span class="upload-filename">${filename}</span>
            <div class="upload-progress-bar">
                <div class="upload-progress-fill"></div>
            </div>
            <span class="upload-status">Uploading...</span>
        </div>
    `;

    document.body.appendChild(progressDiv);
    return progressDiv;
}

function hideUploadProgress(progressIndicator) {
    if (progressIndicator) {
        const progressFill = progressIndicator.querySelector('.upload-progress-fill');
        const statusText = progressIndicator.querySelector('.upload-status');

        progressFill.style.width = '100%';
        statusText.textContent = 'Complete!';

        setTimeout(() => {
            progressIndicator.remove();
        }, 1500);
    }
}

function closeTravelModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('modal-show');
    }
}

// Global functions for onclick handlers
window.openAddFlightModal = (type) => openAddTravelModal(type || 'flight');
window.openAddHotelModal = () => openAddTravelModal('hotel');
window.openAddTransportModal = () => openAddTravelModal('transport');

// Export functions for global access
window.TravelManager = {
    initializeMap: setupFlightMap,
    toggleStatus: toggleTravelStatus,
    uploadConfirmation: uploadBookingConfirmation,
    refreshData: initializeTravelPage
};