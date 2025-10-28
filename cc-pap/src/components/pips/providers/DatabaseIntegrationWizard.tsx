import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertCircle, 
  CheckCircle, 
  ExternalLink, 
  Settings, 
  Database, 
  Server, 
  Shield,
  Clock,
  TestTube,
  Key,
  Eye,
  EyeOff
} from "lucide-react";

interface DatabaseIntegrationWizardProps {
  config: {
    provider: string;
    host: string;
    port: number;
    database: string;
    schema: string;
    username: string;
    password: string;
    sslMode: string;
    connectionPool: number;
    selectedTables: string[];
    selectedColumns: Record<string, string[]>;
    syncFrequency: string;
    incrementalSync: boolean;
    timestampColumn: string;
  };
  onChange: (config: any) => void;
  onTest: () => void;
  isTesting: boolean;
  testResult: any;
}

export function DatabaseIntegrationWizard({ 
  config, 
  onChange, 
  onTest, 
  isTesting, 
  testResult 
}: DatabaseIntegrationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);

  const handleFieldChange = (field: string, value: any) => {
    onChange({
      ...config,
      [field]: value
    });
  };

  const handleTableToggle = (tableName: string, checked: boolean) => {
    const selectedTables = checked 
      ? [...config.selectedTables, tableName]
      : config.selectedTables.filter(table => table !== tableName);
    
    onChange({
      ...config,
      selectedTables
    });
  };

  const handleColumnToggle = (tableName: string, columnName: string, checked: boolean) => {
    const selectedColumns = { ...config.selectedColumns };
    if (!selectedColumns[tableName]) {
      selectedColumns[tableName] = [];
    }
    
    if (checked) {
      selectedColumns[tableName] = [...selectedColumns[tableName], columnName];
    } else {
      selectedColumns[tableName] = selectedColumns[tableName].filter(c => c !== columnName);
    }
    
    onChange({
      ...config,
      selectedColumns
    });
  };

  const databaseProviders = [
    {
      id: "postgresql",
      name: "PostgreSQL",
      defaultPort: 5432,
      sslModes: ["disable", "allow", "prefer", "require", "verify-ca", "verify-full"],
      icon: "🐘"
    },
    {
      id: "mysql",
      name: "MySQL",
      defaultPort: 3306,
      sslModes: ["disabled", "preferred", "required", "verify_ca", "verify_identity"],
      icon: "🐬"
    },
    {
      id: "mongodb",
      name: "MongoDB",
      defaultPort: 27017,
      sslModes: ["none", "ssl", "tls"],
      icon: "🍃"
    },
    {
      id: "sqlserver",
      name: "SQL Server",
      defaultPort: 1433,
      sslModes: ["disable", "enable"],
      icon: "🗄️"
    },
    {
      id: "oracle",
      name: "Oracle",
      defaultPort: 1521,
      sslModes: ["disable", "enable"],
      icon: "🔶"
    }
  ];

  const currentProvider = databaseProviders.find(p => p.id === config.provider);

  const sampleTables = [
    {
      name: "users",
      description: "User accounts and profiles",
      columns: ["id", "email", "username", "first_name", "last_name", "created_at", "updated_at", "is_active", "role_id"],
      icon: "👤"
    },
    {
      name: "roles",
      description: "User roles and permissions",
      columns: ["id", "name", "description", "permissions", "created_at", "updated_at"],
      icon: "🛡️"
    },
    {
      name: "resources",
      description: "System resources and assets",
      columns: ["id", "name", "type", "owner_id", "status", "created_at", "updated_at", "metadata"],
      icon: "📦"
    },
    {
      name: "audit_logs",
      description: "System audit and activity logs",
      columns: ["id", "user_id", "action", "resource_type", "resource_id", "timestamp", "ip_address", "details"],
      icon: "📋"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center space-x-4">
        {[1, 2, 3, 4, 5].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {step}
            </div>
            {step < 5 && (
              <div className={`w-12 h-0.5 ${currentStep > step ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Database Provider Selection */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Select Database Provider
            </CardTitle>
            <CardDescription>
              Choose your database type and provider
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {databaseProviders.map((provider) => (
                <div 
                  key={provider.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    config.provider === provider.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    handleFieldChange('provider', provider.id);
                    handleFieldChange('port', provider.defaultPort);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{provider.icon}</span>
                    <div>
                      <h3 className="font-medium">{provider.name}</h3>
                      <p className="text-sm text-gray-600">Port: {provider.defaultPort}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={() => setCurrentStep(2)} 
                disabled={!config.provider}
              >
                Next: Connection Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Connection Details */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Database Connection Details
            </CardTitle>
            <CardDescription>
              Configure your database connection parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="db-host">Host</Label>
                <Input 
                  id="db-host"
                  placeholder="localhost or database.example.com"
                  value={config.host}
                  onChange={(e) => handleFieldChange('host', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="db-port">Port</Label>
                <Input 
                  id="db-port"
                  type="number"
                  placeholder={currentProvider?.defaultPort.toString()}
                  value={config.port}
                  onChange={(e) => handleFieldChange('port', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="db-database">Database Name</Label>
                <Input 
                  id="db-database"
                  placeholder="your_database_name"
                  value={config.database}
                  onChange={(e) => handleFieldChange('database', e.target.value)}
                />
              </div>
              {(config.provider === 'postgresql' || config.provider === 'sqlserver' || config.provider === 'oracle') && (
                <div className="space-y-2">
                  <Label htmlFor="db-schema">Schema</Label>
                  <Input 
                    id="db-schema"
                    placeholder="public"
                    value={config.schema}
                    onChange={(e) => handleFieldChange('schema', e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="db-username">Username</Label>
                <Input 
                  id="db-username"
                  placeholder="database_user"
                  value={config.username}
                  onChange={(e) => handleFieldChange('username', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="db-password">Password</Label>
                <div className="relative">
                  <Input 
                    id="db-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="database_password"
                    value={config.password}
                    onChange={(e) => handleFieldChange('password', e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="db-ssl-mode">SSL Mode</Label>
                <Select value={config.sslMode} onValueChange={(value) => handleFieldChange('sslMode', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select SSL mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentProvider?.sslModes.map((mode) => (
                      <SelectItem key={mode} value={mode}>
                        {mode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="db-connection-pool">Connection Pool Size</Label>
                <Input 
                  id="db-connection-pool"
                  type="number"
                  placeholder="10"
                  value={config.connectionPool}
                  onChange={(e) => handleFieldChange('connectionPool', parseInt(e.target.value))}
                />
              </div>
            </div>

            <Alert className="border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <p className="text-sm">
                  <strong>Security Note:</strong> Database credentials will be encrypted and stored securely. 
                  Consider using connection pooling and read-only database users for production environments.
                </p>
              </AlertDescription>
            </Alert>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                Back
              </Button>
              <Button 
                onClick={() => setCurrentStep(3)} 
                disabled={!config.host || !config.database || !config.username || !config.password}
              >
                Next: Table Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Table Selection */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Select Tables and Columns
            </CardTitle>
            <CardDescription>
              Choose which tables and columns to sync for policy context
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <p>Available tables will be discovered after connection testing. For now, you can select from common table patterns.</p>
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sampleTables.map((table) => (
                <div key={table.name} className="border rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id={`table-${table.name}`}
                      checked={config.selectedTables.includes(table.name)}
                      onCheckedChange={(checked) => handleTableToggle(table.name, checked as boolean)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{table.icon}</span>
                        <Label htmlFor={`table-${table.name}`} className="font-medium">
                          {table.name}
                        </Label>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{table.description}</p>
                      
                      {config.selectedTables.includes(table.name) && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-700">Available Columns:</p>
                          <div className="grid grid-cols-2 gap-1">
                            {table.columns.map((column) => (
                              <div key={column} className="flex items-center space-x-1">
                                <Checkbox
                                  id={`column-${table.name}-${column}`}
                                  checked={config.selectedColumns[table.name]?.includes(column) || false}
                                  onCheckedChange={(checked) => handleColumnToggle(table.name, column, checked as boolean)}
                                />
                                <Label htmlFor={`column-${table.name}-${column}`} className="text-xs">
                                  {column}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                Back
              </Button>
              <Button 
                onClick={() => setCurrentStep(4)} 
                disabled={config.selectedTables.length === 0}
              >
                Next: Sync Configuration
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Sync Configuration */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Sync Configuration
            </CardTitle>
            <CardDescription>
              Configure how and when to sync data from your database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="db-sync-frequency">Sync Frequency</Label>
              <Select value={config.syncFrequency} onValueChange={(value) => handleFieldChange('syncFrequency', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sync frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5min">Every 5 minutes</SelectItem>
                  <SelectItem value="15min">Every 15 minutes</SelectItem>
                  <SelectItem value="hourly">Every hour</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="db-incremental-sync"
                checked={config.incrementalSync}
                onCheckedChange={(checked) => handleFieldChange('incrementalSync', checked)}
              />
              <Label htmlFor="db-incremental-sync">Enable incremental sync</Label>
            </div>

            {config.incrementalSync && (
              <div className="space-y-2">
                <Label htmlFor="db-timestamp-column">Timestamp Column</Label>
                <Input 
                  id="db-timestamp-column"
                  placeholder="updated_at or created_at"
                  value={config.timestampColumn}
                  onChange={(e) => handleFieldChange('timestampColumn', e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Column name to use for incremental sync (must be a timestamp/datetime column)
                </p>
              </div>
            )}

            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="space-y-2">
                  <p><strong>Performance Tips:</strong></p>
                  <ul className="text-sm list-disc list-inside space-y-1">
                    <li>Use incremental sync for large tables to reduce load</li>
                    <li>Select only necessary columns to minimize data transfer</li>
                    <li>Consider read replicas for production databases</li>
                    <li>Monitor query performance and add indexes if needed</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(3)}>
                Back
              </Button>
              <Button onClick={() => setCurrentStep(5)}>
                Next: Test Connection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Test Connection */}
      {currentStep === 5 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Test Database Connection
            </CardTitle>
            <CardDescription>
              Test your database connection and verify table access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Connection Test</h4>
                  <p className="text-sm text-gray-600">Verify database connectivity and table access</p>
                </div>
                <Button 
                  onClick={onTest} 
                  disabled={isTesting}
                  className="flex items-center gap-2"
                >
                  {isTesting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Testing...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4" />
                      Test Connection
                    </>
                  )}
                </Button>
              </div>

              {testResult && (
                <Alert className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={testResult.success ? "text-green-800" : "text-red-800"}>
                    {testResult.success ? (
                      <div className="space-y-2">
                        <p>✅ Connection successful!</p>
                        <div className="bg-green-100 p-2 rounded text-sm">
                          <p><strong>Response Time:</strong> {testResult.responseTime}s</p>
                          <p><strong>Database:</strong> {config.database}</p>
                          <p><strong>Tables Available:</strong> {testResult.details?.tables_count || 'N/A'}</p>
                          <p><strong>Provider:</strong> {currentProvider?.name}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p>❌ Connection failed</p>
                        <p className="text-sm">{testResult.error}</p>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <h4 className="font-medium">Selected Tables Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {config.selectedTables.map((tableName) => (
                    <div key={tableName} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">{tableName}</span>
                      <Badge variant="outline" className="text-xs">
                        {config.selectedColumns[tableName]?.length || 0} columns
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Connection Details</h4>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <p><strong>Provider:</strong> {currentProvider?.name}</p>
                  <p><strong>Host:</strong> {config.host}:{config.port}</p>
                  <p><strong>Database:</strong> {config.database}</p>
                  {config.schema && <p><strong>Schema:</strong> {config.schema}</p>}
                  <p><strong>SSL Mode:</strong> {config.sslMode}</p>
                  <p><strong>Sync Frequency:</strong> {config.syncFrequency}</p>
                  {config.incrementalSync && <p><strong>Incremental Sync:</strong> Enabled ({config.timestampColumn})</p>}
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(4)}>
                  Back
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.open('https://docs.controlcore.com/database-integration', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Database Integration Guide
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
