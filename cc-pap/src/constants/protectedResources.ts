
export const PROTECTED_RESOURCES = [
  { 
    id: '1', 
    name: 'MyCompany Customer API', 
    originalHost: 'api.mycompany.com',
    path: '/customer-info', 
    description: 'Customer data and profile information',
    controlCoreUrl: 'https://mycomp.controlcore.io/',
    status: 'Connected' as const,
    pathsProtected: ['/users/*', '/customers/*'],
    associatedPolicies: 3
  },
  { 
    id: '2', 
    name: 'AI Model Data API', 
    originalHost: 'ai-api.mycompany.com',
    path: '/ai-data', 
    description: 'Machine learning model endpoints',
    controlCoreUrl: 'https://ai-mycomp.controlcore.io/',
    status: 'Connected' as const,
    pathsProtected: ['/ai-data/*', '/models/*'],
    associatedPolicies: 2
  },
  { 
    id: '3', 
    name: 'Internal RAG Tool', 
    originalHost: 'rag.internal.mycompany.com',
    path: '/rag-api', 
    description: 'Internal RAG application endpoints',
    controlCoreUrl: 'https://rag-mycomp.controlcore.io/',
    status: 'Connected' as const,
    pathsProtected: ['/rag-api/*', '/embeddings/*'],
    associatedPolicies: 4
  },
  { 
    id: '4', 
    name: 'Billing & Payment API', 
    originalHost: 'billing.mycompany.com',
    path: '/billing-api', 
    description: 'Payment processing and billing',
    controlCoreUrl: 'https://billing-mycomp.controlcore.io/',
    status: 'Pending DNS' as const,
    pathsProtected: ['/billing/*', '/payments/*'],
    associatedPolicies: 1
  },
  { 
    id: '5', 
    name: 'Admin Settings Portal', 
    originalHost: 'admin.mycompany.com',
    path: '/admin/settings', 
    description: 'Administrative configuration panel',
    controlCoreUrl: 'https://admin-mycomp.controlcore.io/',
    status: 'Connected' as const,
    pathsProtected: ['/admin/*'],
    associatedPolicies: 2
  },
  { 
    id: '6', 
    name: 'All Protected Resources', 
    originalHost: '*',
    path: '*', 
    description: 'Apply to all currently protected resources',
    controlCoreUrl: '*.controlcore.io',
    status: 'Connected' as const,
    pathsProtected: ['*'],
    associatedPolicies: 0
  },
];

export type ProtectedResource = typeof PROTECTED_RESOURCES[0];
