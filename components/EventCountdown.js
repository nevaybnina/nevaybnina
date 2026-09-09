'use client';

import { useEffect, useRef, useState } from 'react';
import { moscowToUTC } from '../data/events';
import WaitCounter from './WaitCounter';

const MOODS = {
  calm: 'Ну, время есть.',
  mid: 'Ждём. Спокойно.',
  week: 'УЖЕ НЕДЕЛЯ.',
  midweek: 'Пару дней осталось поволноваться.',
  tomorrow: 'ЗАВТРА.',
  focused: 'Это случится уже сегодня.',
  done: 'ВСЁ.',
};

// Мордочка для «обычных» фаз — просто линии-брови (с поворотом) + круглые глаза + рот-дуга.
// Фазы focused и done устроены по-другому (см. renderFace ниже), поэтому их тут нет.
const SIMPLE_FACES = {
  calm: {
    browLeft: { x1: 30, y1: 40, x2: 44, y2: 36 },
    browRight: { x1: 56, y1: 36, x2: 70, y2: 40 },
    eyeR: 5.5,
    mouth: 'M40 67 Q50 70 60 67',
  },
  mid: {
    browLeft: { x1: 30, y1: 40, x2: 44, y2: 36 },
    browRight: { x1: 56, y1: 36, x2: 70, y2: 40 },
    eyeR: 5.5,
    mouth: 'M40 66 Q50 72 60 66',
  },
  week: {
    browLeft: { x1: 30, y1: 40, x2: 44, y2: 36, rotate: 8, pivot: [37, 38] },
    browRight: { x1: 56, y1: 36, x2: 70, y2: 40, rotate: -8, pivot: [63, 38] },
    eyeR: 5.5,
    mouth: 'M40 64 Q50 72 60 64',
  },
  midweek: {
    browLeft: { x1: 28, y1: 38, x2: 44, y2: 35, rotate: 20, pivot: [36, 36] },
    browRight: { x1: 56, y1: 37, x2: 72, y2: 40, rotate: 6, pivot: [64, 38] },
    eyeR: 5.5,
    mouth: 'M39 66 Q43 62 47 66 Q51 70 55 66 Q59 62 62 66',
  },
  tomorrow: {
    browLeft: { x1: 30, y1: 40, x2: 44, y2: 36, rotate: -14, pivot: [37, 38] },
    browRight: { x1: 56, y1: 36, x2: 70, y2: 40, rotate: 14, pivot: [63, 38] },
    eyeR: 6.5,
    mouth: 'M38 62 Q50 76 62 62',
  },
};

// Какая CSS-анимация у корпуса персонажа в каждой фазе
const COMPANION_CLASS = {
  calm: 'bob',
  mid: 'bob',
  week: 'bob',
  midweek: 'shake-mild',
  tomorrow: 'shake-med',
  focused: 'shake-strong',
  done: 'bounce-happy',
};

// МСК = UTC+3 круглый год. Считаем разницу в ЦЕЛЫХ календарных днях по питерской дате —
// так «завтра» и «неделя» наступают одновременно у всех зрителей, в какой бы стране они ни были.
function daysUntilMoscow(eventUTC) {
  const MSK = 3 * 3600 * 1000;
  const now = new Date(Date.now() + MSK);
  const ev = new Date(eventUTC + MSK);
  const nowDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const evDay = Date.UTC(ev.getUTCFullYear(), ev.getUTCMonth(), ev.getUTCDate());
  return Math.round((evDay - nowDay) / 86400000);
}

function phaseFor(diffMs, daysLeft) {
  if (diffMs <= 0) return 'done';
  if (daysLeft <= 0) return 'focused';
  if (daysLeft === 1) return 'tomorrow';
  if (daysLeft >= 2 && daysLeft <= 6) return 'midweek';
  if (daysLeft === 7) return 'week';
  if (daysLeft >= 8 && daysLeft <= 30) return 'mid';
  return 'calm';
}

function pad(n) {
  return String(n).padStart(2, '0');
}

// ?debugPhase=focused в адресной строке — способ вручную посмотреть любую фазу,
// не дожидаясь реальной даты. Работает только если значение — одна из настоящих фаз,
// иначе просто игнорируется и всё считается как обычно.
const VALID_PHASES = ['calm', 'mid', 'week', 'midweek', 'tomorrow', 'focused', 'done'];

export default function EventCountdown({ event }) {
  const eventUTC = moscowToUTC(event.dateMoscow);
  const [time, setTime] = useState({ d: '00', h: '00', m: '00', s: '00' });
  const [phase, setPhase] = useState('calm');
  const [tzNote, setTzNote] = useState('Определяем ваш часовой пояс…');
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const companionRef = useRef(null);
  const debugPhaseRef = useRef(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const dp = params.get('debugPhase');
      if (dp && VALID_PHASES.includes(dp)) {
        debugPhaseRef.current = dp;
      }
    } catch {}
  }, []);

  useEffect(() => {
    function tick() {
      const diff = eventUTC - Date.now();
      const daysLeft = daysUntilMoscow(eventUTC);
      setPhase(debugPhaseRef.current || phaseFor(diff, daysLeft));

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

  const pupilStyle = { transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)` };

  function brow(b) {
    const transform = b.rotate ? `rotate(${b.rotate} ${b.pivot[0]} ${b.pivot[1]})` : undefined;
    return (
      <line
        x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2}
        stroke="#17140E" strokeWidth="4" strokeLinecap="round"
        transform={transform}
      />
    );
  }

  function renderFace() {
    if (phase === 'focused') {
      return (
        <>
          <line x1="28" y1="38" x2="44" y2="32" stroke="#17140E" strokeWidth="4" strokeLinecap="round" transform="rotate(-20 36 35)" />
          <line x1="56" y1="32" x2="72" y2="38" stroke="#17140E" strokeWidth="4" strokeLinecap="round" transform="rotate(20 64 35)" />
          <g className="blink">
            <circle className="pupil" cx="38" cy="50" r="7.5" fill="#17140E" style={pupilStyle} />
            <circle className="pupil" cx="64" cy="50" r="7.5" fill="#17140E" style={pupilStyle} />
          </g>
          <circle cx="40" cy="47" r="1.6" fill="#F3EEE0" />
          <circle cx="66" cy="47" r="1.6" fill="#F3EEE0" />
          <circle cx="50" cy="69" r="3.5" fill="#17140E" />
        </>
      );
    }
    if (phase === 'done') {
      return (
        <>
          <path d="M28 40 Q37 30 46 38" stroke="#17140E" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M54 38 Q63 30 72 40" stroke="#17140E" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M32 50 Q38 44 44 50" stroke="#17140E" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M56 50 Q62 44 68 50" stroke="#17140E" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M36 60 Q50 82 64 60" stroke="#17140E" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </>
      );
    }
    const f = SIMPLE_FACES[phase] || SIMPLE_FACES.calm;
    return (
      <>
        {brow(f.browLeft)}
        {brow(f.browRight)}
        <g className="blink">
          <circle className="pupil" cx="38" cy="50" r={f.eyeR} fill="#17140E" style={pupilStyle} />
          <circle className="pupil" cx="64" cy="50" r={f.eyeR} fill="#17140E" style={pupilStyle} />
        </g>
        <path d={f.mouth} stroke="#17140E" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      </>
    );
  }

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
          className={`companion ${COMPANION_CLASS[phase] || 'bob'}`}
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            className="body-shape"
            d="M50 8C74 8 90 28 90 54C90 78 72 92 50 92C28 92 10 78 10 54C10 28 26 8 50 8Z"
          />
          {renderFace()}
        </svg>
        <div className="mood-bubble">{MOODS[phase]}</div>
      </div>

      <div className="meta reveal d5">
        <div className="meta-date">{event.displayDate}</div>
        <div className="meta-location">Санкт-Петербург</div>
        <div className="meta-tz">{tzNote}</div>
      </div>

      <hr className="divider reveal d5" />

      <WaitCounter event={event} />

      <div className="about reveal d5">
        <div className="about-label">СПРАВКА</div>
        {event.about.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <div className="footer reveal d5">сделано Ниной, вроде бы.</div>
    </div>
  );
}
