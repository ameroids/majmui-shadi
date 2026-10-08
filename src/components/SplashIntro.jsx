import { useEffect, useState } from 'react';
import './SplashIntro.css';

export default function SplashIntro() {
  const [show, setShow] = useState(true);
  const [out, setOut] = useState(false);

  useEffect(() => {
    
    // Start fade out after 4.4 seconds
    const timer1 = setTimeout(() => {
      setOut(true);
    }, 4400);

    // Completely remove from DOM after transition completes (4.4s + 0.8s)
    const timer2 = setTimeout(() => {
      setShow(false);
    }, 5200); 

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  if (!show) return null;

  return (
    <div className={`splash ${out ? 'out' : ''}`}>
      <div className="ring r1"></div>
      <div className="ring r2"></div>
      <div className="ring r3"></div>
      <div className="center">
        <svg className="orn top" viewBox="0 0 300 20">
          <line x1="0" y1="10" x2="125" y2="10" />
          <line x1="175" y1="10" x2="300" y2="10" />
          <path d="M150 0 L154 8 L162 10 L154 12 L150 20 L146 12 L138 10 L146 8Z" />
          <circle cx="130" cy="10" r="1.6" />
          <circle cx="170" cy="10" r="1.6" />
        </svg>
        <svg className="rings" viewBox="0 0 64 40">
          <circle cx="24" cy="20" r="15" pathLength="100" />
          <circle cx="40" cy="20" r="15" pathLength="100" />
        </svg>
        <h1 className="splash-h1">Majmui Shaadi</h1>
        <p className="splash-tag">Every family,<br />personally invited.</p>
        <div className="loader"><i></i></div>
        <svg className="orn bot" viewBox="0 0 300 20">
          <line x1="0" y1="10" x2="125" y2="10" />
          <line x1="175" y1="10" x2="300" y2="10" />
          <path d="M150 0 L154 8 L162 10 L154 12 L150 20 L146 12 L138 10 L146 8Z" />
          <circle cx="130" cy="10" r="1.6" />
          <circle cx="170" cy="10" r="1.6" />
        </svg>
        <div className="credit"><small>Developed by</small><b>Ameroids Tech Studio</b></div>
      </div>
    </div>
  );
}
