/**
 * External coin image utilities
 * Replace local assets with CDN URLs to reduce bundle size
 */

// Option 1: CoinGecko CDN (Recommended - Free, reliable, high quality)
export const getCoinGeckoImage = (coinId: string): string => {
  return `https://assets.coingecko.com/coins/images/${getCoinGeckoImageId(coinId)}/large/${coinId}.png`;
};

const getCoinGeckoImageId = (coinId: string): number => {
  const imageIds: Record<string, number> = {
    bitcoin: 1,
    ethereum: 279,
    binancecoin: 825,
    cardano: 975,
    solana: 4128,
    dogecoin: 5,
    chainlink: 877,
    tron: 1094,
    litecoin: 2,
  };
  return imageIds[coinId] || 1;
};

// Option 2: CryptoCompare CDN (Alternative - Good fallback)
export const getCryptoCompareImage = (symbol: string): string => {
  return `https://www.cryptocompare.com/media/${getCryptoCompareImageId(symbol)}`;
};

const getCryptoCompareImageId = (symbol: string): string => {
  const imageIds: Record<string, string> = {
    BTC: '19633/btc.png',
    ETH: '20646/eth.png',
    BNB: '40482/bnb.png',
    ADA: '20022/ada.png',
    SOL: '41235/sol.png',
    DOGE: '19884/doge.png',
    LINK: '877/chainlink.png',
    TRX: '1094/tron.png',
    LTC: '19782/litecoin.png',
  };
  return imageIds[symbol] || '19633/btc.png';
};

// Option 3: CoinMarketCap CDN (Direct - Simple approach)
export const getCoinMarketCapImage = (symbol: string): string => {
  // Convert symbol to lowercase for URL
  const symbolLower = symbol.toLowerCase();
  return `https://s2.coinmarketcap.com/static/img/coins/64x64/${getCoinMarketCapId(symbolLower)}.png`;
};

const getCoinMarketCapId = (symbol: string): number => {
  const coinIds: Record<string, number> = {
    btc: 1,
    eth: 1027,
    bnb: 1839,
    ada: 2010,
    sol: 16176,
    doge: 5,
    link: 877,
    trx: 1094,
    ltc: 2,
  };
  return coinIds[symbol] || 1;
};

// Preferred method: Use CoinGecko with fallback
export const getCoinImage = (coinId: string, symbol: string): string => {
  // Try CoinGecko first (best quality)
  const coinGeckoUrl = `https://assets.coingecko.com/coins/images/${getCoinGeckoImageId(coinId)}/large/${coinId}.png`;
  
  // Return the URL - the actual fetch will happen in the component
  return coinGeckoUrl;
};

// Simple CDN URL generator (Most flexible)
export const getCryptoIconUrl = (symbol: string): string => {
  const symbolLower = symbol.toLowerCase();
  return `https://assets.coingecko.com/coins/images/${getCoinGeckoImageIdBySymbol(symbol)}/large/${symbolLower}.png`;
};

const getCoinGeckoImageIdBySymbol = (symbol: string): number => {
  const imageIds: Record<string, number> = {
    BTC: 1,
    ETH: 279,
    BNB: 825,
    ADA: 975,
    SOL: 4128,
    DOGE: 5,
    LINK: 877,
    TRX: 1094,
    LTC: 2,
  };
  return imageIds[symbol] || 1;
};

// Alternative: Use a simple service
export const getSimpleCryptoImage = (symbol: string): string => {
  return `https://cryptoicons.org/api/icon/${symbol.toLowerCase()}/200`;
};

