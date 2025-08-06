// Ring JavaScript functionality - COMPACT VERSION - FIXED
// This file should be saved as static/js/ring.js

let selectedFiles = [];
let currentImageIndex = 0;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing ring page...');
    initializeRingPage();
});

function initializeRingPage() {
    setupPhotoUpload();
    setupEditableFields();
    setupImageGallery();
    setupModals();
    setupDragAndDrop();
    console.log('Ring page initialized successfully');
}

// Photo Upload System
function setupPhotoUpload() {
    const fileInput = document.getElementById('photo-upload-input');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            handleFileSelection(e.target.files);
        });
    }

    // Setup upload buttons
    const uploadButtons = document.querySelectorAll('[onclick*="openImageUpload"]');
    uploadButtons.forEach(btn => {
        btn.onclick = function(e) {
            e.preventDefault();
            openImageUpload();
        };
    });
}

function setupDragAndDrop() {
    const dropZone = document.getElementById('upload-drop-zone');
    if (!dropZone) return;

    dropZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('drag-over');

        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files.filter(file => file.type.startsWith('image/'));

        if (imageFiles.length > 0) {
            handleFileSelection(imageFiles);
        }
    });

    dropZone.addEventListener('click', function() {
        document.getElementById('photo-upload-input').click();
    });
}

function openImageUpload() {
    const modal = document.getElementById('photo-upload-modal');
    if (modal) {
        modal.classList.add('show');
        selectedFiles = [];
        updateUploadPreview();
    }
}

function closePhotoUploadModal() {
    const modal = document.getElementById('photo-upload-modal');
    if (modal) {
        modal.classList.remove('show');
        selectedFiles = [];
        updateUploadPreview();
    }
}

function handleFileSelection(files) {
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
        showNotification('Please select only image files', 'error');
        return;
    }

    // Check file sizes (10MB limit)
    const oversizedFiles = imageFiles.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
        showNotification('Some files are larger than 10MB and will be skipped', 'error');
    }

    const validFiles = imageFiles.filter(file => file.size <= 10 * 1024 * 1024);
    selectedFiles = [...selectedFiles, ...validFiles];
    updateUploadPreview();
}

function updateUploadPreview() {
    const previewSection = document.getElementById('upload-preview');
    const previewGrid = document.getElementById('preview-grid');
    const uploadBtn = document.getElementById('upload-photos-btn');

    if (selectedFiles.length === 0) {
        if (previewSection) previewSection.style.display = 'none';
        if (uploadBtn) uploadBtn.style.display = 'none';
        return;
    }

    if (previewSection) previewSection.style.display = 'block';
    if (uploadBtn) uploadBtn.style.display = 'inline-flex';

    if (previewGrid) {
        previewGrid.innerHTML = '';

        selectedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item';
                previewItem.innerHTML = `
                    <img src="${e.target.result}" alt="Preview ${index + 1}">
                    <button class="preview-remove" onclick="removeSelectedFile(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                previewGrid.appendChild(previewItem);
            };
            reader.readAsDataURL(file);
        });
    }
}

function removeSelectedFile(index) {
    selectedFiles.splice(index, 1);
    updateUploadPreview();
}

function uploadSelectedPhotos() {
    if (selectedFiles.length === 0) {
        showNotification('No files selected', 'error');
        return;
    }

    const uploadBtn = document.getElementById('upload-photos-btn');
    const progressSection = document.getElementById('upload-progress');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');

    // Show progress
    if (progressSection) progressSection.style.display = 'block';
    if (uploadBtn) {
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    }

    const formData = new FormData();
    selectedFiles.forEach((file, index) => {
        formData.append('photos', file);
    });

    fetch('/api/ring/upload-photos', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Upload failed: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showNotification('Photos uploaded successfully!', 'success');
            closePhotoUploadModal();
            // Refresh the page to show new images
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            throw new Error(data.error || 'Upload failed');
        }
    })
    .catch(error => {
        console.error('Upload error:', error);
        showNotification('Failed to upload photos', 'error');
    })
    .finally(() => {
        // Reset UI
        if (progressSection) progressSection.style.display = 'none';
        if (uploadBtn) {
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Photos';
        }
        if (progressFill) progressFill.style.width = '0%';
    });
}

// Image Gallery Functions
function setupImageGallery() {
    // Setup thumbnail clicks
    const thumbnails = document.querySelectorAll('.ring-thumbnail');
    thumbnails.forEach(thumbnail => {
        if (!thumbnail.onclick) {
            thumbnail.addEventListener('click', function() {
                const img = this.querySelector('img');
                if (img) {
                    const imageName = img.src.split('/').pop();
                    changeMainImage(imageName);
                }
            });
        }
    });

    // Setup main image click for lightbox
    const mainImage = document.getElementById('main-ring-image');
    if (mainImage) {
        mainImage.addEventListener('click', function() {
            const imageName = this.src.split('/').pop();
            openPhotoLightbox(imageName);
        });
    }
}

function changeMainImage(imageName) {
    const mainImage = document.getElementById('main-ring-image');
    if (mainImage) {
        mainImage.src = `/static/uploads/ring/${imageName}`;

        // Update active thumbnail
        const thumbnails = document.querySelectorAll('.ring-thumbnail');
        thumbnails.forEach(thumb => {
            thumb.classList.remove('active');
            const img = thumb.querySelector('img');
            if (img && img.src.includes(imageName)) {
                thumb.classList.add('active');
            }
        });

        // Update current index for lightbox navigation
        if (window.RING_IMAGES) {
            currentImageIndex = window.RING_IMAGES.indexOf(imageName);
        }
    }
}

function deleteRingImage(imageName) {
    if (!confirm('Are you sure you want to delete this image?')) {
        return;
    }

    fetch(`/api/ring/delete-photo/${imageName}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Image deleted successfully', 'success');

            // Remove from UI
            const thumbnail = document.querySelector(`[onclick*="${imageName}"]`);
            if (thumbnail) {
                thumbnail.remove();
            }

            // If this was the main image, switch to another one or show placeholder
            const mainImage = document.getElementById('main-ring-image');
            if (mainImage && mainImage.src.includes(imageName)) {
                const remainingThumbnails = document.querySelectorAll('.ring-thumbnail');
                if (remainingThumbnails.length > 0) {
                    const firstThumbnail = remainingThumbnails[0];
                    const firstImg = firstThumbnail.querySelector('img');
                    if (firstImg) {
                        const newImageName = firstImg.src.split('/').pop();
                        changeMainImage(newImageName);
                    }
                } else {
                    // No images left, reload to show placeholder
                    window.location.reload();
                }
            }

            // Update RING_IMAGES array
            if (window.RING_IMAGES) {
                const index = window.RING_IMAGES.indexOf(imageName);
                if (index > -1) {
                    window.RING_IMAGES.splice(index, 1);
                }
            }
        } else {
            showNotification('Failed to delete image', 'error');
        }
    })
    .catch(error => {
        console.error('Delete error:', error);
        showNotification('Failed to delete image', 'error');
    });
}

// Photo Lightbox Functions
function openPhotoLightbox(imageName) {
    const lightbox = document.getElementById('photo-lightbox');
    const lightboxImage = document.getElementById('lightbox-image');

    if (lightbox && lightboxImage) {
        lightboxImage.src = `/static/uploads/ring/${imageName}`;
        lightbox.classList.add('show');

        // Set current index for navigation
        if (window.RING_IMAGES) {
            currentImageIndex = window.RING_IMAGES.indexOf(imageName);
        }

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }
}

function closeLightbox() {
    const lightbox = document.getElementById('photo-lightbox');
    if (lightbox) {
        lightbox.classList.remove('show');
        document.body.style.overflow = '';
    }
}

function previousPhoto() {
    if (!window.RING_IMAGES || window.RING_IMAGES.length === 0) return;

    currentImageIndex = (currentImageIndex - 1 + window.RING_IMAGES.length) % window.RING_IMAGES.length;
    const imageName = window.RING_IMAGES[currentImageIndex];

    const lightboxImage = document.getElementById('lightbox-image');
    if (lightboxImage) {
        lightboxImage.src = `/static/uploads/ring/${imageName}`;
    }
}

function nextPhoto() {
    if (!window.RING_IMAGES || window.RING_IMAGES.length === 0) return;

    currentImageIndex = (currentImageIndex + 1) % window.RING_IMAGES.length;
    const imageName = window.RING_IMAGES[currentImageIndex];

    const lightboxImage = document.getElementById('lightbox-image');
    if (lightboxImage) {
        lightboxImage.src = `/static/uploads/ring/${imageName}`;
    }
}

// Ring Details Management
function setupEditableFields() {
    const editableElements = document.querySelectorAll('.editable-text');
    editableElements.forEach(element => {
        element.addEventListener('click', function() {
            makeElementEditable(this);
        });
    });
}

function makeElementEditable(element) {
    if (element.classList.contains('editing')) return;

    const originalValue = element.textContent.trim();
    const field = element.dataset.field;

    element.classList.add('editing');
    element.contentEditable = true;
    element.focus();

    // Select all text
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    function finishEditing() {
        const newValue = element.textContent.trim();
        element.classList.remove('editing');
        element.contentEditable = false;

        if (newValue !== originalValue && newValue !== '') {
            updateRingField(field, newValue, element);
        } else {
            element.textContent = originalValue;
        }
    }

    element.addEventListener('blur', finishEditing);
    element.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            finishEditing();
        }
        if (e.key === 'Escape') {
            element.textContent = originalValue;
            finishEditing();
        }
    });
}

function updateRingField(field, value, element) {
    const data = {
        field: field,
        value: value
    };

    fetch('/api/ring/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Ring details updated', 'success');
            // Update local data
            if (window.RING_DATA) {
                window.RING_DATA[field] = value;
            }
        } else {
            showNotification('Failed to update ring details', 'error');
            // Revert the change
            element.textContent = window.RING_DATA[field] || 'Not specified';
        }
    })
    .catch(error => {
        console.error('Update error:', error);
        showNotification('Failed to update ring details', 'error');
        element.textContent = window.RING_DATA[field] || 'Not specified';
    });
}

// Modal Management
function setupModals() {
    // Close modal when clicking backdrop
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
            closeLightbox();
        }
    });
}

function openRingEditModal() {
    const modal = document.getElementById('ring-edit-modal');
    if (modal && window.RING_DATA) {
        // Populate form with current data using the correct field names
        if (document.getElementById('edit-jeweler')) {
            document.getElementById('edit-jeweler').value = window.RING_DATA['Jeweler'] || '';
        }
        if (document.getElementById('edit-metal')) {
            document.getElementById('edit-metal').value = window.RING_DATA['Metal'] || '';
        }
        if (document.getElementById('edit-stones')) {
            document.getElementById('edit-stones').value = window.RING_DATA['Stone(s)'] || '';
        }
        if (document.getElementById('edit-style')) {
            document.getElementById('edit-style').value = window.RING_DATA['Ring Style (Inspiration)'] || '';
        }
        if (document.getElementById('edit-design-approved')) {
            document.getElementById('edit-design-approved').value = window.RING_DATA['Design Approved'] || '';
        }
        if (document.getElementById('edit-order-placed')) {
            document.getElementById('edit-order-placed').value = window.RING_DATA['Order Placed'] || '';
        }
        if (document.getElementById('edit-delivered')) {
            document.getElementById('edit-delivered').value = window.RING_DATA['Delivered'] || '';
        }
        if (document.getElementById('edit-insured')) {
            document.getElementById('edit-insured').value = window.RING_DATA['Insured'] || '';
        }
        if (document.getElementById('edit-insurance-details')) {
            document.getElementById('edit-insurance-details').value = window.RING_DATA['Insurance Details'] || '';
        }
        if (document.getElementById('edit-engraving')) {
            document.getElementById('edit-engraving').value = window.RING_DATA['Engraving'] || '';
        }
        if (document.getElementById('edit-estimated-delivery')) {
            document.getElementById('edit-estimated-delivery').value = window.RING_DATA['Estimated Delivery'] || '';
        }

        modal.classList.add('show');

        // Focus first input after animation
        setTimeout(() => {
            const firstInput = modal.querySelector('#edit-jeweler');
            if (firstInput) {
                firstInput.focus();
                firstInput.select();
            }
        }, 300);
    }
}

function closeRingEditModal() {
    const modal = document.getElementById('ring-edit-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function updateRingDetails(event) {
    event.preventDefault();

    const formData = {
        'Jeweler': document.getElementById('edit-jeweler').value,
        'Metal': document.getElementById('edit-metal').value,
        'Stone(s)': document.getElementById('edit-stones').value,
        'Ring Style (Inspiration)': document.getElementById('edit-style').value,
        'Design Approved': document.getElementById('edit-design-approved').value,
        'Order Placed': document.getElementById('edit-order-placed').value,
        'Delivered': document.getElementById('edit-delivered').value,
        'Insured': document.getElementById('edit-insured').value,
        'Insurance Details': document.getElementById('edit-insurance-details').value,
        'Engraving': document.getElementById('edit-engraving').value,
        'Estimated Delivery': document.getElementById('edit-estimated-delivery').value
    };

    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitBtn.disabled = true;

    // Update each field individually to match the existing API structure
    const updatePromises = Object.entries(formData).map(([field, value]) => {
        return fetch('/api/ring/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ field, value })
        });
    });

    Promise.all(updatePromises)
    .then(responses => Promise.all(responses.map(r => r.json())))
    .then(results => {
        const allSuccessful = results.every(result => result.success);

        if (allSuccessful) {
            showNotification('Ring details updated successfully', 'success');
            closeRingEditModal();

            // Update local data
            Object.assign(window.RING_DATA, formData);

            // Refresh the page to show updates
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showNotification('Some updates failed', 'error');
        }
    })
    .catch(error => {
        console.error('Update error:', error);
        showNotification('Failed to update ring details', 'error');
    })
    .finally(() => {
        // Reset button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
}

function updateInsuranceStatus() {
    const data = {
        field: 'Insured',
        value: 'Yes'
    };

    fetch('/api/ring/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Insurance status updated', 'success');
            // Update local data and refresh
            if (window.RING_DATA) {
                window.RING_DATA.Insured = 'Yes';
            }
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showNotification('Failed to update insurance status', 'error');
        }
    })
    .catch(error => {
        console.error('Update error:', error);
        showNotification('Failed to update insurance status', 'error');
    });
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal.show');
    modals.forEach(modal => {
        modal.classList.remove('show');
    });
}

// Notification System
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        padding: 12px 16px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        max-width: 350px;
        background: ${getNotificationColor(type)};
    `;

    // Add to page
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Auto-remove after 4 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, 4000);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || icons.info;
}

function getNotificationColor(type) {
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    return colors[type] || colors.info;
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + U to upload photos
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        openImageUpload();
    }

    // Ctrl/Cmd + E to edit details
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        openRingEditModal();
    }

    // Arrow keys for lightbox navigation
    if (document.getElementById('photo-lightbox').classList.contains('show')) {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            previousPhoto();
        }
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            nextPhoto();
        }
    }
});

// Export functions for global access
window.changeMainImage = changeMainImage;
window.deleteRingImage = deleteRingImage;
window.openPhotoLightbox = openPhotoLightbox;
window.closeLightbox = closeLightbox;
window.previousPhoto = previousPhoto;
window.nextPhoto = nextPhoto;
window.openImageUpload = openImageUpload;
window.closePhotoUploadModal = closePhotoUploadModal;
window.uploadSelectedPhotos = uploadSelectedPhotos;
window.removeSelectedFile = removeSelectedFile;
window.openRingEditModal = openRingEditModal;
window.closeRingEditModal = closeRingEditModal;
window.updateRingDetails = updateRingDetails;
window.updateInsuranceStatus = updateInsuranceStatus;