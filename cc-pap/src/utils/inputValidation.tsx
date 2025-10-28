
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export class InputValidator {
  // Enhanced URL validation with security checks
  static validateURL(url: string): ValidationResult {
    if (!url.trim()) {
      return { isValid: false, error: "URL is required" };
    }

    // Length check to prevent DoS
    if (url.length > 2048) {
      return { isValid: false, error: "URL is too long" };
    }

    try {
      const urlObj = new URL(url);
      
      // Only allow HTTPS and HTTP protocols
      if (!['https:', 'http:'].includes(urlObj.protocol)) {
        return { isValid: false, error: "Only HTTP and HTTPS protocols are allowed" };
      }

      // Prevent localhost/internal network access in production
      const hostname = urlObj.hostname.toLowerCase();
      if (hostname === 'localhost' || 
          hostname === '127.0.0.1' || 
          hostname.startsWith('192.168.') ||
          hostname.startsWith('10.') ||
          hostname.startsWith('172.')) {
        console.warn('Internal network URL detected:', url);
      }

      // Block suspicious patterns
      if (url.includes('javascript:') || url.includes('data:') || url.includes('vbscript:')) {
        return { isValid: false, error: "Invalid URL format" };
      }

      return { isValid: true };
    } catch {
      return { isValid: false, error: "Invalid URL format" };
    }
  }

  // Enhanced email validation
  static validateEmail(email: string): ValidationResult {
    if (!email.trim()) {
      return { isValid: false, error: "Email is required" };
    }

    if (email.length > 254) {
      return { isValid: false, error: "Email is too long" };
    }

    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: "Invalid email format" };
    }

    return { isValid: true };
  }

  // Enhanced API Key validation
  static validateAPIKey(apiKey: string): ValidationResult {
    if (!apiKey.trim()) {
      return { isValid: false, error: "API key is required" };
    }

    // Length validation
    if (apiKey.length < 16 || apiKey.length > 256) {
      return { isValid: false, error: "API key must be between 16 and 256 characters" };
    }

    // Character validation - only allow safe characters
    if (!/^[A-Za-z0-9\-_.]+$/.test(apiKey)) {
      return { isValid: false, error: "API key contains invalid characters" };
    }

    return { isValid: true };
  }

  // Enhanced text sanitization
  static sanitizeText(input: string, maxLength: number = 1000): string {
    if (!input) return '';
    
    return input
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '') // Remove control characters
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .slice(0, maxLength) // Enforce length limit
      .trim();
  }

  // Enhanced file validation with MIME type checking
  static validateFile(file: File, allowedTypes: string[], maxSize: number = 5 * 1024 * 1024): ValidationResult {
    if (!file) {
      return { isValid: false, error: "File is required" };
    }

    // Check file size
    if (file.size > maxSize) {
      return { isValid: false, error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB` };
    }

    // Check MIME type (more secure than just file extension)
    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` };
    }

    // Additional checks for image files
    if (file.type.startsWith('image/')) {
      // Check for common image exploit patterns in filename
      if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
        return { isValid: false, error: "Invalid file name" };
      }
    }

    return { isValid: true };
  }

  // Enhanced file name validation
  static validateFileName(fileName: string): ValidationResult {
    if (!fileName.trim()) {
      return { isValid: false, error: "File name is required" };
    }

    if (fileName.length > 255) {
      return { isValid: false, error: "File name is too long" };
    }

    // Check for dangerous characters and patterns
    if (/[<>:"/\\|?*\u0000-\u001F]/.test(fileName)) {
      return { isValid: false, error: "File name contains invalid characters" };
    }

    // Check for path traversal attempts
    if (fileName.includes('..') || fileName.startsWith('.')) {
      return { isValid: false, error: "Invalid file name pattern" };
    }

    // Check for reserved names (Windows)
    const reserved = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
    if (reserved.includes(fileName.toUpperCase().split('.')[0])) {
      return { isValid: false, error: "File name is reserved" };
    }

    return { isValid: true };
  }

  // Enhanced policy name validation
  static validatePolicyName(name: string): ValidationResult {
    if (!name.trim()) {
      return { isValid: false, error: "Policy name is required" };
    }

    const sanitized = this.sanitizeText(name, 100);
    if (sanitized !== name) {
      return { isValid: false, error: "Policy name contains invalid characters" };
    }

    if (sanitized.length < 3) {
      return { isValid: false, error: "Policy name must be at least 3 characters" };
    }

    if (sanitized.length > 100) {
      return { isValid: false, error: "Policy name must be less than 100 characters" };
    }

    // Allow alphanumeric, spaces, hyphens, underscores
    if (!/^[A-Za-z0-9\s\-_]+$/.test(sanitized)) {
      return { isValid: false, error: "Policy name can only contain letters, numbers, spaces, hyphens, and underscores" };
    }

    return { isValid: true };
  }

  // New: Password strength validation
  static validatePassword(password: string): ValidationResult {
    if (!password) {
      return { isValid: false, error: "Password is required" };
    }

    if (password.length < 8) {
      return { isValid: false, error: "Password must be at least 8 characters long" };
    }

    if (password.length > 128) {
      return { isValid: false, error: "Password is too long" };
    }

    // Check for common weak passwords
    const commonPasswords = ['password', '123456', 'admin', 'letmein', 'welcome'];
    if (commonPasswords.includes(password.toLowerCase())) {
      return { isValid: false, error: "Password is too common" };
    }

    // Require at least one letter and one number
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      return { isValid: false, error: "Password must contain at least one letter and one number" };
    }

    return { isValid: true };
  }
}
