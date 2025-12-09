// controller/admin.js (CORE FUNCTIONS)

// Use relative path so it works automatically on localhost:7000 or production
const API_URL = ""; 

// Global stores (declared here, used in matching files)
let allUsers = []; 
let userAData = null; 
let userBData = null; 

// ---------------------------------------------------------
//  UTILITY FUNCTIONS
// ---------------------------------------------------------

/**
 * Calculates age from a Date string (YYYY-MM-DD)
 */
function calculateAge(dobString) {
    if (!dobString) return 'N/A';
    
    const birthDate = new Date(dobString);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    
    // If the birthday hasn't occurred yet this year, subtract 1
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

function displayStatus(message, type = 'success') {
    const statusDiv = document.getElementById('status-message');
    if (!statusDiv) return;

    statusDiv.textContent = message;
    statusDiv.style.display = 'block';
    
    // Color coding based on type
    statusDiv.style.backgroundColor = type === 'success' ? '#d4edda' : '#f8d7da';
    statusDiv.style.color = type === 'success' ? '#155724' : '#721c24';
    statusDiv.style.borderColor = type === 'success' ? '#c3e6cb' : '#f5c6cb';

    setTimeout(() => { statusDiv.style.display = 'none'; }, 4000);
}


// ---------------------------------------------------------
//  API CALLS & DASHBOARD LOGIC
// ---------------------------------------------------------

async function fetchUsers() {
    try {
        const response = await fetch("/api/users");
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        allUsers = await response.json();
        renderUserList(allUsers);
    } catch (error) {
        console.error("Could not fetch users:", error);
        document.getElementById('users-tbody').innerHTML = 
            '<tr><td colspan="8">Failed to load users. Check console/server.</td></tr>';
        displayStatus("Failed to load users.", 'error');
    }
}

async function fetchMatches() {
    const tbody = document.getElementById('matches-tbody');
    tbody.innerHTML = '<tr><td colspan="5">Loading matches...</td></tr>';
    
    try {
        const response = await fetch("/api/matches");
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const matches = await response.json();
        renderMatchesList(matches);
    } catch (error) {
        console.error("Could not fetch matches:", error);
        tbody.innerHTML = '<tr><td colspan="5">Failed to load matches.</td></tr>';
        displayStatus("Failed to load matches list.", 'error');
    }
}

function renderUserList(usersToRender) {
    const tbody = document.getElementById('users-tbody');
    tbody.innerHTML = '';

    usersToRender.forEach(user => {
        // New Schema uses 'dob' string
        const age = calculateAge(user.dob);
        
        // Handle potentially null fields from left joins
        const gender = user.gender || '-';
        const seeking = user.partner_gender || '-';
        const city = user.city || '-';

        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.full_name}</td>
            <td>${user.email}</td>
            <td>${age}</td>
            <td>${gender}</td>
            <td>${seeking}</td>
            <td>${city}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn view-btn" onclick="loadUserDetail(${user.id})">🔍 View</button>
                    <button class="btn compare-btn" onclick="prefillComparison(${user.id})">🤝 Compare</button>
                    <button class="btn match-btn" onclick="findTopRatedMatches(${user.id})" style="background-color: #ffc107; color: #000;">⭐ Match</button>
                </div>
            </td>
        `;
    });
}

function renderMatchesList(matches) {
    const tbody = document.getElementById('matches-tbody');
    tbody.innerHTML = ''; 

    if (matches.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No manual matches have been created yet.</td></tr>';
        return;
    }

    matches.forEach(match => {
        const dateStr = match.matched_on ? new Date(match.matched_on).toLocaleDateString() : 'N/A';
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${match.id}</td>
            <td>${match.user_a_name} (ID: ${match.user_a_id})</td>
            <td>${match.user_b_name} (ID: ${match.user_b_id})</td>
            <td>${dateStr}</td>
            <td>
                <button class="btn compare-btn" onclick="viewMatchComparison(${match.user_a_id}, ${match.user_b_id})">Compare</button>
                <button class="btn match-btn" style="background-color: #dc3545;" onclick="deleteMatch(${match.id})">Delete</button>
            </td>
        `;
    });
}

function filterUsers() {
    const searchInput = document.getElementById('search-input').value.toLowerCase();
    const filteredUsers = allUsers.filter(user => 
        (user.full_name && user.full_name.toLowerCase().includes(searchInput)) || 
        (user.email && user.email.toLowerCase().includes(searchInput))
    );
    renderUserList(filteredUsers);
}


// ---------------------------------------------------------
//  PROFILE RENDERING (Mapped to New Schema)
// ---------------------------------------------------------

function renderFullProfile(user, container) {
    
    // Helper: Renders a field if it exists
    const renderField = (label, value) => {
        if (value === null || value === undefined || String(value).trim() === '') return '';
        return `<div><strong>${label}:</strong> ${value}</div>`;
    };

    // Helper: Renders image (Base64 string)
    const renderImage = (label, imageData) => {
        // Basic validation for base64 string length
        if (imageData && imageData.length > 50) { 
            return `
                <div class="profile-image-container">
                    <strong>${label}:</strong><br>
                    <img src="${imageData}" alt="${label}" class="profile-img-preview">
                </div>`;
        }
        return `<div><strong>${label}:</strong> <span style="color:#999;">No image uploaded.</span></div>`;
    };
    
    const dobFormatted = user.dob ? new Date(user.dob).toLocaleDateString() : 'N/A';

    let html = `
        <h4 class="section-header" style="margin-top: 0; color: #333;">
            Profile: ${user.full_name} (ID: ${user.id})
        </h4>

        <h4 class="section-header">📸 Visuals</h4>
        <div class="profile-details">
            ${renderImage('Profile Photo', user.profile_image)}
        </div>

        <h4 class="section-header">Demographics</h4>
        <div class="profile-details">
            ${renderField('Email', user.email)}
            ${renderField('Phone', user.phone)}
            ${renderField('Pricing Plan', user.pricing_plan)}
            ${renderField('DOB', dobFormatted)}
            ${renderField('Age', calculateAge(user.dob))}
            ${renderField('City', user.city)}
            ${renderField('Gender', user.gender)}
            ${renderField('Marital Status', user.marital_status)}
            ${renderField('Height (cm)', user.height)}
            ${renderField('Ethnicity', user.ethnicity)}
            ${renderField('Children in House', user.children_in_household)}
        </div>
        
        <h4 class="section-header">Partner Preferences</h4>
        <div class="profile-details">
            ${renderField('Seeking Gender', user.partner_gender)}
            ${renderField('Accepted Age Ranges', user.age_ranges)}
            ${renderField('Accepted Ethnicities', user.ethnic_preferences)}
            ${renderField('Max Distance', user.max_distance)}
            ${renderField('Partner Smoking', user.partner_smoking)}
            ${renderField('Partner Drinking', user.partner_drinking)}
            ${renderField('Partner Children', user.partner_children)}
        </div>

        <h4 class="section-header">Education, Work & Finance</h4>
        <div class="profile-details">
            ${renderField('Education', user.education_level)}
            ${renderField('Profession', user.profession)}
            ${renderField('Income Bracket', user.income_bracket)}
            <hr style="border-top: 1px dashed #ccc;">
            ${renderField('Education Importance', user.edu_importance)}
            ${renderField('Income Importance', user.income_importance)}
        </div>

        <h4 class="section-header">Lifestyle & Beliefs</h4>
        <div class="profile-details">
            ${renderField('Beliefs', user.beliefs)}
            ${renderField('Accepted Religious Beliefs', user.religious_preferences)}
            ${renderField('Smoking Habit', user.smoking_habit)}
            ${renderField('Drinking Habit', user.drinking_habit)}
            <hr style="border-top: 1px dashed #ccc;">
            ${renderField('Interests', user.interests)}
            ${renderField('Passionate About', user.passionate_about)}
        </div>
        
        <h4 class="section-header">Personality & Relationship Values</h4>
        <div class="profile-details">
            ${renderField('Partner Role', user.partner_role)}
            ${renderField('Reconcile Style', user.reconcile_style)}
            ${renderField('Willingness to Change', user.willingness_to_change)}
            ${renderField('Friend Description', user.friend_description)} 
            <hr style="border-top: 1px dashed #ccc;">
            ${renderField('Free Time Activities', user.free_time_activities)}
            ${renderField('Thankful For', user.thankful_for)}
            ${renderField('Marketing Source', user.marketing_source)}
        </div>
        
        <div style="margin-top:20px; font-size: 0.8em; color: #777;">
            Registered: ${new Date(user.created_at).toLocaleString()}
        </div>
    `;
    
    container.innerHTML = html;
}


// ---------------------------------------------------------
//  DETAIL SIDEBAR LOGIC
// ---------------------------------------------------------

function openProfileSidebar() {
    document.getElementById('profile-sidebar').classList.add('open');
    document.body.classList.add('sidebar-open'); // Prevents background scrolling
}

function closeProfileSidebar() {
    document.getElementById('profile-sidebar').classList.remove('open');
    document.body.classList.remove('sidebar-open');
}

async function loadUserDetail(userId) {
    // Ensure we are viewing the user list section
    showSection('user-management'); 
    
    try {
        const response = await fetch(`/api/users/${userId}`);
        
        if (!response.ok) throw new Error("User not found");
        
        const user = await response.json();
        
        const detailContent = document.getElementById('profile-detail-content');
        renderFullProfile(user, detailContent);
        openProfileSidebar();
        
    } catch (error) {
        console.error(`Error details for user ${userId}:`, error);
        displayStatus("Error loading user profile.", 'error');
    }
}


// ---------------------------------------------------------
//  UI NAVIGATION
// ---------------------------------------------------------

function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    
    // Reset messages and sidebars
    document.getElementById('status-message').style.display = 'none';
    closeProfileSidebar();

    // Auto-refresh match list if that tab is selected
    if (sectionId === 'matches-list') {
        fetchMatches();
    }
}


// ---------------------------------------------------------
//  INITIALIZATION & EXPORTS
// ---------------------------------------------------------

document.addEventListener('DOMContentLoaded', fetchUsers);

// Make functions globally available for HTML onclick events and other JS files
window.API_URL = API_URL;
window.allUsers = allUsers;
window.userAData = userAData;
window.userBData = userBData;
window.calculateAge = calculateAge;
window.displayStatus = displayStatus;
window.showSection = showSection;
window.fetchUsers = fetchUsers;
window.fetchMatches = fetchMatches;
window.renderUserList = renderUserList;
window.renderMatchesList = renderMatchesList;
window.filterUsers = filterUsers;
window.renderFullProfile = renderFullProfile; 
window.loadUserDetail = loadUserDetail;
window.openProfileSidebar = openProfileSidebar; 
window.closeProfileSidebar = closeProfileSidebar;