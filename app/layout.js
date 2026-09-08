import './globals.css';

const siteUrl = 'https://nevaybnina.vercel.app';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: 'nevaybnina',
  description: 'Считаем дни до важных событий команды',
  openGraph: {
    siteName: 'nevaybnina',
    locale: 'ru_RU',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
