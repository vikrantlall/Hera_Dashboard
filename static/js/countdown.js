// Enhanced Dual-Phase Countdown for HERA Dashboard
// Phase 1: Countdown to Trip Departure (Sept 24, 8 AM)
// Phase 2: Countdown to Proposal Moment (Sept 26, during Emerald Lake activity)

let countdownInterval;

// Key dates and times
const TRIP_DATES = {
    departure: new Date('2025-09-24T08:00:00-06:00'), // 8 AM Mountain Time - Flight departure
    proposal: new Date('2025-09-26T14:30:00-06:00'),  // 2:30 PM Mountain Time - Proposal at Emerald Lake
    tripEnd: new Date('2025-09-29T23:59:59-06:00')   // End of trip
};

document.addEventListener('DOMContentLoaded', function() {
    initializeDualCountdown();
});

function initializeDualCountdown() {
    console.log('💍 Starting HERA Dual-Phase countdown timer...');
    console.log('Trip Departure:', TRIP_DATES.departure);
    console.log('Proposal Moment:', TRIP_DATES.proposal);
    
    updateCountdown();

    // Update every second for real-time precision
    countdownInterval = setInterval(updateCountdown, 1000);
}

function updateCountdown() {
    const now = new Date();
    
    // Determine which phase we're in
    if (now < TRIP_DATES.departure) {
        // PHASE 1: Countdown to trip departure
        updateTripCountdown(now);
    } else if (now >= TRIP_DATES.departure && now < TRIP_DATES.proposal) {
        // PHASE 2: Countdown to proposal moment
        updateProposalCountdown(now);
    } else if (now >= TRIP_DATES.proposal && now < TRIP_DATES.tripEnd) {
        // PHASE 3: Trip in progress, proposal happened
        showTripInProgress();
    } else {
        // PHASE 4: Trip completed
        showTripCompleted();
    }
}

function updateTripCountdown(now) {
    const timeDiff = TRIP_DATES.departure - now;
    const { days, hours, minutes, seconds } = calculateTimeComponents(timeDiff);
    
    console.log(`Trip Countdown: ${days}d ${hours}h ${minutes}m ${seconds}s`);
    
    // Update countdown display
    updateCountdownDisplay({
        title: "Until The Big Trip",
        subtitle: "Departure to Banff • September 24, 2025",
        days, hours, minutes,
        phase: "trip"
    });
    
    // Update page title
    document.title = `(${days}d ${hours}h ${minutes}m) HERA - Big Trip Countdown`;
}

function updateProposalCountdown(now) {
    const timeDiff = TRIP_DATES.proposal - now;
    const { days, hours, minutes, seconds } = calculateTimeComponents(timeDiff);
    
    console.log(`Proposal Countdown: ${days}d ${hours}h ${minutes}m ${seconds}s`);
    
    // Update countdown display with proposal theme
    updateCountdownDisplay({
        title: "Until The Big Moment",
        subtitle: "Proposal at Emerald Lake • September 26, 2025",
        days, hours, minutes,
        phase: "proposal"
    });
    
    // Update page title with special styling
    document.title = `💍 (${days}d ${hours}h ${minutes}m) HERA - The Moment!`;
}

function updateCountdownDisplay({ title, subtitle, days, hours, minutes, phase }) {
    // Update title and subtitle
    const countdownTitle = document.querySelector('.countdown-title');
    const tripDates = document.querySelector('.trip-dates');
    
    if (countdownTitle) countdownTitle.textContent = title;
    if (tripDates) tripDates.textContent = subtitle;
    
    // Update time values
    const daysElement = document.getElementById('countdown-days-large');
    const hoursElement = document.getElementById('countdown-hours');
    const minutesElement = document.getElementById('countdown-minutes');

    if (daysElement) daysElement.textContent = days;
    if (hoursElement) hoursElement.textContent = hours;
    if (minutesElement) minutesElement.textContent = minutes;

    // Update mini countdown displays
    const miniCountdown = document.getElementById('countdown-text');
    if (miniCountdown) {
        miniCountdown.textContent = `${days}d ${hours}h ${minutes}m`;
    }
    
    // Add phase-specific styling
    const countdownDisplay = document.querySelector('.countdown-display');
    if (countdownDisplay) {
        // Remove existing phase classes
        countdownDisplay.classList.remove('trip-phase', 'proposal-phase');
        
        // Add current phase class
        if (phase === "proposal") {
            countdownDisplay.classList.add('proposal-phase');
            
            // Add special proposal styling
            if (!countdownDisplay.querySelector('.proposal-indicator')) {
                const indicator = document.createElement('div');
                indicator.className = 'proposal-indicator';
                indicator.innerHTML = '💍';
                countdownDisplay.insertBefore(indicator, countdownDisplay.firstChild);
            }
        } else {
            countdownDisplay.classList.add('trip-phase');
        }
    }

    // Update any stat cards
    updateStatsDisplay(days);
}

function showTripInProgress() {
    console.log('🎉 Trip is in progress - Proposal happened!');
    
    const countdownTitle = document.querySelector('.countdown-title');
    const tripDates = document.querySelector('.trip-dates');
    const daysElement = document.getElementById('countdown-days-large');
    const hoursElement = document.getElementById('countdown-hours');
    const minutesElement = document.getElementById('countdown-minutes');
    
    if (countdownTitle) countdownTitle.textContent = "The Big Moment Happened!";
    if (tripDates) tripDates.textContent = "Enjoying the engagement trip in Banff 🎉";
    
    // Show celebration message
    if (daysElement) daysElement.textContent = "💍";
    if (hoursElement) hoursElement.textContent = "🎉";
    if (minutesElement) minutesElement.textContent = "❤️";
    
    // Update labels
    const labels = document.querySelectorAll('.countdown-label');
    labels.forEach((label, index) => {
        const messages = ["ENGAGED", "CELEBRATING", "LOVE"];
        if (messages[index]) label.textContent = messages[index];
    });
    
    document.title = "💍 HERA - Engagement Trip in Progress!";
    
    // Add celebration styling
    const countdownDisplay = document.querySelector('.countdown-display');
    if (countdownDisplay) {
        countdownDisplay.classList.add('celebration-mode');
    }
}

function showTripCompleted() {
    console.log('✅ Trip completed - Welcome back!');
    
    const countdownTitle = document.querySelector('.countdown-title');
    const tripDates = document.querySelector('.trip-dates');
    const daysElement = document.getElementById('countdown-days-large');
    const hoursElement = document.getElementById('countdown-hours');
    const minutesElement = document.getElementById('countdown-minutes');
    
    if (countdownTitle) countdownTitle.textContent = "The Adventure is Complete!";
    if (tripDates) tripDates.textContent = "September 24-29, 2025 • Banff, Alberta ✅";
    
    // Show completion message
    if (daysElement) daysElement.textContent = "✅";
    if (hoursElement) hoursElement.textContent = "💍";  
    if (minutesElement) minutesElement.textContent = "🏠";
    
    // Update labels
    const labels = document.querySelectorAll('.countdown-label');
    labels.forEach((label, index) => {
        const messages = ["COMPLETE", "ENGAGED", "HOME"];
        if (messages[index]) label.textContent = messages[index];
    });
    
    document.title = "💍 HERA - Trip Complete!";
    
    // Clear the interval
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}

function calculateTimeComponents(timeDiff) {
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    
    return { days, hours, minutes, seconds };
}

function updateStatsDisplay(days) {
    // Update dashboard stat cards that show days until
    const dashboardDays = document.getElementById('countdown-days');
    if (dashboardDays) {
        dashboardDays.textContent = days;
    }

    // Update any stat cards with "Days Until" label
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        const label = card.querySelector('.stat-label');
        if (label && label.textContent.includes('Days Until')) {
            const number = card.querySelector('.stat-number');
            if (number) number.textContent = days;
        }
    });
}

// Special milestone notifications for proposal phase
function checkProposalMilestones(days, hours) {
    const milestones = [
        { days: 2, hours: 0, message: '🚨 Two days until the proposal!' },
        { days: 1, hours: 0, message: '⏰ Tomorrow is proposal day!' },
        { days: 0, hours: 12, message: '🌅 Proposal day has arrived!' },
        { days: 0, hours: 6, message: '⏳ 6 hours until the big moment!' },
        { days: 0, hours: 1, message: '💍 ONE HOUR until the proposal!' },
        { days: 0, hours: 0, message: '🎯 The moment has arrived!' }
    ];

    const milestone = milestones.find(m => m.days === days && m.hours === hours);
    if (milestone) {
        console.log(milestone.message);
        
        // Show notification if available
        if (typeof showNotification === 'function') {
            showNotification(milestone.message, 'success');
        }
    }
}

// Get current countdown phase info
function getCurrentPhase() {
    const now = new Date();
    
    if (now < TRIP_DATES.departure) {
        return {
            phase: 'trip-countdown',
            description: 'Counting down to trip departure',
            nextEvent: 'Trip Departure',
            nextDate: TRIP_DATES.departure
        };
    } else if (now < TRIP_DATES.proposal) {
        return {
            phase: 'proposal-countdown',
            description: 'On trip, counting down to proposal',
            nextEvent: 'The Proposal',
            nextDate: TRIP_DATES.proposal
        };
    } else if (now < TRIP_DATES.tripEnd) {
        return {
            phase: 'trip-progress',
            description: 'Proposal complete, enjoying engagement trip',
            nextEvent: 'Trip End',
            nextDate: TRIP_DATES.tripEnd
        };
    } else {
        return {
            phase: 'trip-complete',
            description: 'Trip and proposal completed',
            nextEvent: null,
            nextDate: null
        };
    }
}

// Cleanup function
function stopCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
        console.log('⏹️ Countdown stopped');
    }
}

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        console.log('📴 Page hidden, countdown continues...');
    } else {
        console.log('👀 Page visible, ensuring countdown is active...');
        if (!countdownInterval) {
            initializeDualCountdown();
        }
    }
});

// Export functions for global access
window.HERA_Countdown = {
    start: initializeDualCountdown,
    stop: stopCountdown,
    getCurrentPhase: getCurrentPhase,
    TRIP_DATES: TRIP_DATES
};