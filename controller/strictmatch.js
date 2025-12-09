// controller/strictmatch.js

async function findTopRatedMatches(userId) {
    displayStatus(`Searching for matches for User ID ${userId}...`, 'info');
    
    // We must fetch full profile to get preferences (prefs are not in the main table list)
    try {
        const response = await fetch(`/api/users/${userId}`);
        const primaryUser = await response.json();
        
        if (!primaryUser || primaryUser.error) throw new Error("User not found.");

        const detailContainer = document.getElementById('profile-detail-content');
        renderFullProfile(primaryUser, detailContainer);
        openProfileSidebar();

        findTopRatedMatchesInternal(primaryUser);

    } catch (error) {
        displayStatus(`Error fetching user data: ${error.message}`, 'error');
    }
}

function findTopRatedMatchesInternal(primaryUser) {
    const scoredCandidates = [];

    // --- Criteria Extraction ---
    const requiredGender = primaryUser.partner_gender;
    
    // Parse "25-30" or similar strings. 
    // New schema stores ranges in user_age_preferences. Our backend returns them joined as "18-25, 25-30"
    let minAge = 18, maxAge = 99;
    
    // Simple logic to find absolute min/max from comma string like "20-25, 26-30"
    if (primaryUser.age_ranges) {
        const numbers = primaryUser.age_ranges.match(/\d+/g);
        if (numbers) {
            const parsed = numbers.map(n => parseInt(n));
            minAge = Math.min(...parsed);
            maxAge = Math.max(...parsed);
        }
    }

    const ethnicPreferences = (primaryUser.ethnic_preferences || '').toLowerCase();
    
    for (const candidate of window.allUsers) {
        if (candidate.id === primaryUser.id) continue;
        
        let score = 0;
        let meetsMinimumCriteria = true;

        // 1. Gender Match (Mandatory)
        if (requiredGender && requiredGender !== 'Any' && candidate.gender !== requiredGender) {
            meetsMinimumCriteria = false;
        } else {
            score += 5;
        }

        // 2. Age Match (Mandatory)
        const candidateAge = calculateAge(candidate.dob);
        if (candidateAge < minAge || candidateAge > maxAge) {
            meetsMinimumCriteria = false;
        }

        // 3. City Match
        if (candidate.city && primaryUser.city && candidate.city === primaryUser.city) {
            score += 3;
        }

        // 4. Ethnicity Match
        const candEthnicity = (candidate.ethnicity || '').toLowerCase();
        if (ethnicPreferences.includes(candEthnicity)) {
            score += 4;
        }

        if (meetsMinimumCriteria) {
            scoredCandidates.push({ user: candidate, score: score });
        }
    }

    scoredCandidates.sort((a, b) => b.score - a.score);
    const top5Matches = scoredCandidates.slice(0, 5);

    const resultHtml = top5Matches.map((item, index) => {
        const user = item.user;
        const age = calculateAge(user.dob);
        return `
            <div class="match-candidate" onclick="loadComparisonFromStrictMatch(${primaryUser.id}, ${user.id})">
                <strong>#${index + 1} Match - Score: ${item.score}</strong><br>
                ${user.full_name}<br>
                ${user.gender}, ${age} - ${user.city}
            </div>
        `;
    }).join('');

    const outputHtml = `
        <h3 style="color: #0056b3; border-bottom: 2px solid #ddd; margin-top: 20px;">
            🥇 Suggested Matches
        </h3>
        <div id="top-matches-list">
            ${top5Matches.length > 0 ? resultHtml : '<p>No eligible matches found.</p>'}
        </div>
    `;
    
    // Append to existing profile view
    document.getElementById('profile-detail-content').insertAdjacentHTML('beforeend', outputHtml);
}

function loadComparisonFromStrictMatch(idA, idB) {
    closeProfileSidebar(); 
    showSection('manual-matching'); 
    document.getElementById('user-a-id').value = idA;
    document.getElementById('user-b-id').value = idB;
    loadProfileForComparison('A');
    loadProfileForComparison('B');
}

window.findTopRatedMatches = findTopRatedMatches;
window.loadComparisonFromStrictMatch = loadComparisonFromStrictMatch;