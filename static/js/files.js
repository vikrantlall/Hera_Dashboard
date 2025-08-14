// Enhanced Files Page JavaScript - Complete Fixed Version with Video Support
// Focuses on file management with proper UI updating

let selectedFiles = [];
let currentEditFileId = null;
let currentDeleteFileId = null;
let uploadInProgress = false;

document.addEventListener('DOMContentLoaded', function() {
    initializeFiles();
});

function initializeFiles() {
    console.log('🗂️ Initializing Files Page...');

    setupFileInput();
    setupDragDrop();
    setupViewToggle();
    setupFilters();
    setupSearch();
    setupModals();

    // Debug: Check what elements exist on page load
    console.log('🔍 Debug - Filter buttons found:', document.querySelectorAll('.filter-badge, .category-filter').length);
    console.log('📁 Debug - File items found:', document.querySelectorAll('.file-item').length);
    console.log('🎨 Debug - File icons found:', document.querySelectorAll('.file-icon').length);

    console.log('✅ Files initialized');
}

// =============================================================================
// FILE INPUT & SELECTION - With Video Support
// =============================================================================

function setupFileInput() {
    const fileInput = document.getElementById('file-upload-input');

    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                handleSelectedFiles(Array.from(e.target.files));
            }
        });
    }
}

function triggerFileSelect() {
    const fileInput = document.getElementById('file-upload-input');
    if (fileInput && !uploadInProgress) {
        fileInput.click();
    }
}

function handleSelectedFiles(files) {
    if (uploadInProgress) {
        showNotification('Upload in progress, please wait', 'warning');
        return;
    }

    // Clear previous selection
    selectedFiles = [];

    // Validate and process files - WITH VIDEO SUPPORT
    const validFiles = [];
    const allowedTypes = [
        'pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'zip', 'xlsx', 'xls',
        'mov', 'mp4', 'avi', 'mkv', 'webm'  // Added video extensions
    ];
    const maxSize = 100 * 1024 * 1024; // Increased to 100MB for videos

    files.forEach(file => {
        const ext = file.name.split('.').pop().toLowerCase();

        if (!allowedTypes.includes(ext)) {
            showNotification(`${file.name}: File type not supported`, 'error');
            return;
        }

        if (file.size > maxSize) {
            showNotification(`${file.name}: File too large (max 100MB)`, 'error');
            return;
        }

        validFiles.push({
            file: file,
            category: autoDetectCategory(file.name),
            notes: ''
        });
    });

    if (validFiles.length === 0) {
        showNotification('No valid files selected', 'error');
        return;
    }

    selectedFiles = validFiles;
    showUploadModal();
}

function autoDetectCategory(filename) {
    const name = filename.toLowerCase();

    if (name.match(/\.(jpg|jpeg|png|gif|webp)$/)) return 'photos';
    if (name.match(/\.(mov|mp4|avi|mkv|webm)$/)) return 'videos';  // NEW: Video category
    if (name.match(/\.(pdf|doc|docx|txt)$/)) return 'documents';
    if (name.includes('reservation') || name.includes('booking') || name.includes('hotel')) return 'reservations';
    if (name.includes('passport') || name.includes('visa') || name.includes('travel')) return 'travel';

    return 'other';
}

// =============================================================================
// DRAG & DROP - Clean Implementation
// =============================================================================

function setupDragDrop() {
    let dragCounter = 0;

    document.addEventListener('dragenter', function(e) {
        e.preventDefault();
        dragCounter++;

        if (dragCounter === 1 && !uploadInProgress) {
            document.getElementById('drop-overlay').classList.add('show');
        }
    });

    document.addEventListener('dragleave', function(e) {
        e.preventDefault();
        dragCounter--;

        if (dragCounter === 0) {
            document.getElementById('drop-overlay').classList.remove('show');
        }
    });

    document.addEventListener('dragover', function(e) {
        e.preventDefault();
    });

    document.addEventListener('drop', function(e) {
        e.preventDefault();
        dragCounter = 0;
        document.getElementById('drop-overlay').classList.remove('show');

        if (!uploadInProgress && e.dataTransfer.files.length > 0) {
            handleSelectedFiles(Array.from(e.dataTransfer.files));
        }
    });
}

// =============================================================================
// VIEW TOGGLE - Cards vs List
// =============================================================================

function setupViewToggle() {
    const viewButtons = document.querySelectorAll('.view-btn');
    const container = document.getElementById('files-container');

    viewButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const view = this.dataset.view;

            // Update button states
            viewButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // Update view
            if (container) {
                if (view === 'list') {
                    container.className = 'files-list view-list';
                    // Show list rows, hide cards
                    document.querySelectorAll('.file-card').forEach(card => card.style.display = 'none');
                    document.querySelectorAll('.file-row').forEach(row => row.style.display = 'flex');
                } else {
                    container.className = 'files-grid view-cards';
                    // Show cards, hide list rows
                    document.querySelectorAll('.file-card').forEach(card => card.style.display = 'block');
                    document.querySelectorAll('.file-row').forEach(row => row.style.display = 'none');
                }
            }
        });
    });
}

// =============================================================================
// FILTERS & SEARCH - Fixed Implementation
// =============================================================================

function setupFilters() {
    // Fixed: Use the correct selector from the HTML
    const filterButtons = document.querySelectorAll('.filter-badge, .category-filter');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            console.log('🔍 Filter clicked:', this.dataset.category);

            // Update active state
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // Filter files
            const category = this.dataset.category;
            filterFiles(category);
        });
    });

    console.log('🔍 Found', filterButtons.length, 'filter buttons');
}

function filterFiles(category) {
    console.log('🔍 Filtering files by category:', category);

    const items = document.querySelectorAll('.file-item');
    let visibleCount = 0;

    console.log('📁 Found', items.length, 'file items to filter');

    items.forEach(item => {
        const itemCategory = item.dataset.category;
        console.log('📄 File category:', itemCategory, '| Filter:', category);

        if (category === 'all' || itemCategory === category) {
            item.style.display = 'block';
            visibleCount++;
            console.log('✅ Showing file');
        } else {
            item.style.display = 'none';
            console.log('❌ Hiding file');
        }
    });

    console.log('👁️ Visible files:', visibleCount);
    updateEmptyState(visibleCount > 0);
}

function setupSearch() {
    const searchInput = document.getElementById('file-search');
    const clearBtn = document.getElementById('clear-search');

    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase();
            searchFiles(query);

            if (clearBtn) {
                clearBtn.style.display = query ? 'flex' : 'none';
            }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            searchInput.value = '';
            searchFiles('');
            this.style.display = 'none';
        });
    }
}

function searchFiles(query) {
    const items = document.querySelectorAll('.file-item');
    let visibleCount = 0;

    items.forEach(item => {
        const name = item.querySelector('.file-name, .row-name').textContent.toLowerCase();

        if (!query || name.includes(query)) {
            item.style.display = 'block';
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });

    updateEmptyState(visibleCount > 0);
}

function updateEmptyState(hasFiles) {
    const emptyState = document.querySelector('.empty-state');
    const filesContainer = document.getElementById('files-container');

    if (emptyState && filesContainer) {
        emptyState.style.display = hasFiles ? 'none' : 'flex';
        filesContainer.style.display = hasFiles ? 'grid' : 'none';
    }
}

// =============================================================================
// UPLOAD MODAL - Streamlined Process
// =============================================================================

function showUploadModal() {
    const modal = document.getElementById('upload-modal');
    const filesListContainer = document.getElementById('files-list');
    const selectedSection = document.getElementById('selected-files');
    const fileCount = document.getElementById('file-count');

    if (!modal || !filesListContainer) return;

    // Show files list
    filesListContainer.innerHTML = '';

    selectedFiles.forEach((fileObj, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item-preview';
        fileItem.innerHTML = `
            <div class="file-preview-info">
                <i class="fas ${getFileIcon(fileObj.file.name)}"></i>
                <div class="file-details">
                    <div class="file-name">${fileObj.file.name}</div>
                    <div class="file-size">${formatFileSize(fileObj.file.size)}</div>
                </div>
            </div>
            <div class="file-category-select">
                <select onchange="updateFileCategory(${index}, this.value)">
                    <option value="travel" ${fileObj.category === 'travel' ? 'selected' : ''}>Travel</option>
                    <option value="reservations" ${fileObj.category === 'reservations' ? 'selected' : ''}>Bookings</option>
                    <option value="photos" ${fileObj.category === 'photos' ? 'selected' : ''}>Photos</option>
                    <option value="videos" ${fileObj.category === 'videos' ? 'selected' : ''}>Videos</option>
                    <option value="documents" ${fileObj.category === 'documents' ? 'selected' : ''}>Documents</option>
                    <option value="other" ${fileObj.category === 'other' ? 'selected' : ''}>Other</option>
                </select>
            </div>
            <button class="remove-file" onclick="removeSelectedFile(${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        filesListContainer.appendChild(fileItem);
    });

    selectedSection.style.display = 'block';
    fileCount.textContent = selectedFiles.length;

    modal.classList.add('show');
}

function closeUploadModal() {
    const modal = document.getElementById('upload-modal');
    if (modal) {
        modal.classList.remove('show');
    }

    // Reset if not uploading
    if (!uploadInProgress) {
        selectedFiles = [];
        document.getElementById('selected-files').style.display = 'none';
        document.getElementById('upload-progress').style.display = 'none';
    }
}

function updateFileCategory(index, category) {
    if (selectedFiles[index]) {
        selectedFiles[index].category = category;
    }
}

function removeSelectedFile(index) {
    selectedFiles.splice(index, 1);

    if (selectedFiles.length === 0) {
        closeUploadModal();
    } else {
        showUploadModal(); // Refresh the modal
    }
}

function clearSelectedFiles() {
    selectedFiles = [];
    closeUploadModal();
}

function startUpload() {
    if (selectedFiles.length === 0 || uploadInProgress) {
        return;
    }

    uploadInProgress = true;

    // Show progress
    document.getElementById('upload-progress').style.display = 'block';
    document.getElementById('upload-btn').style.display = 'none';

    const formData = new FormData();

    selectedFiles.forEach(fileObj => {
        formData.append('files', fileObj.file);
        formData.append('categories', fileObj.category);
        formData.append('notes', fileObj.notes || '');
    });

    // Progress simulation
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 90) progress = 90;
        updateProgress(progress);
    }, 200);

    fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
    })
    .then(response => {
        clearInterval(progressInterval);

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.status}`);
        }

        return response.json();
    })
    .then(data => {
        updateProgress(100);

        setTimeout(() => {
            if (data.success) {
                showNotification(`✅ ${selectedFiles.length} files uploaded successfully!`, 'success');
                closeUploadModal();

                // Refresh page after short delay
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                throw new Error(data.error || 'Upload failed');
            }
        }, 500);
    })
    .catch(error => {
        clearInterval(progressInterval);
        console.error('Upload error:', error);
        showNotification(`Upload failed: ${error.message}`, 'error');

        // Reset upload state
        document.getElementById('upload-progress').style.display = 'none';
        document.getElementById('upload-btn').style.display = 'block';
    })
    .finally(() => {
        uploadInProgress = false;
    });
}

function updateProgress(percent) {
    const fill = document.getElementById('progress-fill');
    const text = document.getElementById('progress-text');

    if (fill) fill.style.width = `${percent}%`;
    if (text) text.textContent = `${Math.round(percent)}%`;
}

// =============================================================================
// FILE OPERATIONS - Edit, Delete, View, Download - FIXED REAL-TIME UPDATES
// =============================================================================

function editFile(fileId) {
    console.log('🔧 Editing file with ID:', fileId);

    // CRITICAL: Store the fileId BEFORE doing anything else
    currentEditFileId = fileId;

    // Find file in data using UUID
    const file = window.FILES_DATA?.find(f => f.id === fileId);
    if (!file) {
        showNotification('File not found', 'error');
        currentEditFileId = null; // Reset on error
        return;
    }

    console.log('📝 Found file:', file.original_name, '| Category:', file.category);

    // Populate form with current values - matching the HTML element IDs
    const nameInput = document.getElementById('edit-name');
    const categorySelect = document.getElementById('edit-category');
    const notesTextarea = document.getElementById('edit-notes');

    if (nameInput) nameInput.value = file.original_name || '';
    if (categorySelect) categorySelect.value = file.category || 'other';
    if (notesTextarea) notesTextarea.value = file.notes || '';

    // Show modal
    const modal = document.getElementById('edit-modal');
    if (modal) {
        modal.classList.add('show');
        console.log('✅ Edit modal opened with fileId:', currentEditFileId);
    } else {
        console.error('❌ Edit modal not found');
        currentEditFileId = null;
    }
}

function closeEditModal() {
    const modal = document.getElementById('edit-modal');
    if (modal) {
        modal.classList.remove('show');
    }

    // Log for debugging
    console.log('🚪 Closing edit modal. currentEditFileId was:', currentEditFileId);

    // Only clear after modal is closed, not during save
    // currentEditFileId = null;  // DON'T clear here - let saveFileEdit() handle it
}

function closeDeleteModal() {
    const modal = document.getElementById('delete-modal');
    if (modal) {
        modal.classList.remove('show');
    }

    // Log for debugging
    console.log('🚪 Closing delete modal. currentDeleteFileId was:', currentDeleteFileId);

    // Only clear after modal is closed, not during delete
    // currentDeleteFileId = null;  // DON'T clear here - let executeDelete() handle it
}

function closeViewerModal() {
    const modal = document.getElementById('viewer-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// Fixed: This is the key function that needed fixing for real-time updates
function saveFileEdit() {
    console.log('💾 saveFileEdit called. currentEditFileId:', currentEditFileId);

    if (!currentEditFileId) {
        console.error('❌ No currentEditFileId found!');
        showNotification('Error: No file selected for editing', 'error');
        return;
    }

    const saveBtn = document.getElementById('save-btn');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    saveBtn.disabled = true;

    const data = {
        name: document.getElementById('edit-name').value.trim(),
        category: document.getElementById('edit-category').value,
        notes: document.getElementById('edit-notes').value.trim()
    };

    console.log('📤 Sending update data:', data, 'for fileId:', currentEditFileId);

    // Store fileId in local variable before the async operation
    const fileIdToUpdate = currentEditFileId;

    fetch(`/api/files/update/${fileIdToUpdate}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'same-origin'
    })
    .then(response => {
        console.log('📥 Update response status:', response.status);
        return response.json();
    })
    .then(responseData => {
        console.log('📥 Update response data:', responseData);

        if (responseData.success) {
            showNotification('File updated successfully', 'success');

            // Use the stored fileId, not currentEditFileId
            updateFileInUI(fileIdToUpdate, responseData.file);

            // Clear and close AFTER successful update
            currentEditFileId = null;
            closeEditModal();

        } else {
            throw new Error(responseData.error || 'Update failed');
        }
    })
    .catch(error => {
        console.error('❌ Update error:', error);
        showNotification(`Update failed: ${error.message}`, 'error');
    })
    .finally(() => {
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    });
}

// Comprehensive UI update function that handles both card and list views
function updateFileInUI(fileId, updatedFile) {
    console.log('Updating file in UI:', fileId, updatedFile);

    // Find the file container
    const fileElement = document.querySelector(`[data-file-id="${fileId}"]`);

    if (!fileElement) {
        console.error('Could not find file element with ID:', fileId);
        return;
    }

    // Update file names in both card and list views
    const nameElements = fileElement.querySelectorAll('.file-name, .row-name');
    nameElements.forEach(el => {
        if (el) {
            el.textContent = updatedFile.name;
            el.title = updatedFile.name; // Update tooltip
        }
    });

    // Update category badges in both views with proper class management
    const categoryElements = fileElement.querySelectorAll('.status-badge');
    categoryElements.forEach(el => {
        if (el) {
            // Remove all existing status classes
            el.className = el.className.replace(/status-\w+/g, '');
            // Add new status class and text
            el.classList.add(`status-${updatedFile.category}`);
            el.textContent = updatedFile.category.charAt(0).toUpperCase() + updatedFile.category.slice(1);
        }
    });

    // Update file icons to show proper colors based on file type
    const iconElements = fileElement.querySelectorAll('.file-icon');
    iconElements.forEach(iconEl => {
        if (iconEl) {
            // Determine file type from original filename
            const originalFile = window.FILES_DATA?.find(f => f.id === fileId);
            if (originalFile) {
                const fileType = get_file_type_from_name(originalFile.original_name);

                // Remove all existing file type classes
                iconEl.className = iconEl.className.replace(/file-icon-\w+/g, '');

                // Add the correct file type class for proper coloring
                iconEl.classList.add(`file-icon-${fileType}`);

                console.log('🎨 Updated icon class to:', `file-icon-${fileType}`);
            }
        }
    });

    // Update data attribute for filtering to work properly
    fileElement.dataset.category = updatedFile.category;

    // Update all preview elements that might have the file name in data attributes
    const previewElements = fileElement.querySelectorAll('[data-file-name]');
    previewElements.forEach(el => {
        el.dataset.fileName = updatedFile.name;
    });

    // Update window.FILES_DATA to keep everything in sync
    if (window.FILES_DATA) {
        const fileIndex = window.FILES_DATA.findIndex(f => f.id === fileId);
        if (fileIndex !== -1) {
            window.FILES_DATA[fileIndex].original_name = updatedFile.name;
            window.FILES_DATA[fileIndex].category = updatedFile.category;
            window.FILES_DATA[fileIndex].notes = updatedFile.notes;
        }
    }

    console.log('UI update completed successfully');
}

// Helper function to determine file type from filename
function get_file_type_from_name(filename) {
    if (!filename) return 'other';

    const ext = filename.split('.').pop().toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    if (['mov', 'mp4', 'avi', 'mkv', 'webm'].includes(ext)) return 'video';  // Added video detection
    if (ext === 'pdf') return 'pdf';
    if (['doc', 'docx'].includes(ext)) return 'document';
    if (['xls', 'xlsx'].includes(ext)) return 'spreadsheet';
    if (ext === 'txt') return 'text';
    if (ext === 'zip') return 'archive';

    return 'other';
}

function confirmDelete(fileId, fileName) {
    console.log('🗑️ Confirming delete for file with UUID:', fileId);

    // CRITICAL: Store the fileId BEFORE doing anything else
    currentDeleteFileId = fileId;

    // Populate the modal with file info
    const deleteFilenameElement = document.getElementById('delete-filename');
    if (deleteFilenameElement) {
        deleteFilenameElement.textContent = fileName;
    }

    // Show the delete confirmation modal
    const modal = document.getElementById('delete-modal');
    if (modal) {
        modal.classList.add('show');
        console.log('✅ Delete modal opened with fileId:', currentDeleteFileId);
    } else {
        console.error('❌ Delete modal not found');
        currentDeleteFileId = null;
    }
}

function executeDelete() {
    console.log('💥 executeDelete called. currentDeleteFileId:', currentDeleteFileId);

    if (!currentDeleteFileId) {
        console.error('❌ No currentDeleteFileId found!');
        showNotification('Error: No file selected for deletion', 'error');
        return;
    }

    const deleteBtn = document.getElementById('confirm-delete-btn');
    const originalText = deleteBtn.innerHTML;
    deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
    deleteBtn.disabled = true;

    console.log('🗑️ Deleting file with UUID:', currentDeleteFileId);

    // Store fileId in local variable before the async operation
    const fileIdToDelete = currentDeleteFileId;

    fetch(`/api/files/delete/${fileIdToDelete}`, {
        method: 'DELETE',
        credentials: 'same-origin'
    })
    .then(response => {
        console.log('📥 Delete response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('📥 Delete response data:', data);

        if (data.success) {
            showNotification('File deleted successfully', 'success');

            // Remove from UI using the stored fileId, not currentDeleteFileId
            const fileItem = document.querySelector(`[data-file-id="${fileIdToDelete}"]`);
            if (fileItem) {
                console.log('✅ Found file element, removing from UI');
                fileItem.style.opacity = '0';
                setTimeout(() => {
                    fileItem.remove();
                    console.log('✅ File element removed from DOM');
                }, 300);
            } else {
                console.error('❌ Could not find file element with ID:', fileIdToDelete);
            }

            // Remove from window data using the stored fileId
            if (window.FILES_DATA) {
                const originalLength = window.FILES_DATA.length;
                window.FILES_DATA = window.FILES_DATA.filter(f => f.id !== fileIdToDelete);
                console.log('📊 Removed from FILES_DATA. Count:', originalLength, '→', window.FILES_DATA.length);
            }

            // Clear and close AFTER successful deletion
            currentDeleteFileId = null;
            closeDeleteModal();

        } else {
            throw new Error(data.error || 'Delete failed');
        }
    })
    .catch(error => {
        console.error('❌ Delete error:', error);
        showNotification(`Delete failed: ${error.message}`, 'error');
    })
    .finally(() => {
        deleteBtn.innerHTML = originalText;
        deleteBtn.disabled = false;
    });
}

function viewFile(fileId, fileName, fileType, filename) {
    console.log('Viewing file with UUID:', fileId);

    const modal = document.getElementById('viewer-modal');
    const title = document.getElementById('viewer-title');
    const content = document.getElementById('viewer-content');
    const downloadBtn = document.getElementById('download-btn-viewer');

    title.innerHTML = `<i class="fas fa-eye"></i> ${fileName}`;
    content.innerHTML = '';

    // Use the physical filename for serving the file
    const fileUrl = `/static/uploads/files/${filename}`;

    if (fileType === 'image') {
        content.innerHTML = `<img src="${fileUrl}" alt="${fileName}" style="max-width: 100%; max-height: 100%; object-fit: contain;">`;
    } else if (fileType === 'video') {  // NEW: Video viewer
        content.innerHTML = `
            <video controls style="max-width: 100%; max-height: 100%; object-fit: contain;" preload="metadata">
                <source src="${fileUrl}" type="video/${filename.split('.').pop()}">
                Your browser does not support the video tag.
            </video>
        `;
    } else if (fileType === 'pdf') {
        content.innerHTML = `<iframe src="${fileUrl}" style="width: 100%; height: 100%; border: none;"></iframe>`;
    } else {
        content.innerHTML = `
            <div class="file-preview-placeholder">
                <i class="fas fa-file" style="font-size: 64px; color: #ccc; margin-bottom: 20px;"></i>
                <h3>Preview not available</h3>
                <p>Download the file to view its contents</p>
                <button class="btn btn-primary" onclick="downloadFile('${filename}', '${fileName}')">
                    <i class="fas fa-download"></i> Download
                </button>
            </div>
        `;
    }

    // Set up download button with physical filename
    downloadBtn.onclick = () => downloadFile(filename, fileName);
    modal.classList.add('show');
}

function downloadFile(filename, originalName) {
    const link = document.createElement('a');
    link.href = `/api/files/${filename}`;
    link.download = originalName || filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// =============================================================================
// MODAL HANDLING & FORM SUBMISSION
// =============================================================================

function setupModals() {
    // Set up event delegation for file actions
    setupFileEventDelegation();

    // Close modals when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            if (e.target.id === 'upload-modal') closeUploadModal();
            else if (e.target.id === 'edit-modal') closeEditModal();
            else if (e.target.id === 'viewer-modal') closeViewerModal();
            else if (e.target.id === 'delete-modal') closeDeleteModal();
        }
    });

    // Handle edit form submission
    const editForm = document.getElementById('edit-form');
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveFileEdit();
        });
    }

    // Escape key handling
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeUploadModal();
            closeEditModal();
            closeViewerModal();
            closeDeleteModal();
        }
    });

    console.log('Modal setup complete');
}

function setupFileEventDelegation() {
    // Set up event delegation for all file actions
    document.addEventListener('click', function(e) {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const action = target.dataset.action;

        switch (action) {
            case 'edit':
                const fileId = target.dataset.fileId;
                if (fileId) editFile(fileId);
                break;

            case 'delete':
                const deleteFileId = target.dataset.fileId;
                const fileName = target.dataset.fileName;
                if (deleteFileId && fileName) confirmDelete(deleteFileId, fileName);
                break;

            case 'download':
                const filename = target.dataset.filename;
                const originalName = target.dataset.originalName;
                if (filename && originalName) downloadFile(filename, originalName);
                break;

            case 'view':
                const viewFileId = target.dataset.fileId;
                const viewFileName = target.dataset.fileName;
                const fileType = target.dataset.fileType;
                const viewFilename = target.dataset.filename;
                if (viewFileId && viewFileName && fileType && viewFilename) {
                    viewFile(viewFileId, viewFileName, fileType, viewFilename);
                }
                break;
        }
    });
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'fa-file-image';
    if (['mov', 'mp4', 'avi', 'mkv', 'webm'].includes(ext)) return 'fa-file-video';  // NEW: Video icon
    if (ext === 'pdf') return 'fa-file-pdf';
    if (['doc', 'docx'].includes(ext)) return 'fa-file-word';
    if (['xls', 'xlsx'].includes(ext)) return 'fa-file-excel';
    if (ext === 'zip') return 'fa-file-archive';

    return 'fa-file';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    notification.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}