import React from 'react';
import { Helmet } from 'react-helmet-async';
import { CheckCircle2, CircleDollarSign, ShieldCheck, Sparkles, TrendingUp, Users } from 'lucide-react';

const stats = [
  { value: '$2.4B+', label: '24h trading volume' },
  { value: '140+', label: 'global markets' },
  { value: '99.98%', label: 'platform uptime' },
];

const features = [
  {
    icon: ShieldCheck,
    title: 'Institution-grade security',
    description: 'Multi-layer protection, cold storage, and real-time risk monitoring keep every transaction protected.',
  },
  {
    icon: TrendingUp,
    title: 'Smart investing tools',
    description: 'Trade, stake, and grow with precision dashboards built for confident portfolio decisions.',
  },
  {
    icon: CircleDollarSign,
    title: 'Fast deposits & withdrawals',
    description: 'Move funds quickly with low-friction crypto rails and streamlined asset management.',
  },
  {
    icon: Users,
    title: 'Built for modern investors',
    description: 'Join a premium ecosystem designed for individuals, teams, and long-term builders.',
  },
];

const steps = [
  'Create your KingsHall profile in minutes.',
  'Fund your account with crypto or supported payment rails.',
  'Trade, invest, and track your growth in one elegant dashboard.',
];

const LandingPage = () => (
  <>
    <Helmet>
      <title>KingsHall Exchange | Modern Crypto Trading & Investing</title>
      <meta
        name="description"
        content="KingsHall Exchange is a sleek crypto exchange and investment app with secure trading, fast transfers, and premium portfolio tools."
      />
    </Helmet>

    <main className="min-h-screen bg-[#050816] text-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_35%),radial-gradient(circle_at_80%_20%,_rgba(168,85,247,0.22),_transparent_30%),linear-gradient(180deg,_#09111f_0%,_#050816_100%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />

        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 lg:px-10">
          <header className="flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-xl">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">KingsHall Exchange</p>
              <p className="text-sm text-white/60">Crypto exchange & investment platform</p>
            </div>
            <button className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15">
              Get Started
            </button>
          </header>

          <div className="grid flex-1 items-center gap-14 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-0">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
                <Sparkles className="h-4 w-4" />
                Premium trading experience for modern investors
              </div>
              <h1 className="text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
                Trade smarter.
                <span className="block bg-gradient-to-r from-cyan-300 via-white to-violet-300 bg-clip-text text-transparent">
                  Invest with confidence.
                </span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70 sm:text-xl">
                KingsHall Exchange brings together crypto trading, portfolio growth, staking, and instant transfers in a clean,
                modern experience built for serious users.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <button className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#050816] transition hover:scale-[1.02]">
                  Start trading
                </button>
                <button className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                  Explore the platform
                </button>
              </div>

              <div className="mt-12 grid gap-4 sm:grid-cols-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
                    <div className="text-2xl font-semibold text-white">{stat.value}</div>
                    <div className="mt-2 text-sm text-white/60">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-cyan-400/20 via-violet-500/20 to-transparent blur-3xl" />
              <div className="relative rounded-[2rem] border border-white/10 bg-white/8 p-6 shadow-2xl shadow-cyan-500/10 backdrop-blur-2xl">
                <div className="rounded-[1.5rem] border border-white/10 bg-[#0b1220]/80 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/50">Portfolio value</p>
                      <p className="mt-1 text-3xl font-semibold text-white">$128,480.22</p>
                    </div>
                    <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-medium text-emerald-300">
                      +18.4% this month
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-white/40">Active balance</p>
                      <p className="mt-3 text-2xl font-semibold text-white">4.82 BTC</p>
                      <p className="mt-2 text-sm text-white/60">Diversified across spot and staking.</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-white/40">Security score</p>
                      <div className="mt-3 flex items-center gap-2 text-2xl font-semibold text-white">
                        <CheckCircle2 className="h-6 w-6 text-cyan-300" />
                        98/100
                      </div>
                      <p className="mt-2 text-sm text-white/60">Encrypted, verified, and monitored.</p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    {['Bitcoin', 'Ethereum', 'Solana'].map((asset, index) => (
                      <div key={asset} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                        <span className="text-sm font-medium text-white">{asset}</span>
                        <span className="text-sm text-emerald-300">{['+12.2%', '+8.5%', '+15.1%'][index]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section className="grid gap-4 pb-8 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                  <Icon className="h-6 w-6 text-cyan-300" />
                  <h2 className="mt-4 text-lg font-semibold text-white">{feature.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-white/65">{feature.description}</p>
                </article>
              );
            })}
          </section>

          <section className="mb-10 rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl lg:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">How it works</p>
                <h2 className="mt-3 text-3xl font-semibold text-white">A smooth path from signup to growth.</h2>
              </div>
              <div className="grid gap-4">
                {steps.map((step, index) => (
                  <div key={step} className="flex gap-4 rounded-2xl border border-white/10 bg-[#0a1020]/70 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-sm font-semibold text-cyan-300">
                      0{index + 1}
                    </div>
                    <p className="pt-2 text-sm leading-6 text-white/75">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  </>
);

export default LandingPage;
