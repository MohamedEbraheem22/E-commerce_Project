import { getCurrentUser, logout } from './auth.js';
import { getElement } from './utils.js';

// API base URL
const API_URL = 'http://localhost:3000';

// Load the user's profile
async function loadProfile() {
    const user = getCurrentUser();
    if (!user) {
        alert('Please log in to view your profile.');
        window.location.href = 'login.html';
        return;
    }

    const profileForm = getElement('#profile-form');
    const logoutBtn = getElement('#logout-btn');

    if (!profileForm || !logoutBtn) {
        console.error('Profile elements not found');
        return;
    }

    try {
        // Populate form with user data
        getElement('#firstName').value = user.firstName;
        getElement('#lastName').value = user.lastName;
        getElement('#email').value = user.email;
        getElement('#username').value = user.username;

        // Handle form submission
        profileForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            // Validate inputs
            const firstName = getElement('#firstName').value.trim();
            const lastName = getElement('#lastName').value.trim();
            const email = getElement('#email').value.trim();
            const username = getElement('#username').value.trim();
            const password = getElement('#password').value.trim();

            if (!firstName || !lastName || !email || !username) {
                alert('All fields except password are required.');
                return;
            }

            const updatedUser = {
                id: user.id,
                firstName,
                lastName,
                email,
                username,
                password: password || user.password, // Retain existing password if not updated
                role: user.role
            };

            try {
                console.log(`Updating user ${user.id} with data:`, updatedUser);
                const response = await fetch(`${API_URL}/users/${user.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedUser)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to update profile: ${response.status} ${errorText}`);
                }

                const updatedUserData = await response.json();
                localStorage.setItem('currentUser', JSON.stringify(updatedUserData));
                alert('Profile updated successfully!');
                window.location.reload();
            } catch (error) {
                console.error('Profile update error:', error.message);
                alert(`Error: ${error.message}`);
            }
        });

        // Handle logout
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to log out?')) {
                logout();
                window.location.href = 'login.html';
            }
        });
    } catch (error) {
        console.error('Profile load error:', error.message);
        profileForm.innerHTML = '<p>Sorry, could not load profile.</p>';
    }
}

// Run when the page loads
document.addEventListener('DOMContentLoaded', loadProfile);