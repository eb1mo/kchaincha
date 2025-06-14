import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

const Register = () => {
  const [formData, setFormData] = useState({
    organizationName: '',
    username: '',
    password: '',
    confirmPassword: '',
    province: '',
    district: '',
    municipality: '',
    licenseKey: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (!formData.organizationName || !formData.username || !formData.province || !formData.district || !formData.municipality || !formData.licenseKey) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(API_ENDPOINTS.REGISTER, {
        organizationName: formData.organizationName,
        username: formData.username,
        password: formData.password,
        province: formData.province,
        district: formData.district,
        municipality: formData.municipality,
        licenseKey: formData.licenseKey
      });
      
      // Store token and user info in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redirect to admin panel (all registered users are regular admins)
      navigate('/admin');
    } catch (error) {
      setError(error.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <img 
              src="/kchaincha-nav.png" 
              alt="Kchaincha Logo" 
              className="w-40"
            />
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Admin Registration</h2>
          <p className="text-gray-600">Create an account to manage your services</p>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization Name *
              </label>
              <input
                type="text"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                placeholder="e.g., Department of Transport Management"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username *
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                placeholder="Choose a unique username"
              />
            </div>

            {/* Location Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Province *
                </label>
                <input
                  type="text"
                  name="province"
                  value={formData.province}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  placeholder="e.g., Bagmati"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  District *
                </label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  placeholder="e.g., Kathmandu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Municipality *
                </label>
                <input
                  type="text"
                  name="municipality"
                  value={formData.municipality}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  placeholder="e.g., Kathmandu Metropolitan City"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                License Key *
              </label>
              <input
                type="text"
                name="licenseKey"
                value={formData.licenseKey}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                placeholder="Enter your license key"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                placeholder="Re-enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-red-600 hover:text-red-700 font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link 
            to="/" 
            className="text-gray-600 hover:text-gray-700 font-medium flex items-center justify-center space-x-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register; 