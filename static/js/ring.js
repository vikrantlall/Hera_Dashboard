// Ring JavaScript functionality - UPDATED FOR VIDEO SUPPORT
// This file should be saved as static/js/ring.js

let selectedFiles = [];
let currentMediaIndex = 0;

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
    console.log('Ring page initialized successfully');
}

// Media Upload System (replaces photo upload)
function setupMediaUpload() {
    const fileInput = document.getElementById('media-upload-input');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            handleFileSelection(e.target.files);
        });
    }

    // Setup upload buttons
    const uploadButtons = document.querySelectorAll('[onclick*="openMediaUpload"]');
    uploadButtons.forEach(btn => {
        btn.onclick = function(e) {
            e.preventDefault();
            openMediaUpload();
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
        const mediaFiles = files.filter(file =>
            file.type.startsWith('image/') || file.type.startsWith('video/')
        );

        if (mediaFiles.length > 0) {
            handleFileSelection(mediaFiles);
        }
    });

    dropZone.addEventListener('click', function() {
        document.getElementById('media-upload-input').click();
    });
}

function openMediaUpload() {
    const modal = document.getElementById('media-upload-modal');
    if (modal) {
        modal.classList.add('show');
        selectedFiles = [];
        updateUploadPreview();
    }
}

function closeMediaUploadModal() {
    const modal = document.getElementById('media-upload-modal');
    if (modal) {
        modal.classList.remove('show');
        selectedFiles = [];
        updateUploadPreview();
    }
}

function handleFileSelection(files) {
    selectedFiles = Array.from(files).filter(file =>
        file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    updateUploadPreview();
}

function updateUploadPreview() {
    const previewSection = document.getElementById('upload-preview');
    const previewGrid = document.getElementById('preview-grid');
    const uploadBtn = document.getElementById('upload-media-btn');

    if (!previewSection || !previewGrid) return;

    if (selectedFiles.length === 0) {
        previewSection.style.display = 'none';
        if (uploadBtn) uploadBtn.style.display = 'none';
        return;
    }

    previewSection.style.display = 'block';
    if (uploadBtn) uploadBtn.style.display = 'inline-flex';

    previewGrid.innerHTML = '';

    selectedFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';

            if (file.type.startsWith('video/')) {
                previewItem.innerHTML = `
                    <video muted>
                        <source src="${e.target.result}" type="${file.type}">
                    </video>
                    <button class="preview-remove" onclick="removeSelectedFile(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                `;
            } else {
                previewItem.innerHTML = `
                    <img src="${e.target.result}" alt="Preview ${index + 1}">
                    <button class="preview-remove" onclick="removeSelectedFile(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                `;
            }
            previewGrid.appendChild(previewItem);
        };
        reader.readAsDataURL(file);
    });
}

function removeSelectedFile(index) {
    selectedFiles.splice(index, 1);
    updateUploadPreview();
}

function uploadSelectedMedia() {
    if (selectedFiles.length === 0) {
        showNotification('No files selected', 'error');
        return;
    }

    const uploadBtn = document.getElementById('upload-media-btn');
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
        formData.append('media', file);  // Backend expects 'media' key
    });

    fetch('/api/ring/upload-media', {
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
            showNotification('Media uploaded successfully!', 'success');
            closeMediaUploadModal();
            // Refresh the page to show new media
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            throw new Error(data.error || 'Upload failed');
        }
    })
    .catch(error => {
        console.error('Upload error:', error);
        showNotification('Failed to upload media', 'error');
    })
    .finally(() => {
        // Reset UI
        if (progressSection) progressSection.style.display = 'none';
        if (uploadBtn) {
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Media';
        }
        if (progressFill) progressFill.style.width = '0%';
    });
}

// Media Gallery Functions (replaces image gallery)
function setupMediaGallery() {
    // Setup thumbnail clicks
    const thumbnails = document.querySelectorAll('.ring-thumbnail');
    thumbnails.forEach(thumbnail => {
        if (!thumbnail.onclick) {
            thumbnail.addEventListener('click', function() {
                const mediaElement = this.querySelector('img, video');
                if (mediaElement) {
                    const mediaName = mediaElement.src.split('/').pop();
                    changeMainMedia(mediaName);
                }
            });
        }
    });

    // Setup main media click for lightbox
    const mainMedia = document.getElementById('main-ring-media');
    if (mainMedia) {
        mainMedia.addEventListener('click', function() {
            const mediaName = this.src.split('/').pop();
            openMediaLightbox(mediaName);
        });
    }
}

function changeMainMedia(mediaName) {
    const mainMediaContainer = document.querySelector('.ring-main-image');
    if (!mainMediaContainer) return;

    const fileExt = mediaName.split('.').pop().toLowerCase();
    const isVideo = ['mov', 'mp4', 'avi', 'mkv', 'webm'].includes(fileExt);

    // Remove existing media element
    const existingMedia = mainMediaContainer.querySelector('#main-ring-media');
    if (existingMedia) {
        existingMedia.remove();
    }

    // Create new media element
    let newMediaElement;
    if (isVideo) {
        newMediaElement = document.createElement('video');
        newMediaElement.controls = true;
        newMediaElement.className = 'ring-media-element';
        newMediaElement.id = 'main-ring-media';

        const source = document.createElement('source');
        source.src = `/static/uploads/ring/${mediaName}`;
        source.type = `video/${fileExt === 'mov' ? 'quicktime' : fileExt}`;
        newMediaElement.appendChild(source);
    } else {
        newMediaElement = document.createElement('img');
        newMediaElement.src = `/static/uploads/ring/${mediaName}`;
        newMediaElement.alt = 'Engagement Ring';
        newMediaElement.className = 'ring-media-element';
        newMediaElement.id = 'main-ring-media';
    }

    // Add click event for lightbox
    newMediaElement.addEventListener('click', function() {
        const mediaName = this.src.split('/').pop();
        openMediaLightbox(mediaName);
    });

    // Insert before overlay
    const overlay = mainMediaContainer.querySelector('.image-overlay');
    if (overlay) {
        mainMediaContainer.insertBefore(newMediaElement, overlay);
    } else {
        mainMediaContainer.appendChild(newMediaElement);
    }

    // Update active thumbnail
    const thumbnails = document.querySelectorAll('.ring-thumbnail');
    thumbnails.forEach(thumb => {
        thumb.classList.remove('active');
        const mediaElement = thumb.querySelector('img, video');
        if (mediaElement && mediaElement.src.includes(mediaName)) {
            thumb.classList.add('active');
        }
    });

    // Update current index for lightbox navigation
    if (window.RING_IMAGES) {
        currentMediaIndex = window.RING_IMAGES.indexOf(mediaName);
    }
}

function deleteRingMedia(mediaName) {
    if (!confirm('Are you sure you want to delete this media?')) {
        return;
    }

    fetch(`/api/ring/delete-media/${mediaName}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Media deleted successfully', 'success');

            // Remove from UI
            const thumbnail = document.querySelector(`[onclick*="${mediaName}"]`);
            if (thumbnail) {
                thumbnail.remove();
            }

            // If this was the main media, switch to another one or show placeholder
            const mainMedia = document.getElementById('main-ring-media');
            if (mainMedia && mainMedia.src.includes(mediaName)) {
                const remainingThumbnails = document.querySelectorAll('.ring-thumbnail');
                if (remainingThumbnails.length > 0) {
                    const firstThumbnail = remainingThumbnails[0];
                    const firstMediaElement = firstThumbnail.querySelector('img, video');
                    if (firstMediaElement) {
                        const newMediaName = firstMediaElement.src.split('/').pop();
                        changeMainMedia(newMediaName);
                    }
                } else {
                    // No media left, reload to show placeholder
                    window.location.reload();
                }
            }

            // Update RING_IMAGES array
            if (window.RING_IMAGES) {
                const index = window.RING_IMAGES.indexOf(mediaName);
                if (index > -1) {
                    window.RING_IMAGES.splice(index, 1);
                }
            }
        } else {
            showNotification('Failed to delete media', 'error');
        }
    })
    .catch(error => {
        console.error('Delete error:', error);
        showNotification('Failed to delete media', 'error');
    });
}

// Media Lightbox Functions (replaces photo lightbox)
function openMediaLightbox(mediaName) {
    const lightbox = document.getElementById('media-lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxVideo = document.getElementById('lightbox-video');

    if (!lightbox || !lightboxImage || !lightboxVideo) return;

    const fileExt = mediaName.split('.').pop().toLowerCase();
    const isVideo = ['mov', 'mp4', 'avi', 'mkv', 'webm'].includes(fileExt);

    if (isVideo) {
        // Show video, hide image
        lightboxImage.style.display = 'none';
        lightboxVideo.style.display = 'block';

        // Update video source
        const videoSource = lightboxVideo.querySelector('source');
        if (videoSource) {
            videoSource.src = `/static/uploads/ring/${mediaName}`;
            videoSource.type = `video/${fileExt === 'mov' ? 'quicktime' : fileExt}`;
        }
        lightboxVideo.load(); // Reload video with new source
    } else {
        // Show image, hide video
        lightboxVideo.style.display = 'none';
        lightboxImage.style.display = 'block';
        lightboxImage.src = `/static/uploads/ring/${mediaName}`;
    }

    lightbox.classList.add('show');

    // Set current index for navigation
    if (window.RING_IMAGES) {
        currentMediaIndex = window.RING_IMAGES.indexOf(mediaName);
    }

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('media-lightbox');
    if (lightbox) {
        lightbox.classList.remove('show');
        document.body.style.overflow = '';

        // Pause video if playing
        const lightboxVideo = document.getElementById('lightbox-video');
        if (lightboxVideo && !lightboxVideo.paused) {
            lightboxVideo.pause();
        }
    }
}

function previousMedia() {
    if (!window.RING_IMAGES || window.RING_IMAGES.length === 0) return;

    currentMediaIndex = (currentMediaIndex - 1 + window.RING_IMAGES.length) % window.RING_IMAGES.length;
    const mediaName = window.RING_IMAGES[currentMediaIndex];

    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxVideo = document.getElementById('lightbox-video');

    if (!lightboxImage || !lightboxVideo) return;

    const fileExt = mediaName.split('.').pop().toLowerCase();
    const isVideo = ['mov', 'mp4', 'avi', 'mkv', 'webm'].includes(fileExt);

    if (isVideo) {
        lightboxImage.style.display = 'none';
        lightboxVideo.style.display = 'block';

        const videoSource = lightboxVideo.querySelector('source');
        if (videoSource) {
            videoSource.src = `/static/uploads/ring/${mediaName}`;
            videoSource.type = `video/${fileExt === 'mov' ? 'quicktime' : fileExt}`;
        }
        lightboxVideo.load();
    } else {
        lightboxVideo.style.display = 'none';
        lightboxImage.style.display = 'block';
        lightboxImage.src = `/static/uploads/ring/${mediaName}`;
    }
}

function nextMedia() {
    if (!window.RING_IMAGES || window.RING_IMAGES.length === 0) return;

    currentMediaIndex = (currentMediaIndex + 1) % window.RING_IMAGES.length;
    const mediaName = window.RING_IMAGES[currentMediaIndex];

    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxVideo = document.getElementById('lightbox-video');

    if (!lightboxImage || !lightboxVideo) return;

    const fileExt = mediaName.split('.').pop().toLowerCase();
    const isVideo = ['mov', 'mp4', 'avi', 'mkv', 'webm'].includes(fileExt);

    if (isVideo) {
        lightboxImage.style.display = 'none';
        lightboxVideo.style.display = 'block';

        const videoSource = lightboxVideo.querySelector('source');
        if (videoSource) {
            videoSource.src = `/static/uploads/ring/${mediaName}`;
            videoSource.type = `video/${fileExt === 'mov' ? 'quicktime' : fileExt}`;
        }
        lightboxVideo.load();
    } else {
        lightboxVideo.style.display = 'none';
        lightboxImage.style.display = 'block';
        lightboxImage.src = `/static/uploads/ring/${mediaName}`;
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
        } else if (e.key === 'Escape') {
            element.textContent = originalValue;
            finishEditing();
        }
    });
}

function updateRingField(field, value, element) {
    fetch('/api/ring/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            field: field,
            value: value
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Ring details updated', 'success');
        } else {
            showNotification('Failed to update ring details', 'error');
            element.textContent = element.dataset.originalValue || 'Not specified';
        }
    })
    .catch(error => {
        console.error('Update error:', error);
        showNotification('Failed to update ring details', 'error');
        element.textContent = element.dataset.originalValue || 'Not specified';
    });
}

// Modal Functions
function setupModals() {
    // Close modals when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            if (e.target.id === 'media-upload-modal') {
                closeMediaUploadModal();
            } else if (e.target.id === 'ring-edit-modal') {
                closeRingEditModal();
            } else if (e.target.id === 'media-lightbox') {
                closeLightbox();
            }
        }
    });

    // ESC key to close modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeMediaUploadModal();
            closeRingEditModal();
            closeLightbox();
        }
    });
}

function openRingEditModal() {
    const modal = document.getElementById('ring-edit-modal');
    if (modal) {
        modal.classList.add('show');

        // Populate form with current data
        if (window.RING_DATA) {
            const jewelerInput = document.getElementById('edit-jeweler');
            const metalInput = document.getElementById('edit-metal');
            const stoneInput = document.getElementById('edit-stone');
            const deliveredSelect = document.getElementById('edit-delivered');
            const insuredSelect = document.getElementById('edit-insured');
            const insuranceDetailsInput = document.getElementById('edit-insurance-details');
            const engravingInput = document.getElementById('edit-engraving');
            const deliveryInput = document.getElementById('edit-estimated-delivery');

            if (jewelerInput) jewelerInput.value = window.RING_DATA.Jeweler || '';
            if (metalInput) metalInput.value = window.RING_DATA.Metal || '';
            if (stoneInput) stoneInput.value = window.RING_DATA['Stone(s)'] || '';
            if (deliveredSelect) deliveredSelect.value = window.RING_DATA.Delivered || 'Pending';
            if (insuredSelect) insuredSelect.value = window.RING_DATA.Insured || 'No';
            if (insuranceDetailsInput) insuranceDetailsInput.value = window.RING_DATA['Insurance Details'] || '';
            if (engravingInput) engravingInput.value = window.RING_DATA.Engraving || '';
            if (deliveryInput) deliveryInput.value = window.RING_DATA['Estimated Delivery'] || '';
        }
    }
}

function closeRingEditModal() {
    const modal = document.getElementById('ring-edit-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function saveRingDetails(event) {
    event.preventDefault();

    const formData = {
        jeweler: document.getElementById('edit-jeweler').value,
        metal: document.getElementById('edit-metal').value,
        stone: document.getElementById('edit-stone').value,
        delivered: document.getElementById('edit-delivered').value,
        insured: document.getElementById('edit-insured').value,
        insurance_details: document.getElementById('edit-insurance-details').value,
        engraving: document.getElementById('edit-engraving').value,
        estimated_delivery: document.getElementById('edit-estimated-delivery').value
    };

    const submitBtn = document.querySelector('#ring-edit-form button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    }

    // Save each field individually
    const updates = Object.entries(formData).map(([field, value]) => {
        return fetch('/api/ring/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ field, value })
        }).then(response => response.json());
    });

    Promise.all(updates)
        .then(results => {
            const allSuccessful = results.every(result => result.success);
            if (allSuccessful) {
                showNotification('Ring details saved successfully', 'success');
                closeRingEditModal();
                // Refresh page to show updated data
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                showNotification('Some details could not be saved', 'error');
            }
        })
        .catch(error => {
            console.error('Save error:', error);
            showNotification('Failed to save ring details', 'error');
        })
        .finally(() => {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
            }
        });
}

// Utility Functions
function showNotification(message, type = 'info') {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    // Hide and remove notification
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// Legacy function aliases for backward compatibility
function openImageUpload() {
    openMediaUpload();
}

function openPhotoUploadModal() {
    openMediaUpload();
}

function closePhotoUploadModal() {
    closeMediaUploadModal();
}

function openPhotoLightbox(mediaName) {
    openMediaLightbox(mediaName);
}

function changeMainImage(mediaName) {
    changeMainMedia(mediaName);
}

function deleteRingImage(mediaName) {
    deleteRingMedia(mediaName);
}

function uploadSelectedPhotos() {
    uploadSelectedMedia();
}

function previousPhoto() {
    previousMedia();
}

function nextPhoto() {
    nextMedia();
}