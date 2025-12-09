// controller/admin_matching.js

function renderPotentialMatches(primaryUser) {
    const listContainer = document.getElementById('potential-matches-content');
    listContainer.innerHTML = '';
    
    // In new schema, this is mapped from partner_single_preferences table
    const requiredGender = primaryUser.partner_gender; 

    const potentialMatches = window.allUsers.filter(user => {
        if (user.id === primaryUser.id) return false;
        if (!requiredGender || requiredGender === 'Any') return true;
        return user.gender === requiredGender; // user.gender comes from user_profile
    });

    if (potentialMatches.length === 0) {
        listContainer.innerHTML = `<p>No users found matching gender: ${requiredGender}.</p>`;
        return;
    }
    
    potentialMatches.forEach(user => {
        const age = calculateAge(user.dob);
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

function selectCandidate(userId) {
    document.querySelectorAll('.match-candidate').forEach(el => el.classList.remove('selected'));
    const selectedElement = document.querySelector(`.match-candidate[data-user-id="${userId}"]`);
    if (selectedElement) selectedElement.classList.add('selected');

    document.getElementById('user-b-id').value = userId;
    loadProfileForComparison('B', true); 
}

// --- Comparison Logic ---

function prefillComparison(userId) {
    showSection('manual-matching'); 
    document.getElementById('user-a-id').value = userId;
    document.getElementById('user-b-id').value = '';
    document.getElementById('profile-b-content').innerHTML = '<p>Select a match...</p>';
    loadProfileForComparison('A');
}

async function loadProfileForComparison(side, isFromSelectCandidate = false) {
    const inputId = document.getElementById(`user-${side.toLowerCase()}-id`).value;
    const contentContainer = document.getElementById(`profile-${side.toLowerCase()}-content`);
    
    if (!inputId) return;

    try {
        const response = await fetch(`/api/users/${inputId}`);
        const user = await response.json();
        
        if (side === 'A') {
            window.userAData = user;
            renderPotentialMatches(user);
        } else {
            window.userBData = user;
        }

        renderFullProfile(user, contentContainer);

    } catch (error) {
        contentContainer.innerHTML = `<p style="color:red;">Error loading user ${inputId}.</p>`;
    }
}

async function suggestMatch() {
    const idA = document.getElementById('user-a-id').value;
    const idB = document.getElementById('user-b-id').value;

    if (!idA || !idB) return displayStatus("Select both users.", 'error');

    if (!confirm(`Match User ${idA} and ${idB}?`)) return;
    
    try {
        const response = await fetch(`/api/matches`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userA: idA, userB: idB })
        });
        
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        displayStatus("Match Created!", 'success');
        document.getElementById('user-a-id').value = '';
        document.getElementById('user-b-id').value = '';
        document.getElementById('profile-a-content').innerHTML = '';
        document.getElementById('profile-b-content').innerHTML = '';
        
    } catch (error) {
        displayStatus(error.message, 'error');
    }
}

async function deleteMatch(matchId) {
    if (!confirm(`Delete match ${matchId}?`)) return;
    try {
        const response = await fetch(`/api/matches/${matchId}`, { method: 'DELETE' });
        if(response.ok) {
            displayStatus("Match Deleted", 'success');
            fetchMatches();
        }
    } catch (error) {
        console.error(error);
    }
}

function viewMatchComparison(idA, idB) {
    showSection('manual-matching'); 
    document.getElementById('user-a-id').value = idA;
    document.getElementById('user-b-id').value = idB;
    loadProfileForComparison('A');
    loadProfileForComparison('B');
}

window.prefillComparison = prefillComparison;
window.loadProfileForComparison = loadProfileForComparison;
window.suggestMatch = suggestMatch;
window.viewMatchComparison = viewMatchComparison;
window.deleteMatch = deleteMatch;
window.renderPotentialMatches = renderPotentialMatches;
window.selectCandidate = selectCandidate;