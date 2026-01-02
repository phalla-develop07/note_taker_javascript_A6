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
  const exists = users.find(u => u.username.toLowerCase() === username.toLowerCase());
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
  users.push({ username: username, password: password });
  localStorage.setItem('users', JSON.stringify(users));

  // Initialize empty notes for user
  const notesKey = `notes_${username}`;
  if (!localStorage.getItem(notesKey)) {
    localStorage.setItem(notesKey, JSON.stringify([]));
  }

  msg.style.color = '#dff0d8';
  msg.textContent = 'Registration successful! Redirecting to login...';

  setTimeout(() => {
    window.location.href = 'login.html';
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
