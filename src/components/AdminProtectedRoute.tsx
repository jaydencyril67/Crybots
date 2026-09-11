import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const validateAdminToken = () => {
      try {
        const adminToken = localStorage.getItem('adminToken');
        if (!adminToken) {
          setIsValid(false);
          setIsValidating(false);
          return;
        }

        // Check if admin token has proper JWT format (3 parts separated by dots)
        const parts = adminToken.split('.');
        if (parts.length !== 3) {
          localStorage.removeItem('adminToken');
          setIsValid(false);
          setIsValidating(false);
          return;
        }

        // Decode JWT token to check expiration
        const payload = JSON.parse(atob(parts[1]));
        const currentTime = Date.now() / 1000;
        
        // Check if token is expired
        if (payload.exp && payload.exp < currentTime) {
          localStorage.removeItem('adminToken');
          setIsValid(false);
          setIsValidating(false);
          return;
        }

        // Additional check: ensure payload has required admin fields
        if (!payload.userId || !payload.email || !payload.isAdmin) {
          localStorage.removeItem('adminToken');
          setIsValid(false);
          setIsValidating(false);
          return;
        }

        setIsValid(true);
        setIsValidating(false);
      } catch (error) {
        // If there's any error parsing the token, consider it invalid
        localStorage.removeItem('adminToken');
        setIsValid(false);
        setIsValidating(false);
      }
    };

    // Check immediately
    validateAdminToken();

    // Set up interval to check admin token validity every few seconds
    const interval = setInterval(validateAdminToken, 5000);

    return () => clearInterval(interval);
  }, []);

  // Show nothing while validating to prevent flash of content
  if (isValidating) {
    return null;
  }

  // Very strict admin token validation - redirect to admin login if any issue
  if (!isValid) {
    // Redirect to admin login page if admin token is invalid
    return <Navigate to="/al" replace />;
  }
  
  return <>{children}</>;
};

export default AdminProtectedRoute;