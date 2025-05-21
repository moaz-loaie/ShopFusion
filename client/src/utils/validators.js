// File: client/src/utils/validators.js

// Basic email validation regex (adjust as needed for stricter rules)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (email) => {
  if (!email) return 'Email is required.';
  if (!EMAIL_REGEX.test(email)) return 'Please enter a valid email address.';
  return ''; // No error
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters long.';
  // Optional: Add complexity checks (e.g., require numbers, symbols)
  // if (!/\d/.test(password)) return 'Password must contain a number.';
  return ''; // No error
};

export const validateRequired = (value, fieldName = 'Field') => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} is required.`;
  }
  return ''; // No error
};

export const validateMinLength = (value, minLength, fieldName = 'Field') => {
    if (value && value.length < minLength) {
        return `${fieldName} must be at least ${minLength} characters long.`;
    }
    return '';
}

export const validatePositiveNumber = (value, fieldName = 'Field') => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
        return `${fieldName} must be a positive number.`;
    }
    return '';
}

export const validateInteger = (value, fieldName = 'Field') => {
    if (!Number.isInteger(Number(value))) {
        return `${fieldName} must be a whole number.`;
    }
    return '';
}

export const validateRating = (value) => {
    const num = parseInt(value, 10);
    if (!Number.isInteger(num) || num < 1 || num > 5) {
        return 'Rating must be between 1 and 5.';
    }
    return '';
}

// Add more specific validators as needed