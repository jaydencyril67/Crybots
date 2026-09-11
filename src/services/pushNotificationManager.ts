import { NotificationType } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPreferences {
  email: {
    enabled: boolean;
    categories: {
      deposits: boolean;
      withdrawals: boolean;
      trades: boolean;
      security: boolean;
      marketing: boolean;
      system: boolean;
    };
  };
  push: {
    enabled: boolean;
    categories: {
      deposits: boolean;
      withdrawals: boolean;
      trades: boolean;
      security: boolean;
      marketing: boolean;
      system: boolean;
    };
  };
  inApp: {
    enabled: boolean;
    categories: {
      deposits: boolean;
      withdrawals: boolean;
      trades: boolean;
      security: boolean;
      marketing: boolean;
      system: boolean;
    };
  };
}

class PushNotificationManager {
  private vapidPublicKey: string | null = null;
  private isSupported: boolean = false;
  private registration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    this.initialize();
  }

  /**
   * Initialize the push notification manager
   */
  private async initialize(): Promise<void> {
    if (!this.isSupported) {
      console.log('Push notifications are not supported in this browser');
      return;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');

      // Get VAPID public key
      await this.getVapidKey();

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage);
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  }

  /**
   * Get VAPID public key from server (public endpoint, no auth required)
   */
  private async getVapidKey(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/vapid-key`);

      if (!response.ok) {
        console.error('Failed to get VAPID key: HTTP', response.status);
        return;
      }

      const data = await response.json();
      this.vapidPublicKey = data.vapidKey;
    } catch (error) {
      console.error('Failed to get VAPID key:', error);
    }
  }

  /**
   * Initialize push notifications after user authentication
   */
  public async initializeAfterAuth(): Promise<void> {
    if (!this.isSupported) {
      return;
    }

    try {
      // Get VAPID public key now that user is authenticated
      await this.getVapidKey();
    } catch (error) {
      console.error('Failed to initialize push notifications after auth:', error);
    }
  }

  /**
   * Check if push notifications are supported
   */
  public isPushSupported(): boolean {
    return this.isSupported && !!this.vapidPublicKey;
  }

  /**
   * Check if user has granted permission for push notifications
   */
  public async getPermissionStatus(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      return 'denied';
    }

    return await Notification.requestPermission();
  }

  /**
   * Request permission for push notifications
   */
  public async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  /**
   * Subscribe to push notifications
   */
  public async subscribe(): Promise<boolean> {
    if (!this.isSupported) {
      return false;
    }

    if (!this.registration) {
      return false;
    }

    if (!this.vapidPublicKey) {
      return false;
    }

    try {
      // Check if already subscribed
      const existingSubscription = await this.registration.pushManager.getSubscription();
      if (existingSubscription) {
        return true;
      }

      // Request permission
      const permission = await this.requestPermission();
      if (!permission) {
        return false;
      }
      
      // Subscribe to push manager
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey) as BufferSource
      });

      // Send subscription to server
      const customSubscription: PushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
        }
      };
      
      const success = await this.sendSubscriptionToServer(customSubscription);
      return success;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return false;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  public async unsubscribe(): Promise<boolean> {
    if (!this.isSupported || !this.registration) {
      return false;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (!subscription) {
        return true;
      }

      // Unsubscribe from push manager
      const success = await subscription.unsubscribe();
      
      if (success) {
        // Remove subscription from server
        await this.removeSubscriptionFromServer();
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  /**
   * Get current subscription status
   */
  public async getSubscriptionStatus(): Promise<{
    isSubscribed: boolean;
    hasPermission: boolean;
    isSupported: boolean;
  }> {
    const hasPermission = await this.getPermissionStatus() === 'granted';
    let isSubscribed = false;

    if (this.isSupported && this.registration) {
      const subscription = await this.registration.pushManager.getSubscription();
      isSubscribed = !!subscription;
    }

    return {
      isSubscribed,
      hasPermission,
      isSupported: this.isSupported
    };
  }

  /**
   * Send subscription to server
   */
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<boolean> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/api/notifications/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subscription: subscription,
          userAgent: navigator.userAgent
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
      return false;
    }
  }

  /**
   * Remove subscription from server
   */
  private async removeSubscriptionFromServer(): Promise<boolean> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/api/notifications/push/unsubscribe`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to remove subscription from server:', error);
      return false;
    }
  }

  /**
   * Test push notification
   */
  public async testPushNotification(): Promise<boolean> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/api/notifications/push/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to send test push notification:', error);
      return false;
    }
  }

  /**
   * Get notification preferences
   */
  public async getNotificationPreferences(): Promise<{
    preferences: NotificationPreferences;
    pushSubscription: {
      hasSubscription: boolean;
      isEnabled: boolean;
      categories: { [key: string]: boolean };
    };
  }> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/notifications/preferences`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notification preferences');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get notification preferences:', error);
      throw error;
    }
  }

  /**
   * Update notification preferences
   */
  public async updateNotificationPreferences(preferences: NotificationPreferences): Promise<boolean> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/api/notifications/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ preferences })
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      return false;
    }
  }

  /**
   * Handle service worker messages
   */
  private handleServiceWorkerMessage = (event: MessageEvent): void => {
    if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
      // Handle notification click
      const notificationData = event.data.data;
      if (notificationData && notificationData.url) {
        // Navigate to the notification URL
        window.location.href = notificationData.url;
      }
    }
  };

  /**
   * Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray as Uint8Array;
  }

  /**
   * Show local notification (for testing)
   */
  public async showLocalNotification(title: string, options: NotificationOptions): Promise<void> {
    if (!this.isSupported) {
      return;
    }

    const permission = await this.getPermissionStatus();
    if (permission !== 'granted') {
      return;
    }

    if (this.registration) {
      await this.registration.showNotification(title, options);
    } else {
      new Notification(title, options);
    }
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    if (navigator.serviceWorker) {
      navigator.serviceWorker.removeEventListener('message', this.handleServiceWorkerMessage);
    }
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

// Create singleton instance
const pushNotificationManager = new PushNotificationManager();

export default pushNotificationManager;
