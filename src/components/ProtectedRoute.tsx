import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useStrictAuth } from '../hooks/useStrictAuth';
import axios from 'axios';
import OnboardingWizard from './OnboardingWizard';

const API = process.env.REACT_APP_API_BASE_URL;

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isChecking } = useStrictAuth();
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!isAuthenticated) {
        setCheckingOnboarding(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setCheckingOnboarding(false);
          return;
        }

        const response = await axios.get(`${API}/api/onboarding/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setOnboardingCompleted(response.data.onboardingCompleted);
      } catch (error) {
        console.error('Failed to check onboarding status:', error);
        // If we can't check, assume it's completed to not block the user
        setOnboardingCompleted(true);
      } finally {
        setCheckingOnboarding(false);
      }
    };

    if (!isChecking && isAuthenticated) {
      checkOnboardingStatus();
    }
  }, [isAuthenticated, isChecking]);

  const handleOnboardingComplete = () => {
    setOnboardingCompleted(true);
  };

  // Show nothing while checking to prevent flash of content
  if (isChecking || checkingOnboarding) {
    return null;
  }

  // Very strict token validation - redirect to home if any issue
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Show onboarding wizard only if explicitly not completed (false)
  // Don't show if null (still checking) or true (already completed)
  if (onboardingCompleted === false) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;