// Check if user is logged in
function checkUserLogin() {
  const currentUser = sessionStorage.getItem('currentUser');
  if (!currentUser) {
    window.location.href = 'login.html';
    return null;
  }
  return currentUser;
}
const currentUser = checkUserLogin();
let notes = JSON.parse(localStorage.getItem(`notes_${currentUser}`)) || [];
let currentNoteId = null;
let currentGroup = 'all';

function saveNotes() {
  localStorage.setItem(`notes_${currentUser}`, JSON.stringify(notes));
  updateCounts();
  renderNotes();
}

function showWelcomeMessage() {
  // Check if this is a new session (just logged in or registered)
  const isNewSession = sessionStorage.getItem('isNewSession');
  
  if (isNewSession) {
    const welcomeMsg = document.getElementById('welcomeMessage');
    const welcomeUsername = document.getElementById('welcomeUsername');
    
    if (welcomeMsg && welcomeUsername) {
      welcomeUsername.textContent = currentUser;
      welcomeMsg.style.display = 'block';
      
      // Auto-hide welcome message after 5 seconds
      setTimeout(() => {
        welcomeMsg.style.display = 'none';
      }, 5000);
    }
    
    // Clear the flag so it doesn't show again on page refresh
    sessionStorage.removeItem('isNewSession');
  }
  // Show weak password warning if flagged during login
  const weak = sessionStorage.getItem('weakPassword');
  if (weak) {
    const weakMsg = document.getElementById('weakPassMessage');
    if (weakMsg) {
      weakMsg.style.display = 'block';
      // Auto-hide after 7 seconds
      setTimeout(() => { weakMsg.style.display = 'none'; }, 7000);
    }
    sessionStorage.removeItem('weakPassword');
  }
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
    noteList.innerHTML = '<div class="empty">No notes found. Click "New Note" to create one.</div>';
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

function logout() {
  sessionStorage.removeItem('currentUser');
  window.location.href = 'login.html';
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

// Display current username in header
document.addEventListener('DOMContentLoaded', function() {
  const userDisplay = document.getElementById('userDisplay');
  if (userDisplay) {
    userDisplay.textContent = currentUser;
  }
  
  // Show welcome message if this is a new session
  showWelcomeMessage();
});

// Initial load
updateCounts();
renderNotes();