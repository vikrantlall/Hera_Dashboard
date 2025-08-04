// Real-time countdown functionality for HERA Dashboard

class CountdownTimer {
    constructor(targetDate, options = {}) {
        this.targetDate = new Date(targetDate);
        this.options = {
            updateInterval: 1000, // Update every second
            showMilliseconds: false,
            autoStart: true,
            onUpdate: null,
            onComplete: null,
            milestones: {
                365: "A full year of planning ahead!",
                200: "Planning phase in full swing!",
                100: "Final countdown begins!",
                50: "Crunch time - last preparations!",
                30: "Final month - everything must be ready!",
                14: "Two weeks until the big moment!",
                7: "One week until forever!",
                1: "Tomorrow changes everything!",
                0: "TODAY IS THE DAY! 💍✨"
            },
            ...options
        };
        
        this.interval = null;
        this.isRunning = false;
        this.lastMilestone = null;
        
        // DOM elements
        this.elements = {
            days: document.querySelector('#countdown-main .countdown-number'),
            hours: document.querySelector('#hours-remaining'),
            minutes: document.querySelector('#minutes-remaining'),
            headerDisplay: document.querySelector('#countdown-display'),
            milestoneMessage: document.querySelector('#milestone-message')
        };
        
        if (this.options.autoStart) {
            this.start();
        }
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.update(); // Initial update
        this.interval = setInterval(() => this.update(), this.options.updateInterval);
    }
    
    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
    
    update() {
        const now = new Date();
        const timeDiff = this.targetDate - now;
        
        if (timeDiff <= 0) {
            this.handleComplete();
            return;
        }
        
        const timeUnits = this.calculateTimeUnits(timeDiff);
        this.updateDisplay(timeUnits);
        this.checkMilestones(timeUnits.days);
        
        if (this.options.onUpdate) {
            this.options.onUpdate(timeUnits);
        }
    }
    
    calculateTimeUnits(timeDiff) {
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
        const milliseconds = timeDiff % 1000;
        
        return { days, hours, minutes, seconds, milliseconds };
    }
    
    updateDisplay(timeUnits) {
        // Update main countdown display
        if (this.elements.days) {
            this.animateNumberChange(this.elements.days, timeUnits.days);
        }
        
        if (this.elements.hours) {
            this.animateNumberChange(this.elements.hours, timeUnits.hours);
        }
        
        if (this.elements.minutes) {
            this.animateNumberChange(this.elements.minutes, timeUnits.minutes);
        }
        
        // Update header display
        if (this.elements.headerDisplay) {
            const headerText = `${timeUnits.days} days, ${timeUnits.hours}h ${timeUnits.minutes}m`;
            this.elements.headerDisplay.textContent = headerText;
        }
    }
    
    animateNumberChange(element, newValue) {
        const currentValue = parseInt(element.textContent) || 0;
        
        if (currentValue !== newValue) {
            // Add change animation
            element.style.transform = 'scale(1.1)';
            element.style.color = 'var(--accent-gold)';
            
            setTimeout(() => {
                element.textContent = newValue;
                element.style.transform = 'scale(1)';
                element.style.color = '';
            }, 150);
        }
    }
    
    checkMilestones(days) {
        // Find the appropriate milestone
        const milestoneKeys = Object.keys(this.options.milestones)
            .map(Number)
            .sort((a, b) => b - a); // Sort descending
        
        let currentMilestone = null;
        for (const milestone of milestoneKeys) {
            if (days >= milestone) {
                currentMilestone = milestone;
                break;
            }
        }
        
        // Update milestone message if changed
        if (currentMilestone !== this.lastMilestone) {
            this.updateMilestoneMessage(currentMilestone);
            this.lastMilestone = currentMilestone;
        }
    }
    
    updateMilestoneMessage(milestone) {
        if (!this.elements.milestoneMessage || milestone === null) return;
        
        const message = this.options.milestones[milestone];
        if (message) {
            // Animate message change
            this.elements.milestoneMessage.style.opacity = '0';
            this.elements.milestoneMessage.style.transform = 'translateY(10px)';
            
            setTimeout(() => {
                this.elements.milestoneMessage.textContent = message;
                this.elements.milestoneMessage.style.opacity = '1';
                this.elements.milestoneMessage.style.transform = 'translateY(0)';
                
                // Add special styling for critical milestones
                if (milestone <= 7) {
                    this.elements.milestoneMessage.style.color = 'var(--accent-gold)';
                    this.elements.milestoneMessage.style.fontWeight = '600';
                } else {
                    this.elements.milestoneMessage.style.color = '';
                    this.elements.milestoneMessage.style.fontWeight = '';
                }
            }, 200);
            
            // Show notification for important milestones
            if (milestone <= 30 && milestone > 0) {
                this.showMilestoneNotification(milestone, message);
            }
        }
    }
    
    showMilestoneNotification(milestone, message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'milestone-notification';
        notification.innerHTML = `
            <div class="milestone-icon">
                <i class="fas fa-heart"></i>
            </div>
            <div class="milestone-content">
                <div class="milestone-title">${milestone} Days to Go!</div>
                <div class="milestone-text">${message}</div>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, var(--accent-gold), var(--secondary-gold));
            color: var(--primary-dark);
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(212, 175, 55, 0.3);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 1rem;
            max-width: 350px;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 5000);
    }
    
    handleComplete() {
        this.stop();
        
        // Update display to show completion
        if (this.elements.days) this.elements.days.textContent = '0';
        if (this.elements.hours) this.elements.hours.textContent = '0';
        if (this.elements.minutes) this.elements.minutes.textContent = '0';
        if (this.elements.headerDisplay) {
            this.elements.headerDisplay.textContent = 'TODAY IS THE DAY!';
        }
        
        // Show completion message
        this.updateMilestoneMessage(0);
        
        // Trigger celebration animation
        this.triggerCelebration();
        
        if (this.options.onComplete) {
            this.options.onComplete();
        }
    }
    
    triggerCelebration() {
        // Add celebration styles
        const celebrationStyles = document.createElement('style');
        celebrationStyles.textContent = `
            @keyframes celebration {
                0%, 100% { transform: scale(1) rotate(0deg); }
                25% { transform: scale(1.1) rotate(5deg); }
                75% { transform: scale(1.1) rotate(-5deg); }
            }
            
            @keyframes heartBeat {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.2); }
            }
            
            .celebration-active {
                animation: celebration 0.6s ease-in-out;
            }
            
            .heart-celebration {
                animation: heartBeat 0.8s ease-in-out infinite;
                color: #ff6b6b !important;
            }
        `;
        document.head.appendChild(celebrationStyles);
        
        // Apply celebration animations
        const countdownHero = document.querySelector('.countdown-hero');
        if (countdownHero) {
            countdownHero.classList.add('celebration-active');
        }
        
        const heartIcons = document.querySelectorAll('.fa-heart');
        heartIcons.forEach(heart => {
            heart.classList.add('heart-celebration');
        });
        
        // Create confetti effect
        this.createConfetti();
        
        // Clean up after animation
        setTimeout(() => {
            celebrationStyles.remove();
            if (countdownHero) {
                countdownHero.classList.remove('celebration-active');
            }
            heartIcons.forEach(heart => {
                heart.classList.remove('heart-celebration');
            });
        }, 3000);
    }
    
    createConfetti() {
        const colors = ['#d4af37', '#b8941f', '#ff6b6b', '#4ecdc4', '#45b7d1'];
        const confettiContainer = document.createElement('div');
        confettiContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
        `;
        document.body.appendChild(confettiContainer);
        
        // Create confetti pieces
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                this.createConfettiPiece(confettiContainer, colors);
            }, i * 100);
        }
        
        // Remove container after animation
        setTimeout(() => {
            if (confettiContainer.parentNode) {
                confettiContainer.remove();
            }
        }, 5000);
    }
    
    createConfettiPiece(container, colors) {
        const confetti = document.createElement('div');
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = Math.random() * 10 + 5;
        const startX = Math.random() * window.innerWidth;
        const duration = Math.random() * 3 + 2;
        const delay = Math.random() * 2;
        
        confetti.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            left: ${startX}px;
            top: -10px;
            animation: confettiFall ${duration}s linear ${delay}s forwards;
            transform-origin: center;
        `;
        
        // Add confetti animation
        const confettiStyles = document.createElement('style');
        confettiStyles.textContent = `
            @keyframes confettiFall {
                0% {
                    transform: translateY(-10px) rotate(0deg);
                    opacity: 1;
                }
                100% {
                    transform: translateY(100vh) rotate(720deg);
                    opacity: 0;
                }
            }
        `;
        if (!document.querySelector('#confetti-styles')) {
            confettiStyles.id = 'confetti-styles';
            document.head.appendChild(confettiStyles);
        }
        
        container.appendChild(confetti);
        
        // Remove piece after animation
        setTimeout(() => {
            if (confetti.parentNode) {
                confetti.remove();
            }
        }, (duration + delay) * 1000);
    }
    
    // Public methods for external control
    setTargetDate(newDate) {
        this.targetDate = new Date(newDate);
        this.lastMilestone = null; // Reset milestone tracking
    }
    
    getTimeRemaining() {
        const now = new Date();
        const timeDiff = Math.max(0, this.targetDate - now);
        return this.calculateTimeUnits(timeDiff);
    }
    
    isComplete() {
        return new Date() >= this.targetDate;
    }
}

// Initialize countdown when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Target date: September 24, 2025
    const targetDate = new Date('2025-09-24T00:00:00');
    
    // Initialize countdown timer
    window.countdownTimer = new CountdownTimer(targetDate, {
        onUpdate: (timeUnits) => {
            // Custom update logic if needed
            updateCountdownColors(timeUnits.days);
        },
        onComplete: () => {
            // Custom completion logic
            console.log('Countdown completed! Today is the big day!');
        }
    });
    
    // Update countdown styling based on days remaining
    function updateCountdownColors(days) {
        const countdownNumber = document.querySelector('.countdown-number');
        if (!countdownNumber) return;
        
        if (days <= 7) {
            // Critical - Red/Gold gradient
            countdownNumber.style.background = 'linear-gradient(135deg, #ff6b6b, var(--accent-gold))';
            countdownNumber.style.webkitBackgroundClip = 'text';
            countdownNumber.style.webkitTextFillColor = 'transparent';
        } else if (days <= 30) {
            // Warning - Orange/Gold gradient
            countdownNumber.style.background = 'linear-gradient(135deg, #ff9500, var(--accent-gold))';
            countdownNumber.style.webkitBackgroundClip = 'text';
            countdownNumber.style.webkitTextFillColor = 'transparent';
        } else {
            // Normal - Gold gradient
            countdownNumber.style.background = 'linear-gradient(135deg, var(--accent-gold), var(--secondary-gold))';
            countdownNumber.style.webkitBackgroundClip = 'text';
            countdownNumber.style.webkitTextFillColor = 'transparent';
        }
    }
});

// Handle page visibility changes to pause/resume countdown
document.addEventListener('visibilitychange', function() {
    if (window.countdownTimer) {
        if (document.hidden) {
            window.countdownTimer.stop();
        } else {
            window.countdownTimer.start();
        }
    }
});

// Export for use in other scripts
window.CountdownTimer = CountdownTimer;