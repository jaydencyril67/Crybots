const fs = require('fs');
const path = require('path');

const root = process.cwd();
const appFile = path.join(root, 'src/index.tsx');
const generatedFile = path.join(root, 'src/utils/generatedPageRoutes.ts');
const source = fs.readFileSync(appFile, 'utf8');
const oldText = fs.existsSync(generatedFile) ? fs.readFileSync(generatedFile, 'utf8') : '';
const routes = new Map();

const add = (label, route) => {
  if (!route || !route.startsWith('/') || route.startsWith('/admin')) return;
  const safeRoute = route.replace(/\/+$/, '') || '/';
  if (!routes.has(safeRoute)) routes.set(safeRoute, String(label).trim().toUpperCase());
};

// Preserve friendly names for known destinations.
const arrayStart = oldText.indexOf('= [');
const arrayEnd = oldText.lastIndexOf('];');
if (arrayStart >= 0 && arrayEnd > arrayStart) {
  const existing = JSON.parse(oldText.slice(arrayStart + 2, arrayEnd));
  for (const item of existing) add(item.label, item.route);
}

// Discover route aliases directly from the application's real path resolver.
const resolverStart = source.indexOf('const routeToKey');
const resolverEnd = source.indexOf('\n};', resolverStart);
if (resolverStart < 0 || resolverEnd < 0) {
  throw new Error('Could not locate routeToKey in src/index.tsx; refusing to overwrite discovery manifest.');
}
const resolver = source.slice(resolverStart, resolverEnd);
for (const line of resolver.split('\n')) {
  const keyMatch = line.match(/return\s+'([^']+)'/);
  if (!keyMatch) continue;
  const key = keyMatch[1];
  if (key === 'landing' || key.startsWith('admin-')) continue;
  const pathMatches = [...line.matchAll(/(?:normalizedPath|path)\s*(?:===|startsWith)\s*'([^']+)'/g)];
  for (const match of pathMatches) {
    let route = match[1];
    if (route.startsWith('#')) continue;
    if (line.includes('startsWith') && route.endsWith('/')) route = route.slice(0, -1);
    add(key.replace(/-/g, ' '), route);
  }
}

if (!routes.size) throw new Error('No safe app routes discovered; refusing to write an empty manifest.');
const entries = [...routes].map(([route, label]) => ({ label, route }));
const output = '// Generated from the app route resolver by scripts/sync-brain-discovery.js.\n'
  + '// Do not edit manually; the generator preserves existing labels and discovers route changes.\n'
  + 'export type DiscoveredPageRoute = { label: string; route: string };\n'
  + 'export const GENERATED_PAGE_ROUTES: DiscoveredPageRoute[] = '
  + JSON.stringify(entries, null, 2) + ';\n';
fs.writeFileSync(generatedFile, output);
console.log('[brain-discovery] Generated ' + entries.length + ' navigable non-admin routes from src/index.tsx.');
