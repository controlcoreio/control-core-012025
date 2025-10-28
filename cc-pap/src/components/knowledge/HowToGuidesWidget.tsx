
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Info } from "lucide-react";

const guides = [
  {
    title: "Creating Policies",
    children: [
      {
        subtitle: "Using the Policy Builder",
        steps: [
          "Navigate to the Policy Builder via the sidebar.",
          "Select your resource and define actions and conditions.",
          "Use the stepper to configure rules (e.g., access by user, time, or location).",
          "Save and review your policy before publishing.",
        ],
        tip: "Explore different rule types (attribute, time, ownership) for flexible controls."
      },
      {
        subtitle: "Using the Policy Editor",
        steps: [
          "Select or create a new policy in the Editor.",
          "Write policy logic in Rego using supported syntax.",
          "Use inline help and autocomplete for common structures.",
          "Validate for syntax errors before saving.",
        ],
        tip: "Keep policies modular. Start with simple rules and add complexity gradually."
      },
      {
        subtitle: "Using the Policy Pilot",
        steps: [
          "Choose Policy Pilot from the sidebar.",
          "Write a plain-language request (e.g., 'Allow managers to approve expenses over $500').",
          "Review the generated policy and explanations.",
          "Refine prompts to cover more scenarios.",
        ],
        tip: "Use clear prompts and provide context for best results."
      },
    ]
  },
  {
    title: "Managing Policy Versions",
    children: [
      {
        subtitle: "Reviewing Policy History",
        steps: [
          "Open a policy and switch to the Version Control tab.",
          "Browse the list of available versions with timestamps.",
        ],
        tip: "Regularly review history to track important changes."
      },
      {
        subtitle: "Comparing Policy Versions",
        steps: [
          "Select two versions to compare side-by-side.",
          "Examine differences in logic, conditions, or metadata.",
        ]
      },
      {
        subtitle: "Restoring to a Previous Version",
        steps: [
          "Choose a version and click 'Restore'.",
          "Confirm changes in the dialog prompt.",
        ]
      }
    ],
  },
  {
    title: "Using the Test Console",
    children: [
      {
        subtitle: "Inputting Test Data",
        steps: [
          "Navigate to Test Console.",
          "Choose a policy and provide sample input data (user, resource, action, context).",
        ]
      },
      {
        subtitle: "Interpreting Test Results",
        steps: [
          "Submit the test and view the decision (Permit/Deny) and explanation.",
          "Iterate on policy logic if results aren't as expected.",
        ],
        tip: "Test edge cases by varying input for more robust coverage."
      },
    ]
  },
  {
    title: "Analyzing Policies",
    children: [
      {
        subtitle: "Identifying Conflicts",
        steps: [
          "Open Policy Analysis from sidebar.",
          "View flagged conflicts in policy logic or overlapping rules.",
        ]
      },
      {
        subtitle: "Checking Policy Coverage",
        steps: [
          "Review which resources and actions are governed by each policy.",
          "Identify gaps or redundancies.",
        ]
      },
      {
        subtitle: "Reviewing Performance Metrics",
        steps: [
          "Check latency and usage metrics for each policy in the Analysis dashboard.",
        ]
      },
      {
        subtitle: "Utilizing Smart Policy Suggestions",
        steps: [
          "Explore AI-generated recommendations for improvements or consolidation."
        ]
      },
    ]
  },
  {
    title: "Leveraging Policy Templates",
    children: [
      {
        subtitle: "Browsing Available Templates",
        steps: [
          "Navigate to Templates page.",
          "Browse or search for a relevant template by category.",
        ]
      },
      {
        subtitle: "Customizing and Applying Templates",
        steps: [
          "Select a template and edit resource, action, or condition settings as needed.",
          "Apply and review before activating.",
        ]
      },
    ]
  },
  {
    title: "Configuring Information Points (PIPs)",
    children: [
      {
        subtitle: "Adding New PIP Connections",
        steps: [
          "Go to PIPs section and click 'Add New'.",
          "Select PIP type (user, resource, environment context)."
        ]
      },
      {
        subtitle: "Mapping Attributes",
        steps: [
          "Map attributes from your source to platform attributes.",
          "Test the connection and save."
        ]
      },
    ]
  },
  {
    title: "Understanding Audit Logs",
    children: [
      {
        subtitle: "Navigating and Filtering Logs",
        steps: [
          "Access Audit Logs via the sidebar.",
          "Use filter, search, and sort to find relevant events.",
        ]
      },
      {
        subtitle: "Analyzing Authorization Time",
        steps: [
          "Sort logs by authorization latency to find slow evaluations.",
        ],
        tip: "Investigate slow requests by checking policy complexity or integration issues."
      },
      {
        subtitle: "Reviewing Related Policies",
        steps: [
          "Click on an event to expand related policies that influenced the decision.",
        ]
      }
    ]
  },
  {
    title: "Setting Up Smart Connections",
    children: [
      {
        subtitle: "Connecting API Gateways",
        steps: [
          "Navigate to Integrations > Gateways.",
          "Add a new API Gateway and configure endpoint settings.",
        ],
      },
      {
        subtitle: "Connecting AI Agents",
        steps: [
          "Navigate to Integrations > AI Agents.",
          "Register a new agent and set connection parameters.",
        ],
      },
      {
        subtitle: "Configuring Interception Options",
        steps: [
          "Choose which requests or events are intercepted for dynamic authorization."
        ],
      }
    ]
  },
  {
    title: "Managing PEP Deployments",
    children: [
      {
        subtitle: "Adding New PEPs",
        steps: [
          "Go to PEP Management and click 'Add New PEP'.",
          "Download secure deployment bundle and configure with your infrastructure.",
        ]
      },
      {
        subtitle: "Monitoring PEP Status",
        steps: [
          "View real-time status and health for all deployed PEPs."
        ]
      },
      {
        subtitle: "Testing PEP Connections",
        steps: [
          "Use the test utility to verify connectivity and policy enforcement.",
        ]
      }
    ]
  },
];

export function HowToGuidesWidget() {
  // Open/close state for each accordion group
  const [openIndexes, setOpenIndexes] = useState<{[key: number]: boolean}>({});

  const toggleAccordion = (idx: number) => {
    setOpenIndexes(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>
          How-To Guides
          <Badge variant="secondary" className="ml-2 px-2 py-1 rounded-full text-xs">Quick Help</Badge>
        </CardTitle>
        <CardDescription>
          Step-by-step instructions for key platform features. Click any topic for details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full space-y-2">
          {guides.map((guide, idx) => (
            <AccordionItem value={String(idx)} key={guide.title} className="border-b">
              <AccordionTrigger
                className="text-base font-medium py-2"
                onClick={() => toggleAccordion(idx)}
              >
                <span className="flex items-center gap-2">
                  <ArrowRight className="text-muted-foreground h-4 w-4" />
                  {guide.title}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {guide.children.map((entry, subIdx) => (
                    <div className="mb-4" key={entry.subtitle}>
                      <div className="font-semibold text-sm mb-1">{entry.subtitle}</div>
                      <ol className="pl-5 list-decimal text-sm mb-1 space-y-1">
                        {entry.steps.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                      {entry.tip && (
                        <div className="flex items-center text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded mt-1">
                          <Info className="w-3 h-3 mr-1" />
                          <span className="italic">{entry.tip}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
