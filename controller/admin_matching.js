// admin_matching.js (COMPARISON & MATCHING)

// IMPORTANT: This file relies on global variables (API_URL, allUsers, userAData, userBData) 
// and functions (displayStatus, renderFullProfile, showSection, fetchMatches, calculateAge) defined in admin.js

// --- List Panel Logic ---

/**
 * Renders a list of users whose 'gender' matches the 'partner_gender' of the primary user.
 * @param {object} primaryUser - The user loaded into the A slot.
 */
function renderPotentialMatches(primaryUser) {
    const listContainer = document.getElementById('potential-matches-content');
    listContainer.innerHTML = '';
    
    const requiredGender = primaryUser.partner_gender;
    if (!requiredGender || requiredGender === 'Any') {
        document.getElementById('potential-matches-list').querySelector('h3').textContent = 'Potential Matches (All Users)';
    } else {
        document.getElementById('potential-matches-list').querySelector('h3').textContent = `Potential Matches (Seeking: ${requiredGender})`;
    }


    const potentialMatches = allUsers.filter(user => {
        if (user.id === primaryUser.id) return false;
        if (requiredGender === 'Any') return true;
        if (requiredGender === 'Both') return true; 
        return user.gender === requiredGender;
    });

    if (potentialMatches.length === 0) {
        listContainer.innerHTML = `<p>No users found matching the required gender: ${requiredGender}.</p>`;
        return;
    }
    
    potentialMatches.forEach(user => {
        const age = calculateAge(user.birth_year, user.birth_month, user.birth_day);
        const div = document.createElement('div');
        div.className = 'match-candidate';
        div.innerHTML = `
            <strong>${user.full_name}</strong> (ID: ${user.id})<br>
            ${user.gender}, ${age} - ${user.city}
        `;
        div.setAttribute('data-user-id', user.id);
        div.onclick = () => selectCandidate(user.id);
        listContainer.appendChild(div);
    });
}

/**
 * Helper function to apply the 'selected' class (Fix for "blinking" issue).
 * @param {number} userId - The ID of the selected user.
 */
function highlightCandidate(userId) {
    document.querySelectorAll('.match-candidate').forEach(el => el.classList.remove('selected'));

    const selectedElement = document.querySelector(`.match-candidate[data-user-id="${userId}"]`);
    if (selectedElement) {
        selectedElement.classList.add('selected');
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

/**
 * Handles the click event on a potential match candidate.
 * @param {number} userId - The ID of the selected user.
 */
function selectCandidate(userId) {
    highlightCandidate(userId);

    document.getElementById('user-b-id').value = userId;
    
    // Flag set to true to prevent recursive highlighting inside loadProfileForComparison
    loadProfileForComparison('B', true); 
}


// --- Comparison Logic ---

/**
 * Loads a user into the A slot and clears the B slot. Used by the "Compare" button in User List
 * and the helper function from strictmatch.js.
 */
function prefillComparison(userId) {
    showSection('manual-matching'); 

    const userAInput = document.getElementById('user-a-id');
    const userBInput = document.getElementById('user-b-id');

    userAInput.value = userId;
    loadProfileForComparison('A');
    
    userBInput.value = '';
    // TARGET UPDATE: Clear the new content wrapper for User B
    document.getElementById('profile-b-content').innerHTML = '<p>Load a user by ID or select one from the list.</p>';
    window.userBData = null;
}

/**
 * Fetches and renders a single profile into the comparison card content wrapper.
 */
async function loadProfileForComparison(side, isFromSelectCandidate = false) {
    const inputId = document.getElementById(`user-${side.toLowerCase()}-id`).value;
    
    // NEW: Define and get the specific content container ID (for scrolling)
    const contentContainerId = `profile-${side.toLowerCase()}-content`;
    const contentContainer = document.getElementById(contentContainerId);
    
    if (!inputId) {
        contentContainer.innerHTML = `<p>Please enter a User ID.</p>`;
        
        if (side === 'A') {
            document.getElementById('potential-matches-content').innerHTML = '<p>Load User A to populate this list.</p>';
            window.userAData = null;
        }
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/users/${inputId}`);
        const user = await response.json();
        
        // Store data globally.
        if (side === 'A') {
            window.userAData = user;
            // Regenerate the list based on User A's preferences
            renderPotentialMatches(user);
        } else if (side === 'B') {
            window.userBData = user;
            
            if (!isFromSelectCandidate) {
                 highlightCandidate(user.id); 
            }
        }

        // Pass the scrollable content container to renderFullProfile
        renderFullProfile(user, contentContainer);

    } catch (error) {
        console.error(`Could not fetch comparison profile for user ${inputId}:`, error);
        // Set error message in the scrollable content container
        contentContainer.innerHTML = `<p style="color:red;">Error loading user ID ${inputId}.</p>`;
        
        if (side === 'A') {
            window.userAData = null;
            document.getElementById('potential-matches-content').innerHTML = '<p style="color:red;">Error loading User A.</p>';
        } else if (side === 'B') {
            window.userBData = null;
        }
    }
}


/**
 * Sends API call to create a match and handles success/error.
 */
async function suggestMatch() {
    const idA = document.getElementById('user-a-id').value;
    const idB = document.getElementById('user-b-id').value;

    if (!idA || !idB || !window.userAData || !window.userBData) {
        displayStatus("Please load and verify both User A and User B profiles first.", 'error');
        return;
    }
    
    if (idA === idB) {
        displayStatus("Cannot match a user to themselves.", 'error');
        return;
    }

    if (!confirm(`Confirm manual match between User ${idA} (${window.userAData.full_name}) and User ${idB} (${window.userBData.full_name})?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/matches`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userA: idA, userB: idB })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Failed to create match on the server.');
        }

        displayStatus(`Match created successfully between ${window.userAData.full_name} and ${window.userBData.full_name}!`, 'success');

        // Clear the comparison area after a successful match
        document.getElementById('user-a-id').value = '';
        document.getElementById('user-b-id').value = '';
        
        // Clear the new scrollable content wrappers
        document.getElementById('profile-a-content').innerHTML = '<p>Load a user by ID.</p>';
        document.getElementById('profile-b-content').innerHTML = '<p>Load a user by ID or select one from the list.</p>';
        document.getElementById('potential-matches-content').innerHTML = '<p>Load User A to populate this list.</p>';
        
        window.userAData = null;
        window.userBData = null;
        
        if (document.getElementById('matches-list').classList.contains('active')) {
            fetchMatches(); // fetchMatches is defined in admin.js
        }

    } catch (error) {
        console.error("Match creation error:", error);
        displayStatus(`Match failed: ${error.message}`, 'error');
    }
}

/**
 * Switches to comparison view and loads the two users from a match.
 */
function viewMatchComparison(idA, idB) {
    showSection('manual-matching'); 
    
    document.getElementById('user-a-id').value = idA;
    document.getElementById('user-b-id').value = idB;

    loadProfileForComparison('A');
    loadProfileForComparison('B');
}

/**
 * Sends API call to delete a match and handles UI refresh.
 */
async function deleteMatch(matchId) {
    if (!confirm(`Are you sure you want to permanently delete match ID ${matchId}? This action cannot be undone.`)) {
        return;
    }
    
    try {
        // Send the DELETE request to the backend API
        const response = await fetch(`${API_URL}/api/matches/${matchId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Server error occurred.' }));
            throw new Error(errorData.message || `Failed to delete match. Status: ${response.status}`);
        }

        displayStatus(`Match ID ${matchId} was successfully deleted.`, 'success');
        fetchMatches(); 

    } catch (error) {
        console.error("Match deletion error:", error);
        displayStatus(`Deletion failed: ${error.message}`, 'error');
    }
}

// Make essential functions globally available for HTML onclicks
window.prefillComparison = prefillComparison;
window.loadProfileForComparison = loadProfileForComparison;
window.suggestMatch = suggestMatch;
window.viewMatchComparison = viewMatchComparison;
window.deleteMatch = deleteMatch;
window.renderPotentialMatches = renderPotentialMatches;
window.selectCandidate = selectCandidate;
window.highlightCandidate = highlightCandidate;