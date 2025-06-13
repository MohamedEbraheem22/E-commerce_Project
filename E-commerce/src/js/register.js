import { register } from "./auth.js";
import { getElement } from "./utils.js";

// Validation functions
function validateName(name, minLength = 3) {
  if (!name) return "This field is required";
  if (name.length < minLength) return `Must be at least ${minLength} characters`;
  return "";
}

function validateEmail(email) {
  if (!email) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email";
  return "";
}

function validateUsername(username) {
  if (!username) return "Username is required";
  if (username.length < 3) return "Username must be at least 3 characters";
  return "";
}

function validatePassword(password) {
  if (!password) return "Password is required";
  if (password.length < 6) return "Password must be at least 6 characters";
  if (!/[a-zA-Z]/.test(password)) return "Password must contain at least one letter";
  return "";
}

function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword) return "Please confirm your password";
  if (password !== confirmPassword) return "Passwords do not match";
  return "";
}

// Show error message
function showError(fieldId, message) {
  const errorElement = getElement(`#${fieldId}-error`);
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = message ? "block" : "none";
    
    // Add error class to input
    const inputElement = getElement(`#${fieldId}`);
    if (inputElement) {
      if (message) {
        inputElement.classList.add("input-error");
      } else {
        inputElement.classList.remove("input-error");
      }
    }
  }
}

// Setup field validation on blur
function setupFieldValidation() {
  // First Name validation
  const firstNameInput = getElement("#firstName");
  firstNameInput.addEventListener("blur", () => {
    const error = validateName(firstNameInput.value.trim());
    showError("firstName", error);
  });

  // Last Name validation
  const lastNameInput = getElement("#lastName");
  lastNameInput.addEventListener("blur", () => {
    const error = validateName(lastNameInput.value.trim());
    showError("lastName", error);
  });

  // Email validation
  const emailInput = getElement("#email");
  emailInput.addEventListener("blur", () => {
    const error = validateEmail(emailInput.value.trim());
    showError("email", error);
  });

  // Username validation
  const usernameInput = getElement("#username");
  usernameInput.addEventListener("blur", () => {
    const error = validateUsername(usernameInput.value.trim());
    showError("username", error);
  });

  // Password validation
  const passwordInput = getElement("#password");
  passwordInput.addEventListener("blur", () => {
    const error = validatePassword(passwordInput.value.trim());
    showError("password", error);
    
    // Also validate confirm password if it has a value
    const confirmPasswordInput = getElement("#confirmPassword");
    if (confirmPasswordInput.value.trim()) {
      const confirmError = validateConfirmPassword(
        passwordInput.value.trim(),
        confirmPasswordInput.value.trim()
      );
      showError("confirmPassword", confirmError);
    }
  });

  // Confirm Password validation
  const confirmPasswordInput = getElement("#confirmPassword");
  confirmPasswordInput.addEventListener("blur", () => {
    const error = validateConfirmPassword(
      passwordInput.value.trim(),
      confirmPasswordInput.value.trim()
    );
    showError("confirmPassword", error);
  });
}

// Validate all fields
function validateForm() {
  const firstName = getElement("#firstName").value.trim();
  const lastName = getElement("#lastName").value.trim();
  const email = getElement("#email").value.trim();
  const username = getElement("#username").value.trim();
  const password = getElement("#password").value.trim();
  const confirmPassword = getElement("#confirmPassword").value.trim();

  // Validate each field
  const firstNameError = validateName(firstName);
  const lastNameError = validateName(lastName);
  const emailError = validateEmail(email);
  const usernameError = validateUsername(username);
  const passwordError = validatePassword(password);
  const confirmPasswordError = validateConfirmPassword(password, confirmPassword);

  // Show errors
  showError("firstName", firstNameError);
  showError("lastName", lastNameError);
  showError("email", emailError);
  showError("username", usernameError);
  showError("password", passwordError);
  showError("confirmPassword", confirmPasswordError);

  // Return true if no errors
  return !(
    firstNameError ||
    lastNameError ||
    emailError ||
    usernameError ||
    passwordError ||
    confirmPasswordError
  );
}

// Handle registration form submission
async function handleRegister(event) {
  event.preventDefault();
  
  // Validate all fields
  if (!validateForm()) {
    return;
  }
  
  const registerBtn = getElement("#register-btn");
  registerBtn.disabled = true;

  const firstName = getElement("#firstName").value.trim();
  const lastName = getElement("#lastName").value.trim();
  const email = getElement("#email").value.trim();
  const username = getElement("#username").value.trim();
  const password = getElement("#password").value.trim();
  const role = getElement("#role").value || "customer";

  const user = {
    firstName,
    lastName,
    email,
    username,
    password,
    role,
  };

  console.log("Submitting registration form:", user);
  const newUser = await register(user);
  if (newUser) {
    console.log("Registration successful, redirecting to home");
    window.location.href = "home.html";
  } else {
    registerBtn.disabled = false;
  }
}

// Initialize registration form
document.addEventListener("DOMContentLoaded", () => {
  console.log("Register page loaded");
  const registerForm = getElement("#register-form");
  if (registerForm) {
    setupFieldValidation();
    registerForm.addEventListener("submit", handleRegister);
  } else {
    console.error("Register form not found");
  }
});
