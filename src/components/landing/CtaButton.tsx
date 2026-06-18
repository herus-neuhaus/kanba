import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { C } from './tokens';

export function CtaButton({ label = 'TESTAR O KANBA GRÁTIS', size = 'lg' }: { label?: string; size?: 'sm' | 'lg' }) {
  const isLg = size === 'lg';
  return (
    <>
      <style>{`
        .landing-cta-btn {
          background: ${C.gradientCta};
          color: ${C.palladian};
          font-family: 'Inter', sans-serif;
          font-weight: 700;
          font-size: ${isLg ? '1.15rem' : '0.95rem'};
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: ${isLg ? '20px 52px' : '14px 36px'};
          border: none;
          border-radius: 3px;
          cursor: pointer;
          box-shadow: 0 0 0 1px rgba(139,92,246,0.25), 0 6px 28px rgba(124,58,237,0.45), 0 0 50px rgba(124,58,237,0.15);
          transition: all 0.28s ease;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          white-space: nowrap;
          position: relative;
          overflow: hidden;
        }
        .landing-cta-btn:hover {
          background: ${C.gradientCtaHov};
          box-shadow: 0 0 0 1px rgba(167,139,250,0.5), 0 8px 40px rgba(124,58,237,0.60), 0 0 80px rgba(124,58,237,0.25);
          transform: translateY(-3px) scale(1.02);
        }
        .landing-cta-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%);
          transform: translateX(-100%);
          transition: transform 0.5s ease;
        }
        .landing-cta-btn:hover .landing-cta-shimmer {
          transform: translateX(100%);
        }
      `}</style>
      <Link to="/auth" style={{ textDecoration: 'none', display: 'inline-block' }}>
        <button className="landing-cta-btn">
          <span className="landing-cta-shimmer" />
          {label}
          <ArrowRight size={isLg ? 20 : 16} />
        </button>
      </Link>
    </>
  );
}
