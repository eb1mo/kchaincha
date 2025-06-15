import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS, getFileUrl } from '../config/api';

const Admin = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    serviceName: '',
    documents: [''],
    procedure: [''],
    estimatedTime: '',
    charge: '',
    tokensEnabled: false,
    dailyTokenLimit: 50,
    sampleFormUrl: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadUserAndServices();
  }, []);

  const loadUserAndServices = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    try {
      const parsedUser = JSON.parse(userData);
      console.log('Admin - Loading user:', parsedUser);
      setUser(parsedUser);
      fetchServices(token);
    } catch (error) {
      console.error('Admin - Error parsing user data:', error);
      handleLogout();
    }
  };

  const fetchServices = async (token) => {
    try {
      const response = await axios.get(API_ENDPOINTS.ADMIN_SERVICES, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDocumentChange = (index, value) => {
    const newDocuments = [...formData.documents];
    newDocuments[index] = value;
    setFormData(prev => ({
      ...prev,
      documents: newDocuments
    }));
  };

  const addDocumentField = () => {
    setFormData(prev => ({
      ...prev,
      documents: [...prev.documents, '']
    }));
  };

  const removeDocumentField = (index) => {
    if (formData.documents.length > 1) {
      const newDocuments = formData.documents.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        documents: newDocuments
      }));
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const uploadFile = async () => {
    if (!selectedFile) return '';

    setUploading(true);
    const fileFormData = new FormData();
    fileFormData.append('sampleForm', selectedFile);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(API_ENDPOINTS.UPLOAD, fileFormData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.fileUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        handleLogout();
      }
      alert('Error uploading file');
      return '';
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Filter out empty documents
    const filteredDocuments = formData.documents.filter(doc => doc.trim() !== '');
    
    if (filteredDocuments.length === 0) {
      alert('Please add at least one document');
      return;
    }

    // Filter out empty procedure steps
    const filteredProcedure = formData.procedure.filter(step => step.trim() !== '');
    
    if (filteredProcedure.length === 0) {
      alert('Please add at least one procedure step');
      return;
    }

    let sampleFormUrl = formData.sampleFormUrl;
    
    // Upload file if selected
    if (selectedFile) {
      sampleFormUrl = await uploadFile();
      if (!sampleFormUrl && selectedFile) {
        return; // Upload failed
      }
    }

    // Convert procedure steps to formatted string
    const procedureString = filteredProcedure
      .map((step, index) => `${index + 1}. ${step}`)
      .join('\n');

    const serviceData = {
      ...formData,
      documents: filteredDocuments,
      procedure: procedureString,
      sampleFormUrl
    };

    try {
      if (editingService) {
        await axios.put(`${API_ENDPOINTS.ADMIN_SERVICES}/${editingService._id}`, serviceData, {
          headers: getAuthHeaders()
        });
        alert('Service updated successfully!');
      } else {
        await axios.post(API_ENDPOINTS.ADMIN_SERVICES, serviceData, {
          headers: getAuthHeaders()
        });
        alert('Service added successfully!');
      }
      
      resetForm();
      const token = localStorage.getItem('token');
      fetchServices(token);
    } catch (error) {
      console.error('Error saving service:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        handleLogout();
      }
      alert('Error saving service');
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    
    // Convert procedure string back to array
    let procedureArray = [''];
    if (service.procedure && service.procedure.trim()) {
      procedureArray = service.procedure
        .split('\n')
        .map(step => {
          // Remove the step number (e.g., "1. " from "1. Step text")
          const match = step.match(/^\d+\.\s*(.*)$/);
          return match ? match[1] : step;
        })
        .filter(step => step.trim() !== '');
      
      // Ensure at least one empty step if no valid steps found
      if (procedureArray.length === 0) {
        procedureArray = [''];
      }
    }
    
    setFormData({
      serviceName: service.serviceName,
      documents: service.documents,
      procedure: procedureArray,
      estimatedTime: service.estimatedTime,
      charge: service.charge,
      sampleFormUrl: service.sampleFormUrl,
      tokensEnabled: service.tokensEnabled || false,
      dailyTokenLimit: service.dailyTokenLimit || 0
    });
    setSelectedFile(null);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await axios.delete(`${API_ENDPOINTS.ADMIN_SERVICES}/${id}`, {
          headers: getAuthHeaders()
        });
        alert('Service deleted successfully!');
        const token = localStorage.getItem('token');
        fetchServices(token);
      } catch (error) {
        console.error('Error deleting service:', error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          handleLogout();
        }
        alert('Error deleting service');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      serviceName: '',
      documents: [''],
      procedure: [''],
      estimatedTime: '',
      charge: '',
      tokensEnabled: false,
      dailyTokenLimit: 50,
      sampleFormUrl: ''
    });
    setEditingService(null);
    setSelectedFile(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-200 border-t-red-500"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <Link to="/" className="flex items-center space-x-3">
              <img 
                src="/kchaincha-nav.png" 
                alt="Kchaincha Logo" 
                className="w-32 sm:w-40 hover:scale-105 transition-transform duration-300"
              />
              <div className="hidden sm:block">
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-sm text-gray-600">Manage Government Services</p>
              </div>
            </Link>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <div className="text-left sm:text-right bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl px-4 py-2 w-full sm:w-auto">
                <p className="text-sm font-semibold text-gray-900">Welcome, {user?.username}</p>
                <p className="text-xs text-gray-600">{user?.organizationName}</p>
              </div>
              <div className="flex space-x-2 w-full sm:w-auto">
                {user?.role === 'superadmin' && (
                  <Link
                    to="/superadmin"
                    className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-sm flex-1 sm:flex-none justify-center"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="hidden sm:inline">SuperAdmin</span>
                    <span className="sm:hidden">Super</span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-2 rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-sm flex-1 sm:flex-none justify-center"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Your Services</h2>
            <p className="text-gray-600 mt-1">Manage services for {user?.organizationName}</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 w-full sm:w-auto justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>{showForm ? 'Cancel' : 'Add New Service'}</span>
          </button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6 sm:p-8 mb-8">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
              {editingService ? 'Edit Service' : 'Add New Service'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Service Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Service Name *
                </label>
                <input
                  type="text"
                  name="serviceName"
                  value={formData.serviceName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                  placeholder="e.g., Driving License Application"
                />
              </div>

              {/* Required Documents */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Required Documents *
                </label>
                {formData.documents.map((document, index) => (
                  <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-3">
                    <input
                      type="text"
                      value={document}
                      onChange={(e) => handleDocumentChange(index, e.target.value)}
                      className="flex-1 w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                      placeholder="e.g., Original Citizenship Certificate"
                    />
                    {formData.documents.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDocumentField(index)}
                        className="text-red-600 hover:text-red-700 p-2 bg-red-50 hover:bg-red-100 rounded-xl transition-colors w-full sm:w-auto justify-center flex items-center"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="ml-2 sm:hidden">Remove</span>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addDocumentField}
                  className="text-red-600 hover:text-red-700 text-sm font-semibold flex items-center space-x-2 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-all duration-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add Another Document</span>
                </button>
              </div>

              {/* Procedure */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Step-by-Step Procedure *
                </label>
                {formData.procedure.map((step, index) => (
                  <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-3">
                    <input
                      type="text"
                      value={step}
                      onChange={(e) => {
                        const newProcedure = [...formData.procedure];
                        newProcedure[index] = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          procedure: newProcedure
                        }));
                      }}
                      className="flex-1 w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                      placeholder="e.g., Step 1: Collect documents"
                    />
                    {formData.procedure.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newProcedure = formData.procedure.filter((_, i) => i !== index);
                          setFormData(prev => ({
                            ...prev,
                            procedure: newProcedure
                          }));
                        }}
                        className="text-red-600 hover:text-red-700 p-2 bg-red-50 hover:bg-red-100 rounded-xl transition-colors w-full sm:w-auto justify-center flex items-center"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="ml-2 sm:hidden">Remove</span>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    procedure: [...prev.procedure, '']
                  }))}
                  className="text-red-600 hover:text-red-700 text-sm font-semibold flex items-center space-x-2 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-all duration-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add Another Step</span>
                </button>
              </div>

              {/* Time and Charge */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Estimated Time *
                  </label>
                  <input
                    type="text"
                    name="estimatedTime"
                    value={formData.estimatedTime}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                    placeholder="e.g., 7-15 working days"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Service Charge *
                  </label>
                  <input
                    type="text"
                    name="charge"
                    value={formData.charge}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                    placeholder="e.g., Rs. 500"
                  />
                </div>
              </div>

              {/* Sample Form Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Sample Form (PDF)
                </label>
                <input
                  type="file"
                  name="sampleForm"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all duration-300 bg-white/80 backdrop-blur-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                />
                {formData.sampleFormUrl && (
                  <p className="mt-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                    Current file: {formData.sampleFormUrl.split('/').pop()}
                  </p>
                )}
              </div>

              {/* Token System */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  <span>Token System Settings</span>
                </h4>
                <div className="space-y-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="tokensEnabled"
                      checked={formData.tokensEnabled}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-purple-600 bg-white border-2 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Enable Daily Token System
                    </span>
                  </label>
                  {formData.tokensEnabled && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Daily Token Limit *
                      </label>
                      <input
                        type="number"
                        name="dailyTokenLimit"
                        value={formData.dailyTokenLimit}
                        onChange={handleInputChange}
                        min="1"
                        max="1000"
                        required={formData.tokensEnabled}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                        placeholder="e.g., 50"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingService(null);
                    setFormData({
                      serviceName: '',
                      documents: [''],
                      procedure: [''],
                      estimatedTime: '',
                      charge: '',
                      tokensEnabled: false,
                      dailyTokenLimit: 50,
                      sampleFormUrl: ''
                    });
                  }}
                  className="w-full sm:w-auto px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5 font-semibold"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    editingService ? 'Update Service' : 'Add Service'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Services List */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Your Services ({services.length})</h3>
          </div>
          
          {services.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No services yet</h3>
              <p className="mt-2 text-gray-500">Get started by adding your first service.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Service Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Time & Charge
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Tokens
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 divide-y divide-gray-200">
                  {services.map((service) => (
                    <tr key={service._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{service.serviceName}</div>
                        <div className="text-sm text-gray-500">{service.organizationName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{service.estimatedTime}</div>
                        <div className="text-sm text-gray-500">{service.charge}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {service.tokensEnabled ? (
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Enabled
                            </span>
                            <span className="text-sm text-gray-500">
                              Limit: {service.dailyTokenLimit}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Disabled
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                          <button
                            onClick={() => handleEdit(service)}
                            className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-lg transition-colors text-xs font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(service._id)}
                            className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg transition-colors text-xs font-semibold"
                          >
                            Delete
                          </button>
                          <Link
                            to={`/service/${service._id}`}
                            className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-lg transition-colors text-xs font-semibold text-center"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin; 