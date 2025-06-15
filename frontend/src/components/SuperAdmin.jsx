import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

const SuperAdmin = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [licenseKeys, setLicenseKeys] = useState([]);
  const [services, setServices] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [assistanceRequests, setAssistanceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // License key generation form
  const [licenseForm, setLicenseForm] = useState({
    count: 1,
    expiresAt: ''
  });
  
  // Bundle creation form
  const [showBundleForm, setShowBundleForm] = useState(false);
  const [editingBundle, setEditingBundle] = useState(null);
  const [bundleForm, setBundleForm] = useState({
    bundleName: '',
    description: '',
    services: [],
    location: {
      province: '',
      district: '',
      municipality: ''
    }
  });

  // Service management form
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    serviceName: '',
    requiredDocuments: [''],
    procedure: [''],
    estimatedTime: '',
    charge: '',
    sampleForm: null,
    tokenSystemEnabled: false,
    dailyTokenLimit: 50
  });

  // Service search term
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    loadUserAndData();
  }, []);

  const loadUserAndData = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'superadmin') {
        navigate('/admin');
        return;
      }
      setUser(parsedUser);
      fetchAllData(token);
    } catch (error) {
      console.error('Error parsing user data:', error);
      handleLogout();
    }
  };

  const fetchAllData = async (token) => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [usersRes, licenseKeysRes, servicesRes, bundlesRes, assistanceRes] = await Promise.all([
        axios.get(API_ENDPOINTS.SUPERADMIN.USERS, { headers }),
        axios.get(API_ENDPOINTS.SUPERADMIN.LICENSE_KEYS, { headers }),
        axios.get(API_ENDPOINTS.SUPERADMIN.SERVICES, { headers }),
        axios.get(API_ENDPOINTS.SUPERADMIN.BUNDLES, { headers }),
        axios.get(API_ENDPOINTS.SUPERADMIN.ASSISTANCE_REQUESTS, { headers })
      ]);
      
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      setLicenseKeys(Array.isArray(licenseKeysRes.data) ? licenseKeysRes.data : []);
      setServices(Array.isArray(servicesRes.data) ? servicesRes.data : []);
      setBundles(Array.isArray(bundlesRes.data) ? bundlesRes.data : []);
      setAssistanceRequests(Array.isArray(assistanceRes.data) ? assistanceRes.data : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Set default empty arrays to prevent map errors
      setUsers([]);
      setLicenseKeys([]);
      setServices([]);
      setBundles([]);
      setAssistanceRequests([]);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // User Management Functions
  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await axios.put(`${API_ENDPOINTS.SUPERADMIN.USERS}/${userId}/status`, 
        { isActive: !currentStatus }, 
        { headers: getAuthHeaders() }
      );
      
      setUsers(users.map(user => 
        user._id === userId ? { ...user, isActive: !currentStatus } : user
      ));
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Error updating user status');
    }
  };

  // License Key Management Functions
  const generateLicenseKeys = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(API_ENDPOINTS.SUPERADMIN.LICENSE_KEYS, 
        licenseForm, 
        { headers: getAuthHeaders() }
      );
      
      setLicenseKeys([...response.data, ...licenseKeys]);
      setLicenseForm({ count: 1, expiresAt: '' });
      alert(`${response.data.length} license key(s) generated successfully!`);
    } catch (error) {
      console.error('Error generating license keys:', error);
      alert('Error generating license keys');
    }
  };

  const deleteLicenseKey = async (keyId) => {
    if (window.confirm('Are you sure you want to delete this license key?')) {
      try {
        await axios.delete(`${API_ENDPOINTS.SUPERADMIN.LICENSE_KEYS}/${keyId}`, 
          { headers: getAuthHeaders() }
        );
        
        setLicenseKeys(licenseKeys.filter(key => key._id !== keyId));
        alert('License key deleted successfully!');
      } catch (error) {
        console.error('Error deleting license key:', error);
        alert(error.response?.data?.error || 'Error deleting license key');
      }
    }
  };

  // Service Search Function
  const searchServices = async (query) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.SUPERADMIN.SERVICES}?q=${query}`, 
        { headers: getAuthHeaders() }
      );
      setServices(response.data);
    } catch (error) {
      console.error('Error searching services:', error);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        searchServices(searchTerm);
      } else {
        // Reload all services if search is cleared
        const token = localStorage.getItem('token');
        axios.get(API_ENDPOINTS.SUPERADMIN.SERVICES, 
          { headers: { 'Authorization': `Bearer ${token}` } }
        ).then(response => setServices(response.data));
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Bundle Management Functions
  const handleBundleSubmit = async (e) => {
    e.preventDefault();
    
    if (bundleForm.services.length === 0) {
      alert('Please select at least one service');
      return;
    }

    try {
      if (editingBundle) {
        const response = await axios.put(`${API_ENDPOINTS.SUPERADMIN.BUNDLES}/${editingBundle._id}`, 
          bundleForm, 
          { headers: getAuthHeaders() }
        );
        setBundles(bundles.map(bundle => 
          bundle._id === editingBundle._id ? response.data : bundle
        ));
        alert('Bundle updated successfully!');
      } else {
        const response = await axios.post(API_ENDPOINTS.SUPERADMIN.BUNDLES, 
          bundleForm, 
          { headers: getAuthHeaders() }
        );
        setBundles([response.data, ...bundles]);
        alert('Bundle created successfully!');
      }
      
      resetBundleForm();
    } catch (error) {
      console.error('Error saving bundle:', error);
      alert(error.response?.data?.error || 'Error saving bundle');
    }
  };

  const handleEditBundle = (bundle) => {
    setEditingBundle(bundle);
    setBundleForm({
      bundleName: bundle.bundleName,
      description: bundle.description,
      services: bundle.services.map(s => s._id),
      location: bundle.location
    });
    setShowBundleForm(true);
  };

  const handleDeleteBundle = async (bundleId) => {
    if (window.confirm('Are you sure you want to delete this bundle?')) {
      try {
        await axios.delete(`${API_ENDPOINTS.SUPERADMIN.BUNDLES}/${bundleId}`, 
          { headers: getAuthHeaders() }
        );
        setBundles(bundles.filter(bundle => bundle._id !== bundleId));
        alert('Bundle deleted successfully!');
      } catch (error) {
        console.error('Error deleting bundle:', error);
        alert('Error deleting bundle');
      }
    }
  };

  const resetBundleForm = () => {
    setBundleForm({
      bundleName: '',
      description: '',
      services: [],
      location: {
        province: '',
        district: '',
        municipality: ''
      }
    });
    setEditingBundle(null);
    setShowBundleForm(false);
  };

  const toggleServiceSelection = (serviceId) => {
    setBundleForm(prev => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter(id => id !== serviceId)
        : [...prev.services, serviceId]
    }));
  };

  // Service Management Functions
  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const formData = new FormData();
      formData.append('serviceName', serviceForm.serviceName);
      formData.append('requiredDocuments', JSON.stringify(serviceForm.requiredDocuments.filter(doc => doc.trim())));
      formData.append('procedure', JSON.stringify(serviceForm.procedure.filter(step => step.trim())));
      formData.append('estimatedTime', serviceForm.estimatedTime);
      formData.append('charge', serviceForm.charge);
      formData.append('tokenSystemEnabled', serviceForm.tokenSystemEnabled);
      formData.append('dailyTokenLimit', serviceForm.dailyTokenLimit);
      
      if (serviceForm.sampleForm) {
        formData.append('sampleForm', serviceForm.sampleForm);
      }

      if (editingService) {
        const response = await axios.put(`${API_ENDPOINTS.SUPERADMIN.SERVICES}/${editingService._id}`, 
          formData, 
          { 
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        setServices(services.map(service => 
          service._id === editingService._id ? response.data : service
        ));
        alert('Service updated successfully!');
      } else {
        const response = await axios.post(API_ENDPOINTS.SUPERADMIN.SERVICES, 
          formData, 
          { 
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        setServices([response.data, ...services]);
        alert('Service created successfully!');
      }
      
      resetServiceForm();
    } catch (error) {
      console.error('Error saving service:', error);
      alert(error.response?.data?.error || 'Error saving service');
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await axios.delete(`${API_ENDPOINTS.SUPERADMIN.SERVICES}/${serviceId}`, 
          { headers: getAuthHeaders() }
        );
        setServices(services.filter(service => service._id !== serviceId));
        alert('Service deleted successfully!');
      } catch (error) {
        console.error('Error deleting service:', error);
        alert('Error deleting service');
      }
    }
  };

  const resetServiceForm = () => {
    setServiceForm({
      serviceName: '',
      requiredDocuments: [''],
      procedure: [''],
      estimatedTime: '',
      charge: '',
      sampleForm: null,
      tokenSystemEnabled: false,
      dailyTokenLimit: 50
    });
    setEditingService(null);
    setShowServiceForm(false);
  };

  // Assistance Request Management Functions
  const updateAssistanceRequestStatus = async (requestId, status, notes = '') => {
    try {
      const response = await axios.put(`/api/superadmin/assistance-requests/${requestId}`, 
        { status, notes }, 
        { headers: getAuthHeaders() }
      );
      
      setAssistanceRequests(assistanceRequests.map(request => 
        request._id === requestId ? response.data : request
      ));
      
      alert('Request status updated successfully!');
    } catch (error) {
      console.error('Error updating request status:', error);
      alert('Error updating request status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          <p className="mt-4 text-gray-600">Loading superadmin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <Link to="/" className="flex items-center space-x-3">
              <img 
                src="/kchaincha-nav.png" 
                alt="Kchaincha Logo" 
                className="w-32 sm:w-40"
              />
              <div className="hidden sm:block">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">SuperAdmin Panel</h1>
                <p className="text-sm text-gray-600">System Management</p>
              </div>
            </Link>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Welcome, {user?.username}</p>
                <p className="text-xs text-purple-600 font-medium">SuperAdmin</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-gray-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-1 sm:space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex flex-wrap gap-2 sm:space-x-8 sm:gap-0">
            {[
              { id: 'users', name: 'User Management', icon: '👥', shortName: 'Users' },
              { id: 'licenses', name: 'License Keys', icon: '🔑', shortName: 'Licenses' },
              { id: 'bundles', name: 'Service Bundles', icon: '📦', shortName: 'Bundles' },
              { id: 'services', name: 'Services', icon: '🔧', shortName: 'Services' },
              { id: 'assistance', name: 'Assistance Requests', icon: '🤝', shortName: 'Assistance' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-1 sm:space-x-2 ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.name}</span>
                <span className="sm:hidden">{tab.shortName}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {/* User Management Tab */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Registered Users ({users.length})
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Organization
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Username
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {user.organizationName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.username}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {user.location.municipality}, {user.location.district}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'superadmin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {user.role !== 'superadmin' && (
                            <button
                              onClick={() => toggleUserStatus(user._id, user.isActive)}
                              className={`${
                                user.isActive 
                                  ? 'text-red-600 hover:text-red-900' 
                                  : 'text-green-600 hover:text-green-900'
                              }`}
                            >
                              {user.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* License Keys Tab */}
          {activeTab === 'licenses' && (
            <div className="space-y-6">
              {/* License Key Generation Form */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate License Keys</h3>
                <form onSubmit={generateLicenseKeys} className="flex flex-col sm:flex-row sm:items-end space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="flex-1 sm:flex-none">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Keys
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={licenseForm.count}
                      onChange={(e) => setLicenseForm(prev => ({ ...prev, count: parseInt(e.target.value) }))}
                      className="w-full sm:w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div className="flex-1 sm:flex-none">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expires At (Optional)
                    </label>
                    <input
                      type="date"
                      value={licenseForm.expiresAt}
                      onChange={(e) => setLicenseForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full sm:w-auto bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    Generate
                  </button>
                </form>
              </div>

              {/* License Keys List */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    License Keys ({licenseKeys.length})
                  </h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          License Key
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Used By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Expires
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {licenseKeys.map((key) => (
                        <tr key={key._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-mono text-gray-900">{key.key}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              key.isUsed 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {key.isUsed ? 'Used' : 'Available'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {key.usedBy ? key.usedBy.organizationName : '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {key.expiresAt ? new Date(key.expiresAt).toLocaleDateString() : 'Never'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {!key.isUsed && (
                              <button
                                onClick={() => deleteLicenseKey(key._id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Service Bundles Tab */}
          {activeTab === 'bundles' && (
            <div className="space-y-6">
              {/* Bundle Creation Button */}
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Service Bundles</h2>
                <button
                  onClick={() => setShowBundleForm(!showBundleForm)}
                  className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>{showBundleForm ? 'Cancel' : 'Create Bundle'}</span>
                </button>
              </div>

              {/* Bundle Creation Form */}
              {showBundleForm && (
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">
                    {editingBundle ? 'Edit Bundle' : 'Create New Bundle'}
                  </h3>
                  
                  <form onSubmit={handleBundleSubmit} className="space-y-6">
                    {/* Bundle Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bundle Name *
                        </label>
                        <input
                          type="text"
                          value={bundleForm.bundleName}
                          onChange={(e) => setBundleForm(prev => ({ ...prev, bundleName: e.target.value }))}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="e.g., Complete Vehicle Registration Package"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <input
                          type="text"
                          value={bundleForm.description}
                          onChange={(e) => setBundleForm(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Brief description of the bundle"
                        />
                      </div>
                    </div>

                    {/* Location Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Province *
                        </label>
                        <input
                          type="text"
                          value={bundleForm.location.province}
                          onChange={(e) => setBundleForm(prev => ({ 
                            ...prev, 
                            location: { ...prev.location, province: e.target.value }
                          }))}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="e.g., Bagmati"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          District *
                        </label>
                        <input
                          type="text"
                          value={bundleForm.location.district}
                          onChange={(e) => setBundleForm(prev => ({ 
                            ...prev, 
                            location: { ...prev.location, district: e.target.value }
                          }))}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="e.g., Kathmandu"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Municipality *
                        </label>
                        <input
                          type="text"
                          value={bundleForm.location.municipality}
                          onChange={(e) => setBundleForm(prev => ({ 
                            ...prev, 
                            location: { ...prev.location, municipality: e.target.value }
                          }))}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="e.g., Kathmandu Metropolitan City"
                        />
                      </div>
                    </div>

                    {/* Service Search */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Search Services
                      </label>
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Search services to add to bundle..."
                      />
                    </div>

                    {/* Service Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Services ({bundleForm.services.length} selected)
                      </label>
                      <div className="max-h-96 overflow-y-auto border border-gray-300 rounded-lg">
                        {services.map((service) => (
                          <div key={service._id} className="p-4 border-b border-gray-200 hover:bg-gray-50">
                            <div className="flex items-start space-x-3">
                              <input
                                type="checkbox"
                                checked={bundleForm.services.includes(service._id)}
                                onChange={() => toggleServiceSelection(service._id)}
                                className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                              />
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-gray-900">{service.serviceName}</h4>
                                <p className="text-sm text-gray-600">
                                  {service.userId?.organizationName} • {service.estimatedTime} • {service.charge}
                                </p>
                                {service.userId?.location && (
                                  <p className="text-xs text-gray-500">
                                    {service.userId.location.municipality}, {service.userId.location.district}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                      <button
                        type="submit"
                        className="w-full sm:w-auto bg-purple-500 text-white px-8 py-3 rounded-lg hover:bg-purple-600 transition-colors"
                      >
                        {editingBundle ? 'Update Bundle' : 'Create Bundle'}
                      </button>
                      <button
                        type="button"
                        onClick={resetBundleForm}
                        className="w-full sm:w-auto bg-gray-500 text-white px-8 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Bundles List */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Created Bundles ({bundles.length})
                  </h3>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {bundles.map((bundle) => (
                    <div key={bundle._id} className="p-6 hover:bg-gray-50">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900">{bundle.bundleName}</h4>
                          {bundle.description && (
                            <p className="text-sm text-gray-600 mt-1">{bundle.description}</p>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-500">
                            <span>📍 {bundle.location.municipality}, {bundle.location.district}</span>
                            <span>📦 {bundle.services.length} services</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              bundle.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {bundle.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-700">Services included:</p>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {bundle.services.map((service) => (
                                <span key={service._id} className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                  {service.serviceName}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-4 sm:mt-0 sm:ml-4">
                          <button
                            onClick={() => handleEditBundle(bundle)}
                            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium px-3 py-1 border border-indigo-300 rounded text-center"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteBundle(bundle._id)}
                            className="text-red-600 hover:text-red-900 text-sm font-medium px-3 py-1 border border-red-300 rounded text-center"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-gray-200 space-y-2 sm:space-y-0">
                        <div className="text-sm text-gray-500">
                          Created by {bundle.createdBy?.organizationName || 'SuperAdmin'}
                        </div>
                        <button className="w-full sm:w-auto bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium">
                          View Bundle
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Services Tab */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              {/* Service Creation Button */}
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Services</h2>
                <button
                  onClick={() => setShowServiceForm(!showServiceForm)}
                  className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>{showServiceForm ? 'Cancel' : 'Create Service'}</span>
                </button>
              </div>

              {/* Service Creation Form */}
              {showServiceForm && (
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">
                    {editingService ? 'Edit Service' : 'Create New Service'}
                  </h3>
                  
                  <form onSubmit={handleServiceSubmit} className="space-y-6">
                    {/* Service Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Service Name *
                        </label>
                        <input
                          type="text"
                          value={serviceForm.serviceName}
                          onChange={(e) => setServiceForm(prev => ({ ...prev, serviceName: e.target.value }))}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="e.g., Vehicle Registration"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Estimated Time *
                        </label>
                        <input
                          type="text"
                          value={serviceForm.estimatedTime}
                          onChange={(e) => setServiceForm(prev => ({ ...prev, estimatedTime: e.target.value }))}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="e.g., 30 minutes"
                        />
                      </div>
                    </div>

                    {/* Required Documents */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Required Documents *
                      </label>
                      {serviceForm.requiredDocuments.map((doc, index) => (
                        <div key={index} className="flex items-center space-x-2 mb-2">
                          <input
                            type="text"
                            value={doc}
                            onChange={(e) => {
                              const newDocs = [...serviceForm.requiredDocuments];
                              newDocs[index] = e.target.value;
                              setServiceForm(prev => ({ ...prev, requiredDocuments: newDocs }));
                            }}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            placeholder="e.g., Citizenship Certificate"
                          />
                          {serviceForm.requiredDocuments.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newDocs = serviceForm.requiredDocuments.filter((_, i) => i !== index);
                                setServiceForm(prev => ({ ...prev, requiredDocuments: newDocs }));
                              }}
                              className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setServiceForm(prev => ({ 
                          ...prev, 
                          requiredDocuments: [...prev.requiredDocuments, ''] 
                        }))}
                        className="mt-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                      >
                        Add Document
                      </button>
                    </div>

                    {/* Procedure Steps */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Procedure Steps *
                      </label>
                      {serviceForm.procedure.map((step, index) => (
                        <div key={index} className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium text-gray-500 w-8">{index + 1}.</span>
                          <input
                            type="text"
                            value={step}
                            onChange={(e) => {
                              const newSteps = [...serviceForm.procedure];
                              newSteps[index] = e.target.value;
                              setServiceForm(prev => ({ ...prev, procedure: newSteps }));
                            }}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            placeholder="e.g., Fill out the application form"
                          />
                          {serviceForm.procedure.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newSteps = serviceForm.procedure.filter((_, i) => i !== index);
                                setServiceForm(prev => ({ ...prev, procedure: newSteps }));
                              }}
                              className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setServiceForm(prev => ({ 
                          ...prev, 
                          procedure: [...prev.procedure, ''] 
                        }))}
                        className="mt-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                      >
                        Add Step
                      </button>
                    </div>

                    {/* Service Charge */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Service Charge *
                      </label>
                      <input
                        type="text"
                        value={serviceForm.charge}
                        onChange={(e) => setServiceForm(prev => ({ ...prev, charge: e.target.value }))}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="e.g., Rs. 500"
                      />
                    </div>

                    {/* Sample Form Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sample Form (PDF)
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          setServiceForm(prev => ({ ...prev, sampleForm: file }));
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                      {editingService && editingService.sampleForm && (
                        <p className="mt-2 text-sm text-gray-600">
                          Current file: {editingService.sampleForm.split('/').pop()}
                        </p>
                      )}
                    </div>

                    {/* Token System Settings */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Token System Settings</h4>
                      
                      <div className="flex items-center space-x-3 mb-4">
                        <input
                          type="checkbox"
                          id="tokenSystemEnabled"
                          checked={serviceForm.tokenSystemEnabled}
                          onChange={(e) => setServiceForm(prev => ({ ...prev, tokenSystemEnabled: e.target.checked }))}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <label htmlFor="tokenSystemEnabled" className="text-sm font-medium text-gray-700">
                          Enable Daily Token System
                        </label>
                      </div>

                      {serviceForm.tokenSystemEnabled && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Daily Token Limit *
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={serviceForm.dailyTokenLimit}
                            onChange={(e) => setServiceForm(prev => ({ ...prev, dailyTokenLimit: parseInt(e.target.value) }))}
                            required={serviceForm.tokenSystemEnabled}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            placeholder="e.g., 50"
                          />
                        </div>
                      )}
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                      <button
                        type="submit"
                        className="w-full sm:w-auto bg-purple-500 text-white px-8 py-3 rounded-lg hover:bg-purple-600 transition-colors"
                      >
                        {editingService ? 'Update Service' : 'Create Service'}
                      </button>
                      <button
                        type="button"
                        onClick={resetServiceForm}
                        className="w-full sm:w-auto bg-gray-500 text-white px-8 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Services List */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">
                      All Services ({services.length})
                    </h3>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search services..."
                        value={serviceSearchTerm}
                        onChange={(e) => setServiceSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {services
                    .filter(service => 
                      service.serviceName.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
                      (service.userId?.organizationName || '').toLowerCase().includes(serviceSearchTerm.toLowerCase())
                    )
                    .map((service) => (
                    <div key={service._id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900">{service.serviceName}</h4>
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                            <span>⏱️ {service.estimatedTime}</span>
                            <span>💰 {service.charge}</span>
                            <span>🏢 {service.userId?.organizationName || 'SuperAdmin'}</span>
                            {service.userId?.location && (
                              <span>📍 {service.userId.location.municipality}, {service.userId.location.district}</span>
                            )}
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              service.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {service.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-700">Required Documents:</p>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {service.requiredDocuments?.map((doc, index) => (
                                <span key={index} className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                  {doc}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => {
                              setShowServiceForm(true);
                              setEditingService(service);
                              setServiceForm({
                                serviceName: service.serviceName,
                                requiredDocuments: service.requiredDocuments || [''],
                                procedure: service.procedure || [''],
                                estimatedTime: service.estimatedTime,
                                charge: service.charge,
                                sampleForm: null,
                                tokenSystemEnabled: service.tokenSystemEnabled || false,
                                dailyTokenLimit: service.dailyTokenLimit || 50
                              });
                            }}
                            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteService(service._id)}
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                          >
                            Delete
                          </button>
                          <Link
                            to={`/service/${service._id}`}
                            className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Assistance Requests Tab */}
          {activeTab === 'assistance' && (
            <div className="space-y-6">
              {/* Assistance Requests List */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Assistance Requests ({assistanceRequests.length})
                  </h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Service/Bundle
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {assistanceRequests.map((request) => (
                        <tr key={request._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{request.userName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{request.userContact}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {request.requestType === 'service' 
                                ? request.serviceId?.serviceName || 'Service not found'
                                : request.bundleId?.bundleName || 'Bundle not found'
                              }
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              request.requestType === 'service' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {request.requestType}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              request.status === 'resolved' 
                                ? 'bg-green-100 text-green-800' 
                                : request.status === 'contacted'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {request.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {request.status === 'pending' && (
                                <button
                                  onClick={() => updateAssistanceRequestStatus(request._id, 'contacted')}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Mark Contacted
                                </button>
                              )}
                              {request.status === 'contacted' && (
                                <button
                                  onClick={() => updateAssistanceRequestStatus(request._id, 'resolved')}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Mark Resolved
                                </button>
                              )}
                              {request.status === 'resolved' && (
                                <span className="text-gray-500">Completed</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdmin; 