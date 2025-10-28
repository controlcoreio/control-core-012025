import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Shield, Building2, Cloud, ArrowRight, ArrowLeft } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";

const deploymentOptions = [
  {
    id: 'hosted',
    title: 'Control Core Hosted',
    description: 'We manage the infrastructure for you',
    icon: Cloud,
    features: [
      'Fully managed hosting',
      'Automatic updates and maintenance',
      'High availability guaranteed',
      'No infrastructure management',
      'Quick setup - PEP download only'
    ],
    badge: 'Recommended',
    badgeColor: 'bg-blue-600',
    targetRoute: '/pro-setup'
  },
  {
    id: 'self-hosted',
    title: 'Host Yourself',
    description: 'Deploy on your own infrastructure',
    icon: Building2,
    features: [
      'Complete control over deployment',
      'Data stays in your environment',
      'Custom configurations available',
      'Air-gapped deployments supported',
      'Full Control Plane + PEP download'
    ],
    badge: 'Advanced',
    badgeColor: 'bg-purple-600',
    targetRoute: '/custom-setup'
  }
];

export function PlanSelectionNextPage() {
  const navigate = useNavigate();
  const { subscription } = useSubscription();
  const { toast } = useToast();

  const handleDeploymentSelection = (option: typeof deploymentOptions[0]) => {
    toast({
      title: `${option.title} Selected`,
      description: `Setting up your ${option.title.toLowerCase()} deployment...`,
    });
    navigate(option.targetRoute);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 relative">
      {/* Navigation */}
      <div className="absolute top-4 left-4">
        <Button 
          variant="outline" 
          onClick={() => navigate('/signup')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Plan Selection
        </Button>
      </div>

      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Choose Your Deployment Model
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            How would you like to deploy Control Core?
          </p>
          {subscription?.tier === 'kickstart' && (
            <p className="text-sm text-muted-foreground mt-2">
              You're on the Kickstart Plan - choose how you'd like to proceed
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {deploymentOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Card 
                key={option.id}
                className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
              >
                <CardHeader className="relative pb-4">
                  <Badge className={`absolute -top-2 -right-2 ${option.badgeColor} text-white`}>
                    {option.badge}
                  </Badge>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{option.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {option.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {option.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    onClick={() => handleDeploymentSelection(option)}
                    className="w-full flex items-center justify-center gap-2"
                    variant={option.id === 'hosted' ? 'default' : 'outline'}
                  >
                    Select {option.title}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Don't worry - you can change this later or use both deployment models
          </p>
        </div>
      </div>
    </div>
  );
}