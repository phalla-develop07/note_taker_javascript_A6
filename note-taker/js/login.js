
// User database with secure passwords
const users = [
  { username: "admin", password: "Admin123!" },
  { username: "john", password: "John@456" },
  { username: "sarah", password: "Sarah#789" },
  { username: "mike", password: "Mike$2025" }
];
// Validate password security requirements
function validatePassword(password) {
  if (!password || typeof password !== 'string') return {
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  };
  return {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*]/.test(password)
  };
}

// Check if password is secure (all requirements met)
function isPasswordSecure(password) {
  const requirements = validatePassword(password);
  return requirements.minLength && 
         requirements.hasUpperCase && 
         requirements.hasLowerCase && 
         requirements.hasNumber && 
         requirements.hasSpecialChar;
}

// Get missing password requirements
function getPasswordRequirements(password) {
  const req = validatePassword(password);
  const missing = [];
  
  if (!req.minLength) missing.push("At least 8 characters");
  if (!req.hasUpperCase) missing.push("One uppercase letter (A-Z)");
  if (!req.hasLowerCase) missing.push("One lowercase letter (a-z)");
  if (!req.hasNumber) missing.push("One number (0-9)");
  if (!req.hasSpecialChar) missing.push("One special character (!@#$%^&*)");
  
  return missing;
}

// Main login function
function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const errorMsg = document.getElementById("errorMsg");

  // Clear previous error
  errorMsg.textContent = "";
  errorMsg.style.color = "#e74c3c";

  // Check 1: Empty fields
  if (username === "" || password === "") {
    errorMsg.textContent = "❌ Please enter username and password";
    return;
  }

  // Check 2: Find user
  const user = users.find(u => u.username === username);
  
  if (!user) {
    errorMsg.textContent = "❌ Username not found";
    return;
  }

  // Check 3: Password security (MUST be secure)
  if (!isPasswordSecure(password)) {
    const missing = getPasswordRequirements(password);
    errorMsg.innerHTML = "❌ Password not secure. Missing:<br>" + missing.join("<br>");
    errorMsg.style.color = "#e74c3c";
    return;
  }

  // Check 4: Password match
  if (password !== user.password) {
    errorMsg.textContent = "❌ Invalid password";
    errorMsg.style.color = "#e74c3c";
    return;
  }

  // SUCCESS: Store user in localStorage and redirect
  localStorage.setItem("currentUser", username);
  
  // Create user's notes storage
  const notesKey = `notes_${username}`;
  if (!localStorage.getItem(notesKey)) {
    localStorage.setItem(notesKey, JSON.stringify([]));
  }

  // Show success message
  errorMsg.textContent = "✓ Login Successful! Redirecting...";
  errorMsg.style.color = "#27ae60";

  // Redirect to note-page after 1.5 seconds
  setTimeout(() => {
    window.location.href = "templates/note-page.html";
  }, 1500);
}
// Add event listener when page loads
document.addEventListener("DOMContentLoaded", function() {
  const passwordInput = document.getElementById("password");
  // Support Enter key to login
  if (passwordInput) {
    passwordInput.addEventListener("keypress", function(event) {
      if (event.key === "Enter") {
        login();
      }
    });
  }
});