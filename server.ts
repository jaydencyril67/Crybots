import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join } from 'node:path'

const port = Number(process.env.PORT ?? 3000)
const root = process.cwd()
const indexHtml = await readFile(join(root, 'index.html'), 'utf8')
const bundleJs = await readFile(join(root, 'dist/bundle.js'), 'utf8')
const appCss = await readFile(join(root, 'src/index.css'), 'utf8')

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)
  const pathname = url.pathname

  if (pathname === '/' || pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(indexHtml)
    return
  }

  if (pathname === '/dist/bundle.js' || pathname === '/bundle.js') {
    res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' })
    res.end(bundleJs)
    return
  }

  if (pathname === '/index.css') {
    res.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8' })
    res.end(appCss)
    return
  }

  const filePath = join(root, pathname)
  try {
    const file = await readFile(filePath)
    res.writeHead(200, { 'Content-Type': getContentType(filePath) })
    res.end(file)
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Not found')
  }
})

server.listen(port, () => {
  console.log(`KINGSHALL EXCHANGE running on http://localhost:${port}`)
})

function getContentType(filePath: string) {
  switch (extname(filePath)) {
    case '.css':
      return 'text/css; charset=utf-8'
    case '.html':
      return 'text/html; charset=utf-8'
    case '.js':
    case '.mjs':
      return 'text/javascript; charset=utf-8'
    case '.png':
      return 'image/png'
    case '.svg':
      return 'image/svg+xml'
    default:
      return 'application/octet-stream'
  }
}
