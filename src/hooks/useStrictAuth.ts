import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isTokenValid } from '../utils/tokenValidation';
import pushNotificationManager from '../services/pushNotificationManager';

export const useStrictAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const valid = isTokenValid();
      if (!valid) {
        // Immediately redirect to home if token is invalid
        navigate('/', { replace: true });
        return;
      }
      setIsAuthenticated(true);
      setIsChecking(false);
      
      // Initialize push notifications after successful authentication
      pushNotificationManager.initializeAfterAuth();
    };

    // Check immediately
    checkAuth();

    // Set up interval to check token validity every few seconds
    const interval = setInterval(checkAuth, 5000);

    return () => clearInterval(interval);
  }, [navigate]);

  return { isAuthenticated, isChecking };
};
