
import { SecurityConfig } from './securityConfig';

export interface PasswordStrength {
  score: number; // 0-4 (4 being strongest)
  feedback: string[];
  isValid: boolean;
}

export class EnhancedPasswordValidation {
  
  static validatePassword(password: string): PasswordStrength {
    const feedback: string[] = [];
    let score = 0;
    
    const requirements = SecurityConfig.PASSWORD_REQUIREMENTS;
    
    // Length check
    if (password.length < requirements.minLength) {
      feedback.push(`Password must be at least ${requirements.minLength} characters long`);
    } else {
      score += 1;
    }
    
    // Character requirements
    if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
      feedback.push('Password must contain at least one uppercase letter');
    } else if (requirements.requireUppercase) {
      score += 1;
    }
    
    if (requirements.requireLowercase && !/[a-z]/.test(password)) {
      feedback.push('Password must contain at least one lowercase letter');
    } else if (requirements.requireLowercase) {
      score += 1;
    }
    
    if (requirements.requireNumbers && !/[0-9]/.test(password)) {
      feedback.push('Password must contain at least one number');
    } else if (requirements.requireNumbers) {
      score += 1;
    }
    
    if (requirements.requireSpecialChars && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      feedback.push('Password must contain at least one special character');
    } else if (requirements.requireSpecialChars) {
      score += 1;
    }
    
    // Check against forbidden patterns
    const lowerPassword = password.toLowerCase();
    for (const pattern of requirements.forbiddenPatterns) {
      if (lowerPassword.includes(pattern)) {
        feedback.push(`Password cannot contain common phrases like "${pattern}"`);
        score = Math.max(0, score - 1);
        break;
      }
    }
    
    // Check for repeated characters
    if (/(.)\1{2,}/.test(password)) {
      feedback.push('Password should not contain repeated characters');
      score = Math.max(0, score - 1);
    }
    
    // Check for sequential characters
    if (this.hasSequentialChars(password)) {
      feedback.push('Password should not contain sequential characters');
      score = Math.max(0, score - 1);
    }
    
    // Additional entropy check for longer passwords
    if (password.length >= 16) {
      score = Math.min(4, score + 1);
    }
    
    const isValid = feedback.length === 0 && score >= 3;
    
    if (feedback.length === 0) {
      switch (score) {
        case 4:
          feedback.push('Very strong password');
          break;
        case 3:
          feedback.push('Strong password');
          break;
        case 2:
          feedback.push('Moderate password');
          break;
        default:
          feedback.push('Weak password');
      }
    }
    
    return {
      score,
      feedback,
      isValid
    };
  }
  
  private static hasSequentialChars(password: string): boolean {
    const sequences = [
      'abcdefghijklmnopqrstuvwxyz',
      '0123456789',
      'qwertyuiop',
      'asdfghjkl',
      'zxcvbnm'
    ];
    
    const lowerPassword = password.toLowerCase();
    
    for (const sequence of sequences) {
      for (let i = 0; i <= sequence.length - 3; i++) {
        const substr = sequence.substring(i, i + 3);
        const reverseSubstr = substr.split('').reverse().join('');
        
        if (lowerPassword.includes(substr) || lowerPassword.includes(reverseSubstr)) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  static generateSuggestion(): string {
    const suggestions = [
      'Consider using a passphrase with multiple words',
      'Mix uppercase, lowercase, numbers, and special characters',
      'Avoid using personal information or dictionary words',
      'Use a password manager to generate secure passwords',
      'Make it at least 12 characters long for better security'
    ];
    
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  }
}
