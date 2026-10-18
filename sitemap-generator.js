// sitemap-generator.js
const { SitemapStream, streamToPromise } = require('sitemap');
const { createWriteStream } = require('fs');
const { Readable } = require('stream');
const path = require('path');

// ...existing code...
// Keep the sitemap routes in sync with your `client/src/index.tsx` routes for accurate indexing.
const links = [
  { url: '/', changefreq: 'daily', priority: 1.0 },
  // Public, crawlable pages (use the actual route paths that your app uses)
// ...existing code...
  { url: '/co', changefreq: 'monthly', priority: 0.6 }, // Contact
  { url: '/l', changefreq: 'monthly', priority: 0.3 }, // Login (optional)
  { url: '/r', changefreq: 'monthly', priority: 0.3 }, // Register (optional)
  { url: '/ve', changefreq: 'monthly', priority: 0.2 }, // Verify Email
  { url: '/al', changefreq: 'monthly', priority: 0.2 }, // Admin Login (optional)
  { url: '/as', changefreq: 'monthly', priority: 0.2 }  // Admin Signup (optional)
];

const hostname = 'https://www.tradespot.online';
const sitemap = new SitemapStream({ hostname });

streamToPromise(Readable.from(links).pipe(sitemap))
  .then((data) => {
    const outPath = path.join(__dirname, 'public', 'sitemap.xml');
    createWriteStream(outPath).end(data);
    // Helpful console output for CI or local runs
    // eslint-disable-next-line no-console
    console.log(`Sitemap written to ${outPath} (${links.length} URLs)`);
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Failed to generate sitemap:', err && err.message ? err.message : err);
    process.exitCode = 1;
  });
