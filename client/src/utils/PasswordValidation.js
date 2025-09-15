export const validatePassword = (password) => {
  const minLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*]/.test(password);

  return {
    isValid: minLength && hasUpperCase && hasNumber && hasSpecialChar,
    minLength,
    hasUpperCase,
    hasNumber,
    hasSpecialChar
  };
};

export const getPasswordStrength = (password) => {
  const validation = validatePassword(password);
  const score = Object.values(validation).filter(Boolean).length - 1; // minus isValid

  if (score >= 4) return "strong";
  if (score >= 2) return "medium";
  return "weak";
};