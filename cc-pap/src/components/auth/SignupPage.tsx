
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Shield, CreditCard, Info } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { EnhancedSecureForm } from "@/components/ui/enhanced-secure-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { ThemeToggle } from "@/components/ThemeToggle";

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

// Countries with Americas first, then alphabetical
const countries = [
  // Top group - North and Central America
  "Canada", "United States", "Mexico",
  // Central America
  "Belize", "Costa Rica", "El Salvador", "Guatemala", "Honduras", "Nicaragua", "Panama",
  // South America
  "Argentina", "Bolivia", "Brazil", "Chile", "Colombia", "Ecuador", "French Guiana", 
  "Guyana", "Paraguay", "Peru", "Suriname", "Uruguay", "Venezuela",
  // Separator
  "---",
  // Rest of world alphabetically
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", 
  "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", 
  "Barbados", "Belarus", "Belgium", "Benin", "Bhutan", "Bosnia and Herzegovina", 
  "Botswana", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", 
  "Cameroon", "Central African Republic", "Chad", "China", "Comoros", "Congo", 
  "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", 
  "Dominican Republic", "East Timor", "Egypt", "Equatorial Guinea", "Eritrea", "Estonia", 
  "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", 
  "Germany", "Ghana", "Greece", "Grenada", "Guinea", "Guinea-Bissau", "Haiti", "Hungary", 
  "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", 
  "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", 
  "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", 
  "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", 
  "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Micronesia", 
  "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", 
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Niger", "Nigeria", 
  "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", 
  "Papua New Guinea", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", 
  "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", 
  "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", 
  "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", 
  "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", 
  "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", 
  "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", 
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "Uzbekistan", "Vanuatu", 
  "Vatican City", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

export function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [skipPayment, setSkipPayment] = useState(true); // Default to skip payment (Kickstart)
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { createKickstartSubscription } = useSubscription();

  const handleSignup = async (data: any) => {
    setIsLoading(true);
    try {
      // Prepare signup data for cc-signup-service
      const signupData = {
        name: data.name || data.email.split('@')[0],
        email: data.email,
        company_name: data.company,
        company_email: data.email, // For now, use same email - will be enhanced later
        subscription_tier: skipPayment ? "kickstart" : "custom",
        billing_cycle: "monthly",
        skip_payment: skipPayment,
        address_street: "123 Main St", // Placeholder - will be enhanced
        address_city: "San Francisco",
        address_state: "CA",
        address_zip: "94105",
        address_country: data.country || "United States",
        industry: data.industry,
        team_size: data.teamSize,
        hear_about_us: data.hearAbout,
        terms_accepted: true,
        privacy_accepted: true
      };

      // Call cc-signup-service API
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Signup failed');
      }

      const signupResult = await response.json();
      
      toast({
        title: "Welcome to Control Core!",
        description: skipPayment 
          ? "Your Kickstart subscription is now active with 90 days of free access. Let's get started!"
          : "Your account has been created successfully. Let's get started!",
      });
      
      // Navigate based on subscription tier
      if (signupResult.subscription_tier === "pro") {
        navigate('/pro-provisioning', { state: { signupResult } });
      } else {
        navigate('/download-packages', { state: { signupResult } });
      }
    } catch (error) {
      toast({
        title: "Signup failed",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 relative">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Start Your Authorization Journey with ControlCore
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Protect Your External APIs & AI
          </p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Create Your Account</CardTitle>
            <CardDescription>
              Join thousands of companies securing their APIs & AI with ControlCore
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EnhancedSecureForm
              onSubmit={handleSignup}
              isLoading={isLoading}
              submitText="Start Free Trial"
              className="space-y-6"
            >
              {/* Account Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Account Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="you@company.com"
                      autoComplete="email"
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      placeholder="Choose a strong password"
                      autoComplete="new-password"
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company Name *</Label>
                  <Input
                    id="company"
                    name="company"
                    required
                    placeholder="Your Company Inc."
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select name="industry">
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map((industry) => (
                          <SelectItem key={industry} value={industry.toLowerCase()}>
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="teamSize">Team Size</Label>
                    <Select name="teamSize">
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select team size" />
                      </SelectTrigger>
                      <SelectContent>
                        {teamSizes.map((size) => (
                          <SelectItem key={size} value={size}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Select name="country" defaultValue="canada">
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {countries.map((country) => 
                          country === "---" ? (
                            <div key="separator" className="border-t my-1" />
                          ) : (
                            <SelectItem key={country} value={country.toLowerCase().replace(/\s+/g, '-')}>
                              {country}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hearAbout">How did you hear about us?</Label>
                    <Select name="hearAbout">
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        {hearAboutUs.map((option) => (
                          <SelectItem key={option} value={option.toLowerCase()}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Billing Information */}
              <div className="space-y-4 border-t pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Billing Information (30-Day Free Trial - Optional)</h3>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Start with our <strong>Kickstart Plan</strong> - 90 days of free access with no charges. 
                    Maximum 100 active policies, unlimited authorization decisions, and dedicated support. 
                    Perfect for getting started with AI governance.
                  </p>
                </div>

                {/* Skip Payment Option */}
                <div className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Checkbox
                    id="skipPayment"
                    checked={skipPayment}
                    onCheckedChange={(checked) => setSkipPayment(checked as boolean)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="skipPayment" className="font-medium cursor-pointer">
                      Start with Kickstart Plan (Recommended)
                    </Label>
                    {skipPayment && (
                      <Alert className="mt-3 border-green-200 bg-green-50 dark:bg-green-900/20">
                        <Info className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800 dark:text-green-200">
                          Perfect! Your Kickstart Plan includes 90 days of free access with all essential features. Start protecting your AI and APIs immediately with our guided setup wizard.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>

                {/* Pro Plan Payment Fields - Only show if not starting with Kickstart */}
                {!skipPayment && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Credit Card Number *</Label>
                      <Input
                        id="cardNumber"
                        name="cardNumber"
                        required={!skipPayment}
                        placeholder="1234 5678 9012 3456"
                        className="w-full"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiry">Expiry Date *</Label>
                        <Input
                          id="expiry"
                          name="expiry"
                          required={!skipPayment}
                          placeholder="MM/YY"
                          className="w-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cvc">CVC *</Label>
                        <Input
                          id="cvc"
                          name="cvc"
                          required={!skipPayment}
                          placeholder="123"
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="billingCountry">Country *</Label>
                        <Select name="billingCountry" defaultValue="canada">
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {countries.map((country) => 
                              country === "---" ? (
                                <div key="separator" className="border-t my-1" />
                              ) : (
                                <SelectItem key={country} value={country.toLowerCase().replace(/\s+/g, '-')}>
                                  {country}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="zipCode">Zip/Postal Code *</Label>
                        <Input
                          id="zipCode"
                          name="zipCode"
                          required={!skipPayment}
                          placeholder="12345"
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start space-x-2 pt-4">
                <Checkbox id="terms" name="terms" required />
                <Label htmlFor="terms" className="text-sm leading-relaxed">
                  I agree to the{" "}
                  <a 
                    href="https://controlcore.io/terms-of-use" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a 
                    href="https://controlcore.io/privacy-policy" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Privacy Policy
                  </a>
                </Label>
              </div>
            </EnhancedSecureForm>

            <div className="text-center mt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Log In
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
