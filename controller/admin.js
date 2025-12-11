// controller/admin.js

// ================================================
//  GLOBAL CONFIG
// ================================================
const API_URL = "/api"; 

let allUsers = []; 
let userAData = null; 
let userBData = null; 


// ================================================
//  UTILITY FUNCTIONS
// ================================================
function calculateAge(dobString) {
    if (!dobString) return 'N/A';

    const birthDate = new Date(dobString);
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
    if (!statusDiv) return;

    statusDiv.textContent = message;
    statusDiv.style.display = 'block';

    statusDiv.style.backgroundColor = type === 'success' ? '#d4edda' : '#f8d7da';
    statusDiv.style.color = type === 'success' ? '#155724' : '#721c24';
    statusDiv.style.borderColor = type === 'success' ? '#c3e6cb' : '#f5c6cb';

    setTimeout(() => { statusDiv.style.display = 'none'; }, 4000);
}


// ================================================
//  USERS
// ================================================
async function fetchUsers() {
    try {
        const tbody = document.getElementById('users-tbody');
        tbody.innerHTML = '<tr><td colspan="8">Fetching user data...</td></tr>';

        const response = await fetch(`${API_URL}/users`);
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

function renderUserList(usersToRender) {
    const tbody = document.getElementById('users-tbody');
    tbody.innerHTML = '';

    if (usersToRender.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">No registered users found.</td></tr>';
        return;
    }

    usersToRender.forEach(user => {
        const age = calculateAge(user.dob);
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


// ================================================
//  MATCHES
// ================================================
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
        tbody.innerHTML = '<tr><td colspan="5">Failed to load matches.</td></tr>';
        displayStatus("Failed to load matches list.", 'error');
    }
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


// ================================================
//  SEARCH + FILTER
// ================================================
function filterUsers() {
    const searchInput = document.getElementById('search-input').value.toLowerCase();
    const filteredUsers = allUsers.filter(user =>
        (user.full_name && user.full_name.toLowerCase().includes(searchInput)) ||
        (user.email && user.email.toLowerCase().includes(searchInput))
    );
    renderUserList(filteredUsers);
}


// ================================================
//  UI NAVIGATION
// ================================================
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section =>
        section.classList.remove('active')
    );
    document.getElementById(sectionId).classList.add('active');

    document.getElementById('status-message').style.display = 'none';

    if (sectionId === 'matches-list') fetchMatches();
}


// ================================================
//  GLOBAL EXPORTS (for onclick="...")
// ================================================
window.API_URL = API_URL;
window.allUsers = allUsers;
window.userAData = userAData;
window.userBData = userBData;

window.calculateAge = calculateAge;
window.displayStatus = displayStatus;
window.showSection = showSection;

window.calculateAge = calculateAge;
window.displayStatus = displayStatus;
window.showSection = showSection;

window.fetchUsers = fetchUsers;
window.fetchMatches = fetchMatches;
window.renderUserList = renderUserList;
window.renderMatchesList = renderMatchesList;
window.filterUsers = filterUsers;


// ================================================
//  AUTO-INITIALIZATION
// ================================================
document.addEventListener("DOMContentLoaded", () => {
    fetchUsers();
    fetchMatches();   // ← You were missing this
});
