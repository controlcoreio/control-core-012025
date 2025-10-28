import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Zap, Crown, Check, X, AlertCircle, Server, Cloud, Building2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { SignupResponse } from '@/types';
import { PageHeader } from '@/components/PageHeader';

export function PlanSelectionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const signupResult = location.state?.signupResult as SignupResponse;
  
  const [selectedPlan, setSelectedPlan] = useState<'kickstart' | 'custom'>('kickstart');
  const [isLoading, setIsLoading] = useState(false);

  if (!signupResult) {
    navigate('/signup');
    return null;
  }

  const plans = [
    {
      id: 'kickstart',
      name: 'Kickstart',
      description: 'Perfect for getting started with Control Core',
      price: '$0',
      period: '',
      icon: Shield,
      features: [
        'Deploy on your infrastructure',
        '90 days of high impact pilot',
        'Direct access support',
        'See results in days',
        'Essential policy templates',
        'Basic policy management',
        'Self-hosted Control Plane'
      ],
      limitations: [],
      popular: false,
      available: true
    },
    {
      id: 'custom',
      name: 'Custom',
      description: 'On-premises, single-instance deployment',
      price: 'Contact Us',
      period: 'for pricing',
      icon: Zap,
      features: [
        'Unlimited active policies',
        'Essential policy templates',
        'Custom permissions scanner',
        'Rule recommender',
        'Extended log retention',
        'Unlimited authorization decisions',
        'Unlimited identities',
        'Dedicated account manager',
        'Support through preferred channels',
        'On-premises deployment'
      ],
      limitations: [],
      popular: true,
      available: true
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'Hybrid SaaS deployment',
      price: '$199',
      period: 'per month',
      icon: Crown,
      features: [
        'Up to 100 active policies',
        'Essential policy templates',
        'Log retention up to 2 years',
        'Unlimited authorization decisions',
        'Unlimited identities',
        'High-priority private support',
        'Support via Google Meet',
        'Hybrid SaaS deployment',
        '99.9% uptime SLA'
      ],
      limitations: [
        'Limited to 100 active policies',
        'Usage fees: $0.75 per 1,000 MCP Context Generations'
      ],
      popular: false,
      available: false // Greyed out for MVP
    }
  ];

  const handlePlanSelection = async () => {
    setIsLoading(true);
    
    try {
      // Update the signup result with the selected plan
      const updatedSignupResult = {
        ...signupResult,
        subscription_tier: selectedPlan,
        requires_payment: selectedPlan === 'custom'
      };

      toast.success(`Selected ${plans.find(p => p.id === selectedPlan)?.name} plan!`);
      
      // Navigate to downloads page
      navigate('/downloads', { state: { signupResult: updatedSignupResult } });
      
    } catch (error) {
      console.error('Plan selection error:', error);
      toast.error('Failed to select plan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <PageHeader 
          title="Choose Your Plan"
          description={`Welcome, ${signupResult.company_name}! Select the plan that best fits your needs.`}
        />

        {/* Plan Selection Info */}
        <div className="mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center mt-0.5">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">Self-Hosted Deployment</p>
                <p className="text-blue-800">
                  Both Kickstart and Custom plans require you to download and deploy Control Core components within your own infrastructure. You'll have full control over your data and policies.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isSelected = selectedPlan === plan.id;
            const isDisabled = !plan.available;
            
            return (
              <Card 
                key={plan.id}
                className={`relative transition-all duration-200 ${
                  isSelected 
                    ? 'ring-2 ring-blue-500 shadow-lg scale-105' 
                    : isDisabled 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:shadow-lg cursor-pointer'
                } ${plan.popular ? 'border-blue-500' : ''}`}
                onClick={() => !isDisabled && setSelectedPlan(plan.id as 'kickstart' | 'custom')}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                {!plan.available && (
                  <div className="absolute top-4 right-4">
                    <div className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Coming Soon
                    </div>
                  </div>
                )}

                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
                    <Icon className={`h-8 w-8 ${plan.available ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription className="text-sm">{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 ml-1">{plan.period}</span>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Features</h4>
                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                            <span className={plan.available ? 'text-gray-700' : 'text-gray-400'}>
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                  </div>

                  <Button
                    className={`w-full mt-6 ${
                      isSelected 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : isDisabled 
                        ? 'bg-gray-300 cursor-not-allowed' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    disabled={isDisabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isDisabled) {
                        setSelectedPlan(plan.id as 'kickstart' | 'custom');
                      }
                    }}
                  >
                    {isSelected ? 'Selected' : isDisabled ? 'Coming Soon' : 'Select Plan'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              Selected Plan: {plans.find(p => p.id === selectedPlan)?.name}
            </h3>
            <p className="text-blue-700">
              {selectedPlan === 'kickstart' 
                ? 'Get started with 90 days of high impact pilot. No payment required.'
                : 'Custom plan with advanced features. Payment will be invoiced after download.'
              }
            </p>
          </div>

          <Button
            onClick={handlePlanSelection}
            disabled={isLoading}
            size="lg"
            className="px-8"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                Continue to Downloads
                <Shield className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Need help choosing?{' '}
            <a href="mailto:support@controlcore.io" className="text-blue-600 hover:underline">
              Contact our team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
