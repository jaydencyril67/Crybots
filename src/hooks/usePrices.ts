import { useState, useEffect } from 'react';
import { priceService, PriceData, ExchangeRates } from '../services/priceService';

// Hook for getting all prices
export const usePrices = () => {
  const [prices, setPrices] = useState<Map<string, PriceData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Start the price service
    priceService.start();

    // Subscribe to price updates
    const unsubscribe = priceService.subscribe((newPrices) => {
      setPrices(newPrices);
      setLoading(false);
      setError(null);
    });

    // Handle errors by checking if we have recent data
    const errorCheck = setInterval(() => {
      const btcPrice = priceService.getPrice('BTC');
      if (btcPrice && Date.now() - btcPrice.lastUpdated > 120000) { // 2 minutes old
        setError('Price data is stale. Refreshing...');
      }
    }, 60000); // Check every minute

    return () => {
      unsubscribe();
      clearInterval(errorCheck);
    };
  }, []);

  // Convert Map to Array for easier use in components
  const pricesArray = Array.from(prices.values());

  return {
    prices: pricesArray,
    pricesMap: prices,
    loading,
    error,
    getPrice: (symbol: string) => priceService.getPrice(symbol)
  };
};

// Hook for getting exchange rates (BTC/USDT)
export const useExchangeRates = () => {
  const [rates, setRates] = useState<ExchangeRates>({ 
    btcToUsdt: 0, 
    usdtToBtc: 0, 
    lastUpdated: 0 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Start the price service
    priceService.start();

    // Subscribe to rate updates
    const unsubscribe = priceService.subscribeToRates((newRates) => {
      setRates(newRates);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { rates, loading };
};

// Hook for getting a specific coin price
export const useCoinPrice = (symbol: string) => {
  const [price, setPrice] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Start the price service
    priceService.start();

    // Subscribe to price updates
    const unsubscribe = priceService.subscribe((prices) => {
      const coinPrice = prices.get(symbol.toUpperCase());
      setPrice(coinPrice || null);
      setLoading(false);
    });

    return unsubscribe;
  }, [symbol]);

  return { price, loading };
};
