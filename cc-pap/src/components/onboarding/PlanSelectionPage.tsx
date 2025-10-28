import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Shield, Check, CreditCard, Building2, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { EnhancedSecureForm } from "@/components/ui/enhanced-secure-form";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { convertCurrency } from "@/utils/currencyConverter";

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
  "Canada", "United States", "Mexico",
  "Belize", "Costa Rica", "El Salvador", "Guatemala", "Honduras", "Nicaragua", "Panama",
  "Argentina", "Bolivia", "Brazil", "Chile", "Colombia", "Ecuador", "French Guiana", 
  "Guyana", "Paraguay", "Peru", "Suriname", "Uruguay", "Venezuela",
  "---",
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

export function PlanSelectionPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'kickstart' | 'pro' | 'custom'>('kickstart');
  const [selectedCountry, setSelectedCountry] = useState<string>('canada');
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { createKickstartSubscription, createProSubscription, createCustomSubscription } = useSubscription();

  const plans = [
    {
      id: 'kickstart' as const,
      name: 'Kickstart Plan',
      price: 'Free for 3 months',
      description: 'Perfect for getting started',
      icon: Zap,
      features: [
        '90 days of free access',
        'Up to 100 active policies',
        'Unlimited authorization decisions',
        'Dedicated support',
        'Policy templates library',
        'Basic analytics'
      ],
      badge: 'Most Popular',
      badgeColor: 'bg-green-600'
    },
    {
      id: 'pro' as const,
      name: 'Pro Plan (Hosted)',
      price: '$99/month',
      description: 'Hosted by Control Core',
      icon: Shield,
      features: [
        'Fully managed hosting',
        'Up to 100 active policies',
        'Unlimited authorization decisions',
        'Priority support',
        'Advanced analytics',
        'API access',
        'Download PEP components only'
      ],
      badge: 'Recommended',
      badgeColor: 'bg-blue-600'
    },
    {
      id: 'custom' as const,
      name: 'Custom Plan (Self-Hosted)',
      price: 'Custom pricing',
      description: 'Deploy on your infrastructure',
      icon: Building2,
      features: [
        'Self-hosted deployment',
        'Unlimited active policies',
        'Unlimited authorization decisions',
        'AI Power Extensions',
        'Custom integrations',
        'Dedicated support team',
        'Full control plane access'
      ],
      badge: 'Enterprise',
      badgeColor: 'bg-purple-600'
    }
  ];

  const selectedPlanData = plans.find(plan => plan.id === selectedPlan);

  // Get converted price for display
  const getConvertedPrice = () => {
    if (selectedPlan === 'kickstart' || selectedCountry === 'united-states') return null;
    
    const usdPrice = selectedPlan === 'pro' ? 99 : 299; // Custom plan estimated price
    return convertCurrency(usdPrice, selectedCountry);
  };

  const convertedPrice = getConvertedPrice();

  const handleSignup = async (data: any) => {
    setIsLoading(true);
    try {
      const newUser = await signup(data);
      
      // Create subscription based on selected plan
      if (selectedPlan === 'kickstart') {
        await createKickstartSubscription(newUser.id);
        toast({
          title: "Welcome to Control Core!",
          description: "Your Kickstart subscription is now active. Let's choose your deployment model!",
        });
        navigate('/plan-selection-next');
      } else if (selectedPlan === 'pro') {
        await createProSubscription(newUser.id);
        toast({
          title: "Welcome to Control Core Pro!",
          description: "Your Pro subscription is active. Let's download your PEP components!",
        });
        navigate('/pro-setup');
      } else if (selectedPlan === 'custom') {
        await createCustomSubscription(newUser.id);
        toast({
          title: "Welcome to Control Core Custom!",
          description: "Your Custom subscription is active. Let's set up your infrastructure!",
        });
        navigate('/custom-setup');
      }
    } catch (error) {
      toast({
        title: "Signup failed",
        description: "Something went wrong. Please try again.",
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
      
      <div className="w-full max-w-6xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Choose Your Control Core Plan
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Select the plan that best fits your organization's needs
          </p>
        </div>

        {/* Plan Selection Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card 
                key={plan.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedPlan === plan.id 
                    ? 'ring-2 ring-primary shadow-lg' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                <CardHeader className="relative">
                  {plan.badge && (
                    <Badge className={`absolute -top-2 left-4 ${plan.badgeColor} text-white`}>
                      {plan.badge}
                    </Badge>
                  )}
                  <div className="flex items-center gap-3">
                    <Icon className="h-8 w-8 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <CardDescription className="font-semibold text-primary">
                        {plan.price}
                      </CardDescription>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {plan.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Signup Form */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {selectedPlanData?.icon && <selectedPlanData.icon className="h-5 w-5" />}
              Create Your Account - {selectedPlanData?.name}
            </CardTitle>
            <CardDescription>
              Complete your registration to get started with Control Core
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EnhancedSecureForm
              onSubmit={handleSignup}
              isLoading={isLoading}
              submitText={`Start with ${selectedPlanData?.name}`}
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
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select name="industry">
                      <SelectTrigger>
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
                      <SelectTrigger>
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
                    <Select 
                      name="country" 
                      defaultValue="canada"
                      onValueChange={(value) => setSelectedCountry(value)}
                    >
                      <SelectTrigger>
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
                    {convertedPrice && (selectedPlan === 'pro' || selectedPlan === 'custom') && (
                      <p className="text-sm text-muted-foreground">
                        {convertedPrice.symbol} {convertedPrice.amount}/month + tax
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hearAbout">How did you hear about us?</Label>
                    <Select name="hearAbout">
                      <SelectTrigger>
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

              {/* Payment Information for Pro/Custom Plans */}
              {(selectedPlan === 'pro' || selectedPlan === 'custom') && (
                <div className="space-y-4 border-t pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Payment Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Credit Card Number *</Label>
                      <Input
                        id="cardNumber"
                        name="cardNumber"
                        required
                        placeholder="1234 5678 9012 3456"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Expiry Date *</Label>
                      <Input
                        id="expiry"
                        name="expiry"
                        required
                        placeholder="MM/YY"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cvc">CVC *</Label>
                      <Input
                        id="cvc"
                        name="cvc"
                        required
                        placeholder="123"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">Zip/Postal Code *</Label>
                      <Input
                        id="zipCode"
                        name="zipCode"
                        required
                        placeholder="12345"
                      />
                    </div>
                  </div>
                </div>
              )}

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