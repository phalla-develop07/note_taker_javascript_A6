'use strict';

// Application state
let notes = JSON.parse(localStorage.getItem('notes')) || [];
let folders = JSON.parse(localStorage.getItem('folders')) || ['Work', 'Personal', 'Ideas'];
let trashedFolders = JSON.parse(localStorage.getItem('trashedFolders')) || [];
let userProfile = JSON.parse(localStorage.getItem('userProfile')) || {
    name: 'Guest User',
    role: 'Note Taker',
    avatar: 'https://ui-avatars.com/api/?name=Guest&background=bb86fc&color=fff',
    bio: ''
};
let currentFolder = 'All';
let currentNoteId = null;

// Migrate old notes to have unique IDs
if (notes.length > 0 && !notes[0].id) {
    notes.forEach(note => {
        note.id = generateId();
    });
    saveData();
}

// Initialize Profile
updateSidebarProfile();

function generateId() {
    return `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Load saved background
const savedColor = localStorage.getItem('bgColor');
const savedImage = localStorage.getItem('bgImage');

if (savedColor) {
    document.body.style.backgroundColor = savedColor;
    document.getElementById('bgColorPicker').value = savedColor;
}
if (savedImage) {
    document.body.style.setProperty('--bg-image', `url("${savedImage}")`);
    document.getElementById('bgPreview').style.backgroundImage = `url("${savedImage}")`;
}

function saveData() {
    localStorage.setItem('notes', JSON.stringify(notes));
    localStorage.setItem('folders', JSON.stringify(folders));
    localStorage.setItem('trashedFolders', JSON.stringify(trashedFolders));
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
}

// Utility: escape HTML to prevent issues
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Profile Functions
function updateSidebarProfile() {
    document.getElementById('sidebarName').textContent = userProfile.name;
    document.getElementById('sidebarRole').textContent = userProfile.role;
    document.getElementById('sidebarAvatar').src = userProfile.avatar;
}

function openProfileModal() {
    document.getElementById('profileNameInput').value = userProfile.name;
    document.getElementById('profileRoleInput').value = userProfile.role;
    document.getElementById('profileAvatarInput').value = userProfile.avatar;
    document.getElementById('profileBioInput').value = userProfile.bio || '';
    updateAvatarPreview(userProfile.avatar);
    
    document.getElementById('profileModal').style.display = 'flex';
}

function closeProfileModal() {
    document.getElementById('profileModal').style.display = 'none';
}

function updateAvatarPreview(url) {
    const preview = document.getElementById('profilePreviewAvatar');
    if (url && url.trim() !== '') {
        preview.src = url;
        preview.onerror = function() {
            this.src = 'https://ui-avatars.com/api/?name=Error&background=e74c3c&color=fff';
        };
    } else {
        preview.src = 'https://ui-avatars.com/api/?name=Guest&background=bb86fc&color=fff';
    }
}

function saveProfile() {
    const name = document.getElementById('profileNameInput').value.trim() || 'Guest User';
    const role = document.getElementById('profileRoleInput').value.trim() || 'Note Taker';
    let avatar = document.getElementById('profileAvatarInput').value.trim();
    const bio = document.getElementById('profileBioInput').value.trim();

    if (!avatar) {
        avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=bb86fc&color=fff`;
    }

    userProfile = { name, role, avatar, bio };
    saveData();
    updateSidebarProfile();
    closeProfileModal();
}

// Settings Functions
function openSettings() {
    document.getElementById('settingsModal').style.display = 'flex';
    document.getElementById('bgPreview').style.backgroundImage = savedImage ? `url("${savedImage}")` : 'none';
}

function closeSettings() {
    document.getElementById('settingsModal').style.display = 'none';
}

function applyBackground() {
    const color = document.getElementById('bgColorPicker').value;
    let image = '';

    const fileInput = document.getElementById('bgImageUpload');
    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            image = e.target.result;
            finishApply(color, image);
        };
        reader.readAsDataURL(fileInput.files[0]);
        return;
    }

    const urlInput = document.getElementById('bgImageURL').value.trim();
    if (urlInput) image = urlInput;

    finishApply(color, image);
}

function finishApply(color, image) {
    document.body.style.backgroundColor = color;
    if (image) {
        document.body.style.setProperty('--bg-image', `url("${image}")`);
        document.getElementById('bgPreview').style.backgroundImage = `url("${image}")`;
    } else {
        document.body.style.removeProperty('--bg-image');
        document.getElementById('bgPreview').style.backgroundImage = 'none';
    }

    localStorage.setItem('bgColor', color);
    if (image) localStorage.setItem('bgImage', image);
    else localStorage.removeItem('bgImage');

    closeSettings();
}

function resetBackground() {
    if (confirm('Reset to default dark background?')) {
        document.body.style.backgroundColor = '#121212';
        document.body.style.removeProperty('--bg-image');
        localStorage.removeItem('bgColor');
        localStorage.removeItem('bgImage');
        document.getElementById('bgColorPicker').value = '#121212';
        document.getElementById('bgPreview').style.backgroundImage = 'none';
        document.getElementById('bgImageURL').value = '';
        document.getElementById('bgImageUpload').value = '';
    }
}

// Folder Functions
function updateFoldersList() {
    const list = document.getElementById('foldersList');
    list.innerHTML = '';

    folders.forEach(f => {
        const li = document.createElement('li');
        li.className = 'folder-item';
        li.dataset.folder = f;
        li.innerHTML = `
            <span class="folder-name" onclick="selectFolder('${f}')">#${f}</span>
            <div class="folder-actions">
                <button class="folder-action-btn" onclick="event.stopPropagation(); editFolder('${f}')">✏️</button>
                <button class="folder-action-btn delete-folder-btn" onclick="event.stopPropagation(); moveFolderToTrash('${f}')">🗑</button>
            </div>
        `;
        list.appendChild(li);
    });

    const add = document.createElement('li');
    add.className = 'folder-item add-folder';
    add.textContent = '+ Add New Folder';
    add.onclick = () => {
        let name = prompt('New folder name:');
        name = name?.trim();
        if (name && !folders.includes(name) && !trashedFolders.includes(name)) {
            folders.push(name);
            saveData();
            updateFoldersList();
            selectFolder(name);
        }
    };
    list.appendChild(add);
}

function selectFolder(name) {
    currentFolder = name;

    // Update active state
    document.querySelectorAll('.folder-item').forEach(el => el.classList.remove('active'));
    const activeEl = document.querySelector(`.folder-item[data-folder="${name}"]`);
    if (activeEl) activeEl.classList.add('active');

    // Trash view controls
    const trashActionsEl = document.getElementById('trashActions');
    const trashedFoldersSectionEl = document.getElementById('trashedFoldersSection');
    if (name === 'Trash') {
        trashActionsEl.classList.remove('hidden-section');
        trashedFoldersSectionEl.classList.remove('hidden-section');
    } else {
        trashActionsEl.classList.add('hidden-section');
        trashedFoldersSectionEl.classList.add('hidden-section');
    }

    updateTrashedFoldersList();
    displayNotes();
}

function editFolder(oldName) {
    let newName = prompt('Rename folder to:', oldName);
    newName = newName?.trim();
    if (newName && newName !== oldName && !folders.includes(newName) && !trashedFolders.includes(newName)) {
        folders = folders.map(f => f === oldName ? newName : f);
        notes.forEach(note => {
            if (note.folder === oldName) note.folder = newName;
        });
        saveData();
        updateFoldersList();
        displayNotes();
    }
}

function moveFolderToTrash(folderName) {
    if (confirm(`Delete folder "#${folderName}"? Notes will go to Trash, but you can restore the folder later.`)) {
        trashedFolders.push(folderName);
        notes.forEach(note => {
            if (note.folder === folderName) {
                note.originalFolder = folderName;
                note.folder = 'Trash';
            }
        });
        folders = folders.filter(f => f !== folderName);
        if (currentFolder === folderName) currentFolder = 'All';
        saveData();
        updateFoldersList();
        updateTrashedFoldersList();
        displayNotes();
    }
}

function restoreFolder(folderName) {
    if (confirm(`Restore folder "#${folderName}"? All its original notes will return too.`)) {
        folders.push(folderName);
        trashedFolders = trashedFolders.filter(f => f !== folderName);
        notes.forEach(note => {
            if (note.originalFolder === folderName) {
                note.folder = folderName;
                delete note.originalFolder;
            }
        });
        saveData();
        updateFoldersList();
        updateTrashedFoldersList();
        displayNotes();
    }
}

function updateTrashedFoldersList() {
    const list = document.getElementById('trashedFoldersList');
    list.innerHTML = trashedFolders.length === 0
        ? '<p style="color:#777; font-style:italic;">No trashed folders</p>'
        : trashedFolders.map(f => `
            <div class="trashed-folder">
                <span>#${f} (deleted)</span>
                <button class="restore-folder-btn" onclick="restoreFolder('${f}')">Restore Folder</button>
            </div>
        `).join('');
}

function format(command, value = null) {
    document.execCommand(command, false, value);
    document.getElementById('noteEditor').focus();
}

function insertLink() {
    let url = prompt('Enter URL:');
    if (url) document.execCommand('createLink', false, url);
}

function insertImageURL() {
    let url = prompt('Enter image URL:');
    if (url) insertResizableImage(url);
}

function insertResizableImage(src) {
    const wrapper = document.createElement('div');
    wrapper.className = 'image-wrapper';
    wrapper.innerHTML = `
        <div class="image-resize-toolbar">
            <button class="resize-btn" onclick="resizeImage(this, 'small')">Small</button>
            <button class="resize-btn active" onclick="resizeImage(this, 'medium')">Medium</button>
            <button class="resize-btn" onclick="resizeImage(this, 'large')">Large</button>
            <button class="resize-btn" onclick="resizeImage(this, 'full')">Full</button>
        </div>
        <img src="${src}" style="width: 70%; max-width: 100%; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.4);">
    `;
    const editor = document.getElementById('noteEditor');
    editor.appendChild(wrapper);
    const p = document.createElement('p');
    p.innerHTML = '<br>';
    editor.appendChild(p);
    editor.focus();
}

window.resizeImage = function (btn, size) {
    const wrapper = btn.closest('.image-wrapper');
    const img = wrapper.querySelector('img');
    const buttons = wrapper.querySelectorAll('.resize-btn');
    buttons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    let width = '70%';
    if (size === 'small') width = '40%';
    else if (size === 'medium') width = '70%';
    else if (size === 'large') width = '90%';
    else if (size === 'full') width = '100%';
    img.style.width = width;
}

function handleFileUpload(input) {
    if (!input.files) return;
    Array.from(input.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function (e) {
            if (file.type.startsWith('image/')) {
                insertResizableImage(e.target.result);
            } else {
                const attachment = document.createElement('div');
                attachment.className = 'file-attachment';
                attachment.innerHTML = `📄 <a href="${e.target.result}" download="${file.name}">${file.name}</a>`;
                const editor = document.getElementById('noteEditor');
                editor.appendChild(attachment);
                const p = document.createElement('p');
                p.innerHTML = '<br>';
                editor.appendChild(p);
            }
        };
        reader.readAsDataURL(file);
    });
    input.value = '';
}

function openNoteModal(noteId = null) {
    currentNoteId = noteId;

    const note = noteId ? notes.find(n => n.id === noteId) : null;

    document.getElementById('noteTitle').value = note ? note.title || '' : '';
    document.getElementById('noteEditor').innerHTML = note ? note.content || '<p><br></p>' : '<p><br></p>';
    document.getElementById('noteDueDate').value = note ? (note.dueDate || '') : '';

    const folderSelect = document.getElementById('noteFolder');
    folderSelect.innerHTML = '';
    folders.forEach(f => {
        folderSelect.innerHTML += `<option value="${f}">#${f}</option>`;
    });

    const defaultFolder = note ? note.folder : (folders.length ? folders[0] : 'General');
    folderSelect.value = defaultFolder;

    // Create General folder if none exist and creating new note
    if (!folders.length && !note) {
        folders.push('General');
        saveData();
        updateFoldersList();
        folderSelect.innerHTML = '<option value="General">#General</option>';
        folderSelect.value = 'General';
    }

    document.getElementById('noteModal').style.display = 'flex';
    document.getElementById('fullscreenBtn').textContent = '⛶';
    setTimeout(() => document.getElementById('noteTitle').focus(), 100);
}

function closeNoteModal() {
    if (document.fullscreenElement) {
        document.exitFullscreen();
    }
    document.getElementById('noteModal').style.display = 'none';
}

function saveNote() {
    const title = document.getElementById('noteTitle').value.trim() || 'Untitled Note';
    const content = document.getElementById('noteEditor').innerHTML;
    const folder = document.getElementById('noteFolder').value || 'General';
    const dueDate = document.getElementById('noteDueDate').value || null;

    if (!content.trim() || content === '<p><br></p>' || content === '<br>') {
        alert('Please write something in your note!');
        return;
    }

    const noteId = currentNoteId || generateId();
    const noteData = {
        id: noteId,
        title,
        content,
        folder,
        dueDate,
        date: new Date().toISOString()  // creation / last modified
    };

    if (currentNoteId) {
        const note = notes.find(n => n.id === currentNoteId);
        if (note) Object.assign(note, noteData);
    } else {
        notes.push(noteData);
    }

    saveData();
    closeNoteModal();
    displayNotes();
}

function toggleFullScreen() {
    const modal = document.getElementById('noteModal');
    if (!document.fullscreenElement) {
        modal.requestFullscreen().catch(err => {
            alert(`Error attempting to enable full-screen mode: ${err.message}`);
        });
        modal.classList.add('fullscreen');
        document.getElementById('fullscreenBtn').textContent = '❎'; // Exit icon
    } else {
        document.exitFullscreen();
        modal.classList.remove('fullscreen');
        document.getElementById('fullscreenBtn').textContent = '⛶';
    }
}

function moveToTrash(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (note && confirm('Move this note to Trash?')) {
        note.folder = 'Trash';
        saveData();
        displayNotes();
    }
}

function restoreNote(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (note) {
        const targetFolder = folders.length ? folders[0] : 'General';
        note.folder = targetFolder;

        if (!folders.length) {
            folders.push('General');
            saveData();
            updateFoldersList();
        }

        saveData();
        displayNotes();
    }
}

function permanentlyDelete(noteId) {
    if (confirm('Permanently delete this note? This cannot be undone.')) {
        notes = notes.filter(n => n.id !== noteId);
        saveData();
        displayNotes();
    }
}

function emptyTrash() {
    if (confirm('Empty Trash? All notes and trashed folders will be permanently deleted.')) {
        notes = notes.filter(note => note.folder !== 'Trash');
        trashedFolders = [];
        saveData();
        updateTrashedFoldersList();
        displayNotes();
    }
}

function displayNotes() {
    const grid = document.getElementById('notesGrid');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    grid.innerHTML = '';

    const isTrashView = currentFolder === 'Trash';

    let filtered = notes.filter(note => {
        const matchesFolder = (currentFolder === 'All' && note.folder !== 'Trash') || note.folder === currentFolder;
        const matchesSearch = searchTerm === '' ||
            (note.title && note.title.toLowerCase().includes(searchTerm)) ||
            note.content.replace(/<[^>]*>/g, ' ').toLowerCase().includes(searchTerm) ||
            note.folder.toLowerCase().includes(searchTerm);

        return matchesFolder && matchesSearch;
    });

    // Smart sort: due dates first (overdue → today → future), then no due (newest first)
    filtered.sort((a, b) => {
        const aDue = a.dueDate ? new Date(a.dueDate) : null;
        const bDue = b.dueDate ? new Date(b.dueDate) : null;

        if (aDue && bDue) return aDue - bDue;
        if (aDue) return -1;
        if (bDue) return 1;
        return new Date(b.date) - new Date(a.date);
    });

    filtered.forEach(note => {
        const noteId = note.id;
        const titleEsc = escapeHtml(note.title || 'Untitled Note');
        const folderEsc = escapeHtml(note.folder);
        const createdStr = new Date(note.date).toLocaleDateString();

        // Due date display logic
        let dueText = '';
        let dueStyle = '';
        let cardOverdueClass = '';
        if (note.dueDate) {
            const due = new Date(note.dueDate);
            due.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const formatted = due.toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });

            if (due < today) {
                dueText = `Overdue (${formatted})`;
                dueStyle = 'overdue';
                cardOverdueClass = 'overdue';
            } else if (due.getTime() === today.getTime()) {
                dueText = 'Due today';
                dueStyle = 'today';
            } else {
                dueText = `Due ${formatted}`;
                dueStyle = 'upcoming';
            }
        }

        grid.innerHTML += `
            <div class="note-card ${cardOverdueClass}" onclick="${isTrashView ? '' : `openNoteModal('${noteId}')`}">
                <h3>${titleEsc}</h3>
                <div class="note-preview">${note.content}</div>
                <div class="note-footer">
                    <div class="note-meta">
                        <span class="folder-tag">#${folderEsc}</span>
                        <span class="note-date">${createdStr}</span>
                        ${dueText ? `<span class="due-date ${dueStyle}">${dueText}</span>` : ''}
                    </div>
                    <div>
                        ${isTrashView ?
                            `<button class="restore-btn" onclick="event.stopPropagation(); restoreNote('${noteId}')">Restore</button>
                             <button class="delete-btn" onclick="event.stopPropagation(); permanentlyDelete('${noteId}')">Delete Forever</button>` :
                            `<button class="delete-btn" onclick="event.stopPropagation(); moveToTrash('${noteId}')">Move to Trash</button>`
                        }
                    </div>
                </div>
            </div>
        `;
    });

    if (!isTrashView) {
        grid.innerHTML += `
            <div class="note-card create-card" onclick="openNoteModal()">
                <h2 class="create-card-content">+</h2>
                <p class="create-card-text">Create New Note</p>
            </div>
        `;
    }
}

// Initial setup
updateFoldersList();
updateTrashedFoldersList();
displayNotes();
selectFolder('All'); // Ensure correct active state on load

// Global shortcuts & clicks
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        if (document.getElementById('noteModal').style.display === 'flex') closeNoteModal();
        if (document.getElementById('settingsModal').style.display === 'flex') closeSettings();
        if (document.getElementById('profileModal').style.display === 'flex') closeProfileModal();
    }
});

window.onclick = e => {
    if (e.target === document.getElementById('noteModal')) closeNoteModal();
    if (e.target === document.getElementById('settingsModal')) closeSettings();
    if (e.target === document.getElementById('profileModal')) closeProfileModal();
};

// Full screen change listener to update button
document.addEventListener('fullscreenchange', () => {
    const btn = document.getElementById('fullscreenBtn');
    if (document.fullscreenElement) {
        btn.textContent = '❎';
    } else {
        btn.textContent = '⛶';
        document.getElementById('noteModal').classList.remove('fullscreen');
    }
});
