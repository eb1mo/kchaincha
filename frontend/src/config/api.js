// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  SUPERADMIN_LOGIN: `${API_BASE_URL}/api/auth/superadmin-login`,
  
  // Service endpoints
  SERVICES: `${API_BASE_URL}/api/services`,
  ADMIN_SERVICES: `${API_BASE_URL}/api/admin/services`,
  ORGANIZATION_SERVICES: `${API_BASE_URL}/api/organization-services`,
  LOCATIONS: `${API_BASE_URL}/api/locations`,
  BUNDLES: `${API_BASE_URL}/api/bundles`,
  
  // Upload endpoint
  UPLOAD: `${API_BASE_URL}/api/upload`,
  
  // SuperAdmin endpoints
  SUPERADMIN: {
    USERS: `${API_BASE_URL}/api/superadmin/users`,
    LICENSE_KEYS: `${API_BASE_URL}/api/superadmin/license-keys`,
    SERVICES: `${API_BASE_URL}/api/superadmin/services`,
    BUNDLES: `${API_BASE_URL}/api/superadmin/bundles`,
  }
};

// Helper function to get service-specific endpoints
export const getServiceEndpoint = (serviceId) => ({
  DETAIL: `${API_BASE_URL}/api/services/${serviceId}`,
  TOKEN_STATUS: `${API_BASE_URL}/api/services/${serviceId}/token-status`,
  TOKEN_REQUEST: `${API_BASE_URL}/api/services/${serviceId}/token`,
});

// Helper function to get file URL
export const getFileUrl = (filePath) => {
  if (!filePath) return '';
  return filePath.startsWith('http') ? filePath : `${API_BASE_URL}${filePath}`;
}; 