// Ring JavaScript functionality - FIXED VERSION
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

    if (dropZone) {
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

    // Check file sizes
    const oversizedFiles = imageFiles.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
        showNotification('Some files are larger than 10MB and will be skipped', 'warning');
    }

    const validFiles = imageFiles.filter(file => file.size <= 10 * 1024 * 1024);

    // Add to selected files
    selectedFiles = [...selectedFiles, ...validFiles];
    updateUploadPreview();
}

function updateUploadPreview() {
    const previewSection = document.getElementById('upload-preview');
    const previewGrid = document.getElementById('preview-grid');
    const uploadBtn = document.getElementById('upload-photos-btn');

    if (selectedFiles.length === 0) {
        previewSection.style.display = 'none';
        uploadBtn.style.display = 'none';
        return;
    }

    previewSection.style.display = 'block';
    uploadBtn.style.display = 'inline-flex';

    previewGrid.innerHTML = '';

    selectedFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <button class="preview-remove" onclick="removeSelectedFile(${index})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            previewGrid.appendChild(previewItem);
        };
        reader.readAsDataURL(file);
    });
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

    const progressSection = document.getElementById('upload-progress');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const uploadBtn = document.getElementById('upload-photos-btn');

    progressSection.style.display = 'block';
    uploadBtn.style.display = 'none';

    let uploadedCount = 0;
    const totalFiles = selectedFiles.length;

    const uploadPromises = selectedFiles.map((file, index) => {
        return uploadSinglePhoto(file)
            .then(() => {
                uploadedCount++;
                const progress = (uploadedCount / totalFiles) * 100;
                progressFill.style.width = `${progress}%`;
                progressText.textContent = `Uploading... ${uploadedCount}/${totalFiles}`;
            })
            .catch(error => {
                console.error('Upload failed for file:', file.name, error);
            });
    });

    Promise.all(uploadPromises)
        .then(() => {
            progressText.textContent = 'Upload complete!';
            showNotification(`${uploadedCount} photos uploaded successfully!`, 'success');

            setTimeout(() => {
                closePhotoUploadModal();
                location.reload(); // Refresh to show new images
            }, 1500);
        })
        .catch(error => {
            console.error('Upload error:', error);
            showNotification('Some uploads failed', 'error');
        });
}

function uploadSinglePhoto(file) {
    const formData = new FormData();
    formData.append('photo', file);

    return fetch('/api/ring/upload-photo', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (!data.success) {
            throw new Error(data.error || 'Upload failed');
        }
        return data;
    });
}

// Image Gallery Functions
function setupImageGallery() {
    // Setup thumbnail clicks
    const thumbnails = document.querySelectorAll('.ring-thumbnail');
    thumbnails.forEach(thumbnail => {
        thumbnail.addEventListener('click', function() {
            if (this.onclick) return; // Skip if onclick is already set

            const img = this.querySelector('img');
            if (img) {
                changeMainImage(img.src.split('/').pop());
            }
        });
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

            // If this was the main image, switch to another one
            const mainImage = document.getElementById('main-ring-image');
            if (mainImage && mainImage.src.includes(imageName)) {
                const remainingThumbnails = document.querySelectorAll('.ring-thumbnail');
                if (remainingThumbnails.length > 0) {
                    const firstThumbnail = remainingThumbnails[0];
                    const firstImg = firstThumbnail.querySelector('img');
                    if (firstImg) {
                        changeMainImage(firstImg.src.split('/').pop());
                    }
                } else {
                    // No images left, show placeholder
                    location.reload();
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

// Photo Lightbox
function openPhotoLightbox(imageName) {
    const lightbox = document.getElementById('photo-lightbox');
    const lightboxImage = document.getElementById('lightbox-image');

    if (lightbox && lightboxImage) {
        lightboxImage.src = `/static/uploads/ring/${imageName}`;
        lightbox.classList.add('show');

        // Set current index
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

// Editable Fields System
function setupEditableFields() {
    const editableElements = document.querySelectorAll('.editable-text, .editable-select');

    editableElements.forEach(element => {
        element.addEventListener('click', function() {
            if (!this.classList.contains('editing')) {
                enableInlineEdit(this);
            }
        });
    });
}

function enableInlineEdit(element) {
    const originalValue = element.textContent.trim();
    element.setAttribute('data-original', originalValue);
    element.classList.add('editing');

    if (element.classList.contains('editable-select')) {
        createSelectEditor(element);
    } else {
        createTextEditor(element);
    }
}

function createTextEditor(element) {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = element.textContent.trim();
    input.className = 'inline-editor';
    input.style.cssText = `
        background: transparent;
        border: none;
        outline: none;
        font: inherit;
        color: inherit;
        width: 100%;
        padding: 0;
    `;

    element.innerHTML = '';
    element.appendChild(input);
    input.focus();
    input.select();

    input.addEventListener('blur', () => saveInlineEdit(element));
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveInlineEdit(element);
        } else if (e.key === 'Escape') {
            cancelInlineEdit(element);
        }
    });
}

function createSelectEditor(element) {
    const options = element.getAttribute('data-options').split('|');
    const currentValue = element.textContent.trim();

    const select = document.createElement('select');
    select.className = 'inline-editor';
    select.style.cssText = `
        background: transparent;
        border: none;
        outline: none;
        font: inherit;
        color: inherit;
        width: 100%;
        padding: 0;
    `;

    options.forEach(option => {
        const optionEl = document.createElement('option');
        optionEl.value = option;
        optionEl.textContent = option;
        optionEl.selected = option === currentValue;
        select.appendChild(optionEl);
    });

    element.innerHTML = '';
    element.appendChild(select);
    select.focus();

    select.addEventListener('blur', () => saveInlineEdit(element));
    select.addEventListener('change', () => saveInlineEdit(element));
    select.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            cancelInlineEdit(element);
        }
    });
}

function saveInlineEdit(element) {
    const editor = element.querySelector('.inline-editor');
    if (!editor) return;

    const newValue = editor.value.trim();
    const originalValue = element.getAttribute('data-original');
    const field = element.getAttribute('data-field');
    const itemId = element.getAttribute('data-item-id');

    if (newValue !== originalValue) {
        // Save to backend
        updateRingField(field, newValue)
            .then(() => {
                element.textContent = newValue;
                element.classList.remove('editing');
                element.removeAttribute('data-original');
                showNotification('Updated successfully!', 'success');
            })
            .catch(error => {
                console.error('Save failed:', error);
                element.textContent = originalValue;
                element.classList.remove('editing');
                element.removeAttribute('data-original');
                showNotification('Failed to save changes', 'error');
            });
    } else {
        cancelInlineEdit(element);
    }
}

function cancelInlineEdit(element) {
    const originalValue = element.getAttribute('data-original');
    element.textContent = originalValue;
    element.classList.remove('editing');
    element.removeAttribute('data-original');
}

function updateRingField(field, value) {
    return fetch('/api/ring/update-field', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ field, value })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (!data.success) {
            throw new Error(data.error || 'Update failed');
        }
        return data;
    });
}

// Ring Edit Modal
function openRingEditModal() {
    const modal = document.getElementById('ring-edit-modal');
    if (modal) {
        modal.classList.add('show');
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
        jeweler: document.getElementById('edit-jeweler').value,
        metal: document.getElementById('edit-metal').value,
        stone: document.getElementById('edit-stone').value,
        style: document.getElementById('edit-style').value,
        design_approved: document.getElementById('edit-design-approved').value,
        order_placed: document.getElementById('edit-order-placed').value,
        delivered: document.getElementById('edit-delivered').value,
        insured: document.getElementById('edit-insured').value,
        insurance_details: document.getElementById('edit-insurance-details').value,
        engraving: document.getElementById('edit-engraving').value
    };

    fetch('/api/ring/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Ring details updated successfully!', 'success');
            closeRingEditModal();

            // Update UI elements
            setTimeout(() => {
                location.reload(); // Simple reload to show changes
            }, 1000);
        } else {
            showNotification('Failed to update ring details', 'error');
        }
    })
    .catch(error => {
        console.error('Update error:', error);
        showNotification('Failed to update ring details', 'error');
    });
}

// Modal System
function setupModals() {
    // Close modals when clicking backdrop
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
        if (e.target.classList.contains('lightbox')) {
            closeLightbox();
        }
    });

    // Close modals with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
            closeLightbox();
        }

        // Lightbox navigation
        if (document.getElementById('photo-lightbox').classList.contains('show')) {
            if (e.key === 'ArrowLeft') {
                previousPhoto();
            } else if (e.key === 'ArrowRight') {
                nextPhoto();
            }
        }
    });
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal.show');
    modals.forEach(modal => modal.classList.remove('show'));
}

// Notification System
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Utility Functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function isValidImageFile(file) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return validTypes.includes(file.type);
}

function preloadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

// Initialize tooltips for action buttons
function initializeTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');

    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = this.getAttribute('data-tooltip');
            tooltip.style.cssText = `
                position: absolute;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 0.5rem;
                border-radius: 4px;
                font-size: 0.75rem;
                white-space: nowrap;
                z-index: 1000;
                pointer-events: none;
            `;

            document.body.appendChild(tooltip);

            const rect = this.getBoundingClientRect();
            tooltip.style.left = (rect.left + rect.width / 2 - tooltip.offsetWidth / 2) + 'px';
            tooltip.style.top = (rect.top - tooltip.offsetHeight - 5) + 'px';

            this._tooltip = tooltip;
        });

        element.addEventListener('mouseleave', function() {
            if (this._tooltip) {
                this._tooltip.remove();
                this._tooltip = null;
            }
        });
    });
}

// Error Handling
window.addEventListener('error', function(e) {
    console.error('Ring page error:', e.error);
    showNotification('An unexpected error occurred', 'error');
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    showNotification('A network error occurred', 'error');
});

// Performance optimization - lazy load thumbnails
function setupLazyLoading() {
    const images = document.querySelectorAll('img[loading="lazy"]');

    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src || img.src;
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }
}

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