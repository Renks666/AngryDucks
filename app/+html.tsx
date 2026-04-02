import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ru">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />

        {/* PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Duck Team" />
        <meta name="theme-color" content="#1A1A1A" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* SEO */}
        <meta name="description" content="Duck Team — приложение ФК Утиное Яблоко" />

        <title>Duck Team</title>

        {/* Inter font from Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />

        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: `
          * { box-sizing: border-box; }

          html, body {
            margin: 0;
            padding: 0;
            height: 100%;
            background-color: #F2F2F7;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }

          @media (prefers-color-scheme: dark) {
            html, body { background-color: #000000; }
          }

          /* Desktop: center the app in a 480px container */
          @media (min-width: 769px) {
            #root, #__expo-root {
              max-width: 480px;
              margin: 0 auto;
              min-height: 100vh;
              background-color: #FFFFFF;
              box-shadow: 0 0 40px rgba(0,0,0,0.12);
              position: relative;
            }
            @media (prefers-color-scheme: dark) {
              #root, #__expo-root { background-color: #000000; }
            }
          }

          /* Smooth scrolling */
          * { -webkit-overflow-scrolling: touch; }

          /* Hide scrollbar on webkit */
          ::-webkit-scrollbar { display: none; }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
