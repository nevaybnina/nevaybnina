'use client';

import { useEffect, useRef, useState } from 'react';
import { moscowToUTC } from '../data/events';
import WaitCounter from './WaitCounter';

const MOODS = {
  calm: 'Ну, время есть.',
  mid: 'Ждём. Спокойно.',
  week: 'УЖЕ НЕДЕЛЯ.',
  tomorrow: 'ЗАВТРА.',
  focused: 'УЖЕ.',
  done: 'ВСЁ.',
};

const MOUTHS = {
  calm: 'M40 67 Q50 70 60 67',
  mid: 'M40 66 Q50 72 60 66',
  week: 'M40 64 Q50 74 60 64',
  tomorrow: 'M38 62 Q50 76 62 62',
  focused: 'M38 68 Q50 60 62 68',
  done: 'M36 60 Q50 82 64 60',
};

function phaseFor(diffMs) {
  if (diffMs <= 0) return 'done';
  if (diffMs <= 3600 * 1000) return 'focused';
  if (diffMs <= 24 * 3600 * 1000) return 'tomorrow';
  if (diffMs <= 7 * 24 * 3600 * 1000) return 'week';
  if (diffMs <= 30 * 24 * 3600 * 1000) return 'mid';
  return 'calm';
}

function pad(n) {
  return String(n).padStart(2, '0');
}

export default function EventCountdown({ event }) {
  const eventUTC = moscowToUTC(event.dateMoscow);
  const [time, setTime] = useState({ d: '00', h: '00', m: '00', s: '00' });
  const [phase, setPhase] = useState('calm');
  const [tzNote, setTzNote] = useState('Определяем ваш часовой пояс…');
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const companionRef = useRef(null);

  useEffect(() => {
    function tick() {
      const diff = eventUTC - Date.now();
      setPhase(phaseFor(diff));

      if (diff <= 0) {
        setTime({ d: '00', h: '00', m: '00', s: '00' });
        return;
      }
      const total = Math.floor(diff / 1000);
      setTime({
        d: pad(Math.floor(total / 86400)),
        h: pad(Math.floor((total % 86400) / 3600)),
        m: pad(Math.floor((total % 3600) / 60)),
        s: pad(total % 60),
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [eventUTC]);

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setTzNote(
        tz && tz !== 'Europe/Moscow'
          ? `У вас там ${tz} — но тут время питерское. Таймер уже пересчитан.`
          : 'У вас, кажется, тоже питерское время. Повезло.'
      );
    } catch {
      setTzNote('Время питерское. Так и запишите.');
    }
  }, []);

  useEffect(() => {
    function handleMouseMove(e) {
      const node = companionRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = Math.max(-1, Math.min(1, (e.clientX - cx) / 200));
      const dy = Math.max(-1, Math.min(1, (e.clientY - cy) / 200));
      setEyeOffset({ x: dx * 3, y: dy * 2 });
    }
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const isDone = phase === 'done';
  const pupilStyle = { transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)` };

  return (
    <div className="page">
      <div className="topbar reveal d1">
        <div className="wordmark">nevaybnina</div>
        <div className="tagline">не вайбкодила. почти.</div>
      </div>

      <div className="headline-block reveal d2">
        <div className="headline">{event.headline}</div>
        <div className="event-name">{event.eventName}</div>
        <div className="event-sub">{event.eventSub}</div>
      </div>

      <div className="timer reveal d3" aria-live="polite">
        <div>
          <span key={'d' + time.d} className="unit-value tick">{time.d}</span>
          <div className="unit-label">ДНЕЙ</div>
        </div>
        <div>
          <span key={'h' + time.h} className="unit-value tick">{time.h}</span>
          <div className="unit-label">ЧАСОВ</div>
        </div>
        <div>
          <span key={'m' + time.m} className="unit-value tick">{time.m}</span>
          <div className="unit-label">МИНУТ</div>
        </div>
        <div>
          <span key={'s' + time.s} className="unit-value tick">{time.s}</span>
          <div className="unit-label">СЕКУНД</div>
        </div>
      </div>

      <div className="companion-row reveal d4">
        <svg
          ref={companionRef}
          className={`companion${isDone ? '' : ' bob'}`}
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            className="body-shape"
            d="M50 8C74 8 90 28 90 54C90 78 72 92 50 92C28 92 10 78 10 54C10 28 26 8 50 8Z"
          />
          <g className="blink">
            <circle className="pupil" cx="38" cy="50" r="5.5" style={pupilStyle} />
            <circle className="pupil" cx="64" cy="50" r="5.5" style={pupilStyle} />
          </g>
          <path d={MOUTHS[phase]} stroke="#17140E" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
        <div className="mood-bubble">{MOODS[phase]}</div>
      </div>

      <div className="meta reveal d5">
        {event.displayDate} — по Питеру. <strong>Всегда по Питеру.</strong>
        <br />
        <span>{tzNote}</span>
      </div>

      <hr className="divider reveal d5" />

      <div className="about reveal d5">
        <div className="about-label">СПРАВКА</div>
        {event.about.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <WaitCounter event={event} />

      <div className="footer reveal d5">сделано Ниной, вроде бы.</div>
    </div>
  );
}
