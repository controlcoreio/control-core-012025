import React, { useState } from 'react';

// UI Components
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
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
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
    default: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    destructive: 'bg-destructive text-destructive-foreground',
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  };
  
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variantClasses[variant]}`}>
      {children}
    </span>
  );
};

const Input: React.FC<{ 
  placeholder?: string; 
  value?: string; 
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}> = ({ placeholder, value, onChange, className = '' }) => (
  <input
    type="text"
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
  />
);

const Tabs: React.FC<{ children: React.ReactNode; defaultValue?: string }> = ({ children, defaultValue }) => (
  <div className="w-full">
    {children}
  </div>
);

const TabsList: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
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
      active ? 'bg-background text-foreground shadow-sm' : 'hover:bg-background/50'
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
  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
    {children}
  </tr>
);

const TableHead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
    {children}
  </th>
);

const TableCell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
    {children}
  </td>
);

const DropdownMenu: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative inline-block text-left">
    {children}
  </div>
);

const DropdownMenuTrigger: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
    {children}
  </button>
);

const DropdownMenuContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
    {children}
  </div>
);

const DropdownMenuItem: React.FC<{ children: React.ReactNode; onClick?: () => void }> = ({ children, onClick }) => (
  <div 
    className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent hover:text-accent-foreground"
    onClick={onClick}
  >
    {children}
  </div>
);

// Icons
const MoreHorizontal = () => <span className="h-4 w-4">⋮</span>;
const TrendingUp = () => <span className="h-4 w-4">↗</span>;
const Users = () => <span className="h-4 w-4">👥</span>;
const DollarSign = () => <span className="h-4 w-4">$</span>;
const CreditCard = () => <span className="h-4 w-4">💳</span>;
const Plus = () => <span className="h-4 w-4">+</span>;
const Edit = () => <span className="h-4 w-4">✏</span>;
const Trash2 = () => <span className="h-4 w-4">🗑</span>;
const Search = () => <span className="h-4 w-4">🔍</span>;
const Filter = () => <span className="h-4 w-4">🔽</span>;
const Download = () => <span className="h-4 w-4">⬇</span>;
const Upload = () => <span className="h-4 w-4">⬆</span>;
const RefreshCw = () => <span className="h-4 w-4">🔄</span>;
const Settings = () => <span className="h-4 w-4">⚙</span>;
const Pause = () => <span className="h-4 w-4">⏸</span>;
const Play = () => <span className="h-4 w-4">▶</span>;
const Calendar = () => <span className="h-4 w-4">📅</span>;
const Building2 = () => <span className="h-4 w-4">🏢</span>;
const Package = () => <span className="h-4 w-4">📦</span>;

// Mock Data
const mockCustomers = [
  { 
    id: 1, 
    name: 'Acme Corporation', 
    email: 'admin@acme.com', 
    plan: 'Pro', 
    status: 'Active', 
    mrr: 2500, 
    lastActivity: '2024-01-15',
    signupDate: '2023-06-15',
    totalRevenue: 15000,
    subscriptionId: 'sub_acme_001'
  },
  { 
    id: 2, 
    name: 'TechStart Inc', 
    email: 'billing@techstart.com', 
    plan: 'Kickstart', 
    status: 'Active', 
    mrr: 500, 
    lastActivity: '2024-01-14',
    signupDate: '2023-09-10',
    totalRevenue: 2500,
    subscriptionId: 'sub_techstart_002'
  },
  { 
    id: 3, 
    name: 'Enterprise Solutions LLC', 
    email: 'admin@enterprise.com', 
    plan: 'Custom', 
    status: 'Active', 
    mrr: 5000, 
    lastActivity: '2024-01-13',
    signupDate: '2023-03-20',
    totalRevenue: 45000,
    subscriptionId: 'sub_enterprise_003'
  },
  { 
    id: 4, 
    name: 'StartupXYZ', 
    email: 'founder@startupxyz.com', 
    plan: 'Kickstart', 
    status: 'Trial', 
    mrr: 0, 
    lastActivity: '2024-01-12',
    signupDate: '2024-01-01',
    totalRevenue: 0,
    subscriptionId: 'sub_startupxyz_004'
  },
  { 
    id: 5, 
    name: 'Global Corp', 
    email: 'it@globalcorp.com', 
    plan: 'Pro', 
    status: 'Churned', 
    mrr: 0, 
    lastActivity: '2023-12-15',
    signupDate: '2023-01-10',
    totalRevenue: 18000,
    subscriptionId: 'sub_global_005'
  },
];

const mockProducts = [
  { 
    id: 1, 
    name: 'Control Core Pro', 
    description: 'Full-featured authorization platform with advanced policy management', 
    price: 2500, 
    status: 'Active',
    customers: 234,
    revenue: 585000
  },
  { 
    id: 2, 
    name: 'Control Core Kickstart', 
    description: 'Self-hosted basic version for small teams', 
    price: 500, 
    status: 'Active',
    customers: 456,
    revenue: 228000
  },
  { 
    id: 3, 
    name: 'Control Core Custom', 
    description: 'Enterprise custom deployment with dedicated support', 
    price: 5000, 
    status: 'Active',
    customers: 89,
    revenue: 445000
  },
  { 
    id: 4, 
    name: 'Control Core Trial', 
    description: '14-day free trial for evaluation', 
    price: 0, 
    status: 'Active',
    customers: 123,
    revenue: 0
  },
];

const mockSubscriptions = [
  { 
    id: 1, 
    customer: 'Acme Corporation', 
    product: 'Control Core Pro', 
    status: 'Active', 
    nextBilling: '2024-02-15', 
    amount: 2500,
    billingCycle: 'Monthly',
    startDate: '2023-06-15',
    customerId: 1
  },
  { 
    id: 2, 
    customer: 'TechStart Inc', 
    product: 'Control Core Kickstart', 
    status: 'Active', 
    nextBilling: '2024-02-14', 
    amount: 500,
    billingCycle: 'Monthly',
    startDate: '2023-09-10',
    customerId: 2
  },
  { 
    id: 3, 
    customer: 'Enterprise Solutions LLC', 
    product: 'Control Core Custom', 
    status: 'Active', 
    nextBilling: '2024-02-13', 
    amount: 5000,
    billingCycle: 'Monthly',
    startDate: '2023-03-20',
    customerId: 3
  },
  { 
    id: 4, 
    customer: 'StartupXYZ', 
    product: 'Control Core Trial', 
    status: 'Trial', 
    nextBilling: '2024-02-01', 
    amount: 0,
    billingCycle: 'Trial',
    startDate: '2024-01-01',
    customerId: 4
  },
  { 
    id: 5, 
    customer: 'Global Corp', 
    product: 'Control Core Pro', 
    status: 'Cancelled', 
    nextBilling: 'N/A', 
    amount: 0,
    billingCycle: 'Cancelled',
    startDate: '2023-01-10',
    customerId: 5
  },
];

const mockBillingHistory = [
  { id: 1, customer: 'Acme Corporation', amount: 2500, date: '2024-01-15', status: 'Paid', invoice: 'INV-001' },
  { id: 2, customer: 'TechStart Inc', amount: 500, date: '2024-01-14', status: 'Paid', invoice: 'INV-002' },
  { id: 3, customer: 'Enterprise Solutions LLC', amount: 5000, date: '2024-01-13', status: 'Paid', invoice: 'INV-003' },
  { id: 4, customer: 'Acme Corporation', amount: 2500, date: '2023-12-15', status: 'Paid', invoice: 'INV-004' },
  { id: 5, customer: 'TechStart Inc', amount: 500, date: '2023-12-14', status: 'Paid', invoice: 'INV-005' },
];

const StripeCRMDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Calculate metrics
  const totalCustomers = mockCustomers.length;
  const activeCustomers = mockCustomers.filter(c => c.status === 'Active').length;
  const totalMRR = mockCustomers.reduce((sum, c) => sum + c.mrr, 0);
  const totalRevenue = mockCustomers.reduce((sum, c) => sum + c.totalRevenue, 0);
  const churnRate = ((mockCustomers.filter(c => c.status === 'Churned').length / totalCustomers) * 100).toFixed(1);

  // Filter data based on search and status
  const filteredCustomers = mockCustomers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || customer.status.toLowerCase() === selectedStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stripe CRM Dashboard</h1>
            <p className="text-sm text-gray-600">Manage customers, subscriptions, and billing</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Download className="mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="mr-2" />
              Settings
            </Button>
            <Button>
              <Plus className="mr-2" />
              Add Customer
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold">{totalCustomers.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{activeCustomers} active</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Recurring Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(totalMRR)}</p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12.5% from last month
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                <p className="text-2xl font-bold">{mockSubscriptions.filter(s => s.status === 'Active').length}</p>
                <p className="text-xs text-gray-500">{mockSubscriptions.filter(s => s.status === 'Trial').length} trials</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Churn Rate</p>
                <p className="text-2xl font-bold">{churnRate}%</p>
                <p className="text-xs text-red-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +0.2% from last month
                </p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="customers">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger 
                value="customers" 
                active={activeTab === 'customers'}
                onClick={() => setActiveTab('customers')}
              >
                Customers
              </TabsTrigger>
              <TabsTrigger 
                value="products" 
                active={activeTab === 'products'}
                onClick={() => setActiveTab('products')}
              >
                Products
              </TabsTrigger>
              <TabsTrigger 
                value="subscriptions" 
                active={activeTab === 'subscriptions'}
                onClick={() => setActiveTab('subscriptions')}
              >
                Subscriptions
              </TabsTrigger>
              <TabsTrigger 
                value="billing" 
                active={activeTab === 'billing'}
                onClick={() => setActiveTab('billing')}
              >
                Billing
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2" />
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSelectedStatus('all')}>
                    All Status
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedStatus('active')}>
                    Active
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedStatus('trial')}>
                    Trial
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedStatus('churned')}>
                    Churned
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Customers Tab */}
          <TabsContent value="customers" active={activeTab === 'customers'}>
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Customer Management</h2>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="mr-2" />
                    Refresh
                  </Button>
                  <Button variant="outline" size="sm">
                    <Upload className="mr-2" />
                    Import
                  </Button>
                </div>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>MRR</TableHead>
                    <TableHead>Total Revenue</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-gray-500">{customer.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{customer.plan}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            customer.status === 'Active' ? 'success' : 
                            customer.status === 'Trial' ? 'warning' : 
                            'destructive'
                          }
                        >
                          {customer.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(customer.mrr)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(customer.totalRevenue)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(customer.lastActivity)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>
                              <Edit className="mr-2" />
                              Edit Customer
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <CreditCard className="mr-2" />
                              View Subscriptions
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <DollarSign className="mr-2" />
                              Billing History
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Trash2 className="mr-2" />
                              Delete Customer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" active={activeTab === 'products'}>
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Product Management</h2>
                <Button>
                  <Plus className="mr-2" />
                  Add Product
                </Button>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Customers</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-xs">
                        {product.description}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(product.price)}
                      </TableCell>
                      <TableCell>
                        {product.customers.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(product.revenue)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="success">{product.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>
                              <Edit className="mr-2" />
                              Edit Product
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Users className="mr-2" />
                              View Customers
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <DollarSign className="mr-2" />
                              Revenue Analytics
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Trash2 className="mr-2" />
                              Delete Product
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" active={activeTab === 'subscriptions'}>
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Subscription Management</h2>
                <Button>
                  <Plus className="mr-2" />
                  Add Subscription
                </Button>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Billing Cycle</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Next Billing</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockSubscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{subscription.customer}</div>
                          <div className="text-sm text-gray-500">ID: {subscription.customerId}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4 text-gray-400" />
                          <span>{subscription.product}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            subscription.status === 'Active' ? 'success' : 
                            subscription.status === 'Trial' ? 'warning' : 
                            'destructive'
                          }
                        >
                          {subscription.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {subscription.billingCycle}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(subscription.amount)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {subscription.nextBilling === 'N/A' ? 'N/A' : formatDate(subscription.nextBilling)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>
                              <Edit className="mr-2" />
                              Edit Subscription
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Pause className="mr-2" />
                              Pause
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Play className="mr-2" />
                              Resume
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Calendar className="mr-2" />
                              Change Billing Date
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Trash2 className="mr-2" />
                              Cancel Subscription
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                <h2 className="text-xl font-semibold">Billing History</h2>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Download className="mr-2" />
                    Export Invoices
                  </Button>
                  <Button variant="outline" size="sm">
                    <Calendar className="mr-2" />
                    Schedule Payments
                  </Button>
                </div>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockBillingHistory.map((billing) => (
                    <TableRow key={billing.id}>
                      <TableCell className="font-medium">
                        {billing.invoice}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span>{billing.customer}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(billing.amount)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(billing.date)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="success">{billing.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>
                              <Download className="mr-2" />
                              Download Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2" />
                              Edit Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <DollarSign className="mr-2" />
                              Process Refund
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Settings className="mr-2" />
                              Billing Settings
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StripeCRMDashboard;
