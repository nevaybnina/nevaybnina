'use client';

import { useEffect, useState } from 'react';

const DEFAULT_SUB = 'людей тоже не могут спокойно ждать';

const REACTIONS = [
  'Ещё один человек не выдержал.',
  'Хорошо. Значит, мы не одни.',
  'Коллективное ожидание пошло.',
  'Всё, теперь точно ждём вместе.',
  'Одним нетерпеливым больше.',
  'Ждать вместе как-то спокойнее.',
];

function storageKey(slug) {
  return `nevaybnina:waited:${slug}`;
}

// Пробуем несколько раз с паузой перед тем, как сдаться — иначе разовый сетевой сбой
// (особенно на нестабильных соединениях к .ru-домену) навсегда оставляет счётчик тире.
async function fetchWithRetry(url, options, attempts = 3, delayMs = 600) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
    } catch (e) {
      // сетевая ошибка — просто пробуем ещё раз ниже
    }
    if (i < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
    }
  }
  return null;
}

export default function WaitCounter({ event }) {
  const [count, setCount] = useState(null);
  const [hasWaited, setHasWaited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [subLine, setSubLine] = useState(DEFAULT_SUB);

  useEffect(() => {
    const alreadyWaited = typeof window !== 'undefined' && localStorage.getItem(storageKey(event.slug)) === '1';
    if (alreadyWaited) {
      setHasWaited(true);
      setSubLine(REACTIONS[Math.floor(Math.random() * REACTIONS.length)]);
    }

    fetchWithRetry(`/api/wait?slug=${encodeURIComponent(event.slug)}`, { cache: 'no-store' })
      .then((res) => (res ? res.json() : null))
      .then((data) => {
        if (data && typeof data.count === 'number') setCount(data.count);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [event.slug]);

  async function handleClick() {
    if (hasWaited || sending) return;
    setSending(true);

    try {
      const res = await fetch('/api/wait', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: event.slug }),
      });
      const data = await res.json();
      if (typeof data.count === 'number') {
        setCount(data.count);
      }
      localStorage.setItem(storageKey(event.slug), '1');
      setHasWaited(true);
      setSubLine(REACTIONS[Math.floor(Math.random() * REACTIONS.length)]);
    } catch (e) {
      // тихо игнорируем — кнопка просто останется активной, можно попробовать ещё раз
    } finally {
      setSending(false);
    }
  }

  const displayCount = count === null ? '—' : count.toLocaleString('ru-RU');

  return (
    <div className="wait-block reveal d5">
      <div className="wait-heading">А НАС СКОЛЬКО?</div>
      <div>
        <span key={displayCount} className="wait-count tick">{displayCount}</span>
      </div>
      <div className="wait-sub">{subLine}</div>
      <button
        className={`wait-button${hasWaited ? ' joined' : ''}`}
        onClick={handleClick}
        disabled={hasWaited || loading || sending}
      >
        {hasWaited ? '✓ Я тоже жду' : 'Я тоже жду'}
      </button>
    </div>
  );
}
