import './App.css'

const portfolioHighlights = [
  {
    value: '$128.4k',
    label: 'Portfolio value',
    change: '+12.8% this month',
  },
  {
    value: '18',
    label: 'Assets tracked',
    change: '5 watchlisted for alerts',
  },
  {
    value: '24/7',
    label: 'Market monitoring',
    change: 'Auto alerts for price moves',
  },
]

const watchlist = [
  { symbol: 'BTC', name: 'Bitcoin', price: '$63,240', change: '+4.2%' },
  { symbol: 'ETH', name: 'Ethereum', price: '$3,510', change: '+2.1%' },
  { symbol: 'SOL', name: 'Solana', price: '$142', change: '+7.8%' },
]

function App() {
  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">Crypto investment dashboard</p>
        <h1>Track your digital assets with confidence.</h1>
        <p className="lead">
          Start with a clean React + TypeScript foundation for portfolio tracking,
          watchlists, and market insights.
        </p>

        <div className="hero-actions">
          <button type="button" className="primary-action">
            Create portfolio
          </button>
          <button type="button" className="secondary-action">
            View watchlist
          </button>
        </div>
      </section>

      <section className="stats-grid" aria-label="Portfolio summary">
        {portfolioHighlights.map((item) => (
          <article key={item.label} className="stat-card">
            <p className="stat-value">{item.value}</p>
            <p className="stat-label">{item.label}</p>
            <p className="stat-change">{item.change}</p>
          </article>
        ))}
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Market watchlist</p>
            <h2>Top assets to monitor</h2>
          </div>
          <p className="panel-note">Live pricing and alerts will be added next.</p>
        </div>

        <div className="asset-list">
          {watchlist.map((asset) => (
            <article key={asset.symbol} className="asset-row">
              <div>
                <p className="asset-symbol">{asset.symbol}</p>
                <p className="asset-name">{asset.name}</p>
              </div>
              <div className="asset-metrics">
                <p className="asset-price">{asset.price}</p>
                <p className="asset-change">{asset.change}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default App
