import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    console.log('ProtectedRoute - Checking authentication:', { token: !!token, userData: !!userData });
    
    if (!token || !userData) {
      console.log('ProtectedRoute - No authentication found, redirecting to login');
      setIsAuthenticated(false);
      setIsLoading(false);
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      console.log('ProtectedRoute - User authenticated:', parsedUser.username);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('ProtectedRoute - Error parsing user data:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : null;
};

export default ProtectedRoute; 