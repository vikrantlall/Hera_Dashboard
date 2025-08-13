// Travel.js - HERA Dashboard Design System with Enhanced Flight Tracker
// UPDATED: Enhanced animation and styling to match standalone version
// ADDED: Comprehensive front-end status functionality

// Enhanced flight data for the tracker
const flights = [
    {
        id: 'UA419', type: 'outbound',
        from: 'IAD', to: 'DEN',
        fromName: 'Washington Dulles Intl',
        toName: 'Denver International',
        departure: '8:15 AM', arrival: '10:03 AM',
        duration: '3h 48m',
        aircraft: 'Boeing 757-300',
        registration: 'N73283',
        fromCoords: [38.9445, -77.4558],
        toCoords: [39.8617, -104.6731],
        cruiseAlt: 37000,
        status: 'completed'
    },
    {
        id: 'UA2459', type: 'outbound',
        from: 'DEN', to: 'YYC',
        fromName: 'Denver International',
        toName: 'Calgary International',
        departure: '11:22 AM', arrival: '1:53 PM',
        duration: '2h 31m',
        aircraft: 'Boeing 737-800',
        registration: 'N449UA',
        fromCoords: [39.8617, -104.6731],
        toCoords: [51.1315, -114.0106],
        cruiseAlt: 38000,
        status: 'completed'
    },
    {
        id: 'UA750', type: 'return',
        from: 'YYC', to: 'IAH',  // CHANGED
        fromName: 'Calgary International',
        toName: 'Houston Intercontinental',  // CHANGED
        departure: '1:55 PM', arrival: '7:04 PM',
        duration: '4h 9m',
        aircraft: 'Airbus A319',
        registration: 'N26906',
        fromCoords: [51.1315, -114.0106],
        toCoords: [29.9844, -95.3414],  // CHANGED
        cruiseAlt: 41000,
        status: 'active'
    },
    {
        id: 'UA2224', type: 'return',
        from: 'IAH', to: 'DCA',  // CHANGED
        fromName: 'Houston Intercontinental',  // CHANGED
        toName: 'Reagan National',
        departure: '7:50 PM', arrival: '11:50 PM',
        duration: '3h',
        aircraft: 'Boeing 737-700',
        registration: 'N876UA',
        fromCoords: [29.9844, -95.3414],  // CHANGED
        toCoords: [38.8512, -77.0402],
        cruiseAlt: 35000,
        status: 'scheduled'
    }
];

// STATUS CONFIGURATION - Define available statuses for each travel type
const STATUS_CONFIGS = {
    flight: {
        statuses: ['Pending', 'Confirmed', 'On Time', 'Delayed', 'Boarding', 'In Flight', 'Landed', 'Cancelled'],
        colors: {
            'Pending': { class: 'pending', color: '#f59e0b' },
            'Confirmed': { class: 'confirmed', color: '#22c55e' },
            'On Time': { class: 'on-time', color: '#22c55e' },
            'Delayed': { class: 'delayed', color: '#ef4444' },
            'Boarding': { class: 'boarding', color: '#3b82f6' },
            'In Flight': { class: 'in-flight', color: '#8b5cf6' },
            'Landed': { class: 'landed', color: '#06b6d4' },
            'Cancelled': { class: 'cancelled', color: '#ef4444' }
        }
    },
    hotel: {
        statuses: ['Pending', 'Confirmed', 'Checked In', 'Checked Out', 'Cancelled'],
        colors: {
            'Pending': { class: 'pending', color: '#f59e0b' },
            'Confirmed': { class: 'confirmed', color: '#22c55e' },
            'Checked In': { class: 'checked-in', color: '#3b82f6' },
            'Checked Out': { class: 'checked-out', color: '#06b6d4' },
            'Cancelled': { class: 'cancelled', color: '#ef4444' }
        }
    },
    transport: {
        statuses: ['Pending', 'Confirmed', 'Picked Up', 'In Use', 'Returned', 'Cancelled'],
        colors: {
            'Pending': { class: 'pending', color: '#f59e0b' },
            'Confirmed': { class: 'confirmed', color: '#22c55e' },
            'Picked Up': { class: 'picked-up', color: '#3b82f6' },
            'In Use': { class: 'in-use', color: '#8b5cf6' },
            'Returned': { class: 'returned', color: '#06b6d4' },
            'Cancelled': { class: 'cancelled', color: '#ef4444' }
        }
    }
};

// Flight tracker animation variables
let animation = {
    isRunning: false,
    currentFlight: 0,
    progress: 0,
    aircraftMarker: null,
    flightPaths: [],
    startTime: null,
    liveData: {
        altitude: 0,
        groundSpeed: 0,
        heading: 0,
        verticalSpeed: 0
    }
};

// Global variables
let map;
let flightLayers = {};
let activeLayer = 'route';

// Flight route data (keeping original for fallback)
const FLIGHT_ROUTES = [
    { from: 'IAD', to: 'DEN', status: 'confirmed', coords: [[38.9445, -77.4558], [39.8617, -104.6731]] },
    { from: 'DEN', to: 'YYC', status: 'confirmed', coords: [[39.8617, -104.6731], [51.1315, -114.0106]] },
    { from: 'YYC', to: 'IAH', status: 'confirmed', coords: [[51.1315, -114.0106], [29.9844, -95.3414]] },  // CHANGED
    { from: 'IAH', to: 'DCA', status: 'confirmed', coords: [[29.9844, -95.3414], [38.8512, -77.0402]] }   // CHANGED
];

const AIRPORTS = {
    'IAD': { name: 'Washington Dulles', coords: [38.9445, -77.4558] },
    'DEN': { name: 'Denver International', coords: [39.8617, -104.6731] },
    'YYC': { name: 'Calgary International', coords: [51.1315, -114.0106] },
    'IAH': { name: 'Houston Intercontinental', coords: [29.9844, -95.3414] },  // CHANGED: Was YYZ
    'DCA': { name: 'Ronald Reagan Washington', coords: [38.8512, -77.0402] }
};

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeTravelPage();
});

function initializeTravelPage() {
    setupFlightMap();
    setupMapControls();
    setupTravelActions();
    updateFlightStatus();

    // Make status elements clickable
    makeStatusElementsClickable();

    // Update status every 30 seconds
    setInterval(updateFlightStatus, 30000);
}

// =====================================================
// STATUS MANAGEMENT FUNCTIONS
// =====================================================

/**
 * Toggle flight status through the status cycle
 * @param {number} flightId - The ID of the flight
 */
function toggleFlightStatus(flightId) {
    toggleTravelStatus(flightId, 'flight');
}

/**
 * Toggle hotel status through the status cycle
 * @param {number} hotelId - The ID of the hotel
 */
function toggleHotelStatus(hotelId) {
    toggleTravelStatus(hotelId, 'hotel');
}

/**
 * Toggle transport status through the status cycle
 * @param {number} transportId - The ID of the transport
 */
function toggleTransportStatus(transportId) {
    toggleTravelStatus(transportId, 'transport');
}

/**
 * Main function to show status dropdown for any travel item
 * @param {number} itemId - The ID of the travel item
 * @param {string} type - The type of travel item (flight, hotel, transport)
 */
function toggleTravelStatus(itemId, type) {
    const card = document.querySelector(`[data-travel-id="${itemId}"]`);
    if (!card) {
        console.error(`Travel item with ID ${itemId} not found`);
        return;
    }

    // Find the correct status element
    const statusDetails = card.querySelectorAll('.travel-detail');
    let statusElement = null;

    statusDetails.forEach(detail => {
        const label = detail.querySelector('.detail-label');
        if (label && label.textContent.trim() === 'Status') {
            statusElement = detail.querySelector('.detail-value');
        }
    });

    if (!statusElement) {
        console.error(`Status element not found for ${type} ${itemId}`);
        return;
    }

    showStatusDropdown(statusElement, type, itemId);
}

/**
 * Show dropdown with status options
 * @param {Element} statusElement - The DOM element containing the status
 * @param {string} type - The type of travel item
 * @param {number} itemId - The ID of the travel item
 */
function showStatusDropdown(statusElement, type, itemId) {
    const config = STATUS_CONFIGS[type];
    if (!config) {
        console.error(`Invalid travel type: ${type}`);
        return;
    }

    // Close any existing dropdown
    closeExistingDropdown();

    const currentStatus = statusElement.textContent.trim();

    // Create dropdown container
    const dropdown = document.createElement('div');
    dropdown.className = 'status-dropdown';
    dropdown.dataset.statusDropdown = 'true';

    // Create dropdown content
    const dropdownContent = document.createElement('div');
    dropdownContent.className = 'status-dropdown-content';

    // Add options
    config.statuses.forEach(status => {
        const option = document.createElement('div');
        option.className = 'status-option';
        option.textContent = status;
        option.dataset.status = status;

        // Add status class for styling
        const statusConfig = config.colors[status];
        if (statusConfig) {
            option.classList.add(statusConfig.class);
        }

        // Mark current status
        if (status === currentStatus) {
            option.classList.add('current-status');
        }

        // Add click handler
        option.addEventListener('click', () => {
            selectStatus(statusElement, type, itemId, status);
            closeDropdown(dropdown);
        });

        dropdownContent.appendChild(option);
    });

    dropdown.appendChild(dropdownContent);

    // Position dropdown
    const rect = statusElement.getBoundingClientRect();
    dropdown.style.position = 'absolute';
    dropdown.style.top = `${rect.bottom + window.scrollY + 5}px`;
    dropdown.style.left = `${rect.left + window.scrollX}px`;
    dropdown.style.minWidth = `${rect.width}px`;
    dropdown.style.zIndex = '1000';

    document.body.appendChild(dropdown);

    // Close dropdown when clicking outside
    setTimeout(() => {
        document.addEventListener('click', handleOutsideClick);
    }, 100);

    function handleOutsideClick(e) {
        if (!dropdown.contains(e.target) && e.target !== statusElement) {
            closeDropdown(dropdown);
            document.removeEventListener('click', handleOutsideClick);
        }
    }
}

/**
 * Select a status from dropdown
 * @param {Element} statusElement - The DOM element containing the status
 * @param {string} type - The type of travel item
 * @param {number} itemId - The ID of the travel item
 * @param {string} newStatus - The selected status
 */
function selectStatus(statusElement, type, itemId, newStatus) {
    const config = STATUS_CONFIGS[type];
    const oldStatus = statusElement.textContent.trim();

    // Update the status text
    statusElement.textContent = newStatus;

    // Remove all existing status classes
    Object.values(config.colors).forEach(colorConfig => {
        statusElement.classList.remove(colorConfig.class);
    });

    // Add new status class
    const statusConfig = config.colors[newStatus];
    if (statusConfig) {
        statusElement.classList.add(statusConfig.class);
    }

    // Add visual feedback with animation
    statusElement.style.transform = 'scale(1.05)';
    statusElement.style.transition = 'all 0.3s ease';

    setTimeout(() => {
        statusElement.style.transform = 'scale(1)';
    }, 300);

    // Show notification
    showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} status updated to: ${newStatus}`, 'success');

    // Trigger any additional status-specific actions
    handleStatusSpecificActions(type, newStatus, itemId);

    console.log(`${type} ${itemId} status updated from "${oldStatus}" to "${newStatus}"`);
}

/**
 * Close existing dropdown if any
 */
function closeExistingDropdown() {
    const existingDropdown = document.querySelector('[data-status-dropdown="true"]');
    if (existingDropdown) {
        closeDropdown(existingDropdown);
    }
}

/**
 * Close a specific dropdown
 * @param {Element} dropdown - The dropdown element to close
 */
function closeDropdown(dropdown) {
    if (dropdown && dropdown.parentNode) {
        dropdown.style.opacity = '0';
        dropdown.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            if (dropdown.parentNode) {
                dropdown.parentNode.removeChild(dropdown);
            }
        }, 150);
    }
}

/**
 * Handle specific actions based on status changes
 * @param {string} type - The type of travel item
 * @param {string} status - The new status
 * @param {number} itemId - The ID of the travel item
 */
function handleStatusSpecificActions(type, status, itemId) {
    switch(type) {
        case 'flight':
            handleFlightStatusActions(status, itemId);
            break;
        case 'hotel':
            handleHotelStatusActions(status, itemId);
            break;
        case 'transport':
            handleTransportStatusActions(status, itemId);
            break;
    }
}

/**
 * Handle flight-specific status actions
 * @param {string} status - The new status
 * @param {number} itemId - The flight ID
 */
function handleFlightStatusActions(status, itemId) {
    const card = document.querySelector(`[data-travel-id="${itemId}"]`);

    switch(status) {
        case 'Delayed':
            addStatusIndicator(card, '⚠️', 'Flight may be delayed');
            break;
        case 'Cancelled':
            card.style.opacity = '0.6';
            addStatusIndicator(card, '❌', 'Flight cancelled');
            break;
        case 'In Flight':
            addStatusIndicator(card, '✈️', 'Currently in flight');
            break;
        case 'Landed':
            addStatusIndicator(card, '🛬', 'Flight has landed');
            break;
        default:
            removeStatusIndicator(card);
            card.style.opacity = '1';
            break;
    }
}

/**
 * Handle hotel-specific status actions
 * @param {string} status - The new status
 * @param {number} itemId - The hotel ID
 */
function handleHotelStatusActions(status, itemId) {
    const card = document.querySelector(`[data-travel-id="${itemId}"]`);

    switch(status) {
        case 'Checked In':
            addStatusIndicator(card, '🏨', 'Currently checked in');
            break;
        case 'Checked Out':
            addStatusIndicator(card, '✅', 'Successfully checked out');
            break;
        case 'Cancelled':
            card.style.opacity = '0.6';
            addStatusIndicator(card, '❌', 'Reservation cancelled');
            break;
        default:
            removeStatusIndicator(card);
            card.style.opacity = '1';
            break;
    }
}

/**
 * Handle transport-specific status actions
 * @param {string} status - The new status
 * @param {number} itemId - The transport ID
 */
function handleTransportStatusActions(status, itemId) {
    const card = document.querySelector(`[data-travel-id="${itemId}"]`);

    switch(status) {
        case 'Picked Up':
            addStatusIndicator(card, '🚗', 'Vehicle picked up');
            break;
        case 'In Use':
            addStatusIndicator(card, '🛣️', 'Currently in use');
            break;
        case 'Returned':
            addStatusIndicator(card, '✅', 'Vehicle returned');
            break;
        case 'Cancelled':
            card.style.opacity = '0.6';
            addStatusIndicator(card, '❌', 'Rental cancelled');
            break;
        default:
            removeStatusIndicator(card);
            card.style.opacity = '1';
            break;
    }
}

/**
 * Add a visual status indicator to a card
 * @param {Element} card - The travel card element
 * @param {string} icon - The icon to display
 * @param {string} tooltip - The tooltip text
 */
function addStatusIndicator(card, icon, tooltip) {
    // Remove existing indicator
    removeStatusIndicator(card);

    const indicator = document.createElement('div');
    indicator.className = 'status-indicator-badge';
    indicator.innerHTML = `<span class="indicator-icon">${icon}</span>`;
    indicator.title = tooltip;

    card.style.position = 'relative';
    card.appendChild(indicator);
}

/**
 * Remove status indicator from a card
 * @param {Element} card - The travel card element
 */
function removeStatusIndicator(card) {
    const existingIndicator = card.querySelector('.status-indicator-badge');
    if (existingIndicator) {
        existingIndicator.remove();
    }
}

/**
 * Bulk status update function (useful for testing or admin features)
 * @param {string} type - The type of travel items to update
 * @param {string} status - The status to set
 */
function bulkUpdateStatus(type, status) {
    const cards = document.querySelectorAll(`.${type}-card`);
    cards.forEach(card => {
        const itemId = card.dataset.travelId;
        if (itemId) {
            const statusDetails = card.querySelectorAll('.travel-detail');
            let statusElement = null;

            statusDetails.forEach(detail => {
                const label = detail.querySelector('.detail-label');
                if (label && label.textContent.trim() === 'Status') {
                    statusElement = detail.querySelector('.detail-value');
                }
            });

            if (statusElement) {
                selectStatus(statusElement, type, itemId, status);
            }
        }
    });

    showNotification(`Updated all ${type} items to: ${status}`, 'info');
}

/**
 * Make status elements clickable by adding click handlers
 */
function makeStatusElementsClickable() {
    // Add click handlers to all status elements
    document.querySelectorAll('.travel-card').forEach(card => {
        const statusElement = findStatusElement(card);
        if (statusElement && !statusElement.dataset.clickable) {
            statusElement.dataset.clickable = 'true';
            statusElement.style.cursor = 'pointer';

            // Determine the type based on card class
            let type = 'flight'; // default
            if (card.classList.contains('hotel-card')) type = 'hotel';
            else if (card.classList.contains('transport-card')) type = 'transport';

            const itemId = card.dataset.travelId;

            statusElement.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleTravelStatus(itemId, type);
            });
        }
    });
}

/**
 * Find status element in a card
 * @param {Element} card - The travel card element
 * @returns {Element|null} - The status element or null
 */
function findStatusElement(card) {
    const statusDetails = card.querySelectorAll('.travel-detail');
    let statusElement = null;

    statusDetails.forEach(detail => {
        const label = detail.querySelector('.detail-label');
        if (label && label.textContent.trim() === 'Status') {
            statusElement = detail.querySelector('.detail-value');
        }
    });

    return statusElement;
}

// =====================================================
// ENHANCED FLIGHT TRACKER FUNCTIONS
// =====================================================

// ENHANCED: Flight Map Functions with Animation
function setupFlightMap() {
    const mapElement = document.getElementById('map');
    if (mapElement) {
        setupEnhancedFlightTracker();
    } else {
        setupOriginalFlightMap();
    }
}

// Enhanced flight tracker setup
function setupEnhancedFlightTracker() {
    map = L.map('map', {
        zoomControl: false
    }).setView([45, -95], 3);

    // Add zoom control to the right
    L.control.zoom({
        position: 'topright'
    }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const playButton = document.getElementById('playButton');
    if (playButton) {
        playButton.addEventListener('click', () => {
            if (animation.isRunning) {
                stopAnimation();
            } else {
                if (animation.currentFlight >= flights.length) {
                    resetAnimation();
                }
                startAnimation();
            }
        });
    }

    initFlightVisualization();
}

// Initialize flight visualization
async function initFlightVisualization() {
    // Clear existing
    animation.flightPaths.forEach(path => map.removeLayer(path.line));
    animation.flightPaths = [];
    if (animation.aircraftMarker) map.removeLayer(animation.aircraftMarker);

    // Add airports
    flights.forEach(flight => {
        [
            {code: flight.from, name: flight.fromName, coords: flight.fromCoords},
            {code: flight.to, name: flight.toName, coords: flight.toCoords}
        ].forEach(airport => {
            const marker = L.circleMarker(airport.coords, {
                radius: 8,
                fillColor: '#f59e0b',
                color: 'white',
                weight: 2,
                fillOpacity: 1
            }).addTo(map);

            marker.bindPopup(`
                <div style="padding: 12px; text-align: center; min-width: 200px;">
                    <div style="font-weight: 700; font-size: 16px; margin-bottom: 4px;">${airport.code}</div>
                    <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">${airport.name}</div>
                </div>
            `);
        });
    });

    // Add flight paths
    flights.forEach((flight, index) => {
        const pathCoords = greatCirclePath(flight.fromCoords, flight.toCoords);
        const color = flight.type === 'outbound' ? '#10b981' : '#ef4444';
        const isActive = index <= animation.currentFlight;

        const line = L.polyline(pathCoords, {
            color: isActive ? '#3b82f6' : color,
            weight: 4,
            opacity: isActive ? 0.8 : 0.3,
            className: 'flight-path'
        }).addTo(map);

        animation.flightPaths.push({
            line: line,
            coords: pathCoords,
            flight: flight
        });
    });

    // Create realistic aircraft
    createAircraftMarker();

    // Fit map
    const allCoords = flights.flatMap(f => [f.fromCoords, f.toCoords]);
    const bounds = L.latLngBounds(allCoords);
    map.fitBounds(bounds, {padding: [30, 30]});
}

// Great circle path calculation
function greatCirclePath(start, end, points = 50) {
    const path = [];
    const lat1 = start[0] * Math.PI / 180;
    const lng1 = start[1] * Math.PI / 180;
    const lat2 = end[0] * Math.PI / 180;
    const lng2 = end[1] * Math.PI / 180;

    const distance = Math.acos(
        Math.sin(lat1) * Math.sin(lat2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1)
    );

    for (let i = 0; i <= points; i++) {
        const fraction = i / points;

        if (distance === 0) {
            path.push(start);
            continue;
        }

        const a = Math.sin((1 - fraction) * distance) / Math.sin(distance);
        const b = Math.sin(fraction * distance) / Math.sin(distance);

        const x = a * Math.cos(lat1) * Math.cos(lng1) + b * Math.cos(lat2) * Math.cos(lng2);
        const y = a * Math.cos(lat1) * Math.sin(lng1) + b * Math.cos(lat2) * Math.sin(lng2);
        const z = a * Math.sin(lat1) + b * Math.sin(lat2);

        const lat = Math.atan2(z, Math.sqrt(x * x + y * y)) * 180 / Math.PI;
        const lng = Math.atan2(y, x) * 180 / Math.PI;
        path.push([lat, lng]);
    }

    return path;
}

// Calculate bearing for aircraft rotation
function calculateBearing(start, end) {
    const lat1 = start[0] * Math.PI / 180;
    const lng1 = start[1] * Math.PI / 180;
    const lat2 = end[0] * Math.PI / 180;
    const lng2 = end[1] * Math.PI / 180;

    const dLng = lng2 - lng1;
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

// UPDATED: Simulate live flight data
function updateLiveData(flight, progress) {
    // Simulate realistic altitude profile
    let altitude = 0;
    if (progress < 0.15) {
        // Climb phase
        altitude = (progress / 0.15) * flight.cruiseAlt;
    } else if (progress > 0.85) {
        // Descent phase
        altitude = ((1 - progress) / 0.15) * flight.cruiseAlt;
    } else {
        // Cruise phase with minor variations
        altitude = flight.cruiseAlt + (Math.sin(Date.now() / 10000) * 500);
    }

    // Simulate ground speed variations
    const baseSpeed = 450 + Math.random() * 100; // 450-550 mph
    const turbulenceEffect = Math.sin(Date.now() / 5000) * 20;
    const groundSpeed = Math.round(baseSpeed + turbulenceEffect);

    // Simulate vertical speed
    let verticalSpeed = 0;
    if (progress < 0.15) {
        verticalSpeed = 1500 + Math.random() * 500; // Climbing
    } else if (progress > 0.85) {
        verticalSpeed = -(1200 + Math.random() * 400); // Descending
    } else {
        verticalSpeed = (Math.random() - 0.5) * 200; // Minor variations
    }

    animation.liveData = {
        altitude: Math.round(altitude),
        groundSpeed: groundSpeed,
        heading: animation.liveData.heading || 0,
        verticalSpeed: Math.round(verticalSpeed)
    };
}

// Create realistic aircraft marker
function createAircraftMarker() {
    const currentFlight = flights[animation.currentFlight];

    const aircraftIcon = L.divIcon({
        className: 'aircraft-marker',
        iconSize: [48, 48],
        iconAnchor: [24, 24],
        html: `<div class="aircraft-icon"></div>`,
        zIndexOffset: 1000
    });

    animation.aircraftMarker = L.marker(currentFlight.fromCoords, {
        icon: aircraftIcon
    }).addTo(map);

    updateAircraftPopup();
}

// UPDATED: Enhanced aircraft popup with live data
function updateAircraftPopup() {
    const flight = flights[animation.currentFlight];
    const progressPercent = Math.round(animation.progress * 100);
    const liveData = animation.liveData;

    animation.aircraftMarker.bindPopup(`
        <div style="padding: 16px; min-width: 280px;">
            <div style="text-align: center; margin-bottom: 16px;">
                <div style="font-weight: 700; font-size: 18px; margin-bottom: 4px; color: #3b82f6;">
                    ${flight.id}
                </div>
                <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">
                    ${flight.aircraft} • ${flight.registration}
                </div>
                <div style="margin-bottom: 12px;">
                    <span style="font-weight: 600; font-size: 16px;">${flight.from}</span>
                    <span style="margin: 0 12px; color: #3b82f6; font-size: 18px;">✈</span>
                    <span style="font-weight: 600; font-size: 16px;">${flight.to}</span>
                </div>
            </div>

            <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 12px; margin-bottom: 12px;">
                <div style="text-align: center; margin-bottom: 8px; font-size: 12px; color: #0369a1; font-weight: 600;">LIVE FLIGHT DATA</div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 11px;">
                    <div style="text-align: center;">
                        <div style="color: #0369a1; font-size: 9px; text-transform: uppercase; margin-bottom: 2px;">Altitude</div>
                        <div style="font-weight: 700; color: #0c4a6e;">${liveData.altitude.toLocaleString()} ft</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="color: #0369a1; font-size: 9px; text-transform: uppercase; margin-bottom: 2px;">Ground Speed</div>
                        <div style="font-weight: 700; color: #0c4a6e;">${liveData.groundSpeed} mph</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="color: #0369a1; font-size: 9px; text-transform: uppercase; margin-bottom: 2px;">Heading</div>
                        <div style="font-weight: 700; color: #0c4a6e;">${Math.round(liveData.heading)}°</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="color: #0369a1; font-size: 9px; text-transform: uppercase; margin-bottom: 2px;">Vertical Speed</div>
                        <div style="font-weight: 700; color: #0c4a6e;">${liveData.verticalSpeed > 0 ? '+' : ''}${liveData.verticalSpeed} fpm</div>
                    </div>
                </div>
            </div>

            <div style="background: #f1f5f9; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                <div style="background: #e2e8f0; height: 6px; border-radius: 3px; overflow: hidden; margin-bottom: 6px;">
                    <div style="background: linear-gradient(90deg, #3b82f6, #1d4ed8); height: 100%; width: ${progressPercent}%; transition: width 0.3s;"></div>
                </div>
                <div style="font-size: 14px; font-weight: 600; text-align: center;">${progressPercent}% Complete</div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 12px; text-align: center;">
                <div>
                    <div style="color: #64748b; margin-bottom: 2px;">Departure</div>
                    <div style="font-weight: 600;">${flight.departure}</div>
                </div>
                <div>
                    <div style="color: #64748b; margin-bottom: 2px;">Arrival</div>
                    <div style="font-weight: 600;">${flight.arrival}</div>
                </div>
                <div>
                    <div style="color: #64748b; margin-bottom: 2px;">Duration</div>
                    <div style="font-weight: 600;">${flight.duration}</div>
                </div>
                <div>
                    <div style="color: #64748b; margin-bottom: 2px;">Aircraft</div>
                    <div style="font-weight: 600;">${flight.aircraft}</div>
                </div>
            </div>
        </div>
    `);
}

// UPDATED: Enhanced Animation loop
function animate(timestamp) {
    if (!animation.isRunning) return;

    if (!animation.startTime) animation.startTime = timestamp;

    const elapsed = timestamp - animation.startTime;
    const segmentDuration = 8000; // UPDATED: Changed to 8 seconds like standalone

    const totalProgress = elapsed / segmentDuration;
    animation.currentFlight = Math.floor(totalProgress);
    animation.progress = totalProgress - animation.currentFlight;

    if (animation.currentFlight >= flights.length) {
        stopAnimation();
        return;
    }

    // Update aircraft position
    const currentPath = animation.flightPaths[animation.currentFlight];
    if (currentPath) {
        const coords = currentPath.coords;
        const index = Math.floor(animation.progress * (coords.length - 1));
        const nextIndex = Math.min(index + 1, coords.length - 1);
        const localProgress = (animation.progress * (coords.length - 1)) - index;

        const current = coords[index];
        const next = coords[nextIndex];

        const lat = current[0] + (next[0] - current[0]) * localProgress;
        const lng = current[1] + (next[1] - current[1]) * localProgress;

        animation.aircraftMarker.setLatLng([lat, lng]);

        // Calculate and update heading with smooth rotation
        if (index < coords.length - 1) {
            const newHeading = calculateBearing(current, next);
            const element = animation.aircraftMarker.getElement();

            if (element) {
                const aircraftIcon = element.querySelector('.aircraft-icon');
                if (aircraftIcon) {
                    aircraftIcon.style.transform = `rotate(${newHeading}deg)`;
                }
            }

            animation.liveData.heading = newHeading;
        }

        // Update live data simulation
        updateLiveData(flights[animation.currentFlight], animation.progress);
        updateAircraftPopup();
    }

    // Update path colors
    animation.flightPaths.forEach((pathObj, index) => {
        const isActive = index <= animation.currentFlight;
        const flight = pathObj.flight;
        const baseColor = flight.type === 'outbound' ? '#10b981' : '#ef4444';

        pathObj.line.setStyle({
            color: isActive ? '#3b82f6' : baseColor,
            opacity: isActive ? 0.8 : 0.3
        });
    });

    requestAnimationFrame(animate);
}

// Animation control functions
function startAnimation() {
    animation.isRunning = true;
    animation.startTime = null;
    const playButton = document.getElementById('playButton');
    const playText = document.getElementById('playText');

    if (playButton && playText) {
        playButton.classList.add('playing');
        playText.textContent = '⏸ Pause';
    }
    requestAnimationFrame(animate);
}

function stopAnimation() {
    animation.isRunning = false;
    const playButton = document.getElementById('playButton');
    const playText = document.getElementById('playText');

    if (playButton && playText) {
        playButton.classList.remove('playing');
        playText.textContent = animation.currentFlight >= flights.length ? '🔄 Restart' : '▶ Continue';
    }
}

function resetAnimation() {
    animation.currentFlight = 0;
    animation.progress = 0;
    animation.startTime = null;
    animation.liveData.heading = 0;

    if (animation.aircraftMarker) {
        map.removeLayer(animation.aircraftMarker);
        createAircraftMarker();
    }
}

// =====================================================
// ORIGINAL FUNCTIONS (keeping for compatibility)
// =====================================================

// ORIGINAL: Basic flight map setup (fallback for compatibility)
function setupOriginalFlightMap() {
    map = L.map('flight-map', {
        zoomControl: false,
        scrollWheelZoom: false
    }).setView([45.0, -95.0], 3);

    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '',
        maxZoom: 8,
        minZoom: 2
    }).addTo(map);

    setTimeout(() => {
        const flightMap = document.querySelector('.flight-map');
        if (flightMap) {
            flightMap.classList.remove('loading');
        }
    }, 1500);

    createFlightLayers();
    flightLayers.route.addTo(map);
    flightLayers.airports.addTo(map);
    setTimeout(addWeatherOverlay, 2000);
}

// Keep all other original functions for compatibility
function createFlightLayers() {
    flightLayers.route = L.layerGroup();
    flightLayers.airports = L.layerGroup();

    Object.keys(AIRPORTS).forEach(code => {
        const airport = AIRPORTS[code];
        const marker = L.divIcon({
            className: 'airport-marker',
            html: code,
            iconSize: [40, 24],
            iconAnchor: [20, 12]
        });

        L.marker(airport.coords, { icon: marker })
            .bindPopup(`<strong>${airport.name}</strong><br/>${code}`)
            .addTo(flightLayers.airports);
    });

    FLIGHT_ROUTES.forEach((route, index) => {
        const color = getFlightPathColor(route.status);
        const polyline = L.polyline(route.coords, {
            color: color,
            weight: 3,
            opacity: 0.8,
            dashArray: route.status === 'confirmed' ? null : '10, 5'
        }).addTo(flightLayers.route);

        polyline.bindPopup(`
            <div style="text-align: center;">
                <strong>${route.from} → ${route.to}</strong><br/>
                <span style="color: ${color};">${route.status.toUpperCase()}</span>
            </div>
        `);
    });
}

function setupMapControls() {
    const mapToggles = document.querySelectorAll('.map-toggle');
    mapToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const layer = this.dataset.layer;
            toggleMapLayer(layer, this);
        });
    });
}

function toggleMapLayer(layerName, buttonElement) {
    document.querySelectorAll('.map-toggle').forEach(btn => btn.classList.remove('active'));
    buttonElement.classList.add('active');
    activeLayer = layerName;

    Object.values(flightLayers).forEach(layer => map.removeLayer(layer));

    switch(layerName) {
        case 'route':
            flightLayers.route.addTo(map);
            flightLayers.airports.addTo(map);
            break;
        case 'airports':
            flightLayers.airports.addTo(map);
            break;
        case 'weather':
            flightLayers.airports.addTo(map);
            addWeatherOverlay();
            break;
        case 'elevation':
            addElevationLayer();
            flightLayers.airports.addTo(map);
            break;
    }
}

function getFlightPathColor(status) {
    switch(status) {
        case 'confirmed': return '#22c55e';
        case 'pending': return '#f59e0b';
        case 'cancelled': return '#ef4444';
        default: return '#64748b';
    }
}

function addWeatherOverlay() {
    // Simulate weather markers
    const weatherData = [
        { coords: [40, -100], condition: 'Clear', temp: '72°F' },
        { coords: [45, -85], condition: 'Cloudy', temp: '65°F' },
        { coords: [50, -110], condition: 'Snow', temp: '32°F' }
    ];

    weatherData.forEach(weather => {
        const weatherMarker = L.marker(weather.coords, {
            icon: L.divIcon({
                className: 'weather-marker',
                html: `<div class="weather-icon">🌤️</div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            })
        }).addTo(map);

        weatherMarker.bindPopup(`
            <div style="text-align: center;">
                <strong>${weather.condition}</strong><br/>
                ${weather.temp}
            </div>
        `);
    });
}

function addElevationLayer() {
    // Add a simple elevation visualization
    L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        opacity: 0.7
    }).addTo(map);
}

function setupTravelActions() {
    // Travel action handlers - keeping all existing functionality
    const editButtons = document.querySelectorAll('.edit-travel-btn');
    const deleteButtons = document.querySelectorAll('.delete-travel-btn');

    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const itemId = this.dataset.itemId;
            editTravelItem(itemId);
        });
    });

    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const itemId = this.dataset.itemId;
            deleteTravelItem(itemId);
        });
    });
}

function editTravelItem(itemId) {
    // Edit travel item functionality
    console.log('Edit travel item:', itemId);
    showNotification('Edit functionality coming soon', 'info');
}

function deleteTravelItem(itemId) {
    // Delete travel item functionality
    console.log('Delete travel item:', itemId);
    showNotification('Delete functionality coming soon', 'info');
}

function updateFlightStatus() {
    // Update flight status indicators - keeping existing functionality
    const statusIndicators = document.querySelectorAll('.status-indicator');
    const currentTime = new Date();

    statusIndicators.forEach(indicator => {
        // Add dynamic status updates based on current time
        indicator.classList.add('on-time'); // Default status
    });
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Modal system
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
        document.body.style.overflow = '';
    }
});

// Inline editing functionality
function enableInlineEdit(element, itemId, field) {
    const currentValue = element.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentValue;
    input.className = 'inline-edit-input';

    element.parentNode.replaceChild(input, element);
    input.focus();
    input.select();

    function saveEdit() {
        const newValue = input.value;
        if (newValue !== currentValue) {
            // Save to frontend storage (could be localStorage if needed)
            element.textContent = newValue;
            showNotification('Updated successfully', 'success');
        } else {
            element.textContent = currentValue;
        }
        input.parentNode.replaceChild(element, input);
    }

    input.addEventListener('blur', saveEdit);
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveEdit();
        } else if (e.key === 'Escape') {
            element.textContent = currentValue;
            input.parentNode.replaceChild(element, input);
        }
    });
}

// Export functions for global access
window.TravelPage = {
    openModal,
    closeModal,
    showNotification,
    enableInlineEdit,
    startAnimation,
    stopAnimation,
    resetAnimation,
    // Export new status functions
    toggleFlightStatus,
    toggleHotelStatus,
    toggleTransportStatus,
    bulkUpdateStatus
};