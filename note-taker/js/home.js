function startApp() {
    window.location.href = 'templates/login.html';
}
document.addEventListener('DOMContentLoaded', function () {
    var navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(function (btn) {
        var txt = (btn.textContent || btn.innerText || '').trim().toLowerCase();
        if (txt === 'login') {
            btn.addEventListener('click', function () {
                window.location.href = 'templates/login.html';
            });
        } else if (txt === 'register') {
            btn.addEventListener('click', function () {
                window.location.href = 'templates/register.html';
            });
        } else if (txt === 'home') {
            btn.addEventListener('click', function () {
                window.location.href = 'index.html';
            });
        }
    });
});