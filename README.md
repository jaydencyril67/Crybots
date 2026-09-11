# Crypto Investment Platform

## Overview
The Crypto Investment Platform is a web application designed to help users manage their cryptocurrency investments. It provides features for tracking portfolios, executing trades, and viewing market trends.

## Features
- **Dashboard**: An overview of user investments and market trends.
- **Portfolio**: Detailed view of current crypto holdings, including quantity and value.
- **Trade**: Functionality to buy and sell cryptocurrencies with user input handling.
- **User Authentication**: Login and registration pages for user management.
- **API Integration**: Fetch market data and manage user portfolios through API calls.

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm (Node package manager)

### Installation
1. Clone the repository:
   ```
   git clone https://github.com/yourusername/crypto-investment-platform.git
   ```
2. Navigate to the project directory:
   ```
   cd crypto-investment-platform
   ```
3. Install the dependencies:
   ```
   npm install
   ```

### Running the Application
To start the development server, run:
```
npm start
```
The application will be available at `http://localhost:3000`.

### Building for Production
To create a production build, run:
```
npm run build
```

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.

## SEO and sitemap guidance

Follow these steps to help Google index your pages:

1) Install new dependency

Open a terminal in `client/` and run:

```powershell
npm install
```

This will install `react-helmet-async` which is used for setting per-page metadata.

2) Regenerate sitemap

Run the sitemap generator to update `public/sitemap.xml`:

```powershell
node sitemap-generator.js
```

3) Build and deploy

After installing deps and regenerating the sitemap, build the app and deploy your `client/build` (or however you host the site). Example:

```powershell
npm run build
```

4) Submit to Google Search Console

- Verify your site (https://www.tradespot.online) in Google Search Console using DNS/HTML file/method you prefer.
- In Search Console, open "Sitemaps" and submit: `https://www.tradespot.online/sitemap.xml`.
- Optionally, use "URL Inspection" to request indexing for individual important pages (e.g. `/f`, `/co`).

Notes & recommendations

- Because this app uses client-side routing (React Router), search engines will index static content and metadata they can access. Adding `react-helmet-async` ensures each route has distinct titles/descriptions when crawled.
- For better coverage consider using server-side rendering (Next.js) or prerendering critical pages if you need richer SEO for many pages.
- Ensure `robots.txt` is present and references `/sitemap.xml` (already configured).
- Monitor Search Console for crawling/indexing errors and fix any blocked resources or 404s.