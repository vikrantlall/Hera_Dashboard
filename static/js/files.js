// Files Page JavaScript - Complete CRUD Operations
// This file should be saved as static/js/files.js

let selectedFiles = [];
let currentEditingFileId = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeFilesPage();
});

function initializeFilesPage() {
    console.log('🗂️ Initializing HERA Files Page...');
    setupFileUpload();
    setupDragAndDrop();
    setupSearch();
    setupCategoryFilters();
    setupModals();
    console.log('✅ Files page initialized successfully');
}

// =============================================================================
// FILE UPLOAD SYSTEM
// =============================================================================

function setupFileUpload() {
    const fileInput = document.getElementById('file-upload-input');

    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            handleFileSelection(e.target.files);
        });
    }
}

function setupDragAndDrop() {
    const dropZones = [
        document.getElementById('file-drop-zone'),
        document.getElementById('modal-drop-zone')
    ];

    dropZones.forEach(dropZone => {
        if (!dropZone) return;

        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
            document.body.addEventListener(eventName, preventDefaults, false);
        });

        // Highlight drop zone when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-over'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-over'), false);
        });

        // Handle dropped files
        dropZone.addEventListener('drop', function(e) {
            const files = e.dataTransfer.files;
            handleFileSelection(files);
        }, false);

        // Handle click to upload
        dropZone.addEventListener('click', function() {
            document.getElementById('file-upload-input').click();
        });
    });
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleFileSelection(files) {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(validateFile);

    if (validFiles.length === 0) {
        showNotification('No valid files selected', 'error');
        return;
    }

    if (validFiles.length !== fileArray.length) {
        showNotification(`${fileArray.length - validFiles.length} files were skipped (invalid type or too large)`, 'warning');
    }

    selectedFiles = [...selectedFiles, ...validFiles.map(file => ({
        file: file,
        category: detectFileCategory(file.name),
        notes: ''
    }))];

    // Show upload modal if not already open
    const uploadModal = document.getElementById('upload-modal');
    if (!uploadModal.classList.contains('show')) {
        openUploadModal();
    }

    updateUploadPreview();
}

function validateFile(file) {
    const maxSize = 25 * 1024 * 1024; // 25MB
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'text/plain',
        'application/zip',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (file.size > maxSize) {
        console.log(`File ${file.name} is too large (${formatFileSize(file.size)})`);
        return false;
    }

    if (!allowedTypes.includes(file.type)) {
        console.log(`File ${file.name} has unsupported type (${file.type})`);
        return false;
    }

    return true;
}

function detectFileCategory(filename) {
    const name = filename.toLowerCase();

    if (name.includes('passport') || name.includes('visa') || name.includes('ticket') || name.includes('boarding')) {
        return 'travel';
    }
    if (name.includes('hotel') || name.includes('reservation') || name.includes('booking') || name.includes('confirmation')) {
        return 'reservations';
    }
    if (name.match(/\.(jpg|jpeg|png|gif)$/)) {
        return 'photos';
    }
    if (name.match(/\.(pdf|doc|docx|txt)$/)) {
        return 'documents';
    }
    return 'other';
}

// =============================================================================
// UPLOAD MODAL MANAGEMENT
// =============================================================================

function openUploadModal() {
    const modal = document.getElementById('upload-modal');
    if (modal) {
        modal.classList.add('show');
        selectedFiles = [];
        updateUploadPreview();
    }
}

function closeUploadModal() {
    const modal = document.getElementById('upload-modal');
    if (modal) {
        modal.classList.remove('show');
        selectedFiles = [];
        updateUploadPreview();

        // Reset file input
        const fileInput = document.getElementById('file-upload-input');
        if (fileInput) fileInput.value = '';
    }
}

function updateUploadPreview() {
    const fileList = document.getElementById('upload-file-list');
    const filesContainer = document.getElementById('upload-files-container');
    const uploadBtn = document.getElementById('upload-files-btn');

    if (selectedFiles.length === 0) {
        if (fileList) fileList.style.display = 'none';
        if (uploadBtn) uploadBtn.style.display = 'none';
        return;
    }

    if (fileList) fileList.style.display = 'block';
    if (uploadBtn) uploadBtn.style.display = 'inline-flex';

    if (filesContainer) {
        filesContainer.innerHTML = '';

        selectedFiles.forEach((fileObj, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'upload-file-item';
            fileItem.innerHTML = `
                <div class="upload-file-info">
                    <i class="fas fa-file${getFileIcon(fileObj.file.name)}"></i>
                    <span class="upload-file-name">${fileObj.file.name}</span>
                    <span class="upload-file-size">(${formatFileSize(fileObj.file.size)})</span>
                </div>
                <div class="upload-file-category">
                    <select onchange="updateFileCategory(${index}, this.value)">
                        <option value="travel" ${fileObj.category === 'travel' ? 'selected' : ''}>Travel</option>
                        <option value="reservations" ${fileObj.category === 'reservations' ? 'selected' : ''}>Reservations</option>
                        <option value="photos" ${fileObj.category === 'photos' ? 'selected' : ''}>Photos</option>
                        <option value="documents" ${fileObj.category === 'documents' ? 'selected' : ''}>Documents</option>
                        <option value="other" ${fileObj.category === 'other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
                <button class="remove-file-btn" onclick="removeSelectedFile(${index})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            filesContainer.appendChild(fileItem);
        });
    }
}

function updateFileCategory(index, category) {
    if (selectedFiles[index]) {
        selectedFiles[index].category = category;
    }
}

function removeSelectedFile(index) {
    selectedFiles.splice(index, 1);
    updateUploadPreview();
}

function uploadFiles() {
    if (selectedFiles.length === 0) {
        showNotification('No files selected', 'error');
        return;
    }

    const uploadBtn = document.getElementById('upload-files-btn');
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
    selectedFiles.forEach((fileObj, index) => {
        formData.append('files', fileObj.file);
        formData.append(`categories`, fileObj.category);
        formData.append(`notes`, fileObj.notes || '');
    });

    // Simulate progress for better UX
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 90) progress = 90;
        if (progressFill) progressFill.style.width = `${progress}%`;
    }, 200);

    fetch('/api/files/upload', {
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
        clearInterval(progressInterval);
        if (progressFill) progressFill.style.width = '100%';

        if (data.success) {
            showNotification(`${data.uploaded_count} files uploaded successfully!`, 'success');
            closeUploadModal();

            // Refresh the page to show new files
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            throw new Error(data.error || 'Upload failed');
        }
    })
    .catch(error => {
        clearInterval(progressInterval);
        console.error('Upload error:', error);
        showNotification('Failed to upload files', 'error');
    })
    .finally(() => {
        // Reset UI
        if (progressSection) progressSection.style.display = 'none';
        if (uploadBtn) {
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Files';
        }
        if (progressFill) progressFill.style.width = '0%';
    });
}

// =============================================================================
// SEARCH AND FILTERING
// =============================================================================

function setupSearch() {
    const searchInput = document.getElementById('file-search');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            filterFiles(e.target.value);
        });
    }
}

function setupCategoryFilters() {
    const categoryFilters = document.querySelectorAll('.category-filter');
    categoryFilters.forEach(filter => {
        filter.addEventListener('click', function() {
            // Update active filter
            categoryFilters.forEach(f => f.classList.remove('active'));
            this.classList.add('active');

            // Filter files
            const category = this.dataset.category;
            filterFilesByCategory(category);
        });
    });
}

function filterFiles(searchTerm) {
    const fileCards = document.querySelectorAll('.file-card');
    const searchLower = searchTerm.toLowerCase();

    fileCards.forEach(card => {
        const fileName = card.querySelector('.file-name').textContent.toLowerCase();
        const category = card.dataset.category.toLowerCase();

        if (fileName.includes(searchLower) || category.includes(searchLower)) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });

    updateEmptyState();
}

function filterFilesByCategory(category) {
    const fileCards = document.querySelectorAll('.file-card');

    fileCards.forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });

    updateEmptyState();
}

function updateEmptyState() {
    const visibleCards = document.querySelectorAll('.file-card:not(.hidden)');
    const emptyState = document.querySelector('.empty-state');

    if (visibleCards.length === 0 && !emptyState) {
        showTemporaryEmptyState();
    }
}

function showTemporaryEmptyState() {
    const filesGrid = document.getElementById('files-grid');
    const tempEmpty = document.createElement('div');
    tempEmpty.className = 'empty-state temporary';
    tempEmpty.innerHTML = `
        <div class="empty-icon">
            <i class="fas fa-search"></i>
        </div>
        <h3>No Files Found</h3>
        <p>Try adjusting your search or filter criteria</p>
    `;

    // Remove any existing temporary empty state
    const existingTemp = filesGrid.querySelector('.empty-state.temporary');
    if (existingTemp) existingTemp.remove();

    filesGrid.appendChild(tempEmpty);

    // Remove when files become visible again
    const observer = new MutationObserver(() => {
        const visibleCards = document.querySelectorAll('.file-card:not(.hidden)');
        if (visibleCards.length > 0 && tempEmpty.parentNode) {
            tempEmpty.remove();
            observer.disconnect();
        }
    });

    observer.observe(filesGrid, { childList: true, subtree: true, attributes: true });
}

// =============================================================================
// FILE ACTIONS
// =============================================================================

function downloadFile(filename) {
    const link = document.createElement('a');
    link.href = `/api/files/download/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function viewFile(filename, fileType) {
    const modal = document.getElementById('file-viewer-modal');
    const content = document.getElementById('file-viewer-content');
    const title = document.getElementById('viewer-title');
    const downloadBtn = document.getElementById('download-from-viewer');

    if (modal && content && title) {
        title.textContent = filename;

        if (fileType === 'image') {
            content.innerHTML = `<img src="/static/uploads/files/${filename}" alt="${filename}" style="max-width: 100%; max-height: 100%; object-fit: contain;">`;
        } else if (fileType === 'pdf') {
            content.innerHTML = `<iframe src="/static/uploads/files/${filename}" style="width: 100%; height: 100%; border: none;"></iframe>`;
        } else {
            content.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <i class="fas fa-file" style="font-size: 48px; color: var(--text-light); margin-bottom: 16px;"></i>
                    <p>Preview not available for this file type</p>
                    <button class="btn btn-primary" onclick="downloadFile('${filename}')">
                        <i class="fas fa-download"></i> Download to View
                    </button>
                </div>
            `;
        }

        if (downloadBtn) {
            downloadBtn.onclick = () => downloadFile(filename);
        }

        modal.classList.add('show');
    }
}

function closeViewerModal() {
    const modal = document.getElementById('file-viewer-modal');
    if (modal) {
        modal.classList.remove('show');

        // Clear content to free memory
        const content = document.getElementById('file-viewer-content');
        if (content) content.innerHTML = '';
    }
}

function editFile(fileId) {
    currentEditingFileId = fileId;

    // Get file data (you might want to fetch this from server)
    const fileCard = document.querySelector(`[data-file-id="${fileId}"]`);
    if (!fileCard) return;

    const fileName = fileCard.querySelector('.file-name').textContent;
    const category = fileCard.dataset.category;

    // Populate edit modal
    const editModal = document.getElementById('edit-file-modal');
    const nameInput = document.getElementById('edit-file-name');
    const categorySelect = document.getElementById('edit-file-category');
    const notesTextarea = document.getElementById('edit-file-notes');

    if (nameInput) nameInput.value = fileName;
    if (categorySelect) categorySelect.value = category;
    if (notesTextarea) notesTextarea.value = ''; // Would fetch from server

    if (editModal) editModal.classList.add('show');
}

function closeEditModal() {
    const modal = document.getElementById('edit-file-modal');
    if (modal) {
        modal.classList.remove('show');
        currentEditingFileId = null;
    }
}

function deleteFile(fileId, fileName) {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
        return;
    }

    fetch(`/api/files/delete/${fileId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('File deleted successfully', 'success');

            // Remove file card from UI
            const fileCard = document.querySelector(`[data-file-id="${fileId}"]`);
            if (fileCard) {
                fileCard.style.animation = 'fadeOutUp 0.3s ease';
                setTimeout(() => {
                    fileCard.remove();
                    updateStats();
                }, 300);
            }
        } else {
            showNotification('Failed to delete file', 'error');
        }
    })
    .catch(error => {
        console.error('Delete error:', error);
        showNotification('Failed to delete file', 'error');
    });
}

// =============================================================================
// MODAL MANAGEMENT
// =============================================================================

function setupModals() {
    // Close modals when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            const modalId = e.target.id;
            if (modalId === 'upload-modal') closeUploadModal();
            else if (modalId === 'edit-file-modal') closeEditModal();
            else if (modalId === 'file-viewer-modal') closeViewerModal();
        }
    });

    // Close modals with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal.show');
            if (openModal) {
                const modalId = openModal.id;
                if (modalId === 'upload-modal') closeUploadModal();
                else if (modalId === 'edit-file-modal') closeEditModal();
                else if (modalId === 'file-viewer-modal') closeViewerModal();
            }
        }
    });

    // Handle edit form submission
    const editForm = document.getElementById('edit-file-form');
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveFileChanges();
        });
    }
}

function saveFileChanges() {
    if (!currentEditingFileId) return;

    const nameInput = document.getElementById('edit-file-name');
    const categorySelect = document.getElementById('edit-file-category');
    const notesTextarea = document.getElementById('edit-file-notes');

    const data = {
        name: nameInput?.value,
        category: categorySelect?.value,
        notes: notesTextarea?.value
    };

    fetch(`/api/files/update/${currentEditingFileId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('File updated successfully', 'success');
            closeEditModal();

            // Update file card in UI
            updateFileCardDisplay(currentEditingFileId, data.file);
        } else {
            showNotification('Failed to update file', 'error');
        }
    })
    .catch(error => {
        console.error('Update error:', error);
        showNotification('Failed to update file', 'error');
    });
}

function updateFileCardDisplay(fileId, fileData) {
    const fileCard = document.querySelector(`[data-file-id="${fileId}"]`);
    if (!fileCard) return;

    const nameElement = fileCard.querySelector('.file-name');
    const categoryBadge = fileCard.querySelector('.category-badge');

    if (nameElement) nameElement.textContent = fileData.name;
    if (categoryBadge) {
        categoryBadge.textContent = fileData.category.charAt(0).toUpperCase() + fileData.category.slice(1);
        categoryBadge.className = `category-badge category-${fileData.category}`;
    }

    fileCard.dataset.category = fileData.category;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    switch (ext) {
        case 'pdf': return '-pdf';
        case 'doc':
        case 'docx': return '-word';
        case 'xls':
        case 'xlsx': return '-excel';
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif': return '-image';
        case 'zip': return '-archive';
        default: return '';
    }
}

function updateStats() {
    // Update file count and other stats
    const visibleFiles = document.querySelectorAll('.file-card:not(.hidden)');
    const totalFilesElement = document.getElementById('total-files');

    if (totalFilesElement) {
        totalFilesElement.textContent = visibleFiles.length;
    }

    // Update category counts
    const categories = {};
    visibleFiles.forEach(card => {
        const category = card.dataset.category;
        categories[category] = (categories[category] || 0) + 1;
    });

    // Update filter counts
    document.querySelectorAll('.category-filter').forEach(filter => {
        const category = filter.dataset.category;
        const countElement = filter.querySelector('.count');
        if (countElement) {
            if (category === 'all') {
                countElement.textContent = visibleFiles.length;
            } else {
                countElement.textContent = categories[category] || 0;
            }
        }
    });
}

// Notification system (assuming it exists in base.js)
function showNotification(message, type = 'info') {
    // This should integrate with your existing notification system
    console.log(`${type.toUpperCase()}: ${message}`);

    // Simple fallback notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        z-index: 10001;
        animation: slideIn 0.3s ease;
    `;

    switch (type) {
        case 'success': notification.style.backgroundColor = '#10b981'; break;
        case 'error': notification.style.backgroundColor = '#ef4444'; break;
        case 'warning': notification.style.backgroundColor = '#f59e0b'; break;
        default: notification.style.backgroundColor = '#3b82f6';
    }

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}