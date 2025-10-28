import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  AlertTriangle, 
  XCircle, 
  Info, 
  CheckCircle, 
  Clock, 
  Users, 
  Database, 
  Network, 
  Settings,
  Filter,
  Download,
  RefreshCw,
  Eye,
  ExternalLink,
  Search
} from "lucide-react";
import { useSecurityIncidents, SecurityIncident, formatTimeAgo, getSeverityColor, getIncidentIcon } from "@/services/securityIncidentService";
import { SecurityIncidentsWidget } from "@/components/dashboard/widgets/SecurityIncidentsWidget";

export function SecurityIncidentsPage() {
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<SecurityIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [componentFilter, setComponentFilter] = useState<string>("all");
  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const securityIncidentService = useSecurityIncidents();

  // Load incidents
  useEffect(() => {
    loadIncidents();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = incidents;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(incident =>
        incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.incidentType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Severity filter
    if (severityFilter !== "all") {
      filtered = filtered.filter(incident => incident.severity === severityFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(incident => incident.status === statusFilter);
    }

    // Component filter
    if (componentFilter !== "all") {
      filtered = filtered.filter(incident => incident.component === componentFilter);
    }

    setFilteredIncidents(filtered);
  }, [incidents, searchTerm, severityFilter, statusFilter, componentFilter]);

  const loadIncidents = async () => {
    try {
      setLoading(true);
      const data = await securityIncidentService.getIncidents();
      setIncidents(data);
    } catch (error) {
      console.error("Failed to load incidents:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshIncidents = async () => {
    try {
      setIsRefreshing(true);
      await loadIncidents();
    } finally {
      setIsRefreshing(false);
    }
  };

  const exportIncidents = async () => {
    try {
      const blob = await securityIncidentService.exportIncidents();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `security-incidents-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export incidents:", error);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "high":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "medium":
        return <Info className="h-4 w-4 text-yellow-500" />;
      case "low":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getComponentIcon = (component: string) => {
    switch (component) {
      case "pap":
        return <Settings className="h-4 w-4" />;
      case "bouncer":
        return <Shield className="h-4 w-4" />;
      case "opal":
        return <Network className="h-4 w-4" />;
      case "business_admin":
        return <Database className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "destructive";
      case "investigating":
        return "secondary";
      case "resolved":
        return "outline";
      case "false_positive":
        return "outline";
      default:
        return "secondary";
    }
  };

  const activeIncidents = incidents.filter(incident => 
    incident.status === "active" || incident.status === "investigating"
  );
  const criticalIncidents = incidents.filter(incident => incident.severity === "critical");
  const overdueIncidents = incidents.filter(incident => incident.isOverdue);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security Incidents</h1>
          <p className="text-muted-foreground">
            Monitor and manage security incidents across Control Core components
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshIncidents} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportIncidents}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalIncidents.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{criticalIncidents.length} critical incident(s) require immediate attention.</strong>
            {overdueIncidents.length > 0 && (
              <span> {overdueIncidents.length} incident(s) are overdue for SLA response.</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{incidents.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{activeIncidents.length}</div>
            <p className="text-xs text-muted-foreground">Requiring attention</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Incidents</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalIncidents.length}</div>
            <p className="text-xs text-muted-foreground">High priority</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Incidents</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{overdueIncidents.length}</div>
            <p className="text-xs text-muted-foreground">SLA violations</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search incidents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="false_positive">False Positive</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={componentFilter} onValueChange={setComponentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Component" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Components</SelectItem>
                <SelectItem value="pap">PAP</SelectItem>
                <SelectItem value="bouncer">Bouncer</SelectItem>
                <SelectItem value="opal">OPAL</SelectItem>
                <SelectItem value="business_admin">Business Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Incidents List */}
      <Card>
        <CardHeader>
          <CardTitle>Security Incidents ({filteredIncidents.length})</CardTitle>
          <CardDescription>
            Detailed view of security incidents from all Control Core components
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading incidents...
            </div>
          ) : filteredIncidents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No incidents found matching your criteria.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredIncidents.map((incident) => (
                <div
                  key={incident.id}
                  className={`p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors ${
                    incident.isOverdue ? 'border-red-200 bg-red-50' : ''
                  } ${incident.severity === 'critical' ? 'border-red-300' : ''}`}
                  onClick={() => setSelectedIncident(incident)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getSeverityIcon(incident.severity)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">{incident.title}</h3>
                          <Badge variant={getSeverityColor(incident.severity)} className="text-xs">
                            {incident.severity.toUpperCase()}
                          </Badge>
                          <Badge variant={getStatusColor(incident.status)} className="text-xs">
                            {incident.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          {incident.isOverdue && (
                            <Badge variant="destructive" className="text-xs">
                              OVERDUE
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {incident.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            {getComponentIcon(incident.component)}
                            <span>{incident.component.toUpperCase()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>{getIncidentIcon(incident.incidentType)}</span>
                            <span>{incident.incidentType.replace('_', ' ')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatTimeAgo(incident.detectedAt)}</span>
                          </div>
                          {incident.crmTicketId && (
                            <div className="flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />
                              <span>{incident.crmTicketId}</span>
                            </div>
                          )}
                        </div>
                        
                        {incident.affectedSystems.length > 0 && (
                          <div className="flex items-center gap-2 text-xs mt-2">
                            <Database className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Systems:</span>
                            <span className="font-medium">{incident.affectedSystems.join(", ")}</span>
                          </div>
                        )}
                        
                        {incident.affectedUsers.length > 0 && (
                          <div className="flex items-center gap-2 text-xs">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Users:</span>
                            <span className="font-medium">{incident.affectedUsers.join(", ")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
