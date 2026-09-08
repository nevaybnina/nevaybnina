import { ImageResponse } from 'next/og';
import { events } from '../data/events';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export const alt = 'nevaybnina — таймер до события';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Просим у Google Fonts только те буквы, что реально нужны на картинке —
// так это работает и с кириллицей, без отдельного полного шрифта.
async function loadGoogleFont(weight, text) {
  const url = `https://fonts.googleapis.com/css2?family=Archivo:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url)).text();
  const match = css.match(/src: url\(([^)]+)\) format\('(opentype|truetype)'\)/);
  if (match) {
    const res = await fetch(match[1]);
    if (res.status === 200) {
      return await res.arrayBuffer();
    }
  }
  throw new Error('Не удалось загрузить шрифт для OG-картинки');
}

export default async function Image() {
  const event = events[0];
  const wordmark = 'nevaybnina';
  const ogHeadline = 'Альфа-Онлайн ждёт результатов';
  const allText = `${wordmark} ${ogHeadline} ${event.eventName}`;

  const [bold, semibold] = await Promise.all([
    loadGoogleFont(800, allText),
    loadGoogleFont(600, allText),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: '#F3EEE0',
          backgroundImage: 'radial-gradient(rgba(23,20,14,0.12) 2px, transparent 2px)',
          backgroundSize: '32px 32px',
        }}
      >
        <div style={{ display: 'flex', fontFamily: 'Archivo', fontSize: 30, fontWeight: 800, color: '#17140E' }}>
          {wordmark}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              fontFamily: 'Archivo',
              fontSize: 92,
              fontWeight: 800,
              color: '#17140E',
              lineHeight: 1,
              letterSpacing: -2,
            }}
          >
            {ogHeadline}
          </div>
          <div
            style={{
              display: 'flex',
              fontFamily: 'Archivo',
              fontSize: 42,
              fontWeight: 600,
              color: '#17140E',
              marginTop: 28,
              maxWidth: 980,
            }}
          >
            {event.eventName}
          </div>
        </div>

        <div style={{ display: 'flex', width: 72, height: 10, background: '#FF4B33', borderRadius: 6 }} />
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Archivo', data: bold, weight: 800, style: 'normal' },
        { name: 'Archivo', data: semibold, weight: 600, style: 'normal' },
      ],
    }
  );
}
