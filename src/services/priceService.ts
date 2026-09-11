interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  lastUpdated: number;
}

interface ExchangeRates {
  btcToUsdt: number;
  usdtToBtc: number;
  lastUpdated: number;
}

class PriceService {
  private prices: Map<string, PriceData> = new Map();
  private exchangeRates: ExchangeRates = { btcToUsdt: 0, usdtToBtc: 0, lastUpdated: 0 };
  private listeners: Set<(prices: Map<string, PriceData>) => void> = new Set();
  private rateListeners: Set<(rates: ExchangeRates) => void> = new Set();
  private updateInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  // CoinGecko coin IDs and symbol mapping
  private readonly COIN_IDS = 'bitcoin,ethereum,binancecoin,cardano,solana,dogecoin,chainlink,tron,litecoin';
  private readonly SYMBOL_MAP: { [key: string]: string } = {
    'bitcoin': 'BTC',
    'ethereum': 'ETH', 
    'binancecoin': 'BNB',
    'cardano': 'ADA',
    'solana': 'SOL',
    'dogecoin': 'DOGE',
    'chainlink': 'LINK',
    'tron': 'TRX',
    'litecoin': 'LTC'
  };

  // Fetch all prices from CoinGecko
  private async fetchPrices(): Promise<void> {
    try {
      
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${this.COIN_IDS}&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h`
      );
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }
      
      const data = await response.json();
      const now = Date.now();
      
      data.forEach((coin: any) => {
        const symbol = this.SYMBOL_MAP[coin.id];
        if (symbol) {
          this.prices.set(symbol, {
            symbol,
            price: coin.current_price || 0,
            change24h: coin.price_change_24h || 0,
            changePercent24h: coin.price_change_percentage_24h || 0,
            high24h: coin.high_24h || 0,
            low24h: coin.low_24h || 0,
            volume24h: coin.total_volume || 0,
            lastUpdated: now
          });
        }
      });

      // Update BTC/USDT exchange rates
      const btcPrice = this.prices.get('BTC')?.price || 0;
      if (btcPrice > 0) {
        this.exchangeRates = {
          btcToUsdt: btcPrice,
          usdtToBtc: 1 / btcPrice,
          lastUpdated: now
        };
        this.notifyRateListeners();
      }

      this.notifyListeners();
      
    } catch (error) {
    }
  }


  // Start price updates
  public start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // Fetch immediately
    this.fetchPrices();
    
    // Then fetch every 60 seconds (CoinGecko rate limit consideration)
    this.updateInterval = setInterval(() => {
      this.fetchPrices();
    }, 60000);
  }

  // Stop price updates
  public stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  // Subscribe to price updates
  public subscribe(callback: (prices: Map<string, PriceData>) => void): () => void {
    this.listeners.add(callback);
    
    // Send current data immediately
    callback(new Map(this.prices));
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Subscribe to exchange rate updates
  public subscribeToRates(callback: (rates: ExchangeRates) => void): () => void {
    this.rateListeners.add(callback);
    
    // Send current data immediately
    callback({ ...this.exchangeRates });
    
    // Return unsubscribe function
    return () => {
      this.rateListeners.delete(callback);
    };
  }

  // Get current price for a symbol
  public getPrice(symbol: string): PriceData | null {
    return this.prices.get(symbol.toUpperCase()) || null;
  }

  // Get all current prices
  public getAllPrices(): Map<string, PriceData> {
    return new Map(this.prices);
  }

  // Get current exchange rates
  public getExchangeRates(): ExchangeRates {
    return { ...this.exchangeRates };
  }

  // Notify all listeners
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(new Map(this.prices));
      } catch (error) {
      }
    });
  }

  // Notify rate listeners
  private notifyRateListeners(): void {
    this.rateListeners.forEach(callback => {
      try {
        callback({ ...this.exchangeRates });
      } catch (error) {
      }
    });
  }
}

// Export singleton instance
export const priceService = new PriceService();
export type { PriceData, ExchangeRates };
