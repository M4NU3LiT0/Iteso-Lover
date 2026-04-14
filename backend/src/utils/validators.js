const validator = require('validator');

// Validate email
const validateEmail = (email) => {
  return validator.isEmail(email) && email.endsWith('@iteso.mx');
};

// Validate password strength
const validatePassword = (password) => {
  // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
  if (password.length < 8) return false;
  if (!/[a-z]/.test(password)) return false; // lowercase
  if (!/[A-Z]/.test(password)) return false; // uppercase
  if (!/\d/.test(password)) return false; // digit
  return true;
};

// Sanitize user input
const sanitizeInput = (input) => {
  return validator.trim(input);
};

// Validate date and time
const validateDateTime = (date, time) => {
  const dateObj = new Date(date);
  const now = new Date();
  
  if (dateObj < now) {
    return { valid: false, error: 'Date must be in the future' };
  }

  if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
    return { valid: false, error: 'Invalid time format (HH:MM)' };
  }

  return { valid: true };
};

module.exports = {
  validateEmail,
  validatePassword,
  sanitizeInput,
  validateDateTime
};
