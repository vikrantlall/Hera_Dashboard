// HERA Travel Module - Flight Map & Travel Management
// Modular design for travel page functionality

let map;
let flightLayers = {};
let weatherLayer;
let activeLayer = 'route';

// Airport coordinates and information
const AIRPORTS = {
    'IAD': {
        coords: [38.9445, -77.4558],
        name: 'Washington Dulles International',
        code: 'IAD',
        city: 'Washington, DC',
        type: 'origin'
    },
    'DEN': {
        coords: [39.8617, -104.6737],
        name: 'Denver International Airport',
        code: 'DEN',
        city: 'Denver, CO',
        type: 'layover'
    },
    'YYC': {
        coords: [51.1315, -114.0106],
        name: 'Calgary International Airport',
        code: 'YYC',
        city: 'Calgary, AB',
        type: 'destination'
    },
    'YYZ': {
        coords: [43.6777, -79.6248],
        name: 'Toronto Pearson International',
        code: 'YYZ',
        city: 'Toronto, ON',
        type: 'layover'
    },
    'DCA': {
        coords: [38.8512, -77.0402],
        name: 'Ronald Reagan Washington National',
        code: 'DCA',
        city: 'Washington, DC',
        type: 'destination'
    }
};

// Flight route data
const FLIGHT_ROUTES = [
    {
        id: 'outbound_1',
        from: 'IAD',
        to: 'DEN',
        flightNumber: 'UA419',
        date: '2025-09-24',
        departure: '13:15',
        arrival: '15:03',
        duration: '3h 48m',
        status: 'confirmed',
        aircraft: 'Boeing 737-800'
    },
    {
        id: 'outbound_2',
        from: 'DEN',
        to: 'YYC',
        flightNumber: 'UA2459',
        date: '2025-09-24',
        departure: '16:22',
        arrival: '18:53',
        duration: '2h 31m',
        status: 'confirmed',
        aircraft: 'Embraer E175'
    },
    {
        id: 'return_1',
        from: 'YYC',
        to: 'YYZ',
        flightNumber: 'UA750',
        date: '2025-09-29',
        departure: '18:55',
        arrival: '00:04+1',
        duration: '4h 9m',
        status: 'confirmed',
        aircraft: 'Boeing 737 MAX 8'
    },
    {
        id: 'return_2',
        from: 'YYZ',
        to: 'DCA',
        flightNumber: 'UA2224',
        date: '2025-09-29',
        departure: '00:50',
        arrival: '04:50',
        duration: '3h',
        status: 'confirmed',
        aircraft: 'Airbus A320'
    }
];

// Initialize travel module
document.addEventListener('DOMContentLoaded', function() {
    initializeFlightMap();
    setupMapControls();
    setupTravelActions();
    updateFlightStatus();

    // Update status every 30 seconds
    setInterval(updateFlightStatus, 30000);
});

// Initialize the interactive flight map
function initializeFlightMap() {
    // Create map centered on North America
    map = L.map('flight-map', {
        center: [45.0, -95.0],
        zoom: 4,
        zoomControl: false,
        attributionControl: false
    });

    // Add custom zoom control
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Add beautiful base layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors, © CARTO',
        subdomains: 'abcd',
        maxZoom: 18
    }).addTo(map);

    // Initialize layers
    initializeMapLayers();

    // Remove loading state
    document.getElementById('flight-map').classList.remove('loading');

    // Add weather overlay
    addWeatherOverlay();
}

// Initialize map layers
function initializeMapLayers() {
    flightLayers = {
        route: new L.LayerGroup(),
        airports: new L.LayerGroup(),
        weather: new L.LayerGroup(),
        elevation: new L.LayerGroup()
    };

    // Add route layer by default
    flightLayers.route.addTo(map);
    flightLayers.airports.addTo(map);

    // Create airport markers
    createAirportMarkers();

    // Create flight paths
    createFlightPaths();

    // Create animated planes
    createFlightAnimations();
}

// Create airport markers with custom styling
function createAirportMarkers() {
    Object.entries(AIRPORTS).forEach(([code, airport]) => {
        // Create custom marker
        const markerElement = document.createElement('div');
        markerElement.className = `airport-marker ${airport.type}`;
        markerElement.innerHTML = `
            <div class="airport-code">${code}</div>
        `;

        const marker = L.marker(airport.coords, {
            icon: L.divIcon({
                html: markerElement.outerHTML,
                className: 'custom-div-icon',
                iconSize: [60, 30],
                iconAnchor: [30, 35]
            })
        });

        // Create detailed popup
        const popupContent = `
            <div class="airport-popup">
                <h4>${airport.name}</h4>
                <p><strong>${code}</strong> • ${airport.city}</p>
                <div class="airport-details">
                    <div class="detail-row">
                        <span>Flights:</span>
                        <span>${getFlightCountForAirport(code)}</span>
                    </div>
                    <div class="detail-row">
                        <span>Status:</span>
                        <span class="status-active">Active</span>
                    </div>
                </div>
            </div>
        `;

        marker.bindPopup(popupContent, {
            maxWidth: 250,
            className: 'airport-popup-container'
        });

        marker.addTo(flightLayers.airports);
    });
}

// Create animated flight paths
function createFlightPaths() {
    FLIGHT_ROUTES.forEach((flight, index) => {
        const fromCoords = AIRPORTS[flight.from].coords;
        const toCoords = AIRPORTS[flight.to].coords;

        // Create realistic curved path using great circle route
        const pathCoords = createCurvedFlightPath(fromCoords, toCoords);

        const flightPath = L.polyline(pathCoords, {
            color: '#d4af37',
            weight: 4,
            opacity: 0.7,
            dashArray: '12, 8',
            className: `flight-path flight-${flight.id}`
        });

        // Add flight info popup to path
        const pathPopupContent = `
            <div class="flight-popup">
                <h4>Flight ${flight.flightNumber}</h4>
                <p>${AIRPORTS[flight.from].city} → ${AIRPORTS[flight.to].city}</p>
                <div class="flight-details">
                    <div class="detail-row">
                        <span>Departure:</span>
                        <span>${flight.departure}</span>
                    </div>
                    <div class="detail-row">
                        <span>Arrival:</span>
                        <span>${flight.arrival}</span>
                    </div>
                    <div class="detail-row">
                        <span>Duration:</span>
                        <span>${flight.duration}</span>
                    </div>
                    <div class="detail-row">
                        <span>Aircraft:</span>
                        <span>${flight.aircraft}</span>
                    </div>
                </div>
            </div>
        `;

        flightPath.bindPopup(pathPopupContent, {
            className: 'flight-popup-container'
        });

        flightPath.addTo(flightLayers.route);

        // Store path coordinates for plane animation
        flight.pathCoords = pathCoords;

        // Animate the path drawing with delay
        setTimeout(() => {
            animateFlightPath(flightPath, index);
        }, index * 1000);
    });
}

// Create animated plane icons that follow flight paths sequentially
function createFlightAnimations() {
    // Start the sequential flight animation
    startSequentialFlightAnimation();
}

// Create realistic curved flight path
function createCurvedFlightPath(from, to) {
    const points = [];
    const numPoints = 50; // More points for smoother curve

    // Calculate great circle path with realistic aviation curve
    for (let i = 0; i <= numPoints; i++) {
        const fraction = i / numPoints;

        // Create realistic flight path curve (higher altitude over land)
        const lat = from[0] + (to[0] - from[0]) * fraction;
        const lng = from[1] + (to[1] - from[1]) * fraction;

        // Add curvature based on distance and direction
        const distance = Math.sqrt(Math.pow(to[0] - from[0], 2) + Math.pow(to[1] - from[1], 2));
        const curvature = Math.sin(fraction * Math.PI) * distance * 0.15;

        points.push([lat + curvature, lng]);
    }

    return points;
}

// Start sequential flight animations
function startSequentialFlightAnimation() {
    let currentFlightIndex = 0;

    function animateNextFlight() {
        if (currentFlightIndex >= FLIGHT_ROUTES.length) {
            // All flights done, restart the sequence
            setTimeout(() => {
                currentFlightIndex = 0;
                animateNextFlight();
            }, 3000);
            return;
        }

        const flight = FLIGHT_ROUTES[currentFlightIndex];
        animatePlaneAlongPath(flight, () => {
            currentFlightIndex++;
            // Start next flight after current one completes
            setTimeout(animateNextFlight, 500);
        });
    }

    // Start the first flight animation after a short delay
    setTimeout(animateNextFlight, 2000);
}

// Animate plane following the actual flight path
function animatePlaneAlongPath(flight, onComplete) {
    const pathCoords = flight.pathCoords;
    if (!pathCoords || pathCoords.length === 0) return;

    // Create plane marker with proper airplane icon
    const planeIcon = L.divIcon({
        html: `<div class="animated-plane">✈️</div>`,
        className: 'plane-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });

    const planeMarker = L.marker(pathCoords[0], { icon: planeIcon });
    planeMarker.addTo(flightLayers.route);

    // Add flight info popup to plane
    planeMarker.bindPopup(`
        <div class="plane-popup">
            <h4>Flight ${flight.flightNumber}</h4>
            <p>${AIRPORTS[flight.from].code} → ${AIRPORTS[flight.to].code}</p>
            <p><strong>Status:</strong> In Flight</p>
        </div>
    `);

    // Animate plane along path
    let currentPointIndex = 0;
    const animationDuration = 8000; // 8 seconds per flight
    const intervalTime = animationDuration / pathCoords.length;

    const animationInterval = setInterval(() => {
        if (currentPointIndex >= pathCoords.length - 1) {
            // Flight complete
            clearInterval(animationInterval);

            // Flash the destination airport
            flashAirport(flight.to);

            // Remove plane after brief pause
            setTimeout(() => {
                map.removeLayer(planeMarker);
                if (onComplete) onComplete();
            }, 1000);

            return;
        }

        const currentPoint = pathCoords[currentPointIndex];
        const nextPoint = pathCoords[currentPointIndex + 1];

        // Calculate bearing for plane rotation
        const bearing = calculateBearing(currentPoint, nextPoint);

        // Update plane position and rotation
        planeMarker.setLatLng(currentPoint);
        const planeElement = planeMarker.getElement();
        if (planeElement) {
            const planeDiv = planeElement.querySelector('.animated-plane');
            if (planeDiv) {
                planeDiv.style.transform = `rotate(${bearing}deg)`;
            }
        }

        currentPointIndex++;
    }, intervalTime);
}

// Animate flight path drawing with enhanced visual effect
function animateFlightPath(path, index) {
    const pathElement = path.getElement();
    if (pathElement) {
        // Initial state - hidden path
        pathElement.style.strokeDasharray = '0, 1000';
        pathElement.style.strokeDashoffset = '0';

        // Animate path drawing
        setTimeout(() => {
            pathElement.style.transition = 'stroke-dasharray 2s ease-in-out';
            pathElement.style.strokeDasharray = '12, 8';
        }, 100);

        // Add glow effect during drawing
        pathElement.style.filter = 'drop-shadow(0 0 6px rgba(212, 175, 55, 0.6))';
    }
}

// Calculate bearing between two points for plane rotation
function calculateBearing(point1, point2) {
    const lat1 = point1[0] * Math.PI / 180;
    const lat2 = point2[0] * Math.PI / 180;
    const deltaLng = (point2[1] - point1[1]) * Math.PI / 180;

    const x = Math.sin(deltaLng) * Math.cos(lat2);
    const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

    const bearing = Math.atan2(x, y) * 180 / Math.PI;
    return (bearing + 360) % 360;
}

// Flash airport when plane arrives
function flashAirport(airportCode) {
    const airportMarkers = document.querySelectorAll('.airport-marker');
    airportMarkers.forEach(marker => {
        if (marker.textContent.includes(airportCode)) {
            marker.style.animation = 'flash-airport 1s ease-in-out';
            setTimeout(() => {
                marker.style.animation = '';
            }, 1000);
        }
    });
}

// Setup map control interactions
function setupMapControls() {
    const toggles = document.querySelectorAll('.map-toggle');

    toggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const layer = this.dataset.layer;
            switchMapLayer(layer);

            // Update active state
            toggles.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Switch between map layers
function switchMapLayer(layerName) {
    // Remove all layers
    Object.values(flightLayers).forEach(layer => {
        map.removeLayer(layer);
    });

    activeLayer = layerName;

    // Add requested layer
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
            addWeatherLayer();
            break;
        case 'elevation':
            flightLayers.airports.addTo(map);
            addElevationLayer();
            break;
    }
}

// Add weather overlay to map
function addWeatherLayer() {
    // Simulate weather data for airports
    const weatherData = {
        'IAD': { temp: '72°F', condition: 'Clear', icon: 'fas fa-sun' },
        'DEN': { temp: '65°F', condition: 'Partly Cloudy', icon: 'fas fa-cloud-sun' },
        'YYC': { temp: '58°F', condition: 'Overcast', icon: 'fas fa-cloud' },
        'YYZ': { temp: '68°F', condition: 'Clear', icon: 'fas fa-sun' },
        'DCA': { temp: '74°F', condition: 'Clear', icon: 'fas fa-sun' }
    };

    Object.entries(weatherData).forEach(([code, weather]) => {
        const airport = AIRPORTS[code];
        const weatherMarker = L.marker(airport.coords, {
            icon: L.divIcon({
                html: `
                    <div class="weather-marker">
                        <i class="${weather.icon}"></i>
                        <span>${weather.temp}</span>
                    </div>
                `,
                className: 'weather-icon',
                iconSize: [60, 40],
                iconAnchor: [30, 40]
            })
        });

        weatherMarker.bindPopup(`
            <div class="weather-popup">
                <h4>${airport.city}</h4>
                <p><i class="${weather.icon}"></i> ${weather.condition}</p>
                <p><strong>${weather.temp}</strong></p>
            </div>
        `);

        weatherMarker.addTo(flightLayers.weather);
    });

    flightLayers.weather.addTo(map);
}

// Add elevation/terrain layer
function addElevationLayer() {
    // Add terrain tiles
    const terrainLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenTopoMap contributors'
    });

    terrainLayer.addTo(map);
    flightLayers.elevation = terrainLayer;
}

// Add weather overlay widget
function addWeatherOverlay() {
    const weatherHTML = `
        <div class="weather-overlay">
            <h4><i class="fas fa-cloud"></i> Current Weather</h4>
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

    document.querySelector('.flight-map').insertAdjacentHTML('beforeend', weatherHTML);
}

// Setup travel card interactions
function setupTravelActions() {
    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const card = this.closest('.travel-card');
            editTravel(card.dataset.travelId);
        });
    });

    // Status toggles
    document.querySelectorAll('.status-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const card = this.closest('.travel-card');
            toggleTravelStatus(card);
        });
    });

    // Editable fields
    document.querySelectorAll('.editable').forEach(field => {
        field.addEventListener('click', function() {
            startInlineEdit(this);
        });
    });
}

// Update flight status periodically
function updateFlightStatus() {
    const lastUpdated = document.getElementById('last-updated');
    if (lastUpdated) {
        lastUpdated.textContent = new Date().toLocaleTimeString();
    }

    // Simulate real-time flight updates
    simulateFlightUpdates();
}

// Simulate flight status updates
function simulateFlightUpdates() {
    const statusItems = document.querySelectorAll('.status-indicator');
    statusItems.forEach((indicator, index) => {
        // Randomly update status indicators
        setTimeout(() => {
            const statuses = ['on-time', 'delayed', ''];
            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

            indicator.className = `status-indicator ${randomStatus}`;
        }, index * 2000);
    });
}

// Utility Functions
function calculateCurvature(from, to) {
    const distance = Math.sqrt(
        Math.pow(to[0] - from[0], 2) + Math.pow(to[1] - from[1], 2)
    );

    return {
        lat: distance * 0.1,
        lng: 0
    };
}

function getFlightPathColor(status) {
    switch(status) {
        case 'confirmed': return '#d4af37';
        case 'delayed': return '#f59e0b';
        case 'cancelled': return '#ef4444';
        default: return '#6b7280';
    }
}

function getFlightCountForAirport(code) {
    return FLIGHT_ROUTES.filter(flight =>
        flight.from === code || flight.to === code
    ).length;
}

// Travel Management Functions
function editTravel(travelId) {
    console.log('Editing travel item:', travelId);
    // Open edit modal
}

function toggleTravelStatus(card) {
    card.classList.toggle('success');
    console.log('Toggled status for:', card.dataset.travelId);
}

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
        }
    });

    element.innerHTML = '';
    element.appendChild(input);
    input.focus();
}

function saveInlineEdit(element, newValue) {
    element.textContent = newValue;

    // Save to backend
    const field = element.dataset.field;
    const id = element.dataset.id;

    fetch('/api/travel/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id: id,
            field: field,
            value: newValue
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Updated successfully', 'success');
        } else {
            showNotification('Update failed', 'error');
        }
    });
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Export functions for global access
window.TravelModule = {
    editTravel,
    toggleTravelStatus,
    updateFlightStatus
};