import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Shield, Users, Building, Globe, FileText, ArrowRight, ArrowLeft, Check, Lightbulb, Cloud, Settings, Headphones, Package, Folder, BarChart3, Key, Server, Upload, TestTube, AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { OktaOAuthFields } from "./providers/OktaOAuthFields";
import { AzureADOAuthFields } from "./providers/AzureADOAuthFields";
import { Auth0OAuthFields } from "./providers/Auth0OAuthFields";
import { OAuthFields } from "./auth/OAuthFields";
import { APIKeyFields } from "./auth/APIKeyFields";
import { BasicAuthFields } from "./auth/BasicAuthFields";
import { CertificateFields } from "./auth/CertificateFields";

interface AddInformationSourceWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (pip: any) => void;
  preselectedType?: string;
  environment: string; // 'sandbox' or 'production' from top header
}

const dataSourceTypes = [
  // Identity & HR Category
  {
    id: "identity",
    title: "Identity Provider (IAM)",
    subtitle: "Okta, Azure AD, Auth0",
    description: "Connect your primary Identity Provider for user roles, groups, and authentication context",
    icon: Shield,
    color: "text-blue-500",
    category: "identity"
  },
  {
    id: "hr",
    title: "User Directory / HR System",
    subtitle: "Workday, BambooHR, ADP",
    description: "Integrate HR or user directories for employee details, departments, and managers",
    icon: Users,
    color: "text-green-500",
    category: "identity"
  },
  
  // Business Apps Category
  {
    id: "crm",
    title: "CRM System", 
    subtitle: "Salesforce, HubSpot, Dynamics",
    description: "Pull customer-specific attributes like customer tier, region, or sales representative ownership",
    icon: Building,
    color: "text-purple-500",
    category: "business"
  },
  {
    id: "erp",
    title: "ERP System",
    subtitle: "SAP, Oracle ERP, Dynamics 365",
    description: "Connect to your ERP system for financial, project, cost center, and organizational unit data",
    icon: Package,
    color: "text-amber-500",
    category: "business"
  },
  {
    id: "csm",
    title: "CSM / Ticketing System",
    subtitle: "ServiceNow, Jira, Zendesk",
    description: "Pull context from ticketing systems like ticket status, urgency, or assignee for incident-based access control",
    icon: Headphones,
    color: "text-pink-500",
    category: "business"
  },
  
  // Cloud & Infrastructure Category
  {
    id: "cloud",
    title: "Cloud Provider Metadata",
    subtitle: "AWS, Azure, GCP APIs",
    description: "Fetch real-time metadata and tags about your cloud resources (VMs, storage buckets, functions)",
    icon: Cloud,
    color: "text-sky-500",
    category: "infrastructure"
  },
  {
    id: "cmdb",
    title: "Configuration Management DB",
    subtitle: "ServiceNow CMDB, BMC Helix",
    description: "Integrate with your CMDB for detailed asset information, ownership, and configuration item relationships",
    icon: Settings,
    color: "text-slate-500",
    category: "infrastructure"
  },
  {
    id: "database",
    title: "Database",
    subtitle: "PostgreSQL, MongoDB, Oracle",
    description: "Connect to custom databases containing application-specific data or resource attributes",
    icon: Database,
    color: "text-indigo-500",
    category: "infrastructure"
  },
  {
    id: "warehouse",
    title: "Data Warehouse / Lake",
    subtitle: "Snowflake, Databricks, BigQuery",
    description: "Connect to centralized data warehouses or lakes for aggregated business intelligence data",
    icon: BarChart3,
    color: "text-emerald-500",
    category: "infrastructure"
  },
  
  // Custom Category
  {
    id: "api",
    title: "Custom API / Webhook",
    subtitle: "REST, GraphQL, Webhooks",
    description: "Integrate with any custom internal or external API endpoints for dynamic data",
    icon: Globe,
    color: "text-cyan-500",
    category: "custom"
  },
  {
    id: "documents",
    title: "Document/File Storage",
    subtitle: "SharePoint, Google Drive, S3",
    description: "Retrieve metadata about documents, files, or folders (e.g., sensitivity labels, author, last modified)",
    icon: Folder,
    color: "text-orange-500",
    category: "custom"
  },
  {
    id: "static",
    title: "Static Data",
    subtitle: "CSV, JSON files",
    description: "Upload static files or provide URLs for non-changing policy data",
    icon: FileText,
    color: "text-gray-500",
    category: "custom"
  }
];

const sampleSourceData = {
  "employee_id": "EMP12345",
  "first_name": "John",
  "last_name": "Doe", 
  "email": "john.doe@company.com",
  "department": "Engineering",
  "role": "Senior Developer",
  "manager_id": "EMP67890",
  "location": "San Francisco",
  "employee_status": "Active",
  "hire_date": "2020-03-15"
};

const proposedAttributes = [
  { key: "user.id", description: "Unique user identifier" },
  { key: "user.email", description: "User email address" },
  { key: "user.department", description: "User's department" },
  { key: "user.role", description: "User's job role" },
  { key: "user.manager", description: "User's manager ID" },
  { key: "user.location", description: "User's work location" },
  { key: "user.status", description: "User employment status" }
];

export function AddInformationSourceWizard({ isOpen, onClose, onAdd, preselectedType, environment }: AddInformationSourceWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedType, setSelectedType] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [pipName, setPipName] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [loginUrl, setLoginUrl] = useState("");
  const [authType, setAuthType] = useState("api-key");
  const [provider, setProvider] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [attributeMapping, setAttributeMapping] = useState<Record<string, string>>({});
  const [updateFrequency, setUpdateFrequency] = useState("hourly");
  const [privacyLevel, setPrivacyLevel] = useState("internal");
  
  // OAuth fields
  const [oauthConfig, setOauthConfig] = useState({
    authUrl: "",
    tokenUrl: "",
    clientId: "",
    clientSecret: "",
    scopes: "openid profile email groups",
    callbackUrl: ""
  });
  
  // Database fields
  const [dbConfig, setDbConfig] = useState({
    host: "",
    port: "5432",
    database: "",
    schema: "public",
    sslMode: "require"
  });
  
  // OpenAPI fields
  const [openApiConfig, setOpenApiConfig] = useState({
    specUrl: "",
    specFile: null as File | null,
    specContent: ""
  });
  
  // Certificate fields
  const [certificateConfig, setCertificateConfig] = useState({
    certificate: "",
    privateKey: "",
    passphrase: ""
  });
  
  // Connection testing
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<any>(null);
  const [schemaData, setSchemaData] = useState<any>(null);

  // Handle preselected type
  useEffect(() => {
    if (preselectedType && isOpen) {
      setSelectedType(preselectedType);
      setCurrentStep(1); // Skip source type selection, go directly to configuration
    } else if (isOpen && !preselectedType) {
      setCurrentStep(1); // Start with source type selection if no preselection
    }
  }, [preselectedType, isOpen]);

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedType("");
    setActiveCategory("all");
    setPipName("");
    setEndpoint("");
    setAuthType("api-key");
    setApiKey("");
    setUsername("");
    setPassword("");
    setAttributeMapping({});
    setUpdateFrequency("hourly");
    setPrivacyLevel("internal");
    setOauthConfig({
      authUrl: "",
      tokenUrl: "",
      clientId: "",
      clientSecret: "",
      scopes: "openid profile email groups",
      callbackUrl: ""
    });
    setDbConfig({
      host: "",
      port: "5432",
      database: "",
      schema: "public",
      sslMode: "require"
    });
    setOpenApiConfig({
      specUrl: "",
      specFile: null,
      specContent: ""
    });
    setCertificateConfig({
      certificate: "",
      privateKey: "",
      passphrase: ""
    });
    setIsTestingConnection(false);
    setConnectionTestResult(null);
    setSchemaData(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionTestResult(null);
    
    try {
      // Build configuration object
      const configuration: any = {
        provider: provider,
        auth_type: authType,
        endpoint: endpoint,
        login_url: loginUrl
      };
      
      // Add type-specific configuration
      if (selectedType === "database" || selectedType === "warehouse") {
        Object.assign(configuration, { dbConfig });
      } else if (selectedType === "openapi") {
        configuration.spec_url = openApiConfig.specUrl;
      }
      
      // Add OAuth config if applicable
      if (authType === "oauth") {
        Object.assign(configuration, oauthConfig);
      }
      
      // Build credentials object based on auth type
      let credentials: any = {};
      
      if (authType === "oauth") {
        credentials = { oauth_token: oauthConfig };
      } else if (authType === "api-key" || authType === "bearer-token") {
        credentials = { 
          api_key: {
            api_key: apiKey,
            api_base_url: endpoint,
            bearer_token: apiKey  // For bearer-token, same value
          }
        };
      } else if (authType === "basic") {
        credentials = { 
          username: {
            username: username,
            password: password,
            login_url: loginUrl,
            api_base_url: endpoint
          }
        };
      } else if (authType === "certificate") {
        credentials = { 
          certificate: {
            certificate: certificateConfig.certificate,
            private_key: certificateConfig.privateKey,
            passphrase: certificateConfig.passphrase,
            api_base_url: endpoint
          }
        };
      } else if (selectedType === "database") {
        credentials = {
          username: username,
          password: password
        };
      }
      
      // Prepare request payload
      const connectionData = {
        connection_type: selectedType,
        provider: provider || selectedType,
        configuration: configuration,
        credentials: credentials
      };

      // Call backend test API
      const response = await fetch('/api/pip/connections/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(connectionData)
      });

      const result = await response.json();
      
      setConnectionTestResult({
        success: result.success,
        status: result.status,
        responseTime: result.response_time || 0,
        error: result.error_message,
        details: result.details
      });
      
      // If successful and it's an IAM source, fetch sample data
      if (selectedType === "identity" || selectedType === "okta" || selectedType === "azure_ad" || selectedType === "auth0") {
        setSchemaData({
          sampleUser: {
            id: "user123",
            email: "john.doe@company.com",
            firstName: "John",
            lastName: "Doe",
            department: "Engineering",
            roles: ["developer", "admin"],
            groups: ["engineering", "developers"],
            mfaEnabled: true
          }
        });
      }
      
    } catch (error) {
      setConnectionTestResult({
        success: false,
        status: "error",
        error: "Connection failed: Invalid credentials"
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSubmit = () => {
    const selectedTypeData = dataSourceTypes.find(t => t.id === selectedType);
    const newPIP = {
      name: pipName,
      description: `${selectedTypeData?.title || selectedType} connection for ${provider}`,
      selectedType,
      provider,
      type: selectedTypeData?.title || selectedType,
      endpoint,
      environment, // Auto-set from current environment context
      attributeMapping,
      updateFrequency,
      privacyLevel,
      auth: {
        type: authType,
        apiKey: (authType === "api-key" || authType === "bearer") ? apiKey : undefined,
        username: authType === "basic" ? username : undefined,
        password: authType === "basic" ? password : undefined
      },
      oauthConfig: authType === "oauth" ? oauthConfig : undefined,
      dbConfig: selectedType === "database" || selectedType === "warehouse" ? dbConfig : undefined,
      openApiConfig: selectedType === "openapi" ? openApiConfig : undefined,
      certificateConfig: authType === "certificate" ? certificateConfig : undefined,
      credentials: authType === "oauth" ? {
        oauth_token: oauthConfig
      } : authType === "api-key" || authType === "bearer-token" ? {
        api_key: apiKey
      } : authType === "basic" ? {
        username,
        password,
        login_url: loginUrl
      } : authType === "certificate" ? {
        certificate: certificateConfig.certificate,
        private_key: certificateConfig.privateKey,
        passphrase: certificateConfig.passphrase
      } : {},
      configuration: {
        provider,
        auth_type: authType,
        endpoint,
        ...oauthConfig,
        ...dbConfig,
        ...openApiConfig
      }
    };

    onAdd(newPIP);
    resetForm();
  };

  const isNextDisabled = () => {
    if (preselectedType) {
      // When type is preselected, step 1 is configuration
      switch (currentStep) {
        case 1: return !pipName || !isConfigurationValid();
        case 2: return Object.keys(attributeMapping).length === 0;
        default: return false;
      }
    } else {
      // Normal flow with source type selection
    switch (currentStep) {
      case 1: return !selectedType;
        case 2: return !pipName || !isConfigurationValid();
      case 3: return Object.keys(attributeMapping).length === 0;
      default: return false;
      }
    }
  };

  const isConfigurationValid = () => {
    // Base validation - name is always required
    if (!pipName) return false;
    
    // Identity validation
    if (selectedType === "identity") {
      if (!provider) return false;
      if (authType === "oauth") {
        return oauthConfig.clientId && oauthConfig.clientSecret;
      } else if (authType === "api-key" || authType === "bearer-token") {
        return endpoint && apiKey;
      } else if (authType === "basic") {
        return loginUrl && username && password;
      }
    }
    
    // Database validation
    else if (selectedType === "database") {
      return dbConfig.host && dbConfig.database && username && password;
    }
    
    // OpenAPI validation
    else if (selectedType === "openapi") {
      return openApiConfig.specUrl || openApiConfig.specFile;
    }
    
    // HR, CRM, ERP, CSM, CMDB, Documents validation
    else if (["hr", "crm", "erp", "csm", "cmdb", "documents"].includes(selectedType)) {
      if (!provider) return false;
      
      if (authType === "oauth") {
        return oauthConfig.clientId && oauthConfig.clientSecret;
      } else if (authType === "api-key" || authType === "bearer-token") {
        return endpoint && apiKey;
      } else if (authType === "basic") {
        return loginUrl && username && password;
      } else if (authType === "certificate") {
        return endpoint && certificateConfig.certificate && certificateConfig.privateKey;
      }
    }
    
    // Data Warehouse validation
    else if (selectedType === "warehouse") {
      if (!provider || !endpoint || !dbConfig.database) return false;
      
      if (authType === "oauth") {
        return oauthConfig.clientId && oauthConfig.clientSecret;
      } else if (authType === "api-key" || authType === "bearer-token") {
        return apiKey;
      } else if (authType === "basic") {
        return loginUrl && username && password;
      }
    }
    
    // Cloud validation
    else if (selectedType === "cloud") {
      return provider && endpoint && username && password; // Cloud uses access keys
    }
    
    // Custom API validation
    else if (selectedType === "api") {
      if (!provider || !endpoint) return false;
      
      if (authType === "none") {
        return true;
      } else if (authType === "oauth") {
        return oauthConfig.clientId && oauthConfig.clientSecret;
      } else if (authType === "api-key" || authType === "bearer-token") {
        return apiKey;
      } else if (authType === "basic") {
        return username && password && loginUrl;
      }
    }
    
    // Static data validation
    else if (selectedType === "static") {
      return provider && (endpoint || openApiConfig.specFile);
    }
    
    return true;
  };

  const getStepTitle = () => {
    if (preselectedType) {
      // When type is preselected, adjust step titles
      switch (currentStep) {
        case 1: return "Connect & Authenticate";
        case 2: return "Data Mapping & Preview";
        case 3: return "Configuration";
        case 4: return "Review & Save";
        default: return "";
      }
    } else {
      // Normal flow with source type selection
    switch (currentStep) {
      case 1: return "Choose Data Source Type";
      case 2: return "Connect & Authenticate";
      case 3: return "Data Mapping & Preview";
      case 4: return "Configuration";
      case 5: return "Review & Save";
      default: return "";
      }
    }
  };

  const getFilteredDataSources = () => {
    if (activeCategory === "all") return dataSourceTypes;
    return dataSourceTypes.filter(source => source.category === activeCategory);
  };

  const getCategoryCount = (category: string) => {
    if (category === "all") return dataSourceTypes.length;
    return dataSourceTypes.filter(source => source.category === category).length;
  };

  const getAvailableFields = () => {
    // Use actual connection test results if available
    if (connectionTestResult?.success && connectionTestResult?.details?.fields) {
      return connectionTestResult.details.fields.map((field: any) => ({
        name: field.name,
        type: field.type,
        description: field.description,
        required: field.required,
        sensitivity: field.sensitivity,
        category: field.category,
        enum_values: field.enum_values,
        example: field.example
      }));
    }
    return getSampleFields();
  };

  const getSampleFields = () => {
    switch (selectedType) {
      case "identity":
        return [
          { name: "user.id", type: "string" },
          { name: "user.email", type: "string" },
          { name: "user.department", type: "string" },
          { name: "user.roles", type: "array" },
          { name: "user.groups", type: "array" },
          { name: "user.mfa_enabled", type: "boolean" },
          { name: "user.clearance_level", type: "string" },
          { name: "user.compliance_certifications", type: "array" }
        ];
      case "database":
        return [
          { name: "resource.id", type: "string" },
          { name: "resource.name", type: "string" },
          { name: "resource.owner_id", type: "string" },
          { name: "resource.sensitivity_level", type: "string" },
          { name: "resource.environment", type: "string" },
          { name: "resource.status", type: "string" },
          { name: "resource.created_at", type: "datetime" },
          { name: "resource.updated_at", type: "datetime" }
        ];
      case "hr":
        return [
          { name: "employee.id", type: "string" },
          { name: "employee.name", type: "string" },
          { name: "employee.department", type: "string" },
          { name: "employee.manager", type: "string" },
          { name: "employee.location", type: "string" },
          { name: "employee.employment_status", type: "string" },
          { name: "employee.start_date", type: "date" },
          { name: "employee.clearance_level", type: "string" }
        ];
      case "crm":
        return [
          { name: "customer.id", type: "string" },
          { name: "customer.name", type: "string" },
          { name: "customer.tier", type: "string" },
          { name: "customer.industry", type: "string" },
          { name: "customer.contract_value", type: "number" },
          { name: "customer.risk_level", type: "string" },
          { name: "customer.compliance_requirements", type: "array" }
        ];
      case "erp":
        return [
          { name: "asset.id", type: "string" },
          { name: "asset.name", type: "string" },
          { name: "asset.category", type: "string" },
          { name: "asset.cost_center", type: "string" },
          { name: "asset.owner", type: "string" },
          { name: "asset.financial_impact", type: "string" },
          { name: "asset.approval_required", type: "boolean" }
        ];
      case "csm":
        return [
          { name: "ticket.id", type: "string" },
          { name: "ticket.priority", type: "string" },
          { name: "ticket.category", type: "string" },
          { name: "ticket.requester", type: "string" },
          { name: "ticket.assignee", type: "string" },
          { name: "ticket.sla_status", type: "string" },
          { name: "ticket.business_impact", type: "string" }
        ];
      case "cmdb":
        return [
          { name: "ci.id", type: "string" },
          { name: "ci.name", type: "string" },
          { name: "ci.type", type: "string" },
          { name: "ci.owner", type: "string" },
          { name: "ci.criticality", type: "string" },
          { name: "ci.environment", type: "string" },
          { name: "ci.dependencies", type: "array" }
        ];
      case "api":
        return [
          { name: "api.endpoint", type: "string" },
          { name: "api.method", type: "string" },
          { name: "api.parameters", type: "object" },
          { name: "api.security_requirements", type: "array" },
          { name: "api.rate_limit", type: "number" },
          { name: "api.business_function", type: "string" }
        ];
      case "documents":
        return [
          { name: "document.id", type: "string" },
          { name: "document.name", type: "string" },
          { name: "document.type", type: "string" },
          { name: "document.owner", type: "string" },
          { name: "document.classification", type: "string" },
          { name: "document.access_level", type: "string" },
          { name: "document.last_modified", type: "datetime" }
        ];
      case "static":
        return [
          { name: "data.id", type: "string" },
          { name: "data.category", type: "string" },
          { name: "data.value", type: "string" },
          { name: "data.valid_from", type: "date" },
          { name: "data.valid_to", type: "date" },
          { name: "data.source", type: "string" }
        ];
      case "warehouse":
        return [
          { name: "dataset.id", type: "string" },
          { name: "dataset.name", type: "string" },
          { name: "dataset.schema", type: "string" },
          { name: "dataset.owner", type: "string" },
          { name: "dataset.sensitivity", type: "string" },
          { name: "dataset.retention_policy", type: "string" },
          { name: "dataset.last_updated", type: "datetime" }
        ];
      default:
        return [
          { name: "field1", type: "string" },
          { name: "field2", type: "number" },
          { name: "field3", type: "boolean" }
        ];
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Information Data Source</DialogTitle>
          <DialogDescription>
            Configure a new data source to provide context for your authorization policies.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center mb-6">
          <div className="flex w-full items-center gap-1 text-sm text-muted-foreground">
            {(preselectedType ? [1, 2, 3, 4] : [1, 2, 3, 4, 5]).map((step, index) => {
              const actualStep = preselectedType ? step : step;
              const maxSteps = preselectedType ? 4 : 5;
              return (
              <div key={step} className="flex items-center">
                  <div className={`flex items-center ${currentStep >= actualStep ? "text-primary" : ""}`}>
                    <Badge variant={currentStep >= actualStep ? "default" : "outline"} className="mr-2">{actualStep}</Badge>
                  <span className="text-xs">{
                      preselectedType ? (
                        actualStep === 1 ? "Connect" :
                        actualStep === 2 ? "Mapping" :
                        actualStep === 3 ? "Config" : "Review"
                      ) : (
                        actualStep === 1 ? "Source Type" :
                        actualStep === 2 ? "Connect" :
                        actualStep === 3 ? "Mapping" :
                        actualStep === 4 ? "Config" : "Review"
                      )
                  }</span>
                </div>
                  {index < maxSteps - 1 && <div className="h-px flex-1 bg-border mx-2"></div>}
              </div>
              );
            })}
          </div>
        </div>

        {currentStep === 1 && !preselectedType && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{getStepTitle()}</h3>
              <p className="text-muted-foreground">Select the type of data source you want to connect</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">AI Suggestion</p>
                  <p className="text-sm text-blue-700">AI suggests integrating your HR system to pull user roles directly for more effective authorization policies.</p>
                </div>
              </div>
            </div>

            <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">All ({getCategoryCount("all")})</TabsTrigger>
                <TabsTrigger value="identity">Identity & HR ({getCategoryCount("identity")})</TabsTrigger>
                <TabsTrigger value="business">Business Apps ({getCategoryCount("business")})</TabsTrigger>
                <TabsTrigger value="infrastructure">Cloud & Infrastructure ({getCategoryCount("infrastructure")})</TabsTrigger>
                <TabsTrigger value="custom">Custom ({getCategoryCount("custom")})</TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeCategory} className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getFilteredDataSources().map((type) => (
                    <Card 
                      key={type.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedType === type.id ? "ring-2 ring-primary border-primary" : ""
                      }`}
                      onClick={() => setSelectedType(type.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <type.icon className={`h-8 w-8 ${type.color}`} />
                          <div>
                            <CardTitle className="text-base">{type.title}</CardTitle>
                            <CardDescription className="text-sm">{type.subtitle}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Don't see your data source?</p>
              <Button variant="outline" size="sm">
                Request New Integration
              </Button>
            </div>
          </div>
        )}

        {((currentStep === 1 && preselectedType) || currentStep === 2) && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                {preselectedType ? `Configure ${dataSourceTypes.find(t => t.id === selectedType)?.title}` : getStepTitle()}
              </h3>
              <p className="text-muted-foreground">
                {preselectedType 
                  ? `Set up your ${dataSourceTypes.find(t => t.id === selectedType)?.title} connection`
                  : `Provide connection details for your ${dataSourceTypes.find(t => t.id === selectedType)?.title}`
                }
              </p>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
              <div className="space-y-2">
                <Label htmlFor="pip-name" className="text-sm font-medium">Data Source Name</Label>
                <Input 
                  id="pip-name" 
                  placeholder="Enter a descriptive name" 
                  value={pipName}
                  onChange={(e) => setPipName(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* IAM/Identity Sources */}
              {selectedType === "identity" && (
                <div className="space-y-6 p-6 border rounded-lg bg-blue-50">
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-blue-900">Identity Provider Configuration</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                        <Label htmlFor="provider" className="text-sm font-medium">Identity Provider</Label>
                        <Select value={provider} onValueChange={setProvider}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select your identity provider" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="okta">Okta</SelectItem>
                            <SelectItem value="azure_ad">Azure Active Directory</SelectItem>
                            <SelectItem value="auth0">Auth0</SelectItem>
                            <SelectItem value="ldap">LDAP / Active Directory</SelectItem>
                          </SelectContent>
                        </Select>
              </div>

              <div className="space-y-2">
                        <Label htmlFor="auth-method" className="text-sm font-medium">Authentication Method</Label>
                <Select value={authType} onValueChange={setAuthType}>
                          <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                            <SelectItem value="oauth">OAuth 2.0 / OIDC</SelectItem>
                    <SelectItem value="api-key">API Key</SelectItem>
                    <SelectItem value="bearer-token">Bearer Token</SelectItem>
                    <SelectItem value="basic">Username/Password</SelectItem>
                  </SelectContent>
                </Select>
                      </div>
                    </div>
              </div>

                  {authType === "oauth" && (
                    <div className="space-y-4">
                      {provider === "okta" && (
                        <OktaOAuthFields 
                          config={oauthConfig} 
                          onChange={setOauthConfig}
                          tenantUrl={endpoint}
                        />
                      )}
                      {provider === "azure_ad" && (
                        <AzureADOAuthFields 
                          config={oauthConfig} 
                          onChange={setOauthConfig}
                          tenantId={endpoint}
                        />
                      )}
                      {provider === "auth0" && (
                        <Auth0OAuthFields 
                          config={oauthConfig} 
                          onChange={setOauthConfig}
                          domain={endpoint}
                        />
                      )}
                      {!["okta", "azure_ad", "auth0"].includes(provider) && (
                        <div className="space-y-4 p-4 border rounded-lg bg-white border-blue-200">
                          <h5 className="text-sm font-semibold text-blue-800">OAuth 2.0 Configuration</h5>
                          
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="auth-url" className="text-sm font-medium">Authorization URL</Label>
                              <Input 
                                id="auth-url" 
                                placeholder="https://your-provider.com/oauth/authorize"
                                value={oauthConfig.authUrl}
                                onChange={(e) => setOauthConfig(prev => ({ ...prev, authUrl: e.target.value }))}
                                className="w-full"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="token-url" className="text-sm font-medium">Token URL</Label>
                              <Input 
                                id="token-url" 
                                placeholder="https://your-provider.com/oauth/token"
                                value={oauthConfig.tokenUrl}
                                onChange={(e) => setOauthConfig(prev => ({ ...prev, tokenUrl: e.target.value }))}
                                className="w-full"
                              />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="client-id" className="text-sm font-medium">Client ID</Label>
                                <Input 
                                  id="client-id" 
                                  placeholder="Your OAuth client ID"
                                  value={oauthConfig.clientId}
                                  onChange={(e) => setOauthConfig(prev => ({ ...prev, clientId: e.target.value }))}
                                  className="w-full"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="client-secret" className="text-sm font-medium">Client Secret</Label>
                                <Input 
                                  id="client-secret" 
                                  type="password"
                                  placeholder="Your OAuth client secret"
                                  value={oauthConfig.clientSecret}
                                  onChange={(e) => setOauthConfig(prev => ({ ...prev, clientSecret: e.target.value }))}
                                  className="w-full"
                                />
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="scopes" className="text-sm font-medium">Scopes</Label>
                              <Input 
                                id="scopes" 
                                placeholder="openid profile email"
                                value={oauthConfig.scopes}
                                onChange={(e) => setOauthConfig(prev => ({ ...prev, scopes: e.target.value }))}
                                className="w-full"
                              />
                            </div>
                            
                            <Alert className="border-blue-200 bg-blue-50">
                              <AlertCircle className="h-4 w-4 text-blue-600" />
                              <AlertDescription className="text-blue-800">
                                Configure your OAuth application with callback URL: <code className="bg-blue-100 px-1 rounded text-blue-900">http://localhost:8000/pip/oauth/callback/{provider}</code>
                              </AlertDescription>
                            </Alert>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

              {authType === "api-key" && (
                    <APIKeyFields
                      apiKey={apiKey}
                      onChange={setApiKey}
                      endpoint={endpoint}
                      onEndpointChange={setEndpoint}
                      showEndpoint={true}
                      authMethod="api-key"
                      keyLabel="Identity Provider API Key"
                      keyPlaceholder="Enter your identity provider API key"
                      endpointLabel="API Base URL"
                      endpointPlaceholder="https://your-domain.okta.com/api/v1"
                    />
              )}

              {authType === "bearer-token" && (
                    <APIKeyFields
                      apiKey={apiKey}
                      onChange={setApiKey}
                      endpoint={endpoint}
                      onEndpointChange={setEndpoint}
                      showEndpoint={true}
                      authMethod="bearer-token"
                      keyLabel="Bearer Token"
                      keyPlaceholder="Enter your bearer token"
                      endpointLabel="API Base URL"
                      endpointPlaceholder="https://your-domain.okta.com/api/v1"
                    />
              )}

              {authType === "basic" && (
                    <BasicAuthFields
                      username={username}
                      password={password}
                      onUsernameChange={setUsername}
                      onPasswordChange={setPassword}
                      loginUrl={loginUrl}
                      onLoginUrlChange={setLoginUrl}
                      endpoint={endpoint}
                      onEndpointChange={setEndpoint}
                      showLoginUrl={true}
                      showEndpoint={true}
                      usernameLabel="Username"
                      passwordLabel="Password"
                      usernamePlaceholder="Your identity provider username"
                      passwordPlaceholder="Your identity provider password"
                      loginUrlLabel="Login/Auth URL"
                      endpointLabel="API Base URL (Optional)"
                    />
                  )}
                </div>
              )}

              {/* Database Sources */}
              {selectedType === "database" && (
                <div className="space-y-6 p-6 border rounded-lg bg-green-50">
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-green-900">Database Configuration</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="db-host" className="text-sm font-medium">Host</Label>
                        <Input 
                          id="db-host" 
                          placeholder="localhost"
                          value={dbConfig.host}
                          onChange={(e) => setDbConfig(prev => ({ ...prev, host: e.target.value }))}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="db-port" className="text-sm font-medium">Port</Label>
                        <Input 
                          id="db-port" 
                          placeholder="5432"
                          value={dbConfig.port}
                          onChange={(e) => setDbConfig(prev => ({ ...prev, port: e.target.value }))}
                          className="w-full"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="db-database" className="text-sm font-medium">Database</Label>
                        <Input 
                          id="db-database" 
                          placeholder="mydb"
                          value={dbConfig.database}
                          onChange={(e) => setDbConfig(prev => ({ ...prev, database: e.target.value }))}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="db-schema" className="text-sm font-medium">Schema</Label>
                        <Input 
                          id="db-schema" 
                          placeholder="public"
                          value={dbConfig.schema}
                          onChange={(e) => setDbConfig(prev => ({ ...prev, schema: e.target.value }))}
                          className="w-full"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="ssl-mode" className="text-sm font-medium">SSL Mode</Label>
                      <Select value={dbConfig.sslMode} onValueChange={(value) => setDbConfig(prev => ({ ...prev, sslMode: value }))}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="require">Require</SelectItem>
                          <SelectItem value="prefer">Prefer</SelectItem>
                          <SelectItem value="disable">Disable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                        <Input 
                          id="username" 
                          placeholder="Database username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                        <Input 
                          id="password" 
                          type="password"
                          placeholder="Database password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* OpenAPI Sources */}
              {selectedType === "openapi" && (
                <div className="space-y-6 p-6 border rounded-lg bg-purple-50">
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-purple-900">OpenAPI Specification</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="spec-url" className="text-sm font-medium">OpenAPI Specification URL</Label>
                      <Input 
                        id="spec-url" 
                        placeholder="https://api.example.com/openapi.json"
                        value={openApiConfig.specUrl}
                        onChange={(e) => setOpenApiConfig(prev => ({ ...prev, specUrl: e.target.value }))}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-purple-200" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-purple-50 px-2 text-purple-500">Or</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="spec-file" className="text-sm font-medium">Upload OpenAPI File</Label>
                      <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-purple-400" />
                        <p className="text-sm text-purple-600 mb-2">Upload .json or .yaml file</p>
                        <input
                          type="file"
                          accept=".json,.yaml,.yml"
                          className="hidden"
                          id="spec-file"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setOpenApiConfig(prev => ({ ...prev, specFile: file }));
                            }
                          }}
                        />
                        <Button variant="outline" size="sm" className="mt-2" onClick={() => document.getElementById('spec-file')?.click()}>
                          Choose File
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* HR System Configuration */}
              {selectedType === "hr" && (
                <div className="space-y-6 p-6 border rounded-lg bg-green-50">
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-green-900">HR System Configuration</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="hr-provider" className="text-sm font-medium">HR System Provider</Label>
                        <Select value={provider} onValueChange={setProvider}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select your HR system" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="workday">Workday</SelectItem>
                            <SelectItem value="bamboohr">BambooHR</SelectItem>
                            <SelectItem value="adp">ADP</SelectItem>
                            <SelectItem value="successfactors">SAP SuccessFactors</SelectItem>
                            <SelectItem value="custom">Custom HR System</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="hr-auth-method" className="text-sm font-medium">Authentication Method</Label>
                <Select value={authType} onValueChange={setAuthType}>
                          <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                            <SelectItem value="oauth">OAuth 2.0</SelectItem>
                    <SelectItem value="api-key">API Key</SelectItem>
                    <SelectItem value="bearer-token">Bearer Token</SelectItem>
                    <SelectItem value="basic">Username/Password</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  {authType === "oauth" && (
                    <OAuthFields
                      config={oauthConfig}
                      onChange={setOauthConfig}
                      provider={provider}
                      showEndpoint={true}
                      endpoint={endpoint}
                      onEndpointChange={setEndpoint}
                    />
                  )}
                  
                  {authType === "api-key" && (
                    <APIKeyFields
                      apiKey={apiKey}
                      onChange={setApiKey}
                      endpoint={endpoint}
                      onEndpointChange={setEndpoint}
                      showEndpoint={true}
                      authMethod="api-key"
                      keyLabel="HR System API Key"
                      keyPlaceholder="Enter your HR system API key"
                      endpointLabel="API Base URL"
                      endpointPlaceholder="https://api.workday.com/v1"
                    />
                  )}
                  
                  {authType === "bearer-token" && (
                    <APIKeyFields
                      apiKey={apiKey}
                      onChange={setApiKey}
                      endpoint={endpoint}
                      onEndpointChange={setEndpoint}
                      showEndpoint={true}
                      authMethod="bearer-token"
                      keyLabel="Bearer Token"
                      keyPlaceholder="Enter your HR system bearer token"
                      endpointLabel="API Base URL"
                      endpointPlaceholder="https://api.workday.com/v1"
                    />
                  )}
                  
                  {authType === "basic" && (
                    <BasicAuthFields
                      username={username}
                      password={password}
                      onUsernameChange={setUsername}
                      onPasswordChange={setPassword}
                      loginUrl={loginUrl}
                      onLoginUrlChange={setLoginUrl}
                      endpoint={endpoint}
                      onEndpointChange={setEndpoint}
                      showLoginUrl={true}
                      showEndpoint={true}
                      usernameLabel="Username"
                      passwordLabel="Password"
                      usernamePlaceholder="HR system username"
                      passwordPlaceholder="HR system password"
                      loginUrlLabel="Login/Auth URL"
                      endpointLabel="API Base URL (Optional)"
                    />
                  )}
                </div>
              )}

              {/* CRM System Configuration */}
              {selectedType === "crm" && (
                <div className="space-y-6 p-6 border rounded-lg bg-purple-50">
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-purple-900">CRM System Configuration</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="crm-provider" className="text-sm font-medium">CRM System Provider</Label>
                        <Select value={provider} onValueChange={setProvider}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select your CRM system" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="salesforce">Salesforce</SelectItem>
                            <SelectItem value="hubspot">HubSpot</SelectItem>
                            <SelectItem value="dynamics">Microsoft Dynamics</SelectItem>
                            <SelectItem value="zoho">Zoho CRM</SelectItem>
                            <SelectItem value="custom">Custom CRM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="crm-auth" className="text-sm font-medium">Authentication Method</Label>
                        <Select value={authType} onValueChange={setAuthType}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                    <SelectItem value="oauth">OAuth 2.0</SelectItem>
                            <SelectItem value="api-key">API Key</SelectItem>
                            <SelectItem value="bearer-token">Bearer Token</SelectItem>
                            <SelectItem value="basic">Username/Password</SelectItem>
                  </SelectContent>
                </Select>
                      </div>
                    </div>
              </div>
                  
                  {authType === "oauth" && (
                    <OAuthFields
                      config={oauthConfig}
                      onChange={setOauthConfig}
                      provider={provider}
                      showEndpoint={true}
                      endpoint={endpoint}
                      onEndpointChange={setEndpoint}
                    />
                  )}

              {authType === "api-key" && (
                    <APIKeyFields
                      apiKey={apiKey}
                      onChange={setApiKey}
                      endpoint={endpoint}
                      onEndpointChange={setEndpoint}
                      showEndpoint={true}
                      authMethod="api-key"
                      keyLabel="CRM System API Key"
                      keyPlaceholder="Enter your CRM system API key"
                      endpointLabel="API Base URL"
                      endpointPlaceholder="https://your-instance.salesforce.com/services/data/v58.0"
                    />
                  )}
                  
                  {authType === "bearer-token" && (
                    <APIKeyFields
                      apiKey={apiKey}
                      onChange={setApiKey}
                      endpoint={endpoint}
                      onEndpointChange={setEndpoint}
                      showEndpoint={true}
                      authMethod="bearer-token"
                      keyLabel="Bearer Token"
                      keyPlaceholder="Enter your CRM system bearer token"
                      endpointLabel="API Base URL"
                      endpointPlaceholder="https://your-instance.salesforce.com/services/data/v58.0"
                    />
                  )}
                  
                  {authType === "basic" && (
                    <BasicAuthFields
                      username={username}
                      password={password}
                      onUsernameChange={setUsername}
                      onPasswordChange={setPassword}
                      loginUrl={loginUrl}
                      onLoginUrlChange={setLoginUrl}
                      endpoint={endpoint}
                      onEndpointChange={setEndpoint}
                      showLoginUrl={true}
                      showEndpoint={true}
                      usernameLabel="Username"
                      passwordLabel="Password"
                      usernamePlaceholder="CRM system username"
                      passwordPlaceholder="CRM system password"
                      loginUrlLabel="Login/Auth URL"
                      endpointLabel="API Base URL (Optional)"
                    />
                  )}
                </div>
              )}

              {/* Cloud Provider Configuration */}
              {selectedType === "cloud" && (
                <div className="space-y-6 p-6 border rounded-lg bg-blue-50">
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-blue-900">Cloud Provider Configuration</h4>
                    
                <div className="space-y-2">
                      <Label htmlFor="cloud-provider" className="text-sm font-medium">Cloud Provider</Label>
                      <Select value={provider} onValueChange={setProvider}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select your cloud provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aws">Amazon Web Services (AWS)</SelectItem>
                          <SelectItem value="azure">Microsoft Azure</SelectItem>
                          <SelectItem value="gcp">Google Cloud Platform</SelectItem>
                          <SelectItem value="custom">Custom Cloud Provider</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cloud-region" className="text-sm font-medium">Region</Label>
                  <Input 
                          id="cloud-region" 
                          placeholder="us-east-1"
                          value={endpoint}
                          onChange={(e) => setEndpoint(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cloud-access-key" className="text-sm font-medium">Access Key ID</Label>
                        <Input 
                          id="cloud-access-key" 
                          placeholder="Your access key ID"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cloud-secret-key" className="text-sm font-medium">Secret Access Key</Label>
                      <Input 
                        id="cloud-secret-key" 
                    type="password" 
                        placeholder="Your secret access key"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ERP System Configuration */}
              {selectedType === "erp" && (
                <div className="space-y-6 p-6 border rounded-lg bg-amber-50">
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-amber-900">ERP System Configuration</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="erp-provider" className="text-sm font-medium">ERP System Provider</Label>
                        <Select value={provider} onValueChange={setProvider}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select your ERP system" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sap">SAP</SelectItem>
                            <SelectItem value="oracle_erp">Oracle ERP</SelectItem>
                            <SelectItem value="dynamics_365">Microsoft Dynamics 365</SelectItem>
                            <SelectItem value="netsuite">NetSuite</SelectItem>
                            <SelectItem value="custom">Custom ERP System</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="erp-auth" className="text-sm font-medium">Authentication Method</Label>
                        <Select value={authType} onValueChange={setAuthType}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="oauth">OAuth 2.0</SelectItem>
                            <SelectItem value="api-key">API Key</SelectItem>
                            <SelectItem value="bearer-token">Bearer Token</SelectItem>
                            <SelectItem value="basic">Username/Password</SelectItem>
                            <SelectItem value="certificate">Client Certificate</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  {authType === "oauth" && (
                    <OAuthFields
                      config={oauthConfig}
                      onChange={setOauthConfig}
                      provider={provider}
                      showEndpoint={true}
                      endpoint={endpoint}
                      onEndpointChange={setEndpoint}
                    />
                  )}
                  
                  {authType === "api-key" && (
                    <APIKeyFields
                      apiKey={apiKey}
                      onChange={setApiKey}
                      endpoint={endpoint}
                      onEndpointChange={setEndpoint}
                      showEndpoint={true}
                      authMethod="api-key"
                      keyLabel="ERP System API Key"
                      keyPlaceholder="Enter your ERP system API key"
                      endpointLabel="API Base URL"
                      endpointPlaceholder="https://api.sap.com/v1"
                    />
                  )}
                  
                  {authType === "bearer-token" && (
                    <APIKeyFields
                      apiKey={apiKey}
                      onChange={setApiKey}
                      endpoint={endpoint}
                      onEndpointChange={setEndpoint}
                      showEndpoint={true}
                      authMethod="bearer-token"
                      keyLabel="Bearer Token"
                      keyPlaceholder="Enter your ERP system bearer token"
                      endpointLabel="API Base URL"
                      endpointPlaceholder="https://api.sap.com/v1"
                    />
                  )}
                  
                  {authType === "certificate" && (
                    <CertificateFields
                      certificate={certificateConfig.certificate}
                      privateKey={certificateConfig.privateKey}
                      passphrase={certificateConfig.passphrase}
                      onCertificateChange={(val) => setCertificateConfig(prev => ({ ...prev, certificate: val }))}
                      onPrivateKeyChange={(val) => setCertificateConfig(prev => ({ ...prev, privateKey: val }))}
                      onPassphraseChange={(val) => setCertificateConfig(prev => ({ ...prev, passphrase: val }))}
                      showPassphrase={true}
                    />
              )}

              {authType === "basic" && (
                    <BasicAuthFields
                      username={username}
                      password={password}
                      onUsernameChange={setUsername}
                      onPasswordChange={setPassword}
                      loginUrl={loginUrl}
                      onLoginUrlChange={setLoginUrl}
                      endpoint={endpoint}
                      onEndpointChange={setEndpoint}
                      showLoginUrl={true}
                      showEndpoint={true}
                      usernameLabel="Username"
                      passwordLabel="Password"
                      usernamePlaceholder="ERP system username"
                      passwordPlaceholder="ERP system password"
                      loginUrlLabel="Login/Auth URL"
                      endpointLabel="API Base URL (Optional)"
                    />
                  )}
                </div>
              )}

              {/* CSM/Ticketing System Configuration */}
              {selectedType === "csm" && (
                <div className="space-y-6 p-6 border rounded-lg bg-pink-50">
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-pink-900">CSM/Ticketing System Configuration</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                        <Label htmlFor="csm-provider" className="text-sm font-medium">Ticketing System Provider</Label>
                        <Select value={provider} onValueChange={setProvider}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select your ticketing system" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="servicenow">ServiceNow</SelectItem>
                            <SelectItem value="jira">Jira</SelectItem>
                            <SelectItem value="zendesk">Zendesk</SelectItem>
                            <SelectItem value="freshservice">Freshservice</SelectItem>
                            <SelectItem value="custom">Custom Ticketing System</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="csm-auth" className="text-sm font-medium">Authentication Method</Label>
                        <Select value={authType} onValueChange={setAuthType}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="oauth">OAuth 2.0</SelectItem>
                            <SelectItem value="api-key">API Key</SelectItem>
                            <SelectItem value="bearer-token">Bearer Token</SelectItem>
                            <SelectItem value="basic">Username/Password</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  {authType === "oauth" && (
                    <OAuthFields
                      config={oauthConfig}
                      onChange={setOauthConfig}
                      provider={provider}
                      showEndpoint={true}
                      endpoint={endpoint}
                      onEndpointChange={setEndpoint}
                    />
                  )}
                  
                  {authType === "api-key" && (
                    <APIKeyFields
                      apiKey={apiKey}
                      onChange={setApiKey}
                      endpoint={endpoint}
                      onEndpointChange={setEndpoint}
                      showEndpoint={true}
                      authMethod="api-key"
                      keyLabel="Ticketing System API Key"
                      keyPlaceholder="Enter your ticketing system API key"
                      endpointLabel="API Base URL"
                      endpointPlaceholder="https://your-instance.servicenow.com/api/now/v1"
                    />
                  )}
                  
                  {authType === "bearer-token" && (
                    <APIKeyFields
                      apiKey={apiKey}
                      onChange={setApiKey}
                      endpoint={endpoint}
                      onEndpointChange={setEndpoint}
                      showEndpoint={true}
                      authMethod="bearer-token"
                      keyLabel="Bearer Token"
                      keyPlaceholder="Enter your ticketing system bearer token"
                      endpointLabel="API Base URL"
                      endpointPlaceholder="https://your-instance.servicenow.com/api/now/v1"
                    />
                  )}
                  
                  {authType === "basic" && (
                    <BasicAuthFields
                      username={username}
                      password={password}
                      onUsernameChange={setUsername}
                      onPasswordChange={setPassword}
                      loginUrl={loginUrl}
                      onLoginUrlChange={setLoginUrl}
                      endpoint={endpoint}
                      onEndpointChange={setEndpoint}
                      showLoginUrl={true}
                      showEndpoint={true}
                      usernameLabel="Username"
                      passwordLabel="Password"
                      usernamePlaceholder="Ticketing system username"
                      passwordPlaceholder="Ticketing system password"
                      loginUrlLabel="Login/Auth URL"
                      endpointLabel="API Base URL (Optional)"
                    />
                  )}
                </div>
              )}

              {/* Configuration Management DB Configuration */}
              {selectedType === "cmdb" && (
                <div className="space-y-6 p-6 border rounded-lg bg-slate-50">
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-slate-900">Configuration Management DB Configuration</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cmdb-provider" className="text-sm font-medium">CMDB Provider</Label>
                        <Select value={provider} onValueChange={setProvider}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select your CMDB system" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="servicenow_cmdb">ServiceNow CMDB</SelectItem>
                            <SelectItem value="bmc_helix">BMC Helix</SelectItem>
                            <SelectItem value="cherwell">Cherwell</SelectItem>
                            <SelectItem value="custom">Custom CMDB</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cmdb-auth" className="text-sm font-medium">Authentication Method</Label>
                        <Select value={authType} onValueChange={setAuthType}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="oauth">OAuth 2.0</SelectItem>
                            <SelectItem value="api-key">API Key</SelectItem>
                            <SelectItem value="bearer-token">Bearer Token</SelectItem>
                            <SelectItem value="basic">Username/Password</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  {authType === "oauth" && (
                    <OAuthFields
                      config={oauthConfig}
                      onChange={setOauthConfig}
                      provider={provider}
                      showEndpoint={true}
                      endpoint={endpoint}
                      onEndpointChange={setEndpoint}
                    />
                  )}
                  
                  {authType === "api-key" && (
                    <APIKeyFields
                      apiKey={apiKey}
                      onChange={setApiKey}
                      endpoint={endpoint}
                      onEndpointChange={setEndpoint}
                      showEndpoint={true}
                      authMethod="api-key"
                      keyLabel="CMDB API Key"
                      keyPlaceholder="Enter your CMDB API key"
                      endpointLabel="API Base URL"
                      endpointPlaceholder="https://your-instance.servicenow.com/api/cmdb"
                    />
                  )}
                  
                  {authType === "bearer-token" && (
                    <APIKeyFields
                      apiKey={apiKey}
                      onChange={setApiKey}
                      endpoint={endpoint}
                      onEndpointChange={setEndpoint}
                      showEndpoint={true}
                      authMethod="bearer-token"
                      keyLabel="Bearer Token"
                      keyPlaceholder="Enter your CMDB bearer token"
                      endpointLabel="API Base URL"
                      endpointPlaceholder="https://your-instance.servicenow.com/api/cmdb"
                    />
                  )}
                  
                  {authType === "basic" && (
                    <BasicAuthFields
                      username={username}
                      password={password}
                      onUsernameChange={setUsername}
                      onPasswordChange={setPassword}
                      loginUrl={loginUrl}
                      onLoginUrlChange={setLoginUrl}
                      endpoint={endpoint}
                      onEndpointChange={setEndpoint}
                      showLoginUrl={true}
                      showEndpoint={true}
                      usernameLabel="Username"
                      passwordLabel="Password"
                      usernamePlaceholder="CMDB username"
                      passwordPlaceholder="CMDB password"
                      loginUrlLabel="Login/Auth URL"
                      endpointLabel="API Base URL (Optional)"
                    />
                  )}
                </div>
              )}

              {/* Custom API/Webhook Configuration */}
              {selectedType === "api" && (
                <div className="space-y-6 p-6 border rounded-lg bg-cyan-50">
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-cyan-900">Custom API/Webhook Configuration</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="api-type" className="text-sm font-medium">API Type</Label>
                        <Select value={provider} onValueChange={setProvider}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select API type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rest">REST API</SelectItem>
                            <SelectItem value="graphql">GraphQL</SelectItem>
                            <SelectItem value="webhook">Webhook</SelectItem>
                            <SelectItem value="custom">Custom API</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="api-auth" className="text-sm font-medium">Authentication Method</Label>
                        <Select value={authType} onValueChange={setAuthType}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="api-key">API Key</SelectItem>
                            <SelectItem value="bearer-token">Bearer Token</SelectItem>
                            <SelectItem value="oauth">OAuth 2.0</SelectItem>
                            <SelectItem value="basic">Username/Password</SelectItem>
                            <SelectItem value="none">No Authentication</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  {authType === "oauth" && (
                    <OAuthFields
                      config={oauthConfig}
                      onChange={setOauthConfig}
                      provider={provider}
                      showEndpoint={true}
                      endpoint={endpoint}
                      onEndpointChange={setEndpoint}
                    />
                  )}
                  
                  {authType === "api-key" && (
                    <APIKeyFields
                      apiKey={apiKey}
                      onChange={setApiKey}
                      endpoint={endpoint}
                      onEndpointChange={setEndpoint}
                      showEndpoint={true}
                      authMethod="api-key"
                      keyLabel="API Key"
                      keyPlaceholder="Enter your API key"
                      endpointLabel="API Base URL"
                      endpointPlaceholder="https://api.example.com/v1"
                    />
                  )}
                  
                  {authType === "bearer-token" && (
                    <APIKeyFields
                      apiKey={apiKey}
                      onChange={setApiKey}
                      endpoint={endpoint}
                      onEndpointChange={setEndpoint}
                      showEndpoint={true}
                      authMethod="bearer-token"
                      keyLabel="Bearer Token"
                      keyPlaceholder="Enter your bearer token"
                      endpointLabel="API Base URL"
                      endpointPlaceholder="https://api.example.com/v1"
                    />
                  )}
                  
                  {authType === "basic" && (
                    <BasicAuthFields
                      username={username}
                      password={password}
                      onUsernameChange={setUsername}
                      onPasswordChange={setPassword}
                      loginUrl={loginUrl}
                      onLoginUrlChange={setLoginUrl}
                      endpoint={endpoint}
                      onEndpointChange={setEndpoint}
                      showLoginUrl={true}
                      showEndpoint={true}
                      usernameLabel="Username"
                      passwordLabel="Password"
                      usernamePlaceholder="API username"
                      passwordPlaceholder="API password"
                      loginUrlLabel="Login/Auth URL"
                      endpointLabel="API Base URL (Optional)"
                    />
                  )}
                  
                  {authType === "none" && (
                    <div className="space-y-4">
                      <Alert className="border-cyan-200 bg-cyan-50">
                        <AlertCircle className="h-4 w-4 text-cyan-600" />
                        <AlertDescription className="text-cyan-800">
                          <p className="text-sm">No authentication required. The API will be accessed without credentials.</p>
                        </AlertDescription>
                      </Alert>
                      
                      <div className="space-y-2">
                        <Label htmlFor="api-endpoint-none" className="text-sm font-medium">API Base URL</Label>
                        <Input 
                          id="api-endpoint-none"
                          type="url"
                          placeholder="https://api.example.com/v1"
                          value={endpoint}
                          onChange={(e) => setEndpoint(e.target.value)}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter the base URL of your API endpoint
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Document/File Storage Configuration */}
              {selectedType === "documents" && (
                <div className="space-y-6 p-6 border rounded-lg bg-orange-50">
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-orange-900">Document/File Storage Configuration</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="doc-provider" className="text-sm font-medium">Storage Provider</Label>
                        <Select value={provider} onValueChange={setProvider}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select your storage provider" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sharepoint">SharePoint</SelectItem>
                            <SelectItem value="google_drive">Google Drive</SelectItem>
                            <SelectItem value="s3">Amazon S3</SelectItem>
                            <SelectItem value="onedrive">OneDrive</SelectItem>
                            <SelectItem value="dropbox">Dropbox</SelectItem>
                            <SelectItem value="custom">Custom Storage</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="doc-auth" className="text-sm font-medium">Authentication Method</Label>
                        <Select value={authType} onValueChange={setAuthType}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="oauth">OAuth 2.0</SelectItem>
                            <SelectItem value="api-key">API Key</SelectItem>
                            <SelectItem value="bearer-token">Bearer Token</SelectItem>
                            <SelectItem value="basic">Username/Password</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  {authType === "oauth" && (
                    <OAuthFields
                      config={oauthConfig}
                      onChange={setOauthConfig}
                      provider={provider}
                      showEndpoint={true}
                      endpoint={endpoint}
                      onEndpointChange={setEndpoint}
                    />
                  )}
                  
                  {authType === "api-key" && (
                    <APIKeyFields
                      apiKey={apiKey}
                      onChange={setApiKey}
                      endpoint={endpoint}
                      onEndpointChange={setEndpoint}
                      showEndpoint={true}
                      authMethod="api-key"
                      keyLabel="Storage API Key"
                      keyPlaceholder="Enter your storage API key"
                      endpointLabel="API Base URL"
                      endpointPlaceholder="https://api.sharepoint.com/v1"
                    />
                  )}
                  
                  {authType === "bearer-token" && (
                    <APIKeyFields
                      apiKey={apiKey}
                      onChange={setApiKey}
                      endpoint={endpoint}
                      onEndpointChange={setEndpoint}
                      showEndpoint={true}
                      authMethod="bearer-token"
                      keyLabel="Bearer Token"
                      keyPlaceholder="Enter your storage bearer token"
                      endpointLabel="API Base URL"
                      endpointPlaceholder="https://api.sharepoint.com/v1"
                    />
                  )}
                  
                  {authType === "basic" && (
                    <BasicAuthFields
                      username={username}
                      password={password}
                      onUsernameChange={setUsername}
                      onPasswordChange={setPassword}
                      loginUrl={loginUrl}
                      onLoginUrlChange={setLoginUrl}
                      endpoint={endpoint}
                      onEndpointChange={setEndpoint}
                      showLoginUrl={true}
                      showEndpoint={true}
                      usernameLabel="Username"
                      passwordLabel="Password"
                      usernamePlaceholder="Storage username"
                      passwordPlaceholder="Storage password"
                      loginUrlLabel="Login/Auth URL"
                      endpointLabel="API Base URL (Optional)"
                    />
                  )}
                </div>
              )}

              {/* Static Data Configuration */}
              {selectedType === "static" && (
                <div className="space-y-6 p-6 border rounded-lg bg-gray-50">
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-900">Static Data Configuration</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="static-type" className="text-sm font-medium">Data Type</Label>
                      <Select value={provider} onValueChange={setProvider}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select data type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="csv">CSV File</SelectItem>
                          <SelectItem value="json">JSON File</SelectItem>
                          <SelectItem value="xml">XML File</SelectItem>
                          <SelectItem value="url">Data URL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="static-url" className="text-sm font-medium">Data URL</Label>
                    <Input 
                        id="static-url" 
                        placeholder="https://example.com/data.json"
                        value={endpoint}
                        onChange={(e) => setEndpoint(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="text-center text-gray-500">OR</div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="static-file" className="text-sm font-medium">Upload Data File</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600 mb-2">Upload .csv, .json, or .xml file</p>
                        <input
                          type="file"
                          accept=".csv,.json,.xml"
                          className="hidden"
                          id="static-file"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setOpenApiConfig(prev => ({ ...prev, specFile: file }));
                            }
                          }}
                        />
                        <Button variant="outline" size="sm" className="mt-2" onClick={() => document.getElementById('static-file')?.click()}>
                          Choose File
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Data Warehouse Configuration */}
              {selectedType === "warehouse" && (
                <div className="space-y-6 p-6 border rounded-lg bg-emerald-50">
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-emerald-900">Data Warehouse Configuration</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="warehouse-provider" className="text-sm font-medium">Data Warehouse Provider</Label>
                        <Select value={provider} onValueChange={setProvider}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select your data warehouse" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="snowflake">Snowflake</SelectItem>
                            <SelectItem value="databricks">Databricks</SelectItem>
                            <SelectItem value="bigquery">Google BigQuery</SelectItem>
                            <SelectItem value="redshift">Amazon Redshift</SelectItem>
                            <SelectItem value="custom">Custom Data Warehouse</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="warehouse-auth" className="text-sm font-medium">Authentication Method</Label>
                        <Select value={authType} onValueChange={setAuthType}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="oauth">OAuth 2.0</SelectItem>
                            <SelectItem value="api-key">API Key</SelectItem>
                            <SelectItem value="bearer-token">Bearer Token</SelectItem>
                            <SelectItem value="basic">Username/Password</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="warehouse-account" className="text-sm font-medium">Account/Instance</Label>
                        <Input 
                          id="warehouse-account" 
                          placeholder="your-account.snowflakecomputing.com"
                          value={endpoint}
                          onChange={(e) => setEndpoint(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="warehouse-database" className="text-sm font-medium">Database</Label>
                        <Input 
                          id="warehouse-database" 
                          placeholder="ANALYTICS_DB"
                          value={dbConfig.database}
                          onChange={(e) => setDbConfig(prev => ({ ...prev, database: e.target.value }))}
                          className="w-full"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="warehouse-warehouse" className="text-sm font-medium">Warehouse</Label>
                        <Input 
                          id="warehouse-warehouse" 
                          placeholder="COMPUTE_WH"
                          value={dbConfig.schema}
                          onChange={(e) => setDbConfig(prev => ({ ...prev, schema: e.target.value }))}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="warehouse-schema" className="text-sm font-medium">Schema</Label>
                        <Input 
                          id="warehouse-schema" 
                          placeholder="PUBLIC"
                          value={dbConfig.schema}
                          onChange={(e) => setDbConfig(prev => ({ ...prev, schema: e.target.value }))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {authType === "oauth" && (
                    <OAuthFields
                      config={oauthConfig}
                      onChange={setOauthConfig}
                      provider={provider}
                      showEndpoint={false}
                    />
                  )}
                  
                  {authType === "api-key" && (
                    <APIKeyFields
                      apiKey={apiKey}
                      onChange={setApiKey}
                      showEndpoint={false}
                      authMethod="api-key"
                      keyLabel="Data Warehouse API Key"
                      keyPlaceholder="Enter your data warehouse API key"
                    />
                  )}
                  
                  {authType === "bearer-token" && (
                    <APIKeyFields
                      apiKey={apiKey}
                      onChange={setApiKey}
                      showEndpoint={false}
                      authMethod="bearer-token"
                      keyLabel="Bearer Token"
                      keyPlaceholder="Enter your data warehouse bearer token"
                    />
                  )}
                  
                  {authType === "basic" && (
                    <BasicAuthFields
                      username={username}
                      password={password}
                      onUsernameChange={setUsername}
                      onPasswordChange={setPassword}
                      loginUrl={loginUrl}
                      onLoginUrlChange={setLoginUrl}
                      showEndpoint={false}
                      showLoginUrl={true}
                      usernamePlaceholder="Data warehouse username"
                      passwordPlaceholder="Data warehouse password"
                      loginUrlLabel="Login/Auth URL"
                    />
                  )}
                </div>
              )}

              {/* Connection Test Result */}
              {connectionTestResult && (
                <Alert className={connectionTestResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <TestTube className="h-4 w-4" />
                  <AlertDescription>
                    {connectionTestResult.success ? (
                      <span className="text-green-700">
                        Connection successful! Response time: {connectionTestResult.responseTime}s
                      </span>
                    ) : (
                      <span className="text-red-700">
                        Connection failed: {connectionTestResult.error}
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="pt-4 border-t">
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isTestingConnection}
                >
                  {isTestingConnection ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                      Testing Connection...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2" />
                Test Connection
                    </>
                  )}
              </Button>
              </div>
            </div>
          </div>
        )}

        {((preselectedType && currentStep === 2) || (!preselectedType && currentStep === 3)) && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{getStepTitle()}</h3>
              <p className="text-muted-foreground">Map source data fields to authorization attributes</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900">AI Recommendation</p>
                  <p className="text-sm text-amber-700">
                    {selectedType === "identity" || selectedType === "okta" || selectedType === "azure_ad" || selectedType === "auth0" 
                      ? "AI recommends mapping user attributes like 'email' to 'user.email' and 'groups' to 'user.roles' for effective policy enforcement."
                      : selectedType === "database" || selectedType === "postgresql" || selectedType === "mysql"
                      ? "AI recommends mapping database columns like 'owner_id' to 'resource.owner_id' and 'sensitivity' to 'resource.sensitivity_level'."
                      : selectedType === "openapi"
                      ? "AI recommends mapping API endpoints to 'api.path' and security requirements to 'api.security' for context-aware policies."
                      : "AI recommends mapping 'employee_status' to 'user.status' for effective policy enforcement."
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Available Metadata Fields</h4>
                <div className="border rounded-lg p-4 bg-muted/30 max-h-64 overflow-y-auto">
                  {connectionTestResult?.success ? (
                    <div className="space-y-2">
                      <p className="text-sm text-green-600 mb-3">✅ Connection successful! Available fields:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {getAvailableFields().map((field, index) => (
                          <div key={index} className="flex items-start space-x-2 p-3 bg-white rounded border hover:bg-gray-50">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              field.sensitivity === 'restricted' ? 'bg-red-500' :
                              field.sensitivity === 'confidential' ? 'bg-orange-500' :
                              field.sensitivity === 'internal' ? 'bg-blue-500' : 'bg-green-500'
                            }`}></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-mono font-medium">{field.name}</span>
                                <span className="text-xs text-gray-500">({field.type})</span>
                                {field.required && (
                                  <span className="text-xs bg-red-100 text-red-700 px-1 rounded">Required</span>
                                )}
                              </div>
                              {field.description && (
                                <p className="text-xs text-gray-600 mt-1">{field.description}</p>
                              )}
                              {field.example && (
                                <p className="text-xs text-gray-500 mt-1">Example: {field.example}</p>
                              )}
                              {field.enum_values && (
                                <p className="text-xs text-gray-500 mt-1">Values: {field.enum_values.join(', ')}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-amber-600 mb-3">⚠️ Test connection first to see available fields</p>
                      <div className="text-sm text-gray-600">
                        <p>Sample fields that may be available:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                          {getSampleFields().map((field, index) => (
                            <div key={index} className="flex items-center space-x-2 p-2 bg-gray-100 rounded border">
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              <span className="text-sm font-mono">{field.name}</span>
                              <span className="text-xs text-gray-500">({field.type})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Authorization Attributes</h4>
                <div className="space-y-2">
                  {(selectedType === "identity" || selectedType === "okta" || selectedType === "azure_ad" || selectedType === "auth0" 
                    ? [
                        { key: "user.id", description: "Unique user identifier" },
                        { key: "user.email", description: "User email address" },
                        { key: "user.first_name", description: "User first name" },
                        { key: "user.last_name", description: "User last name" },
                        { key: "user.department", description: "User department" },
                        { key: "user.roles", description: "User role assignments" },
                        { key: "user.groups", description: "User group memberships" },
                        { key: "user.mfa_enabled", description: "MFA enabled status" }
                      ]
                    : selectedType === "database" || selectedType === "postgresql" || selectedType === "mysql"
                    ? [
                        { key: "resource.id", description: "Resource unique identifier" },
                        { key: "resource.name", description: "Resource name" },
                        { key: "resource.owner_id", description: "Resource owner ID" },
                        { key: "resource.sensitivity_level", description: "Data sensitivity level" },
                        { key: "resource.environment", description: "Environment (dev/staging/prod)" },
                        { key: "resource.status", description: "Resource status" },
                        { key: "resource.created_at", description: "Creation timestamp" }
                      ]
                    : selectedType === "openapi"
                    ? [
                        { key: "api.path", description: "API endpoint path" },
                        { key: "api.method", description: "HTTP method" },
                        { key: "api.security", description: "Required security schemes" },
                        { key: "api.parameters", description: "Required parameters" },
                        { key: "api.operation_id", description: "Operation identifier" }
                      ]
                    : proposedAttributes
                  ).map((attr) => (
                    <div key={attr.key} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <code className="text-sm font-mono">{attr.key}</code>
                        <Select 
                          value={attributeMapping[attr.key] || ""} 
                          onValueChange={(value) => setAttributeMapping(prev => ({ ...prev, [attr.key]: value }))}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Map field" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedType === "identity" || selectedType === "okta" || selectedType === "azure_ad" || selectedType === "auth0" 
                              ? Object.keys(schemaData?.sampleUser || {}).map((field) => (
                              <SelectItem key={field} value={field}>{field}</SelectItem>
                                ))
                              : selectedType === "database" || selectedType === "postgresql" || selectedType === "mysql"
                              ? ["id", "name", "owner_id", "sensitivity_level", "environment", "status", "created_at"].map((field) => (
                                  <SelectItem key={field} value={field}>{field}</SelectItem>
                                ))
                              : selectedType === "openapi"
                              ? ["path", "method", "security", "parameters", "operation_id"].map((field) => (
                                  <SelectItem key={field} value={field}>{field}</SelectItem>
                                ))
                              : Object.keys(sampleSourceData).map((field) => (
                                  <SelectItem key={field} value={field}>{field}</SelectItem>
                                ))
                            }
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-xs text-muted-foreground">{attr.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Preview Mapped Data</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Attribute</TableHead>
                    <TableHead>Source Field</TableHead>
                    <TableHead>Sample Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(attributeMapping).map(([attr, field]) => (
                    <TableRow key={attr}>
                      <TableCell><code className="text-sm">{attr}</code></TableCell>
                      <TableCell>{field}</TableCell>
                      <TableCell>
                        {selectedType === "identity" || selectedType === "okta" || selectedType === "azure_ad" || selectedType === "auth0" 
                          ? schemaData?.sampleUser?.[field as keyof typeof schemaData.sampleUser] || "N/A"
                          : selectedType === "database" || selectedType === "postgresql" || selectedType === "mysql"
                          ? (() => {
                              const sampleData = {
                                id: "resource123",
                                name: "Customer Database",
                                owner_id: "user456",
                                sensitivity_level: "confidential",
                                environment: "production",
                                status: "active",
                                created_at: "2024-01-15T10:30:00Z"
                              };
                              return sampleData[field as keyof typeof sampleData] || "N/A";
                            })()
                          : selectedType === "openapi"
                          ? (() => {
                              const sampleData = {
                                path: "/api/v1/admin/purge",
                                method: "DELETE",
                                security: "oauth2",
                                parameters: "resource_id",
                                operation_id: "purgeResource"
                              };
                              return sampleData[field as keyof typeof sampleData] || "N/A";
                            })()
                          : sampleSourceData[field as keyof typeof sampleSourceData]
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {((preselectedType && currentStep === 3) || (!preselectedType && currentStep === 4)) && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{getStepTitle()}</h3>
              <p className="text-muted-foreground">Configure data synchronization and privacy settings</p>
            </div>

            <div className="grid gap-6 max-w-2xl mx-auto">
              <div className="space-y-2">
                <Label htmlFor="update-frequency">How often should data be updated?</Label>
                <Select value={updateFrequency} onValueChange={setUpdateFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Real-time (Webhooks/Streaming)</SelectItem>
                    <SelectItem value="5min">Every 5 minutes</SelectItem>
                    <SelectItem value="hourly">Every hour</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="privacy-level">Data Privacy Level</Label>
                <Select value={privacyLevel} onValueChange={setPrivacyLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="sensitive">Sensitive</SelectItem>
                    <SelectItem value="pii">PII (Personally Identifiable Information)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border rounded-lg p-4 bg-muted/30">
                <h5 className="font-medium mb-2">Suggested Policy Integration</h5>
                <p className="text-sm text-muted-foreground mb-3">
                  Based on your data source type, these policies might benefit from this integration:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox defaultChecked />
                    <span className="text-sm">Employee Access Control Policies</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox defaultChecked />
                    <span className="text-sm">Department-based Resource Policies</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox />
                    <span className="text-sm">Role-based API Access Policies</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {((preselectedType && currentStep === 4) || (!preselectedType && currentStep === 5)) && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{getStepTitle()}</h3>
              <p className="text-muted-foreground">Review your configuration before saving</p>
            </div>

            <div className="grid gap-4 max-w-2xl mx-auto">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Data Source Details</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Name:</span> {pipName}</p>
                  <p><span className="font-medium">Type:</span> {dataSourceTypes.find(t => t.id === selectedType)?.title}</p>
                  <p><span className="font-medium">Endpoint:</span> {endpoint}</p>
                  <p><span className="font-medium">Update Frequency:</span> {updateFrequency}</p>
                  <p><span className="font-medium">Privacy Level:</span> {privacyLevel}</p>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Attribute Mappings</h4>
                <div className="space-y-1 text-sm">
                  {Object.entries(attributeMapping).map(([attr, field]) => (
                    <p key={attr}><code>{attr}</code> ← {field}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-6 border-t">
          <Button 
            variant="outline" 
            onClick={currentStep === 1 ? handleClose : handleBack}
          >
            {currentStep === 1 ? "Cancel" : <><ArrowLeft className="h-4 w-4 mr-2" />Back</>}
          </Button>
          <Button 
            onClick={handleNext} 
            disabled={isNextDisabled()}
          >
            {(preselectedType ? currentStep === 4 : currentStep === 5) ? "Save Information Source" : <>Next<ArrowRight className="h-4 w-4 ml-2" /></>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
