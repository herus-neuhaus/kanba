import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare, Users, BookOpen, CheckCircle2, X,
  TrendingUp, Clock, ShieldCheck, ArrowRight, Zap, ChevronDown,
} from 'lucide-react';

/* ═══════════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════════ */
const C = {
  bg: '#212F3D',
  bgDeep: '#172028',
  bgDeeper: '#111922',
  bgCard: '#2A3A4C',
  bgCardLight: '#30435A',
  palladian: '#EEE9DF',
  oatmeal: '#C9C1B1',
  oatmealDim: '#8E8779',
  gold: '#B39B6F',
  goldBright: '#C9AE7E',
  copper: '#A35139',
  copperLight: '#C0634A',
  // CTA gradients — richer, more metallic
  gradientCta: 'linear-gradient(135deg, #8B3B26 0%, #A35139 35%, #B39B6F 75%, #C9AE7E 100%)',
  gradientCtaHov: 'linear-gradient(135deg, #9E4733 0%, #B8634A 35%, #C5AC80 75%, #D4BC90 100%)',
  borderSubtle: 'rgba(179,155,111,0.22)',
  borderCard: 'rgba(238,233,223,0.08)',
  // Radial copper glows reused across sections
  glowHero: 'radial-gradient(ellipse 900px 600px at 50% 50%, rgba(163,81,57,0.18) 0%, rgba(44,59,77,0.0) 70%)',
  glowBA: 'radial-gradient(ellipse 1200px 400px at 50% 60%, rgba(163,81,57,0.12) 0%, transparent 70%)',
  glowFooter: 'radial-gradient(ellipse 800px 500px at 50% 40%, rgba(163,81,57,0.20) 0%, transparent 65%)',
};

/* ═══════════════════════════════════════════════
   INTERSECTION OBSERVER FADE
═══════════════════════════════════════════════ */
function useFadeIn(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ═══════════════════════════════════════════════
   CTA BUTTON — enlarged, metallic, glowing
═══════════════════════════════════════════════ */
function CtaButton({ label = 'TESTAR O KANBA GRÁTIS', size = 'lg' }: { label?: string; size?: 'sm' | 'lg' }) {
  const [hov, setHov] = useState(false);
  const isLg = size === 'lg';
  return (
    <Link to="/auth" style={{ textDecoration: 'none', display: 'inline-block' }}>
      <button
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: hov ? C.gradientCtaHov : C.gradientCta,
          color: C.palladian,
          fontFamily: "'Oswald', sans-serif",
          fontWeight: 700,
          fontSize: isLg ? '1.15rem' : '0.95rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          padding: isLg ? '20px 52px' : '14px 36px',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer',
          // Rich metallic glow
          boxShadow: hov
            ? '0 0 0 1px rgba(201,174,126,0.5), 0 8px 40px rgba(163,81,57,0.60), 0 0 80px rgba(163,81,57,0.25)'
            : '0 0 0 1px rgba(179,155,111,0.25), 0 6px 28px rgba(163,81,57,0.45), 0 0 50px rgba(163,81,57,0.15)',
          transition: 'all 0.28s ease',
          transform: hov ? 'translateY(-3px) scale(1.02)' : 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          whiteSpace: 'nowrap',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* shimmer sweep */}
        <span style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%)',
          transform: hov ? 'translateX(100%)' : 'translateX(-100%)',
          transition: 'transform 0.5s ease',
        }} />
        {label}
        <ArrowRight size={isLg ? 20 : 16} />
      </button>
    </Link>
  );
}

/* ═══════════════════════════════════════════════
   MOCK KANBAN DASHBOARD — enlarged, detailed
═══════════════════════════════════════════════ */
function MockDashboard() {
  const cols = [
    { title: 'A Fazer', color: '#6B7E94', tasks: [{ t: 'Briefing Campanha Q3', p: 'alta' }, { t: 'Criativo Instagram – Loja XY', p: 'media' }] },
    { title: 'Em Andamento', color: '#5B8FC9', tasks: [{ t: 'Copy email – Black Friday', p: 'alta' }, { t: 'Vídeo Animado – Produto X', p: 'media' }] },
    { title: 'Em Aprovação', color: C.gold, tasks: [{ t: 'Post Feed – Semana 18', p: 'alta' }] },
    { title: 'Concluído', color: '#5BAA7E', tasks: [{ t: 'Landing Page – Cliente ABC', p: 'baixa' }] },
  ];
  const priorityColor: Record<string, string> = { alta: '#E05A4C', media: C.gold, baixa: '#5BAA7E' };
  return (
    <div style={{
      background: C.bgDeeper,
      borderRadius: '10px',
      border: `1px solid ${C.borderSubtle}`,
      boxShadow: `0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(179,155,111,0.1), inset 0 1px 0 rgba(255,255,255,0.05)`,
      overflow: 'hidden',
      width: '100%',
    }}>
      {/* Chrome bar */}
      <div style={{ background: '#151E28', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
        <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#E05A4C', display: 'inline-block' }} />
        <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#E5A82D', display: 'inline-block' }} />
        <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#4CAF50', display: 'inline-block' }} />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 4, padding: '3px 16px', fontSize: '0.62rem', color: C.oatmealDim, fontFamily: "'Poppins',sans-serif", letterSpacing: '0.06em' }}>
            🔒 kanba.app · Painel de Demandas
          </div>
        </div>
      </div>
      {/* Kanban columns */}
      <div style={{ display: 'flex', gap: 10, padding: '14px 14px 0' }}>
        {cols.map(col => (
          <div key={col.title} style={{ minWidth: 145, flex: 1, background: C.bgCard, borderRadius: 7, border: `1px solid ${C.borderCard}`, padding: '10px 10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: col.color, flexShrink: 0, display: 'inline-block' }} />
              <span style={{ fontSize: '0.55rem', fontFamily: "'Oswald',sans-serif", color: C.oatmealDim, letterSpacing: '0.09em', fontWeight: 600 }}>{col.title.toUpperCase()}</span>
              <span style={{ marginLeft: 'auto', fontSize: '0.5rem', background: 'rgba(255,255,255,0.07)', borderRadius: 3, padding: '1px 5px', color: C.oatmealDim }}>{col.tasks.length}</span>
            </div>
            {col.tasks.map(({ t, p }) => (
              <div key={t} style={{ background: C.bgDeep, borderRadius: 5, padding: '8px 9px', borderLeft: `2px solid ${col.color}`, position: 'relative' }}>
                <div style={{ position: 'absolute', top: 6, right: 7, width: 5, height: 5, borderRadius: '50%', background: priorityColor[p] }} />
                <span style={{ fontSize: '0.57rem', color: C.palladian, fontFamily: "'Poppins',sans-serif", lineHeight: 1.45, display: 'block', paddingRight: 10 }}>{t}</span>
                <div style={{ marginTop: 7, display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[1, 2].map(i => (
                    <span key={i} style={{ width: 15, height: 15, borderRadius: '50%', background: `hsl(${i * 55 + 195}, 45%, 48%)`, display: 'inline-block', border: `1.5px solid ${C.bgDeep}` }} />
                  ))}
                  <span style={{ fontSize: '0.48rem', color: C.oatmealDim, marginLeft: 2, fontFamily: "'Poppins',sans-serif" }}>Due 15/05</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      {/* WhatsApp toast */}
      <div style={{ margin: '12px 14px 14px', background: '#0A2E1D', border: '1px solid rgba(37,211,102,0.25)', borderRadius: 7, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 11, boxShadow: '0 4px 20px rgba(37,211,102,0.08)' }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 12px rgba(37,211,102,0.4)' }}>
          <MessageSquare size={16} color="#fff" />
        </div>
        <div>
          <p style={{ fontSize: '0.62rem', color: '#4CAF50', fontFamily: "'Poppins',sans-serif", margin: 0, fontWeight: 600 }}>✓ Notificação automática enviada · Agora</p>
          <p style={{ fontSize: '0.57rem', color: C.oatmeal, fontFamily: "'Poppins',sans-serif", margin: 0 }}>
            📋 <b>"Post Feed – Semana 18"</b> movida para <b style={{ color: C.gold }}>Em Aprovação</b>. Responsável: João Silva
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SECTION EYEBROW LABEL
═══════════════════════════════════════════════ */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ textAlign: 'center', fontSize: '0.68rem', color: C.gold, letterSpacing: '0.2em', fontFamily: "'Oswald',sans-serif", textTransform: 'uppercase', marginBottom: 20, margin: '0 0 20px' }}>
      {children}
    </p>
  );
}

/* ═══════════════════════════════════════════════
   BENTO CARD
═══════════════════════════════════════════════ */
function BentoCard({ icon, iconBg, tag, title, body, accent, extra, style }: {
  icon: React.ReactNode; iconBg: string; tag: string; title: string;
  body: string; accent: string; extra?: React.ReactNode; style?: React.CSSProperties;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: C.bgCard,
        border: hov ? `1px solid ${accent}55` : `1px solid ${C.borderCard}`,
        borderRadius: '6px',
        padding: '30px 28px',
        transition: 'border-color 0.25s, box-shadow 0.25s, transform 0.25s',
        boxShadow: hov
          ? `0 12px 40px rgba(0,0,0,0.35), 0 0 0 1px ${accent}22, 0 0 60px ${accent}10`
          : '0 3px 16px rgba(0,0,0,0.2)',
        transform: hov ? 'translateY(-4px)' : 'none',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${accent}, ${accent}00)`, opacity: hov ? 1 : 0.5, transition: 'opacity 0.25s' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: '7px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${accent}25` }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: '0 0 7px', fontSize: '0.62rem', color: accent, fontFamily: "'Oswald',sans-serif", letterSpacing: '0.14em', fontWeight: 600 }}>{tag}</p>
          <h3 style={{ margin: '0 0 10px', fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: '1.15rem', color: C.palladian, lineHeight: 1.2 }}>{title}</h3>
          <p style={{ margin: 0, fontSize: '0.87rem', color: C.oatmeal, lineHeight: 1.65, fontWeight: 300 }}>{body}</p>
        </div>
      </div>
      {extra}
    </div>
  );
}

const AGENCIES = ['Sona For Founders', 'Overfly Marketing', 'Neuhaus Digital', 'Pixel Labs', 'Futura Agency'];

/* ═══════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════ */
export default function Landing() {
  const hero    = useFadeIn(0.05);
  const social  = useFadeIn(0.12);
  const ba      = useFadeIn(0.1);
  const bento   = useFadeIn(0.08);
  const closing = useFadeIn(0.1);

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <div style={{ fontFamily: "'Poppins',sans-serif", background: C.bg, color: C.palladian, minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── FONTS ── */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* ══════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════ */}
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
          <img src="/K transparante.png" alt="K" style={{ height: 34, filter: 'drop-shadow(0 0 10px rgba(163,81,57,0.65))' }} />
          <span style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: '1.5rem', letterSpacing: '0.14em', background: C.gradientCta, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            KANBA
          </span>
        </div>
        <Link
          to="/auth"
          style={{
            fontFamily: "'Poppins',sans-serif", fontSize: '0.83rem', fontWeight: 500,
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

      {/* ══════════════════════════════════════════
          HERO  — CENTRALIZED, MASSIVE HEADLINE
      ══════════════════════════════════════════ */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '110px 6% 80px', overflow: 'hidden' }}>
        {/* Deep copper radial glow behind text */}
        <div style={{ position: 'absolute', inset: 0, background: C.glowHero, pointerEvents: 'none' }} />
        {/* Subtle grain texture overlay */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.04\'/%3E%3C/svg%3E")', opacity: 0.5, pointerEvents: 'none' }} />

        <div
          ref={hero.ref}
          style={{
            width: '100%', maxWidth: 1160, textAlign: 'center',
            opacity: hero.visible ? 1 : 0,
            transform: hero.visible ? 'none' : 'translateY(40px)',
            transition: 'opacity 1s ease, transform 1s ease',
            position: 'relative', zIndex: 1,
          }}
        >
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: `1px solid ${C.gold}`, background: 'rgba(179,155,111,0.09)', padding: '6px 18px', borderRadius: '3px', marginBottom: 36 }}>
            <ShieldCheck size={14} color={C.gold} />
            <span style={{ fontSize: '0.7rem', color: C.gold, fontFamily: "'Oswald',sans-serif", letterSpacing: '0.12em', fontWeight: 600 }}>
              EXCLUSIVO PARA AGÊNCIAS DE MARKETING
            </span>
          </div>

          {/* MASSIVE H1 */}
          <h1 style={{
            fontFamily: "'Oswald',sans-serif",
            fontWeight: 700,
            fontSize: 'clamp(3rem, 8vw, 7rem)',
            lineHeight: 1.02,
            color: C.palladian,
            margin: '0 0 30px',
            letterSpacing: '-0.02em',
          }}>
            O caos nas suas<br />
            <span style={{ background: C.gradientCta, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 30px rgba(163,81,57,0.4))' }}>
              tarefas está custando
            </span>
            <br />clientes.
          </h1>

          {/* Sub-headline — bigger */}
          <p style={{ fontSize: 'clamp(1.05rem, 2vw, 1.3rem)', color: C.oatmeal, lineHeight: 1.7, margin: '0 auto 44px', maxWidth: 640, fontWeight: 300 }}>
            Retome o controle da sua agência com um sistema Kanban que organiza prazos e avisa os responsáveis automaticamente no WhatsApp.
          </p>

          {/* CTA block */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <CtaButton size="lg" />
            <span style={{ fontSize: '0.82rem', color: C.oatmealDim }}>Sem necessidade de cartão de crédito · Configure em 5 minutos.</span>
          </div>

          {/* Trust row */}
          <div style={{ marginTop: 52, display: 'flex', justifyContent: 'center', gap: 'clamp(16px,3vw,40px)', flexWrap: 'wrap' }}>
            {['Setup instantâneo', 'Suporte em português', 'Cancele quando quiser'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <CheckCircle2 size={15} color={C.gold} />
                <span style={{ fontSize: '0.82rem', color: C.oatmeal }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard mock — large, centered below text */}
        <div style={{ width: '100%', maxWidth: 1000, marginTop: 72, position: 'relative', zIndex: 1 }}>
          <div style={{ position: 'absolute', inset: '-60px', background: 'radial-gradient(ellipse at center, rgba(163,81,57,0.18) 0%, transparent 65%)', pointerEvents: 'none' }} />
          <MockDashboard />
        </div>

        {/* Scroll cue */}
        <div style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', opacity: 0.35, zIndex: 1 }}>
          <ChevronDown size={22} color={C.oatmeal} style={{ animation: 'bounce 2s infinite' }} />
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SOCIAL PROOF
      ══════════════════════════════════════════ */}
      <section
        ref={social.ref}
        style={{
          background: C.bgDeep,
          borderTop: `1px solid ${C.borderCard}`,
          borderBottom: `1px solid ${C.borderCard}`,
          padding: '36px 6%',
          opacity: social.visible ? 1 : 0,
          transform: social.visible ? 'none' : 'translateY(24px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: '0.78rem', color: C.oatmealDim, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: "'Oswald',sans-serif", marginBottom: 26 }}>
            Junte-se a dezenas de agências que pararam de apagar incêndios:
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'clamp(28px,5vw,72px)', flexWrap: 'wrap' }}>
            {AGENCIES.map(name => (
              <span key={name} style={{
                fontFamily: "'Oswald',sans-serif", fontWeight: 600,
                fontSize: 'clamp(0.9rem, 1.8vw, 1.15rem)',
                color: C.oatmeal, letterSpacing: '0.12em', textTransform: 'uppercase',
                borderBottom: `1px solid ${C.borderSubtle}`, paddingBottom: 6, opacity: 0.7,
              }}>{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          BEFORE / AFTER — massive headline
      ══════════════════════════════════════════ */}
      <section
        ref={ba.ref}
        style={{
          padding: '120px 6%',
          position: 'relative', overflow: 'hidden',
          opacity: ba.visible ? 1 : 0,
          transform: ba.visible ? 'none' : 'translateY(36px)',
          transition: 'opacity 0.9s ease, transform 0.9s ease',
        }}
      >
        {/* Horizontal copper glow across section */}
        <div style={{ position: 'absolute', inset: 0, background: C.glowBA, pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1060, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <Eyebrow>A realidade que você conhece</Eyebrow>

          {/* MASSIVE H2 */}
          <h2 style={{
            fontFamily: "'Oswald',sans-serif", fontWeight: 700,
            fontSize: 'clamp(2.4rem, 5.5vw, 5rem)',
            color: C.palladian, textAlign: 'center', lineHeight: 1.05,
            margin: '0 auto 64px', maxWidth: 900,
            letterSpacing: '-0.015em',
          }}>
            Você não precisa de mais clientes.{' '}
            <span style={{ color: C.oatmeal, fontWeight: 400 }}>Você precisa parar de perder os que já tem.</span>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }} className="ba-grid">
            {/* Pain */}
            <div style={{ background: C.bgCard, border: `1px solid rgba(163,81,57,0.45)`, borderRadius: '6px', padding: '40px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #A35139, transparent)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 30 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(224,90,76,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(224,90,76,0.3)' }}>
                  <X size={18} color="#E05A4C" />
                </div>
                <h3 style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, color: '#E05A4C', fontSize: '1.2rem', letterSpacing: '0.1em', margin: 0 }}>O JEITO ANTIGO</h3>
              </div>
              {['Demandas perdidas no WhatsApp do grupo', 'Clientes ansiosos cobrando status o dia todo', 'Equipe sem saber o que priorizar', 'Prazos estourados sem ninguém avisar', 'Reuniões longas para alinhar o básico'].map(item => (
                <div key={item} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 18 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(224,90,76,0.12)', border: '1px solid rgba(224,90,76,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <X size={11} color="#E05A4C" />
                  </div>
                  <span style={{ fontSize: '0.95rem', color: C.oatmeal, lineHeight: 1.55, fontWeight: 300 }}>{item}</span>
                </div>
              ))}
            </div>

            {/* Solution — copper halo glow */}
            <div style={{ background: C.bgCard, border: `1px solid ${C.borderSubtle}`, borderRadius: '6px', padding: '40px', position: 'relative', overflow: 'hidden', boxShadow: '0 0 80px rgba(179,155,111,0.10), 0 0 0 1px rgba(179,155,111,0.08)' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${C.gold}, transparent)` }} />
              {/* Soft glow orb */}
              <div style={{ position: 'absolute', bottom: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(179,155,111,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 30 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(179,155,111,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid rgba(179,155,111,0.35)` }}>
                  <CheckCircle2 size={18} color={C.gold} />
                </div>
                <h3 style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, color: C.gold, fontSize: '1.2rem', letterSpacing: '0.1em', margin: 0 }}>O JEITO KANBA</h3>
              </div>
              {['Kanban visual: todo mundo sabe o que está acontecendo', 'Equipe e prestadores notificados no automático via WhatsApp', 'Prioridades claras e prazos visíveis para toda equipe', 'Alertas automáticos antes do prazo vencer', 'Tudo em um só lugar. Sem reuniões desnecessárias.'].map(item => (
                <div key={item} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 18 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(179,155,111,0.1)', border: `1px solid rgba(179,155,111,0.35)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <CheckCircle2 size={11} color={C.gold} />
                  </div>
                  <span style={{ fontSize: '0.95rem', color: C.palladian, lineHeight: 1.55, fontWeight: 300 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          BENTO GRID — massive headline, larger cards
      ══════════════════════════════════════════ */}
      <section
        ref={bento.ref}
        style={{
          padding: '0 6% 120px',
          position: 'relative', overflow: 'hidden',
          opacity: bento.visible ? 1 : 0,
          transform: bento.visible ? 'none' : 'translateY(36px)',
          transition: 'opacity 0.9s ease, transform 0.9s ease',
        }}
      >
        {/* Geometric dot grid background */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(179,155,111,0.12) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          pointerEvents: 'none', opacity: 0.5,
        }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <Eyebrow>Funcionalidades</Eyebrow>

          {/* MASSIVE H2 */}
          <h2 style={{
            fontFamily: "'Oswald',sans-serif", fontWeight: 700,
            fontSize: 'clamp(2.2rem, 4.5vw, 4.2rem)',
            color: C.palladian, textAlign: 'center',
            margin: '0 auto 60px',
            letterSpacing: '-0.01em', lineHeight: 1.08,
          }}>
            Tudo que sua agência precisa,<br />
            <span style={{ color: C.oatmeal, fontWeight: 400 }}>em um só lugar.</span>
          </h2>

          {/* BENTO — row 1: 7+5 */}
          <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 18, marginBottom: 18 }} className="bento-row">
            <BentoCard
              icon={<MessageSquare size={26} color="#25D366" />}
              iconBg="rgba(37,211,102,0.14)"
              tag="AUTOMAÇÃO"
              title="Notificações automáticas no WhatsApp"
              body="Mudou o status no Kanban? O responsável recebe um ping no WhatsApp na mesma hora. Sem precisar lembrar, sem precisar cobrar."
              accent="#25D366"
              extra={
                <div style={{ marginTop: 24, background: '#081E13', border: '1px solid rgba(37,211,102,0.22)', borderRadius: '7px', padding: '14px 18px', boxShadow: '0 4px 24px rgba(37,211,102,0.08)' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 20px rgba(37,211,102,0.5)' }}>
                      <MessageSquare size={19} color="#fff" />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.73rem', color: '#4CAF50', fontWeight: 600, fontFamily: "'Poppins',sans-serif" }}>✓ Kanba · Enviado agora</p>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: C.oatmeal, fontFamily: "'Poppins',sans-serif" }}>
                        📋 <b>"Post Feed – Semana 18"</b> movida para <b style={{ color: C.gold }}>Em Aprovação</b>.<br />Responsável: João Silva
                      </p>
                    </div>
                  </div>
                </div>
              }
            />
            <BentoCard
              icon={<Users size={26} color={C.gold} />}
              iconBg="rgba(179,155,111,0.12)"
              tag="TRANSPARÊNCIA"
              title="Portal do Cliente"
              body="Dê acesso restrito para o seu cliente ver o andamento das demandas. Mata a ansiedade sem ele te chamar no privado."
              accent={C.gold}
            />
          </div>

          {/* BENTO — row 2: 5+4+3 */}
          <div style={{ display: 'grid', gridTemplateColumns: '5fr 4fr 3fr', gap: 18 }} className="bento-row">
            <BentoCard
              icon={<BookOpen size={26} color="#5B8FC9" />}
              iconBg="rgba(91,143,201,0.12)"
              tag="CONHECIMENTO"
              title="Wiki Integrada"
              body="Documente processos, briefings e ideias de campanhas direto na plataforma. Canvas livre para a equipe criar."
              accent="#5B8FC9"
            />
            <BentoCard
              icon={<TrendingUp size={26} color="#9B7FD4" />}
              iconBg="rgba(155,127,212,0.12)"
              tag="CONTROLE"
              title="Visão Geral em Tempo Real"
              body="Painel executivo com total de demandas, andamento e atrasadas — num relance."
              accent="#9B7FD4"
            />
            {/* Alerts card — lighter bg to stand out */}
            <div style={{
              background: C.bgCardLight,
              border: `1px solid ${C.borderSubtle}`,
              borderRadius: '6px',
              padding: '30px 24px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: `0 0 40px rgba(179,155,111,0.07)`,
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${C.oatmeal}, transparent)`, opacity: 0.5 }} />
              <div style={{ width: 52, height: 52, borderRadius: '8px', background: 'rgba(197,193,177,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid rgba(197,193,177,0.2)`, marginBottom: 14 }}>
                <Clock size={28} color={C.palladian} />
              </div>
              <p style={{ margin: '0 0 6px', fontSize: '0.62rem', color: C.oatmeal, fontFamily: "'Oswald',sans-serif", letterSpacing: '0.14em', fontWeight: 600 }}>PRAZOS</p>
              <h3 style={{ margin: '0 0 10px', fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: '1.15rem', color: C.palladian, lineHeight: 1.2 }}>Alertas de Entrega</h3>
              <p style={{ margin: 0, fontSize: '0.87rem', color: C.oatmeal, lineHeight: 1.65, fontWeight: 300 }}>Sistema identifica tarefas atrasadas e destaca antes que o cliente precise cobrar.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CLOSING CTA — massive headline + copper glow
      ══════════════════════════════════════════ */}
      <section
        ref={closing.ref}
        style={{
          background: C.bgDeeper,
          borderTop: `1px solid ${C.borderSubtle}`,
          padding: '130px 6%',
          textAlign: 'center',
          position: 'relative', overflow: 'hidden',
          opacity: closing.visible ? 1 : 0,
          transform: closing.visible ? 'none' : 'translateY(36px)',
          transition: 'opacity 0.9s ease, transform 0.9s ease',
        }}
      >
        {/* Copper radial behind text */}
        <div style={{ position: 'absolute', inset: 0, background: C.glowFooter, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.035\'/%3E%3C/svg%3E")', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 860, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, border: `1px solid ${C.borderSubtle}`, background: 'rgba(179,155,111,0.07)', padding: '7px 20px', borderRadius: '3px', marginBottom: 32 }}>
            <Zap size={14} color={C.gold} />
            <span style={{ fontSize: '0.7rem', color: C.gold, fontFamily: "'Oswald',sans-serif", letterSpacing: '0.14em', fontWeight: 600 }}>COMECE GRATUITAMENTE HOJE</span>
          </div>

          {/* MASSIVE headline */}
          <h2 style={{
            fontFamily: "'Oswald',sans-serif", fontWeight: 700,
            fontSize: 'clamp(2.4rem, 5.5vw, 5.2rem)',
            color: C.palladian, lineHeight: 1.05,
            margin: '0 0 26px',
            letterSpacing: '-0.018em',
          }}>
            Organize demandas, cumpra prazos<br />
            <span style={{ background: C.gradientCta, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 20px rgba(163,81,57,0.35))' }}>
              e escale sua agência.
            </span>
          </h2>

          <p style={{ fontSize: 'clamp(0.95rem, 1.8vw, 1.15rem)', color: C.oatmeal, margin: '0 0 52px', fontWeight: 300, lineHeight: 1.75, maxWidth: 620, marginLeft: 'auto', marginRight: 'auto' }}>
            Cada dia com processos desorganizados é um dia que você poderia estar fechando mais clientes — ou simplesmente descansando.
          </p>

          <CtaButton size="lg" />

          <p style={{ marginTop: 20, fontSize: '0.87rem', color: C.oatmealDim }}>
            Sem cartão de crédito · Cancele a qualquer momento
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer style={{
        background: '#0F1720',
        borderTop: `1px solid ${C.borderCard}`,
        padding: '30px 6%',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/K transparante.png" alt="Kanba" style={{ height: 24, opacity: 0.65 }} />
          <span style={{ fontFamily: "'Oswald',sans-serif", fontSize: '0.95rem', color: C.oatmealDim, letterSpacing: '0.12em' }}>KANBA</span>
        </div>
        <span style={{ fontSize: '0.75rem', color: C.oatmealDim }}>© 2025 Kanba · Todos os direitos reservados</span>
        <Link to="/auth" style={{ fontSize: '0.75rem', color: C.oatmealDim, textDecoration: 'none', transition: 'color 0.2s' }}
          onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = C.gold)}
          onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = C.oatmealDim)}>
          Entrar na plataforma →
        </Link>
      </footer>

      {/* ══════════════════════════════════════════
          GLOBAL STYLES
      ══════════════════════════════════════════ */}
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50%       { transform: translateX(-50%) translateY(9px); }
        }
        * { box-sizing: border-box; }
        @media (max-width: 860px) {
          .ba-grid   { grid-template-columns: 1fr !important; }
          .bento-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
