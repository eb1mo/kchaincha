import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
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

    if (!formData.username || !formData.password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const endpoint = isSuperAdmin 
        ? API_ENDPOINTS.SUPERADMIN_LOGIN
        : API_ENDPOINTS.LOGIN;
        
      const response = await axios.post(endpoint, {
        username: formData.username,
        password: formData.password
      });
      
      // Store token and user info in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redirect based on user role
      if (response.data.user.role === 'superadmin') {
        navigate('/superadmin');
      } else {
        navigate('/admin');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Login failed. Please try again.');
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {isSuperAdmin ? 'SuperAdmin Login' : 'Admin Login'}
          </h2>
          <p className="text-gray-600">
            {isSuperAdmin ? 'Sign in with system credentials' : 'Sign in to manage your services'}
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* SuperAdmin Toggle */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Login Type</h3>
                <p className="text-xs text-gray-600">
                  {isSuperAdmin ? 'SuperAdmin system login' : 'Regular admin login'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSuperAdmin(!isSuperAdmin)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                  isSuperAdmin ? 'bg-purple-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isSuperAdmin ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {isSuperAdmin && (
              <div className="mt-2 p-2 bg-purple-50 rounded border border-purple-200">
                <p className="text-xs text-purple-700">
                  👑 SuperAdmin mode: Use credentials from .env file
                </p>
              </div>
            )}
          </div>

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
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${
                isSuperAdmin 
                  ? 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500'
                  : 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500'
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </>
              ) : (
                isSuperAdmin ? 'SuperAdmin Sign In' : 'Sign In'
              )}
            </button>
          </form>

          {!isSuperAdmin && (
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-red-600 hover:text-red-700 font-medium">
                  Register here
                </Link>
              </p>
            </div>
          )}
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

export default Login; 