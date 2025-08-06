// Travel.js - HERA Dashboard Design System with Enhanced Flight Tracker

// Enhanced flight data for the tracker
const flights = [
    {
        id: 'UA419', type: 'outbound',
        from: 'IAD', to: 'DEN',
        fromName: 'Washington Dulles Intl',
        toName: 'Denver International',
        departure: '08:15', arrival: '10:03',
        duration: '3h 48m',
        aircraft: 'Boeing 737-800',
        registration: 'N73283',
        fromCoords: [38.9445, -77.4558],
        toCoords: [39.8561, -104.6737],
        cruiseAlt: 37000,
        status: 'completed'
    },
    {
        id: 'UA2459', type: 'outbound',
        from: 'DEN', to: 'YYC',
        fromName: 'Denver International',
        toName: 'Calgary International',
        departure: '11:22', arrival: '13:53',
        duration: '2h 31m',
        aircraft: 'Airbus A320neo',
        registration: 'N449UA',
        fromCoords: [39.8561, -104.6737],
        toCoords: [51.1225, -114.0119],
        cruiseAlt: 38000,
        status: 'completed'
    },
    {
        id: 'UA750', type: 'return',
        from: 'YYC', to: 'YYZ',
        fromName: 'Calgary International',
        toName: 'Toronto Pearson Intl',
        departure: '13:55', arrival: '19:04',
        duration: '4h 9m',
        aircraft: 'Boeing 787-8',
        registration: 'N26906',
        fromCoords: [51.1225, -114.0119],
        toCoords: [43.6777, -79.6248],
        cruiseAlt: 41000,
        status: 'active'
    },
    {
        id: 'UA2224', type: 'return',
        from: 'YYZ', to: 'DCA',
        fromName: 'Toronto Pearson Intl',
        toName: 'Reagan National',
        departure: '19:50', arrival: '23:50',
        duration: '3h 0m',
        aircraft: 'Airbus A319',
        registration: 'N876UA',
        fromCoords: [43.6777, -79.6248],
        toCoords: [38.8521, -77.0377],
        cruiseAlt: 35000,
        status: 'scheduled'
    }
];

// Flight tracker animation variables
let animation = {
    isRunning: false,
    currentFlight: 0,
    progress: 0,
    aircraftMarker: null,
    flightPaths: [],
    startTime: null
};

// Global variables
let map;
let flightLayers = {};
let activeLayer = 'route';

// Flight route data
const FLIGHT_ROUTES = [
    { from: 'IAD', to: 'DEN', status: 'confirmed', coords: [[38.9445, -77.4558], [39.8617, -104.6731]] },
    { from: 'DEN', to: 'YYC', status: 'confirmed', coords: [[39.8617, -104.6731], [51.1315, -114.0106]] },
    { from: 'YYC', to: 'YYZ', status: 'pending', coords: [[51.1315, -114.0106], [43.6772, -79.6306]] },
    { from: 'YYZ', to: 'DCA', status: 'pending', coords: [[43.6772, -79.6306], [38.8512, -77.0402]] }
];

const AIRPORTS = {
    'IAD': { name: 'Washington Dulles', coords: [38.9445, -77.4558] },
    'DEN': { name: 'Denver International', coords: [39.8617, -104.6731] },
    'YYC': { name: 'Calgary International', coords: [51.1315, -114.0106] },
    'YYZ': { name: 'Toronto Pearson', coords: [43.6772, -79.6306] },
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

    // Update status every 30 seconds
    setInterval(updateFlightStatus, 30000);
}

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
    animation.flightPaths.forEach(path => map.removeLayer(path.line));
    animation.flightPaths = [];
    if (animation.aircraftMarker) map.removeLayer(animation.aircraftMarker);

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
                <div style="padding: 12px; text-align: center;">
                    <div style="font-weight: 700; font-size: 16px; margin-bottom: 4px;">${airport.code}</div>
                    <div style="font-size: 12px; color: #64748b;">${airport.name}</div>
                </div>
            `);
        });
    });

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

    createAircraftMarker();

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

// **NEW FUNCTION** Calculates the direction (bearing) between two points in degrees.
function calculateBearing(lat1, lng1, lat2, lng2) {
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const y = Math.sin(dLng) * Math.cos(lat2 * Math.PI / 180);
    const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
              Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLng);
    let brng = Math.atan2(y, x) * 180 / Math.PI;
    return (brng + 360) % 360;
}


// Create aircraft marker
function createAircraftMarker() {
    const currentFlight = flights[animation.currentFlight];

    const aircraftIcon = L.divIcon({
        className: 'aircraft-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        html: `<div class="aircraft-icon"></div>`
    });

    animation.aircraftMarker = L.marker(currentFlight.fromCoords, {
        icon: aircraftIcon
    }).addTo(map);

    updateAircraftPopup();
}

// Update aircraft popup
function updateAircraftPopup() {
    const flight = flights[animation.currentFlight];
    const progressPercent = Math.round(animation.progress * 100);

    animation.aircraftMarker.bindPopup(`
        <div style="padding: 16px; min-width: 200px; text-align: center;">
            <div style="font-weight: 700; font-size: 16px; margin-bottom: 4px; color: #3b82f6;">
                ${flight.id}
            </div>
            <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">
                ${flight.aircraft}
            </div>
            <div style="margin-bottom: 12px;">
                <span style="font-weight: 600;">${flight.from}</span>
                <span style="margin: 0 12px; color: #3b82f6;">✈</span>
                <span style="font-weight: 600;">${flight.to}</span>
            </div>
            <div style="background: #f1f5f9; padding: 8px; border-radius: 6px;">
                <div style="font-size: 14px; font-weight: 600;">${progressPercent}% Complete</div>
            </div>
        </div>
    `);
}

// Animation functions
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

    if (animation.aircraftMarker) {
        map.removeLayer(animation.aircraftMarker);
        createAircraftMarker();
    }
}

// **UPDATED FUNCTION**
function animate(timestamp) {
    if (!animation.isRunning) return;

    if (!animation.startTime) animation.startTime = timestamp;

    const elapsed = timestamp - animation.startTime;
    const segmentDuration = 6000; // 6 seconds per flight

    const totalProgress = elapsed / segmentDuration;
    animation.currentFlight = Math.floor(totalProgress);
    animation.progress = totalProgress - animation.currentFlight;

    if (animation.currentFlight >= flights.length) {
        stopAnimation();
        return;
    }

    const currentPath = animation.flightPaths[animation.currentFlight];
    if (currentPath) {
        const coords = currentPath.coords;
        const index = Math.floor(animation.progress * (coords.length - 1));
        const nextIndex = Math.min(index + 1, coords.length - 1);
        const localProgress = (animation.progress * (coords.length - 1)) - index;

        const current = coords[index];
        const next = coords[nextIndex];

        if (!current || !next) {
            requestAnimationFrame(animate);
            return;
        }

        const lat = current[0] + (next[0] - current[0]) * localProgress;
        const lng = current[1] + (next[1] - current[1]) * localProgress;

        animation.aircraftMarker.setLatLng([lat, lng]);
        updateAircraftPopup();

        // **NEW LOGIC** Calculate bearing and rotate the icon
        const bearing = calculateBearing(current[0], current[1], next[0], next[1]);
        if (animation.aircraftMarker.getElement()) {
            const iconElement = animation.aircraftMarker.getElement().querySelector('.aircraft-icon');
            if (iconElement) {
                iconElement.style.transform = `rotate(${bearing}deg)`;
            }
        }
    }

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


// ORIGINAL: Basic flight map setup (fallback)
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
            dashArray: route.status === 'confirmed' ? '0' : '8, 8'
        }).addTo(flightLayers.route);

        setTimeout(() => {
            animateFlightPath(polyline, route);
        }, index * 800);
    });
}

function animateFlightPath(pathElement, route) {
    const planeIcon = L.divIcon({
        className: 'flight-plane-marker',
        html: '<i class="fas fa-plane" style="color: #d4af37; font-size: 14px;"></i>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    const planeMarker = L.marker(route.coords[0], { icon: planeIcon })
        .addTo(flightLayers.route);

    animatePlaneAlongPath(planeMarker, route.coords, 3000);
}

function animatePlaneAlongPath(marker, coords, duration) {
    const start = coords[0];
    const end = coords[1];
    const startTime = Date.now();

    function updatePosition() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const lat = start[0] + (end[0] - start[0]) * progress;
        const lng = start[1] + (end[1] - start[1]) * progress;

        marker.setLatLng([lat, lng]);

        if (progress < 1) {
            requestAnimationFrame(updatePosition);
        } else {
            setTimeout(() => {
                const endCode = Object.keys(AIRPORTS).find(code =>
                    AIRPORTS[code].coords[0] === end[0] && AIRPORTS[code].coords[1] === end[1]
                );
                if (endCode) flashAirport(endCode);
            }, 200);
        }
    }

    updatePosition();
}

function getFlightPathColor(status) {
    switch(status) {
        case 'confirmed': return '#d4af37';
        case 'delayed': return '#f59e0b';
        case 'cancelled': return '#ef4444';
        default: return '#6b7280';
    }
}

function flashAirport(airportCode) {
    const airportMarkers = document.querySelectorAll('.airport-marker');
    airportMarkers.forEach(marker => {
        if (marker.textContent.includes(airportCode)) {
            marker.classList.add('pulse');
            setTimeout(() => {
                marker.classList.remove('pulse');
            }, 2000);
        }
    });
}

// Map Controls
function setupMapControls() {
    const toggles = document.querySelectorAll('.map-toggle');

    toggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const layer = this.dataset.layer;
            switchMapLayer(layer);

            toggles.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function switchMapLayer(layerName) {
    Object.values(flightLayers).forEach(layer => {
        if (map.hasLayer(layer)) {
            map.removeLayer(layer);
        }
    });

    const weatherOverlay = document.querySelector('.weather-overlay');
    if (weatherOverlay) {
        weatherOverlay.remove();
    }

    activeLayer = layerName;

    switch(layerName) {
        case 'route':
            if (flightLayers.route) flightLayers.route.addTo(map);
            if (flightLayers.airports) flightLayers.airports.addTo(map);
            break;
        case 'airports':
            if (flightLayers.airports) flightLayers.airports.addTo(map);
            break;
        case 'weather':
            if (flightLayers.airports) flightLayers.airports.addTo(map);
            addWeatherOverlay();
            break;
        case 'elevation':
            if (flightLayers.airports) flightLayers.airports.addTo(map);
            break;
    }
}

function addWeatherOverlay() {
    const mapContainer = document.querySelector('.flight-map') || document.querySelector('.map-container');
    if (!mapContainer) return;

    const weatherHTML = `
        <div class="weather-overlay">
            <div class="weather-item">
                <span class="weather-location">Washington</span>
                <span class="weather-condition">
                    <i class="fas fa-sun"></i> 72°F
                </span>
            </div>
            <div class="weather-item">
                <span class="weather-location">Denver</span>
                <span class="weather-condition">
                    <i class="fas fa-cloud-sun"></i> 65°F
                </span>
            </div>
            <div class="weather-item">
                <span class="weather-location">Calgary</span>
                <span class="weather-condition">
                    <i class="fas fa-cloud"></i> 58°F
                </span>
            </div>
        </div>
    `;

    mapContainer.insertAdjacentHTML('beforeend', weatherHTML);
}

// Travel Card Management
function setupTravelActions() {
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const card = this.closest('.travel-card');
            if (card) {
                editTravel(card.dataset.travelId);
            }
        });
    });

    document.querySelectorAll('.status-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const card = this.closest('.travel-card');
            if (card) {
                toggleTravelStatus(card);
            }
        });
    });

    document.querySelectorAll('.location-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const location = this.getAttribute('onclick').match(/'([^']*)'/)[1];
            showLocation(location);
        });
    });

    document.querySelectorAll('.editable').forEach(field => {
        field.addEventListener('click', function() {
            startInlineEdit(this);
        });
    });
}

function editTravel(travelId) {
    console.log('Editing travel item:', travelId);
    showNotification('Edit modal would open here', 'info');
}

function toggleTravelStatus(card) {
    card.classList.toggle('success');
    const statusElement = card.querySelector('.detail-value');

    if (card.classList.contains('success')) {
        if (statusElement) {
            statusElement.textContent = 'Confirmed';
            statusElement.className = 'detail-value success';
        }
        showNotification('Status updated to Confirmed', 'success');
    } else {
        if (statusElement) {
            statusElement.textContent = 'Pending';
            statusElement.className = 'detail-value pending';
        }
        showNotification('Status updated to Pending', 'warning');
    }

    console.log('Toggled status for:', card.dataset.travelId);
}

function showLocation(location) {
    console.log('Showing location:', location);
    showNotification(`Would show ${location} on map`, 'info');
}

function toggleFlightStatus(flightId) {
    console.log('Toggling flight status:', flightId);
    const card = document.querySelector(`[data-travel-id="${flightId}"]`);
    if (card) {
        toggleTravelStatus(card);
    }
}

// Inline Editing
function startInlineEdit(element) {
    const currentValue = element.textContent.trim();
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentValue;
    input.className = 'inline-edit-input';

    input.addEventListener('blur', function() {
        saveInlineEdit(element, this.value);
    });

    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveInlineEdit(element, this.value);
        } else if (e.key === 'Escape') {
            element.textContent = currentValue;
        }
    });

    element.innerHTML = '';
    element.appendChild(input);
    input.focus();
    input.select();
}

function saveInlineEdit(element, newValue) {
    element.textContent = newValue;

    const field = element.dataset.field;
    const id = element.dataset.id;

    setTimeout(() => {
        showNotification('Updated successfully', 'success');
    }, 500);
}

// Status Updates
function updateFlightStatus() {
    const lastUpdated = document.getElementById('last-updated');
    if (lastUpdated) {
        lastUpdated.textContent = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    simulateFlightUpdates();
}

function simulateFlightUpdates() {
    const statusItems = document.querySelectorAll('.status-indicator');
    statusItems.forEach((indicator, index) => {
        setTimeout(() => {
            const statuses = ['on-time', 'delayed', ''];
            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

            indicator.className = 'status-indicator';

            if (randomStatus) {
                indicator.classList.add(randomStatus);
            }
        }, index * 1000);
    });
}

// Modal Functions
function openAddFlightModal(type) {
    console.log('Opening add flight modal for:', type);
    showNotification(`Add ${type} flight modal would open`, 'info');
}

function openAddHotelModal() {
    console.log('Opening add hotel modal');
    showNotification('Add hotel modal would open', 'info');
}

function openAddTransportModal() {
    console.log('Opening add transport modal');
    showNotification('Add transport modal would open', 'info');
}

// Notification System
function showNotification(message, type = 'info') {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 100);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// Export functions for global access
window.TravelModule = {
    editTravel,
    toggleTravelStatus,
    toggleFlightStatus,
    showLocation,
    updateFlightStatus,
    openAddFlightModal,
    openAddHotelModal,
    openAddTransportModal,
    startAnimation,
    stopAnimation,
    resetAnimation
};