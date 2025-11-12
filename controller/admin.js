// admin.js (CORE FUNCTIONS)

const API_URL = "http://127.0.0.1:7000"; 

// Global stores (declared here, used in both files)
let allUsers = []; 
let userAData = null; 
let userBData = null; 


// --- Utility Functions (Used everywhere) ---

function calculateAge(year, month, day) {
    if (!year || !month || !day) return 'N/A';
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

function displayStatus(message, type = 'success') {
    const statusDiv = document.getElementById('status-message');
    statusDiv.textContent = message;
    statusDiv.style.display = 'block';
    
    statusDiv.style.backgroundColor = type === 'success' ? '#d4edda' : '#f8d7da';
    statusDiv.style.color = type === 'success' ? '#155724' : '#721c24';
    statusDiv.style.borderColor = type === 'success' ? '#c3e6cb' : '#f5c6cb';

    setTimeout(() => { statusDiv.style.display = 'none'; }, 5000);
}


// --- API Calls & Main Dashboard Logic ---

async function fetchUsers() {
    try {
        const response = await fetch(`${API_URL}/users`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        allUsers = await response.json();
        renderUserList(allUsers);
    } catch (error) {
        console.error("Could not fetch users:", error);
        document.getElementById('users-tbody').innerHTML = 
            '<tr><td colspan="9">Failed to load users. Check console for API error.</td></tr>';
        displayStatus("Failed to load users.", 'error');
    }
}

async function fetchMatches() {
    const tbody = document.getElementById('matches-tbody');
    tbody.innerHTML = '<tr><td colspan="5">Loading matches...</td></tr>';
    
    try {
        const response = await fetch(`${API_URL}/matches`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const matches = await response.json();
        renderMatchesList(matches);
    } catch (error) {
        console.error("Could not fetch matches:", error);
        tbody.innerHTML = '<tr><td colspan="5">Failed to load matches. Check console for API error.</td></tr>';
        displayStatus("Failed to load matches list.", 'error');
    }
}

function renderUserList(usersToRender) {
    const tbody = document.getElementById('users-tbody');
    tbody.innerHTML = '';

    usersToRender.forEach(user => {
        const age = calculateAge(user.birth_year, user.birth_month, user.birth_day);
        
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.full_name}</td>
            <td>${user.email}</td>
            <td>${age}</td>
            <td>${user.gender}</td>
            <td>${user.partner_gender}</td>
            <td>${user.city}</td>
            <td>
                <button class="btn view-btn" onclick="loadUserDetail(${user.id})">🔍 View</button>
                <button class="btn compare-btn" onclick="prefillComparison(${user.id})">🤝 Compare</button>
                <button class="btn match-btn" onclick="findTopRatedMatches(${user.id})" style="background-color: #ffc107; color: var(--text-color);">⭐ Top Match</button>
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
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${match.id}</td>
            <td>${match.user_a_name} (ID: ${match.user_a_id})</td>
            <td>${match.user_b_name} (ID: ${match.user_b_id})</td>
            <td>${new Date(match.matched_on).toLocaleString()}</td>
            <td>
                <button class="btn compare-btn" onclick="viewMatchComparison(${match.user_a_id}, ${match.user_b_id})">Compare</button>
                <button class="btn match-btn" style="background-color: #6c757d;" onclick="deleteMatch(${match.id})">Delete</button>
            </td>
        `;
    });
}


function filterUsers() {
    const searchInput = document.getElementById('search-input').value.toLowerCase();
    const filteredUsers = allUsers.filter(user => 
        user.full_name.toLowerCase().includes(searchInput) || 
        user.email.toLowerCase().includes(searchInput)
    );
    renderUserList(filteredUsers);
}


// --- Profile Rendering Functions (Required by both detail and comparison) ---

function renderFullProfile(user, container) {
    // Helper function to render a key-value pair, handles null/empty strings
    const renderField = (label, value) => {
        if (value === null || value === undefined || String(value).trim() === '') return '';
        return `<div><strong>${label}:</strong> ${value}</div>`;
    };

    // Helper function to render an image if Base64 data exists and is valid
    const renderImage = (label, imageData) => {
        if (imageData && imageData.startsWith('data:image')) {
            return `
                <div class="profile-image-container">
                    <strong>${label}:</strong>
                    <img src="${imageData}" alt="${label}" style="max-width: 100%; height: auto; border: 1px solid #ccc; border-radius: 4px; margin-top: 5px; display: block;">
                </div>`;
        }
        // NOTE: If the data is just a string like 'image2', the server should handle fetching it, 
        // but for now, we'll assume Base64 or 'No image uploaded'
        if (imageData && imageData !== 'image2' && imageData !== 'image5') {
             return `<div><strong>${label}:</strong> Image reference: ${imageData}</div>`;
        }
        return `<div><strong>${label}:</strong> No image uploaded.</div>`;
    };
    
    let html = `
        <h4 class="section-header" style="margin-top: 0; color: var(--dark-bg); border-bottom: none;">
            Profile Summary: ${user.full_name} (ID: ${user.id})
        </h4>

        <h4 class="section-header">📸 Images & Visuals</h4>
        <div class="profile-details">
            ${renderImage('Profile Image', user.profile_image)}
        </div>

        <h4 class="section-header">Demographics & Location</h4>
        <div class="profile-details">
            ${renderField('Email', user.email)}
            ${renderField('Phone', user.phone)}
            ${renderField('First Name', user.first_name)}
            ${renderField('Date of Birth', `${user.birth_day}/${user.birth_month}/${user.birth_year}`)}
            ${renderField('Age', calculateAge(user.birth_year, user.birth_month, user.birth_day))}
            ${renderField('City', user.city)}
            ${renderField('Gender', user.gender)}
            ${renderField('Seeking', user.partner_gender)}
            ${renderField('Marital Status', user.marital_status)}
            ${renderField('Height', user.height)}
            ${renderField('Distance Willing', user.willing_distance)}
        </div>
        
        <h4 class="section-header">Appearance & Preferences</h4>
        <div class="profile-details">
            ${renderField('Appearance Satisfaction', user.appearance_satisfaction)}
            ${renderField('Partner Appearance Imp.', user.partner_appearance_importance)}
            ${renderField('Height Importance', user.height_importance)}
            ${renderField('Age Importance', user.age_importance)}
            ${renderField('Age Ranges', user.age_ranges)}
            ${renderField('Distance Importance', user.distance_importance)}
            ${renderField('Ethnicity', user.ethnic_group)}
            ${renderField('Ethnicity Preferences', user.ethnic_preferences)}
            ${renderField('Ethnicity Importance', user.ethnicity_importance)}
        </div>

        <h4 class="section-header">Education & Finance</h4>
        <div class="profile-details">
            ${renderField('Education Level', user.education_level)}
            ${renderField('Intelligence Importance', user.intelligence_importance)}
            ${renderField('Profession', user.profession)}
            ${renderField('Income Bracket', user.income_bracket)}
            ${renderField('Income Importance', user.income_importance)}
        </div>

        <h4 class="section-header">Beliefs & Lifestyle</h4>
        <div class="profile-details">
            ${renderField('Beliefs', user.beliefs)}
            ${renderField('Religious Preferences', user.religious_preferences)}
            ${renderField('Religion Importance', user.religion_importance)}
            ${renderField('Smoking Frequency', user.smoking_frequency)}
            ${renderField('Partner Smoking Acceptance', user.partner_smoking_acceptance)}
            ${renderField('Smoking Importance', user.smoking_importance)}
            ${renderField('Drinking Frequency', user.drinking_frequency)}
            ${renderField('Partner Drinking Acceptance', user.partner_drinking_acceptance)}
            ${renderField('Drinking Importance', user.drinking_importance)}
        </div>

        <h4 class="section-header">Interests & Activities</h4>
        <div class="profile-details">
            ${renderField('Interests', user.interests)}
            ${renderField('Passionate About', user.passionate_about)}
            ${renderField('Top Free Time Activities', user.top_free_time_activities)}
            ${renderField('Variety Liking', user.variety_liking)}
            ${renderField('Enjoy Activity', user.enjoy_activity)}
        </div>

        <h4 class="section-header">Relationship & Family</h4>
        <div class="profile-details">
            ${renderField('Partner Role', user.partner_role)}
            ${renderField('Relationship Importance', user.relationship_importance)}
            ${renderField('Monogamy Belief', user.monogamy_belief)}
            ${renderField('Willingness to Change', user.willingness_to_change)}
            ${renderField('Sex Desire', user.sex_desire)}
            ${renderField('Children Under 18', user.children_under_18)}
            ${renderField('Imagine Children', user.imagine_children)}
            ${renderField('Accept Partner with Children', user.accept_partner_with_children)}
        </div>
        
        <h4 class="section-header">Date Scenarios</h4>
        <div class="profile-details">
            ${renderField('First Date Activity', user.first_date_activity)}
            ${renderField('First Date Impression', user.first_date_impression)}
            ${renderField('First Kiss Initiation', user.first_kiss_initiation)}
            ${renderField('Meeting Friends', user.meeting_friends)}
            ${renderField('Reconciliation', user.reconciliation)}
            ${renderField('Tardiness Response', user.tardiness_response)}
        </div>
        
        <h4 class="section-header">Personality & Traits</h4>
        <div class="profile-details">
            ${renderField('Ambition Level', user.ambition_level)}
            ${renderField('Optimism Level', user.optimism_level)}
            ${renderField('Responsible', user.responsible)}
            ${renderField('Protective', user.protective)}
            ${renderField('Understanding', user.understanding)}
            ${renderField('Creative', user.creative)}
            ${renderField('Spontaneous', user.spontaneous)}
            ${renderField('Outgoing', user.outgoing)}
            ${renderField('Little Patience', user.little_patience)}
            ${renderField('Get Upset Easily', user.get_upset_easily)}
            ${renderField('Get Stressed Easily', user.get_stressed_easily)}
            ${renderField('Attention to Detail', user.attention_to_detail)}
            ${renderField('Order Consistency', user.order_consistency)}
            ${renderField('Handle Information', user.handle_information)}
            ${renderField('Well Informed', user.well_informed)}
            ${renderField('Accomplish a Lot', user.accomplish_a_lot)}
            ${renderField('Mood Week', user.mood_week)}
            ${renderField('Stressed Picture', user.stressed_picture)}
            ${renderField('Make People Laugh', user.make_people_laugh)}
            ${renderField('Trendy', user.trendy)}
            ${renderField('Athletic', user.athletic)}
        </div>

        <h4 class="section-header">Miscellaneous</h4>
        <div class="profile-details">
            ${renderField('Weekend Plans', user.weekend_plans)}
            ${renderField('Shared Calendar', user.shared_calendar)}
            ${renderField('Time Share', user.time_share)}
            ${renderField('Pattern Preference', user.pattern_preference)}
            ${renderField('Settling In', user.settling_in)}
            ${renderField('Time for Others', user.time_for_others)}
            ${renderField('Do Nice Things', user.do_nice_things)}
            ${renderField('Recharge Help', user.recharge_help)}
            ${renderField('Friend Terms', user.friend_terms)}
            ${renderField('Thankful For', user.thankful_for)}
            ${renderField('How Heard', user.how_heard)}
            ${renderField('Registered On', new Date(user.created_at).toLocaleString())}
        </div>
    `;
    
    container.innerHTML = html;
}
// --- Detail View Logic (UPDATED for Slide-In) ---

function openProfileSidebar() {
    // Adds 'open' class to the sidebar (defined in CSS to slide in)
    document.getElementById('profile-sidebar').classList.add('open');
    // Prevents body scrolling behind the sidebar
    document.body.classList.add('sidebar-open');
}

function closeProfileSidebar() {
    // Removes 'open' class to slide the sidebar out
    document.getElementById('profile-sidebar').classList.remove('open');
    // Re-enables body scrolling
    document.body.classList.remove('sidebar-open');
}

async function loadUserDetail(userId) {
    // Ensure we are viewing the user list section
    showSection('user-management'); 
    
    try {
        const response = await fetch(`${API_URL}/users/${userId}`);
        const user = await response.json();
        
        const detailContent = document.getElementById('profile-detail-content');
        
        // 1. Render the profile content into the sidebar div
        renderFullProfile(user, detailContent);
        
        // 2. Open the sidebar
        openProfileSidebar();
        
    } catch (error) {
        console.error(`Could not fetch details for user ${userId}:`, error);
        document.getElementById('profile-detail-content').innerHTML = `<p style="color:red;">Error loading user ${userId}.</p>`;
        openProfileSidebar(); // Still open to show the error message
    }
}


// --- UI Navigation ---

function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    
    document.getElementById('status-message').style.display = 'none';
    
    // Always close the detail sidebar when switching sections
    closeProfileSidebar();

    if (sectionId === 'matches-list') {
        fetchMatches();
    }
}


// Initialize the dashboard on load
document.addEventListener('DOMContentLoaded', fetchUsers);


// Make essential functions globally available for HTML onclicks
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
window.openProfileSidebar = openProfileSidebar; // EXPORTED
window.closeProfileSidebar = closeProfileSidebar; // EXPORTED

