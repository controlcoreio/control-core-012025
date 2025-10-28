import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, CreditCard, Building, MapPin, Users, Info, CheckCircle, Lock, Activity, Cloud, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { SignupData, SignupResponse } from '@/types';
import { PageHeader } from '@/components/PageHeader';

const industries = [
  "SaaS", "FinTech", "E-commerce", "Healthcare", "Manufacturing", 
  "Education", "Government", "Media", "Other"
];

const teamSizes = [
  "1-10", "11-50", "51-200", "201-1000", "1000+"
];

const hearAboutUs = [
  "Google Search", "Social Media", "Referral", "Conference", 
  "Blog/Article", "Partner", "Other"
];

const countries = [
  "United States", "Canada", "Mexico", "United Kingdom", "Germany", 
  "France", "Australia", "Japan", "Other"
];

export function SignupPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<SignupData>({
    name: '',
    job_title: '',
    company_name: '',
    company_email: '',
    subscription_tier: 'kickstart',
    billing_cycle: 'monthly',
    skip_payment: true,
    address_street: '',
    address_city: '',
    address_state: '',
    address_zip: '',
    address_country: 'United States',
    industry: '',
    team_size: '',
    hear_about_us: '',
    terms_accepted: false,
    privacy_accepted: false,
  });

  const handleInputChange = (field: keyof SignupData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return false;
    }
    if (!formData.job_title.trim()) {
      toast.error('Job title is required');
      return false;
    }
    if (!formData.company_name.trim()) {
      toast.error('Company name is required');
      return false;
    }
    if (!formData.company_email.trim()) {
      toast.error('Business email is required');
      return false;
    }
    if (!formData.address_street.trim()) {
      toast.error('Street address is required');
      return false;
    }
    if (!formData.address_city.trim()) {
      toast.error('City is required');
      return false;
    }
    if (!formData.address_state.trim()) {
      toast.error('State/Province is required');
      return false;
    }
    if (!formData.address_zip.trim()) {
      toast.error('ZIP/Postal code is required');
      return false;
    }
    if (!formData.terms_accepted) {
      toast.error('You must accept the terms of service');
      return false;
    }
    if (!formData.privacy_accepted) {
      toast.error('You must accept the privacy policy');
      return false;
    }
    return true;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Signup failed');
      }

      const signupResult: SignupResponse = await response.json();
      
      toast.success('Account created successfully!');
      
      // Navigate to plan selection
      navigate('/plans', { state: { signupResult } });
      
    } catch (error) {
      console.error('Signup error:', error);
      toast.error(error instanceof Error ? error.message : 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <PageHeader 
          title="Sign Up for Control Core"
          description="Sign up to get started with enterprise-grade authorization. Decide who can use your AI, Data, API or Apps and inject instructions as dynamic context."
        />

        {/* Key Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="relative overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Lock className="h-8 w-8 text-primary" />
                <CardTitle className="text-lg">Context-Aware Security</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Use flexible rules to decide who (including AI Agents) can access what. Enable instant context-aware real-time permissions.
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Real-time enforcement</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>No-code policy management</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Activity className="h-8 w-8 text-primary" />
                <CardTitle className="text-lg">Enterprise Ready</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Built for enterprise scale with comprehensive audit logging, compliance frameworks, and multi-tenant support.
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Compliance ready</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Multi-tenant support</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Cloud className="h-8 w-8 text-primary" />
                <CardTitle className="text-lg">Flexible Deployment</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Deploy on your infrastructure or use our hosted service. Full control over your data and policies.
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Self-hosted or managed</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Your data, your control</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Signup Form */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Create Your Account
            </CardTitle>
            <CardDescription>
              Fill in your details to get started with Control Core
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Title *
                    </label>
                    <Input
                      type="text"
                      value={formData.job_title}
                      onChange={(e) => handleInputChange('job_title', e.target.value)}
                      placeholder="VP of Engineering"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Company Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Company Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name *
                    </label>
                    <Input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => handleInputChange('company_name', e.target.value)}
                      placeholder="Acme Corp"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Email * <span className="text-xs text-muted-foreground">(will be verified)</span>
                    </label>
                    <Input
                      type="email"
                      value={formData.company_email}
                      onChange={(e) => handleInputChange('company_email', e.target.value)}
                      placeholder="admin@acme.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Industry
                    </label>
                    <select
                      value={formData.industry}
                      onChange={(e) => handleInputChange('industry', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Select Industry</option>
                      {industries.map((industry) => (
                        <option key={industry} value={industry}>
                          {industry}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Team Size
                    </label>
                    <select
                      value={formData.team_size}
                      onChange={(e) => handleInputChange('team_size', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Select Team Size</option>
                      {teamSizes.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address Information
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address *
                  </label>
                  <Input
                    type="text"
                    value={formData.address_street}
                    onChange={(e) => handleInputChange('address_street', e.target.value)}
                    placeholder="123 Main Street"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <Input
                      type="text"
                      value={formData.address_city}
                      onChange={(e) => handleInputChange('address_city', e.target.value)}
                      placeholder="San Francisco"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State/Province *
                    </label>
                    <Input
                      type="text"
                      value={formData.address_state}
                      onChange={(e) => handleInputChange('address_state', e.target.value)}
                      placeholder="CA"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP/Postal Code *
                    </label>
                    <Input
                      type="text"
                      value={formData.address_zip}
                      onChange={(e) => handleInputChange('address_zip', e.target.value)}
                      placeholder="94105"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country *
                  </label>
                  <select
                    value={formData.address_country}
                    onChange={(e) => handleInputChange('address_country', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  >
                    {countries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* How did you hear about us */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  How did you hear about us?
                </label>
                <select
                  value={formData.hear_about_us}
                  onChange={(e) => handleInputChange('hear_about_us', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select an option</option>
                  {hearAboutUs.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {/* Terms and Privacy */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={formData.terms_accepted}
                    onChange={(e) => handleInputChange('terms_accepted', e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    required
                  />
                  <label htmlFor="terms" className="text-sm text-gray-700">
                    I agree to the{' '}
                    <a href="https://controlcore.io/terms-of-use" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Terms of Service
                    </a>
                  </label>
                </div>
                
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="privacy"
                    checked={formData.privacy_accepted}
                    onChange={(e) => handleInputChange('privacy_accepted', e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    required
                  />
                  <label htmlFor="privacy" className="text-sm text-gray-700">
                    I agree to the{' '}
                    <a href="https://controlcore.io/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Privacy Policy
                    </a>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Create Account
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center space-y-4">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-blue-600 hover:underline">
              Sign in
            </a>
          </p>
          
          <div className="flex justify-center gap-4 text-sm">
            <a 
              href="https://docs.controlcore.io/guides/deployment" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-600 hover:underline"
            >
              <ExternalLink className="h-4 w-4 inline mr-1" />
              Deployment Guide
            </a>
            <a 
              href="https://docs.controlcore.io/troubleshooting" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-600 hover:underline"
            >
              <ExternalLink className="h-4 w-4 inline mr-1" />
              Troubleshooting
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
