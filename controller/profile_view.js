// controller/profile_view.js

// ---------------------------------------------------------
// 1. ROBUST DATE FORMATTER & UTILITIES
// ---------------------------------------------------------
function formatDate(dateInput) {
    if (!dateInput) return 'N/A';

    // The MySQL driver often returns a JS Date object directly.
    const date = (dateInput instanceof Date) ? dateInput : new Date(dateInput);

    // Check if valid
    if (isNaN(date.getTime())) return 'N/A';
    
    // Check for "zero" date, which often indicates null data
    if (date.getFullYear() === 1900 || date.getFullYear() < 1900) return 'N/A';

    // Format: "Month Day, Year" (e.g., January 15, 1990)
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/** Safely retrieves a value, falling back to '-' if null/undefined/empty string. */
function safe(value, fallback = '-') {
    if (value === null || value === undefined || value === 'null' || value === '') return fallback;
    return value;
}

// ---------------------------------------------------------
// 2. SIDEBAR TOGGLES
// ---------------------------------------------------------
function openProfileSidebar() {
    const sidebar = document.getElementById('profile-sidebar');
    if (sidebar) sidebar.classList.add('open');
}

function closeProfileSidebar() {
    const sidebar = document.getElementById('profile-sidebar');
    if (sidebar) sidebar.classList.remove('open');
}

// ---------------------------------------------------------
// 3. LOAD USER DETAIL (Triggered by "View" button)
// ---------------------------------------------------------
async function loadUserDetail(userId) {
    const container = document.getElementById('profile-detail-content');
    container.innerHTML = '<div style="text-align:center; padding:20px;">Loading full profile...</div>';
    
    openProfileSidebar(); // Slide out immediately

    try {
        const url = window.API_URL || "/api";
        const response = await fetch(`${url}/users/${userId}`);
        const user = await response.json();

        if (user.message) throw new Error(user.message);

        // Store current user data globally for other modules (like strictmatch)
        window.currentViewingUser = user; 
        
        renderFullProfile(user, container);
    } catch (error) {
        console.error("Load User Detail Error:", error);
        container.innerHTML = `<p style="color:red; padding:20px;">Failed to load user: ${error.message}. Check browser console for details.</p>`;
    }
}

// ---------------------------------------------------------
// 4. RENDER FULL PROFILE (Sidebar AND Comparison)
// ---------------------------------------------------------
function renderFullProfile(user, container) {
    if (!user) {
        container.innerHTML = '<p>Profile data not available.</p>';
        return;
    }

    // Default Image
    const imgSrc = safe(user.profile_photo_base64) !== '-'
        ? user.profile_photo_base64
        : 'assets/img/default-avatar.png'; // Use a default image path

    const age = window.calculateAge ? window.calculateAge(user.dob) : 'N/A';

    const html = `
        <div class="profile-header-card" style="text-align:center; padding: 20px; border-bottom: 1px solid #eee;">
            <img src="${imgSrc}" style="width:120px; height:120px; border-radius:50%; object-fit:cover; border: 3px solid #0056b3;" />
            <h2>${safe(user.full_name)}</h2>
            <p><strong>ID:</strong> ${user.id} | <strong>Plan:</strong> ${safe(user.pricing_plan, 'Free')}</p>
            <p>${safe(user.email)} | ${safe(user.phone)}</p>
        </div>

        <div class="profile-body" style="padding: 20px;">
            <h4 style="color:#0056b3; margin-top:0;">Basic Info</h4>
            <table style="width:100%; border-collapse: collapse;">
                <tr><td style="padding:4px 0; width: 40%;"><strong>Gender:</strong></td><td>${safe(user.gender)}</td></tr>
                <tr><td style="padding:4px 0;"><strong>DOB:</strong></td><td>${formatDate(user.dob)} (${age} years old)</td></tr>
                <tr><td style="padding:4px 0;"><strong>City:</strong></td><td>${safe(user.city)}</td></tr>
                <tr><td style="padding:4px 0;"><strong>Marital Status:</strong></td><td>${safe(user.marital_status)}</td></tr>
                <tr><td style="padding:4px 0;"><strong>Children:</strong></td><td>${safe(user.children_in_household)}</td></tr>
            </table>
            
            <h4 style="color:#0056b3; margin-top:20px;">Background & Values</h4>
            <p><strong>Education:</strong> ${safe(user.education_level)}</p>
            <p><strong>Profession:</strong> ${safe(user.profession)}</p>
            <p><strong>Ethnicity:</strong> ${safe(user.ethnicity)}</p>
            <p><strong>Beliefs:</strong> ${safe(user.beliefs)}</p>
            <p><strong>Height:</strong> ${user.height ? user.height + ' cm' : safe(user.height)}</p>

            <h4 style="color:#0056b3; margin-top:20px;">Habits & Traits</h4>
            <p><strong>Smoking:</strong> ${safe(user.smoking_habit)}</p>
            <p><strong>Drinking:</strong> ${safe(user.drinking_habit)}</p>
            <p><strong>Reconcile Style:</strong> ${safe(user.reconcile_style)}</p>
            <p><strong>Willingness to Change:</strong> ${safe(user.willingness_change)}</p>
            
            <h4 style="color:#0056b3; margin-top:20px;">Interests & Personality</h4>
            <p><strong>Interests:</strong> ${safe(user.interests)}</p>
            <p><strong>Passions:</strong> ${safe(user.passionate_about)}</p>
            <p><strong>Thankful For:</strong> ${safe(user.thankful_for)}</p>
            <p><strong>Free Time:</strong> ${safe(user.top_free_time_activities)}</p> 

            <h4 style="color:#0056b3; margin-top:20px;">Partner Preferences</h4>
            <p><strong>Seeking Gender:</strong> ${safe(user.partner_gender)}</p>
            <p><strong>Age Range:</strong> ${safe(user.age_ranges)}</p>
            <p><strong>Preferred Ethnicity:</strong> ${safe(user.ethnic_preferences)}</p>
            <p><strong>Max Distance:</strong> ${safe(user.willing_distance)}</p>
        </div>
    `;

    container.innerHTML = html;
}

// Expose globally
window.loadUserDetail = loadUserDetail;
window.renderFullProfile = renderFullProfile;
window.openProfileSidebar = openProfileSidebar;
window.closeProfileSidebar = closeProfileSidebar;