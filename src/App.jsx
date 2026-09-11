import './App.css'

const marketStats = [
  {
    label: 'Portfolio value',
    value: '$128,540',
    change: '+18.4% this month',
  },
  {
    label: 'Assets tracked',
    value: '24',
    change: 'Across spot and staking',
  },
  {
    label: 'Monitoring',
    value: '24/7',
    change: 'Alerts for moves and risk',
  },
]

const watchlist = [
  { symbol: 'BTC', name: 'Bitcoin', price: '$68,420', change: '+4.8%' },
  { symbol: 'ETH', name: 'Ethereum', price: '$3,740', change: '+3.2%' },
  { symbol: 'SOL', name: 'Solana', price: '$182', change: '+6.1%' },
]

const features = [
  'Smart diversification across leading digital assets',
  'Real-time risk signals and portfolio alerts',
  'Simple recurring investments and auto rebalancing',
]

function App() {
  return (
    <main className="app-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Kingshall Exchange</p>
          <h1>Build wealth with a modern crypto portfolio.</h1>
          <p className="hero-text">
            Track assets, monitor market shifts, and invest with clarity from a
            single streamlined dashboard.
          </p>

          <div className="hero-actions">
            <a className="primary-action" href="#watchlist">
              Start investing
            </a>
            <a className="secondary-action" href="#features">
              Explore features
            </a>
          </div>

          <ul className="stats-grid" aria-label="Portfolio highlights">
            {marketStats.map((stat) => (
              <li key={stat.label} className="stat-card">
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
                <small>{stat.change}</small>
              </li>
            ))}
          </ul>
        </div>

        <div className="hero-panel">
          <div className="panel-header">
            <span>Live portfolio</span>
            <span className="status-pill">Monitoring active</span>
          </div>

          <div className="portfolio-summary">
            <p>Net gain today</p>
            <strong>+$4,210.88</strong>
            <span>+3.86% since market open</span>
          </div>

          <div className="panel-section" id="watchlist">
            <h2>Watchlist</h2>
            <ul className="watchlist">
              {watchlist.map((asset) => (
                <li key={asset.symbol} className="watchlist-item">
                  <div>
                    <strong>{asset.symbol}</strong>
                    <span>{asset.name}</span>
                  </div>
                  <div>
                    <strong>{asset.price}</strong>
                    <span className="positive">{asset.change}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="features" id="features">
        <div>
          <p className="eyebrow">Why traders choose us</p>
          <h2>Everything you need to manage a crypto strategy.</h2>
        </div>
        <ul className="feature-list">
          {features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </section>
    </main>
  )
}

export default App
