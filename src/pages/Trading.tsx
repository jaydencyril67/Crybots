import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TradingChart from '../components/TradingChart'; // TradingView chart component
import { useTheme } from '../ThemeContext';
import { FaChevronDown, FaChevronUp, FaExchangeAlt, FaHistory, FaList, FaBookOpen, FaChartLine } from 'react-icons/fa';

// Define types
interface OrderBookEntry {
  price: number;
  amount: number;
}

interface OrderBook {
  symbol: string;
  bids: [number, number][];  // [price, amount]
  asks: [number, number][];  // [price, amount]
  timestamp: string;
}

interface Ticker {
  symbol: string;
  lastPrice: number;
  priceChange: number;
  priceChangePercent: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  quoteVolume24h: number;
}

interface TradingPair {
  symbol: string;
  baseCurrency: string;
  quoteCurrency: string;
  minTradeAmount: number;
  pricePrecision: number;
  amountPrecision: number;
}

// Live data fetchers - Batch API call to avoid rate limiting
const fetchAllCryptoData = async () => {
  try {
    // Batch fetch all coins in one API call to avoid rate limits
    const coinIds = 'bitcoin,ethereum,binancecoin,cardano,solana,polkadot';

    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_last_updated_at=true`);

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait before refreshing.');
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Fetched batch crypto data:', data);

    // Convert API response to our format
    const symbolMap: { [key: string]: string } = {
      'bitcoin': 'BTC/USDT',
      'ethereum': 'ETH/USDT',
      'binancecoin': 'BNB/USDT',
      'cardano': 'ADA/USDT',
      'solana': 'SOL/USDT',
      'polkadot': 'DOT/USDT'
    };

    const result: { [key: string]: any } = {};

    // Process each coin's data
    Object.entries(data).forEach(([coinId, coinData]: [string, any]) => {
      const symbol = symbolMap[coinId];
      if (symbol && coinData) {
        result[symbol] = {
          lastPrice: coinData.usd || 0,
          priceChange: coinData.usd && coinData.usd_24h_change ? (coinData.usd * coinData.usd_24h_change) / 100 : 0,
          priceChangePercent: coinData.usd_24h_change || 0,
          volume24h: coinData.usd_24h_vol || 0,
          high24h: coinData.usd ? coinData.usd * 1.02 : 0,
          low24h: coinData.usd ? coinData.usd * 0.98 : 0,
          quoteVolume24h: (coinData.usd_24h_vol || 0) * (coinData.usd || 0)
        };
      }
    });

    return result;
  } catch (error) {
    console.error('Error fetching batch crypto data:', error);
    return null;
  }
};

const generateLiveOrderBook = (symbol: string, currentPrice: number): OrderBook => {
  const asks: [number, number][] = [];
  const bids: [number, number][] = [];

  // Generate 15 ask orders (sell orders above current price)
  for (let i = 0; i < 15; i++) {
    const priceOffset = (i + 1) * (currentPrice * 0.0002); // Smaller spreads for realism
    const price = currentPrice + priceOffset;
    const amount = Math.random() * 5 + 0.1;
    asks.push([price, amount]);
  }

  // Generate 15 bid orders (buy orders below current price)
  for (let i = 0; i < 15; i++) {
    const priceOffset = (i + 1) * (currentPrice * 0.0002);
    const price = currentPrice - priceOffset;
    const amount = Math.random() * 5 + 0.1;
    bids.push([price, amount]);
  }

  return {
    symbol,
    asks,
    bids,
    timestamp: new Date().toISOString()
  };
};

const Trading: React.FC = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  // Get symbol and side from URL query params, defaulting to BTC/USDT and buy
  const [symbol, setSymbol] = useState(queryParams.get('symbol') || 'BTC/USDT');
  const [side, setSide] = useState((queryParams.get('side') || 'buy') as 'buy' | 'sell');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('limit');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [ticker, setTicker] = useState<Ticker | null>(null);
  const [allTickers, setAllTickers] = useState<{ [key: string]: Ticker }>({});
  const [tradingPairs, setTradingPairs] = useState<TradingPair[]>([]);
  const [activeTab, setActiveTab] = useState<'chart' | 'orderbook' | 'history' | 'orders'>('chart');
  const [mobileTab, setMobileTab] = useState<'chart' | 'orderbook' | 'trade'>('chart');
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isOrderProcessing, setIsOrderProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPercentage, setSelectedPercentage] = useState(0);
  const [userBalances, setUserBalances] = useState({
    btcBalance: 0,
    usdtBalance: 0
  });
  const [userOrders, setUserOrders] = useState<any[]>([]);

  // Parse the symbol to get base and quote currencies
  const [baseCurrency, quoteCurrency] = symbol.split('/');

  // Set demo trading pairs on mount
  useEffect(() => {
    const loadDemoTradingPairs = () => {
      // Use demo trading pairs data
      const demoPairs: TradingPair[] = [
        {
          symbol: 'BTC/USDT',
          baseCurrency: 'BTC',
          quoteCurrency: 'USDT',
          minTradeAmount: 0.00001,
          pricePrecision: 2,
          amountPrecision: 8
        },
        {
          symbol: 'ETH/USDT',
          baseCurrency: 'ETH',
          quoteCurrency: 'USDT',
          minTradeAmount: 0.0001,
          pricePrecision: 2,
          amountPrecision: 6
        },
        {
          symbol: 'BNB/USDT',
          baseCurrency: 'BNB',
          quoteCurrency: 'USDT',
          minTradeAmount: 0.001,
          pricePrecision: 2,
          amountPrecision: 5
        },
        {
          symbol: 'ADA/USDT',
          baseCurrency: 'ADA',
          quoteCurrency: 'USDT',
          minTradeAmount: 1,
          pricePrecision: 4,
          amountPrecision: 2
        },
        {
          symbol: 'SOL/USDT',
          baseCurrency: 'SOL',
          quoteCurrency: 'USDT',
          minTradeAmount: 0.01,
          pricePrecision: 2,
          amountPrecision: 4
        },
        {
          symbol: 'DOT/USDT',
          baseCurrency: 'DOT',
          quoteCurrency: 'USDT',
          minTradeAmount: 0.1,
          pricePrecision: 3,
          amountPrecision: 3
        }
      ];

      setTradingPairs(demoPairs);

      // If the selected symbol is not in the list, default to BTC/USDT
      const symbolExists = demoPairs.some(pair => pair.symbol === symbol);
      if (!symbolExists) {
        setSymbol('BTC/USDT');
      }
    };

    loadDemoTradingPairs();
  }, []);

  // Fetch live data for all pairs on component mount
  useEffect(() => {
    const loadAllLiveData = async () => {
      setIsDataLoading(true);

      const pairs = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'ADA/USDT', 'SOL/USDT', 'DOT/USDT'];
      const tickersData: { [key: string]: Ticker } = {};

      // Fetch all crypto data in one batch API call
      try {
        const batchData = await fetchAllCryptoData();

        if (batchData) {
          // Convert batch data to ticker format
          Object.entries(batchData).forEach(([symbol, data]: [string, any]) => {
            tickersData[symbol] = {
              symbol,
              lastPrice: data.lastPrice,
              priceChange: data.priceChange,
              priceChangePercent: data.priceChangePercent,
              high24h: data.high24h,
              low24h: data.low24h,
              volume24h: data.volume24h,
              quoteVolume24h: data.quoteVolume24h
            };
          });
        } else {
          console.warn('Failed to fetch batch data, using fallback');
        }
      } catch (error) {
        console.error('Error loading batch crypto data:', error);
      }

      setAllTickers(tickersData);

      // Set current symbol ticker and order book
      if (tickersData[symbol]) {
        setTicker(tickersData[symbol]);
        setOrderBook(generateLiveOrderBook(symbol, tickersData[symbol].lastPrice));
      }

      // Fetch real user balances from backend
      await fetchUserBalances();

      setIsDataLoading(false);
    };

    loadAllLiveData();

    // Set up interval to refresh all live data every 60 seconds
    const intervalId = setInterval(async () => {
      const pairs = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'ADA/USDT', 'SOL/USDT', 'DOT/USDT'];
      const tickersData: { [key: string]: Ticker } = {};

      // Batch update all pairs
      try {
        const batchData = await fetchAllCryptoData();

        if (batchData) {
          Object.entries(batchData).forEach(([symbol, data]: [string, any]) => {
            tickersData[symbol] = {
              symbol,
              lastPrice: data.lastPrice,
              priceChange: data.priceChange,
              priceChangePercent: data.priceChangePercent,
              high24h: data.high24h,
              low24h: data.low24h,
              volume24h: data.volume24h,
              quoteVolume24h: data.quoteVolume24h
            };
          });
        }
      } catch (error) {
        console.error('Error updating batch crypto data:', error);
      }

      setAllTickers(prev => ({ ...prev, ...tickersData }));

      // Update current ticker if data available
      if (tickersData[symbol]) {
        setTicker(tickersData[symbol]);
        setOrderBook(generateLiveOrderBook(symbol, tickersData[symbol].lastPrice));
      }
    }, 60000); // Update every 60 seconds

    return () => clearInterval(intervalId);
  }, []);

  // Update ticker and order book when symbol changes
  useEffect(() => {
    if (allTickers[symbol]) {
      setTicker(allTickers[symbol]);
      setOrderBook(generateLiveOrderBook(symbol, allTickers[symbol].lastPrice));
      // Fetch user orders for the new symbol
      fetchUserOrders();
    }
  }, [symbol, allTickers]);

  // Handle mobile tab switching via body attribute
  useEffect(() => {
    console.log('Setting mobile tab to:', mobileTab);
    document.body.setAttribute('data-mobile-tab', mobileTab);
    return () => {
      document.body.removeAttribute('data-mobile-tab');
    };
  }, [mobileTab]);

  // Find the current trading pair details
  // Use extra safety checks for finding the current trading pair
  let currentTradingPair: TradingPair | undefined = undefined;
  if (Array.isArray(tradingPairs) && tradingPairs.length > 0) {
    // Use traditional for loop for maximum safety
    for (let i = 0; i < tradingPairs.length; i++) {
      if (tradingPairs[i] && tradingPairs[i].symbol === symbol) {
        currentTradingPair = tradingPairs[i];
        break;
      }
    }
  }

  // Format price and amount based on trading pair precision
  const formatPrice = (value: number): string => {
    if (!currentTradingPair) return value.toString();
    return value.toFixed(currentTradingPair.pricePrecision);
  };

  const formatAmount = (value: number): string => {
    if (!currentTradingPair) return value.toString();
    return value.toFixed(currentTradingPair.amountPrecision);
  };

  // Calculate total based on price and amount
  const calculateTotal = (): string => {
    if (!amount) return '0';

    // For market orders, use the current market price from ticker
    if (orderType === 'market' && ticker) {
      return (ticker.lastPrice * parseFloat(amount)).toFixed(2);
    }

    // For limit orders, use the specified price
    if (!price) return '0';
    return (parseFloat(price) * parseFloat(amount)).toFixed(2);
  };

  // Handle amount percentage selection
  const handlePercentageSelect = (percentage: number) => {
    setSelectedPercentage(percentage);

    if (side === 'buy' && ticker && userBalances.usdtBalance > 0) {
      // For buy orders, calculate how much base currency we can buy with USDT
      const availableUsdt = userBalances.usdtBalance * (percentage / 100);
      const priceToUse = orderType === 'limit' ? parseFloat(price || '0') : ticker.lastPrice;
      if (priceToUse > 0) {
        const calculatedAmount = availableUsdt / priceToUse;
        setAmount(calculatedAmount.toFixed(currentTradingPair?.amountPrecision || 6));
      }
    } else if (side === 'sell') {
      // For sell orders, calculate percentage of base currency balance
      let baseBalance = 0;
      if (baseCurrency === 'BTC') {
        baseBalance = userBalances.btcBalance;
      }

      const calculatedAmount = baseBalance * (percentage / 100);
      setAmount(calculatedAmount.toFixed(currentTradingPair?.amountPrecision || 6));
    }
  };

  // Fetch user balances from backend
  const fetchUserBalances = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const API = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${API}/api/portfolio`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('Fetched user balances:', userData);
        setUserBalances({
          btcBalance: Number(userData.btcBalance) || 0,
          usdtBalance: Number(userData.usdtBalance) || 0
        });
      }
    } catch (error) {
      console.error('Error fetching user balances:', error);
    }
  };

  // Fetch user orders from backend
  const fetchUserOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const API = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${API}/api/trading/orders?symbol=${symbol}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const orders = await response.json();
        setUserOrders(orders);
      }
    } catch (error) {
      console.error('Error fetching user orders:', error);
    }
  };

  // Handle order submission (real API)
  const handleSubmitOrder = async () => {
    if (!amount || (orderType === 'limit' && !price)) {
      setError('Please enter all required fields');
      return;
    }

    setIsOrderProcessing(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to place orders');
        setIsOrderProcessing(false);
        return;
      }

      const API = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
      const orderData = {
        symbol,
        type: orderType,
        side,
        amount: parseFloat(amount),
        price: orderType === 'limit' ? parseFloat(price) : (ticker ? ticker.lastPrice : 0)
      };

      const response = await fetch(`${API}/api/trading/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(`Order placed successfully! Order ID: ${result._id}`);
        setAmount('');
        setPrice('');
        setSelectedPercentage(0);

        // Refresh balances and orders
        await fetchUserBalances();
        await fetchUserOrders();
      } else {
        setError(result.message || 'Failed to place order');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to place order. Please try again.');
    } finally {
      setIsOrderProcessing(false);
    }
  };


  return (
    <div className="trading-page" style={{
      background: 'var(--bg)',
      color: 'var(--text)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      maxWidth: '100vw',
      padding: '0 20px 20px',
      minHeight: 'auto'
    }}>

      {/* Market Ticker Bar */}
      <div className="trading-ticker-bar" style={{
        background: 'var(--card-bg)',
        padding: '8px 16px',
        display: 'flex',
        gap: '24px',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        boxShadow: 'var(--card-shadow)'
      }}>
        {tradingPairs.slice(0, 10).map(pair => {
          // Use ticker data from allTickers
          const pairTicker = allTickers[pair.symbol];

          if (!pairTicker) {
            return (
              <div
                key={pair.symbol}
                onClick={() => setSymbol(pair.symbol)}
                style={{
                  cursor: 'pointer',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  background: symbol === pair.symbol ? 'var(--bg-secondary)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontWeight: 600, fontSize: '13px' }}>{pair.symbol}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Loading...</span>
              </div>
            );
          }

          const isPositive = pairTicker.priceChangePercent >= 0;
          return (
            <div
              key={pair.symbol}
              onClick={() => setSymbol(pair.symbol)}
              style={{
                cursor: 'pointer',
                padding: '4px 12px',
                borderRadius: '4px',
                background: symbol === pair.symbol ? 'var(--bg-secondary)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontWeight: 600, fontSize: '13px' }}>{pair.symbol}</span>
              <span style={{ color: isPositive ? '#0ecb81' : '#f6465d', fontSize: '13px' }}>
                ${pairTicker.lastPrice.toFixed(2)}
              </span>
              <span style={{
                color: isPositive ? '#0ecb81' : '#f6465d',
                fontSize: '12px',
                fontWeight: 500
              }}>
                {isPositive ? '+' : ''}{pairTicker.priceChangePercent.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Main Trading Interface */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '0'
      }}>
        {/* Pair Info Header */}
        <div className="trading-pair-header" style={{
          background: 'var(--card-bg)',
          padding: '16px',
          boxShadow: 'var(--card-shadow)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
              {symbol}
            </h1>
            {ticker && (
              <>
                <div style={{ fontSize: '24px', fontWeight: 600, color: ticker.priceChangePercent >= 0 ? '#0ecb81' : '#f6465d' }}>
                  ${ticker.lastPrice.toFixed(2)}
                </div>
                <div style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background: ticker.priceChangePercent >= 0 ? 'rgba(14, 203, 129, 0.1)' : 'rgba(246, 70, 93, 0.1)',
                  color: ticker.priceChangePercent >= 0 ? '#0ecb81' : '#f6465d',
                  fontSize: '14px',
                  fontWeight: 500
                }}>
                  {ticker.priceChangePercent >= 0 ? '+' : ''}{ticker.priceChangePercent.toFixed(2)}%
                </div>
              </>
            )}
          </div>
          {ticker && (
            <div style={{ display: 'flex', gap: '24px', marginTop: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <div>
                <span>24h High: </span>
                <span style={{ color: 'var(--text)', fontWeight: 500 }}>${ticker.high24h?.toFixed(2) || '-'}</span>
              </div>
              <div>
                <span>24h Low: </span>
                <span style={{ color: 'var(--text)', fontWeight: 500 }}>${ticker.low24h?.toFixed(2) || '-'}</span>
              </div>
              <div>
                <span>24h Volume ({baseCurrency}): </span>
                <span style={{ color: 'var(--text)', fontWeight: 500 }}>{ticker.volume24h?.toFixed(4) || '-'}</span>
              </div>
              <div>
                <span>24h Volume ({quoteCurrency}): </span>
                <span style={{ color: 'var(--text)', fontWeight: 500 }}>${ticker.quoteVolume24h?.toFixed(2) || '-'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Tab Navigation */}
        <div className="mobile-tab-nav" style={{
          display: 'none',
          background: 'var(--card-bg)',
          borderBottom: '1px solid var(--border-color)',
          padding: '0 16px'
        }}>
          <div style={{
            display: 'flex',
            gap: '0'
          }}>
            {[
              { key: 'chart', label: 'Chart', icon: <FaChartLine /> },
              { key: 'orderbook', label: 'Book', icon: <FaList /> },
              { key: 'trade', label: 'Trade', icon: <FaExchangeAlt /> }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setMobileTab(tab.key as 'chart' | 'orderbook' | 'trade')}
                style={{
                  flex: 1,
                  padding: '12px 8px',
                  background: 'transparent',
                  border: 'none',
                  color: mobileTab === tab.key ? 'var(--primary-color)' : 'var(--text-secondary)',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  borderBottom: mobileTab === tab.key ? '2px solid var(--primary-color)' : '2px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Grid - Responsive 3 Sections */}
        <div className="trading-main-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 280px 250px',
          gap: '0',
          background: 'var(--bg)',
          flex: 1,
          position: 'relative'
        }}>
          {/* Left: Chart Area */}
          <div
            className="chart-section"
            style={{
              background: 'var(--card-bg)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--card-shadow)',
              position: 'relative'
            }}
          >
            {/* Trading Chart */}
            <div style={{ flex: 1, minHeight: '400px', padding: '8px' }}>
              <TradingChart
                symbol={symbol}
                theme={theme}
                onCrosshairMove={(price: number) => {
                  if (orderType === 'limit') {
                    setPrice(price.toFixed(2));
                  }
                }}
              />
            </div>
          </div>

          {/* Middle: Order Book */}
          <div
            className="orderbook-section"
            style={{
              background: 'var(--card-bg)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--card-shadow)',
              position: 'relative'
            }}
          >
            {/* Order Book Tabs */}
            <div style={{
              display: 'flex',
              padding: '12px 16px',
              gap: '16px'
            }}>
              <button style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text)',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                borderBottom: '2px solid var(--primary-color)',
                padding: '4px 0'
              }}>
                Order book
              </button>
              <button style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                padding: '4px 0'
              }}>
                Market trades
              </button>
            </div>

            {/* Order Book */}
            <div style={{ flex: '1', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {/* Order Book Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                padding: '8px 16px',
                fontSize: '12px',
                color: 'var(--text-secondary)'
              }}>
                <div>Price (USDT)</div>
                <div style={{ textAlign: 'right' }}>Quantity (BTC)</div>
                <div style={{ textAlign: 'right' }}>Total</div>
              </div>

              {/* Sell Orders (Asks) - Red */}
              <div style={{ flex: '1', maxHeight: '37vh', overflowY: 'auto' }}>
                {orderBook?.asks && Array.isArray(orderBook.asks)
                  ? orderBook.asks.slice().reverse().slice(0, 15).map(([price, amount], index) => (
                    <div
                      key={`ask-${index}`}
                      onClick={() => {
                        setPrice(price.toString());
                        setOrderType('limit');
                      }}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        padding: '4px 16px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        position: 'relative',
                        background: 'var(--card-bg)'
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        background: 'rgba(246, 70, 93, 0.1)',
                        width: `${Math.min((amount / 10) * 100, 100)}%`,
                        zIndex: 0
                      }} />
                      <div style={{ color: '#f6465d', position: 'relative', zIndex: 1 }}>{formatPrice(price)}</div>
                      <div style={{ textAlign: 'right', position: 'relative', zIndex: 1 }}>{formatAmount(amount)}</div>
                      <div style={{ textAlign: 'right', position: 'relative', zIndex: 1 }}>{(price * amount).toFixed(2)}</div>
                    </div>
                  ))
                  : <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>No sell orders</div>
                }
              </div>

              {/* Current Price */}
              {ticker && (
                <div style={{
                  padding: '12px 16px',
                  background: 'var(--bg-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: ticker.priceChange >= 0 ? '#0ecb81' : '#f6465d' }}>
                    {formatPrice(ticker.lastPrice)}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    ${ticker.lastPrice.toFixed(2)}
                  </div>
                </div>
              )}

              {/* Buy Orders (Bids) - Green */}
              <div style={{ flex: '1', maxHeight: '25vh', overflowY: 'auto' }}>
                {orderBook?.bids && Array.isArray(orderBook.bids)
                  ? orderBook.bids.slice(0, 15).map(([price, amount], index) => (
                    <div
                      key={`bid-${index}`}
                      onClick={() => {
                        setPrice(price.toString());
                        setOrderType('limit');
                      }}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        padding: '4px 16px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        position: 'relative',
                        background: 'var(--card-bg)'
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        background: 'rgba(14, 203, 129, 0.1)',
                        width: `${Math.min((amount / 10) * 100, 100)}%`,
                        zIndex: 0
                      }} />
                      <div style={{ color: '#0ecb81', position: 'relative', zIndex: 1 }}>{formatPrice(price)}</div>
                      <div style={{ textAlign: 'right', position: 'relative', zIndex: 1 }}>{formatAmount(amount)}</div>
                      <div style={{ textAlign: 'right', position: 'relative', zIndex: 1 }}>{(price * amount).toFixed(2)}</div>
                    </div>
                  ))
                  : <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>No buy orders</div>
                }
              </div>
            </div>
          </div>

          {/* Right: Order Form */}
          <div
            className="trade-section"
            style={{
              background: 'var(--card-bg)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--card-shadow)',
              position: 'relative'
            }}
          >
            <div style={{
              padding: '12px',
              flex: 1
            }}>
              {/* Spot/Margin/Bots Tabs */}
              <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '12px',
                paddingBottom: '8px'
              }}>
                <button style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text)',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  borderBottom: '2px solid var(--primary-color)',
                  padding: '4px 0'
                }}>
                  Spot
                </button>
                <button style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  padding: '4px 0'
                }}>
                  Margin
                </button>
                <button style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  padding: '4px 0'
                }}>
                  Bots
                </button>
              </div>
              {/* Limit/Market/Stop-Limit Tabs */}
              <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '16px',
                background: 'var(--bg-secondary)',
                borderRadius: '4px',
                padding: '2px'
              }}>
                <button
                  onClick={() => setOrderType('limit')}
                  style={{
                    flex: 1,
                    padding: '6px 12px',
                    background: orderType === 'limit' ? 'var(--bg)' : 'transparent',
                    color: orderType === 'limit' ? 'var(--text)' : 'var(--text-secondary)',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Limit
                </button>
                <button
                  onClick={() => setOrderType('market')}
                  style={{
                    flex: 1,
                    padding: '6px 12px',
                    background: orderType === 'market' ? 'var(--bg)' : 'transparent',
                    color: orderType === 'market' ? 'var(--text)' : 'var(--text-secondary)',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Market
                </button>
              </div>

              {/* Buy/Sell Toggle */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                marginBottom: '16px'
              }}>
                <button
                  onClick={() => setSide('buy')}
                  style={{
                    padding: '10px',
                    background: side === 'buy' ? '#0ecb81' : 'var(--bg-secondary)',
                    color: side === 'buy' ? '#000' : '#0ecb81',
                    border: side === 'buy' ? 'none' : '1px solid #0ecb81',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Buy
                </button>
                <button
                  onClick={() => setSide('sell')}
                  style={{
                    padding: '10px',
                    background: side === 'sell' ? '#f6465d' : 'var(--bg-secondary)',
                    color: side === 'sell' ? '#000' : '#f6465d',
                    border: side === 'sell' ? 'none' : '1px solid #f6465d',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Sell
                </button>
              </div>

              {/* Available Balance */}
              <div style={{
                marginBottom: '16px',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>Available</span>
                {side === 'buy' ? (
                  <span style={{ color: 'var(--text)', fontWeight: 500 }}>
                    {userBalances.usdtBalance.toFixed(2)} {quoteCurrency}
                  </span>
                ) : (
                  <span style={{ color: 'var(--text)', fontWeight: 500 }}>
                    {baseCurrency === 'BTC' ? userBalances.btcBalance.toFixed(8) : '0'} {baseCurrency}
                  </span>
                )}
              </div>

              {/* Price Input (only for limit orders) */}
              {orderType === 'limit' && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontSize: '13px',
                    color: 'var(--text-secondary)'
                  }}>
                    Price
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      value={price || (ticker ? ticker.lastPrice.toFixed(2) : '')}
                      onChange={(e) => setPrice(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 45px 8px 10px',
                        border: 'none',
                        borderRadius: '4px',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text)',
                        fontSize: '13px'
                      }}
                    />
                    <span style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-secondary)',
                      fontSize: '13px'
                    }}>
                      USDT
                    </span>
                  </div>
                </div>
              )}

              {/* Amount Input */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '13px',
                  color: '#848e9c'
                }}>
                  Quantity
                </label>
                <div style={{ position: 'relative', maxWidth: '100%' }}>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d*\.?\d*$/.test(val)) {
                        setAmount(val);
                      }
                    }}
                    placeholder="0.00"
                    style={{
                      width: '100%',
                      maxWidth: '220px',
                      padding: '8px 45px 8px 10px',
                      border: 'none',
                      borderRadius: '4px',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text)',
                      fontSize: '13px'
                    }}
                  />
                  <span style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-secondary)',
                    fontSize: '13px'
                  }}>
                    BTC
                  </span>
                </div>
              </div>

              {/* Percentage Slider */}
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedPercentage}
                  onChange={(e) => handlePercentageSelect(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    height: '4px',
                    borderRadius: '2px',
                    background: 'var(--border-color)',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '8px',
                  fontSize: '12px',
                  color: 'var(--text-secondary)'
                }}>
                  {[0, 25, 50, 75, 100].map(percent => (
                    <span
                      key={percent}
                      onClick={() => handlePercentageSelect(percent)}
                      style={{ cursor: 'pointer' }}
                    >
                      {percent}%
                    </span>
                  ))}
                </div>
              </div>

              {/* Total (Price * Amount) */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '13px',
                  color: '#848e9c'
                }}>
                  Total
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={calculateTotal()}
                    disabled
                    style={{
                      width: '100%',
                      padding: '8px 45px 8px 10px',
                      border: 'none',
                      borderRadius: '4px',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)',
                      fontSize: '13px'
                    }}
                  />
                  <span style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-secondary)',
                    fontSize: '13px'
                  }}>
                    USDT
                  </span>
                </div>
              </div>

              {/* TP/SL Option */}
              <div style={{
                marginBottom: '16px',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>Time in force</span>
                <span style={{ color: 'var(--text)' }}>GTC ▼</span>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmitOrder}
                disabled={isOrderProcessing}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: 600,
                  borderRadius: '4px',
                  cursor: isOrderProcessing ? 'not-allowed' : 'pointer',
                  border: 'none',
                  background: side === 'buy' ? '#0ecb81' : '#f6465d',
                  color: '#000',
                  opacity: isOrderProcessing ? 0.7 : 1,
                  transition: 'opacity 0.2s'
                }}
              >
                {isOrderProcessing ? 'Processing...' : side === 'buy' ? 'Buy' : 'Sell'}
              </button>

              {/* Error Message */}
              {error && (
                <div style={{
                  color: '#f6465d',
                  marginTop: '12px',
                  padding: '10px',
                  borderRadius: '4px',
                  background: 'rgba(246, 70, 93, 0.1)',
                  fontSize: '13px',
                  border: '1px solid rgba(246, 70, 93, 0.2)'
                }}>
                  {error}
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div style={{
                  color: '#0ecb81',
                  marginTop: '12px',
                  padding: '10px',
                  borderRadius: '4px',
                  background: 'rgba(14, 203, 129, 0.1)',
                  fontSize: '13px',
                  border: '1px solid rgba(14, 203, 129, 0.2)'
                }}>
                  {success}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles - 1000000% INVISIBLE */}
      <style>
        {`
          /* Webkit browsers (Chrome, Safari, Edge) - COMPLETELY HIDDEN */
          ::-webkit-scrollbar {
            width: 0px !important;
            height: 0px !important;
            display: none !important;
          }

          ::-webkit-scrollbar-track {
            display: none !important;
          }

          ::-webkit-scrollbar-thumb {
            display: none !important;
          }

          ::-webkit-scrollbar-corner {
            display: none !important;
          }

          /* Firefox - COMPLETELY HIDDEN */
          * {
            scrollbar-width: none !important;
          }

          /* Internet Explorer/Edge Legacy - COMPLETELY HIDDEN */
          * {
            -ms-overflow-style: none !important;
          }

          /* All scrollable elements - FORCE INVISIBLE */
          div[style*="overflow"] {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }

          div[style*="overflow"]::-webkit-scrollbar {
            width: 0px !important;
            height: 0px !important;
            display: none !important;
          }

          /* Order book specific - INVISIBLE */
          div[style*="overflowY: 'auto'"],
          div[style*="overflowX: 'auto'"] {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }

          div[style*="overflowY: 'auto'"]::-webkit-scrollbar,
          div[style*="overflowX: 'auto'"]::-webkit-scrollbar {
            width: 0px !important;
            height: 0px !important;
            display: none !important;
          }

          /* Mobile responsiveness - Complete overhaul */
          
          /* Prevent horizontal scroll globally */
          body {
            overflow-x: hidden !important;
            max-width: 100vw !important;
          }
          
          /* Large tablets */
          @media (max-width: 1200px) {
            .trading-main-grid {
              grid-template-columns: 1fr 250px 220px !important;
            }
          }

          /* Small tablets and large phones */
          @media (max-width: 1024px) {
            .mobile-tab-nav {
              display: block !important;
            }
            
            .trading-main-grid {
              grid-template-columns: 1fr !important;
              height: calc(100vh - 200px) !important;
              min-height: 500px !important;
              max-height: 800px !important;
              overflow: hidden !important;
              position: relative !important;
            }
            
            .chart-section,
            .orderbook-section,
            .trade-section {
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              right: 0 !important;
              bottom: 0 !important;
              width: 100% !important;
              height: 100% !important;
              min-height: 500px !important;
              transition: transform 0.3s ease, opacity 0.3s ease !important;
              z-index: 1 !important;
              overflow-y: auto !important;
              overflow-x: hidden !important;
              background: var(--card-bg) !important;
            }
            
            /* Default state - all sections hidden except chart */
            .chart-section {
              transform: translateX(0) !important;
              z-index: 3 !important;
              opacity: 1 !important;
            }
            
            .orderbook-section {
              transform: translateX(-100%) !important;
              z-index: 2 !important;
              opacity: 0 !important;
            }
            
            .trade-section {
              transform: translateX(-200%) !important;
              z-index: 1 !important;
              opacity: 0 !important;
            }
          }

          /* Mobile phones */
          @media (max-width: 768px) {
            * {
              -webkit-tap-highlight-color: rgba(0,0,0,0.1);
            }
            
            .trading-page {
              overflow-x: hidden !important;
              padding: 0 8px !important;
              gap: 0 !important;
            }
            
            .trading-page > div:first-child {
              margin-bottom: 0 !important;
            }
            
            .trading-ticker-bar {
              padding: 8px 4px !important;
              overflow-x: auto !important;
              -webkit-overflow-scrolling: touch !important;
              margin: 0 -4px !important;
            }
            
            .trading-ticker-bar > div {
              gap: 12px !important;
              min-width: max-content !important;
            }
            
            .trading-pair-header {
              padding: 12px 12px !important;
              margin: 0 -4px !important;
              overflow: visible !important;
            }
            
            .trading-pair-header h1 {
              font-size: 18px !important;
            }
            
            .trading-pair-header > div:first-child {
              flex-wrap: wrap !important;
              gap: 8px 12px !important;
            }
            
            .trading-pair-header > div:first-child > div {
              font-size: 16px !important;
            }
            
            .trading-pair-header > div:last-child {
              flex-wrap: wrap !important;
              gap: 8px !important;
              font-size: 11px !important;
            }
            
            .trading-pair-header > div:last-child > div {
              white-space: nowrap !important;
            }
            
            /* Trading form improvements */
            .trade-section > div {
              padding: 8px !important;
            }

            /* Chart container mobile fix */
            .chart-section > div {
              min-height: 400px !important;
            }
            
            /* Trade section tabs (Spot, Margin, Bots) */
            .trade-section .tab-nav button {
              padding: 6px 8px !important;
              font-size: 12px !important;
              min-height: 32px !important;
            }
            
            /* Order type buttons (Limit, Market, OCO) */
            .trade-section .order-type-buttons button {
              padding: 6px 12px !important;
              font-size: 11px !important;
              min-height: 28px !important;
              border-radius: 4px !important;
            }
            
            /* Buy/Sell buttons */
            .trade-section .buy-sell-buttons button {
              padding: 10px 8px !important;
              font-size: 14px !important;
              min-height: 40px !important;
              border-radius: 6px !important;
            }
            
            .trade-section input {
              padding: 8px 35px 8px 8px !important;
              font-size: 14px !important;
              min-height: 36px !important;
              box-sizing: border-box !important;
              -webkit-appearance: none !important;
              border-radius: 6px !important;
            }
            
            .trade-section button {
              padding: 8px 6px !important;
              font-size: 12px !important;
              min-height: 36px !important;
              touch-action: manipulation !important;
              -webkit-tap-highlight-color: transparent !important;
              border-radius: 6px !important;
            }
            
            .trade-section select {
              padding: 8px !important;
              font-size: 14px !important;
              min-height: 36px !important;
              -webkit-appearance: none !important;
            }
            
            /* Labels and text */
            .trade-section label {
              font-size: 11px !important;
              margin-bottom: 4px !important;
            }
            
            /* Available balance text */
            .trade-section .balance-text {
              font-size: 10px !important;
            }
            
            /* Order book mobile optimization */
            .orderbook-section {
              padding: 0 !important;
            }
            
            .orderbook-section > div:first-child {
              padding: 8px 12px !important;
            }
            
            .orderbook-section table {
              font-size: 12px !important;
            }
            
            .orderbook-section td,
            .orderbook-section th {
              padding: 6px 8px !important;
            }
            
            /* Chart mobile optimization */
            .chart-section > div {
              padding: 0 !important;
              min-height: 350px !important;
            }
            
            .mobile-tab-nav {
              position: sticky !important;
              top: 0 !important;
              z-index: 10 !important;
            }
          }

          /* Small mobile phones */
          @media (max-width: 480px) {
            .trading-page {
              padding: 0 4px !important;
            }
            
            .mobile-tab-nav {
              padding: 0 8px !important;
            }
            
            .mobile-tab-nav button {
              padding: 12px 8px !important;
              font-size: 14px !important;
              gap: 4px !important;
            }
            
            .mobile-tab-nav button span {
              font-size: 12px !important;
            }
            
            .trading-ticker-bar {
              margin: 0 -4px !important;
            }
            
            .trading-pair-header {
              padding: 10px 12px !important;
              margin: 0 -4px !important;
            }
            
            .trading-pair-header h1 {
              font-size: 16px !important;
            }
            
            .trading-pair-header > div:first-child > div {
              font-size: 14px !important;
            }
            
            .trading-pair-header > div:last-child {
              gap: 6px !important;
            }
            
            .trading-pair-header > div:last-child > div {
              font-size: 10px !important;
            }
            
            .chart-section > div {
              min-height: 300px !important;
            }
            
            .trade-section input {
              font-size: 14px !important;
              padding: 6px 30px 6px 8px !important;
              min-height: 32px !important;
            }
            
            .trade-section button {
              font-size: 11px !important;
              min-height: 32px !important;
              padding: 6px 4px !important;
            }
            
            .trade-section .buy-sell-buttons button {
              font-size: 12px !important;
              min-height: 36px !important;
              padding: 8px 6px !important;
            }
            
            .orderbook-section table {
              font-size: 11px !important;
            }
            
            .orderbook-section td,
            .orderbook-section th {
              padding: 4px 6px !important;
            }
          }
          
          /* Dynamic mobile tab switching */
          @media (max-width: 1024px) {
            body[data-mobile-tab="chart"] .chart-section {
              transform: translateX(0) !important;
              z-index: 3 !important;
              opacity: 1 !important;
              visibility: visible !important;
            }
            body[data-mobile-tab="chart"] .orderbook-section {
              transform: translateX(-100%) !important;
              z-index: 2 !important;
              opacity: 0 !important;
              visibility: hidden !important;
            }
            body[data-mobile-tab="chart"] .trade-section {
              transform: translateX(-200%) !important;
              z-index: 1 !important;
              opacity: 0 !important;
              visibility: hidden !important;
            }
            
            body[data-mobile-tab="orderbook"] .chart-section {
              transform: translateX(100%) !important;
              z-index: 1 !important;
              opacity: 0 !important;
              visibility: hidden !important;
            }
            body[data-mobile-tab="orderbook"] .orderbook-section {
              transform: translateX(0) !important;
              z-index: 3 !important;
              opacity: 1 !important;
              visibility: visible !important;
            }
            body[data-mobile-tab="orderbook"] .trade-section {
              transform: translateX(-100%) !important;
              z-index: 2 !important;
              opacity: 0 !important;
              visibility: hidden !important;
            }
            
            body[data-mobile-tab="trade"] .chart-section {
              transform: translateX(200%) !important;
              z-index: 1 !important;
              opacity: 0 !important;
              visibility: hidden !important;
            }
            body[data-mobile-tab="trade"] .orderbook-section {
              transform: translateX(100%) !important;
              z-index: 2 !important;
              opacity: 0 !important;
              visibility: hidden !important;
            }
            body[data-mobile-tab="trade"] .trade-section {
              transform: translateX(0) !important;
              z-index: 3 !important;
              opacity: 1 !important;
              visibility: visible !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Trading;
