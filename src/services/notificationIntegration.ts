import notificationService from './notificationService';

export interface NotificationData {
  type: 'deposit' | 'withdrawal' | 'trade' | 'security' | 'marketing' | 'system';
  title: string;
  message: string;
  data?: any;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  channels?: string[];
}

class NotificationIntegration {
  private userId: string | null = null;

  constructor() {
    // Get user ID from localStorage or context
    this.userId = localStorage.getItem('userId') || null;
  }

  /**
   * Set the current user ID
   */
  setUserId(userId: string) {
    this.userId = userId;
  }

  /**
   * Create and send a notification
   */
  async createNotification(data: NotificationData): Promise<boolean> {
    if (!this.userId) {
      console.error('No user ID set for notifications');
      return false;
    }

    try {
      const result = await notificationService.createAndSend({
        userId: this.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        priority: data.priority || 'medium',
        data: data.data,
        channels: data.channels || [] // Let server determine preferred channels
      });

      return result.emailSent || result.pushSent || result.inAppCreated;
    } catch (error) {
      console.error('Failed to create notification:', error);
      return false;
    }
  }

  /**
   * Deposit notification
   */
  async notifyDeposit(amount: number, currency: string, txHash?: string): Promise<boolean> {
    return await this.createNotification({
      type: 'deposit',
      title: 'Deposit Confirmed',
      message: `Your deposit of ${amount} ${currency} has been successfully processed and added to your account.`,
      priority: 'high',
      data: { amount, currency, txHash }
    });
  }

  /**
   * Withdrawal notification
   */
  async notifyWithdrawal(amount: number, currency: string, status: string): Promise<boolean> {
    return await this.createNotification({
      type: 'withdrawal',
      title: `Withdrawal ${status}`,
      message: `Your withdrawal request for ${amount} ${currency} has been ${status.toLowerCase()}.`,
      priority: 'high',
      data: { amount, currency, status }
    });
  }

  /**
   * Trade execution notification
   */
  async notifyTrade(pair: string, side: string, amount: number, price: number): Promise<boolean> {
    return await this.createNotification({
      type: 'trade',
      title: 'Trade Executed',
      message: `Your ${side} order for ${pair} has been successfully executed at ${price}.`,
      priority: 'medium',
      data: { pair, side, amount, price }
    });
  }

  /**
   * Security alert notification
   */
  async notifySecurity(title: string, message: string, data?: any): Promise<boolean> {
    return await this.createNotification({
      type: 'security',
      title,
      message,
      priority: 'urgent',
      data
    });
  }

  /**
   * Login notification
   */
  async notifyLogin(ipAddress: string, userAgent: string, location?: string): Promise<boolean> {
    return await this.createNotification({
      type: 'security',
      title: 'New Login Detected',
      message: `Your account was accessed from ${location || ipAddress}. If this wasn't you, please secure your account immediately.`,
      priority: 'high',
      data: { ipAddress, userAgent, location }
    });
  }

  /**
   * Password change notification
   */
  async notifyPasswordChange(): Promise<boolean> {
    return await this.createNotification({
      type: 'security',
      title: 'Password Changed',
      message: 'Your password has been successfully changed. If you did not make this change, please contact support immediately.',
      priority: 'high',
      data: { action: 'password_change' }
    });
  }

  /**
   * 2FA enabled/disabled notification
   */
  async notify2FAChange(enabled: boolean): Promise<boolean> {
    return await this.createNotification({
      type: 'security',
      title: `2FA ${enabled ? 'Enabled' : 'Disabled'}`,
      message: `Two-factor authentication has been ${enabled ? 'enabled' : 'disabled'} on your account.`,
      priority: 'high',
      data: { action: '2fa_change', enabled }
    });
  }

  /**
   * Account verification notification
   */
  async notifyAccountVerification(verified: boolean): Promise<boolean> {
    return await this.createNotification({
      type: 'system',
      title: `Account ${verified ? 'Verified' : 'Verification Required'}`,
      message: verified 
        ? 'Your account has been successfully verified. You now have access to all platform features.'
        : 'Please complete your account verification to access all platform features.',
      priority: verified ? 'medium' : 'high',
      data: { action: 'account_verification', verified }
    });
  }

  /**
   * Balance low notification
   */
  async notifyLowBalance(currency: string, balance: number, threshold: number): Promise<boolean> {
    return await this.createNotification({
      type: 'system',
      title: 'Low Balance Alert',
      message: `Your ${currency} balance (${balance}) is below the threshold (${threshold}). Consider adding funds to continue trading.`,
      priority: 'medium',
      data: { currency, balance, threshold }
    });
  }

  /**
   * Order filled notification
   */
  async notifyOrderFilled(orderId: string, pair: string, side: string, amount: number, price: number): Promise<boolean> {
    return await this.createNotification({
      type: 'trade',
      title: 'Order Filled',
      message: `Your ${side} order for ${pair} has been filled. Amount: ${amount}, Price: ${price}`,
      priority: 'medium',
      data: { orderId, pair, side, amount, price }
    });
  }

  /**
   * Order cancelled notification
   */
  async notifyOrderCancelled(orderId: string, pair: string, reason?: string): Promise<boolean> {
    return await this.createNotification({
      type: 'trade',
      title: 'Order Cancelled',
      message: `Your order for ${pair} has been cancelled.${reason ? ` Reason: ${reason}` : ''}`,
      priority: 'low',
      data: { orderId, pair, reason }
    });
  }

  /**
   * System maintenance notification
   */
  async notifyMaintenance(startTime: string, endTime: string, description?: string): Promise<boolean> {
    return await this.createNotification({
      type: 'system',
      title: 'Scheduled Maintenance',
      message: `System maintenance is scheduled from ${startTime} to ${endTime}.${description ? ` ${description}` : ''}`,
      priority: 'high',
      data: { startTime, endTime, description }
    });
  }

  /**
   * Marketing notification
   */
  async notifyMarketing(title: string, message: string, data?: any): Promise<boolean> {
    return await this.createNotification({
      type: 'marketing',
      title,
      message,
      priority: 'low',
      data
    });
  }

  /**
   * Copy trading notification
   */
  async notifyCopyTrade(traderName: string, action: 'started' | 'stopped', pair?: string): Promise<boolean> {
    return await this.createNotification({
      type: 'trade',
      title: `Copy Trading ${action === 'started' ? 'Started' : 'Stopped'}`,
      message: `Copy trading ${action === 'started' ? 'started' : 'stopped'} for ${traderName}${pair ? ` on ${pair}` : ''}.`,
      priority: 'medium',
      data: { traderName, action, pair }
    });
  }

  /**
   * Mining payout notification
   */
  async notifyMiningPayout(amount: number, currency: string, miningType: string): Promise<boolean> {
    return await this.createNotification({
      type: 'trade',
      title: 'Mining Payout Received',
      message: `You received ${amount} ${currency} from ${miningType} mining.`,
      priority: 'medium',
      data: { amount, currency, miningType }
    });
  }


  /**
   * API key created/revoked notification
   */
  async notifyAPIKey(action: 'created' | 'revoked', keyName: string): Promise<boolean> {
    return await this.createNotification({
      type: 'security',
      title: `API Key ${action === 'created' ? 'Created' : 'Revoked'}`,
      message: `API key "${keyName}" has been ${action === 'created' ? 'created' : 'revoked'}.`,
      priority: 'high',
      data: { action, keyName }
    });
  }

  /**
   * Wallet address added/removed notification
   */
  async notifyWalletAddress(action: 'added' | 'removed', address: string, currency: string): Promise<boolean> {
    return await this.createNotification({
      type: 'security',
      title: `Wallet Address ${action === 'added' ? 'Added' : 'Removed'}`,
      message: `A ${currency} wallet address has been ${action === 'added' ? 'added' : 'removed'}: ${address.substring(0, 8)}...${address.substring(address.length - 8)}`,
      priority: 'high',
      data: { action, address, currency }
    });
  }

}

// Create singleton instance
const notificationIntegration = new NotificationIntegration();

export default notificationIntegration;
