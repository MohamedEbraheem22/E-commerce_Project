import { login } from './auth.js';
import { getElement } from './utils.js';

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    
    const loginBtn = getElement('#login-btn');
    loginBtn.disabled = true;

    const username = getElement('#username').value.trim();
    const password = getElement('#password').value.trim();

    // Only basic check for empty fields
    if (!username || !password) {
        // Re-enable button
        loginBtn.disabled = false;
        
        // Show general error
        showGeneralError('Please fill in all fields');
        return;
    }

    console.log('Submitting login form:', { username });
    const user = await login(username, password);
    
    if (user) {
        console.log('Login successful, redirecting to home');
        window.location.href = 'home.html';
    } else {
        loginBtn.disabled = false;
        // Show general login error
        showGeneralError('Invalid username or password');
    }
}

// Show general error message
function showGeneralError(message) {
    const formElement = getElement('#login-form');
    if (formElement) {
        // Remove any existing general error
        const existingError = formElement.querySelector('.general-error');
        if (existingError) {
            formElement.removeChild(existingError);
        }
        
        // Create and add new error message
        const generalError = document.createElement('div');
        generalError.className = 'general-error';
        generalError.textContent = message;
        formElement.insertBefore(generalError, formElement.firstChild);
    }
}

// Initialize login form
document.addEventListener('DOMContentLoaded', () => {
    console.log('Login page loaded');
    const loginForm = getElement('#login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    } else {
        console.error('Login form not found');
    }
});
