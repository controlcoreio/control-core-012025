
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PolicyFlowVisualizer } from "./PolicyFlowVisualizer";
import { LeastPrivilegeAdvisor } from "./LeastPrivilegeAdvisor";
import { PredictivePEPHealth } from "./PredictivePEPHealth";
import { 
  Workflow, 
  Shield, 
  Activity, 
  Sparkles, 
  Brain, 
  TrendingUp,
  Eye,
  Zap
} from "lucide-react";

export function InnovativePrototypes() {
  const [activeTab, setActiveTab] = useState("overview");

  const features = [
    {
      id: "flow-visualizer",
      name: "Policy Decision Flow Visualizer",
      description: "Interactive visualization of policy evaluation paths with step-by-step debugging",
      icon: <Workflow className="h-6 w-6" />,
      status: "prototype",
      benefits: [
        "Visual policy debugging",
        "Non-technical stakeholder understanding", 
        "Real-time evaluation paths",
        "Interactive step-through"
      ]
    },
    {
      id: "privilege-advisor", 
      name: "Least Privilege Advisor",
      description: "AI-powered analysis to identify overly permissive policies and suggest hardening",
      icon: <Shield className="h-6 w-6" />,
      status: "prototype",
      benefits: [
        "Automated security hardening",
        "Usage-based recommendations",
        "Risk assessment",
        "Compliance support"
      ]
    },
    {
      id: "predictive-health",
      name: "Predictive PEP Health Dashboard", 
      description: "Machine learning-powered monitoring with anomaly detection and failure prediction",
      icon: <Activity className="h-6 w-6" />,
      status: "prototype", 
      benefits: [
        "Proactive issue detection",
        "Performance optimization",
        "Anomaly identification",
        "Predictive maintenance"
      ]
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Control Core Advanced CAPA Tools</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Pushing the boundaries of authorization management with cutting-edge AI visualization, 
          predictive analytics, and intelligent policy optimization
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="flow-visualizer">Flow Visualizer</TabsTrigger>
          <TabsTrigger value="privilege-advisor">Privilege Advisor</TabsTrigger>
          <TabsTrigger value="predictive-health">Predictive Health</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.id} className="relative">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="text-primary">{feature.icon}</div>
                    <div className="space-y-2">
                      <CardTitle className="text-lg leading-tight">{feature.name}</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        <Brain className="h-3 w-3 mr-1" />
                        {feature.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Key Benefits:</h4>
                    <ul className="space-y-1">
                      {feature.benefits.map((benefit, idx) => (
                        <li key={idx} className="text-xs text-muted-foreground flex items-center gap-2">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={() => setActiveTab(feature.id)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Prototype
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="h-6 w-6 text-blue-600" />
                <h3 className="text-xl font-bold">Revolutionary Impact</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">For Developers</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Visual debugging reduces troubleshooting time by 80%</li>
                    <li>• Intelligent suggestions accelerate policy creation</li>
                    <li>• Predictive monitoring prevents outages</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">For Security Teams</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Automated least privilege enforcement</li>
                    <li>• Real-time anomaly detection</li>
                    <li>• Data-driven security hardening</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">For Organizations</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Reduced operational overhead</li>
                    <li>• Enhanced compliance posture</li>
                    <li>• Proactive risk management</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flow-visualizer">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                Interactive Policy Decision Flow Visualizer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PolicyFlowVisualizer />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privilege-advisor">
          <LeastPrivilegeAdvisor />
        </TabsContent>

        <TabsContent value="predictive-health">
          <PredictivePEPHealth />
        </TabsContent>
      </Tabs>
    </div>
  );
}
