
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Crown, 
  Check, 
  Mail, 
  Calendar, 
  CreditCard, 
  Clock
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSubscription } from "@/contexts/SubscriptionContext";

export function SubscriptionPlanPage() {
  // Get real subscription status from context
  const { subscription, isTrialActive, getDaysUntilTrialEnd } = useSubscription();
  const currentPlan = subscription?.tier || "kickstart";
  const trialDaysRemaining = getDaysUntilTrialEnd();

  const handleContactSupport = () => {
    window.open('mailto:support@controlcore.io?subject=Support Request - Subscription Plan', '_blank');
  };

  const handleUpgrade = (planType: string) => {
    if (planType === 'pro') {
      window.open('https://app.reclaim.ai/m/rakeshraghu', '_blank');
    } else if (planType === 'custom') {
      window.open('https://app.reclaim.ai/m/rakeshraghu', '_blank');
    }
  };

  const handleRequestExtension = () => {
    window.open('mailto:support@controlcore.io?subject=Trial Extension Request', '_blank');
  };

  const handleCancelSubscription = () => {
    window.open('mailto:support@controlcore.io?subject=Subscription Cancellation Request', '_blank');
  };

  const plans = [
    {
      id: "kickstart",
      name: "Kickstart",
      price: "Free",
      billing: "30 Day Zero-Cost Pilot",
      description: "Usage: Unlimited",
      deployment: "On-Prem, One-Instance, One Bouncer",
      usage: null,
      features: [
        "100 Active Policies",
        "5 Conditions per Policy",
        "Unlimited Decisions",
        "Unlimited Identities",
        "90 Days Log Retention",
        "Dedicated Account Manager"
      ],
      isPopular: false,
      isCurrent: currentPlan === "kickstart",
      discount: "20% discount for Kickstart to paid subscriptions (Year 1)"
    },
    {
      id: "pro",
      name: "Pro",
      price: "$99",
      billing: "per month + Usage",
      yearlyPrice: null,
      yearlyBilling: null,
      description: "Usage: $1 per 1000 Context",
      deployment: "Hybrid, One Instance, One Bouncer",
      usage: "$1 per 1000 Context",
      features: [
        "100 Active Policies",
        "5 Conditions per Policy",
        "Unlimited Decisions",
        "Unlimited Identities",
        "90 Days Log Retention",
        "Private Support Channel"
      ],
      isPopular: true,
      isCurrent: currentPlan === "pro",
      note: "10% discounts on yearly Pro subscriptions"
    },
    {
      id: "custom",
      name: "CUSTOM",
      price: "Contact Us",
      billing: "Ultimate control for growing organizations",
      description: "Usage: $0.75 per 1000 Context",
      deployment: "On-Prem, Multiple-Instances, One Bouncer",
      usage: "$0.75 per 1000 Context",
      features: [
        "Unlimited Active Policies",
        "Custom Permissions Scanner",
        "Smart Rules Recommender",
        "Unlimited Decisions",
        "Unlimited Identities",
        "Extended Log Retention",
        "Dedicated Account Manager"
      ],
      isPopular: false,
      isCurrent: currentPlan === "custom"
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Choose the Perfect Plan for Your Business</h2>
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <Badge variant="outline">No Additional/Hidden Setup Fees</Badge>
          <Badge variant="outline">Discounts applicable on yearly Pro or Custom subscriptions</Badge>
          <Badge variant="outline">20% discount for Kickstart to paid subscriptions (Year 1)</Badge>
        </div>
      </div>

      <Separator />

      {/* Current Plan Status - Only show for Kickstart trial */}
      {isTrialActive() && currentPlan === "kickstart" && trialDaysRemaining !== null && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong>Trial Active:</strong> {trialDaysRemaining} days remaining on your Kickstart Pilot
              </div>
              <Button size="sm" variant="outline" onClick={handleRequestExtension}>
                Request Extension
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative ${plan.isCurrent ? 'border-primary ring-2 ring-primary/20' : ''}`}>
            {plan.isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
              </div>
            )}
            {plan.isCurrent && (
              <div className="absolute -top-3 right-4">
                <Badge variant="secondary">Current Plan</Badge>
              </div>
            )}
            <CardHeader className="text-center space-y-4">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                {plan.id === 'custom' && <Crown className="h-6 w-6 text-yellow-500" />}
                {plan.name}
              </CardTitle>
              <div className="space-y-2">
                <div className="text-4xl font-bold">{plan.price}</div>
                <div className="text-sm text-muted-foreground">{plan.billing}</div>
                {plan.note && (
                  <div className="text-xs text-muted-foreground italic">
                    {plan.note}
                  </div>
                )}
              </div>
              <CardDescription className="text-base font-medium">{plan.description}</CardDescription>
              {plan.deployment && (
                <Badge variant="outline" className="mx-auto">
                  Deployment: {plan.deployment}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
              {plan.discount && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                  <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                    {plan.discount}
                  </p>
                </div>
              )}
              <div className="pt-4">
                {plan.isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={() => handleUpgrade(plan.id)}
                    variant={plan.isPopular ? "default" : "outline"}
                  >
                    {plan.id === 'custom' ? 'Get Started' : 'Get Started'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subscription Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Button variant="outline" onClick={handleContactSupport}>
              <Mail className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
            <Button variant="outline" onClick={handleRequestExtension}>
              <Calendar className="h-4 w-4 mr-2" />
              Request Extension
            </Button>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">Cancel Subscription</h4>
              <p className="text-sm text-muted-foreground">
                Need to cancel? We're here to help.
              </p>
            </div>
            <Button variant="destructive" onClick={handleCancelSubscription}>
              Cancel Subscription
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
