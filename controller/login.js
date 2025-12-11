// controller/login.js

const ADMIN_PAGE = 'admin.html';
const LOGIN_PAGE = 'admin_login.html';

/**
 * Checks if the admin is logged in by looking for a flag in localStorage.
 * @returns {boolean} True if the 'adminLoggedIn' flag is set to 'true'.
 */
function checkAdminSession() {
    return localStorage.getItem('adminLoggedIn') === 'true';
}

/**
 * Logs the admin out, clears the session, and redirects to the login page.
 * This is exposed globally for the Logout Button's onclick handler.
 */
window.logoutAdmin = function() {
    localStorage.removeItem('adminLoggedIn');
    window.location.href = LOGIN_PAGE;
};


// --- Logic for admin_login.html (Login Page) ---

function handleLoginPage() {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('login-error-message');

    // If already logged in, redirect immediately to dashboard
    if (checkAdminSession()) {
        window.location.href = ADMIN_PAGE;
        return;
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            errorMessage.style.display = 'none';
            
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    localStorage.setItem('adminLoggedIn', 'true');
                    // SUCCESS: Redirect to the main dashboard page
                    window.location.href = ADMIN_PAGE; 
                    
                } else {
                    errorMessage.textContent = data.message || 'Login failed. Invalid credentials or server error.';
                    errorMessage.style.display = 'block';
                }
            } catch (error) {
                console.error('Login request failed:', error);
                errorMessage.textContent = 'Network error or server unavailable. Check your console.';
                errorMessage.style.display = 'block';
            }
        });
    }
}


// --- Logic for admin_dashboard.html (Dashboard Page) ---

function handleDashboardPage() {
    // If not logged in, redirect immediately to login page
    if (!checkAdminSession()) {
        window.location.href = LOGIN_PAGE;
        return;
    }
    
    // If logged in, fetch data after DOM content is loaded
    // We assume fetchUsers is now loaded from admin.js
    if (typeof window.fetchUsers === 'function') {
        window.fetchUsers();
    }
}


document.addEventListener('DOMContentLoaded', () => {
    // Check which page we are on
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === LOGIN_PAGE || currentPage === "") {
        handleLoginPage();
    } else if (currentPage === ADMIN_PAGE) {
        handleDashboardPage();
    }
});