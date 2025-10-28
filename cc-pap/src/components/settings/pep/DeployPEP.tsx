import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Copy, Database, Server, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function DeployPEP() {
  const { toast } = useToast();

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${type} configuration copied to clipboard.`,
    });
  };

  return (
    <div className="space-y-6">
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertTitle>Deployment Instructions</AlertTitle>
        <AlertDescription>
          Select a deployment method or PEP type below to view detailed instructions for deploying your PEP components.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="deployment-method">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="deployment-method">By Deployment Method</TabsTrigger>
          <TabsTrigger value="pep-type">By PEP Type</TabsTrigger>
        </TabsList>
        
        <TabsContent value="deployment-method">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="sidecar">
              <AccordionTrigger className="text-lg font-medium">
                <div className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-primary" />
                  Sidecar Deployment
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Deploy PEP as a sidecar container alongside your application in container orchestration platforms like Kubernetes.
                  </p>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Kubernetes Example</CardTitle>
                      <CardDescription>YAML configuration for Kubernetes sidecar deployment</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                        {`apiVersion: v1
kind: Pod
metadata:
  name: app-with-pep
spec:
  containers:
  - name: app
    image: your-application:latest
  - name: pep-sidecar
    image: policy-engine/pep:1.2.0
    env:
    - name: PDP_ENDPOINT
      value: "https://pdp.example.com"
    - name: PEP_ID
      value: "sidecar-pep-001"
    ports:
    - containerPort: 8181`}
                      </pre>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4" 
                        onClick={() => copyToClipboard(`apiVersion: v1
kind: Pod
metadata:
  name: app-with-pep
spec:
  containers:
  - name: app
    image: your-application:latest
  - name: pep-sidecar
    image: policy-engine/pep:1.2.0
    env:
    - name: PDP_ENDPOINT
      value: "https://pdp.example.com"
    - name: PEP_ID
      value: "sidecar-pep-001"
    ports:
    - containerPort: 8181`, "Kubernetes YAML")}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Configuration
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <p className="text-muted-foreground">
                    For more detailed instructions on sidecar deployment, please refer to our 
                    <Button variant="link" className="px-1 h-auto">comprehensive documentation</Button>.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="agent">
              <AccordionTrigger className="text-lg font-medium">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Agent/Library Deployment
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Integrate PEP functionality directly into your application using our library or agent.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-md">Java Integration</CardTitle>
                        <CardDescription>Maven dependency configuration</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                          {`<dependency>
  <groupId>com.policy-engine</groupId>
  <artifactId>pep-client</artifactId>
  <version>1.2.0</version>
</dependency>`}
                        </pre>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-4" 
                          onClick={() => copyToClipboard(`<dependency>
  <groupId>com.policy-engine</groupId>
  <artifactId>pep-client</artifactId>
  <version>1.2.0</version>
</dependency>`, "Maven dependency")}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-md">JavaScript Integration</CardTitle>
                        <CardDescription>NPM package installation</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                          {`// Install the package
npm install @policy-engine/pep-client

// Usage in your application
import { PEPClient } from '@policy-engine/pep-client';

const pep = new PEPClient({
  pdpEndpoint: 'https://pdp.example.com',
  pepId: 'js-app-pep-001'
});`}
                        </pre>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-4" 
                          onClick={() => copyToClipboard(`// Install the package
npm install @policy-engine/pep-client

// Usage in your application
import { PEPClient } from '@policy-engine/pep-client';

const pep = new PEPClient({
  pdpEndpoint: 'https://pdp.example.com',
  pepId: 'js-app-pep-001'
});`, "JavaScript integration")}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <p className="text-muted-foreground">
                    For more language-specific integration guides, please refer to our 
                    <Button variant="link" className="px-1 h-auto">developer documentation</Button>.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="standalone">
              <AccordionTrigger className="text-lg font-medium">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  Standalone Deployment
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Deploy PEP as a standalone service that can enforce policies for multiple applications or services.
                  </p>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Docker Deployment</CardTitle>
                      <CardDescription>Docker run command for standalone PEP</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                        {`docker run -d \\
  --name standalone-pep \\
  -p 8181:8181 \\
  -e PDP_ENDPOINT=https://pdp.example.com \\
  -e PEP_ID=standalone-pep-001 \\
  policy-engine/pep:1.2.0`}
                      </pre>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4" 
                        onClick={() => copyToClipboard(`docker run -d \\
  --name standalone-pep \\
  -p 8181:8181 \\
  -e PDP_ENDPOINT=https://pdp.example.com \\
  -e PEP_ID=standalone-pep-001 \\
  policy-engine/pep:1.2.0`, "Docker command")}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Command
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Configuration File</CardTitle>
                      <CardDescription>Example configuration for standalone PEP</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                        {`{
  "pep_id": "standalone-pep-001",
  "pdp": {
    "endpoint": "https://pdp.example.com",
    "auth": {
      "type": "oauth2",
      "client_id": "pep-client",
      "client_secret": "YOUR_CLIENT_SECRET"
    }
  },
  "server": {
    "port": 8181,
    "host": "0.0.0.0"
  },
  "logging": {
    "level": "info",
    "output": "stdout"
  }
}`}
                      </pre>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4" 
                        onClick={() => copyToClipboard(`{
  "pep_id": "standalone-pep-001",
  "pdp": {
    "endpoint": "https://pdp.example.com",
    "auth": {
      "type": "oauth2",
      "client_id": "pep-client",
      "client_secret": "YOUR_CLIENT_SECRET"
    }
  },
  "server": {
    "port": 8181,
    "host": "0.0.0.0"
  },
  "logging": {
    "level": "info",
    "output": "stdout"
  }
}`, "Configuration JSON")}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Configuration
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <p className="text-muted-foreground">
                    For advanced configuration options and high-availability setups, please refer to our 
                    <Button variant="link" className="px-1 h-auto">deployment guide</Button>.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="edge-gateway">
              <AccordionTrigger className="text-lg font-medium">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-green-500" />
                  Edge Gateway Deployment
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Deploy PEP on edge gateways to enforce policies for IoT devices and local networks.
                  </p>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Edge Gateway Configuration</CardTitle>
                      <CardDescription>Example configuration for edge gateway PEP</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                        {`{
  "pep_id": "edge-gw-pep-001",
  "pdp": {
    "endpoint": "https://pdp.example.com",
    "offline_mode": {
      "enabled": true,
      "cache_ttl": 3600,
      "default_action": "deny"
    }
  },
  "device_discovery": {
    "enabled": true,
    "methods": ["mdns", "upnp", "bluetooth"]
  },
  "protocols": {
    "mqtt": {
      "enabled": true,
      "broker": "localhost",
      "port": 1883
    },
    "coap": {
      "enabled": true,
      "port": 5683
    }
  },
  "logging": {
    "level": "info",
    "output": "file",
    "file_path": "/var/log/edge-pep.log"
  }
}`}
                      </pre>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4" 
                        onClick={() => copyToClipboard(`{
  "pep_id": "edge-gw-pep-001",
  "pdp": {
    "endpoint": "https://pdp.example.com",
    "offline_mode": {
      "enabled": true,
      "cache_ttl": 3600,
      "default_action": "deny"
    }
  },
  "device_discovery": {
    "enabled": true,
    "methods": ["mdns", "upnp", "bluetooth"]
  },
  "protocols": {
    "mqtt": {
      "enabled": true,
      "broker": "localhost",
      "port": 1883
    },
    "coap": {
      "enabled": true,
      "port": 5683
    }
  },
  "logging": {
    "level": "info",
    "output": "file",
    "file_path": "/var/log/edge-pep.log"
  }
}`, "Edge Gateway Configuration")}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Configuration
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <p className="text-muted-foreground">
                    For more information on deploying PEPs on edge gateways for IoT devices, please refer to our 
                    <Button variant="link" className="px-1 h-auto">IoT deployment guide</Button>.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="cloud-function">
              <AccordionTrigger className="text-lg font-medium">
                <div className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-blue-500" />
                  Cloud Function Deployment
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Deploy PEP as a serverless function in cloud environments like Google Cloud Functions, AWS Lambda, or Azure Functions.
                  </p>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Google Cloud Function Example</CardTitle>
                      <CardDescription>Example configuration and code for Google Cloud Functions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                        {`// index.js
const { PEPClient } = require('@policy-engine/pep-client');

// Initialize the PEP client
const pep = new PEPClient({
  pdpEndpoint: process.env.PDP_ENDPOINT,
  pepId: process.env.PEP_ID || 'gcf-pep-001',
  authConfig: {
    type: 'google',
    serviceAccount: process.env.SERVICE_ACCOUNT
  }
});

exports.authorizeRequest = async (req, res) => {
  try {
    // Extract identity and context information
    const { identity, resource, action, context } = req.body;
    
    // Make authorization decision
    const decision = await pep.authorize({
      identity,
      resource,
      action,
      context
    });
    
    // Return the decision
    res.status(200).send({ decision });
  } catch (error) {
    console.error('Authorization error:', error);
    res.status(500).send({ error: 'Authorization failed' });
  }
};`}
                      </pre>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4" 
                        onClick={() => copyToClipboard(`// index.js
const { PEPClient } = require('@policy-engine/pep-client');

// Initialize the PEP client
const pep = new PEPClient({
  pdpEndpoint: process.env.PDP_ENDPOINT,
  pepId: process.env.PEP_ID || 'gcf-pep-001',
  authConfig: {
    type: 'google',
    serviceAccount: process.env.SERVICE_ACCOUNT
  }
});

exports.authorizeRequest = async (req, res) => {
  try {
    // Extract identity and context information
    const { identity, resource, action, context } = req.body;
    
    // Make authorization decision
    const decision = await pep.authorize({
      identity,
      resource,
      action,
      context
    });
    
    // Return the decision
    res.status(200).send({ decision });
  } catch (error) {
    console.error('Authorization error:', error);
    res.status(500).send({ error: 'Authorization failed' });
  }
};`, "Cloud Function Code")}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Code
                      </Button>

                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Deployment Command</h4>
                        <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                          {`gcloud functions deploy authorizeRequest \\
  --runtime nodejs14 \\
  --trigger-http \\
  --allow-unauthenticated \\
  --set-env-vars PDP_ENDPOINT=https://pdp.example.com,PEP_ID=gcf-pep-001`}
                        </pre>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2" 
                          onClick={() => copyToClipboard(`gcloud functions deploy authorizeRequest \\
  --runtime nodejs14 \\
  --trigger-http \\
  --allow-unauthenticated \\
  --set-env-vars PDP_ENDPOINT=https://pdp.example.com,PEP_ID=gcf-pep-001`, "GCloud Deploy Command")}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Command
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <p className="text-muted-foreground">
                    For more information on deploying PEPs as cloud functions, please refer to our 
                    <Button variant="link" className="px-1 h-auto">cloud functions deployment guide</Button>.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>
        
        <TabsContent value="pep-type">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="mcp-pep">
              <AccordionTrigger className="text-lg font-medium">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-purple-500" />
                  MCP PEP (for AI Agents)
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    MCP (Model Context Protocol) PEPs enforce policies for AI Agents, ensuring that AI operations
                    comply with defined authorization policies by evaluating model context.
                  </p>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Python Integration</CardTitle>
                      <CardDescription>Python library for AI frameworks</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                        {`# Install the package
pip install policy-engine-mcp-pep

# Usage in your application
from policy_engine.mcp import MCPPolicyEnforcer

# Initialize the MCP PEP
mcp_pep = MCPPolicyEnforcer(
    pdp_endpoint="https://pdp.example.com",
    pep_id="ai-agent-mcp-001",
    model_context_extractor="default"  # or custom extractor
)

# Use in AI agent request
async def process_agent_request(request, context):
    # Check if operation is authorized
    decision = await mcp_pep.authorize(
        identity=request.user_id,
        action="generate_content",
        resource="model:gpt-4",
        context={
            "prompt": request.prompt,
            "model_parameters": request.parameters,
            "session_context": context
        }
    )
    
    if decision.allowed:
        # Proceed with the AI operation
        return await generate_ai_response(request)
    else:
        # Operation not allowed
        return {
            "error": "Not authorized",
            "reason": decision.reason
        }`}
                      </pre>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4" 
                        onClick={() => copyToClipboard(`# Install the package
pip install policy-engine-mcp-pep

# Usage in your application
from policy_engine.mcp import MCPPolicyEnforcer

# Initialize the MCP PEP
mcp_pep = MCPPolicyEnforcer(
    pdp_endpoint="https://pdp.example.com",
    pep_id="ai-agent-mcp-001",
    model_context_extractor="default"  # or custom extractor
)

# Use in AI agent request
async def process_agent_request(request, context):
    # Check if operation is authorized
    decision = await mcp_pep.authorize(
        identity=request.user_id,
        action="generate_content",
        resource="model:gpt-4",
        context={
            "prompt": request.prompt,
            "model_parameters": request.parameters,
            "session_context": context
        }
    )
    
    if decision.allowed:
        # Proceed with the AI operation
        return await generate_ai_response(request)
    else:
        # Operation not allowed
        return {
            "error": "Not authorized",
            "reason": decision.reason
        }`, "Python MCP Integration")}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Code
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">MCP PEP Service</CardTitle>
                      <CardDescription>Configuration for deploying MCP PEP as a service</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                        {`{
  "service": {
    "name": "mcp-pep-service",
    "port": 3000,
    "host": "0.0.0.0"
  },
  "pdp": {
    "endpoint": "https://pdp.example.com",
    "auth": {
      "type": "oauth2",
      "client_id": "mcp-pep-client",
      "client_secret": "YOUR_CLIENT_SECRET"
    }
  },
  "mcp": {
    "context_extraction": {
      "prompt": true,
      "model_parameters": true,
      "response": false,
      "user_data": true
    },
    "content_filtering": {
      "enabled": true,
      "filter_regex": [
        "sensitive_pattern_1",
        "sensitive_pattern_2"
      ]
    }
  },
  "logging": {
    "level": "info",
    "output": "stdout",
    "decisions": {
      "log": true,
      "include_context": false
    }
  }
}`}
                      </pre>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4" 
                        onClick={() => copyToClipboard(`{
  "service": {
    "name": "mcp-pep-service",
    "port": 3000,
    "host": "0.0.0.0"
  },
  "pdp": {
    "endpoint": "https://pdp.example.com",
    "auth": {
      "type": "oauth2",
      "client_id": "mcp-pep-client",
      "client_secret": "YOUR_CLIENT_SECRET"
    }
  },
  "mcp": {
    "context_extraction": {
      "prompt": true,
      "model_parameters": true,
      "response": false,
      "user_data": true
    },
    "content_filtering": {
      "enabled": true,
      "filter_regex": [
        "sensitive_pattern_1",
        "sensitive_pattern_2"
      ]
    }
  },
  "logging": {
    "level": "info",
    "output": "stdout",
    "decisions": {
      "log": true,
      "include_context": false
    }
  }
}`, "MCP PEP Configuration")}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Configuration
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <p className="text-muted-foreground">
                    For detailed instructions on implementing MCP PEPs for AI Agents, please refer to our 
                    <Button variant="link" className="px-1 h-auto">AI Agent policy enforcement guide</Button>.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="iot-pep">
              <AccordionTrigger className="text-lg font-medium">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-green-500" />
                  IoT Device PEP
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    IoT Device PEPs enforce policies for Internet of Things devices, providing lightweight
                    policy enforcement for resource-constrained environments.
                  </p>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">MQTT Broker Integration</CardTitle>
                      <CardDescription>Configuration for MQTT broker with PEP enforcement</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                        {`# Mosquitto configuration with PEP integration
listener 1883
protocol mqtt

# Basic configuration
allow_anonymous false
password_file /etc/mosquitto/passwd

# PEP authentication and authorization
auth_plugin /usr/lib/mosquitto/auth-plugin-pep.so
auth_opt_pdp_url https://pdp.example.com/api/v1/authorize
auth_opt_pep_id mqtt-broker-pep-001
auth_opt_client_id_pattern %c
auth_opt_username_pattern %u
auth_opt_topic_pattern %t
auth_opt_cache_timeout 300

# Logging
log_dest file /var/log/mosquitto/mosquitto.log
log_type all`}
                      </pre>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4" 
                        onClick={() => copyToClipboard(`# Mosquitto configuration with PEP integration
listener 1883
protocol mqtt

# Basic configuration
allow_anonymous false
password_file /etc/mosquitto/passwd

# PEP authentication and authorization
auth_plugin /usr/lib/mosquitto/auth-plugin-pep.so
auth_opt_pdp_url https://pdp.example.com/api/v1/authorize
auth_opt_pep_id mqtt-broker-pep-001
auth_opt_client_id_pattern %c
auth_opt_username_pattern %u
auth_opt_topic_pattern %t
auth_opt_cache_timeout 300

# Logging
log_dest file /var/log/mosquitto/mosquitto.log
log_type all`, "MQTT Broker Configuration")}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Configuration
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Embedded C Library</CardTitle>
                      <CardDescription>Example code for embedded IoT device integration</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                        {`// Include the IoT PEP library
#include "policy_engine_iot_pep.h"

// Initialize the PEP
pep_config_t pep_config = {
    .pdp_endpoint = "https://pdp.example.com",
    .pep_id = "device-pep-001",
    .device_id = "device-123",
    .offline_cache = true,
    .cache_ttl = 3600,
    .default_action = PEP_DENY
};

pep_handle_t pep;
int result = pep_initialize(&pep_config, &pep);

// Example function to check authorization
bool is_authorized(const char* resource, const char* action) {
    pep_context_t context = pep_context_create();
    pep_context_add_string(context, "device_type", "temperature_sensor");
    pep_context_add_string(context, "location", "building-a");
    
    pep_decision_t decision;
    int result = pep_authorize(
        pep,
        "device-123", // identity
        resource,     // resource
        action,       // action
        context,      // context
        &decision     // output decision
    );
    
    pep_context_destroy(context);
    
    if (result != PEP_SUCCESS) {
        // Error handling
        return false;
    }
    
    return decision.allowed;
}`}
                      </pre>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4" 
                        onClick={() => copyToClipboard(`// Include the IoT PEP library
#include "policy_engine_iot_pep.h"

// Initialize the PEP
pep_config_t pep_config = {
    .pdp_endpoint = "https://pdp.example.com",
    .pep_id = "device-pep-001",
    .device_id = "device-123",
    .offline_cache = true,
    .cache_ttl = 3600,
    .default_action = PEP_DENY
};

pep_handle_t pep;
int result = pep_initialize(&pep_config, &pep);

// Example function to check authorization
bool is_authorized(const char* resource, const char* action) {
    pep_context_t context = pep_context_create();
    pep_context_add_string(context, "device_type", "temperature_sensor");
    pep_context_add_string(context, "location", "building-a");
    
    pep_decision_t decision;
    int result = pep_authorize(
        pep,
        "device-123", // identity
        resource,     // resource
        action,       // action
        context,      // context
        &decision     // output decision
    );
    
    pep_context_destroy(context);
    
    if (result != PEP_SUCCESS) {
        // Error handling
        return false;
    }
    
    return decision.allowed;
}`, "Embedded C PEP Code")}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Code
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <p className="text-muted-foreground">
                    For more detailed information on deploying IoT Device PEPs, please refer to our 
                    <Button variant="link" className="px-1 h-auto">IoT device security guide</Button>.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="a2a-pep">
              <AccordionTrigger className="text-lg font-medium">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-500" />
                  Google A2A PEP
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Google Agent-to-Agent (A2A) PEPs enforce policies for communications between Google AI Agents,
                    ensuring secure and compliant interactions.
                  </p>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Go Library Integration</CardTitle>
                      <CardDescription>Example code for Go-based A2A PEP integration</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                        {`package main

import (
	"log"
	
	"github.com/policy-engine/a2a-pep-go"
)

func main() {
	// Initialize the A2A PEP
	pepConfig := a2apep.Config{
		PDPEndpoint: "https://pdp.example.com",
		PEPID:       "google-a2a-pep-001",
		GoogleAuth: a2apep.GoogleAuthConfig{
			ProjectID:  "your-gcp-project",
			LocationID: "global",
		},
	}
	
	pep, err := a2apep.NewPEP(pepConfig)
	if err != nil {
		log.Fatalf("Failed to initialize A2A PEP: %v", err)
	}
	
	// Example handler for A2A communication
	http.HandleFunc("/a2a/communicate", func(w http.ResponseWriter, r *http.Request) {
		// Extract request details
		var req CommunicationRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request", http.StatusBadRequest)
			return
		}
		
		// Create authorization context
		context := map[string]interface{}{
			"source_agent":      req.SourceAgent,
			"destination_agent": req.DestinationAgent,
			"message_type":      req.MessageType,
			"content_summary":   req.ContentSummary,
		}
		
		// Check if communication is authorized
		decision, err := pep.Authorize(a2apep.AuthRequest{
			Identity: req.SourceAgent,
			Resource: "agent:" + req.DestinationAgent,
			Action:   "communicate",
			Context:  context,
		})
		
		if err != nil {
			http.Error(w, "Authorization error", http.StatusInternalServerError)
			return
		}
		
		if !decision.Allowed {
			http.Error(w, "Communication not authorized: "+decision.Reason, http.StatusForbidden)
			return
		}
		
		// Proceed with authorized communication
		// ...
	})
	
	// Start the server
	log.Fatal(http.ListenAndServe(":8080", nil))
}`}
                      </pre>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4" 
                        onClick={() => copyToClipboard(`package main

import (
	"log"
	
	"github.com/policy-engine/a2a-pep-go"
)

func main() {
	// Initialize the A2A PEP
	pepConfig := a2apep.Config{
		PDPEndpoint: "https://pdp.example.com",
		PEPID:       "google-a2a-pep-001",
		GoogleAuth: a2apep.GoogleAuthConfig{
			ProjectID:  "your-gcp-project",
			LocationID: "global",
		},
	}
	
	pep, err := a2apep.NewPEP(pepConfig)
	if err != nil {
		log.Fatalf("Failed to initialize A2A PEP: %v", err)
	}
	
	// Example handler for A2A communication
	http.HandleFunc("/a2a/communicate", func(w http.ResponseWriter, r *http.Request) {
		// Extract request details
		var req CommunicationRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request", http.StatusBadRequest)
			return
		}
		
		// Create authorization context
		context := map[string]interface{}{
			"source_agent":      req.SourceAgent,
			"destination_agent": req.DestinationAgent,
			"message_type":      req.MessageType,
			"content_summary":   req.ContentSummary,
		}
		
		// Check if communication is authorized
		decision, err := pep.Authorize(a2apep.AuthRequest{
			Identity: req.SourceAgent,
			Resource: "agent:" + req.DestinationAgent,
			Action:   "communicate",
			Context:  context,
		})
		
		if err != nil {
			http.Error(w, "Authorization error", http.StatusInternalServerError)
			return
		}
		
		if !decision.Allowed {
			http.Error(w, "Communication not authorized: "+decision.Reason, http.StatusForbidden)
			return
		}
		
		// Proceed with authorized communication
		// ...
	})
	
	// Start the server
	log.Fatal(http.ListenAndServe(":8080", nil))
}`, "Go A2A PEP Code")}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Code
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Google Cloud Deployment</CardTitle>
                      <CardDescription>Terraform configuration for A2A PEP deployment</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                        {`# Terraform configuration for Google A2A PEP
provider "google" {
  project = "your-gcp-project"
  region  = "us-central1"
}

# Service account for A2A PEP
resource "google_service_account" "a2a_pep" {
  account_id   = "a2a-pep-sa"
  display_name = "A2A PEP Service Account"
}

# Grant required permissions
resource "google_project_iam_member" "a2a_pep_roles" {
  for_each = toset([
    "roles/aiplatform.user",
    "roles/logging.logWriter"
  ])
  
  project = "your-gcp-project"
  role    = each.value
  member  = "serviceAccount:\${google_service_account.a2a_pep.email}"
}

# Cloud Run service for A2A PEP
resource "google_cloud_run_service" "a2a_pep" {
  name     = "a2a-pep-service"
  location = "us-central1"
  
  template {
    spec {
      containers {
        image = "gcr.io/your-gcp-project/a2a-pep:latest"
        
        env {
          name  = "PDP_ENDPOINT"
          value = "https://pdp.example.com"
        }
        
        env {
          name  = "PEP_ID"
          value = "google-a2a-pep-001"
        }
        
        env {
          name  = "PROJECT_ID"
          value = "your-gcp-project"
        }
      }
      
      service_account_name = google_service_account.a2a_pep.email
    }
  }
}

# Allow public access to the A2A PEP
resource "google_cloud_run_service_iam_member" "a2a_pep_public" {
  service  = google_cloud_run_service.a2a_pep.name
  location = google_cloud_run_service.a2a_pep.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}`}
                      </pre>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4" 
                        onClick={() => copyToClipboard(`# Terraform configuration for Google A2A PEP
provider "google" {
  project = "your-gcp-project"
  region  = "us-central1"
}

# Service account for A2A PEP
resource "google_service_account" "a2a_pep" {
  account_id   = "a2a-pep-sa"
  display_name = "A2A PEP Service Account"
}

# Grant required permissions
resource "google_project_iam_member" "a2a_pep_roles" {
  for_each = toset([
    "roles/aiplatform.user",
    "roles/logging.logWriter"
  ])
  
  project = "your-gcp-project"
  role    = each.value
  member  = "serviceAccount:\${google_service_account.a2a_pep.email}"
}

# Cloud Run service for A2A PEP
resource "google_cloud_run_service" "a2a_pep" {
  name     = "a2a-pep-service"
  location = "us-central1"
  
  template {
    spec {
      containers {
        image = "gcr.io/your-gcp-project/a2a-pep:latest"
        
        env {
          name  = "PDP_ENDPOINT"
          value = "https://pdp.example.com"
        }
        
        env {
          name  = "PEP_ID"
          value = "google-a2a-pep-001"
        }
        
        env {
          name  = "PROJECT_ID"
          value = "your-gcp-project"
        }
      }
      
      service_account_name = google_service_account.a2a_pep.email
    }
  }
}

# Allow public access to the A2A PEP
resource "google_cloud_run_service_iam_member" "a2a_pep_public" {
  service  = google_cloud_run_service.a2a_pep.name
  location = google_cloud_run_service.a2a_pep.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}`, "Terraform Configuration")}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Configuration
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <p className="text-muted-foreground">
                    For more information on Google A2A PEP integration and deployment, please refer to our 
                    <Button variant="link" className="px-1 h-auto">Google A2A integration guide</Button>.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>
      </Tabs>
    </div>
  );
}
