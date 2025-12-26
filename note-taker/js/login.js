  function login() {
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        const errorMsg = document.getElementById("errorMsg");

        if (username === "" || password === "") {
          errorMsg.textContent = "Please enter username and password";
          return;
        }

        // Demo login check
        if (username === "admin" && password === "1234") {
          alert("Login Successful!");
          errorMsg.textContent = "";
        } else {
          errorMsg.textContent = "Invalid username or password";
        }
      }