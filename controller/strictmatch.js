// strictmatch.js (Top Rated Match Logic)

// NOTE: This file relies on global variables (allUsers, API_URL, displayStatus, calculateAge, renderPotentialMatches) 
// and the global function renderFullProfile from admin.js

/**
 * Initiates the search for the top 5 matches for a specific user.
 * This function is triggered by the "Top Rated Match" button in the User List.
 * @param {number} userId - The ID of the primary user to find matches for.
 */
async function findTopRatedMatches(userId) {
    displayStatus(`Searching for Top 5 Matches for User ID ${userId}...`, 'info');
    
    // 1. Fetch the primary user's data (if not already in allUsers)
    const primaryUser = allUsers.find(u => u.id === userId);
    
    if (!primaryUser) {
        // If the user isn't in the global list, fetch their full profile first
        try {
            const response = await fetch(`${API_URL}/users/${userId}`);
            const fetchedUser = await response.json();
            if (!fetchedUser || fetchedUser.error) throw new Error("User not found.");
            
            // Render the profile in the detail sidebar
            const detailContainer = document.getElementById('profile-detail-content');
            renderFullProfile(fetchedUser, detailContainer);
            openProfileSidebar();

            return findTopRatedMatchesInternal(fetchedUser);
        } catch (error) {
            displayStatus(`Error fetching user ${userId} data: ${error.message}`, 'error');
            return;
        }
    }
    
    // Render the profile in the detail sidebar
    const detailContainer = document.getElementById('profile-detail-content');
    renderFullProfile(primaryUser, detailContainer);
    openProfileSidebar();

    return findTopRatedMatchesInternal(primaryUser);
}

/**
 * Internal function to handle the strict matching calculation and display.
 * @param {object} primaryUser - The user object to match against.
 */
function findTopRatedMatchesInternal(primaryUser) {
    const scoredCandidates = [];

    // --- Primary User Criteria ---
    const requiredGender = primaryUser.partner_gender;
    const [minAgeStr, maxAgeStr] = (primaryUser.age_ranges || '').split('-').map(s => s.trim());
    const minAge = parseInt(minAgeStr) || 18;
    const maxAge = parseInt(maxAgeStr) || 99;
    const willingDistance = parseInt(primaryUser.willing_distance) || Infinity; // In km/miles
    const ethnicPreferences = (primaryUser.ethnic_preferences || '').split(',').map(e => e.trim().toLowerCase());
    const acceptPartnerChildren = primaryUser.accept_partner_with_children === 'Yes';
    const primaryUserAge = calculateAge(primaryUser.birth_year, primaryUser.birth_month, primaryUser.birth_day);

    // --- Scoring Logic ---
    for (const candidate of allUsers) {
        // Skip self
        if (candidate.id === primaryUser.id) continue;
        
        let score = 0;
        let meetsMinimumCriteria = true;

        // 1. Gender Match (Mandatory, 5 points)
        const candidateGender = candidate.gender;
        if (requiredGender && requiredGender !== 'Any' && requiredGender !== 'Both' && candidateGender !== requiredGender) {
            meetsMinimumCriteria = false;
        } else {
            score += 5;
        }

        // 2. Age Range Match (Mandatory)
        const candidateAge = calculateAge(candidate.birth_year, candidate.birth_month, candidate.birth_day);
        if (candidateAge === 'N/A' || candidateAge < minAge || candidateAge > maxAge) {
            meetsMinimumCriteria = false;
        }

        // 3. Willing Distance (Mandatory, no scoring, distance calculation not available)
        // Since we don't have location data or a distance calculation helper, 
        // we'll rely on the 'city' match for a proxy score.
        if (candidate.city === primaryUser.city) {
            score += 3; // Bonus for same city
        }
        
        // 4. Partner with Children (Mandatory)
        const candidateHasChildren = candidate.children_under_18 === 'Yes';
        if (candidateHasChildren && !acceptPartnerChildren) {
             meetsMinimumCriteria = false;
        }
        
        // 5. Ethnicity Preference (Scored, 4 points)
        const candidateEthnicity = (candidate.ethnic_group || '').toLowerCase();
        if (ethnicPreferences.length > 0 && ethnicPreferences[0] !== 'any' && ethnicPreferences.includes(candidateEthnicity)) {
            score += 4;
        }

        // --- Final Check and Aggregate ---
        if (meetsMinimumCriteria) {
            // Additional bonus points (Example: same education level)
            if (candidate.education_level === primaryUser.education_level) {
                score += 2;
            }
            // Add to candidates list
            scoredCandidates.push({ user: candidate, score: score });
        }
    }

    // Sort by score (highest first)
    scoredCandidates.sort((a, b) => b.score - a.score);

    // Get top 5
    const top5Matches = scoredCandidates.slice(0, 5);

    // --- Display Results ---
    const resultHtml = top5Matches.map((item, index) => {
        const user = item.user;
        const age = calculateAge(user.birth_year, user.birth_month, user.birth_day);
        return `
            <div class="match-candidate" onclick="loadComparisonFromStrictMatch(${primaryUser.id}, ${user.id})">
                <strong>#${index + 1} Match - Score: ${item.score}</strong><br>
                ${user.full_name} (ID: ${user.id})<br>
                ${user.gender}, ${age} - ${user.city}
            </div>
        `;
    }).join('');

    const statusMessage = `Found ${top5Matches.length} Top Matches for **${primaryUser.full_name}** (ID: ${primaryUser.id}). Max Score: ${scoredCandidates.length > 0 ? scoredCandidates[0].score : 0}`;

    // Update the detail sidebar content with the top matches list
    const detailContainer = document.getElementById('profile-detail-content');
    detailContainer.innerHTML = `
        <h3 style="color: var(--primary-color); border-bottom: 2px solid var(--primary-color); padding-bottom: 10px;">
            🥇 Top 5 Matches for ${primaryUser.full_name}
        </h3>
        <p>Click a candidate below to load them into the Manual Matching (A & B) slots for comparison.</p>
        <div id="top-matches-list" style="max-height: 70vh; overflow-y: auto; padding-top: 10px;">
            ${top5Matches.length > 0 ? resultHtml : '<p>No eligible matches found based on strict criteria.</p>'}
        </div>
    `;

    displayStatus(statusMessage, 'success');
}

/**
 * New helper function to handle the click from the Top Match sidebar list.
 * It transitions to the comparison view and loads both profiles.
 * @param {number} idA - The ID of the primary user (the one the match was run for).
 * @param {number} idB - The ID of the selected potential match.
 */
function loadComparisonFromStrictMatch(idA, idB) {
    // 1. Close the detail sidebar
    closeProfileSidebar(); 
    
    // 2. Switch to the Manual Matching section
    showSection('manual-matching'); 

    // 3. Set the IDs in the input fields
    document.getElementById('user-a-id').value = idA;
    document.getElementById('user-b-id').value = idB;

    // 4. Load the profiles for comparison (defined in admin_matching.js)
    loadProfileForComparison('A');
    loadProfileForComparison('B');
    
    // 5. Highlight the selected candidate in the potential matches list (if generated)
    highlightCandidate(idB);
}


// Make globally available
window.findTopRatedMatches = findTopRatedMatches;
window.loadComparisonFromStrictMatch = loadComparisonFromStrictMatch;