import { useEffect, useState } from 'react';
import './RSVPSplash.css';

export default function RSVPSplash() {
  const [show, setShow] = useState(true);
  const [time, setTime] = useState({ d: '00', h: '00', m: '00', s: '00' });
  
  // NOTE: Set the real event date/time here
  const EVENT_DATE = new Date('2027-01-09T13:15:00');

  useEffect(() => {
    let raf;
    let t0 = null;
    const pad = (n) => String(n).padStart(2, '0');

    const tick = (t) => {
      if (!t0) t0 = t;
      const diff = Math.max(0, EVENT_DATE - Date.now());
      const sec = Math.floor(diff / 1000);
      
      const v = {
        d: Math.floor(sec / 86400),
        h: Math.floor((sec % 86400) / 3600),
        m: Math.floor((sec % 3600) / 60),
        s: sec % 60
      };
      
      // Animate numbers up gracefully for the first 1.5 seconds
      const p = Math.min(1, Math.max(0, (t - t0 - 1200) / 1500));
      const e = 1 - Math.pow(1 - p, 3); // cubic ease out
      
      setTime({
        d: pad(Math.round(v.d * e)),
        h: pad(Math.round(v.h * e)),
        m: pad(Math.round(v.m * e)),
        s: pad(Math.round(v.s * e))
      });
      
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    // Unmount completely after 5 seconds
    const timer = setTimeout(() => {
      setShow(false);
    }, 5000);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, []);

  if (!show) return null;

  return (
    <div className="rsvp-splash">
      <div className="rsvp-top"><i></i><span>RSVP</span><i></i></div>
      <div className="rsvp-brand">
        <svg viewBox="0 0 64 40">
          <circle cx="24" cy="20" r="15" />
          <circle cx="40" cy="20" r="15" />
        </svg>
        Majmui Shaadi
      </div>
      <p className="rsvp-lead">The celebration begins in</p>
      <div className="rsvp-units">
        <div className="rsvp-u"><b>{time.d}</b><small>Days</small></div>
        <div className="rsvp-u"><b>{time.h}</b><small>Hours</small></div>
        <div className="rsvp-u"><b>{time.m}</b><small>Minutes</small></div>
        <div className="rsvp-u"><b>{time.s}</b><small>Seconds</small></div>
      </div>
      <p className="rsvp-ask">Kindly confirm your presence.</p>
      <div className="rsvp-credit">Developed by<b>Ameroids Tech Studio</b></div>
      <div className="rsvp-bar"></div>
    </div>
  );
}
