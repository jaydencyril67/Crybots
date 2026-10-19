// Keep this sitemap limited to confirmed public, canonical URLs.
// Add further URLs only after verifying that they are public and intended for search.
const { SitemapStream, streamToPromise } = require('sitemap');
const { createWriteStream } = require('fs');
const { Readable } = require('stream');
const path = require('path');

const links = [
  { url: '/', changefreq: 'weekly', priority: 1.0 },
];

const hostname = 'https://crybots.kingshall.online';
const sitemap = new SitemapStream({ hostname });

streamToPromise(Readable.from(links).pipe(sitemap))
  .then((data) => {
    const outPath = path.join(__dirname, 'public', 'sitemap.xml');
    createWriteStream(outPath).end(data);
    console.log(`Sitemap written to ${outPath} (${links.length} URLs)`);
  })
  .catch((err) => {
    console.error('Failed to generate sitemap:', err && err.message ? err.message : err);
    process.exitCode = 1;
  });
