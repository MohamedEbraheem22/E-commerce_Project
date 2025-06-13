// API base URL
const API_URL = 'http://localhost:3000';

// Helper function for API calls with retry
async function fetchWithRetry(url, options = {}, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            return response;
        } catch (error) {
            if (i === retries - 1) throw error;
            console.warn(`Retry ${i + 1} for ${url}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

// Log in a user
export async function login(username, password) {
    try {
        console.log(`Attempting login for username: ${username}`);
        const response = await fetchWithRetry(`${API_URL}/users?username=${username}&password=${password}`);
        const users = await response.json();
        if (users.length === 0) throw new Error('Invalid username or password');
        const user = users[0];
        localStorage.setItem('currentUser', JSON.stringify(user));
        console.log('User logged in:', user);
        updateNavigation();
        return user;
    } catch (error) {
        console.error('Login error:', error.message);
        alert(`Login failed: ${error.message}`);
        return null;
    }
}

// Register a new user
export async function register(user) {
    try {
        console.log('Attempting registration:', user);
        const checkResponse = await fetchWithRetry(`${API_URL}/users?username=${user.username}`);
        const existingUsers = await checkResponse.json();
        if (existingUsers.length > 0) throw new Error('Username already taken');
        const response = await fetchWithRetry(`${API_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });
        const newUser = await response.json();
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        console.log('User registered:', newUser);
        updateNavigation();
        return newUser;
    } catch (error) {
        console.error('Register error:', error.message);
        alert(`Registration failed: ${error.message}`);
        return null;
    }
}

// Update user profile
export async function updateProfile(user) {
    try {
        console.log('Updating profile:', user);
        const response = await fetchWithRetry(`${API_URL}/users/${user.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });
        const updatedUser = await response.json();
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        console.log('Profile updated:', updatedUser);
        updateNavigation();
        return updatedUser;
    } catch (error) {
        console.error('Update profile error:', error.message);
        alert('Failed to update profile');
        return null;
    }
}

// Log out the user
export function logout() {
    console.log('Logging out user');
    localStorage.removeItem('currentUser');
    updateNavigation();
    window.location.href = 'login.html';
}

// Get the current user
export function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser'));
}

// Restrict cart/orders for admins/sellers
export function restrictCartAndOrders() {
    const user = getCurrentUser();
    if (user && (user.role === 'admin' || user.role === 'seller')) {
        const buttons = document.querySelectorAll('.add-to-cart, #checkout-btn');
        buttons.forEach(button => button.style.display = 'none');
    }
}

// Update navigation based on user status
export function updateNavigation() {
    const nav = document.querySelector('nav');
    if (!nav) {
        console.warn('Navigation element not found');
        return;
    }

    const user = getCurrentUser();
    console.log('Updating navigation, user:', user);
    nav.innerHTML = `
        <a href="home.html">Home</a>
        <a href="products.html">Products</a>
        ${user && user.role === 'customer' ? '<a href="cart.html">Cart</a>' : ''}
        ${user && user.role === 'customer' ? '<a href="orders.html">Orders</a>' : ''}
        ${user ? '<a href="profile.html">Profile</a>' : ''}
        ${user && (user.role === 'admin' || user.role === 'seller') ? '<a href="dashboard.html">Dashboard</a>' : ''}
        ${user ? '<a href="#" id="logout">Logout</a>' : '<a href="login.html">Login</a>'}
        ${!user ? '<a href="register.html">Register</a>' : ''}
    `;

    // Attach logout event listener
    const logoutLink = document.querySelector('#logout');
    if (logoutLink) {
        logoutLink.addEventListener('click', (event) => {
            event.preventDefault();
            console.log('Logout clicked');
            logout();
        });
    }
}

// Initialize navigation on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing navigation');
    updateNavigation();
});