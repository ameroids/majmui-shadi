import { useEffect, useState } from 'react';
import './InvitationSplash.css';

export default function InvitationSplash() {
  const [show, setShow] = useState(true);
  const [out, setOut] = useState(false);
  const [sparkles, setSparkles] = useState([]);

  useEffect(() => {

    // Generate random sparkles
    const newSparkles = Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 110 - 5}%`,
      top: `${Math.random() * 120 - 30}%`,
      fontSize: `${8 + Math.random() * 12}px`,
      animationDelay: `${4.2 + Math.random() * 2.5}s`,
      animationDuration: `${1.8 + Math.random() * 1.6}s`,
    }));
    setSparkles(newSparkles);

    const timer1 = setTimeout(() => {
      setOut(true);
    }, 7600);

    const timer2 = setTimeout(() => {
      setShow(false);
    }, 8500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  if (!show) return null;

  return (
    <div className={`invitation-splash ${out ? 'out' : ''}`}>
      <div className="scene">
        <div className="env">
          <div className="back"></div>
          <div className="card">
            <div className="bd"></div>
            <div className="tx">
              <svg className="rg" viewBox="0 0 64 40">
                <circle cx="24" cy="20" r="15" />
                <circle cx="40" cy="20" r="15" />
              </svg>
              <h1>Majmui Shaadi</h1>
              <div className="orn"><i></i><b></b><i></i></div>
              <p>Every family,<br />personally invited.</p>
              <small>Developed by<b>Ameroids Tech Studio</b></small>
            </div>
          </div>
          <div className="pk">
            <i className="l"></i>
            <i className="r"></i>
            <i className="b"></i>
          </div>
          <div className="flap"></div>
          <div className="seal">
            <svg viewBox="0 0 64 40">
              <circle cx="24" cy="20" r="15" />
              <circle cx="40" cy="20" r="15" />
            </svg>
          </div>
        </div>
        {sparkles.map((sp) => (
          <span
            key={sp.id}
            className="sp"
            style={{
              left: sp.left,
              top: sp.top,
              fontSize: sp.fontSize,
              animationDelay: sp.animationDelay,
              animationDuration: sp.animationDuration,
            }}
          >
            ✦
          </span>
        ))}
      </div>
    </div>
  );
}
