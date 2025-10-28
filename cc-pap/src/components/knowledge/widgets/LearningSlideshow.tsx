
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function LearningSlideshow() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    {
      title: "What is Dynamic Authorization?",
      content: (
        <div className="space-y-4">
          <p>
            Dynamic Authorization is an approach to access control that evaluates authorization decisions in real-time based on 
            contextual information and policies.
          </p>
          <div className="bg-primary/5 p-4 rounded-lg border">
            <h4 className="font-medium mb-2">Key Benefits:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Granular access control beyond simple role-based permissions</li>
              <li>Centralized policy management separate from application code</li>
              <li>Adaptable to changing business requirements without code changes</li>
              <li>Real-time evaluation based on current context and attributes</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Introduction to Policy-Based Access Control (PBAC)",
      content: (
        <div className="space-y-4">
          <p>
            Policy-Based Access Control (PBAC) is a model where access decisions are determined by evaluating policies 
            defined as rules that consider various attributes and context.
          </p>
          <div className="bg-primary/5 p-4 rounded-lg border">
            <h4 className="font-medium mb-2">Key Principles:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Policies are defined separately from application code</li>
              <li>Authorization logic is centralized and consistently applied</li>
              <li>Decisions can factor in user attributes, resource properties, and environmental context</li>
              <li>Policies are human-readable and auditable</li>
            </ul>
          </div>
          <p className="text-sm text-muted-foreground">
            PBAC extends beyond traditional RBAC (Role-Based Access Control) by considering dynamic factors 
            rather than relying solely on static roles.
          </p>
        </div>
      )
    },
    {
      title: "Understanding Fine-Grained Authorization",
      content: (
        <div className="space-y-4">
          <p>
            Fine-Grained Authorization allows for precise control over access to resources at a detailed level, 
            enabling organizations to implement the principle of least privilege effectively.
          </p>
          <div className="flex justify-center my-4">
            <div className="bg-primary/5 p-4 rounded-lg border max-w-md">
              <h4 className="font-medium mb-2">Examples of Fine-Grained Controls:</h4>
              <ul className="list-disc pl-5 space-y-2">
                <li>Restricting access to specific data fields within records</li>
                <li>Allowing actions only during business hours</li>
                <li>Permitting access only from approved locations or networks</li>
                <li>Limiting operations based on resource ownership or relationships</li>
              </ul>
            </div>
          </div>
          <p>
            This approach significantly reduces security risks by ensuring users only have access to 
            exactly what they need, when they need it, under appropriate conditions.
          </p>
        </div>
      )
    },
    {
      title: "Dynamic Authorization in a Zero-Trust Architecture",
      content: (
        <div className="space-y-4">
          <p>
            Dynamic Authorization is a critical component of Zero-Trust Architecture, where the principle 
            "never trust, always verify" guides all access decisions.
          </p>
          <div className="bg-primary/5 p-4 rounded-lg border">
            <h4 className="font-medium mb-2">How Dynamic Authorization Supports Zero-Trust:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Every access request is fully authenticated and authorized</li>
              <li>Access is granted based on multiple factors, not just identity</li>
              <li>Continuous verification throughout a session, not just at login</li>
              <li>Contextual attributes inform access decisions in real-time</li>
              <li>Policy enforcement is consistent across all applications and resources</li>
            </ul>
          </div>
          <p className="text-sm text-muted-foreground italic">
            "In a Zero-Trust model, Dynamic Authorization ensures that even authenticated users 
            only receive appropriate access based on current context and conditions."
          </p>
        </div>
      )
    }
  ];
  const goToNextSlide = () => setCurrentSlide((prev) => (prev < slides.length - 1 ? prev + 1 : prev));
  const goToPrevSlide = () => setCurrentSlide((prev) => (prev > 0 ? prev - 1 : prev));
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Fundamentals of Dynamic Authorization</CardTitle>
        <CardDescription>
          An interactive guide to the core concepts
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-4">{slides[currentSlide].title}</h3>
          <div className="prose prose-sm max-w-none">
            {slides[currentSlide].content}
          </div>
        </div>
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <div className="flex items-center gap-2">
            {slides.map((_, index) => (
              <Button 
                key={index}
                variant="ghost" 
                size="icon"
                className={cn(
                  "h-2 w-2 rounded-full p-0",
                  currentSlide === index ? "bg-primary" : "bg-muted"
                )}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevSlide}
              disabled={currentSlide === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextSlide}
              disabled={currentSlide === slides.length - 1}
            >
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
