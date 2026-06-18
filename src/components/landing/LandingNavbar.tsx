import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { C } from './tokens';

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    const h = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 50);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      padding: '0 6%', height: 68,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: scrolled ? 'rgba(23,32,40,0.96)' : 'transparent',
      backdropFilter: scrolled ? 'blur(14px)' : 'none',
      borderBottom: scrolled ? `1px solid ${C.borderSubtle}` : 'none',
      transition: 'all 0.35s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src="/K transparante.png" alt="K" style={{ height: 34, filter: 'drop-shadow(0 0 10px rgba(124,58,237,0.65))' }} />
        <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: '1.5rem', letterSpacing: '0.14em', background: C.gradientCta, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          KANBA
        </span>
      </div>
      <Link
        to="/auth"
        style={{
          fontFamily: "'Inter',sans-serif", fontSize: '0.83rem', fontWeight: 500,
          color: C.oatmeal, border: `1px solid ${C.borderSubtle}`,
          padding: '8px 24px', borderRadius: '3px',
          textDecoration: 'none', letterSpacing: '0.04em', transition: 'all 0.22s',
          background: 'rgba(255,255,255,0.03)',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = C.palladian; (e.currentTarget as HTMLAnchorElement).style.borderColor = C.gold; (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(179,155,111,0.08)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = C.oatmeal; (e.currentTarget as HTMLAnchorElement).style.borderColor = C.borderSubtle; (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.03)'; }}
      >
        Entrar
      </Link>
    </nav>
  );
}
