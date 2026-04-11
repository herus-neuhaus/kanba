import { useState } from 'react';
import { Navigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Mail, Lock, User as UserIcon, Loader2, CheckCircle2,
  ArrowRight, ShieldCheck, Phone,
} from 'lucide-react';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';

/* ─────────────────────────────────────────
   Design tokens — identical to Landing.tsx
───────────────────────────────────────── */
const C = {
  bg: '#212F3D',
  bgDeep: '#172028',
  bgDeeper: '#111922',
  bgCard: '#2A3A4C',
  bgInput: '#1C2A38',
  palladian: '#EEE9DF',
  oatmeal: '#C9C1B1',
  oatmealDim: '#8E8779',
  gold: '#B39B6F',
  goldBright: '#C9AE7E',
  copper: '#A35139',
  borderSubtle: 'rgba(179,155,111,0.22)',
  borderCard: 'rgba(238,233,223,0.08)',
  gradientCta: 'linear-gradient(135deg, #8B3B26 0%, #A35139 35%, #B39B6F 75%, #C9AE7E 100%)',
  gradientCtaHov: 'linear-gradient(135deg, #9E4733 0%, #B8634A 35%, #C5AC80 75%, #D4BC90 100%)',
  glowRadial: 'radial-gradient(ellipse 700px 500px at 50% 30%, rgba(163,81,57,0.16) 0%, transparent 70%)',
};

/* ─────────────────────────────────────────
   Reusable input field
───────────────────────────────────────── */
function AuthInput({
  type = 'text', placeholder, value, onChange, icon, required = true,
}: {
  type?: string; placeholder: string; value: string;
  onChange: (v: string) => void; icon: React.ReactNode; required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      {/* icon */}
      <div style={{
        position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
        color: focused ? C.gold : C.oatmealDim,
        transition: 'color 0.2s', zIndex: 1, display: 'flex', alignItems: 'center',
      }}>
        {icon}
      </div>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        style={{
          width: '100%',
          height: 52,
          paddingLeft: 46,
          paddingRight: 16,
          background: C.bgInput,
          border: `1px solid ${focused ? C.borderSubtle : 'rgba(238,233,223,0.06)'}`,
          borderRadius: 4,
          color: C.palladian,
          fontFamily: "'Poppins', sans-serif",
          fontSize: '0.9rem',
          fontWeight: 400,
          outline: 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          boxShadow: focused ? `0 0 0 3px rgba(179,155,111,0.12)` : 'none',
        }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────
   Main Auth Page
───────────────────────────────────────── */
export default function Auth() {
  const { session, loading: authLoading, signUp, signIn } = useAuth();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const { toast } = useToast();

  const [isSignUp, setIsSignUp] = useState(returnUrl?.includes('/join/') || false);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone]       = useState('');
  const [submitting, setSubmitting] = useState(false);

  /* ── Loading spinner ── */
  if (authLoading) return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: C.bgDeeper }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', border: `2px solid ${C.gold}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  if (session && !authLoading) return <Navigate to={returnUrl || '/'} replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isSignUp) {
        await signUp(email, password, fullName, phone);
        toast({ title: 'Conta criada!', description: 'Verifique seu e-mail para ativar o acesso.' });
      } else {
        await signIn(email, password);
        toast({ title: 'Acesso autorizado', description: 'Bem-vindo de volta ao Kanba.' });
      }
    } catch (err: any) {
      toast({ title: 'Falha na autenticação', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', background: C.bg, fontFamily: "'Poppins', sans-serif", overflow: 'hidden' }}>

      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* ══════════════════════════════════════
          LEFT COLUMN  (hidden on mobile)
          Brand panel with value props
      ══════════════════════════════════════ */}
      <div style={{
        display: 'none',
        width: '52%',
        background: C.bgDeeper,
        flexDirection: 'column',
        padding: '52px 60px',
        position: 'relative',
        overflow: 'hidden',
        borderRight: `1px solid ${C.borderCard}`,
      }} className="auth-left-panel">

        {/* Copper radial glow */}
        <div style={{ position: 'absolute', inset: 0, background: C.glowRadial, pointerEvents: 'none' }} />
        {/* Noise texture */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
          pointerEvents: 'none',
        }} />
        {/* Geometric dot grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(179,155,111,0.10) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
          pointerEvents: 'none', opacity: 0.6,
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
          <img src="/K transparante.png" alt="K" style={{ height: 36, filter: 'drop-shadow(0 0 10px rgba(163,81,57,0.6))' }} />
          <span style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: '1.5rem', letterSpacing: '0.14em', background: C.gradientCta, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            KANBA
          </span>
        </div>

        {/* Main copy */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1, marginTop: 60 }}>
          {/* Eyebrow */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: `1px solid ${C.borderSubtle}`, background: 'rgba(179,155,111,0.07)', padding: '5px 14px', borderRadius: 3, marginBottom: 28, alignSelf: 'flex-start' }}>
            <ShieldCheck size={13} color={C.gold} />
            <span style={{ fontSize: '0.65rem', color: C.gold, fontFamily: "'Oswald',sans-serif", letterSpacing: '0.12em', fontWeight: 600 }}>
              EXCLUSIVO PARA AGÊNCIAS
            </span>
          </div>

          <h2 style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 'clamp(2.8rem, 4vw, 4.5rem)', lineHeight: 1.03, color: C.palladian, margin: '0 0 24px', letterSpacing: '-0.02em' }}>
            Acesse sua<br />
            <span style={{ background: C.gradientCta, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              central de
            </span>
            <br />comando.
          </h2>

          <p style={{ fontSize: '1rem', color: C.oatmeal, lineHeight: 1.75, maxWidth: 440, fontWeight: 300, margin: '0 0 48px' }}>
            O Kanba centraliza todas as demandas da sua agência e usa automação no WhatsApp para garantir que nada atrase e nada se perca.
          </p>

          {/* Feature bullets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              'Kanban visual com prioridades e prazos',
              'Notificações automáticas via WhatsApp',
              'Portal do cliente sem chamadas no privado',
              'Wiki integrada para briefings e processos',
            ].map(text => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(179,155,111,0.1)', border: `1px solid rgba(179,155,111,0.35)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckCircle2 size={10} color={C.gold} />
                </div>
                <span style={{ fontSize: '0.88rem', color: C.oatmeal, fontWeight: 300 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <p style={{ fontSize: '0.72rem', color: C.oatmealDim, position: 'relative', zIndex: 1, marginTop: 40 }}>
          © 2025 Kanba · Todos os direitos reservados
        </p>
      </div>

      {/* ══════════════════════════════════════
          RIGHT COLUMN — Auth form
      ══════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 32px', position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>

        {/* Subtle glow behind form */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 600px 500px at 50% 45%, rgba(163,81,57,0.10) 0%, transparent 65%)', pointerEvents: 'none' }} />

        {/* Mobile-only logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48, position: 'relative', zIndex: 1 }} className="auth-mobile-logo">
          <img src="/K transparante.png" alt="K" style={{ height: 30, filter: 'drop-shadow(0 0 8px rgba(163,81,57,0.5))' }} />
          <span style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: '1.3rem', letterSpacing: '0.14em', background: C.gradientCta, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            KANBA
          </span>
        </div>

        {/* Form card */}
        <div style={{
          width: '100%', maxWidth: 440,
          background: C.bgCard,
          border: `1px solid ${C.borderCard}`,
          borderRadius: 6,
          padding: 'clamp(28px,5vw,44px)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(179,155,111,0.06)',
          position: 'relative', zIndex: 1,
        }}>
          {/* Top accent line */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${C.copper}, ${C.gold}, transparent)`, borderRadius: '6px 6px 0 0' }} />

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: '0.65rem', color: C.gold, fontFamily: "'Oswald',sans-serif", letterSpacing: '0.16em', fontWeight: 600, margin: '0 0 10px', textTransform: 'uppercase' }}>
              {isSignUp ? 'CRIAR CONTA' : 'ACESSO À PLATAFORMA'}
            </p>
            <h1 style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 2.8rem)', color: C.palladian, margin: 0, letterSpacing: '-0.01em', lineHeight: 1.05 }}>
              {isSignUp ? 'Começar agora.' : 'Entrar.'}
            </h1>
            <p style={{ fontSize: '0.85rem', color: C.oatmealDim, margin: '10px 0 0', fontWeight: 300 }}>
              {isSignUp ? 'Preencha os dados para criar sua conta.' : 'Entre com seu e-mail e senha.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
              {isSignUp && (
                <>
                  <AuthInput
                    placeholder="Seu nome completo"
                    value={fullName}
                    onChange={setFullName}
                    icon={<UserIcon size={17} />}
                  />
                  {/* Phone input — styled to match */}
                  <div style={{ position: 'relative' }} className="kanba-phone-wrap">
                    <PhoneInput
                      defaultCountry="br"
                      value={phone}
                      onChange={setPhone}
                      className="w-full"
                      inputStyle={{
                        width: '100%',
                        height: 52,
                        background: C.bgInput,
                        border: `1px solid rgba(238,233,223,0.06)`,
                        borderRadius: 4,
                        color: C.palladian,
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: '0.9rem',
                        paddingLeft: 54,
                      }}
                      countrySelectorStyleProps={{
                        style: {
                          background: 'transparent',
                          border: 'none',
                          height: 52,
                        },
                        buttonStyle: {
                          background: 'transparent',
                          border: 'none',
                          paddingLeft: 12,
                        },
                      }}
                    />
                  </div>
                </>
              )}

              <AuthInput
                type="email"
                placeholder="seunome@agencia.com"
                value={email}
                onChange={setEmail}
                icon={<Mail size={17} />}
              />

              <AuthInput
                type="password"
                placeholder={isSignUp ? 'Definir senha' : 'Sua senha'}
                value={password}
                onChange={setPassword}
                icon={<Lock size={17} />}
              />
            </div>

            {/* Submit */}
            <SubmitButton submitting={submitting} label={isSignUp ? 'CRIAR CONTA' : 'ENTRAR NA PLATAFORMA'} />
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: C.borderCard }} />
            <span style={{ fontSize: '0.65rem', color: C.oatmealDim, fontFamily: "'Oswald',sans-serif", letterSpacing: '0.12em', textTransform: 'uppercase' }}>ou</span>
            <div style={{ flex: 1, height: 1, background: C.borderCard }} />
          </div>

          {/* Toggle sign-up ↔ sign-in */}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            style={{
              width: '100%', padding: '13px 0',
              background: 'transparent',
              border: `1px solid ${C.borderSubtle}`,
              borderRadius: 4,
              fontFamily: "'Oswald',sans-serif",
              fontWeight: 600,
              fontSize: '0.85rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: C.oatmeal,
              cursor: 'pointer',
              transition: 'all 0.22s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.gold; (e.currentTarget as HTMLButtonElement).style.color = C.gold; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(179,155,111,0.06)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.borderSubtle; (e.currentTarget as HTMLButtonElement).style.color = C.oatmeal; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            {isSignUp ? 'Já tenho conta — Entrar' : 'Criar conta gratuita'}
            <ArrowRight size={14} />
          </button>

          {/* Legal */}
          <p style={{ marginTop: 20, textAlign: 'center', fontSize: '0.72rem', color: C.oatmealDim, lineHeight: 1.6 }}>
            Ao continuar você concorda com os{' '}
            <span style={{ color: C.gold, cursor: 'pointer', borderBottom: `1px solid ${C.borderSubtle}` }}>
              Termos de Uso
            </span>
            {' '}do Kanba.
          </p>
        </div>

        {/* Back to landing */}
        <Link
          to="/landing"
          style={{ marginTop: 24, fontSize: '0.75rem', color: C.oatmealDim, textDecoration: 'none', position: 'relative', zIndex: 1, transition: 'color 0.2s' }}
          onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = C.gold)}
          onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = C.oatmealDim)}
        >
          ← Voltar para a página inicial
        </Link>
      </div>

      {/* Global overrides */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        /* Show left panel on desktop */
        @media (min-width: 900px) {
          .auth-left-panel  { display: flex !important; }
          .auth-mobile-logo { display: none !important; }
        }
        /* Phone input reset to match theme */
        .kanba-phone-wrap .react-international-phone-input-container {
          width: 100%;
        }
        .kanba-phone-wrap .react-international-phone-country-selector-dropdown {
          background: #1C2A38 !important;
          border: 1px solid rgba(179,155,111,0.22) !important;
          border-radius: 4px !important;
        }
        .kanba-phone-wrap .react-international-phone-country-selector-list-item {
          color: #EEE9DF !important;
          font-family: 'Poppins', sans-serif !important;
          font-size: 0.85rem !important;
        }
        .kanba-phone-wrap .react-international-phone-country-selector-list-item:hover {
          background: rgba(179,155,111,0.10) !important;
        }
        .kanba-phone-wrap input::placeholder { color: #8E8779 !important; }
        .kanba-phone-wrap .react-international-phone-flag-emoji { font-size: 1.1rem; }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────
   Submit button with shimmer + glow
───────────────────────────────────────── */
function SubmitButton({ submitting, label }: { submitting: boolean; label: string }) {
  const [hov, setHov] = useState(false);
  const gradientCta = 'linear-gradient(135deg, #8B3B26 0%, #A35139 35%, #B39B6F 75%, #C9AE7E 100%)';
  const gradientHov = 'linear-gradient(135deg, #9E4733 0%, #B8634A 35%, #C5AC80 75%, #D4BC90 100%)';
  return (
    <button
      type="submit"
      disabled={submitting}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', height: 52,
        background: submitting ? 'rgba(163,81,57,0.5)' : (hov ? gradientHov : gradientCta),
        border: 'none', borderRadius: 4, cursor: submitting ? 'not-allowed' : 'pointer',
        fontFamily: "'Oswald',sans-serif", fontWeight: 700,
        fontSize: '0.95rem', letterSpacing: '0.1em', textTransform: 'uppercase',
        color: '#EEE9DF',
        boxShadow: hov && !submitting
          ? '0 0 0 1px rgba(201,174,126,0.4), 0 8px 32px rgba(163,81,57,0.55), 0 0 60px rgba(163,81,57,0.18)'
          : '0 4px 20px rgba(163,81,57,0.35)',
        transform: hov && !submitting ? 'translateY(-2px)' : 'none',
        transition: 'all 0.25s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Shimmer */}
      <span style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.13) 50%, transparent 70%)',
        transform: hov ? 'translateX(100%)' : 'translateX(-100%)',
        transition: 'transform 0.5s ease',
      }} />
      {submitting
        ? <Loader2 size={20} style={{ animation: 'spin 0.8s linear infinite' }} />
        : <>{label}<ArrowRight size={16} /></>
      }
    </button>
  );
}
