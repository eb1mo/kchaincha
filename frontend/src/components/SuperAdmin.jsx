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
      
      const [usersRes, licenseKeysRes, servicesRes, bundlesRes] = await Promise.all([
        axios.get(API_ENDPOINTS.SUPERADMIN.USERS, { headers }),
        axios.get(API_ENDPOINTS.SUPERADMIN.LICENSE_KEYS, { headers }),
        axios.get(API_ENDPOINTS.SUPERADMIN.SERVICES, { headers }),
        axios.get(API_ENDPOINTS.SUPERADMIN.BUNDLES, { headers })
      ]);
      
      setUsers(usersRes.data);
      setLicenseKeys(licenseKeysRes.data);
      setServices(servicesRes.data);
      setBundles(bundlesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
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
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <img 
                src="/kchaincha-nav.png" 
                alt="Kchaincha Logo" 
                className="w-40"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">SuperAdmin Panel</h1>
                <p className="text-sm text-gray-600">System Management</p>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Welcome, {user?.username}</p>
                <p className="text-xs text-purple-600 font-medium">SuperAdmin</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'users', name: 'User Management', icon: '👥' },
              { id: 'licenses', name: 'License Keys', icon: '🔑' },
              { id: 'bundles', name: 'Service Bundles', icon: '📦' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
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
                <form onSubmit={generateLicenseKeys} className="flex items-end space-x-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Keys
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={licenseForm.count}
                      onChange={(e) => setLicenseForm(prev => ({ ...prev, count: parseInt(e.target.value) }))}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expires At (Optional)
                    </label>
                    <input
                      type="date"
                      value={licenseForm.expiresAt}
                      onChange={(e) => setLicenseForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition-colors"
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
                    <div className="flex space-x-4">
                      <button
                        type="submit"
                        className="bg-purple-500 text-white px-8 py-3 rounded-lg hover:bg-purple-600 transition-colors"
                      >
                        {editingBundle ? 'Update Bundle' : 'Create Bundle'}
                      </button>
                      <button
                        type="button"
                        onClick={resetBundleForm}
                        className="bg-gray-500 text-white px-8 py-3 rounded-lg hover:bg-gray-600 transition-colors"
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
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900">{bundle.bundleName}</h4>
                          {bundle.description && (
                            <p className="text-sm text-gray-600 mt-1">{bundle.description}</p>
                          )}
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
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
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => handleEditBundle(bundle)}
                            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteBundle(bundle._id)}
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-500">
                          Created by {bundle.createdBy?.organizationName || 'SuperAdmin'}
                        </div>
                        <button className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium">
                          View Bundle
                        </button>
                      </div>
                    </div>
                  ))}
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