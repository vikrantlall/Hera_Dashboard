// Ring Page JavaScript with Photo Management and Inline Editing

document.addEventListener('DOMContentLoaded', function() {
    initializeRingPage();
    initializeInlineEditing();
    initializePhotoManagement();
    initializeLightbox();
    setupAutoSave();
});

let currentEditingElement = null;
let originalValue = null;
let uploadedPhotos = [];
let currentPhotoIndex = 0;

function initializeRingPage() {
    // Initialize ring-specific features
    setupRingAnimations();
    loadExistingPhotos();
    setupEditModeHighlights();
    
    // Add sparkle effects to ring elements
    addSparkleEffects();
}

function initializeInlineEditing() {
    const editableElements = document.querySelectorAll('.editable-text, .editable-textarea');
    
    editableElements.forEach(element => {
        element.addEventListener('click', function() {
            if (currentEditingElement && currentEditingElement !== this) {
                cancelEdit();
            }
            startEdit(this);
        });
        
        element.addEventListener('blur', function() {
            if (this === currentEditingElement) {
                setTimeout(() => {
                    if (document.activeElement !== this) {
                        saveEdit();
                    }
                }, 100);
            }
        });
        
        element.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey && !this.classList.contains('editable-textarea')) {
                e.preventDefault();
                saveEdit();
            } else if (e.key === 'Escape') {
                cancelEdit();
            }
        });
        
        // Add hover effects
        element.addEventListener('mouseenter', function() {
            if (!this.classList.contains('editing')) {
                this.style.background = 'rgba(212, 175, 55, 0.1)';
            }
        });
        
        element.addEventListener('mouseleave', function() {
            if (!this.classList.contains('editing')) {
                this.style.background = '';
            }
        });
    });
}

function startEdit(element) {
    if (currentEditingElement) return;
    
    currentEditingElement = element;
    originalValue = element.textContent.trim();
    
    element.classList.add('editing');
    element.style.background = '';
    
    if (element.classList.contains('editable-textarea')) {
        // For textarea elements, make them editable
        element.contentEditable = true;
        element.style.minHeight = '100px';
    } else {
        // For text elements
        element.contentEditable = true;
    }
    
    element.focus();
    
    // Select all text
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    
    // Add edit indicator
    showEditIndicator(element);
}

function saveEdit() {
    if (!currentEditingElement) return;
    
    const newValue = currentEditingElement.textContent.trim();
    const field = currentEditingElement.dataset.field;
    
    if (newValue !== originalValue) {
        // Validate input
        if (!newValue && !currentEditingElement.dataset.placeholder) {
            utils.showNotification('Field cannot be empty', 'error');
            cancelEdit();
            return;
        }
        
        // Show loading indicator
        showLoadingIndicator(currentEditingElement);
        
        // Prepare update data
        const updateData = { [field]: newValue };
        
        // Send update to server
        updateRing(updateData)
            .then(() => {
                hideLoadingIndicator(currentEditingElement);
                showSuccessIndicator(currentEditingElement);
                utils.showNotification('Ring details updated successfully', 'success');
            })
            .catch(error => {
                hideLoadingIndicator(currentEditingElement);
                showErrorIndicator(currentEditingElement);
                currentEditingElement.textContent = originalValue;
                utils.showNotification('Failed to update ring details', 'error');
            });
    }
    
    endEdit();
}

function cancelEdit() {
    if (!currentEditingElement) return;
    
    currentEditingElement.textContent = originalValue;
    endEdit();
}

function endEdit() {
    if (currentEditingElement) {
        currentEditingElement.classList.remove('editing');
        currentEditingElement.contentEditable = false;
        currentEditingElement.style.minHeight = '';
        
        hideEditIndicator(currentEditingElement);
        
        currentEditingElement = null;
        originalValue = null;
    }
}

function updateRing(data) {
    return utils.ajax('/api/ring', {
        method: 'PUT',
        data: data
    });
}

function initializePhotoManagement() {
    const uploadBtn = document.getElementById('upload-photo-btn');
    const photoInput = document.getElementById('photo-upload');
    const photoGallery = document.getElementById('photo-gallery');
    
    if (uploadBtn && photoInput) {
        uploadBtn.addEventListener('click', function() {
            photoInput.click();
        });
        
        photoInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                uploadPhotos(files);
            }
        });
    }
    
    // Setup drag and drop for photo upload
    if (photoGallery) {
        setupDragAndDrop(photoGallery);
    }
}

function setupDragAndDrop(element) {
    element.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        element.classList.add('drag-over');
    });
    
    element.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (!element.contains(e.relatedTarget)) {
            element.classList.remove('drag-over');
        }
    });
    
    element.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        element.classList.remove('drag-over');
        
        const files = Array.from(e.dataTransfer.files).filter(file => 
            file.type.startsWith('image/')
        );
        
        if (files.length > 0) {
            uploadPhotos(files);
        }
    });
}

function uploadPhotos(files) {
    const progressModal = document.getElementById('upload-progress');
    const progressBar = document.getElementById('upload-progress-fill');
    const statusText = document.getElementById('upload-status');
    
    if (progressModal) {
        progressModal.classList.add('active');
    }
    
    const totalFiles = files.length;
    let uploadedCount = 0;
    
    // Upload files one by one
    files.forEach((file, index) => {
        const formData = new FormData();
        formData.append('photo', file);
        
        if (statusText) {
            statusText.textContent = `Uploading ${index + 1} of ${totalFiles}...`;
        }
        
        fetch('/api/ring/upload', {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                addPhotoToGallery(data.photo_url, data.filename);
                uploadedCount++;
                
                // Update progress
                const progress = (uploadedCount / totalFiles) * 100;
                if (progressBar) {
                    progressBar.style.width = `${progress}%`;
                }
                
                if (uploadedCount === totalFiles) {
                    if (statusText) {
                        statusText.textContent = 'Upload complete!';
                    }
                    
                    setTimeout(() => {
                        if (progressModal) {
                            progressModal.classList.remove('active');
                        }
                        utils.showNotification(`${totalFiles} photo(s) uploaded successfully`, 'success');
                    }, 1000);
                }
            } else {
                throw new Error(data.error || 'Upload failed');
            }
        })
        .catch(error => {
            console.error('Upload error:', error);
            utils.showNotification(`Failed to upload ${file.name}`, 'error');
            
            uploadedCount++;
            if (uploadedCount === totalFiles && progressModal) {
                progressModal.classList.remove('active');
            }
        });
    });
}

function addPhotoToGallery(photoUrl, filename) {
    const photoGallery = document.getElementById('photo-gallery');
    const placeholder = photoGallery.querySelector('.photo-placeholder');
    
    // Remove placeholder if it exists
    if (placeholder) {
        placeholder.remove();
    }
    
    // Create photo grid if it doesn't exist
    let photoGrid = photoGallery.querySelector('.photo-grid');
    if (!photoGrid) {
        photoGrid = document.createElement('div');
        photoGrid.className = 'photo-grid';
        photoGallery.appendChild(photoGrid);
    }
    
    // Create photo item
    const photoItem = document.createElement('div');
    photoItem.className = 'photo-item';
    photoItem.innerHTML = `
        <img src="${photoUrl}" alt="Ring Photo" loading="lazy">
        <div class="photo-overlay">
            <div class="photo-actions">
                <button class="photo-action" onclick="viewPhoto('${photoUrl}', ${uploadedPhotos.length})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="photo-action" onclick="setPrimaryPhoto('${photoUrl}')">
                    <i class="fas fa-star"></i>
                </button>
                <button class="photo-action" onclick="deletePhoto('${filename}', this)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    // Add entrance animation
    photoItem.style.opacity = '0';
    photoItem.style.transform = 'scale(0.9)';
    photoGrid.appendChild(photoItem);
    
    // Animate in
    requestAnimationFrame(() => {
        photoItem.style.transition = 'all 0.3s ease';
        photoItem.style.opacity = '1';
        photoItem.style.transform = 'scale(1)';
    });
    
    // Add to uploaded photos array
    uploadedPhotos.push({
        url: photoUrl,
        filename: filename,
        isPrimary: uploadedPhotos.length === 0
    });
    
    // Add click handler for lightbox
    photoItem.addEventListener('click', function() {
        viewPhoto(photoUrl, uploadedPhotos.length - 1);
    });
}

function loadExistingPhotos() {
    // This would typically load existing photos from the server
    // For now, we'll check if there are any existing photos in the gallery
    const existingPhotos = document.querySelectorAll('.photo-item img');
    existingPhotos.forEach((img, index) => {
        uploadedPhotos.push({
            url: img.src,
            filename: img.alt,
            isPrimary: index === 0
        });
    });
}

function initializeLightbox() {
    const lightbox = document.getElementById('photo-lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const prevBtn = document.getElementById('prev-photo');
    const nextBtn = document.getElementById('next-photo');
    const deleteBtn = document.getElementById('delete-photo');
    const setPrimaryBtn = document.getElementById('set-primary');
    const closeBtn = lightbox.querySelector('.lightbox-close');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            currentPhotoIndex = (currentPhotoIndex - 1 + uploadedPhotos.length) % uploadedPhotos.length;
            updateLightboxImage();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            currentPhotoIndex = (currentPhotoIndex + 1) % uploadedPhotos.length;
            updateLightboxImage();
        });
    }
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            const currentPhoto = uploadedPhotos[currentPhotoIndex];
            if (currentPhoto) {
                deletePhoto(currentPhoto.filename);
            }
        });
    }
    
    if (setPrimaryBtn) {
        setPrimaryBtn.addEventListener('click', function() {
            const currentPhoto = uploadedPhotos[currentPhotoIndex];
            if (currentPhoto) {
                setPrimaryPhoto(currentPhoto.url);
            }
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            lightbox.classList.remove('active');
        });
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (lightbox.classList.contains('active')) {
            if (e.key === 'ArrowLeft') {
                prevBtn && prevBtn.click();
            } else if (e.key === 'ArrowRight') {
                nextBtn && nextBtn.click();
            } else if (e.key === 'Escape') {
                closeBtn && closeBtn.click();
            }
        }
    });
}

function viewPhoto(photoUrl, index) {
    const lightbox = document.getElementById('photo-lightbox');
    currentPhotoIndex = index;
    
    updateLightboxImage();
    lightbox.classList.add('active');
}

function updateLightboxImage() {
    const lightboxImage = document.getElementById('lightbox-image');
    const currentPhoto = uploadedPhotos[currentPhotoIndex];
    
    if (lightboxImage && currentPhoto) {
        lightboxImage.src = currentPhoto.url;
        
        // Update navigation buttons
        const prevBtn = document.getElementById('prev-photo');
        const nextBtn = document.getElementById('next-photo');
        
        if (prevBtn) prevBtn.disabled = uploadedPhotos.length <= 1;
        if (nextBtn) nextBtn.disabled = uploadedPhotos.length <= 1;
    }
}

function setPrimaryPhoto(photoUrl) {
    // Update primary photo status
    uploadedPhotos.forEach(photo => {
        photo.isPrimary = photo.url === photoUrl;
    });
    
    // Update UI to show primary photo
    const photoItems = document.querySelectorAll('.photo-item');
    photoItems.forEach(item => {
        const img = item.querySelector('img');
        if (img && img.src === photoUrl) {
            item.classList.add('primary-photo');
            // Add primary indicator
            if (!item.querySelector('.primary-indicator')) {
                const indicator = document.createElement('div');
                indicator.className = 'primary-indicator';
                indicator.innerHTML = '<i class="fas fa-star"></i>';
                item.appendChild(indicator);
            }
        } else {
            item.classList.remove('primary-photo');
            const indicator = item.querySelector('.primary-indicator');
            if (indicator) {
                indicator.remove();
            }
        }
    });
    
    utils.showNotification('Primary photo updated', 'success');
}

function deletePhoto(filename, buttonElement) {
    if (confirm('Are you sure you want to delete this photo?')) {
        const photoItem = buttonElement ? buttonElement.closest('.photo-item') : null;
        
        if (photoItem) {
            photoItem.style.opacity = '0';
            photoItem.style.transform = 'scale(0.9)';
            
            setTimeout(() => {
                photoItem.remove();
                
                // Remove from uploaded photos array
                uploadedPhotos = uploadedPhotos.filter(photo => photo.filename !== filename);
                
                // If no photos left, show placeholder
                const photoGrid = document.querySelector('.photo-grid');
                if (photoGrid && photoGrid.children.length === 0) {
                    showPhotoPlaceholder();
                }
                
                utils.showNotification('Photo deleted', 'success');
            }, 300);
        }
    }
}

function showPhotoPlaceholder() {
    const photoGallery = document.getElementById('photo-gallery');
    const photoGrid = photoGallery.querySelector('.photo-grid');
    
    if (photoGrid) {
        photoGrid.remove();
    }
    
    const placeholder = document.createElement('div');
    placeholder.className = 'photo-placeholder';
    placeholder.innerHTML = `
        <div class="placeholder-content">
            <i class="fas fa-camera"></i>
            <h3>No Photos Yet</h3>
            <p>Upload photos of your ring to create a beautiful gallery</p>
            <button class="btn btn-primary" onclick="document.getElementById('photo-upload').click()">
                <i class="fas fa-plus"></i>
                Add First Photo
            </button>
        </div>
    `;
    
    photoGallery.appendChild(placeholder);
}

function setupRingAnimations() {
    // Add sparkle animation to ring title
    const ringTitle = document.querySelector('.ring-title i');
    if (ringTitle) {
        setInterval(() => {
            ringTitle.style.transform = 'scale(1.1) rotate(10deg)';
            ringTitle.style.filter = 'brightness(1.3)';
            
            setTimeout(() => {
                ringTitle.style.transform = 'scale(1) rotate(0deg)';
                ringTitle.style.filter = 'brightness(1)';
            }, 300);
        }, 3000);
    }
    
    // Add hover effects to spec cards
    const specCards = document.querySelectorAll('.spec-card');
    specCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-6px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(-4px) scale(1)';
        });
    });
}

function addSparkleEffects() {
    const ringHero = document.querySelector('.ring-hero');
    
    if (ringHero) {
        setInterval(() => {
            createSparkle(ringHero);
        }, 2000);
    }
}

function createSparkle(container) {
    const sparkle = document.createElement('div');
    sparkle.innerHTML = '✨';
    sparkle.style.cssText = `
        position: absolute;
        font-size: ${Math.random() * 12 + 8}px;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation: sparkle 2s ease-out forwards;
        pointer-events: none;
        z-index: 3;
    `;
    
    container.appendChild(sparkle);
    
    setTimeout(() => {
        if (sparkle.parentNode) {
            sparkle.remove();
        }
    }, 2000);
}

function setupEditModeHighlights() {
    const editableElements = document.querySelectorAll('.editable-text, .editable-textarea');
    
    // Add edit mode toggle
    const toggleEditMode = () => {
        const isEditMode = document.body.classList.contains('edit-mode');
        
        if (isEditMode) {
            document.body.classList.remove('edit-mode');
            editableElements.forEach(el => el.classList.remove('edit-highlight'));
            utils.showNotification('Edit mode disabled', 'info');
        } else {
            document.body.classList.add('edit-mode');
            editableElements.forEach(el => el.classList.add('edit-highlight'));
            utils.showNotification('Edit mode enabled - click any field to edit', 'info');
        }
    };
    
    // Add keyboard shortcut for edit mode
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            toggleEditMode();
        }
    });
}

function showEditIndicator(element) {
    const indicator = document.createElement('div');
    indicator.className = 'edit-indicator';
    indicator.innerHTML = '<i class="fas fa-edit"></i>';
    element.appendChild(indicator);
}

function hideEditIndicator(element) {
    const indicator = element.querySelector('.edit-indicator');
    if (indicator) {
        indicator.remove();
    }
}

function showLoadingIndicator(element) {
    element.classList.add('loading');
    const indicator = document.createElement('div');
    indicator.className = 'loading-indicator';
    indicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    element.appendChild(indicator);
}

function hideLoadingIndicator(element) {
    element.classList.remove('loading');
    const indicator = element.querySelector('.loading-indicator');
    if (indicator) {
        indicator.remove();
    }
}

function showSuccessIndicator(element) {
    element.classList.add('success');
    setTimeout(() => {
        element.classList.remove('success');
    }, 2000);
}

function showErrorIndicator(element) {
    element.classList.add('error');
    setTimeout(() => {
        element.classList.remove('error');
    }, 2000);
}

function setupAutoSave() {
    let autoSaveTimeout;
    
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('editable-text') || 
            e.target.classList.contains('editable-textarea')) {
            
            clearTimeout(autoSaveTimeout);
            autoSaveTimeout = setTimeout(() => {
                if (currentEditingElement === e.target) {
                    saveEdit();
                }
            }, 3000); // Auto-save after 3 seconds of inactivity
        }
    });
}

// Export functions for external use
window.ringPageUtils = {
    viewPhoto,
    setPrimaryPhoto,
    deletePhoto,
    uploadPhotos,
    updateRing
};