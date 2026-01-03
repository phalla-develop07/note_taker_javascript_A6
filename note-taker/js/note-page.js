// Data
let folders = [];
let notes = [];
let trash = { folders: [], notes: [] };
let currentNoteId = null;
let currentFolderId = 'all';
let currentTab = 'all';
let backgroundType = 'color';
let backgroundValue = '#ffffff';

const STORAGE_KEY = 'notesDashboardData_v2';

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function stripHTML(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
}

function getFirstImageSrc(content) {
    const div = document.createElement('div');
    div.innerHTML = content;
    const img = div.querySelector('img');
    return img ? img.src : null;
}

// === LocalStorage Functions ===
function saveToLocalStorage() {
    const data = {
        folders,
        notes,
        trash,
        backgroundType,
        backgroundValue,
        version: 2
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadFromLocalStorage() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;

    try {
        const data = JSON.parse(raw);

        if (data.version !== 2) {
            return false;
        }

        folders = data.folders || [];
        notes = data.notes || [];
        trash = data.trash || { folders: [], notes: [] };
        backgroundType = data.backgroundType || 'color';
        backgroundValue = data.backgroundValue || '#ffffff';

        if (backgroundType === 'color') {
            document.body.style.backgroundImage = 'none';
            document.body.style.backgroundColor = backgroundValue;
        } else if (backgroundType === 'image' && backgroundValue) {
            document.body.style.backgroundImage = `url("${backgroundValue}")`;
            document.body.style.backgroundColor = '#f0f0f0';
        }

        return true;
    } catch (e) {
        console.error('Failed to load data from localStorage', e);
        return false;
    }
}

loadFromLocalStorage();

function autoSave() {
    saveToLocalStorage();
    renderFolders();
    renderFolderNav();
    renderNotes();
}

// === Rendering functions ===

function renderFolders() {
    const foldersSection = document.getElementById('folders-section');
    if (currentFolderId === 'trash') {
        foldersSection.style.display = 'none';
        return;
    }
    foldersSection.style.display = 'block';

    const folderList = document.getElementById('folder-list');
    folderList.innerHTML = '';

    const keyword = document.getElementById('search-input').value.trim().toLowerCase();

    let visibleFolders = folders;
    if (keyword) {
        visibleFolders = folders.filter(folder =>
            folder.name.toLowerCase().includes(keyword) ||
            folder.tags.some(t => t.toLowerCase().includes(keyword))
        );
    }

    visibleFolders.forEach(folder => {
        const card = document.createElement('div');
        card.className = 'folder-card';
        card.innerHTML = `
                    <div class="icon">📁</div>
                    <h3>${folder.name}</h3>
                    <div class="tags">${folder.tags.join(' • ') || 'No tags'}</div>
                    <div class="folder-card-actions">
                        <button title="Edit" data-id="${folder.id}">✏️</button>
                        <button title="Delete" data-id="${folder.id}">🗑️</button>
                    </div>
                `;
        card.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            selectFolder(folder.id);
        });
        card.querySelector('button[title="Edit"]').addEventListener('click', (e) => {
            e.stopPropagation();
            editFolder(folder.id);
        });
        card.querySelector('button[title="Delete"]').addEventListener('click', (e) => {
            e.stopPropagation();
            moveFolderToTrash(folder.id);
        });
        folderList.appendChild(card);
    });

    document.querySelector('.folders .count').textContent = `${visibleFolders.length.toString().padStart(2, '0')} Folders`;
}

function renderFolderNav() {
    const navList = document.getElementById('folder-nav-list');
    navList.innerHTML = '';

    const allLi = document.createElement('li');
    allLi.className = currentFolderId === 'all' ? 'active' : '';
    allLi.dataset.folderId = 'all';
    allLi.innerHTML = `<span>📋</span> All Notes`;
    allLi.addEventListener('click', () => selectFolder('all'));
    navList.appendChild(allLi);

    folders.forEach(folder => {
        const li = document.createElement('li');
        li.innerHTML = `
                    <span>📁</span> ${folder.name}
                    <div class="folder-actions">
                        <button title="Edit" data-id="${folder.id}">✏️</button>
                        <button title="Delete" data-id="${folder.id}">🗑️</button>
                    </div>
                `;
        li.dataset.folderId = folder.id;
        if (folder.id === currentFolderId) li.classList.add('active');
        li.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            selectFolder(folder.id);
        });
        li.querySelector('button[title="Edit"]').addEventListener('click', (e) => {
            e.stopPropagation();
            editFolder(folder.id);
        });
        li.querySelector('button[title="Delete"]').addEventListener('click', (e) => {
            e.stopPropagation();
            moveFolderToTrash(folder.id);
        });
        navList.appendChild(li);
    });

    const trashLi = document.createElement('li');
    trashLi.innerHTML = `<span>🗑️</span> Trash`;
    trashLi.dataset.folderId = 'trash';
    if (currentFolderId === 'trash') trashLi.classList.add('active');
    trashLi.addEventListener('click', () => selectFolder('trash'));
    navList.appendChild(trashLi);
}

function selectFolder(folderId) {
    currentFolderId = folderId;
    document.querySelectorAll('#folder-nav-list li').forEach(li => li.classList.remove('active'));
    const target = document.querySelector(`#folder-nav-list li[data-folder-id="${folderId}"]`);
    if (target) target.classList.add('active');
    renderFolders();
    renderNotes();
}

function getBaseNotes() {
    return currentFolderId === 'trash' ? trash.notes : notes;
}

function getVisibleNotes() {
    let baseNotes = getBaseNotes();

    if (currentFolderId !== 'all' && currentFolderId !== 'trash') {
        baseNotes = baseNotes.filter(n => n.folderId === currentFolderId);
    }

    if (currentTab === 'pinned') {
        baseNotes = baseNotes.filter(n => n.pinned);
    }

    return baseNotes;
}

function renderNotes() {
    const noteGrid = document.getElementById('note-grid');
    noteGrid.innerHTML = '';

    const keyword = document.getElementById('search-input').value.trim().toLowerCase();
    const searchInfo = document.getElementById('search-info');

    let visibleNotes = getVisibleNotes();

    if (keyword) {
        visibleNotes = visibleNotes.filter(note =>
            (note.title || '').toLowerCase().includes(keyword) ||
            stripHTML(note.content || '').toLowerCase().includes(keyword)
        );
    }

    if (keyword) {
        const folderMatches = folders.filter(f =>
            f.name.toLowerCase().includes(keyword) ||
            f.tags.some(t => t.toLowerCase().includes(keyword))
        ).length;

        const totalMatches = visibleNotes.length + folderMatches;
        searchInfo.textContent = `Search results for "${keyword}" – ${totalMatches} item${totalMatches !== 1 ? 's' : ''} found`;
        searchInfo.style.display = 'block';
    } else {
        searchInfo.style.display = 'none';
    }

    if (currentFolderId === 'trash') {
        visibleNotes.forEach(note => {
            const card = document.createElement('div');
            card.className = 'note-card';
            const preview = stripHTML(note.content || '').substring(0, 120) + (stripHTML(note.content || '').length > 120 ? '...' : '');
            card.innerHTML = `
                        <div class="title">[Trashed] ${note.title || 'Untitled Note'}</div>
                        <div class="preview">${preview || 'No content yet'}</div>
                    `;
            const actions = document.createElement('div');
            actions.className = 'trash-actions';
            actions.innerHTML = `
                        <button data-restore="${note.id}">Restore</button>
                        <button data-delete="${note.id}">Delete Forever</button>
                    `;
            card.appendChild(actions);
            noteGrid.appendChild(card);
        });

        trash.folders.forEach(folder => {
            if (keyword && !(folder.name.toLowerCase().includes(keyword) || folder.tags.some(t => t.toLowerCase().includes(keyword)))) return;
            const card = document.createElement('div');
            card.className = 'note-card';
            card.innerHTML = `
                        <div class="title">[Trashed Folder] ${folder.name}</div>
                        <div class="preview">All notes from this folder are also in trash</div>
                    `;
            const actions = document.createElement('div');
            actions.className = 'trash-actions';
            actions.innerHTML = `
                        <button data-restore-folder="${folder.id}">Restore Folder</button>
                        <button data-delete-folder="${folder.id}">Delete Forever</button>
                    `;
            card.appendChild(actions);
            noteGrid.appendChild(card);
        });

        document.getElementById('total-notes').textContent = `Trash: ${trash.notes.length} notes, ${trash.folders.length} folders`;
    } else {
        visibleNotes.forEach(note => {
            const card = document.createElement('div');
            card.className = 'note-card';

            const textPreview = stripHTML(note.content || '').substring(0, 100) + (stripHTML(note.content || '').length > 100 ? '...' : '') || 'No content yet';

            const firstImg = getFirstImageSrc(note.content || '');

            let previewHTML = '';
            if (firstImg) {
                previewHTML += `<img class="thumbnail" src="${firstImg}" alt="Note image">`;
            }
            previewHTML += `
                        <div class="title">${note.title || 'Untitled Note'}</div>
                        <div class="preview">${textPreview}</div>
                        <div class="pin ${note.pinned ? 'pinned' : ''}" data-id="${note.id}">❤️</div>
                    `;

            card.innerHTML = previewHTML;

            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('pin')) return;
                openEditor(note.id);
            });
            noteGrid.appendChild(card);
        });

        document.getElementById('total-notes').textContent =
            keyword
                ? `Showing ${visibleNotes.length} matching note${visibleNotes.length !== 1 ? 's' : ''}`
                : `Total Notes: ${notes.length} | Showing: ${visibleNotes.length}`;
    }
}

// === Rest of functions unchanged ===
function moveFolderToTrash(folderId) {
    const folderIndex = folders.findIndex(f => f.id === folderId);
    if (folderIndex === -1) return;
    if (!confirm(`Move folder "${folders[folderIndex].name}" to Trash?`)) return;
    const folder = folders.splice(folderIndex, 1)[0];
    trash.folders.push(folder);
    const folderNotes = notes.filter(n => n.folderId === folderId);
    folderNotes.forEach(note => moveNoteToTrash(note.id, true));
    if (currentFolderId === folderId) currentFolderId = 'all';
    autoSave();
}

function moveNoteToTrash(noteId, skipConfirm = false) {
    const noteIndex = notes.findIndex(n => n.id === noteId);
    if (noteIndex === -1) return;
    if (!skipConfirm && !confirm('Move this note to Trash?')) return;
    const note = notes.splice(noteIndex, 1)[0];
    trash.notes.push(note);
    autoSave();
}

function restoreFolder(folderId) {
    const index = trash.folders.findIndex(f => f.id === folderId);
    if (index === -1) return;
    const folder = trash.folders.splice(index, 1)[0];
    folders.push(folder);
    autoSave();
}

function restoreNote(noteId) {
    const index = trash.notes.findIndex(n => n.id === noteId);
    if (index === -1) return;
    const note = trash.notes.splice(index, 1)[0];
    notes.push(note);
    autoSave();
}

function permanentlyDeleteFolder(folderId) {
    trash.folders = trash.folders.filter(f => f.id !== folderId);
    autoSave();
}

function permanentlyDeleteNote(noteId) {
    trash.notes = trash.notes.filter(n => n.id !== noteId);
    autoSave();
}

function editFolder(folderId) {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;
    const newName = prompt('Edit folder name:', folder.name);
    if (newName === null) return;
    if (!newName.trim()) {
        alert('Folder name cannot be empty!');
        return;
    }
    const tagsInput = prompt('Edit tags (comma-separated, optional):', folder.tags.join(', '));
    const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];
    folder.name = newName.trim();
    folder.tags = tags;
    autoSave();
}

function openEditor(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    currentNoteId = noteId;
    document.getElementById('editor-title-input').value = note.title || '';
    document.getElementById('editor-content').innerHTML = note.content || '';
    document.getElementById('editor-modal').style.display = 'flex';
    document.getElementById('save-status').style.opacity = '0';
    document.getElementById('editor-title-input').focus();
}

function saveCurrentNote() {
    if (!currentNoteId) return;
    const note = notes.find(n => n.id === currentNoteId);
    const newTitle = document.getElementById('editor-title-input').value.trim();
    note.title = newTitle || 'Untitled Note';
    note.content = document.getElementById('editor-content').innerHTML;
    const status = document.getElementById('save-status');
    status.style.opacity = '1';
    setTimeout(() => status.style.opacity = '0', 2000);
    autoSave();
}

function deleteCurrentNote() {
    if (!currentNoteId) return;
    moveNoteToTrash(currentNoteId);
    closeEditor();
}

function closeEditor() {
    document.getElementById('editor-modal').style.display = 'none';
    currentNoteId = null;
    if (currentNoteId) saveCurrentNote();
}

function createNewFolder() {
    const name = prompt('Enter folder name:');
    if (!name?.trim()) return;
    const tagsInput = prompt('Enter tags (comma-separated, optional):') || '';
    const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t);
    const folder = {
        id: generateId(),
        name: name.trim(),
        tags
    };
    folders.push(folder);
    autoSave();
}

function createNewNote() {
    const folderId = (currentFolderId !== 'all' && currentFolderId !== 'trash') ? currentFolderId : null;
    const note = {
        id: generateId(),
        title: 'New Note',
        content: '<p>Start writing your note here...</p>',
        pinned: false,
        folderId: folderId
    };
    notes.push(note);
    autoSave();
    openEditor(note.id);
}

// === Editor Toolbar ===
document.querySelectorAll('.toolbar button[data-command]').forEach(btn => {
    btn.addEventListener('click', () => {
        document.execCommand(btn.dataset.command, false);
        document.getElementById('editor-content').focus();
    });
});

document.getElementById('font-size-select').addEventListener('change', (e) => {
    document.execCommand('fontSize', false, e.target.value);
    document.getElementById('editor-content').focus();
});

document.getElementById('font-family-select').addEventListener('change', (e) => {
    document.execCommand('fontName', false, e.target.value);
    document.getElementById('editor-content').focus();
});

document.getElementById('text-color-btn').addEventListener('click', () => {
    document.getElementById('text-color-picker').click();
});
document.getElementById('text-color-picker').addEventListener('input', (e) => {
    document.execCommand('foreColor', false, e.target.value);
});

document.getElementById('highlight-btn').addEventListener('click', () => {
    document.getElementById('highlight-picker').click();
});
document.getElementById('highlight-picker').addEventListener('input', (e) => {
    document.execCommand('backColor', false, e.target.value);
});

document.getElementById('clear-format').addEventListener('click', () => {
    document.execCommand('removeFormat', false);
    document.getElementById('editor-content').focus();
});

// === Insert Media ===
const insertMediaBtn = document.getElementById('insert-media');
const insertMediaModal = document.getElementById('insert-media-modal');
const mediaTabs = document.querySelectorAll('.media-tab');
const mediaFileInput = document.getElementById('media-file-input');
const mediaUrlInput = document.getElementById('media-url-input');
const insertMediaConfirm = document.getElementById('insert-media-btn');
const cancelMedia = document.getElementById('cancel-media-btn');

insertMediaBtn.addEventListener('click', () => {
    insertMediaModal.style.display = 'flex';
    mediaFileInput.value = '';
    mediaUrlInput.value = '';
});

mediaTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        mediaTabs.forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.media-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.panel + '-panel').classList.add('active');
    });
});

cancelMedia.addEventListener('click', () => insertMediaModal.style.display = 'none');

insertMediaConfirm.addEventListener('click', () => {
    const editor = document.getElementById('editor-content');
    let htmlToInsert = '';

    if (document.querySelector('.media-tab.active').dataset.panel === 'upload') {
        const file = mediaFileInput.files[0];
        if (!file) return alert('Please select a file.');
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            const fileName = file.name;
            if (file.type.startsWith('image/')) {
                htmlToInsert = `<img src="${dataUrl}" alt="${fileName}">`;
            } else {
                htmlToInsert = `<a href="${dataUrl}" download="${fileName}">${fileName}</a>`;
            }
            insertAndSave(htmlToInsert);
        };
        reader.readAsDataURL(file);
    } else {
        const url = mediaUrlInput.value.trim();
        if (!url) return alert('Please enter a valid URL.');
        if (/\.(jpe?g|png|gif|webp|svg)$/i.test(url)) {
            htmlToInsert = `<img src="${url}" alt="Inserted image">`;
        } else {
            const fileName = url.split('/').pop() || 'file';
            htmlToInsert = `<a href="${url}" target="_blank">${fileName}</a>`;
        }
        insertAndSave(htmlToInsert);
    }

    function insertAndSave(html) {
        editor.focus();
        document.execCommand('insertHTML', false, html + '<p><br></p>');
        insertMediaModal.style.display = 'none';
        saveCurrentNote();
    }
});

insertMediaModal.addEventListener('click', (e) => {
    if (e.target === insertMediaModal) insertMediaModal.style.display = 'none';
});

// === Background Settings ===
const bgModal = document.getElementById('bg-modal');
const bgSettingsBtn = document.getElementById('bg-settings-btn');
const colorPicker = document.getElementById('color-picker');
const imageUpload = document.getElementById('image-upload');
const imagePreview = document.getElementById('image-preview');
const bgOptions = document.querySelectorAll('.bg-option');
const applyBg = document.getElementById('apply-bg');
const cancelBg = document.getElementById('cancel-bg');

bgSettingsBtn.addEventListener('click', () => {
    bgModal.style.display = 'flex';
    bgOptions.forEach(o => o.classList.remove('active'));
    document.querySelector(`[data-type="${backgroundType}"]`).classList.add('active');
    if (backgroundType === 'color') {
        colorPicker.value = backgroundValue;
    }
});

bgOptions.forEach(opt => {
    opt.addEventListener('click', () => {
        bgOptions.forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        backgroundType = opt.dataset.type;
    });
});

imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            imagePreview.src = ev.target.result;
            imagePreview.style.display = 'block';
            backgroundValue = ev.target.result;
        };
        reader.readAsDataURL(file);
    }
});

applyBg.addEventListener('click', () => {
    if (backgroundType === 'color') {
        backgroundValue = colorPicker.value;
        document.body.style.backgroundImage = 'none';
        document.body.style.backgroundColor = backgroundValue;
    } else if (backgroundType === 'image' && backgroundValue) {
        document.body.style.backgroundImage = `url("${backgroundValue}")`;
        document.body.style.backgroundColor = '#f0f0f0';
    }
    saveToLocalStorage();
    bgModal.style.display = 'none';
});

cancelBg.addEventListener('click', () => bgModal.style.display = 'none');
bgModal.addEventListener('click', (e) => {
    if (e.target === bgModal) bgModal.style.display = 'none';
});

// === Event Listeners ===
document.getElementById('new-folder').addEventListener('click', createNewFolder);
document.getElementById('new-note').addEventListener('click', createNewNote);
document.getElementById('save-note').addEventListener('click', saveCurrentNote);
document.getElementById('delete-note').addEventListener('click', deleteCurrentNote);
document.getElementById('close-editor').addEventListener('click', closeEditor);

document.getElementById('tab-all').addEventListener('click', () => {
    currentTab = 'all';
    document.getElementById('tab-all').classList.add('active');
    document.getElementById('tab-pinned').classList.remove('active');
    renderNotes();
});

document.getElementById('tab-pinned').addEventListener('click', () => {
    currentTab = 'pinned';
    document.getElementById('tab-pinned').classList.add('active');
    document.getElementById('tab-all').classList.remove('active');
    renderNotes();
});

document.getElementById('note-grid').addEventListener('click', (e) => {
    if (e.target.matches('.pin')) {
        const id = e.target.dataset.id;
        const note = notes.find(n => n.id === id);
        if (note) {
            note.pinned = !note.pinned;
            e.target.classList.toggle('pinned');
            autoSave();
        }
    } else if (e.target.matches('[data-restore]')) {
        restoreNote(e.target.dataset.restore);
    } else if (e.target.matches('[data-delete]')) {
        if (confirm('Permanently delete this note?')) {
            permanentlyDeleteNote(e.target.dataset.delete);
        }
    } else if (e.target.matches('[data-restore-folder]')) {
        restoreFolder(e.target.dataset.restoreFolder);
    } else if (e.target.matches('[data-delete-folder]')) {
        if (confirm('Permanently delete this folder and its notes?')) {
            permanentlyDeleteFolder(e.target.dataset.deleteFolder);
        }
    }
});

document.getElementById('search-input').addEventListener('input', () => {
    renderFolders();
    renderNotes();
});

// Auto-save on editor changes
document.getElementById('editor-content').addEventListener('input', () => {
    if (currentNoteId) saveCurrentNote();
});

document.getElementById('editor-title-input').addEventListener('input', () => {
    if (currentNoteId) saveCurrentNote();
});

// Initial render
renderFolders();
renderFolderNav();
renderNotes();