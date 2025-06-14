import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthRedirect = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthenticationAndRedirect();
  }, []);

  const checkAuthenticationAndRedirect = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    console.log('AuthRedirect - Checking if user is already authenticated:', { token: !!token, userData: !!userData });
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('AuthRedirect - User already authenticated, redirecting to admin:', parsedUser.username);
        navigate('/admin');
        return;
      } catch (error) {
        console.error('AuthRedirect - Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return children;
};

export default AuthRedirect; 