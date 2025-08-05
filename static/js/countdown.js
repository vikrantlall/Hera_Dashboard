// Countdown functionality for HERA Dashboard
// Real-time countdown to proposal trip

let countdownInterval;

document.addEventListener('DOMContentLoaded', function() {
    initializeCountdown();
});

function initializeCountdown() {
    updateCountdown();

    // Update every minute
    countdownInterval = setInterval(updateCountdown, 60000);

    // Update every second for more precision if on dashboard
    if (window.location.pathname === '/' || window.location.pathname.includes('dashboard')) {
        countdownInterval = setInterval(updateCountdown, 1000);
    }
}

function updateCountdown() {
    const tripDate = new Date('2025-09-24T08:00:00'); // 8 AM departure time
    const now = new Date();
    const timeDiff = tripDate - now;

    if (timeDiff > 0) {
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

        // Update various countdown displays
        updateCountdownDisplay('countdown-mini', days, hours, minutes);
        updateCountdownDisplay('countdown-days-large', days, hours, minutes);
        updateCountdownStats(days);

        // Update browser title with countdown
        updatePageTitle(days, hours, minutes);

    } else {
        // Trip has started or passed
        showTripStatus();
    }
}

function updateCountdownDisplay(elementId, days, hours, minutes) {
    const element = document.getElementById(elementId);
    if (!element) return;

    if (elementId === 'countdown-mini') {
        const textElement = element.querySelector('#countdown-text') || element;
        textElement.textContent = `${days}d ${hours}h ${minutes}m`;

    } else if (elementId === 'countdown-days-large') {
        element.textContent = days;

        // Update related hour and minute displays
        const hoursElement = document.getElementById('countdown-hours');
        const minutesElement = document.getElementById('countdown-minutes');

        if (hoursElement) hoursElement.textContent = hours;
        if (minutesElement) minutesElement.textContent = minutes;
    }
}

function updateCountdownStats(days) {
    // Update dashboard stats if on dashboard
    const dashboardDays = document.getElementById('countdown-days');
    if (dashboardDays) {
        dashboardDays.textContent = days;
    }

    // Update any other countdown displays
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(stat => {
        if (stat.parentNode.querySelector('.stat-label')?.textContent === 'Days Until') {
            stat.textContent = days;
        }
    });
}

function updatePageTitle(days, hours, minutes) {
    if (window.location.pathname === '/' || window.location.pathname.includes('dashboard')) {
        document.title = `(${days}d ${hours}h) HERA - Proposal Planning`;
    }
}

function showTripStatus() {
    const now = new Date();
    const tripStart = new Date('2025-09-24T08:00:00');
    const tripEnd = new Date('2025-09-29T23:59:59');

    let statusMessage;
    let statusClass;

    if (now >= tripStart && now <= tripEnd) {
        // Currently on trip
        statusMessage = '🎉 Trip in Progress!';
        statusClass = 'trip-active';
    } else if (now > tripEnd) {
        // Trip completed
        statusMessage = '💍 Trip Completed!';
        statusClass = 'trip-completed';
    }

    // Update countdown displays
    const countdownElements = document.querySelectorAll('#countdown-mini, #countdown-days-large');
    countdownElements.forEach(element => {
        element.textContent = statusMessage;
        element.className += ` ${statusClass}`;
    });

    // Clear interval
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
}

// Milestone Calculations
function getCountdownMilestones() {
    const tripDate = new Date('2025-09-24T08:00:00');
    const now = new Date();
    const daysUntil = Math.floor((tripDate - now) / (1000 * 60 * 60 * 24));

    const milestones = [];

    // Add significant milestones
    if (daysUntil > 100) {
        milestones.push({ days: 100, message: '100 days to go!' });
    }
    if (daysUntil > 50) {
        milestones.push({ days: 50, message: '50 days to go!' });
    }
    if (daysUntil > 30) {
        milestones.push({ days: 30, message: 'One month to go!' });
    }
    if (daysUntil > 14) {
        milestones.push({ days: 14, message: 'Two weeks to go!' });
    }
    if (daysUntil > 7) {
        milestones.push({ days: 7, message: 'One week to go!' });
    }
    if (daysUntil > 3) {
        milestones.push({ days: 3, message: 'Almost time!' });
    }
    if (daysUntil > 1) {
        milestones.push({ days: 1, message: 'Tomorrow is the day!' });
    }

    return milestones;
}

function checkMilestones() {
    const tripDate = new Date('2025-09-24T08:00:00');
    const now = new Date();
    const daysUntil = Math.floor((tripDate - now) / (1000 * 60 * 60 * 24));

    const milestones = getCountdownMilestones();
    const reachedMilestone = milestones.find(m => m.days === daysUntil);

    if (reachedMilestone) {
        showMilestoneNotification(reachedMilestone);
    }
}

function showMilestoneNotification(milestone) {
    // Create special milestone notification
    const notification = document.createElement('div');
    notification.className = 'milestone-notification';
    notification.innerHTML = `
        <div class="milestone-content">
            <i class="fas fa-heart"></i>
            <h3>${milestone.message}</h3>
            <p>The proposal trip is getting closer!</p>
        </div>
        <button class="milestone-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    document.body.appendChild(notification);

    // Add celebration animation
    setTimeout(() => {
        notification.classList.add('celebrate');
    }, 100);

    // Auto remove after 10 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 10000);
}

// Weather Integration (placeholder for future enhancement)
function getWeatherForecast() {
    // This would integrate with a weather API
    // For now, return static data for Banff in September
    return {
        temperature: { min: 5, max: 15, unit: 'C' },
        conditions: 'Partly cloudy with possible rain',
        recommendation: 'Pack layers and waterproof gear'
    };
}

// Export functions
window.CountdownManager = {
    updateCountdown,
    getCountdownMilestones,
    checkMilestones,
    getWeatherForecast
};