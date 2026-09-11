export interface User {
    id: string;
    username: string;
    email: string;
    createdAt: Date;
    btcBalance: number;
}

export interface PortfolioItem {
    id: string;
    name: string;
    quantity: number;
    value: number;
}

export interface TradeTransaction {
    id: string;
    userId: string;
    cryptoId: string;
    type: 'buy' | 'sell';
    quantity: number;
    price: number;
    timestamp: Date;
}

export interface MiningPackage {
    id: number;
    name: string;
    cost: number; // BTC
    duration: number; // days
    expectedReturn: number; // BTC (or BTC-equivalent if used)
    hashRate: number; // simulated hash rate
    powerConsumption: number; // simulated power consumption
    dailyProfit: number; // BTC per day (fixed daily mining amount)
    totalProfit: number; // BTC total profit
    isAvailable: boolean;
    remainingUnits: number;
    maxUnitsPerDay: number;
}

export interface UserMiningContract {
    id: string;
    userId: string;
    packageId: number;
    packageName: string;
    startDate: Date;
    endDate: Date;
    duration: number; // days
    totalInvestment: number; // BTC
    expectedReturn: number; // BTC
    dailyProfit: number; // BTC per day (fixed daily mining amount)
    totalMined: number; // BTC mined so far
    status: 'active' | 'completed' | 'cancelled';
    progress: number; // percentage completed
    nextPayout: Date;
}

export interface MiningTransaction {
    id: string;
    userId: string;
    type: 'mining_purchase' | 'mining_payout' | 'mining_completion';
    packageId?: number;
    packageName?: string;
    amount: number; // amount (BTC for mining flows; some records might use USDT)
    currency: 'USDT' | 'BTC';
    timestamp: Date;
    description: string;
}

// Notification types
export type NotificationType = 'deposit' | 'withdrawal' | 'trade' | 'security' | 'marketing' | 'system';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';
export type NotificationChannel = 'email' | 'push' | 'inApp';

export interface Notification {
    _id: string;
    userId: string;
    type: NotificationType;
    category: NotificationType;
    priority: NotificationPriority;
    title: string;
    message: string;
    data?: {
        [key: string]: any;
    };
    channels: NotificationChannel[];
    read: boolean;
    readAt?: string;
    sentAt?: string;
    deliveredAt?: string;
    clickedAt?: string;
    expiresAt?: string;
    createdAt: string;
    updatedAt: string;
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