import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import logo from "/primary-fav.ico"
import Chatbot from './Chatbot';

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
    const trimmedQuery = query ? query.trim() : '';
    const hasQuery = trimmedQuery.length > 0;
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
        params.append('q', trimmedQuery);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-center">
            {/* Logo Only */}
            <div className="flex-shrink-0">
              <img 
                src="/kchaincha-nav.png" 
                alt="Kchaincha Logo" 
                className="w-32 sm:w-36 md:w-44 hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="lg:w-3/5 text-center lg:text-left mb-12 lg:mb-0 animate-fadeIn">
              <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
                <span style={{color: '#254a7f'}}>Your Guide To</span> <span style={{color: '#e53640'}}>Governmental Services</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 font-medium">
                A centralized checklist for document & procedures for governmental services.
              </p>
            </div>
            <div className="lg:w-2/5 flex justify-center animate-fadeIn">
              <img src={logo} alt="" className="hover:scale-105 transition-transform duration-500"/>
            </div>
          </div>
        </div>

        {/* Search Bar - Prominent Position */}
        <div className="sticky top-20 z-40 mb-8">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-md border border-gray-200/50 p-4 sm:p-6">
            <div className="max-w-3xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for government services (e.g., Driving License, Citizenship, Passport)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 pr-12 sm:px-6 sm:pr-14 py-3 sm:py-4 text-base sm:text-lg border-2 border-gray-300 rounded-2xl focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-100 transition-all duration-300 bg-white/90 backdrop-blur-sm shadow-sm"
                />
                <div className="absolute right-4 sm:right-5 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              {/* Quick search hint for mobile */}
              <p className="text-xs sm:text-sm text-gray-500 mt-2 text-center">
                Start typing to search through all government services
              </p>
            </div>
          </div>
        </div>

        {/* Location Filters */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6 sm:p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Filter by Location</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
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
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                >
                  <option value="">All Provinces</option>
                  {locations.provinces.map(province => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                  District
                </label>
                <select
                  value={selectedLocation.district}
                  onChange={(e) => setSelectedLocation(prev => ({
                    ...prev,
                    district: e.target.value,
                    municipality: '' // Reset municipality when district changes
                  }))}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                >
                  <option value="">All Districts</option>
                  {locations.districts.map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 md:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                  Municipality
                </label>
                <select
                  value={selectedLocation.municipality}
                  onChange={(e) => setSelectedLocation(prev => ({
                    ...prev,
                    municipality: e.target.value
                  }))}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
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
              <div className="mt-4 sm:mt-6 text-center">
                <button
                  onClick={() => setSelectedLocation({ province: '', district: '', municipality: '' })}
                  className="text-red-600 hover:text-red-700 font-semibold text-sm flex items-center space-x-2 mx-auto bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-all duration-300"
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

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-200 border-t-red-500"></div>
            <p className="mt-4 text-gray-600 font-medium">Searching services...</p>
          </div>
        )}

        {/* Search Results */}
        {showResults && !loading && (
          <div className="mt-12">
            <div className="text-center mb-10">
              <h3 className="text-3xl font-bold text-gray-900 mb-3">
                {services.length > 0 ? `Found ${services.length} service(s)` : 'No services found'}
              </h3>
              <p className="text-lg text-gray-600 font-medium mb-4">
                {services.length > 0 ? 'Here are the services matching your search' : 'Try adjusting your search terms or location filters'}
              </p>
              <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-blue-500 mx-auto rounded-full"></div>
            </div>
            
            {services.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {services.map((service) => (
                  <Link
                    key={service._id}
                    to={`/service/${service._id}`}
                    className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-gray-200/50 hover:border-red-200 group hover:-translate-y-2"
                  >
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                        <span className="text-red-600 text-3xl">📋</span>
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 mb-4 line-clamp-2 leading-tight">
                        {service.serviceName}
                      </h4>
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-center text-sm text-gray-700 bg-blue-50 rounded-lg py-2 px-3">
                          <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className="font-semibold">
                            {service.userId?.organizationName || 'Government Office'}
                          </span>
                        </div>
                        {service.userId?.location && (
                          <div className="flex items-center justify-center text-sm text-gray-600 bg-green-50 rounded-lg py-2 px-3">
                            <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="font-medium">
                              {service.userId.location.municipality}, {service.userId.location.district}
                            </span>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center justify-center text-xs text-gray-700 bg-yellow-50 rounded-lg py-2 px-2">
                            <svg className="w-3 h-3 mr-1 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-semibold">{service.estimatedTime}</span>
                          </div>
                          <div className="flex items-center justify-center text-xs text-gray-700 bg-purple-50 rounded-lg py-2 px-2">
                            <svg className="w-3 h-3 mr-1 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2z" />
                            </svg>
                            <span className="font-semibold">{service.charge}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 flex items-center justify-center text-red-600 text-sm font-bold group-hover:text-red-700 bg-red-50 rounded-lg py-3 px-4 group-hover:bg-red-100 transition-colors">
                        View Details
                        <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {services.slice(0, 4).map((service) => (
                <Link
                  key={service._id}
                  to={`/service/${service._id}`}
                  className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-8 border border-gray-100 hover:border-red-200 group hover:-translate-y-1"
                >
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                      <span className="text-red-500 text-3xl">📋</span>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-4 line-clamp-2 leading-tight">
                      {service.serviceName}
                    </h4>
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-center text-sm text-gray-700 bg-blue-50 rounded-lg py-2 px-3">
                        <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="font-semibold">
                          {service.userId?.organizationName || 'Government Office'}
                        </span>
                      </div>
                      {service.userId?.location && (
                        <div className="flex items-center justify-center text-sm text-gray-600 bg-green-50 rounded-lg py-2 px-3">
                          <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="font-medium">
                            {service.userId.location.municipality}, {service.userId.location.district}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-6 flex items-center justify-center text-red-600 text-sm font-bold group-hover:text-red-700 bg-red-50 rounded-lg py-3 px-4 group-hover:bg-red-100 transition-colors">
                      View Details
                      <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Organization Services Section */}
        {!showResults && !orgServicesLoading && organizationServices.length > 0 && (
          <div className="mt-20">
            <div className="text-center mb-10">
              <h3 className="text-3xl font-bold text-gray-900 mb-3">
                Services by Organization
              </h3>
              <p className="text-lg text-gray-600 font-medium mb-4">
                Browse services offered by different government organizations
              </p>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-green-500 mx-auto rounded-full"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {organizationServices.map((org, index) => (
                <div
                  key={index}
                  className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-gray-200/50 hover:border-blue-200 flex flex-col h-full group hover:-translate-y-2"
                >
                  <div className="flex items-start space-x-6 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <span className="text-blue-600 text-3xl">🏢</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-gray-900 mb-2">
                        {org.organizationName}
                      </h4>
                      {org.location && (
                        <p className="text-sm text-gray-600 mb-3 bg-green-50 rounded-lg px-3 py-1 inline-block">
                          📍 {org.location.municipality}, {org.location.district}
                        </p>
                      )}
                      <div className="flex items-center space-x-3 text-sm text-gray-700">
                        <span className="flex items-center bg-blue-50 rounded-lg px-3 py-1">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="font-semibold">{org.totalServices} services</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t border-gray-200/50 mt-auto">
                    <Link 
                      to={`/organization/${encodeURIComponent(org.organizationName)}`}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 text-sm font-bold block text-center shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    >
                      View All Services
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Organization Services Loading State */}
        {!showResults && orgServicesLoading && (
          <div className="mt-20 text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-500"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading organization services...</p>
          </div>
        )}

        {/* Service Bundles Section */}
        {!showResults && !bundlesLoading && bundles.length > 0 && (
          <div className="mt-20">
            <div className="text-center mb-10">
              <h3 className="text-3xl font-bold text-gray-900 mb-3">
                Service Bundles
              </h3>
              <p className="text-lg text-gray-600 font-medium mb-4">
                Complete packages of related government services
              </p>
              <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {bundles.map((bundle) => (
                <div
                  key={bundle._id}
                  className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-gray-200/50 hover:border-purple-200 group hover:-translate-y-2"
                >
                  <div className="flex items-start space-x-6 mb-8">
                    <div className="w-18 h-18 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <span className="text-purple-600 text-3xl">📦</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-2xl font-bold text-gray-900 mb-3">
                        {bundle.bundleName}
                      </h4>
                      {bundle.description && (
                        <p className="text-gray-600 mb-4 font-medium">{bundle.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <span className="flex items-center bg-green-50 rounded-lg px-3 py-1">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="font-semibold">{bundle.location.municipality}, {bundle.location.district}</span>
                        </span>
                        <span className="flex items-center bg-purple-50 rounded-lg px-3 py-1">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          <span className="font-semibold">{bundle.services.length} services</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-8">
                    <h5 className="text-lg font-bold text-gray-800 mb-4">Included Services:</h5>
                    <div className="grid grid-cols-1 gap-3">
                      {bundle.services.slice(0, 4).map((service, index) => (
                        <div key={service._id} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200/50">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 text-lg">📋</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-900">{service.serviceName}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-600 mt-1">
                              <span className="bg-blue-50 rounded px-2 py-1">{service.estimatedTime}</span>
                              <span className="bg-yellow-50 rounded px-2 py-1">{service.charge}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {bundle.services.length > 4 && (
                        <div className="text-center py-3">
                          <span className="text-sm text-gray-600 font-medium bg-gray-100 rounded-lg px-4 py-2">
                            +{bundle.services.length - 4} more services
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200/50">
                    <div className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                      <span className="font-semibold">Created by:</span> {bundle.createdBy?.organizationName || 'SuperAdmin'}
                    </div>
                    <Link 
                      to={`/bundle/${bundle._id}`}
                      className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    >
                      View Bundle
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bundles Loading State */}
        {bundlesLoading && (
          <div className="mt-20 text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-500"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading service bundles...</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Logo and Description */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <img 
                  src="/kchaincha-nav.png" 
                  alt="Kchaincha Logo" 
                  className="w-32 sm:w-36 hover:scale-105 transition-transform duration-300"
                />
              </div>
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                Your guide to governmental services in Nepal. We provide centralized information about documents, procedures, and requirements for various government services.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center hover:scale-110 transition-transform duration-300 cursor-pointer">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl flex items-center justify-center hover:scale-110 transition-transform duration-300 cursor-pointer">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-xl font-bold mb-6 text-white">Quick Links</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#services" className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>All Services</span>
                  </a>
                </li>
                <li>
                  <a href="#bundles" className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>Service Bundles</span>
                  </a>
                </li>
                <li>
                  <a href="#organizations" className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>Organizations</span>
                  </a>
                </li>
                <li>
                  <a href="#help" className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>Help & Support</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Admin Access */}
            <div>
              <h3 className="text-xl font-bold mb-6 text-white">Admin Access</h3>
              <div className="space-y-4">
                {isAuthenticated ? (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl p-4 border border-blue-400/30">
                      <p className="text-sm font-semibold text-blue-200 mb-1">Welcome back!</p>
                      <p className="text-white font-bold">{user?.username}</p>
                      <p className="text-xs text-gray-300">{user?.organizationName}</p>
                    </div>
                    <Link 
                      to="/admin" 
                      className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 w-full text-sm font-bold"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Go to Admin Panel</span>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-gray-300 text-sm leading-relaxed">
                      Are you a government organization? Access your admin panel to manage services and information.
                    </p>
                    <Link 
                      to="/login" 
                      className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 w-full text-center text-sm font-bold block"
                    >
                      Admin Login
                    </Link>
                    <Link 
                      to="/register" 
                      className="border-2 border-gray-400 text-gray-300 hover:text-white hover:border-white px-6 py-3 rounded-xl transition-all duration-300 w-full text-center text-sm font-bold block"
                    >
                      Register Organization
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="border-t border-gray-700 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="text-center md:text-left">
                <p className="text-gray-300 text-sm">
                  © 2024 Kchaincha. All rights reserved.
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  Empowering citizens with government service information
                </p>
              </div>
              <div className="flex items-center space-x-6">
                <a href="#privacy" className="text-gray-400 hover:text-white text-sm transition-colors duration-300">
                  Privacy Policy
                </a>
                <a href="#terms" className="text-gray-400 hover:text-white text-sm transition-colors duration-300">
                  Terms of Service
                </a>
                <a href="#contact" className="text-gray-400 hover:text-white text-sm transition-colors duration-300">
                  Contact Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Chatbot */}
      <Chatbot />
    </div>
  );
};

export default Home; 