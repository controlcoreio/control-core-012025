
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { InputValidator } from '@/utils/inputValidation';
import { ErrorHandler } from '@/utils/errorHandling';
import { EnhancedCSRFProtection } from '@/utils/enhancedCSRFProtection';
import { useToast } from '@/hooks/use-toast';

interface SecureFormProps {
  onSubmit: (data: any) => Promise<void> | void;
  children: React.ReactNode;
  className?: string;
  submitText?: string;
  isLoading?: boolean;
  requireCSRF?: boolean;
}

export function SecureForm({ 
  onSubmit, 
  children, 
  className = '',
  submitText = 'Submit',
  isLoading = false,
  requireCSRF = true
}: SecureFormProps) {
  const [submissionCount, setSubmissionCount] = useState(0);
  const [lastSubmission, setLastSubmission] = useState<number>(0);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      // Rate limiting: max 5 submissions per minute
      const now = Date.now();
      if (now - lastSubmission < 12000 && submissionCount >= 5) {
        const error = ErrorHandler.createSecureError(
          { name: 'RateLimitError', message: 'Too many requests' },
          'form-submission'
        );
        toast({
          title: "Too many attempts",
          description: error.userMessage,
          variant: "destructive",
        });
        return;
      }

      setSubmissionCount(prev => prev + 1);
      setLastSubmission(now);

      const formData = new FormData(e.currentTarget);
      const data: any = {};
      
      // CSRF token validation using enhanced protection
      if (requireCSRF) {
        const csrfToken = formData.get('_csrf') as string;
        if (!EnhancedCSRFProtection.validateToken(csrfToken)) {
          throw new Error('Invalid CSRF token');
        }
      }
      
      // Sanitize and validate form data
      for (const [key, value] of formData.entries()) {
        if (key === '_csrf') continue; // Skip CSRF token
        
        if (typeof value === 'string') {
          const sanitized = InputValidator.sanitizeText(value, 10000);
          data[key] = sanitized;
        } else {
          data[key] = value;
        }
      }

      await onSubmit(data);
    } catch (error) {
      const secureError = ErrorHandler.createSecureError(error, 'form-submission');
      toast({
        title: "Submission failed",
        description: secureError.userMessage,
        variant: "destructive",
      });
    }
  };

  // Generate CSRF token using enhanced protection
  const csrfToken = requireCSRF ? EnhancedCSRFProtection.generateToken() : null;

  return (
    <form 
      onSubmit={handleSubmit} 
      className={`space-y-4 ${className}`}
      autoComplete="off"
    >
      {requireCSRF && (
        <input type="hidden" name="_csrf" value={csrfToken || ''} />
      )}
      {children}
      <Button 
        type="submit" 
        disabled={isLoading || (submissionCount >= 5 && Date.now() - lastSubmission < 60000)}
        className="w-full"
      >
        {isLoading ? 'Processing...' : submitText}
      </Button>
    </form>
  );
}
