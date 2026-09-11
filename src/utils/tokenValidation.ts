import axios from 'axios';
import pushNotificationManager from '../services/pushNotificationManager';

const API = process.env.REACT_APP_API_URL || 'https://api-tradespot.onrender.com';

// Token validation utility
export const isTokenValid = (): boolean => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return false;
    }

    // Check if token has proper JWT format (3 parts separated by dots)
    const parts = token.split('.');
    if (parts.length !== 3) {
      localStorage.removeItem('token');
      return false;
    }

    // Decode JWT token to check expiration
    const payload = JSON.parse(atob(parts[1]));
    const currentTime = Date.now() / 1000;
    
    // Check if token is expired
    if (payload.exp && payload.exp < currentTime) {
      // Remove expired token
      localStorage.removeItem('token');
      return false;
    }

    // Additional check: ensure payload has required fields
    if (!payload.userId || !payload.email) {
      localStorage.removeItem('token');
      return false;
    }

    return true;
  } catch (error) {
    // If there's any error parsing the token, consider it invalid
    localStorage.removeItem('token');
    return false;
  }
};

export const clearInvalidToken = (): void => {
  localStorage.removeItem('token');
};

// Periodic Token Validation Service
class TokenValidator {
    private intervalId: NodeJS.Timeout | null = null;
    private isRunning = false;
    private checkInterval = 2 * 60 * 1000; // 2 minutes in milliseconds

    constructor() {
        this.startValidation();
    }

    private startValidation() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.intervalId = setInterval(() => {
            this.validateToken();
        }, this.checkInterval);
    }

    private stopValidation() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
    }

    private async validateToken() {
        const token = localStorage.getItem('token');
        
        // If no token, stop validation
        if (!token) {
            this.stopValidation();
            return;
        }

        try {
            // Make a lightweight request to validate the token
            const response = await axios.get(`${API}/api/auth/validate-token`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                timeout: 10000 // 10 second timeout
            });

            // If we get here, token is valid
            console.log('Token validation successful');
            
        } catch (error: any) {
            console.error('Token validation failed:', error);
            
            // Check if it's a session expiration error
            if (error.response?.status === 401 && 
                (error.response?.data?.message?.includes('logged out from another device') ||
                 error.response?.data?.message?.includes('Session expired'))) {
                
                this.handleSessionExpired();
            } else if (error.response?.status === 401) {
                // Any other 401 error means token is invalid
                this.handleSessionExpired();
            }
        }
    }

    private async handleSessionExpired() {
        console.log('Session expired, logging out user');
        
        // Stop validation
        this.stopValidation();
        
        // Clear token
        localStorage.removeItem('token');
        
        // Clear any other user data
        localStorage.removeItem('user');
        localStorage.removeItem('signupDevice');
        
        // Check if in-app notifications are enabled before showing notification
        let shouldShowNotification = true;
        
        try {
            // Try to get notification preferences before token is fully cleared
            // This will work if we caught the token issue early enough
            const notificationData = await pushNotificationManager.getNotificationPreferences();
            // Check if in-app notifications for security are enabled
            if (notificationData && 
                notificationData.preferences && 
                (!notificationData.preferences.inApp.enabled || 
                 !notificationData.preferences.inApp.categories.security)) {
                shouldShowNotification = false;
            }
        } catch (error) {
            // If there's any error getting preferences, default to showing notification
            console.log('Could not retrieve notification preferences, defaulting to show notification');
            shouldShowNotification = true;
        }
        
        // Show notification to user if enabled
        if (shouldShowNotification) {
            this.showLogoutNotification();
        }
        
        // Redirect to login page
        setTimeout(() => {
            window.location.href = '/l?session_expired=true';
        }, shouldShowNotification ? 2000 : 0); // If showing notification, wait 2 seconds before redirect
    }

    private showLogoutNotification() {
        // Create a notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #e74c3c;
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            font-size: 14px;
            font-weight: 500;
            max-width: 300px;
            animation: slideIn 0.3s ease-out;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 18px;">🔒</span>
                <div>
                    <div style="font-weight: 600; margin-bottom: 4px;">Session Expired</div>
                    <div style="font-size: 12px; opacity: 0.9;">You have been logged out from another device. Redirecting to login...</div>
                </div>
            </div>
        `;
        
        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    // Public method to manually stop validation (e.g., when user logs out)
    public stop() {
        this.stopValidation();
    }

    // Public method to restart validation (e.g., when user logs in)
    public start() {
        this.stopValidation();
        this.startValidation();
    }

    // Public method to check if validation is running
    public isActive(): boolean {
        return this.isRunning;
    }
}

// Create a singleton instance
const tokenValidator = new TokenValidator();

export default tokenValidator;