
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, CheckCircle, XCircle, Clock, Zap } from "lucide-react";

// Import centralized mock data
import { MOCK_FLOW_NODES, MOCK_FLOW_EDGES, type MockFlowNode, type MockFlowEdge } from "@/data/mockData";

// Type compatibility for existing component
type FlowNode = MockFlowNode;
type FlowEdge = MockFlowEdge;

const mockNodes: FlowNode[] = MOCK_FLOW_NODES;
const mockEdges: FlowEdge[] = MOCK_FLOW_EDGES;

const getNodeColor = (type: string, status?: string) => {
  if (status === 'evaluating') return '#f59e0b';
  if (status === 'true') return '#22c55e';
  if (status === 'false') return '#ef4444';
  if (status === 'skipped') return '#6b7280';
  
  switch (type) {
    case 'input': return '#3b82f6';
    case 'condition': return '#f59e0b';
    case 'rule': return '#8b5cf6';
    case 'decision': return '#ef4444';
    case 'pip': return '#06b6d4';
    default: return '#6b7280';
  }
};

const getNodeIcon = (type: string) => {
  switch (type) {
    case 'input': return '📥';
    case 'condition': return '❓';
    case 'rule': return '📋';
    case 'decision': return '⚖️';
    case 'pip': return '🔌';
    default: return '⚪';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'evaluating': return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'true': return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'false': return <XCircle className="h-4 w-4 text-red-500" />;
    case 'skipped': return <XCircle className="h-4 w-4 text-gray-500" />;
    default: return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

export function PolicyFlowVisualizer() {
  const [nodes, setNodes] = useState<FlowNode[]>(mockNodes);
  const [edges, setEdges] = useState<FlowEdge[]>(mockEdges);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const simulationSteps = [
    { nodeId: 'input', status: 'evaluating', details: 'Processing request: User john.doe wants to access /api/users' },
    { nodeId: 'admin_check', status: 'evaluating', details: 'Checking if user has admin role...' },
    { nodeId: 'admin_check', status: 'false', details: 'User is not an admin' },
    { nodeId: 'owner_check', status: 'evaluating', details: 'Checking if user owns the resource...' },
    { nodeId: 'owner_check', status: 'false', details: 'User is not the resource owner' },
    { nodeId: 'business_hours', status: 'evaluating', details: 'Checking current time...' },
    { nodeId: 'business_hours', status: 'true', details: 'Current time is within business hours' },
    { nodeId: 'manager_rule', status: 'evaluating', details: 'Evaluating manager access rule...' },
    { nodeId: 'manager_rule', status: 'true', details: 'User has manager permissions during business hours' },
    { nodeId: 'decision', status: 'true', details: 'ACCESS GRANTED: Manager access during business hours' }
  ];

  const startSimulation = () => {
    setIsSimulating(true);
    setCurrentStep(0);
    // Reset all nodes to inactive status
    setNodes(mockNodes.map(node => ({ ...node, status: 'inactive' as const, details: undefined })));
    setEdges(mockEdges.map(edge => ({ ...edge, active: false })));
  };

  const pauseSimulation = () => {
    setIsSimulating(false);
  };

  const resetSimulation = () => {
    setIsSimulating(false);
    setCurrentStep(0);
    setNodes(mockNodes.map(node => ({ ...node, status: 'inactive' as const, details: undefined })));
    setEdges(mockEdges.map(edge => ({ ...edge, active: false })));
  };

  useEffect(() => {
    if (!isSimulating || currentStep >= simulationSteps.length) return;

    const timer = setTimeout(() => {
      const step = simulationSteps[currentStep];
      
      setNodes(prev => prev.map(node => 
        node.id === step.nodeId 
          ? { ...node, status: step.status as any, details: step.details }
          : node
      ));

      // Activate relevant edges
      setEdges(prev => prev.map(edge => {
        const shouldActivate = 
          edge.fromId === step.nodeId && 
          (step.status === 'true' || step.status === 'false' || currentStep === simulationSteps.length - 1);
        return { ...edge, active: shouldActivate || edge.active };
      }));

      setCurrentStep(prev => prev + 1);

      if (currentStep >= simulationSteps.length - 1) {
        setIsSimulating(false);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [isSimulating, currentStep]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Policy Flow Visualizer</h2>
          <p className="text-muted-foreground">
            Trace policy evaluation flow in real-time with interactive simulation
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={startSimulation}
            disabled={isSimulating}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            Start Simulation
          </Button>
          <Button
            variant="outline"
            onClick={pauseSimulation}
            disabled={!isSimulating}
            className="flex items-center gap-2"
          >
            <Pause className="h-4 w-4" />
            Pause
          </Button>
          <Button
            variant="outline"
            onClick={resetSimulation}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      {/* Flow Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Policy Evaluation Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-96 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
            {/* SVG for connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
              {edges.map((edge, index) => {
                const fromNode = nodes.find(n => n.id === edge.fromId);
                const toNode = nodes.find(n => n.id === edge.toId);
                if (!fromNode || !toNode) return null;

                return (
                  <line
                    key={index}
                    x1={fromNode.x + 60}
                    y1={fromNode.y + 20}
                    x2={toNode.x}
                    y2={toNode.y + 20}
                    stroke={edge.active ? '#22c55e' : '#d1d5db'}
                    strokeWidth={edge.active ? 3 : 1}
                    strokeDasharray={edge.active ? '0' : '5,5'}
                  />
                );
              })}
            </svg>

            {/* Nodes */}
            {nodes.map((node) => (
              <div
                key={node.id}
                className="absolute transition-all duration-300"
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  zIndex: 2,
                }}
              >
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg shadow-md border-2 min-w-[120px]"
                  style={{
                    backgroundColor: getNodeColor(node.type, node.status),
                    borderColor: node.status === 'evaluating' ? '#f59e0b' : 'transparent',
                    color: 'white',
                  }}
                >
                  <span className="text-lg">{getNodeIcon(node.type)}</span>
                  <div className="flex-1">
                    <div className="text-xs font-medium">{node.label}</div>
                    {node.status && node.status !== 'inactive' && (
                      <div className="flex items-center gap-1 mt-1">
                        {getStatusIcon(node.status)}
                        <span className="text-xs capitalize">{node.status}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Simulation Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Current Step</CardTitle>
          </CardHeader>
          <CardContent>
            {currentStep > 0 && currentStep <= simulationSteps.length ? (
              <div className="space-y-2">
                <Badge variant="outline">
                  Step {currentStep} of {simulationSteps.length}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  {simulationSteps[currentStep - 1]?.details}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Click "Start Simulation" to begin policy evaluation flow
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Node Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span>📥</span> Input
              </div>
              <div className="flex items-center gap-2">
                <span>❓</span> Condition
              </div>
              <div className="flex items-center gap-2">
                <span>📋</span> Rule
              </div>
              <div className="flex items-center gap-2">
                <span>⚖️</span> Decision
              </div>
              <div className="flex items-center gap-2">
                <span>🔌</span> PIP
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" /> Evaluating
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" /> True
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-3 w-3 text-red-500" /> False
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
