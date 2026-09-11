import React, { useEffect, useRef, useState } from 'react';

interface TradingChartProps {
  symbol: string;
  theme: 'light' | 'dark';
  onCrosshairMove?: (price: number) => void;
}

const TradingChart: React.FC<TradingChartProps> = ({ symbol, theme, onCrosshairMove }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [timeframe, setTimeframe] = useState<string>('1');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize TradingView chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    setIsLoading(true);
    setError(null);

    // Convert symbol format (e.g., BTC/USDT -> BTCUSDT)
    const tradingViewSymbol = `BINANCE:${symbol.replace('/', '')}`;

    // Clear the container
    chartContainerRef.current.innerHTML = '';

    try {
      // Create widget container div
      const widgetContainer = document.createElement('div');
      widgetContainer.className = 'tradingview-widget-container';
      widgetContainer.style.height = '100%';
      widgetContainer.style.width = '100%';

      // Create widget div
      const widgetDiv = document.createElement('div');
      widgetDiv.className = 'tradingview-widget-container__widget';
      widgetDiv.style.height = '100%';
      widgetDiv.style.width = '100%';

      // Create script element with widget configuration
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
      script.async = true;

      // Widget configuration
      const config = {
        "autosize": true,
        "symbol": tradingViewSymbol,
        "interval": timeframe,
        "timezone": "Etc/UTC",
        "theme": theme === 'dark' ? 'dark' : 'light',
        "style": "1",
        "locale": "en",
        "toolbar_bg": theme === 'dark' ? "#131722" : "#ffffff",
        "enable_publishing": false,
        "allow_symbol_change": false,
        "calendar": false,
        "support_host": "https://www.tradingview.com"
      };

      script.innerHTML = JSON.stringify(config);

      // Append elements
      widgetContainer.appendChild(widgetDiv);
      widgetContainer.appendChild(script);
      chartContainerRef.current.appendChild(widgetContainer);

      // Set up load detection
      const checkLoad = () => {
        const iframe = widgetContainer.querySelector('iframe');
        if (iframe) {
          setIsLoading(false);
        } else {
          setTimeout(checkLoad, 500);
        }
      };

      // Start checking after a delay
      setTimeout(() => {
        checkLoad();
        // Also set a maximum timeout
        setTimeout(() => {
          setIsLoading(false);
        }, 5000);
      }, 1000);

    } catch (err) {
      console.error('Error initializing TradingView chart:', err);
      setError('Failed to initialize chart');
      setIsLoading(false);
    }

    return () => {
      if (chartContainerRef.current) {
        chartContainerRef.current.innerHTML = '';
      }
    };
  }, [symbol, theme, timeframe]);

  // Handle timeframe changes
  const handleTimeframeChange = (tf: string) => {
    // Convert timeframe to TradingView format
    const tvTimeframes: { [key: string]: string } = {
      '1m': '1',
      '5m': '5', 
      '15m': '15',
      '1h': '60',
      '4h': '240',
      '1d': '1D'
    };
    
    const newTimeframe = tvTimeframes[tf] || '1D';
    setTimeframe(newTimeframe);
    // Widget will recreate with new timeframe on next useEffect
  };

  return (
    <div className="trading-chart-container" style={{ position: 'relative', width: '100%' }}>
      <div className="trading-chart-controls" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: '10px',
        padding: '0 10px' 
      }}>
        <div className="timeframe-selector" style={{ display: 'flex', gap: '5px' }}>
          {['1m', '5m', '15m', '1h', '4h', '1d'].map((tf) => {
            const tvTimeframes: { [key: string]: string } = {
              '1m': '1',
              '5m': '5', 
              '15m': '15',
              '1h': '60',
              '4h': '240',
              '1d': '1D'
            };
            const isActive = timeframe === (tvTimeframes[tf] || '1D');
            return (
              <button
                key={tf}
                onClick={() => handleTimeframeChange(tf)}
                style={{
                  background: isActive ? 'var(--primary-color)' : 'var(--bg-secondary)',
                  color: isActive ? 'white' : 'var(--text)',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '5px 10px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  transition: 'all 0.2s ease'
                }}
              >
                {tf}
              </button>
            );
          })}
        </div>
      </div>
      <div
        style={{
          position: 'relative',
          height: '500px',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: theme === 'dark' ? '#131722' : '#ffffff'
        }}
      >
        <div
          ref={chartContainerRef}
          className="trading-chart"
          style={{ 
            height: '100%',
            width: '100%'
          }}
        />
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme === 'dark' ? '#131722' : '#ffffff',
            color: 'var(--text-secondary)',
            fontSize: '14px',
            zIndex: 10
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '10px' }}>
                <div className="spinner" style={{
                  width: '30px',
                  height: '30px',
                  border: '3px solid var(--border-color)',
                  borderTop: '3px solid var(--primary-color)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto'
                }}></div>
              </div>
              Loading TradingView Chart...
            </div>
          </div>
        )}
        {error && (
          <div style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme === 'dark' ? '#131722' : '#ffffff',
            color: '#f6465d',
            fontSize: '14px',
            zIndex: 10
          }}>
            <div style={{ textAlign: 'center' }}>
              <div>⚠️ Chart Error</div>
              <div style={{ fontSize: '12px', marginTop: '5px' }}>{error}</div>
            </div>
          </div>
        )}
      </div>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default TradingChart;
