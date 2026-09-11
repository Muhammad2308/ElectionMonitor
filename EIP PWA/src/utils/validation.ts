/**
 * Input validation utilities
 */

export const isEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

export const isStrongPassword = (password: string): boolean => {
  return (
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^a-zA-Z\d]/.test(password)
  );
};

export const isURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Form validation utilities
 */

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateField = (
  value: any,
  rules: ValidationRule
): ValidationResult => {
  const errors: string[] = [];

  if (rules.required && (!value || value.toString().trim() === '')) {
    errors.push('This field is required');
  }

  if (value && rules.minLength && value.toString().length < rules.minLength) {
    errors.push(`Must be at least ${rules.minLength} characters`);
  }

  if (value && rules.maxLength && value.toString().length > rules.maxLength) {
    errors.push(`Must be no more than ${rules.maxLength} characters`);
  }

  if (value && rules.pattern && !rules.pattern.test(value.toString())) {
    errors.push('Invalid format');
  }

  if (rules.custom) {
    const customResult = rules.custom(value);
    if (typeof customResult === 'string') {
      errors.push(customResult);
    } else if (customResult === false) {
      errors.push('Validation failed');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateForm = (
  formData: Record<string, any>,
  rules: Record<string, ValidationRule>
): Record<string, ValidationResult> => {
  return Object.keys(rules).reduce((result, field) => {
    result[field] = validateField(formData[field], rules[field]);
    return result;
  }, {} as Record<string, ValidationResult>);
};

/**
 * Specific validators
 */

export const validateEmail = (email: string): ValidationResult => {
  return validateField(email, {
    required: true,
    custom: (value) => isEmail(value) ? true : 'Invalid email address',
  });
};

export const validatePassword = (password: string): ValidationResult => {
  return validateField(password, {
    required: true,
    minLength: 8,
    custom: (value) =>
      isStrongPassword(value)
        ? true
        : 'Password must contain uppercase, lowercase, number, and special character',
  });
};

export const validateUsername = (username: string): ValidationResult => {
  return validateField(username, {
    required: true,
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_-]+$/,
  });
};

export const validatePhoneNumber = (phone: string): ValidationResult => {
  return validateField(phone, {
    required: true,
    custom: (value) => isPhoneNumber(value) ? true : 'Invalid phone number',
  });
};
