// Ring JavaScript functionality - UPDATED VERSION WITH GALLERY NAVIGATION
// This file should be saved as static/js/ring.js

let selectedFiles = [];
let currentMediaIndex = 0;
let currentGalleryIndex = 0; // New: track main gallery position

document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing ring page...');
    initializeRingPage();
});

function initializeRingPage() {
    setupMediaUpload();
    setupEditableFields();
    setupMediaGallery();
    setupModals();
    setupDragAndDrop();
    setupGalleryNavigation(); // New: setup main gallery navigation
    console.log('Ring page initialized successfully');
}

// NEW: Setup Gallery Navigation with button cleanup
function setupGalleryNavigation() {
    // Initialize gallery index based on first media
    if (window.RING_IMAGES && window.RING_IMAGES.length > 0) {
        currentGalleryIndex = 0;
        console.log('Gallery initialized with', window.RING_IMAGES.length, 'media files:', window.RING_IMAGES);

        // Remove expand buttons from all overlays since we don't want fullscreen
        removeExpandButtons();

        // Add navigation arrows to main gallery if more than 1 media
        if (window.RING_IMAGES.length > 1) {
            addGalleryNavigationArrows();
            console.log('Gallery navigation arrows added');
        }

        // Set initial active thumbnail
        updateThumbnailActiveState(window.RING_IMAGES[0]);
    } else {
        console.log('No media files found or RING_IMAGES not available');
    }
}

// NEW: Remove expand buttons from overlays
function removeExpandButtons() {
    const expandButtons = document.querySelectorAll('[onclick*="openMediaLightbox"], [title*="View Full Size"], [title*="Expand"]');
    expandButtons.forEach(btn => btn.remove());
}

// NEW: Add navigation arrows to main gallery
function addGalleryNavigationArrows() {
    const mainImageContainer = document.querySelector('.ring-main-image');
    if (!mainImageContainer || document.querySelector('.gallery-nav-arrows')) {
        return; // Already exists or container not found
    }

    const navContainer = document.createElement('div');
    navContainer.className = 'gallery-nav-arrows';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'gallery-nav-btn gallery-nav-prev';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        previousGalleryMedia();
    };

    const nextBtn = document.createElement('button');
    nextBtn.className = 'gallery-nav-btn gallery-nav-next';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        nextGalleryMedia();
    };

    navContainer.appendChild(prevBtn);
    navContainer.appendChild(nextBtn);
    mainImageContainer.appendChild(navContainer);
}

// NEW: Navigate to previous media in main gallery
function previousGalleryMedia() {
    if (!window.RING_IMAGES || window.RING_IMAGES.length <= 1) {
        console.log('Cannot navigate: insufficient media files');
        return;
    }

    currentGalleryIndex = currentGalleryIndex > 0 ? currentGalleryIndex - 1 : window.RING_IMAGES.length - 1;
    const mediaName = window.RING_IMAGES[currentGalleryIndex];
    console.log('Navigating to previous media:', mediaName, 'at index:', currentGalleryIndex);
    changeMainMedia(mediaName);
}

// NEW: Navigate to next media in main gallery
function nextGalleryMedia() {
    if (!window.RING_IMAGES || window.RING_IMAGES.length <= 1) {
        console.log('Cannot navigate: insufficient media files');
        return;
    }

    currentGalleryIndex = currentGalleryIndex < window.RING_IMAGES.length - 1 ? currentGalleryIndex + 1 : 0;
    const mediaName = window.RING_IMAGES[currentGalleryIndex];
    console.log('Navigating to next media:', mediaName, 'at index:', currentGalleryIndex);
    changeMainMedia(mediaName);
}

// Media Upload System (FIXED - prevents duplicate handlers)
function setupMediaUpload() {
    const fileInput = document.getElementById('media-upload-input');
    if (fileInput) {
        // Clear any existing event listeners
        fileInput.replaceWith(fileInput.cloneNode(true));
        const newFileInput = document.getElementById('media-upload-input');
        newFileInput.addEventListener('change', handleFileInputChange);
    }

    // Use event delegation to prevent duplicates
    document.removeEventListener('click', handleUploadButtonClick);
    document.addEventListener('click', handleUploadButtonClick);
}

// Separate handler functions to prevent duplicates
function handleFileInputChange(e) {
    handleFileSelection(e.target.files);
    // Clear the input to allow re-uploading the same files if needed
    e.target.value = '';
}

function handleUploadButtonClick(e) {
    if (e.target.closest('[onclick*="openMediaUpload"], .btn[data-action="upload"]')) {
        e.preventDefault();
        e.stopPropagation();
        openMediaUpload();
    }
    // Handle upload selected button
    if (e.target.closest('#upload-media-btn')) {
        e.preventDefault();
        e.stopPropagation();
        uploadSelectedMedia();
    }
}

function setupDragAndDrop() {
    const dropZone = document.getElementById('upload-drop-zone');
    if (!dropZone) return;

    // Remove existing listeners to prevent duplicates
    dropZone.removeEventListener('dragover', handleDragOver);
    dropZone.removeEventListener('dragleave', handleDragLeave);
    dropZone.removeEventListener('drop', handleDrop);

    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.remove('drag-over');

    const files = Array.from(e.dataTransfer.files);
    const mediaFiles = files.filter(file =>
        file.type.startsWith('image/') || file.type.startsWith('video/')
    );

    if (mediaFiles.length > 0) {
        handleFileSelection(mediaFiles);
    }
}

function openMediaUpload() {
    // Clear previous selections to prevent accumulation
    selectedFiles = [];
    clearPreviewGrid();

    const modal = document.getElementById('media-upload-modal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
    }
}

function closeMediaUploadModal() {
    const modal = document.getElementById('media-upload-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            // Clear selections and preview when closing
            selectedFiles = [];
            clearPreviewGrid();
            const fileInput = document.getElementById('media-upload-input');
            if (fileInput) fileInput.value = '';
        }, 300);
    }
}

function clearPreviewGrid() {
    const previewSection = document.getElementById('upload-preview');
    const previewGrid = document.getElementById('preview-grid');
    const uploadBtn = document.getElementById('upload-media-btn');

    if (previewSection) previewSection.style.display = 'none';
    if (previewGrid) previewGrid.innerHTML = '';
    if (uploadBtn) uploadBtn.style.display = 'none';
}

function handleFileSelection(files) {
    // Clear previous selections to prevent duplicates
    selectedFiles = [];

    const validFiles = Array.from(files).filter(file => {
        const validTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'video/mp4', 'video/quicktime', 'video/webm', 'video/avi'
        ];
        return validTypes.includes(file.type);
    });

    if (validFiles.length === 0) {
        showNotification('Please select valid image or video files', 'warning');
        return;
    }

    // Add files to selection (no duplicates since we cleared above)
    selectedFiles = [...validFiles];

    updateUploadPreview();
}

function updateUploadPreview() {
    const previewSection = document.getElementById('upload-preview');
    const previewGrid = document.getElementById('preview-grid');

    if (!previewSection || !previewGrid) return;

    if (selectedFiles.length === 0) {
        previewSection.style.display = 'none';
        return;
    }

    // Clear existing preview items
    previewGrid.innerHTML = '';

    selectedFiles.forEach((file, index) => {
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        previewItem.dataset.index = index;

        const isVideo = file.type.startsWith('video/');
        let mediaElement;

        if (isVideo) {
            mediaElement = document.createElement('video');
            mediaElement.muted = true;
            mediaElement.loop = true;
        } else {
            mediaElement = document.createElement('img');
        }

        mediaElement.src = URL.createObjectURL(file);
        mediaElement.alt = file.name;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-preview-btn';
        removeBtn.innerHTML = '&times;';
        removeBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            removeFromSelection(index);
        };

        previewItem.appendChild(mediaElement);
        previewItem.appendChild(removeBtn);
        previewGrid.appendChild(previewItem);

        if (isVideo) {
            mediaElement.onloadedmetadata = () => mediaElement.play();
        }
    });

    previewSection.style.display = 'block';

    // Show upload button
    const uploadBtn = document.getElementById('upload-media-btn');
    if (uploadBtn) {
        uploadBtn.style.display = 'inline-block';
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Media';
    }
}

function removeFromSelection(index) {
    if (index >= 0 && index < selectedFiles.length) {
        // Revoke object URL to prevent memory leaks
        const previewItem = document.querySelector(`.preview-item[data-index="${index}"]`);
        if (previewItem) {
            const mediaElement = previewItem.querySelector('img, video');
            if (mediaElement && mediaElement.src.startsWith('blob:')) {
                URL.revokeObjectURL(mediaElement.src);
            }
        }

        selectedFiles.splice(index, 1);
        updateUploadPreview();
    }
}

function uploadSelectedMedia() {
    if (selectedFiles.length === 0) {
        showNotification('Please select files to upload', 'warning');
        return;
    }

    const uploadBtn = document.querySelector('#upload-media-btn');
    const progressSection = document.querySelector('.upload-progress');
    const progressFill = document.querySelector('.progress-fill');

    // Prevent multiple uploads
    if (uploadBtn && uploadBtn.disabled) {
        return;
    }

    if (uploadBtn) {
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    }

    if (progressSection) {
        progressSection.style.display = 'block';
    }

    const formData = new FormData();
    selectedFiles.forEach(file => {
        formData.append('media', file);
    });

    fetch('/api/ring/upload-media', {
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
        if (progressFill) progressFill.style.width = '100%';

        if (data.success) {
            showNotification(`Successfully uploaded ${data.files.length} file(s)`, 'success');

            // Clean up object URLs
            selectedFiles.forEach((file, index) => {
                const previewItem = document.querySelector(`.preview-item[data-index="${index}"]`);
                if (previewItem) {
                    const mediaElement = previewItem.querySelector('img, video');
                    if (mediaElement && mediaElement.src.startsWith('blob:')) {
                        URL.revokeObjectURL(mediaElement.src);
                    }
                }
            });

            closeMediaUploadModal();

            // Reload page to show new media
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            throw new Error(data.error || 'Upload failed');
        }
    })
    .catch(error => {
        console.error('Upload error:', error);
        showNotification('Failed to upload media: ' + error.message, 'error');
    })
    .finally(() => {
        // Reset UI state
        if (progressSection) progressSection.style.display = 'none';
        if (uploadBtn) {
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Media';
        }
        if (progressFill) progressFill.style.width = '0%';
    });
}

// Media Gallery Functions (UPDATED - with improved video/image support)
function setupMediaGallery() {
    // Use event delegation for thumbnail clicks to prevent duplicates
    document.removeEventListener('click', handleThumbnailClick);
    document.addEventListener('click', handleThumbnailClick);

    // Setup main media click for lightbox
    const mainMedia = document.getElementById('main-ring-media');
    if (mainMedia) {
        mainMedia.removeEventListener('click', handleMainMediaClick);
        mainMedia.addEventListener('click', handleMainMediaClick);
    }
}

function handleThumbnailClick(e) {
    const thumbnail = e.target.closest('.ring-thumbnail');
    if (thumbnail && !thumbnail.hasAttribute('data-processed')) {
        e.preventDefault();
        e.stopPropagation();

        const mediaElement = thumbnail.querySelector('img, video');
        if (mediaElement) {
            let mediaName = null;

            // Handle different media element types
            if (mediaElement.tagName === 'IMG') {
                mediaName = mediaElement.src.split('/').pop();
            } else if (mediaElement.tagName === 'VIDEO') {
                // For video elements, get the src from the source element
                const source = mediaElement.querySelector('source');
                if (source && source.src) {
                    mediaName = source.src.split('/').pop();
                } else if (mediaElement.src) {
                    mediaName = mediaElement.src.split('/').pop();
                }
            }

            if (mediaName) {
                // Update gallery index when thumbnail is clicked
                if (window.RING_IMAGES) {
                    currentGalleryIndex = window.RING_IMAGES.indexOf(mediaName);
                    if (currentGalleryIndex === -1) currentGalleryIndex = 0;
                }

                changeMainMedia(mediaName);
            }
        }
    }
}

function handleMainMediaClick(e) {
    // Disabled - no fullscreen/lightbox functionality
    // Users can only navigate using arrows and thumbnails
    e.preventDefault();
    return false;
}

// UPDATED: Enhanced changeMainMedia function with better video support
function changeMainMedia(mediaName) {
    const mainMediaContainer = document.querySelector('.ring-main-image');
    if (!mainMediaContainer) return;

    const fileExt = mediaName.split('.').pop().toLowerCase();
    const isVideo = ['mov', 'mp4', 'avi', 'mkv', 'webm'].includes(fileExt);

    // Remove existing media element
    const existingMedia = mainMediaContainer.querySelector('#main-ring-media');
    if (existingMedia) {
        // Pause video if it's playing
        if (existingMedia.tagName === 'VIDEO') {
            existingMedia.pause();
        }
        existingMedia.remove();
    }

    // Create new media element
    let newMediaElement;
    if (isVideo) {
        newMediaElement = document.createElement('video');
        newMediaElement.controls = true;
        newMediaElement.muted = false; // Allow sound
        newMediaElement.preload = 'metadata';
        newMediaElement.className = 'ring-media-element';
        newMediaElement.id = 'main-ring-media';

        const source = document.createElement('source');
        source.src = `/static/uploads/ring/${mediaName}`;

        // Better MIME type detection
        const mimeTypes = {
            'mp4': 'video/mp4',
            'webm': 'video/webm',
            'avi': 'video/x-msvideo',
            'mov': 'video/quicktime',
            'mkv': 'video/x-matroska'
        };
        source.type = mimeTypes[fileExt] || 'video/mp4';

        newMediaElement.appendChild(source);
        newMediaElement.addEventListener('click', handleMainMediaClick);

        // Add error handling for videos
        newMediaElement.addEventListener('error', function() {
            console.error('Error loading video:', mediaName);
            showNotification('Error loading video file', 'error');
        });

        // Add loaded event for better UX
        newMediaElement.addEventListener('loadedmetadata', function() {
            console.log('Video loaded successfully:', mediaName);
        });

    } else {
        newMediaElement = document.createElement('img');
        newMediaElement.src = `/static/uploads/ring/${mediaName}`;
        newMediaElement.alt = 'Engagement Ring';
        newMediaElement.className = 'ring-media-element';
        newMediaElement.id = 'main-ring-media';
        newMediaElement.addEventListener('click', handleMainMediaClick);

        // Add error handling for images
        newMediaElement.addEventListener('error', function() {
            console.error('Error loading image:', mediaName);
            showNotification('Error loading image file', 'error');
        });
    }

    // Insert before overlay
    const overlay = mainMediaContainer.querySelector('.image-overlay');
    if (overlay) {
        mainMediaContainer.insertBefore(newMediaElement, overlay);
    } else {
        mainMediaContainer.appendChild(newMediaElement);
    }

    // Update thumbnails active state
    updateThumbnailActiveState(mediaName);

    // Update overlay actions to reflect current media
    updateOverlayActions(mediaName);
}

// NEW: Update overlay action buttons for current media (removed expand button entirely)
function updateOverlayActions(mediaName) {
    const overlay = document.querySelector('.image-overlay');
    if (!overlay) return;

    // Remove the expand button completely
    const expandBtn = overlay.querySelector('[onclick*="openMediaLightbox"]');
    if (expandBtn) {
        expandBtn.remove();
    }

    // Keep only upload and delete buttons
    const deleteBtn = overlay.querySelector('[onclick*="deleteRingMedia"]');
    if (deleteBtn) {
        deleteBtn.onclick = () => deleteRingMedia(mediaName);
    }
}

function updateThumbnailActiveState(activeMediaName) {
    const thumbnails = document.querySelectorAll('.ring-thumbnail');
    thumbnails.forEach(thumb => {
        const media = thumb.querySelector('img, video');
        if (media) {
            let mediaSrc = null;

            // Handle different media element types
            if (media.tagName === 'IMG') {
                mediaSrc = media.src.split('/').pop();
            } else if (media.tagName === 'VIDEO') {
                // For video elements, get the src from the source element
                const source = media.querySelector('source');
                if (source && source.src) {
                    mediaSrc = source.src.split('/').pop();
                } else if (media.src) {
                    mediaSrc = media.src.split('/').pop();
                }
            }

            thumb.classList.toggle('active', mediaSrc === activeMediaName);
        }
    });
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelectorAll('.notification');
    existing.forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Modal setup with proper event delegation (disabled lightbox)
function setupModals() {
    // Close upload modal when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            const modal = e.target;
            if (modal.id === 'media-upload-modal') {
                closeMediaUploadModal();
            }
            // Lightbox functionality disabled
        }
    });
}

// DISABLED: Lightbox functionality removed
function openMediaLightbox(mediaName) {
    // Fullscreen/lightbox disabled - users can only view media in main gallery
    console.log('Lightbox disabled - use gallery navigation instead');
    return false;
}

function closeLightbox() {
    // Lightbox disabled
    return false;
}

function previousMedia() {
    // Lightbox navigation disabled - use gallery navigation instead
    return false;
}

function nextMedia() {
    // Lightbox navigation disabled - use gallery navigation instead
    return false;
}

// Media deletion functionality
function deleteRingMedia(mediaName) {
    if (!mediaName) return;

    const confirmDelete = confirm(`Are you sure you want to delete this media file?\n\n${mediaName}`);
    if (!confirmDelete) return;

    fetch(`/api/ring/delete-media/${mediaName}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Media deleted successfully', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            throw new Error(data.error || 'Failed to delete media');
        }
    })
    .catch(error => {
        console.error('Delete error:', error);
        showNotification('Failed to delete media: ' + error.message, 'error');
    });
}

// Editable fields functionality
function setupEditableFields() {
    const editableFields = document.querySelectorAll('.editable-field');

    editableFields.forEach(field => {
        const editBtn = field.querySelector('.edit-btn');
        const saveBtn = field.querySelector('.save-btn');
        const cancelBtn = field.querySelector('.cancel-btn');
        const displayValue = field.querySelector('.field-value');
        const inputElement = field.querySelector('input, select, textarea');

        if (!editBtn || !saveBtn || !cancelBtn || !displayValue || !inputElement) return;

        let originalValue = inputElement.value;

        editBtn.addEventListener('click', () => {
            field.classList.add('editing');
            inputElement.focus();
            originalValue = inputElement.value;
        });

        cancelBtn.addEventListener('click', () => {
            inputElement.value = originalValue;
            displayValue.textContent = originalValue || 'Not set';
            field.classList.remove('editing');
        });

        saveBtn.addEventListener('click', () => {
            const newValue = inputElement.value.trim();
            const fieldName = field.dataset.field;

            if (!fieldName) {
                showNotification('Invalid field configuration', 'error');
                return;
            }

            // Save the field value
            saveRingField(fieldName, newValue).then(success => {
                if (success) {
                    displayValue.textContent = newValue || 'Not set';
                    field.classList.remove('editing');
                    originalValue = newValue;
                    showNotification('Field updated successfully', 'success');
                }
            });
        });

        // Handle Enter key in inputs
        inputElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && inputElement.tagName !== 'TEXTAREA') {
                e.preventDefault();
                saveBtn.click();
            } else if (e.key === 'Escape') {
                cancelBtn.click();
            }
        });
    });
}

async function saveRingField(fieldName, value) {
    try {
        const response = await fetch('/api/ring/update-field', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                field: fieldName,
                value: value
            })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to update field');
        }

        return true;
    } catch (error) {
        console.error('Save field error:', error);
        showNotification('Failed to save field: ' + error.message, 'error');
        return false;
    }
}

// UPDATED: Enhanced keyboard navigation (lightbox disabled)
document.addEventListener('keydown', function(e) {
    const uploadModal = document.getElementById('media-upload-modal');
    if (uploadModal && uploadModal.style.display === 'flex' && e.key === 'Escape') {
        closeMediaUploadModal();
    }

    // Gallery navigation with keyboard (Alt + Arrow keys)
    if (e.key === 'ArrowLeft' && e.altKey) {
        e.preventDefault();
        previousGalleryMedia();
    } else if (e.key === 'ArrowRight' && e.altKey) {
        e.preventDefault();
        nextGalleryMedia();
    }
});

// Touch/swipe support for mobile gallery navigation (lightbox disabled)
let touchStartX = null;
let touchStartY = null;

document.addEventListener('touchstart', function(e) {
    // Only enable touch navigation on the main gallery area
    const mainImage = document.querySelector('.ring-main-image');
    if (mainImage && mainImage.contains(e.target)) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }
});

document.addEventListener('touchend', function(e) {
    const mainImage = document.querySelector('.ring-main-image');
    if (mainImage && mainImage.contains(e.target) && touchStartX !== null && touchStartY !== null) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;

        // Only handle horizontal swipes (ignore vertical scrolling)
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            if (deltaX > 0) {
                previousGalleryMedia(); // Swipe right = previous
            } else {
                nextGalleryMedia(); // Swipe left = next
            }
        }

        touchStartX = null;
        touchStartY = null;
    }
});

// Utility function to format file sizes
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Initialize drag and drop visual feedback
function initializeDragVisuals() {
    let dragCounter = 0;

    document.addEventListener('dragenter', function(e) {
        dragCounter++;
        const dropZone = document.getElementById('upload-drop-zone');
        if (dropZone && document.getElementById('media-upload-modal').style.display === 'flex') {
            dropZone.classList.add('drag-active');
        }
    });

    document.addEventListener('dragleave', function(e) {
        dragCounter--;
        if (dragCounter === 0) {
            const dropZone = document.getElementById('upload-drop-zone');
            if (dropZone) {
                dropZone.classList.remove('drag-active');
            }
        }
    });

    document.addEventListener('drop', function(e) {
        dragCounter = 0;
        const dropZone = document.getElementById('upload-drop-zone');
        if (dropZone) {
            dropZone.classList.remove('drag-active');
        }
    });
}

// Call initialization functions when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeDragVisuals();
});