// Dashboard specific JavaScript functionality

document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    initializeProgressAnimations();
    initializeStatusCards();
    initializeQuickActions();
    initializeTimeline();
    setupDashboardUpdates();
});

function initializeDashboard() {
    // Add entrance animations to dashboard elements
    const dashboardGrid = document.querySelector('.dashboard-grid');
    if (dashboardGrid) {
        dashboardGrid.style.opacity = '0';
        dashboardGrid.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            dashboardGrid.style.transition = 'all 0.6s ease-out';
            dashboardGrid.style.opacity = '1';
            dashboardGrid.style.transform = 'translateY(0)';
        }, 100);
    }
    
    // Initialize dashboard widgets
    updateDashboardStats();
    startPeriodicUpdates();
}

function initializeProgressAnimations() {
    const progressBars = document.querySelectorAll('.progress-fill');
    
    progressBars.forEach((bar, index) => {
        const targetWidth = bar.style.width;
        
        // Start from 0 and animate to target
        bar.style.width = '0%';
        bar.style.transition = 'none';
        
        setTimeout(() => {
            bar.style.transition = 'width 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            bar.style.width = targetWidth;
            
            // Add completion animation when progress reaches 100%
            if (parseFloat(targetWidth) >= 100) {
                setTimeout(() => {
                    bar.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.6)';
                    bar.style.animation = 'pulse 2s ease-in-out infinite';
                }, 1500);
            }
        }, 300 + (index * 200)); // Stagger animations
    });
}

function initializeStatusCards() {
    const statusCards = document.querySelectorAll('.status-card');
    
    statusCards.forEach((card, index) => {
        // Add hover effects
        card.addEventListener('mouseenter', function() {
            const icon = this.querySelector('.status-icon');
            if (icon) {
                icon.style.transform = 'scale(1.1) rotate(5deg)';
                icon.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.2)';
            }
            
            // Add glow effect
            this.style.boxShadow = '0 8px 30px rgba(212, 175, 55, 0.15)';
        });
        
        card.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.status-icon');
            if (icon) {
                icon.style.transform = 'scale(1) rotate(0deg)';
                icon.style.boxShadow = '';
            }
            
            this.style.boxShadow = '';
        });
        
        // Add click animation
        card.addEventListener('click', function() {
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
        
        // Staggered entrance animation
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 200 + (index * 100));
    });
    
    // Special ring card animations
    const ringCard = document.querySelector('.ring-special');
    if (ringCard) {
        addRingCardEffects(ringCard);
    }
}

function addRingCardEffects(ringCard) {
    const ringIcon = ringCard.querySelector('.ring-icon');
    const deliveredBadge = ringCard.querySelector('.ring-status-badge');
    
    if (ringIcon) {
        // Add sparkle effect to ring icon
        setInterval(() => {
            ringIcon.style.transform = 'scale(1.05)';
            ringIcon.style.filter = 'brightness(1.2)';
            
            setTimeout(() => {
                ringIcon.style.transform = 'scale(1)';
                ringIcon.style.filter = 'brightness(1)';
            }, 300);
        }, 3000);
    }
    
    if (deliveredBadge) {
        // Add success pulse animation
        deliveredBadge.addEventListener('mouseenter', function() {
            this.style.animation = 'pulse 0.6s ease-in-out';
        });
        
        deliveredBadge.addEventListener('animationend', function() {
            this.style.animation = '';
        });
    }
    
    // Add diamond sparkle effect
    createDiamondSparkles(ringCard);
}

function createDiamondSparkles(container) {
    const sparkleContainer = document.createElement('div');
    sparkleContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        overflow: hidden;
        border-radius: inherit;
    `;
    container.style.position = 'relative';
    container.appendChild(sparkleContainer);
    
    function createSparkle() {
        const sparkle = document.createElement('div');
        sparkle.innerHTML = '✨';
        sparkle.style.cssText = `
            position: absolute;
            font-size: ${Math.random() * 12 + 8}px;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: sparkle 2s ease-out forwards;
            z-index: 1;
        `;
        
        sparkleContainer.appendChild(sparkle);
        
        setTimeout(() => {
            if (sparkle.parentNode) {
                sparkle.remove();
            }
        }, 2000);
    }
    
    // Add sparkle animation styles
    if (!document.querySelector('#sparkle-styles')) {
        const sparkleStyles = document.createElement('style');
        sparkleStyles.id = 'sparkle-styles';
        sparkleStyles.textContent = `
            @keyframes sparkle {
                0% {
                    opacity: 0;
                    transform: scale(0) rotate(0deg);
                }
                50% {
                    opacity: 1;
                    transform: scale(1) rotate(180deg);
                }
                100% {
                    opacity: 0;
                    transform: scale(0) rotate(360deg);
                }
            }
        `;
        document.head.appendChild(sparkleStyles);
    }
    
    // Create sparkles periodically
    setInterval(createSparkle, 4000);
}

function initializeQuickActions() {
    const actionItems = document.querySelectorAll('.action-item');
    
    actionItems.forEach((item, index) => {
        // Add ripple effect on click
        item.addEventListener('click', function(e) {
            const ripple = document.createElement('div');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${e.clientX - rect.left - size/2}px;
                top: ${e.clientY - rect.top - size/2}px;
                background: radial-gradient(circle, rgba(212, 175, 55, 0.3) 0%, transparent 70%);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s ease-out;
                pointer-events: none;
                z-index: 1;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => {
                if (ripple.parentNode) {
                    ripple.remove();
                }
            }, 600);
        });
        
        // Staggered entrance animation
        item.style.opacity = '0';
        item.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            item.style.transition = 'all 0.4s ease-out';
            item.style.opacity = '1';
            item.style.transform = 'translateX(0)';
        }, 400 + (index * 100));
    });
    
    // Add ripple animation styles
    if (!document.querySelector('#ripple-styles')) {
        const rippleStyles = document.createElement('style');
        rippleStyles.id = 'ripple-styles';
        rippleStyles.textContent = `
            @keyframes ripple {
                0% {
                    transform: scale(0);
                    opacity: 1;
                }
                100% {
                    transform: scale(1);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(rippleStyles);
    }
}

function initializeTimeline() {
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    // Create intersection observer for timeline animations
    const timelineObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                timelineObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.5,
        rootMargin: '0px 0px -50px 0px'
    });
    
    timelineItems.forEach((item, index) => {
        // Add initial hidden state
        item.style.opacity = '0';
        item.style.transform = 'translateX(20px)';
        
        // Observe for intersection
        timelineObserver.observe(item);
        
        // Add marker pulse animation for in-progress items
        const marker = item.querySelector('.timeline-marker');
        if (item.classList.contains('in-progress') && marker) {
            marker.style.animation = 'pulse 2s ease-in-out infinite';
        }
    });
    
    // Add timeline animation styles
    const timelineStyles = document.createElement('style');
    timelineStyles.textContent = `
        .timeline-item.animate-in {
            opacity: 1 !important;
            transform: translateX(0) !important;
            transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        @keyframes pulse {
            0%, 100% {
                transform: scale(1);
                opacity: 1;
            }
            50% {
                transform: scale(1.2);
                opacity: 0.7;
            }
        }
    `;
    document.head.appendChild(timelineStyles);
}

function setupDashboardUpdates() {
    // Listen for real-time updates (if implementing WebSocket later)
    window.addEventListener('dashboard-update', function(e) {
        const { type, data } = e.detail;
        
        switch (type) {
            case 'budget':
                updateBudgetProgress(data);
                break;
            case 'family':
                updateFamilyProgress(data);
                break;
            case 'packing':
                updatePackingProgress(data);
                break;
            default:
                console.log('Unknown update type:', type);
        }
    });
    
    // Auto-refresh dashboard data every 5 minutes
    setInterval(() => {
        if (!document.hidden) {
            updateDashboardStats();
        }
    }, 5 * 60 * 1000);
}

function updateDashboardStats() {
    // This would typically fetch fresh data from the server
    // For now, we'll just add some visual feedback
    const statusCards = document.querySelectorAll('.status-card');
    
    statusCards.forEach(card => {
        card.style.opacity = '0.7';
        setTimeout(() => {
            card.style.opacity = '1';
        }, 200);
    });
}

function updateBudgetProgress(data) {
    const budgetCard = document.querySelector('.status-card .budget-icon').closest('.status-card');
    const progressBar = budgetCard.querySelector('.progress-fill');
    const valueElement = budgetCard.querySelector('.status-value');
    const percentageElement = budgetCard.querySelector('.status-percentage');
    
    if (progressBar && data.progress !== undefined) {
        progressBar.style.width = `${data.progress}%`;
        
        // Add success animation if completed
        if (data.progress >= 100) {
            progressBar.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.6)';
            progressBar.style.animation = 'pulse 2s ease-in-out infinite';
        }
    }
    
    if (valueElement && data.paid && data.total) {
        valueElement.textContent = `$${data.paid.toFixed(2)} / $${data.total.toFixed(2)}`;
    }
    
    if (percentageElement && data.progress !== undefined) {
        percentageElement.textContent = `${data.progress.toFixed(1)}% Complete`;
    }
    
    // Add update animation
    budgetCard.style.transform = 'scale(1.02)';
    setTimeout(() => {
        budgetCard.style.transform = '';
    }, 200);
}

function updateFamilyProgress(data) {
    const familyCard = document.querySelector('.status-card .family-icon').closest('.status-card');
    const progressBar = familyCard.querySelector('.progress-fill');
    const valueElement = familyCard.querySelector('.status-value');
    const percentageElement = familyCard.querySelector('.status-percentage');
    
    if (progressBar && data.progress !== undefined) {
        progressBar.style.width = `${data.progress}%`;
    }
    
    if (valueElement && data.approved !== undefined && data.total !== undefined) {
        valueElement.textContent = `${data.approved} / ${data.total} Approved`;
    }
    
    if (percentageElement && data.progress !== undefined) {
        percentageElement.textContent = `${data.progress.toFixed(1)}% Family Buy-in`;
    }
    
    // Add update animation
    familyCard.style.transform = 'scale(1.02)';
    setTimeout(() => {
        familyCard.style.transform = '';
    }, 200);
}

function updatePackingProgress(data) {
    const packingCard = document.querySelector('.status-card .packing-icon').closest('.status-card');
    const progressBar = packingCard.querySelector('.progress-fill');
    const valueElement = packingCard.querySelector('.status-value');
    const percentageElement = packingCard.querySelector('.status-percentage');
    
    if (progressBar && data.progress !== undefined) {
        progressBar.style.width = `${data.progress}%`;
    }
    
    if (valueElement && data.packed !== undefined && data.total !== undefined) {
        valueElement.textContent = `${data.packed} / ${data.total} Packed`;
    }
    
    if (percentageElement && data.progress !== undefined) {
        percentageElement.textContent = `${data.progress.toFixed(1)}% Ready`;
    }
    
    // Add update animation
    packingCard.style.transform = 'scale(1.02)';
    setTimeout(() => {
        packingCard.style.transform = '';
    }, 200);
}

function startPeriodicUpdates() {
    // Add some life to the dashboard with periodic animations
    setInterval(() => {
        if (!document.hidden) {
            // Animate heart icons
            const heartIcons = document.querySelectorAll('.fa-heart');
            heartIcons.forEach(heart => {
                heart.style.transform = 'scale(1.1)';
                heart.style.color = '#ff6b6b';
                
                setTimeout(() => {
                    heart.style.transform = '';
                    heart.style.color = '';
                }, 300);
            });
        }
    }, 30000); // Every 30 seconds
    
    // Add subtle glow effects to important elements
    setInterval(() => {
        if (!document.hidden) {
            const ringCard = document.querySelector('.ring-special');
            if (ringCard) {
                ringCard.style.boxShadow = '0 8px 30px rgba(236, 72, 153, 0.2)';
                setTimeout(() => {
                    ringCard.style.boxShadow = '';
                }, 1000);
            }
        }
    }, 45000); // Every 45 seconds
}

// Handle visibility changes to pause animations when tab is hidden
document.addEventListener('visibilitychange', function() {
    const animations = document.querySelectorAll('[style*="animation"]');
    
    if (document.hidden) {
        animations.forEach(el => {
            el.style.animationPlayState = 'paused';
        });
    } else {
        animations.forEach(el => {
            el.style.animationPlayState = 'running';
        });
    }
});

// Export functions for external use
window.dashboardUtils = {
    updateBudgetProgress,
    updateFamilyProgress,
    updatePackingProgress,
    updateDashboardStats
};