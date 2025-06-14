import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { getServiceEndpoint, getFileUrl } from '../config/api';

const ServiceDetail = () => {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tokenStatus, setTokenStatus] = useState(null);
  const [showTokenForm, setShowTokenForm] = useState(false);
  const [tokenForm, setTokenForm] = useState({
    userName: '',
    userContact: ''
  });
  const [tokenLoading, setTokenLoading] = useState(false);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const serviceEndpoints = getServiceEndpoint(id);
        const response = await axios.get(serviceEndpoints.DETAIL);
        setService(response.data);
        
        // Fetch token status
        const tokenResponse = await axios.get(serviceEndpoints.TOKEN_STATUS);
        setTokenStatus(tokenResponse.data);
      } catch (error) {
        console.error('Error fetching service:', error);
        setError('Service not found');
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [id]);

  const handleTokenRequest = async (e) => {
    e.preventDefault();
    setTokenLoading(true);

    try {
      const serviceEndpoints = getServiceEndpoint(id);
      const response = await axios.post(serviceEndpoints.TOKEN_REQUEST, tokenForm, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `service-token-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      // Reset form and update token status
      setTokenForm({ userName: '', userContact: '' });
      setShowTokenForm(false);
      
      // Refresh token status
      const tokenResponse = await axios.get(serviceEndpoints.TOKEN_STATUS);
      setTokenStatus(tokenResponse.data);

    } catch (error) {
      alert(error.response?.data?.error || 'Error generating token');
    } finally {
      setTokenLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          <p className="mt-4 text-gray-600">Loading service details...</p>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Service Not Found</h2>
          <p className="text-gray-600 mb-6">The requested service could not be found.</p>
          <Link 
            to="/" 
            className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
          >
            Back to Home
          </Link>
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
            </Link>
            <Link 
              to="/" 
              className="text-red-600 hover:text-red-700 font-medium flex items-center"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Search
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Service Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-start space-x-6">
            <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-red-600 text-3xl">📋</span>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{service.serviceName}</h1>
              {service.userId?.organizationName && (
                <div className="mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {service.userId.organizationName}
                  </span>
                  {service.userId?.location && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {service.userId.location.municipality}, {service.userId.location.district}, {service.userId.location.province}
                      </span>
                    </div>
                  )}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estimated Time</p>
                    <p className="font-semibold text-gray-900">{service.estimatedTime}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Service Charge</p>
                    <p className="font-semibold text-gray-900">{service.charge}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Token System */}
        {tokenStatus && tokenStatus.tokensEnabled && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a1 1 0 001 1h1a1 1 0 001-1V7a2 2 0 00-2-2H5zM5 14a2 2 0 00-2 2v3a1 1 0 001 1h1a1 1 0 001-1v-3a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Service Token System</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-blue-800">Available Today</span>
                </div>
                <p className="text-2xl font-bold text-blue-900 mt-1">{tokenStatus.tokensAvailable}</p>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-orange-800">Issued Today</span>
                </div>
                <p className="text-2xl font-bold text-orange-900 mt-1">{tokenStatus.tokensIssued}</p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-sm font-medium text-green-800">Daily Limit</span>
                </div>
                <p className="text-2xl font-bold text-green-900 mt-1">{tokenStatus.dailyLimit}</p>
              </div>
            </div>

            {tokenStatus.tokensAvailable > 0 ? (
              <div>
                {!showTokenForm ? (
                  <button
                    onClick={() => setShowTokenForm(true)}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Get Service Token</span>
                  </button>
                ) : (
                  <form onSubmit={handleTokenRequest} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Your Name *
                        </label>
                        <input
                          type="text"
                          value={tokenForm.userName}
                          onChange={(e) => setTokenForm(prev => ({ ...prev, userName: e.target.value }))}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Contact Number *
                        </label>
                        <input
                          type="tel"
                          value={tokenForm.userContact}
                          onChange={(e) => setTokenForm(prev => ({ ...prev, userContact: e.target.value }))}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Enter your phone number"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-4">
                      <button
                        type="submit"
                        disabled={tokenLoading}
                        className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                      >
                        {tokenLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Generating Token...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Download Token PDF</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowTokenForm(false)}
                        className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-700 font-medium">No tokens available today. Please try again tomorrow.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Required Documents */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Required Documents</h2>
          </div>
          <div className="space-y-3">
            {service.documents.map((document, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">{document}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Procedure */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Step-by-Step Procedure</h2>
          </div>
          <div className="prose max-w-none">
            <div className="whitespace-pre-line text-gray-700 leading-relaxed">
              {service.procedure}
            </div>
          </div>
        </div>

        {/* Sample Form Download */}
        {service.sampleFormUrl && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Sample Form</h2>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-red-600 text-lg">📄</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Sample Application Form</p>
                  <p className="text-sm text-gray-600">PDF Document</p>
                </div>
              </div>
              <a
                href={getFileUrl(service.sampleFormUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Download</span>
              </a>
            </div>
          </div>
        )}

        {/* Back to Home Button */}
        <div className="text-center mt-12">
          <Link 
            to="/" 
            className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors inline-flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Home</span>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default ServiceDetail; 