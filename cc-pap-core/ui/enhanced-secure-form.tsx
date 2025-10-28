
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { InputValidator } from '@/utils/inputValidation';
import { ErrorHandler } from '@/utils/errorHandling';
import { EnhancedCSRFProtection } from '@/utils/enhancedCSRFProtection';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface EnhancedSecureFormProps {
  onSubmit: (data: any) => Promise<void> | void;
  children: React.ReactNode;
  className?: string;
  submitText?: string;
  isLoading?: boolean;
  requireCSRF?: boolean;
  rateLimitKey?: string;
}

export function EnhancedSecureForm({ 
  onSubmit, 
  children, 
  className = '',
  submitText = 'Submit',
  isLoading = false,
  requireCSRF = true,
  rateLimitKey = 'default'
}: EnhancedSecureFormProps) {
  const [submissionCount, setSubmissionCount] = useState(0);
  const [lastSubmission, setLastSubmission] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Enhanced rate limiting
      const now = Date.now();
      const timeSinceLastSubmission = now - lastSubmission;
      
      // Progressive rate limiting based on submission count
      const minInterval = Math.min(1000 * Math.pow(2, submissionCount), 30000); // Max 30 seconds
      
      if (timeSinceLastSubmission < minInterval && submissionCount >= 3) {
        const error = ErrorHandler.createSecureError(
          { name: 'RateLimitError', message: 'Too many requests' },
          'form-submission'
        );
        toast({
          title: "Please wait",
          description: `Too many attempts. Please wait ${Math.ceil(minInterval / 1000)} seconds.`,
          variant: "destructive",
        });
        return;
      }

      setSubmissionCount(prev => timeSinceLastSubmission < 60000 ? prev + 1 : 1);
      setLastSubmission(now);

      const formData = new FormData(e.currentTarget);
      const data: any = {};
      
      // Enhanced CSRF token validation
      if (requireCSRF) {
        const csrfToken = formData.get('_csrf') as string;
        const sessionId = user?.id || 'anonymous';
        
        if (!EnhancedCSRFProtection.validateToken(csrfToken, sessionId)) {
          throw new Error('Security validation failed. Please refresh and try again.');
        }
      }
      
      // Enhanced input sanitization and validation
      for (const [key, value] of formData.entries()) {
        if (key === '_csrf') continue;
        
        if (typeof value === 'string') {
          // More aggressive sanitization for security-sensitive forms
          const sanitized = InputValidator.sanitizeText(value, 5000);
          
          // Additional security checks for specific field types
          if (key.includes('password')) {
            // Password fields get minimal processing to preserve special characters
            data[key] = value.slice(0, 128); // Just limit length
          } else if (key.includes('email')) {
            const emailValidation = InputValidator.validateEmail(sanitized);
            if (sanitized && !emailValidation.isValid) {
              throw new Error(emailValidation.error);
            }
            data[key] = sanitized;
          } else if (key.includes('url')) {
            const urlValidation = InputValidator.validateURL(sanitized);
            if (sanitized && !urlValidation.isValid) {
              throw new Error(urlValidation.error);
            }
            data[key] = sanitized;
          } else {
            data[key] = sanitized;
          }
        } else {
          data[key] = value;
        }
      }

      // Log security event
      console.log('[Security] Form submission validated', {
        rateLimitKey,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent.slice(0, 100),
        formFields: Object.keys(data).filter(key => !key.includes('password'))
      });

      await onSubmit(data);
      
      // Reset submission count on successful submission
      setSubmissionCount(0);
      
    } catch (error) {
      const secureError = ErrorHandler.createSecureError(error, 'enhanced-form-submission');
      toast({
        title: "Submission failed",
        description: secureError.userMessage,
        variant: "destructive",
      });
      
      // Log security error
      if (ErrorHandler.shouldReportError(secureError.errorCode)) {
        console.warn('[Security] Form submission error', {
          errorCode: secureError.errorCode,
          timestamp: secureError.timestamp,
          rateLimitKey
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate enhanced CSRF token
  const csrfToken = requireCSRF ? EnhancedCSRFProtection.generateToken(user?.id) : null;

  // Calculate if form should be disabled
  const isDisabled = isLoading || isSubmitting || 
    (submissionCount >= 5 && Date.now() - lastSubmission < 60000);

  return (
    <form 
      onSubmit={handleSubmit} 
      className={`space-y-4 ${className}`}
      autoComplete="off"
      noValidate
    >
      {requireCSRF && (
        <input type="hidden" name="_csrf" value={csrfToken || ''} />
      )}
      
      {/* Honeypot field for bot detection */}
      <input 
        type="text" 
        name="website" 
        style={{ display: 'none' }} 
        tabIndex={-1} 
        autoComplete="off" 
      />
      
      {children}
      
      <Button 
        type="submit" 
        disabled={isDisabled}
        className="w-full"
      >
        {isSubmitting ? 'Processing...' : (isLoading ? 'Loading...' : submitText)}
      </Button>
      
      {submissionCount >= 3 && (
        <p className="text-sm text-muted-foreground text-center">
          Rate limiting active. Please wait between submissions.
        </p>
      )}
    </form>
  );
}
