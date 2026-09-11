import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isTokenValid } from '../utils/tokenValidation';
import tokenValidator from '../utils/tokenValidation';

interface GlobalTokenValidatorProps {
  children: React.ReactNode;
}

const GlobalTokenValidator: React.FC<GlobalTokenValidatorProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Public routes: no user token required
  const publicRoutes = [
    '/',           // Home
    '/l',          // Login  
    '/r',          // Register
    '/fp',         // ForgotPassword
    '/rp',         // ResetPassword
    '/f',          // FAQ
    '/co',         // Contact page (public - no token needed)
    '/al',         // AdminLogin (public - no token needed)
    '/as',         // AdminSignup (public - no token needed)
    '/ve'          // Email verification (public - no token needed)
  ];

  // Admin routes: require admin token, not user token
  const adminRoutes = [
    '/a',          // AdminDashboard
    '/au',         // AdminUsers
    '/aw',         // AdminWithdrawals
    '/ar',         // AdminRecent
    '/ad',         // AdminDeposit
    '/at',         // AdminTeam
    '/atr',        // Trash
    '/aps',        // AdminPlatformStats
    '/asf',        // AdminSendFunds
    '/ac'          // AdminChat
  ];
  
  useEffect(() => {
    // Check if current route is admin route
    const isAdminRoute = adminRoutes.includes(location.pathname);
    
    // Check if current route is protected (not public and not admin)
    const isProtectedRoute = !publicRoutes.includes(location.pathname) && !isAdminRoute;
    
    if (isProtectedRoute) {
      // For protected routes, immediately check token validity
      const tokenValid = isTokenValid();
      if (!tokenValid) {
        // Immediately redirect to home if accessing protected route without valid token
        navigate('/', { replace: true });
        return;
      }
      
      // Start periodic token validation for protected routes
      tokenValidator.start();
    } else {
      // Stop periodic validation for public/admin routes
      tokenValidator.stop();
    }
    
    // For admin routes, let AdminProtectedRoute handle the validation
    // Don't redirect here - let the admin route protection handle it
  }, [location.pathname, navigate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      tokenValidator.stop();
    };
  }, []);

  return <>{children}</>;
};

export default GlobalTokenValidator;