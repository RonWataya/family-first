// controller/login.js

// IMPORTANT: Updated references to target the wrapper instead of individual flex items
const loginContainer = document.getElementById('login-container');
const dashboardWrapper = document.getElementById('admin-dashboard-wrapper');

/**
 * Checks if the admin is logged in by looking for a flag in localStorage.
 * @returns {boolean} True if the 'adminLoggedIn' flag is set to 'true'.
 */
function checkAdminSession() {
    return localStorage.getItem('adminLoggedIn') === 'true';
}

/**
 * Hides the login screen and shows the main dashboard wrapper.
 */
function showDashboard() {
    if (dashboardWrapper) {
        // Set display to 'flex' to activate the sidebar/main-content layout
        dashboardWrapper.style.display = 'flex'; 
    }
    if (loginContainer) {
        // Hide the absolute-positioned login overlay
        loginContainer.style.display = 'none';
    }
    
    // Initial data fetch (Assumes fetchUsers is a global function in admin.js)
    if (typeof fetchUsers === 'function') {
        fetchUsers();
    }
}

/**
 * Logs the admin out by clearing the session state and showing the login screen.
 * This is exposed globally for the Logout Button's onclick handler.
 */
window.logoutAdmin = function() {
    localStorage.removeItem('adminLoggedIn');
    
    // Hide the entire dashboard wrapper
    if (dashboardWrapper) {
        dashboardWrapper.style.display = 'none';
    }
    
    // Show the login overlay
    if (loginContainer) {
        loginContainer.style.display = 'flex';
    }

    // Reset form and error message
    const errorMessage = document.getElementById('login-error-message');
    if (errorMessage) errorMessage.style.display = 'none';
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.reset();
};

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('login-error-message');

    // 1. Initial Session Check: Set the correct starting state
    const loggedIn = checkAdminSession();
    
    if (loggedIn) {
        // If already logged in, show dashboard immediately
        showDashboard();
        return; 
    }

    // Default state: If not logged in, ensure login is shown and dashboard is hidden
    if (dashboardWrapper) {
        dashboardWrapper.style.display = 'none';
    }
    if (loginContainer) {
        loginContainer.style.display = 'flex';
    }

    // 2. Login Form Submission Handler
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            errorMessage.style.display = 'none';
            
            try {
                // IMPORTANT: Replace '/api/admin/login' with your actual server endpoint
                const response = await fetch('http://127.0.0.1:7000/api/login', {

                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    localStorage.setItem('adminLoggedIn', 'true');
                    
                    // Simple fade transition
                    if (loginContainer) loginContainer.style.opacity = '0';
                    setTimeout(() => {
                        showDashboard();
                        if (loginContainer) loginContainer.style.opacity = '1'; // Reset opacity for logout
                    }, 300);
                    
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
});