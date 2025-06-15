import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import ServiceDetail from './components/ServiceDetail';
import OrganizationServices from './components/OrganizationServices';
import BundleDetail from './components/BundleDetail';
import Admin from './components/Admin';
import SuperAdmin from './components/SuperAdmin';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';
import AuthRedirect from './components/AuthRedirect';
import './index.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/service/:id" element={<ServiceDetail />} />
          <Route path="/organization/:organizationName" element={<OrganizationServices />} />
          <Route path="/bundle/:bundleId" element={<BundleDetail />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/superadmin" 
            element={
              <ProtectedRoute>
                <SuperAdmin />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/login" 
            element={
              <AuthRedirect>
                <Login />
              </AuthRedirect>
            } 
          />
          <Route 
            path="/register" 
            element={
              <AuthRedirect>
                <Register />
              </AuthRedirect>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
