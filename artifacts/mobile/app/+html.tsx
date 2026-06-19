import { ScrollViewStyleReset } from 'expo-router/html';
import React from 'react';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=no"
        />
        <meta name="theme-color" content="#0D0A14" />
        <script src="https://telegram.org/js/telegram-web-app.js" />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root { 
                height: 100%; 
                background-color: #0D0A14;
                margin: 0;
                padding: 0;
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
