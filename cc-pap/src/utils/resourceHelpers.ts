
import { MOCK_CONTROLLED_RESOURCES, getAvailableResourcesByDeployment } from "@/data/mockData";

/**
 * Get resource name by ID, with fallback for unknown resources
 */
export function getResourceName(resourceId: string | undefined): string {
  if (!resourceId) return 'Unknown Resource';
  
  // Search in both resources and apis
  const allResources = [
    ...MOCK_CONTROLLED_RESOURCES.resources,
    ...MOCK_CONTROLLED_RESOURCES.apis
  ];
  
  const resource = allResources.find(r => r.id === resourceId);
  return resource ? resource.name : 'Unknown Resource';
}

/**
 * Get available resources based on deployment type
 */
export function getAvailableResources(deploymentType: 'hosted-saas' | 'on-premise' = 'hosted-saas') {
  return getAvailableResourcesByDeployment(deploymentType);
}

/**
 * Legacy function for backward compatibility with userTier
 */
export function getAvailableResourcesByTier(userTier?: string) {
  // Map userTier to deploymentType
  const deploymentType = userTier === 'saas-basic' ? 'hosted-saas' : 'on-premise';
  return getAvailableResourcesByDeployment(deploymentType);
}
