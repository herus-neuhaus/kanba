import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare, Users, BookOpen, CheckCircle2, X,
  TrendingUp, Clock, ShieldCheck, ArrowRight, Zap, ChevronDown,
  Star, ShieldAlert, MessageCircle, HelpCircle, DollarSign,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EnterpriseLeadModal } from '@/components/EnterpriseLeadModal';

/* ═══════════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════════ */
const C = {
  bg: '#020617',         // Slate 950
  bgDeep: '#0f172a',     // Slate 900
  bgDeeper: '#010409',   // Near black
  bgCard: '#1e293b',     // Slate 800
  bgCardLight: '#334155', // Slate 700
  palladian: '#f8fafc',  // Slate 50
  oatmeal: '#94a3b8',    // Slate 400
  oatmealDim: '#64748b', // Slate 500
  gold: '#FBBF24',      // Vibrant Gold (Amber 400)
  goldBright: '#FDE047', // Yellow 300
  copper: '#D97706',     // Amber 600
  copperLight: '#F59E0B', // Amber 500
  // CTA gradients
  gradientCta: 'linear-gradient(135deg, #D97706 0%, #F59E0B 35%, #FBBF24 75%, #FDE047 100%)',
  gradientCtaHov: 'linear-gradient(135deg, #B45309 0%, #D97706 35%, #F59E0B 75%, #FBBF24 100%)',
  borderSubtle: 'rgba(148, 163, 184, 0.12)',
  borderCard: 'rgba(148, 163, 184, 0.08)',
  // Glows updated to Amber
  glowHero: 'radial-gradient(ellipse 900px 600px at 50% 50%, rgba(251,191,36,0.12) 0%, rgba(15,23,42,0.0) 75%)',
  glowBA: 'radial-gradient(ellipse 1200px 400px at 50% 60%, rgba(251,191,36,0.08) 0%, transparent 75%)',
  glowFooter: 'radial-gradient(ellipse 800px 500px at 50% 40%, rgba(251,191,36,0.15) 0%, transparent 70%)',
  glowCard: '0 0 40px rgba(251,191,36,0.1)',
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
          fontFamily: "'Inter', sans-serif",
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
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 4, padding: '3px 16px', fontSize: '0.62rem', color: C.oatmealDim, fontFamily: "'Inter',sans-serif", letterSpacing: '0.06em' }}>
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
              <span style={{ fontSize: '0.55rem', fontFamily: "'Inter',sans-serif", color: C.oatmealDim, letterSpacing: '0.09em', fontWeight: 600 }}>{col.title.toUpperCase()}</span>
              <span style={{ marginLeft: 'auto', fontSize: '0.5rem', background: 'rgba(255,255,255,0.07)', borderRadius: 3, padding: '1px 5px', color: C.oatmealDim }}>{col.tasks.length}</span>
            </div>
            {col.tasks.map(({ t, p }) => (
              <div key={t} style={{ background: C.bgDeep, borderRadius: 5, padding: '8px 9px', borderLeft: `2px solid ${col.color}`, position: 'relative' }}>
                <div style={{ position: 'absolute', top: 6, right: 7, width: 5, height: 5, borderRadius: '50%', background: priorityColor[p] }} />
                <span style={{ fontSize: '0.57rem', color: C.palladian, fontFamily: "'Inter',sans-serif", lineHeight: 1.45, display: 'block', paddingRight: 10 }}>{t}</span>
                <div style={{ marginTop: 7, display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[1, 2].map(i => (
                    <span key={i} style={{ width: 15, height: 15, borderRadius: '50%', background: `hsl(${i * 55 + 195}, 45%, 48%)`, display: 'inline-block', border: `1.5px solid ${C.bgDeep}` }} />
                  ))}
                  <span style={{ fontSize: '0.48rem', color: C.oatmealDim, marginLeft: 2, fontFamily: "'Inter',sans-serif" }}>Due 15/05</span>
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
          <p style={{ fontSize: '0.62rem', color: '#4CAF50', fontFamily: "'Inter',sans-serif", margin: 0, fontWeight: 600 }}>✓ Notificação automática enviada · Agora</p>
          <p style={{ fontSize: '0.57rem', color: C.oatmeal, fontFamily: "'Inter',sans-serif", margin: 0 }}>
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
    <p style={{ textAlign: 'center', fontSize: '0.68rem', color: C.gold, letterSpacing: '0.2em', fontFamily: "'Inter',sans-serif", textTransform: 'uppercase', marginBottom: 20, margin: '0 0 20px' }}>
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
          <p style={{ margin: '0 0 7px', fontSize: '0.62rem', color: accent, fontFamily: "'Inter',sans-serif", letterSpacing: '0.14em', fontWeight: 600 }}>{tag}</p>
          <h3 style={{ margin: '0 0 10px', fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: '1.15rem', color: C.palladian, lineHeight: 1.2 }}>{title}</h3>
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
  const [enterpriseModalOpen, setEnterpriseModalOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: C.bg, color: C.palladian, minHeight: '100vh', overflowX: 'hidden' }}>

      {/* Fonts are globally imported in index.css */}

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
          <span style={{ fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: '1.5rem', letterSpacing: '0.14em', background: C.gradientCta, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
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
            <span style={{ fontSize: '0.7rem', color: C.gold, fontFamily: "'Inter',sans-serif", letterSpacing: '0.12em', fontWeight: 600 }}>
              EXCLUSIVO PARA AGÊNCIAS DE MARKETING
            </span>
          </div>

          {/* MASSIVE H1 */}
          <h1 style={{
            fontFamily: "'Inter',sans-serif",
            fontWeight: 800,
            fontSize: 'clamp(2.5rem, 6vw, 5rem)',
            lineHeight: 1.1,
            color: C.palladian,
            margin: '0 0 24px',
            letterSpacing: '-0.03em',
          }}>
            Pare de ser o <span style={{ color: C.gold }}>"Gerente de Cobrança"</span> do seu time.<br />
            <span style={{ background: C.gradientCta, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 30px rgba(163,81,57,0.4))' }}>
              Deixe o Kanba fazer o trabalho sujo.
            </span>
          </h1>

          {/* Sub-headline — bigger */}
          <p style={{ fontSize: 'clamp(1.1rem, 2vw, 1.4rem)', color: C.oatmeal, lineHeight: 1.6, margin: '0 auto 40px', maxWidth: 800, fontWeight: 300 }}>
            O único sistema de gestão que usa IA e WhatsApp para cobrar prazos e eliminar o caos na sua agência.
          </p>

          {/* CTA block */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <CtaButton label="7 Dias Grátis - Sem Cartão" size="lg" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Badge variant="outline" style={{ borderColor: C.gold, color: C.gold, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sem Cartão</Badge>
              <span style={{ fontSize: '0.85rem', color: C.oatmealDim }}>Acesso instantâneo a todas as funções PRO.</span>
            </div>
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
          <p style={{ textAlign: 'center', fontSize: '0.78rem', color: C.oatmealDim, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: "'Inter',sans-serif", marginBottom: 26 }}>
            Junte-se a dezenas de agências que pararam de apagar incêndios:
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'clamp(28px,5vw,72px)', flexWrap: 'wrap' }}>
            {AGENCIES.map(name => (
              <span key={name} style={{
                fontFamily: "'Inter',sans-serif", fontWeight: 600,
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
            fontFamily: "'Inter',sans-serif", fontWeight: 700,
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
                <h3 style={{ fontFamily: "'Inter',sans-serif", fontWeight: 700, color: '#E05A4C', fontSize: '1.2rem', letterSpacing: '0.1em', margin: 0 }}>O JEITO ANTIGO</h3>
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
                <h3 style={{ fontFamily: "'Inter',sans-serif", fontWeight: 700, color: C.gold, fontSize: '1.2rem', letterSpacing: '0.1em', margin: 0 }}>O JEITO KANBA</h3>
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
            fontFamily: "'Inter',sans-serif", fontWeight: 700,
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
                      <p style={{ margin: 0, fontSize: '0.73rem', color: '#4CAF50', fontWeight: 600, fontFamily: "'Inter',sans-serif" }}>✓ Kanba · Enviado agora</p>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: C.oatmeal, fontFamily: "'Inter',sans-serif" }}>
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

          {/* BENTO — row 2: 4+4+4 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }} className="bento-row">
            <BentoCard
              icon={<BookOpen size={26} color="#5B8FC9" />}
              iconBg="rgba(91,143,201,0.12)"
              tag="CONHECIMENTO"
              title="Wiki & Processos"
              body="Documente briefings, senhas e playbooks direto no projeto. Equipe alinhada sempre."
              accent="#5B8FC9"
            />
            <BentoCard
              icon={<TrendingUp size={26} color="#9B7FD4" />}
              iconBg="rgba(155,127,212,0.12)"
              tag="INTELIGÊNCIA"
              title="Relatórios de Gargalo"
              body="Saiba onde o fluxo trava. Gestão baseada em dados, não em palpites."
              accent="#9B7FD4"
              extra={
                <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
                  {[45, 80, 25].map((val, i) => (
                    <div key={i} style={{ flex: 1, height: 40, background: 'rgba(255,255,255,0.03)', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${val}%`, background: i === 1 ? '#E05A4C' : '#5BAA7E', opacity: 0.6 }} />
                    </div>
                  ))}
                </div>
              }
            />
            <BentoCard
              icon={<Clock size={26} color={C.palladian} />}
              iconBg="rgba(255,255,255,0.05)"
              tag="PRAZOS"
              title="Alertas de Entrega"
              body="O sistema destaca tarefas próximas do vencimento para evitar atrasos críticos."
              accent={C.oatmeal}
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PRICING SECTION — Responsive & Premium
      ══════════════════════════════════════════ */}
      <section style={{ padding: '80px 6% 120px', background: C.bg }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Eyebrow>Investimento</Eyebrow>
          <h2 style={{
            fontFamily: "'Inter',sans-serif", fontWeight: 700,
            fontSize: 'clamp(2rem, 4.5vw, 3.8rem)',
            color: C.palladian, textAlign: 'center', margin: '0 0 60px',
            lineHeight: 1.1
          }}>
            Escolha o plano ideal para<br />
            <span style={{ color: C.oatmeal, fontWeight: 400 }}>escalar sua operação.</span>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {/* Basic */}
            <Card style={{ background: C.bgCard, borderColor: C.borderCard, borderTop: 'none', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: 4, background: C.oatmealDim, width: '100%', borderRadius: '4px 4px 0 0' }} />
              <CardHeader>
                <CardTitle style={{ color: C.palladian }}>Basic</CardTitle>
                <CardDescription>Para começar sua gestão.</CardDescription>
              </CardHeader>
              <CardContent style={{ flex: 1 }}>
                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 800, color: C.palladian }}>R$ 49</span>
                  <span style={{ color: C.oatmeal }}>/mês</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    '1 Usuário',
                    '3 Projetos Ativos',
                    'Kanban Visual',
                    'Wiki do Projeto',
                  ].map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CheckCircle2 size={16} color={C.oatmealDim} />
                      <span style={{ fontSize: '0.85rem', color: C.oatmeal }}>{f}</span>
                    </div>
                  ))}
                  {[
                    'Notificações WhatsApp',
                    'Relatórios de Gargalo',
                  ].map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0.4 }}>
                      <X size={16} color={C.oatmealDim} />
                      <span style={{ fontSize: '0.85rem', color: C.oatmealDim, textDecoration: 'line-through' }}>{f}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <a href="https://pay.cakto.com.br/34bt8zp" target="_blank" rel="noopener noreferrer" style={{ width: '100%', textDecoration: 'none' }}>
                  <button style={{ width: '100%', padding: '12px', borderRadius: '4px', border: `1px solid ${C.borderSubtle}`, background: 'transparent', color: C.palladian, fontWeight: 600, cursor: 'pointer' }}>
                    Escolher Basic
                  </button>
                </a>
              </CardFooter>
            </Card>

            {/* Standard */}
            <Card style={{ background: C.bgCard, borderColor: C.borderCard, borderTop: 'none', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: 4, background: '#475569', width: '100%', borderRadius: '4px 4px 0 0' }} />
              <CardHeader>
                <CardTitle style={{ color: C.palladian }}>Standard</CardTitle>
                <CardDescription>Para pequenas equipes.</CardDescription>
              </CardHeader>
              <CardContent style={{ flex: 1 }}>
                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 800, color: C.palladian }}>R$ 99</span>
                  <span style={{ color: C.oatmeal }}>/mês</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    'Até 3 Usuários',
                    '10 Projetos Ativos',
                    'Kanban Visual',
                    'Wiki do Projeto',
                  ].map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CheckCircle2 size={16} color={C.oatmealDim} />
                      <span style={{ fontSize: '0.85rem', color: C.oatmeal }}>{f}</span>
                    </div>
                  ))}
                  {[
                    'Notificações WhatsApp',
                    'Relatórios de Gargalo',
                  ].map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0.4 }}>
                      <X size={16} color={C.oatmealDim} />
                      <span style={{ fontSize: '0.85rem', color: C.oatmealDim, textDecoration: 'line-through' }}>{f}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <a href="https://pay.cakto.com.br/ieah9nj_849299" target="_blank" rel="noopener noreferrer" style={{ width: '100%', textDecoration: 'none' }}>
                  <button style={{ width: '100%', padding: '12px', borderRadius: '4px', border: `1px solid ${C.borderSubtle}`, background: 'transparent', color: C.palladian, fontWeight: 600, cursor: 'pointer' }}>
                    Escolher Standard
                  </button>
                </a>
              </CardFooter>
            </Card>

            {/* Profissional */}
            <Card style={{ background: C.bgDeep, borderColor: C.gold, position: 'relative', transform: 'scale(1.05)', zIndex: 10, boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 20px rgba(251,191,36,0.1)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: 4, background: C.gradientCta, width: '100%', borderRadius: '4px 4px 0 0' }} />
              <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)' }}>
                <Badge style={{ background: C.gold, color: C.bg, fontWeight: 700 }}>RECOMENDADO</Badge>
              </div>
              <CardHeader>
                <CardTitle style={{ color: C.palladian, display: 'flex', alignItems: 'center', gap: 8 }}>
                  Profissional <Star size={18} fill={C.gold} color={C.gold} />
                </CardTitle>
                <CardDescription style={{ color: C.oatmeal }}>O plano ideal para agências em crescimento.</CardDescription>
              </CardHeader>
              <CardContent style={{ flex: 1 }}>
                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 800, color: C.palladian }}>R$ 249</span>
                  <span style={{ color: C.oatmeal }}>/mês</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    'Até 10 Usuários',
                    '30 Projetos Ativos',
                    'Notificações WhatsApp',
                    'Relatórios de Gargalo',
                    'Wiki & Processos',
                    'Portal do Cliente',
                  ].map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CheckCircle2 size={16} color={C.gold} />
                      <span style={{ fontSize: '0.85rem', color: C.palladian, fontWeight: 500 }}>{f}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <a href="https://pay.cakto.com.br/bdzd6t9" target="_blank" rel="noopener noreferrer" style={{ width: '100%', textDecoration: 'none' }}>
                  <button style={{ width: '100%', padding: '12px', borderRadius: '4px', border: 'none', background: C.gradientCta, color: C.bg, fontWeight: 700, cursor: 'pointer' }}>
                    Ativar Agora
                  </button>
                </a>
              </CardFooter>
            </Card>

            {/* Enterprise */}
            <Card style={{ background: C.bgCard, borderColor: C.borderCard, borderTop: 'none', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: 4, background: '#1e293b', width: '100%', borderRadius: '4px 4px 0 0' }} />
              <CardHeader>
                <CardTitle style={{ color: C.palladian }}>Enterprise</CardTitle>
                <CardDescription>Escala total sem limites.</CardDescription>
              </CardHeader>
              <CardContent style={{ flex: 1 }}>
                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontSize: '2.1rem', fontWeight: 800, color: C.palladian }}>R$ 899</span>
                  <span style={{ color: C.oatmeal }}>/mês</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    'Usuários Ilimitados',
                    'Projetos Ilimitados',
                    'Múltiplas Conexões WhatsApp',
                    'Relatórios Customizados',
                    'Suporte Prioritário 1-on-1',
                    'Treinamento de Equipe',
                  ].map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CheckCircle2 size={16} color={C.palladian} />
                      <span style={{ fontSize: '0.85rem', color: C.oatmeal }}>{f}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <button 
                  onClick={() => setEnterpriseModalOpen(true)}
                  style={{ width: '100%', padding: '12px', borderRadius: '4px', border: `1px solid ${C.borderSubtle}`, background: 'transparent', color: C.palladian, fontWeight: 600, cursor: 'pointer' }}
                >
                  Falar com Consultor
                </button>
              </CardFooter>
            </Card>
          </div>

          <EnterpriseLeadModal 
            isOpen={enterpriseModalOpen}
            onClose={() => setEnterpriseModalOpen(false)}
          />
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FAQ SECTION — Objection Breaking
      ══════════════════════════════════════════ */}
      <section style={{ padding: '60px 6% 100px', background: C.bgDeeper }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 700, color: C.palladian, marginBottom: 40 }}>Perguntas Frequentes</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { q: 'Por que vocês não pedem cartão de crédito no trial?', a: 'Queremos remover toda a barreira. Você testa, aplica na sua agência e só paga se o sistema realmente resolver seu gargalo produtivo. Sem letras miúdas.' },
              { q: 'O robô de WhatsApp funciona como?', a: 'O Kanba se conecta ao seu WhatsApp via API segura. Toda vez que uma tarefa muda de coluna ou está perto do prazo, o sistema envia uma mensagem personalizada para o responsável.' },
              { q: 'Posso convidar meus prestadores externos?', a: 'Sim! Você pode convidar membros com permissões limitadas. Eles só veem o que você autorizar, mantendo a segurança dos outros projetos.' },
              { q: 'E se eu precisar de ajuda para configurar?', a: 'Nosso suporte é 100% em português. No plano PRÓ e Elite, você tem acesso a consultores que ajudam a desenhar seu fluxo de trabalho.' }
            ].map((faq, i) => (
              <div key={i} style={{ background: C.bgCard, padding: '24px', borderRadius: '6px', border: `1px solid ${C.borderCard}` }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: C.gold, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <HelpCircle size={18} /> {faq.q}
                </h3>
                <p style={{ color: C.oatmeal, lineHeight: 1.6, fontSize: '0.95rem' }}>{faq.a}</p>
              </div>
            ))}
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
            <span style={{ fontSize: '0.7rem', color: C.gold, fontFamily: "'Inter',sans-serif", letterSpacing: '0.14em', fontWeight: 600 }}>COMECE GRATUITAMENTE HOJE</span>
          </div>

          {/* MASSIVE headline */}
          <h2 style={{
            fontFamily: "'Inter',sans-serif", fontWeight: 700,
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
          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '0.95rem', color: C.oatmealDim, letterSpacing: '0.12em' }}>KANBA</span>
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
