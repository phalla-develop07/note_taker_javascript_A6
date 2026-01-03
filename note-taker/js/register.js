// Register page logic
function registerUser() {
  const username = document.getElementById('regUsername').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirm = document.getElementById('regConfirm').value;
  const msg = document.getElementById('registerMsg');

  msg.style.color = '#ffdddd';
  msg.textContent = '';

  if (!username || !password || !confirm) {
    msg.textContent = 'Please fill all fields';
    return;
  }
  // Check username uniqueness
  const exists = window.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (exists) {
    msg.textContent = 'Username already taken';
    return;
  }

  // Use validation helpers from login.js
  if (!isPasswordSecure(password)) {
    const missing = getPasswordRequirements(password);
    msg.innerHTML = 'Password not secure. Missing:<br>' + missing.join('<br>');
    return;
  }

  if (password !== confirm) {
    msg.textContent = 'Passwords do not match';
    return;
  }

  // Add user and persist
  window.users.push({ username: username, password: password });
  localStorage.setItem('users', JSON.stringify(window.users));

  // Initialize empty notes for user
  const notesKey = `notes_${username}`;
  if (!localStorage.getItem(notesKey)) {
    const defaultData = {
      folders: [],
      notes: [],
      trash: { folders: [], notes: [] },
      backgroundType: 'color',
      backgroundValue: '#ffffff',
      version: 2
    };
    localStorage.setItem(notesKey, JSON.stringify(defaultData));
  }

  msg.style.color = '#dff0d8';
  msg.textContent = '✓ Registration successful! Redirecting to your notes...';

  setTimeout(() => {
    // Store current user in sessionStorage and redirect to note-page
    sessionStorage.setItem('currentUser', username);
    sessionStorage.setItem('isNewSession', 'true'); // Show welcome message
    // Redirect to note-page (handle template vs root paths)
    try {
      const path = window.location.pathname || '';
      if (path.includes('/templates/') || path.endsWith('note-page.html') || path.endsWith('register.html')) {
        window.location.href = 'note-page.html';
      } else {
        window.location.href = 'templates/note-page.html';
      }
    } catch (e) {
      window.location.href = 'templates/note-page.html';
    }
  }, 1400);
}
// Allow Enter key on confirm field
document.addEventListener('DOMContentLoaded', function() {
  const confirmInput = document.getElementById('regConfirm');
  if (confirmInput) {
    confirmInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') registerUser();
    });
  }
});
