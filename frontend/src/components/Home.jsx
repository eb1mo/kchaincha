import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

const Home = () => {
  const [services, setServices] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [organizationServices, setOrganizationServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bundlesLoading, setBundlesLoading] = useState(true);
  const [orgServicesLoading, setOrgServicesLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState({
    province: '',
    district: '',
    municipality: ''
  });
  const [locations, setLocations] = useState({
    provinces: [],
    districts: [],
    municipalities: []
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchServices();
    fetchBundles();
    fetchOrganizationServices();
    checkAuthentication();
    fetchLocations();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.SERVICES);
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBundles = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedLocation.province) params.append('province', selectedLocation.province);
      if (selectedLocation.district) params.append('district', selectedLocation.district);
      if (selectedLocation.municipality) params.append('municipality', selectedLocation.municipality);
      
      const url = params.toString() ? `${API_ENDPOINTS.BUNDLES}?${params.toString()}` : API_ENDPOINTS.BUNDLES;
      const response = await axios.get(url);
      setBundles(response.data);
    } catch (error) {
      console.error('Error fetching bundles:', error);
      setBundles([]);
    } finally {
      setBundlesLoading(false);
    }
  };

  const fetchOrganizationServices = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.ORGANIZATION_SERVICES);
      setOrganizationServices(response.data);
    } catch (error) {
      console.error('Error fetching organization services:', error);
      setOrganizationServices([]);
    } finally {
      setOrgServicesLoading(false);
    }
  };

  const checkAuthentication = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setIsAuthenticated(true);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        setIsAuthenticated(false);
        setUser(null);
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  const searchServices = async (query) => {
    const hasQuery = query && query.trim();
    const hasLocationFilter = selectedLocation.province || selectedLocation.district || selectedLocation.municipality;
    
    if (!hasQuery && !hasLocationFilter) {
      setShowResults(false);
      fetchServices();
      return;
    }

    setLoading(true);
    setShowResults(true);
    
    try {
      const params = new URLSearchParams();
      if (hasQuery) {
        params.append('q', query);
      }
      if (selectedLocation.province) {
        params.append('province', selectedLocation.province);
      }
      if (selectedLocation.district) {
        params.append('district', selectedLocation.district);
      }
      if (selectedLocation.municipality) {
        params.append('municipality', selectedLocation.municipality);
      }
      
      const response = await axios.get(`${API_ENDPOINTS.SERVICES}?${params.toString()}`);
      setServices(response.data);
    } catch (error) {
      console.error('Error searching services:', error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      searchServices(searchTerm);
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  useEffect(() => {
    searchServices(searchTerm);
  }, [selectedLocation]);

  useEffect(() => {
    fetchBundles();
  }, [selectedLocation]);

  const fetchLocations = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.LOCATIONS);
      setLocations(response.data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
              <img 
                src="/kchaincha-nav.png" 
                alt="Kchaincha Logo" 
                className="w-40"
              />
            
            {/* Authentication-based navigation */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">Welcome, {user?.username}</p>
                  <p className="text-xs text-gray-600">{user?.organizationName}</p>
                </div>
                <Link 
                  to="/admin" 
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Admin Panel</span>
                </Link>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Admin Login
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Access all Government Services in one place.
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Easy access to public services
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for government services (e.g., Driving License, Citizenship, Passport)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-full focus:border-red-500 focus:outline-none shadow-lg"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Location Filters */}
          <div className="max-w-4xl mx-auto mt-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Filter by Location</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Province
                  </label>
                  <select
                    value={selectedLocation.province}
                    onChange={(e) => setSelectedLocation(prev => ({
                      ...prev,
                      province: e.target.value,
                      district: '', // Reset district when province changes
                      municipality: '' // Reset municipality when province changes
                    }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">All Provinces</option>
                    {locations.provinces.map(province => (
                      <option key={province} value={province}>{province}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    District
                  </label>
                  <select
                    value={selectedLocation.district}
                    onChange={(e) => setSelectedLocation(prev => ({
                      ...prev,
                      district: e.target.value,
                      municipality: '' // Reset municipality when district changes
                    }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">All Districts</option>
                    {locations.districts.map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Municipality
                  </label>
                  <select
                    value={selectedLocation.municipality}
                    onChange={(e) => setSelectedLocation(prev => ({
                      ...prev,
                      municipality: e.target.value
                    }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">All Municipalities</option>
                    {locations.municipalities.map(municipality => (
                      <option key={municipality} value={municipality}>{municipality}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clear Filters Button */}
              {(selectedLocation.province || selectedLocation.district || selectedLocation.municipality) && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setSelectedLocation({ province: '', district: '', municipality: '' })}
                    className="text-red-600 hover:text-red-700 font-medium text-sm flex items-center space-x-1 mx-auto"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Clear Location Filters</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            <p className="mt-2 text-gray-600">Searching services...</p>
          </div>
        )}

        {/* Search Results */}
        {showResults && !loading && (
          <div className="mt-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">
              {services.length > 0 ? `Found ${services.length} service(s)` : 'No services found'}
            </h3>
            
            {services.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => (
                  <Link
                    key={service._id}
                    to={`/service/${service._id}`}
                    className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-200 hover:border-red-300"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-red-600 text-xl">📋</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          {service.serviceName}
                        </h4>
                        {service.userId?.location && (
                          <p className="text-xs text-gray-500 mb-2">
                            📍 {service.userId.location.municipality}, {service.userId.location.district}
                          </p>
                        )}
                        <div className="space-y-1 text-sm text-gray-600">
                          <p><span className="font-medium">Time:</span> {service.estimatedTime}</p>
                          <p><span className="font-medium">Fee:</span> {service.charge}</p>
                        </div>
                        <div className="mt-3 flex items-center text-red-600 text-sm font-medium">
                          View Details
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Popular Services Section (when no search) */}
        {!showResults && !loading && (
          <div className="mt-12">
            <h3 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
              Popular Government Services
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.slice(0, 6).map((service) => (
                <Link
                  key={service._id}
                  to={`/service/${service._id}`}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-200 hover:border-red-300"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600 text-xl">📋</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        {service.serviceName}
                      </h4>
                      {service.userId?.location && (
                        <p className="text-xs text-gray-500 mb-2">
                          📍 {service.userId.location.municipality}, {service.userId.location.district}
                        </p>
                      )}
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><span className="font-medium">Time:</span> {service.estimatedTime}</p>
                        <p><span className="font-medium">Fee:</span> {service.charge}</p>
                      </div>
                      <div className="mt-3 flex items-center text-red-600 text-sm font-medium">
                        View Details
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            <div className="text-center mt-8">
              <p className="text-gray-600">
                Start typing in the search bar above to find specific government services
              </p>
            </div>
          </div>
        )}

        {/* Organization Services Section */}
        {!showResults && !orgServicesLoading && organizationServices.length > 0 && (
          <div className="mt-16">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                Services by Organization
              </h3>
              <p className="text-gray-600">
                Browse services offered by different government organizations
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {organizationServices.map((org, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-200 hover:border-blue-300"
                >
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 text-2xl">🏢</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-900 mb-1">
                        {org.organizationName}
                      </h4>
                      {org.location && (
                        <p className="text-sm text-gray-500 mb-2">
                          📍 {org.location.municipality}, {org.location.district}
                        </p>
                      )}
                      <div className="flex items-center space-x-3 text-sm text-gray-600">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {org.totalServices} services
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h5 className="text-sm font-semibold text-gray-700 mb-3">Available Services:</h5>
                    <div className="space-y-2">
                      {org.services.slice(0, 3).map((service) => (
                        <Link
                          key={service._id}
                          to={`/service/${service._id}`}
                          className="block p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{service.serviceName}</p>
                              <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                                <span>⏱️ {service.estimatedTime}</span>
                                <span>💰 {service.charge}</span>
                                {service.tokensEnabled && (
                                  <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                    🎫 Tokens
                                  </span>
                                )}
                              </div>
                            </div>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </Link>
                      ))}
                      {org.services.length > 3 && (
                        <div className="text-center py-2">
                          <span className="text-sm text-blue-600 font-medium">
                            +{org.services.length - 3} more services
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <button className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium">
                      View All Services
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Organization Services Loading State */}
        {!showResults && orgServicesLoading && (
          <div className="mt-16 text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">Loading organization services...</p>
          </div>
        )}

        {/* Service Bundles Section */}
        {!bundlesLoading && bundles.length > 0 && (
          <div className="mt-16">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                Service Bundles
              </h3>
              <p className="text-gray-600">
                Complete packages of related government services
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {bundles.map((bundle) => (
                <div
                  key={bundle._id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-8 border border-gray-200 hover:border-purple-300"
                >
                  <div className="flex items-start space-x-4 mb-6">
                    <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-600 text-2xl">📦</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-gray-900 mb-2">
                        {bundle.bundleName}
                      </h4>
                      {bundle.description && (
                        <p className="text-gray-600 mb-3">{bundle.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {bundle.location.municipality}, {bundle.location.district}
                        </span>
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          {bundle.services.length} services
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h5 className="text-sm font-semibold text-gray-700 mb-3">Included Services:</h5>
                    <div className="grid grid-cols-1 gap-2">
                      {bundle.services.slice(0, 4).map((service, index) => (
                        <div key={service._id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 text-sm">📋</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{service.serviceName}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>{service.estimatedTime}</span>
                              <span>{service.charge}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {bundle.services.length > 4 && (
                        <div className="text-center py-2">
                          <span className="text-sm text-gray-500">
                            +{bundle.services.length - 4} more services
                          </span>
                        </div>
                      )}
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
        )}

        {/* Bundles Loading State */}
        {bundlesLoading && (
          <div className="mt-16 text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            <p className="mt-2 text-gray-600">Loading service bundles...</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home; 