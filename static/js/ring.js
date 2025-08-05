// Ring JavaScript functionality - FIXED VERSION
// Photo management, gallery features, and ring details editing

document.addEventListener('DOMContentLoaded', function() {
    initializeRingPage();
    setupPhotoManagement();
    setupRingDetails();
    setupGallery();
});

function initializeRingPage() {
    console.log('Initializing ring page...');

    // Setup all ring functionality
    setupFileUpload();
    setupPhotoGrid();
    setupEditableFields();
    setupProgressTracking();

    console.log('Ring page initialized successfully');
}

// Photo Upload System - FIXED
function setupPhotoManagement() {
    // Setup drag and drop
    setupDragAndDrop();

    // Setup file input
    const fileInput = document.getElementById('photo-upload-input');
    const uploadBtn = document.querySelector('.upload-photo-btn');

    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', function() {
            fileInput.click();
        });

        fileInput.addEventListener('change', handleFileUpload);
    }

    // Setup add photo buttons
    const addPhotoButtons = document.querySelectorAll('.add-photo-btn, .upload-btn');
    addPhotoButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            if (fileInput) {
                fileInput.click();
            } else {
                openPhotoUploadModal();
            }
        });
    });
}

function setupDragAndDrop() {
    const dropZones = document.querySelectorAll('.photo-grid, .upload-area, .ring-photos');

    dropZones.forEach(zone => {
        zone.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.add('drag-over');
        });

        zone.addEventListener('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('drag-over');
        });

        zone.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('drag-over');

            const files = Array.from(e.dataTransfer.files);
            const imageFiles = files.filter(file => file.type.startsWith('image/'));

            if (imageFiles.length > 0) {
                handleMultipleFiles(imageFiles);
            }
        });
    });
}

function handleFileUpload(e) {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length > 0) {
        handleMultipleFiles(imageFiles);
    }

    // Reset input
    e.target.value = '';
}

function handleMultipleFiles(files) {
    files.forEach(file => {
        uploadPhoto(file);
    });
}

// Photo Upload Function - FIXED
function uploadPhoto(file) {
    if (!file.type.startsWith('image/')) {
        showNotification('Please upload only image files', 'error');
        return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
        showNotification('File size must be less than 10MB', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('photo', file);
    formData.append('category', getCurrentPhotoCategory());

    // Show upload progress
    const progressIndicator = showUploadProgress(file.name);

    fetch('/api/ring/upload-photo', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        hideUploadProgress(progressIndicator);

        if (data.success) {
            addPhotoToGrid(data.photo);
            showNotification('Photo uploaded successfully!', 'success');
        } else {
            showNotification(data.error || 'Upload failed', 'error');
        }
    })
    .catch(error => {
        hideUploadProgress(progressIndicator);
        console.error('Upload error:', error);
        showNotification('Upload failed. Please try again.', 'error');
    });
}

function getCurrentPhotoCategory() {
    const activeTab = document.querySelector('.category-tab.active');
    return activeTab ? activeTab.dataset.category : 'general';
}

function showUploadProgress(filename) {
    const progressDiv = document.createElement('div');
    progressDiv.className = 'upload-progress';
    progressDiv.innerHTML = `
        <div class="upload-item">
            <span class="upload-filename">${filename}</span>
            <div class="upload-progress-bar">
                <div class="upload-progress-fill"></div>
            </div>
            <span class="upload-status">Uploading...</span>
        </div>
    `;

    const container = document.querySelector('.ring-container') || document.body;
    container.appendChild(progressDiv);

    // Animate progress
    const progressFill = progressDiv.querySelector('.upload-progress-fill');
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress > 90) progress = 90;
        progressFill.style.width = `${progress}%`;
    }, 200);

    progressDiv.interval = interval;
    return progressDiv;
}

function hideUploadProgress(progressIndicator) {
    if (progressIndicator) {
        clearInterval(progressIndicator.interval);

        const progressFill = progressIndicator.querySelector('.upload-progress-fill');
        const statusText = progressIndicator.querySelector('.upload-status');

        progressFill.style.width = '100%';
        statusText.textContent = 'Complete!';

        setTimeout(() => {
            progressIndicator.remove();
        }, 1500);
    }
}

// Photo Grid Management - FIXED
function setupPhotoGrid() {
    // Setup category tabs
    const categoryTabs = document.querySelectorAll('.category-tab');
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            switchCategory(this.dataset.category);
        });
    });

    // Setup existing photo interactions
    const photos = document.querySelectorAll('.photo-item');
    photos.forEach(photo => {
        setupPhotoInteractions(photo);
    });
}

function switchCategory(category) {
    // Update active tab
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    const activeTab = document.querySelector(`[data-category="${category}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }

    // Filter photos
    const photos = document.querySelectorAll('.photo-item');
    photos.forEach(photo => {
        const photoCategory = photo.dataset.category || 'general';
        photo.style.display = (category === 'all' || photoCategory === category) ? 'block' : 'none';
    });

    // Update upload category
    const uploadAreas = document.querySelectorAll('.upload-area');
    uploadAreas.forEach(area => {
        area.dataset.category = category;
    });
}

function addPhotoToGrid(photoData) {
    const photoGrid = document.querySelector('.photo-grid');
    if (!photoGrid) return;

    const photoItem = document.createElement('div');
    photoItem.className = 'photo-item';
    photoItem.dataset.category = photoData.category || 'general';
    photoItem.dataset.photoId = photoData.id;

    photoItem.innerHTML = `
        <div class="photo-container">
            <img src="${photoData.url}" alt="${photoData.filename}" loading="lazy">
            <div class="photo-overlay">
                <div class="photo-actions">
                    <button class="photo-action-btn view-btn" title="View Full Size">
                        <i class="fas fa-expand"></i>
                    </button>
                    <button class="photo-action-btn edit-btn" title="Edit Details">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="photo-action-btn star-btn" title="Set as Primary">
                        <i class="fas fa-star"></i>
                    </button>
                    <button class="photo-action-btn delete-btn" title="Delete Photo">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
        <div class="photo-info">
            <span class="photo-filename">${photoData.filename}</span>
            <span class="photo-category">${photoData.category}</span>
        </div>
    `;

    // Insert before upload areas
    const uploadArea = photoGrid.querySelector('.upload-area');
    if (uploadArea) {
        photoGrid.insertBefore(photoItem, uploadArea);
    } else {
        photoGrid.appendChild(photoItem);
    }

    // Setup interactions for new photo
    setupPhotoInteractions(photoItem);
}

function setupPhotoInteractions(photoItem) {
    const viewBtn = photoItem.querySelector('.view-btn');
    const editBtn = photoItem.querySelector('.edit-btn');
    const starBtn = photoItem.querySelector('.star-btn');
    const deleteBtn = photoItem.querySelector('.delete-btn');

    if (viewBtn) {
        viewBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            openPhotoLightbox(photoItem);
        });
    }

    if (editBtn) {
        editBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            openPhotoEditModal(photoItem);
        });
    }

    if (starBtn) {
        starBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            setPrimaryPhoto(photoItem);
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            deletePhoto(photoItem);
        });
    }

    // Click to view
    photoItem.addEventListener('click', function() {
        openPhotoLightbox(this);
    });
}

// Photo Actions - FIXED
function openPhotoLightbox(photoItem) {
    const img = photoItem.querySelector('img');
    if (!img) return;

    const lightbox = document.createElement('div');
    lightbox.className = 'photo-lightbox';
    lightbox.innerHTML = `
        <div class="lightbox-overlay">
            <div class="lightbox-content">
                <button class="lightbox-close">&times;</button>
                <img src="${img.src}" alt="${img.alt}">
                <div class="lightbox-info">
                    <h4>${photoItem.querySelector('.photo-filename').textContent}</h4>
                    <span class="lightbox-category">${photoItem.querySelector('.photo-category').textContent}</span>
                </div>
                <div class="lightbox-actions">
                    <button class="lightbox-action-btn" onclick="setPrimaryPhoto(this.closest('.photo-lightbox').photoItem)">
                        <i class="fas fa-star"></i> Set as Primary
                    </button>
                    <button class="lightbox-action-btn" onclick="downloadPhoto('${img.src}', '${img.alt}')">
                        <i class="fas fa-download"></i> Download
                    </button>
                    <button class="lightbox-action-btn delete" onclick="deletePhoto(this.closest('.photo-lightbox').photoItem)">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `;

    lightbox.photoItem = photoItem;
    document.body.appendChild(lightbox);

    // Close handlers
    lightbox.querySelector('.lightbox-close').addEventListener('click', function() {
        closeLightbox(lightbox);
    });

    lightbox.querySelector('.lightbox-overlay').addEventListener('click', function(e) {
        if (e.target === this) {
            closeLightbox(lightbox);
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (lightbox.parentNode) {
            if (e.key === 'Escape') {
                closeLightbox(lightbox);
            } else if (e.key === 'ArrowLeft') {
                navigatePhoto(photoItem, -1);
                closeLightbox(lightbox);
            } else if (e.key === 'ArrowRight') {
                navigatePhoto(photoItem, 1);
                closeLightbox(lightbox);
            }
        }
    });

    // Show lightbox
    setTimeout(() => lightbox.classList.add('show'), 10);
}

function closeLightbox(lightbox) {
    lightbox.classList.remove('show');
    setTimeout(() => lightbox.remove(), 300);
}

function navigatePhoto(currentPhoto, direction) {
    const photos = Array.from(document.querySelectorAll('.photo-item:not([style*="display: none"])'));
    const currentIndex = photos.indexOf(currentPhoto);
    const nextIndex = currentIndex + direction;

    if (nextIndex >= 0 && nextIndex < photos.length) {
        openPhotoLightbox(photos[nextIndex]);
    }
}

function setPrimaryPhoto(photoItem) {
    const photoId = photoItem.dataset.photoId;

    // Update UI immediately
    document.querySelectorAll('.photo-item').forEach(item => {
        item.classList.remove('primary');
        const starBtn = item.querySelector('.star-btn i');
        if (starBtn) {
            starBtn.className = 'fas fa-star';
        }
    });

    photoItem.classList.add('primary');
    const starBtn = photoItem.querySelector('.star-btn i');
    if (starBtn) {
        starBtn.className = 'fas fa-star filled';
    }

    // Update dashboard primary photo
    updateDashboardPhoto(photoItem.querySelector('img').src);

    // Save to backend
    fetch(`/api/ring/set-primary/${photoId}`, {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Primary photo updated!', 'success');
        } else {
            showNotification('Failed to update primary photo', 'error');
        }
    })
    .catch(error => {
        console.error('Error setting primary photo:', error);
        showNotification('Error updating primary photo', 'error');
    });
}

function deletePhoto(photoItem) {
    if (!confirm('Are you sure you want to delete this photo?')) {
        return;
    }

    const photoId = photoItem.dataset.photoId;

    // Fade out
    photoItem.style.opacity = '0.5';

    fetch(`/api/ring/delete-photo/${photoId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            photoItem.remove();
            showNotification('Photo deleted successfully', 'success');
        } else {
            photoItem.style.opacity = '1';
            showNotification('Failed to delete photo', 'error');
        }
    })
    .catch(error => {
        photoItem.style.opacity = '1';
        console.error('Error deleting photo:', error);
        showNotification('Error deleting photo', 'error');
    });
}

function downloadPhoto(src, filename) {
    const a = document.createElement('a');
    a.href = src;
    a.download = filename || 'ring-photo.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Ring Details Editing - FIXED
function setupRingDetails() {
    // Setup editable fields
    const editableFields = document.querySelectorAll('[data-editable]');
    editableFields.forEach(field => {
        field.addEventListener('click', function() {
            if (!this.classList.contains('editing')) {
                startRingDetailEdit(this);
            }
        });
    });

    // Setup status updates
    const statusSelect = document.getElementById('ring-status');
    if (statusSelect) {
        statusSelect.addEventListener('change', function() {
            updateRingStatus(this.value);
        });
    }
}

function startRingDetailEdit(element) {
    const currentValue = element.textContent.trim();
    const fieldType = element.dataset.editable;

    element.classList.add('editing');

    let input;
    if (fieldType === 'textarea') {
        input = document.createElement('textarea');
        input.rows = 3;
    } else {
        input = document.createElement('input');
        input.type = 'text';
    }

    input.value = currentValue;
    input.className = 'inline-edit-input';

    // Style the input
    input.style.cssText = `
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid #d4af37;
        border-radius: 4px;
        padding: 8px 12px;
        color: white;
        font-size: inherit;
        font-family: inherit;
        width: 100%;
        resize: vertical;
    `;

    element.innerHTML = '';
    element.appendChild(input);
    input.focus();
    input.select();

    function saveEdit() {
        const newValue = input.value.trim();
        element.classList.remove('editing');
        element.textContent = newValue;

        // Save to backend
        saveRingDetail(element.dataset.field, newValue);
    }

    input.addEventListener('blur', saveEdit);
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            saveEdit();
        } else if (e.key === 'Escape') {
            element.classList.remove('editing');
            element.textContent = currentValue;
        }
    });
}

function saveRingDetail(field, value) {
    fetch('/api/ring/update-detail', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ field, value })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Detail updated successfully', 'success');
        } else {
            showNotification('Failed to update detail', 'error');
        }
    })
    .catch(error => {
        console.error('Error saving ring detail:', error);
        showNotification('Error saving detail', 'error');
    });
}

// Gallery Setup - FIXED
function setupGallery() {
    // Setup category filtering
    const categoryButtons = document.querySelectorAll('.gallery-category-btn');
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.dataset.category;
            filterGallery(category);

            // Update active button
            categoryButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Setup photo sorting
    const sortSelect = document.getElementById('photo-sort');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            sortPhotos(this.value);
        });
    }
}

function filterGallery(category) {
    const photos = document.querySelectorAll('.photo-item');
    photos.forEach(photo => {
        const photoCategory = photo.dataset.category || 'general';
        const shouldShow = category === 'all' || photoCategory === category;

        photo.style.display = shouldShow ? 'block' : 'none';

        if (shouldShow) {
            photo.classList.add('fade-in');
        }
    });
}

function sortPhotos(sortBy) {
    const photoGrid = document.querySelector('.photo-grid');
    const photos = Array.from(photoGrid.querySelectorAll('.photo-item'));
    const uploadAreas = Array.from(photoGrid.querySelectorAll('.upload-area'));

    photos.sort((a, b) => {
        switch (sortBy) {
            case 'date-new':
                return new Date(b.dataset.date || 0) - new Date(a.dataset.date || 0);
            case 'date-old':
                return new Date(a.dataset.date || 0) - new Date(b.dataset.date || 0);
            case 'name':
                return a.querySelector('.photo-filename').textContent.localeCompare(
                    b.querySelector('.photo-filename').textContent
                );
            case 'category':
                return (a.dataset.category || '').localeCompare(b.dataset.category || '');
            default:
                return 0;
        }
    });

    // Clear and re-add in sorted order
    photoGrid.innerHTML = '';
    photos.forEach(photo => photoGrid.appendChild(photo));
    uploadAreas.forEach(area => photoGrid.appendChild(area));
}

// Utility Functions - FIXED
function updateDashboardPhoto(photoSrc) {
    // Update ring photo on dashboard if it exists
    const dashboardRingPhoto = document.querySelector('.dashboard-ring-photo');
    if (dashboardRingPhoto) {
        dashboardRingPhoto.src = photoSrc;
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function openPhotoUploadModal() {
    let modal = document.getElementById('photo-upload-modal');

    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'photo-upload-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Upload Ring Photos</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="upload-drop-zone">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <p>Drag & drop photos here or click to browse</p>
                        <input type="file" id="modal-file-input" multiple accept="image/*" style="display: none;">
                        <button type="button" class="btn-primary" onclick="document.getElementById('modal-file-input').click()">
                            Choose Photos
                        </button>
                    </div>
                    <div class="upload-options">
                        <label>Category:</label>
                        <select id="upload-category">
                            <option value="general">General</option>
                            <option value="inspiration">Inspiration</option>
                            <option value="progress">Progress</option>
                            <option value="final">Final Ring</option>
                            <option value="packaging">Packaging</option>
                        </select>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Setup modal events
        modal.querySelector('.modal-close').addEventListener('click', function() {
            modal.style.display = 'none';
        });

        modal.querySelector('#modal-file-input').addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            handleMultipleFiles(files);
            modal.style.display = 'none';
        });

        // Setup drag and drop for modal
        const dropZone = modal.querySelector('.upload-drop-zone');
        dropZone.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');

            const files = Array.from(e.dataTransfer.files);
            const imageFiles = files.filter(file => file.type.startsWith('image/'));

            if (imageFiles.length > 0) {
                handleMultipleFiles(imageFiles);
                modal.style.display = 'none';
            }
        });
    }

    modal.style.display = 'flex';
}

// Progress Tracking - FIXED
function setupProgressTracking() {
    const progressItems = document.querySelectorAll('.progress-item');
    progressItems.forEach(item => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (checkbox) {
            checkbox.addEventListener('change', function() {
                updateProgressItem(item, this.checked);
            });
        }
    });
}

function updateProgressItem(item, completed) {
    const progressId = item.dataset.progressId;

    item.classList.toggle('completed', completed);

    // Update progress bar
    updateOverallProgress();

    // Save to backend
    if (progressId) {
        fetch(`/api/ring/update-progress/${progressId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ completed })
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                console.error('Failed to update progress:', data.error);
            }
        })
        .catch(error => {
            console.error('Error updating progress:', error);
        });
    }
}

function updateOverallProgress() {
    const progressItems = document.querySelectorAll('.progress-item');
    const completedItems = document.querySelectorAll('.progress-item.completed');

    const progress = progressItems.length > 0 ? (completedItems.length / progressItems.length) * 100 : 0;

    const progressBar = document.querySelector('.ring-progress-fill');
    const progressText = document.querySelector('.ring-progress-text');

    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }

    if (progressText) {
        progressText.textContent = `${Math.round(progress)}% Complete`;
    }
}

// Export functions for global access
window.RingManager = {
    uploadPhoto: uploadPhoto,
    setPrimary: setPrimaryPhoto,
    deletePhoto: deletePhoto,
    openUploadModal: openPhotoUploadModal,
    refreshGallery: setupPhotoGrid
};