// auto-logout.js - Add this to your static/js/ folder
class AutoLogout {
    constructor(timeoutMinutes = 1) {
        this.timeoutDuration = timeoutMinutes * 60 * 1000; // Convert to milliseconds
        this.warningTime = 10 * 1000; // Show warning 10 seconds before logout
        this.timer = null;
        this.warningTimer = null;
        this.warningShown = false;

        // Events that reset the timer
        this.events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

        this.init();
    }

    init() {
        // Only run if user is logged into HERA system (not on login page or games)
        if (window.location.pathname === '/login' || window.location.pathname === '/games') {
            return;
        }

        // Check if user has HERA access
        this.checkHERAAccess().then(hasAccess => {
            if (hasAccess) {
                this.startTimer();
                this.bindEvents();
                this.createWarningModal();
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

        // Set warning timer (50 seconds)
        this.warningTimer = setTimeout(() => {
            this.showWarning();
        }, this.timeoutDuration - this.warningTime);

        // Set logout timer (60 seconds)
        this.timer = setTimeout(() => {
            this.logout();
        }, this.timeoutDuration);
    }

    clearTimer() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        if (this.warningTimer) {
            clearTimeout(this.warningTimer);
            this.warningTimer = null;
        }
        this.hideWarning();
    }

    resetTimer() {
        this.startTimer();
    }

    bindEvents() {
        this.events.forEach(event => {
            document.addEventListener(event, () => {
                this.resetTimer();
            }, true);
        });
    }

    createWarningModal() {
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

        // Bind button events
        document.getElementById('stay-logged-in').addEventListener('click', () => {
            this.resetTimer();
        });

        document.getElementById('logout-now').addEventListener('click', () => {
            this.logout();
        });
    }

    showWarning() {
        if (this.warningShown) return;

        this.warningShown = true;
        const modal = document.getElementById('auto-logout-warning');
        modal.style.display = 'block';

        // Start countdown
        let countdown = 10;
        const countdownEl = document.getElementById('countdown');

        const countdownTimer = setInterval(() => {
            countdown--;
            countdownEl.textContent = countdown;

            if (countdown <= 0) {
                clearInterval(countdownTimer);
            }
        }, 1000);
    }

    hideWarning() {
        this.warningShown = false;
        const modal = document.getElementById('auto-logout-warning');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async logout() {
        try {
            // Clear any local state
            this.clearTimer();

            // Show logout message briefly
            this.showLogoutMessage();

            // Wait a moment then redirect
            setTimeout(() => {
                window.location.href = '/logout';
            }, 1500);

        } catch (error) {
            // Force redirect even if API fails
            window.location.href = '/logout';
        }
    }

    showLogoutMessage() {
        // Create temporary logout message
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
}

// CSS for the auto-logout modal
const autoLogoutStyles = `
<style>
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
    from {
        opacity: 0;
        transform: translateY(-50px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
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
</style>
`;

// Add styles to document
document.head.insertAdjacentHTML('beforeend', autoLogoutStyles);

// Initialize auto-logout when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.autoLogout = new AutoLogout(1); // 1 minute timeout
});

// Backup: Also initialize if DOMContentLoaded already fired
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.autoLogout) {
            window.autoLogout = new AutoLogout(1);
        }
    });
} else {
    window.autoLogout = new AutoLogout(1);
}