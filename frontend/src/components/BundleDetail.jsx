import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import AssistanceRequestPopup from './AssistanceRequestPopup';

const BundleDetail = () => {
  const { bundleId } = useParams();
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [showAssistancePopup, setShowAssistancePopup] = useState(false);

  useEffect(() => {
    fetchBundleDetails();
  }, [bundleId]);

  const fetchBundleDetails = async () => {
    try {
      // Get all bundles and find the specific one
      const response = await axios.get(API_ENDPOINTS.BUNDLES);
      const bundles = response.data;
      const foundBundle = bundles.find(b => b._id === bundleId);
      
      if (foundBundle) {
        setBundle(foundBundle);
      }
    } catch (error) {
      console.error('Error fetching bundle details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <p className="mt-4 text-gray-600">Loading bundle details...</p>
        </div>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-gray-400 text-4xl">📦</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Bundle Not Found</h3>
          <p className="text-gray-600 mb-4">The requested service bundle could not be found.</p>
          <Link 
            to="/" 
            className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src="/kchaincha-nav.png" 
                alt="Kchaincha Logo" 
                className="w-40"
              />
            </Link>
            
            <Link 
              to="/login" 
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              Admin Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Home</span>
          </button>
        </div>

        {/* Bundle Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-start space-x-6">
            <div className="w-20 h-20 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-purple-600 text-3xl">📦</span>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {bundle.bundleName}
              </h1>
              {bundle.description && (
                <p className="text-lg text-gray-600 mb-4">{bundle.description}</p>
              )}
              <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>
                    {bundle.location.municipality}, {bundle.location.district}, {bundle.location.province}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>{bundle.services.length} services included</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Created by:</span>
                <span className="font-medium">
                  {bundle.createdBy?.organizationName || 'SuperAdmin'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Services in Bundle */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Services Included in This Bundle
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bundle.services.map((service) => (
              <Link
                key={service._id}
                to={`/service/${service._id}`}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-200 hover:border-purple-300"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 text-xl">📋</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {service.serviceName}
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{service.estimatedTime}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        <span>{service.charge}</span>
                      </div>
                      {service.userId?.organizationName && (
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className="text-xs">{service.userId.organizationName}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center text-purple-600 text-sm font-medium">
                      View Service Details
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Bundle Summary */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Bundle Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {bundle.services.length}
              </div>
              <div className="text-sm text-gray-600">Total Services</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {new Set(bundle.services.map(s => s.userId?.organizationName).filter(Boolean)).size}
              </div>
              <div className="text-sm text-gray-600">Organizations</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {bundle.location.municipality}
              </div>
              <div className="text-sm text-gray-600">Location</div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-8 text-center">
          <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-2">Ready to Get Started?</h3>
            <p className="text-purple-100 mb-6">
              Click on any service above to view detailed requirements and start your application process.
            </p>
            <div className="space-y-4">
              <button
                onClick={() => setShowAssistancePopup(true)}
                className="inline-flex items-center space-x-2 bg-white text-purple-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-all transform hover:scale-105 font-medium shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Book Assistance for This Bundle</span>
              </button>
              
              <div>
                <Link 
                  to="/" 
                  className="inline-flex items-center space-x-2 bg-purple-700 text-white px-6 py-3 rounded-lg hover:bg-purple-800 transition-colors font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Explore More Services</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Assistance Request Popup */}
      <AssistanceRequestPopup
        isOpen={showAssistancePopup}
        onClose={() => setShowAssistancePopup(false)}
        bundleId={bundleId}
        requestType="bundle"
        bundleName={bundle?.bundleName}
      />
    </div>
  );
};

export default BundleDetail; 