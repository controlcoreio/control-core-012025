import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Search, 
  Filter, 
  Database, 
  Shield, 
  Clock,
  AlertTriangle,
  FileText,
  Settings,
  BarChart3,
  HardDrive,
  Archive,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';

interface RetentionPolicy {
  policy_id: string;
  name: string;
  description: string;
  data_type: string;
  data_classification: string;
  retention_period_days: number;
  retention_action: string;
  auto_execution_enabled: boolean;
  is_active: boolean;
  created_at: string;
}

interface DataAsset {
  asset_id: string;
  name: string;
  data_type: string;
  data_classification: string;
  location: string;
  size_bytes: number;
  record_count: number;
  created_at: string;
  retention_status: string;
  scheduled_action_date?: string;
  tags: string[];
}

interface RetentionStatistics {
  total_assets: number;
  total_policies: number;
  assets_by_status: Record<string, number>;
  assets_by_type: Record<string, number>;
  upcoming_actions: number;
  overdue_actions: number;
  total_data_size_gb: number;
  total_record_count: number;
}

interface UpcomingAction {
  asset_id: string;
  asset_name: string;
  data_type: string;
  scheduled_date: string;
  days_until_action: number;
  action_type: string;
  size_bytes: number;
}

export function DataRetention() {
  const [policies, setPolicies] = useState<RetentionPolicy[]>([]);
  const [assets, setAssets] = useState<DataAsset[]>([]);
  const [statistics, setStatistics] = useState<RetentionStatistics | null>(null);
  const [upcomingActions, setUpcomingActions] = useState<UpcomingAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Mock data for demonstration
      const mockPolicies: RetentionPolicy[] = [
        {
          policy_id: "policy_user_data",
          name: "User Data Retention Policy",
          description: "Retention policy for user personal data in accordance with GDPR and SOC2 requirements",
          data_type: "user_data",
          data_classification: "confidential",
          retention_period_days: 2555,
          retention_action: "anonymize",
          auto_execution_enabled: true,
          is_active: true,
          created_at: "2024-01-01T00:00:00Z"
        },
        {
          policy_id: "policy_audit_logs",
          name: "Audit Logs Retention Policy",
          description: "Retention policy for audit logs required for SOC2 compliance",
          data_type: "audit_logs",
          data_classification: "restricted",
          retention_period_days: 2190,
          retention_action: "archive",
          auto_execution_enabled: true,
          is_active: true,
          created_at: "2024-01-01T00:00:00Z"
        }
      ];

      const mockAssets: DataAsset[] = [
        {
          asset_id: "asset_user_data_001",
          name: "User Profiles Database",
          data_type: "user_data",
          data_classification: "confidential",
          location: "cc-pap-api-db/users",
          size_bytes: 1073741824,
          record_count: 50000,
          created_at: "2023-06-15T10:00:00Z",
          retention_status: "active",
          scheduled_action_date: "2030-06-15T10:00:00Z",
          tags: ["active", "user_data"]
        },
        {
          asset_id: "asset_audit_logs_001",
          name: "Audit Logs Archive",
          data_type: "audit_logs",
          data_classification: "restricted",
          location: "cc-bouncer-logs/audit",
          size_bytes: 536870912,
          record_count: 1000000,
          created_at: "2019-06-15T10:00:00Z",
          retention_status: "scheduled_for_deletion",
          scheduled_action_date: "2024-02-15T10:00:00Z",
          tags: ["archive", "compliance"]
        }
      ];

      const mockStatistics: RetentionStatistics = {
        total_assets: 15,
        total_policies: 8,
        assets_by_status: {
          "active": 10,
          "scheduled_for_deletion": 3,
          "archived": 2
        },
        assets_by_type: {
          "user_data": 5,
          "audit_logs": 4,
          "telemetry_data": 3,
          "policy_data": 2,
          "access_logs": 1
        },
        upcoming_actions: 5,
        overdue_actions: 1,
        total_data_size_gb: 45.2,
        total_record_count: 2500000
      };

      const mockUpcomingActions: UpcomingAction[] = [
        {
          asset_id: "asset_audit_logs_001",
          asset_name: "Audit Logs Archive",
          data_type: "audit_logs",
          scheduled_date: "2024-02-15T10:00:00Z",
          days_until_action: 15,
          action_type: "archive",
          size_bytes: 536870912
        }
      ];

      setPolicies(mockPolicies);
      setAssets(mockAssets);
      setStatistics(mockStatistics);
      setUpcomingActions(mockUpcomingActions);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'scheduled_for_deletion': return 'destructive';
      case 'archived': return 'secondary';
      case 'deleted': return 'outline';
      default: return 'outline';
    }
  };

  const getClassificationBadgeVariant = (classification: string) => {
    switch (classification) {
      case 'restricted': return 'destructive';
      case 'confidential': return 'secondary';
      case 'internal': return 'outline';
      case 'public': return 'default';
      default: return 'outline';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'delete': return <Trash2 className="h-4 w-4" />;
      case 'archive': return <Archive className="h-4 w-4" />;
      case 'anonymize': return <Shield className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const filteredAssets = assets.filter(asset => {
    const matchesStatus = filterStatus === 'all' || asset.retention_status === filterStatus;
    const matchesType = filterType === 'all' || asset.data_type === filterType;
    const matchesSearch = searchTerm === '' || 
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesType && matchesSearch;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Retention</h1>
          <p className="text-muted-foreground">
            SOC2-compliant automated data lifecycle management
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            New Policy
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Register Asset
          </Button>
        </div>
      </div>

      {/* Statistics Overview */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_assets}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.total_data_size_gb} GB total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Retention Policies</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_policies}</div>
              <p className="text-xs text-muted-foreground">
                Active policies
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Actions</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.upcoming_actions}</div>
              <p className="text-xs text-muted-foreground">
                Next 30 days
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Actions</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{statistics.overdue_actions}</div>
              <p className="text-xs text-muted-foreground">
                Requires attention
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="assets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assets">Data Assets</TabsTrigger>
          <TabsTrigger value="policies">Retention Policies</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Actions</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Report</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Assets</CardTitle>
              <CardDescription>
                Manage and monitor all data assets under retention policies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search assets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="scheduled_for_deletion">Scheduled</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                    <SelectItem value="deleted">Deleted</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="user_data">User Data</SelectItem>
                    <SelectItem value="audit_logs">Audit Logs</SelectItem>
                    <SelectItem value="telemetry_data">Telemetry</SelectItem>
                    <SelectItem value="policy_data">Policy Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Classification</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssets.map((asset) => (
                    <TableRow key={asset.asset_id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{asset.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {asset.location}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {asset.data_type.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getClassificationBadgeVariant(asset.data_classification)}>
                          {asset.data_classification.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatBytes(asset.size_bytes)}</TableCell>
                      <TableCell>{asset.record_count.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(asset.retention_status)}>
                          {asset.retention_status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {asset.scheduled_action_date ? 
                          format(new Date(asset.scheduled_action_date), 'MMM dd, yyyy') : 
                          'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Retention Policies</CardTitle>
              <CardDescription>
                Configure and manage data retention policies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Policy Name</TableHead>
                    <TableHead>Data Type</TableHead>
                    <TableHead>Classification</TableHead>
                    <TableHead>Retention Period</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Auto Execute</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policies.map((policy) => (
                    <TableRow key={policy.policy_id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{policy.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {policy.description.substring(0, 100)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {policy.data_type.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getClassificationBadgeVariant(policy.data_classification)}>
                          {policy.data_classification.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{policy.retention_period_days} days</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionIcon(policy.retention_action)}
                          {policy.retention_action.replace('_', ' ').toUpperCase()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={policy.auto_execution_enabled ? 'default' : 'outline'}>
                          {policy.auto_execution_enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={policy.is_active ? 'default' : 'outline'}>
                          {policy.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Retention Actions</CardTitle>
              <CardDescription>
                Assets scheduled for retention actions in the next 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingActions.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Upcoming Actions</h3>
                  <p className="text-muted-foreground">
                    No assets are scheduled for retention actions in the next 30 days.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Scheduled Date</TableHead>
                      <TableHead>Days Until</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingActions.map((action) => (
                      <TableRow key={action.asset_id}>
                        <TableCell className="font-medium">{action.asset_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {action.data_type.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getActionIcon(action.action_type)}
                            {action.action_type.toUpperCase()}
                          </div>
                        </TableCell>
                        <TableCell>{formatBytes(action.size_bytes)}</TableCell>
                        <TableCell>
                          {format(new Date(action.scheduled_date), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={action.days_until_action <= 7 ? 'destructive' : 'secondary'}>
                            {action.days_until_action} days
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Report</CardTitle>
              <CardDescription>
                Data retention compliance overview and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Overall Compliance Score</h3>
                    <p className="text-sm text-muted-foreground">
                      Based on policy adherence and data lifecycle management
                    </p>
                  </div>
                  <div className="text-3xl font-bold text-green-600">98%</div>
                </div>
                
                <Progress value={98} className="h-2" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Assets by Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {statistics && Object.entries(statistics.assets_by_status).map(([status, count]) => (
                          <div key={status} className="flex justify-between items-center">
                            <span className="capitalize">{status.replace('_', ' ')}</span>
                            <Badge variant="outline">{count}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Assets by Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {statistics && Object.entries(statistics.assets_by_type).map(([type, count]) => (
                          <div key={type} className="flex justify-between items-center">
                            <span className="capitalize">{type.replace('_', ' ')}</span>
                            <Badge variant="outline">{count}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
