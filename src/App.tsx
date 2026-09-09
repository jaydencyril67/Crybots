import './App.css'

const marketHighlights = [
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

const features = [
  'Real-time portfolio tracking',
  'Custom price alerts',
  'Clean risk overview',
]

function App() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">K</span>
          <div>
            <p className="brand-name">KINGSHALL EXCHANGE</p>
            <p className="brand-tagline">Modern crypto investing, built simple</p>
          </div>
        </div>
        <div className="topbar-actions">
          <button type="button" className="ghost-button">
            Sign in
          </button>
          <button type="button" className="primary-action">
            Get started
          </button>
        </div>
      </header>

      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">Trusted digital asset platform</p>
          <h1>Invest in crypto with clarity and confidence.</h1>
          <p className="lead">
            KINGSHALL EXCHANGE gives you a premium, streamlined home for managing your
            portfolio, monitoring the market, and staying ahead with organized insights.
          </p>

          <ul className="feature-list">
            {features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>

          <div className="hero-actions">
            <button type="button" className="primary-action">
              Start investing
            </button>
            <button type="button" className="secondary-action">
              Explore markets
            </button>
          </div>
        </div>

        <aside className="hero-panel">
          <div className="hero-panel-header">
            <p className="eyebrow">Live overview</p>
            <span className="status-pill">Market open</span>
          </div>
          <div className="hero-metric">
            <p className="hero-metric-label">Portfolio growth</p>
            <p className="hero-metric-value">+18.4%</p>
            <p className="hero-metric-note">Consistent performance over the last 30 days.</p>
          </div>
          <div className="mini-chart" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="hero-stats">
            {marketHighlights.slice(0, 2).map((item) => (
              <article key={item.label}>
                <p className="stat-value">{item.value}</p>
                <p className="stat-label">{item.label}</p>
              </article>
            ))}
          </div>
        </aside>
      </section>

      <section className="stats-grid" aria-label="Portfolio summary">
        {marketHighlights.map((item) => (
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
          <p className="panel-note">A crisp, organized list for high-priority opportunities.</p>
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
