import React, { useState, useEffect } from 'react';

// UI Components (reusing from StripeCRMDashboard)
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
    {children}
  </div>
);

const Button: React.FC<{ 
  children: React.ReactNode; 
  onClick?: () => void; 
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}> = ({ children, onClick, className = '', variant = 'primary', size = 'md' }) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50',
    ghost: 'hover:bg-gray-100',
    destructive: 'bg-red-600 text-white hover:bg-red-700'
  };
  
  const sizeClasses = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 py-2',
    lg: 'h-11 px-8'
  };
  
  return (
    <button 
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  );
};

const Badge: React.FC<{ children: React.ReactNode; variant?: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' }> = ({ children, variant = 'default' }) => {
  const variantClasses = {
    default: 'bg-blue-100 text-blue-800 border-blue-200',
    secondary: 'bg-gray-100 text-gray-800 border-gray-200',
    destructive: 'bg-red-100 text-red-800 border-red-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  };
  
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variantClasses[variant]}`}>
      {children}
    </span>
  );
};

const Table: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative w-full overflow-auto">
    <table className="w-full caption-bottom text-sm">
      {children}
    </table>
  </div>
);

const TableHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <thead className="[&_tr]:border-b">
    {children}
  </thead>
);

const TableBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tbody className="[&_tr:last-child]:border-0">
    {children}
  </tbody>
);

const TableRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tr className="border-b transition-colors hover:bg-gray-50">
    {children}
  </tr>
);

const TableHead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 [&:has([role=checkbox])]:pr-0">
    {children}
  </th>
);

const TableCell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
    {children}
  </td>
);

const Tabs: React.FC<{ children: React.ReactNode; defaultValue?: string }> = ({ children, defaultValue }) => (
  <div className="w-full">
    {children}
  </div>
);

const TabsList: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500">
    {children}
  </div>
);

const TabsTrigger: React.FC<{ 
  value: string; 
  children: React.ReactNode; 
  active?: boolean;
  onClick?: () => void;
}> = ({ value, children, active = false, onClick }) => (
  <button 
    onClick={onClick}
    className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
      active ? 'bg-white text-gray-900 shadow-sm' : 'hover:bg-white/50'
    }`}
  >
    {children}
  </button>
);

const TabsContent: React.FC<{ value: string; children: React.ReactNode; active?: boolean }> = ({ value, children, active = false }) => (
  <div className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${active ? 'block' : 'hidden'}`}>
    {children}
  </div>
);

// Icons
const Activity = () => <span className="h-4 w-4">📊</span>;
const Shield = () => <span className="h-4 w-4">🛡️</span>;
const DollarSign = () => <span className="h-4 w-4">$</span>;
const TrendingUp = () => <span className="h-4 w-4">📈</span>;
const Download = () => <span className="h-4 w-4">⬇</span>;
const Settings = () => <span className="h-4 w-4">⚙</span>;
const RefreshCw = () => <span className="h-4 w-4">🔄</span>;
const AlertTriangle = () => <span className="h-4 w-4">⚠️</span>;
const CheckCircle = () => <span className="h-4 w-4">✅</span>;
const Lock = () => <span className="h-4 w-4">🔒</span>;

// Types
interface TelemetryEvent {
  event_id: string;
  tenant_id: string;
  event_type: string;
  level: string;
  timestamp: string;
  component: string;
  action: string;
  metadata: Record<string, any>;
  anonymized_user_id?: string;
  policy_count?: number;
  context_generation_count?: number;
  ingestion_count?: number;
  billing_metric?: number;
}

interface TelemetrySummary {
  tenant_id: string;
  period: {
    start: string;
    end: string;
  };
  summary: {
    total_events: number;
    policy_evaluations: number;
    context_generations: number;
    context_ingestions: number;
    billing_events: number;
    security_events: number;
  };
  compliance: {
    data_retention_days: number;
    encryption_enabled: boolean;
    anonymization_enabled: boolean;
    soc2_compliant: boolean;
  };
}

// Mock data
const mockTelemetryEvents: TelemetryEvent[] = [
  {
    event_id: 'evt_001',
    tenant_id: 'tenant_acme_001',
    event_type: 'policy_evaluation',
    level: 'info',
    timestamp: '2024-01-25T10:30:00Z',
    component: 'cc-bouncer',
    action: 'policy_evaluation',
    metadata: {
      policy_name: 'access_control_main',
      decision: 'allow',
      evaluation_time_ms: 45.2,
      resource_type: 'api_endpoint'
    },
    anonymized_user_id: 'a1b2c3d4e5f6',
    policy_count: 1
  },
  {
    event_id: 'evt_002',
    tenant_id: 'tenant_acme_001',
    event_type: 'context_generation',
    level: 'info',
    timestamp: '2024-01-25T10:29:45Z',
    component: 'cc-bouncer',
    action: 'context_generation',
    metadata: {
      context_type: 'user_profile',
      source_count: 3,
      generation_time_ms: 120.5
    },
    anonymized_user_id: 'a1b2c3d4e5f6',
    context_generation_count: 3
  },
  {
    event_id: 'evt_003',
    tenant_id: 'tenant_acme_001',
    event_type: 'billing_event',
    level: 'info',
    timestamp: '2024-01-25T10:29:30Z',
    component: 'cc-business-admin',
    action: 'billing_metric',
    metadata: {
      billing_type: 'api_call',
      metric_timestamp: '2024-01-25T10:29:30Z'
    },
    anonymized_user_id: 'a1b2c3d4e5f6',
    billing_metric: 1.5
  }
];

const mockTelemetrySummary: TelemetrySummary = {
  tenant_id: 'tenant_acme_001',
  period: {
    start: '2024-01-01T00:00:00Z',
    end: '2024-01-25T23:59:59Z'
  },
  summary: {
    total_events: 1250,
    policy_evaluations: 850,
    context_generations: 200,
    context_ingestions: 150,
    billing_events: 50,
    security_events: 0
  },
  compliance: {
    data_retention_days: 90,
    encryption_enabled: true,
    anonymization_enabled: true,
    soc2_compliant: true
  }
};

const TelemetryBilling: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [telemetryEvents, setTelemetryEvents] = useState<TelemetryEvent[]>(mockTelemetryEvents);
  const [telemetrySummary, setTelemetrySummary] = useState<TelemetrySummary>(mockTelemetrySummary);
  const [isLoading, setIsLoading] = useState(false);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();
  const formatDateTime = (dateString: string) => new Date(dateString).toLocaleString();

  const calculateBillingMetrics = () => {
    const totalBillingEvents = telemetryEvents
      .filter(event => event.event_type === 'billing_event')
      .reduce((sum, event) => sum + (event.billing_metric || 0), 0);
    
    const totalPolicyEvaluations = telemetryEvents
      .filter(event => event.event_type === 'policy_evaluation')
      .length;
    
    const totalContextOperations = telemetryEvents
      .filter(event => ['context_generation', 'context_ingestion'].includes(event.event_type))
      .length;

    return {
      totalBillingEvents,
      totalPolicyEvaluations,
      totalContextOperations,
      estimatedCost: totalBillingEvents * 0.001 // $0.001 per billing unit
    };
  };

  const billingMetrics = calculateBillingMetrics();

  const handleRefreshData = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleExportData = () => {
    // Export telemetry data (anonymized)
    const exportData = {
      summary: telemetrySummary,
      events: telemetryEvents.map(event => ({
        ...event,
        metadata: Object.keys(event.metadata).reduce((acc, key) => {
          // Remove any potentially sensitive data
          if (!['password', 'token', 'secret', 'key'].some(sensitive => key.toLowerCase().includes(sensitive))) {
            acc[key] = event.metadata[key];
          }
          return acc;
        }, {} as Record<string, any>))
      })),
      exported_at: new Date().toISOString(),
      compliance_note: 'Data exported with SOC2-compliant anonymization'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telemetry-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Telemetry & Billing Dashboard</h1>
            <p className="text-sm text-gray-600">SOC2-compliant telemetry monitoring and usage-based billing</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={handleExportData}>
              <Download className="mr-2" />
              Export Data
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefreshData} disabled={isLoading}>
              <RefreshCw className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* SOC2 Compliance Alert */}
        <Card className="border-green-200 bg-green-50">
          <div className="flex items-center gap-3">
            <CheckCircle />
            <div>
              <h3 className="font-medium text-green-900">SOC2 Compliance Active</h3>
              <p className="text-sm text-green-700">
                All telemetry data is encrypted, anonymized, and retained according to SOC2 standards.
                Data retention: {telemetrySummary.compliance.data_retention_days} days.
              </p>
            </div>
          </div>
        </Card>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-bold">{telemetrySummary.summary.total_events.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Last 30 days</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Policy Evaluations</p>
                <p className="text-2xl font-bold">{telemetrySummary.summary.policy_evaluations.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +15.2% from last month
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Context Operations</p>
                <p className="text-2xl font-bold">{(telemetrySummary.summary.context_generations + telemetrySummary.summary.context_ingestions).toLocaleString()}</p>
                <p className="text-xs text-gray-500">Generation + Ingestion</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Estimated Cost</p>
                <p className="text-2xl font-bold">{formatCurrency(billingMetrics.estimatedCost)}</p>
                <p className="text-xs text-gray-500">Usage-based billing</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger 
                value="overview" 
                active={activeTab === 'overview'}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="events" 
                active={activeTab === 'events'}
                onClick={() => setActiveTab('events')}
              >
                Telemetry Events
              </TabsTrigger>
              <TabsTrigger 
                value="billing" 
                active={activeTab === 'billing'}
                onClick={() => setActiveTab('billing')}
              >
                Billing Metrics
              </TabsTrigger>
              <TabsTrigger 
                value="compliance" 
                active={activeTab === 'compliance'}
                onClick={() => setActiveTab('compliance')}
              >
                Compliance
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" active={activeTab === 'overview'}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Event Types Distribution</h3>
                  <Activity />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Policy Evaluations</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '68%' }}></div>
                      </div>
                      <span className="text-sm font-medium">{telemetrySummary.summary.policy_evaluations}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Context Generations</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '16%' }}></div>
                      </div>
                      <span className="text-sm font-medium">{telemetrySummary.summary.context_generations}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Context Ingestions</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: '12%' }}></div>
                      </div>
                      <span className="text-sm font-medium">{telemetrySummary.summary.context_ingestions}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Billing Events</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '4%' }}></div>
                      </div>
                      <span className="text-sm font-medium">{telemetrySummary.summary.billing_events}</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Security Status</h3>
                  <Lock />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Encryption</span>
                    <Badge variant="success">
                      {telemetrySummary.compliance.encryption_enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Anonymization</span>
                    <Badge variant="success">
                      {telemetrySummary.compliance.anonymization_enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">SOC2 Compliance</span>
                    <Badge variant="success">
                      {telemetrySummary.compliance.soc2_compliant ? 'Compliant' : 'Non-Compliant'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Security Events</span>
                    <Badge variant={telemetrySummary.summary.security_events === 0 ? 'success' : 'warning'}>
                      {telemetrySummary.summary.security_events}
                    </Badge>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" active={activeTab === 'events'}>
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Recent Telemetry Events</h2>
                <Badge variant="default">
                  {telemetryEvents.length} events
                </Badge>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Component</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Metadata</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {telemetryEvents.map((event) => (
                    <TableRow key={event.event_id}>
                      <TableCell>
                        <Badge variant={
                          event.event_type === 'security_event' ? 'destructive' :
                          event.event_type === 'billing_event' ? 'warning' : 'default'
                        }>
                          {event.event_type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {event.component}
                      </TableCell>
                      <TableCell>
                        {event.action.replace('_', ' ')}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDateTime(event.timestamp)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {event.anonymized_user_id ? event.anonymized_user_id.substring(0, 8) + '...' : 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {Object.keys(event.metadata).length} fields
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" active={activeTab === 'billing'}>
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Billing Metrics</h2>
                <Badge variant="default">
                  {formatCurrency(billingMetrics.estimatedCost)} estimated
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Billing Events</h3>
                  <p className="text-2xl font-bold text-blue-900">{billingMetrics.totalBillingEvents}</p>
                  <p className="text-sm text-blue-700">Units this month</p>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <h3 className="font-semibold text-green-900">Policy Evaluations</h3>
                  <p className="text-2xl font-bold text-green-900">{billingMetrics.totalPolicyEvaluations}</p>
                  <p className="text-sm text-green-700">Free tier included</p>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <h3 className="font-semibold text-purple-900">Context Operations</h3>
                  <p className="text-2xl font-bold text-purple-900">{billingMetrics.totalContextOperations}</p>
                  <p className="text-sm text-purple-700">Generation + Ingestion</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" active={activeTab === 'compliance'}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <div className="flex items-center gap-3 mb-4">
                  <Shield />
                  <h3 className="text-lg font-semibold">Data Protection</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Data Retention</span>
                    <span className="text-sm font-medium">{telemetrySummary.compliance.data_retention_days} days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Encryption Status</span>
                    <Badge variant="success">AES-256-GCM</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Anonymization</span>
                    <Badge variant="success">HMAC-SHA256</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Key Rotation</span>
                    <Badge variant="success">90 days</Badge>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle />
                  <h3 className="text-lg font-semibold">SOC2 Compliance</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Security Controls</span>
                    <Badge variant="success">Implemented</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Access Controls</span>
                    <Badge variant="success">RBAC Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Audit Logging</span>
                    <Badge variant="success">Comprehensive</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Incident Response</span>
                    <Badge variant="success">Documented</Badge>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TelemetryBilling;