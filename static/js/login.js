// Login page JavaScript functionality

document.addEventListener('DOMContentLoaded', function() {
    initializeLoginForm();
    initializeLoginAnimations();
    addKeyboardShortcuts();
});

function initializeLoginForm() {
    const form = document.querySelector('.login-form');
    const usernameInput = document.querySelector('#username');
    const passwordInput = document.querySelector('#password');
    const submitButton = document.querySelector('.login-button');
    
    if (!form || !usernameInput || !passwordInput || !submitButton) return;
    
    // Add input event listeners for validation
    usernameInput.addEventListener('input', validateForm);
    passwordInput.addEventListener('input', validateForm);
    
    // Add focus/blur effects
    [usernameInput, passwordInput].forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
            
            // Add glow effect to input wrapper
            const wrapper = this.closest('.input-wrapper');
            if (wrapper) {
                wrapper.style.boxShadow = '0 0 20px rgba(212, 175, 55, 0.2)';
            }
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
            
            // Remove glow effect
            const wrapper = this.closest('.input-wrapper');
            if (wrapper) {
                wrapper.style.boxShadow = '';
            }
        });
        
        // Add character counter animation
        input.addEventListener('input', function() {
            const icon = this.parentElement.querySelector('.input-icon');
            if (icon && this.value.length > 0) {
                icon.style.color = 'var(--accent-gold)';
                icon.style.transform = 'translateY(-50%) scale(1.1)';
            } else if (icon) {
                icon.style.color = 'rgba(255, 255, 255, 0.6)';
                icon.style.transform = 'translateY(-50%) scale(1)';
            }
        });
    });
    
    // Form submission handling
    form.addEventListener('submit', function(e) {
        if (!validateForm()) {
            e.preventDefault();
            return;
        }
        
        // Add loading state
        addLoadingState(submitButton);
        
        // Add a small delay for visual feedback
        setTimeout(() => {
            // Form will submit naturally
        }, 100);
    });
    
    function validateForm() {
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        
        const isValid = username.length > 0 && password.length > 0;
        
        // Update submit button state
        if (isValid) {
            submitButton.disabled = false;
            submitButton.classList.remove('disabled');
        } else {
            submitButton.disabled = true;
            submitButton.classList.add('disabled');
        }
        
        return isValid;
    }
    
    // Initial validation
    validateForm();
}

function initializeLoginAnimations() {
    // Animate login card entrance
    const loginCard = document.querySelector('.login-card');
    if (loginCard) {
        // Start hidden
        loginCard.style.opacity = '0';
        loginCard.style.transform = 'translateY(30px) scale(0.95)';
        
        // Animate in
        setTimeout(() => {
            loginCard.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            loginCard.style.opacity = '1';
            loginCard.style.transform = 'translateY(0) scale(1)';
        }, 100);
    }
    
    // Animate countdown preview
    const countdownPreview = document.querySelector('.countdown-preview');
    if (countdownPreview) {
        setTimeout(() => {
            countdownPreview.style.opacity = '0';
            countdownPreview.style.transform = 'translateX(20px)';
            countdownPreview.style.transition = 'all 0.6s ease';
            
            setTimeout(() => {
                countdownPreview.style.opacity = '1';
                countdownPreview.style.transform = 'translateX(0)';
            }, 200);
        }, 400);
    }
    
    // Add floating animation to background elements
    animateBackground();
    
    // Add particle effect
    createParticleEffect();
}

function addLoadingState(button) {
    if (button.classList.contains('loading')) return;
    
    button.classList.add('loading');
    
    // Store original content
    const originalHTML = button.innerHTML;
    
    // Create loading content
    const loadingHTML = `
        <div class="loading-content">
            <div class="spinner"></div>
            <span class="loading-text">Signing In...</span>
        </div>
    `;
    
    button.innerHTML = loadingHTML;
    button.disabled = true;
    
    // Add loading styles
    const style = document.createElement('style');
    style.textContent = `
        .login-button.loading {
            pointer-events: none;
            position: relative;
        }
        
        .loading-content {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        }
        
        .loading-content .spinner {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(31, 41, 55, 0.3);
            border-top-color: var(--primary-dark);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        .loading-text {
            font-size: 0.9rem;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    
    if (!document.querySelector('#login-loading-styles')) {
        style.id = 'login-loading-styles';
        document.head.appendChild(style);
    }
    
    // Restore button if form doesn't submit (error case)
    setTimeout(() => {
        if (button.classList.contains('loading')) {
            button.classList.remove('loading');
            button.innerHTML = originalHTML;
            button.disabled = false;
        }
    }, 10000);
}

function animateBackground() {
    const bgGradient = document.querySelector('.bg-gradient');
    const bgPattern = document.querySelector('.bg-pattern');
    
    if (bgGradient) {
        // Subtle color shifting
        let hue = 0;
        setInterval(() => {
            hue = (hue + 0.5) % 360;
            bgGradient.style.filter = `hue-rotate(${hue}deg)`;
        }, 100);
    }
    
    // Add floating particles
    if (bgPattern) {
        // Already has CSS animation, add some randomness
        const randomOffset = Math.random() * 10;
        bgPattern.style.animationDelay = `-${randomOffset}s`;
    }
}

function createParticleEffect() {
    const particleContainer = document.createElement('div');
    particleContainer.className = 'particle-container';
    particleContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1;
        overflow: hidden;
    `;
    
    document.body.appendChild(particleContainer);
    
    // Create particles
    for (let i = 0; i < 20; i++) {
        createParticle(particleContainer);
    }
    
    function createParticle(container) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const size = Math.random() * 4 + 2;
        const startX = Math.random() * window.innerWidth;
        const duration = Math.random() * 20 + 10;
        const delay = Math.random() * 5;
        
        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: radial-gradient(circle, rgba(212, 175, 55, 0.6) 0%, transparent 70%);
            border-radius: 50%;
            left: ${startX}px;
            top: 100vh;
            animation: floatUp ${duration}s linear ${delay}s infinite;
        `;
        
        container.appendChild(particle);
        
        // Remove and recreate particle after animation
        setTimeout(() => {
            if (particle.parentNode) {
                particle.remove();
                createParticle(container);
            }
        }, (duration + delay) * 1000);
    }
    
    // Add particle animation styles
    const particleStyles = document.createElement('style');
    particleStyles.textContent = `
        @keyframes floatUp {
            0% {
                transform: translateY(0) rotate(0deg);
                opacity: 0;
            }
            10% {
                opacity: 1;
            }
            90% {
                opacity: 1;
            }
            100% {
                transform: translateY(-100vh) rotate(360deg);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(particleStyles);
}

function addKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Enter key to submit form
        if (e.key === 'Enter') {
            const form = document.querySelector('.login-form');
            const submitButton = document.querySelector('.login-button');
            
            if (form && submitButton && !submitButton.disabled) {
                // Check if we're focused on an input
                const activeElement = document.activeElement;
                if (activeElement && (activeElement.type === 'text' || activeElement.type === 'password')) {
                    form.submit();
                }
            }
        }
        
        // Escape key to clear form
        if (e.key === 'Escape') {
            const inputs = document.querySelectorAll('.login-input');
            inputs.forEach(input => {
                input.value = '';
                input.blur();
            });
        }
        
        // Tab navigation enhancement
        if (e.key === 'Tab') {
            const focusableElements = document.querySelectorAll('.login-input, .login-button');
            const currentFocus = document.activeElement;
            const currentIndex = Array.from(focusableElements).indexOf(currentFocus);
            
            if (currentIndex !== -1) {
                // Add visual feedback
                setTimeout(() => {
                    const newFocus = document.activeElement;
                    if (newFocus && newFocus.classList.contains('login-input')) {
                        newFocus.parentElement.classList.add('tab-focused');
                        setTimeout(() => {
                            newFocus.parentElement.classList.remove('tab-focused');
                        }, 200);
                    }
                }, 0);
            }
        }
    });
}

// Add some Easter eggs for fun
let konami = [];
const konamiCode = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'KeyB', 'KeyA'
];

document.addEventListener('keydown', function(e) {
    konami.push(e.code);
    
    if (konami.length > konamiCode.length) {
        konami.shift();
    }
    
    if (konami.join(',') === konamiCode.join(',')) {
        // Easter egg activated!
        const loginCard = document.querySelector('.login-card');
        if (loginCard) {
            loginCard.style.animation = 'rainbow 2s ease-in-out';
            
            // Add rainbow animation
            const rainbowStyles = document.createElement('style');
            rainbowStyles.textContent = `
                @keyframes rainbow {
                    0% { filter: hue-rotate(0deg); }
                    25% { filter: hue-rotate(90deg); }
                    50% { filter: hue-rotate(180deg); }
                    75% { filter: hue-rotate(270deg); }
                    100% { filter: hue-rotate(360deg); }
                }
            `;
            document.head.appendChild(rainbowStyles);
            
            setTimeout(() => {
                loginCard.style.animation = '';
                rainbowStyles.remove();
            }, 2000);
        }
        
        konami = [];
    }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // Page is hidden, pause animations
        document.body.style.animationPlayState = 'paused';
    } else {
        // Page is visible, resume animations
        document.body.style.animationPlayState = 'running';
    }
});