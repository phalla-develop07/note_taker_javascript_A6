// Data
let folders = [
    { name: 'Personal', tags: ['Life', 'Goals'] },
    { name: 'Work', tags: ['Projects', 'Meetings'] },
    { name: 'Ideas', tags: ['Creativity', 'Brainstorm'] },
    { name: 'Learning', tags: ['Books', 'Courses'] }
];

let notes = [
    { title: 'My 2026 Goals', tags: ['Personal'], pinned: true, content: '<p>Here are my main goals for this year...</p><ul><li>Read 24 books</li><li>Exercise 4x/week</li></ul>' },
    { title: 'Project Alpha Planning', tags: ['Work'], pinned: false, content: '<p>Initial thoughts and timeline for Project Alpha launch in Q2.</p>' },
    { title: 'Book Notes: Atomic Habits', tags: ['Learning'], pinned: false, content: '<p>Key takeaways:</p><ul><li>Make habits obvious</li><li>Use habit stacking</li></ul>' },
    { title: 'Creative Writing Prompt Ideas', tags: ['Ideas'], pinned: false, content: '<p>List of prompts to overcome writer\'s block...</p>' }
];

let currentNoteIndex = null;

function stripHTML(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
}

function renderFolders() {
    const folderListElem = document.querySelector('.folder-list');
    folderListElem.innerHTML = '';
    folders.forEach(folder => {
        const card = document.createElement('div');
        card.className = 'folder-card';
        card.innerHTML = `
                    <div class="icon">📁</div>
                    <h3>${folder.name}</h3>
                    <div class="tags">${folder.tags.join(' • ')}</div>
                `;
        folderListElem.appendChild(card);
    });
    document.querySelector('.folders .count').textContent = `${folders.length.toString().padStart(2, '0')} Folders`;
}

function renderNotes(filterPinned = false) {
    const noteGrid = document.querySelector('.note-grid');
    noteGrid.innerHTML = '';
    const filtered = filterPinned ? notes.filter(n => n.pinned) : notes;
    filtered.forEach((note, index) => {
        const card = document.createElement('div');
        card.className = 'note-card';
        const previewText = stripHTML(note.content).substring(0, 120) + (stripHTML(note.content).length > 120 ? '...' : '');
        card.innerHTML = `
                    <div class="title">${note.title || 'Untitled Note'}</div>
                    <div class="preview">${previewText || 'No content yet'}</div>
                    <div class="pin ${note.pinned ? 'pinned' : ''}" data-index="${index}">❤️</div>
                `;
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('pin')) return;
            openEditor(index);
        });
        noteGrid.appendChild(card);
    });
    document.querySelector('.total-notes').textContent = `Total Notes: ${notes.length}`;
}

function filterAndRender(keyword = '') {
    const lower = keyword.toLowerCase();
    const filteredNotes = notes.filter(n =>
        (n.title || '').toLowerCase().includes(lower) ||
        stripHTML(n.content).toLowerCase().includes(lower)
    );
    const isPinned = document.getElementById('pinned-notes').classList.contains('active');
    renderNotes(isPinned ? true : false);
    if (isPinned) {
        // Re-filter for pinned if needed
        renderNotes(true);
    } else {
        // Show filtered list
        const noteGrid = document.querySelector('.note-grid');
        noteGrid.innerHTML = '';
        filteredNotes.forEach((note, originalIndex) => {
            const card = document.createElement('div');
            card.className = 'note-card';
            const previewText = stripHTML(note.content).substring(0, 120) + '...';
            card.innerHTML = `
                        <div class="title">${note.title || 'Untitled Note'}</div>
                        <div class="preview">${previewText || 'No content yet'}</div>
                        <div class="pin ${note.pinned ? 'pinned' : ''}" data-index="${notes.indexOf(note)}">❤️</div>
                    `;
            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('pin')) return;
                openEditor(notes.indexOf(note));
            });
            noteGrid.appendChild(card);
        });
    }
    document.querySelector('.total-notes').textContent = `Total Notes: ${notes.length} | Showing: ${isPinned ? notes.filter(n => n.pinned).length : filteredNotes.length}`;
}

function openEditor(index) {
    currentNoteIndex = index;
    const note = notes[index];
    document.getElementById('editor-title-input').value = note.title || '';
    document.getElementById('editor-content').innerHTML = note.content || '';
    document.getElementById('editor-modal').style.display = 'flex';
    document.getElementById('save-status').style.opacity = '0';
    document.getElementById('editor-title-input').focus();
}

function saveCurrentNote() {
    if (currentNoteIndex === null) return;
    const newTitle = document.getElementById('editor-title-input').value.trim();
    const newContent = document.getElementById('editor-content').innerHTML;
    notes[currentNoteIndex].title = newTitle || 'Untitled Note';
    notes[currentNoteIndex].content = newContent;

    const status = document.getElementById('save-status');
    status.style.opacity = '1';
    setTimeout(() => { status.style.opacity = '0'; }, 2000);

    filterAndRender(document.getElementById('search-input').value);
}

function closeEditor() {
    document.getElementById('editor-modal').style.display = 'none';
    currentNoteIndex = null;
}

function deleteCurrentNote() {
    if (currentNoteIndex === null) return;
    if (confirm('Permanently delete this note?')) {
        notes.splice(currentNoteIndex, 1);
        closeEditor();
        filterAndRender(document.getElementById('search-input').value);
    }
}

function createNewNote() {
    const newNote = {
        title: 'New Note',
        tags: [],
        pinned: false,
        content: '<p>Start writing your note here...</p>'
    };
    notes.push(newNote);
    filterAndRender(document.getElementById('search-input').value);
    openEditor(notes.length - 1);
}

// Toolbar commands
document.querySelectorAll('.toolbar button[data-command]').forEach(btn => {
    btn.addEventListener('click', () => {
        document.execCommand(btn.dataset.command, false);
        document.getElementById('editor-content').focus();
    });
});

document.getElementById('font-size-select').addEventListener('change', (e) => {
    document.execCommand('fontSize', false, e.target.value);
});

document.getElementById('font-family-select').addEventListener('change', (e) => {
    document.execCommand('fontName', false, e.target.value);
});

// Event listeners
document.getElementById('new-note').addEventListener('click', createNewNote);
document.getElementById('save-note').addEventListener('click', saveCurrentNote);
document.getElementById('close-editor').addEventListener('click', closeEditor);
document.getElementById('delete-note').addEventListener('click', deleteCurrentNote);

document.getElementById('all-notes').addEventListener('click', () => {
    document.getElementById('all-notes').classList.add('active');
    document.getElementById('pinned-notes').classList.remove('active');
    filterAndRender(document.getElementById('search-input').value);
});

document.getElementById('pinned-notes').addEventListener('click', () => {
    document.getElementById('pinned-notes').classList.add('active');
    document.getElementById('all-notes').classList.remove('active');
    renderNotes(true);
});

document.querySelector('.note-grid').addEventListener('click', (e) => {
    if (e.target.classList.contains('pin')) {
        const index = parseInt(e.target.dataset.index);
        notes[index].pinned = !notes[index].pinned;
        e.target.classList.toggle('pinned');
    }
});

document.getElementById('search-input').addEventListener('input', (e) => {
    filterAndRender(e.target.value);
});

// Initial render
renderFolders();
renderNotes();