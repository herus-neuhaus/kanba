import React from 'react';
import { C } from './tokens';

export function BentoCard({ icon, iconBg, tag, title, body, accent, extra, style }: {
  icon: React.ReactNode; iconBg: string; tag: string; title: string;
  body: string; accent: string; extra?: React.ReactNode; style?: React.CSSProperties;
}) {
  return (
    <>
      <style>{`
        .bento-card {
          background: ${C.bgCard};
          border: 1px solid ${C.borderCard};
          border-radius: 6px;
          padding: 30px 28px;
          transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s;
          box-shadow: 0 3px 16px rgba(0,0,0,0.2);
          position: relative;
          overflow: hidden;
        }
        .bento-card:hover {
          border: 1px solid ${accent}55;
          box-shadow: 0 12px 40px rgba(0,0,0,0.35), 0 0 0 1px ${accent}22, 0 0 60px ${accent}10;
          transform: translateY(-4px);
        }
        .bento-card-highlight {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, ${accent}, ${accent}00);
          opacity: 0.5;
          transition: opacity 0.25s;
        }
        .bento-card:hover .bento-card-highlight {
          opacity: 1;
        }
      `}</style>
      <div className="bento-card" style={style}>
        <div className="bento-card-highlight" />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: '7px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${accent}25` }}>
            {icon}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 7px', fontSize: '0.62rem', color: accent, fontFamily: "'Inter',sans-serif", letterSpacing: '0.14em', fontWeight: 600 }}>{tag}</p>
            <h3 style={{ margin: '0 0 10px', fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: '1.15rem', color: C.palladian, lineHeight: 1.2 }}>{title}</h3>
            <p style={{ margin: 0, fontSize: '0.87rem', color: C.oatmeal, lineHeight: 1.65, fontWeight: 300 }}>{body}</p>
          </div>
        </div>
        {extra}
      </div>
    </>
  );
}
