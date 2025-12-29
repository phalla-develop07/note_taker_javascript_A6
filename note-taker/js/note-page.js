let notes = JSON.parse(localStorage.getItem('notes')) || [];
        let currentNoteId = null;
        let currentGroup = 'all';

        function saveNotes() {
            localStorage.setItem('notes', JSON.stringify(notes));
            updateCounts();
            renderNotes();
        }

        function updateCounts() {
            const counts = { all: notes.length, Friend: 0, Family: 0, teamwork: 0 };
            notes.forEach(note => {
                if (counts[note.group] !== undefined) counts[note.group]++;
            });
            document.getElementById('count-all').textContent = counts.all;
            document.getElementById('count-Friend').textContent = counts.Friend;
            document.getElementById('count-Family').textContent = counts.Family;
            document.getElementById('count-teamwork').textContent = counts.teamwork;
        }

        function renderNotes() {
            const noteList = document.getElementById('noteList');
            noteList.innerHTML = '';
            let filtered = notes;
            const search = document.getElementById('searchInput').value.toLowerCase();
            if (search) {
                filtered = notes.filter(note => note.title.toLowerCase().includes(search));
            } else if (currentGroup !== 'all') {
                filtered = notes.filter(note => note.group === currentGroup);
            }

            if (filtered.length === 0) {
                noteList.innerHTML = '<div class="empty">No notes found.</div>';
                return;
            }

            filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

            filtered.forEach(note => {
                const div = document.createElement('div');
                div.className = 'note-item';
                if (note.id === currentNoteId) div.classList.add('selected');
                div.innerHTML = `
                    <div class="note-date">${new Date(note.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
                    <div class="note-title">${note.title || 'Untitled'}</div>
                    <div class="note-preview">${note.body.substring(0, 100) || ''}${note.body.length > 100 ? '...' : ''}</div>
                `;
                div.onclick = () => loadNote(note.id);
                noteList.appendChild(div);
            });
        }

        function loadNote(id) {
            const note = notes.find(n => n.id === id);
            if (!note) return;
            currentNoteId = id;
            document.getElementById('noteTitle').value = note.title;
            document.getElementById('noteBody').value = note.body;
            document.getElementById('noteGroup').value = note.group;
            document.getElementById('deleteBtn').style.display = 'inline-block';
            renderNotes();
        }

        function clearEditor() {
            currentNoteId = null;
            document.getElementById('noteTitle').value = '';
            document.getElementById('noteBody').value = '';
            document.getElementById('noteGroup').value = 'Friend';
            document.getElementById('deleteBtn').style.display = 'none';
            renderNotes();
        }

        document.getElementById('saveBtn').onclick = () => {
            const title = document.getElementById('noteTitle').value.trim();
            const body = document.getElementById('noteBody').value;
            const group = document.getElementById('noteGroup').value;

            if (currentNoteId === null) {
                const newNote = {
                    id: Date.now(),
                    title,
                    body,
                    group,
                    date: new Date().toISOString()
                };
                notes.push(newNote);
                currentNoteId = newNote.id;
            } else {
                const note = notes.find(n => n.id === currentNoteId);
                note.title = title;
                note.body = body;
                note.group = group;
                note.date = new Date().toISOString();
            }
            saveNotes();
            loadNote(currentNoteId);
        };

        document.getElementById('deleteBtn').onclick = () => {
            if (confirm('Delete this note?')) {
                notes = notes.filter(n => n.id !== currentNoteId);
                saveNotes();
                clearEditor();
            }
        };

        document.getElementById('newBtn').onclick = () => {
            clearEditor();
        };

        document.querySelectorAll('.group-item').forEach(item => {
            item.onclick = () => {
                document.querySelectorAll('.group-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                currentGroup = item.dataset.group;
                renderNotes();
            };
        });

        document.getElementById('searchInput').oninput = () => {
            renderNotes();
        };

        // Initial load
        updateCounts();
        renderNotes();