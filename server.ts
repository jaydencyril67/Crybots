import { serve } from 'bun'

const html = await Bun.file('index.html').text()

serve({
  port: 3000,
  async fetch(request) {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/src/') || url.pathname.endsWith('.css') || url.pathname.startsWith('/assets/')) {
      const filePath = `.${url.pathname}`
      const file = Bun.file(filePath)

      if (await file.exists()) {
        return new Response(file, {
          headers: {
            'Content-Type': getContentType(filePath),
          },
        })
      }
    }

    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      })
    }

    return new Response('Not found', { status: 404 })
  },
})

console.log('KINGSHALL EXCHANGE running on http://localhost:3000')

function getContentType(filePath: string) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    return 'application/typescript; charset=utf-8'
  }

  if (filePath.endsWith('.css')) {
    return 'text/css; charset=utf-8'
  }

  if (filePath.endsWith('.html')) {
    return 'text/html; charset=utf-8'
  }

  if (filePath.endsWith('.png')) {
    return 'image/png'
  }

  if (filePath.endsWith('.svg')) {
    return 'image/svg+xml'
  }

  return 'application/octet-stream'
}
