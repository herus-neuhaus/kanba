import React, { useState } from 'react';
import { Navigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  Mail, Lock, User as UserIcon, Loader2, CheckCircle2,
  ArrowRight, ShieldCheck, Phone, Eye, EyeOff, XCircle,
  MailCheck,
} from 'lucide-react';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';

/* ─────────────────────────────────────────
   Design tokens
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
  success: '#4ade80',
  borderSubtle: 'rgba(179,155,111,0.22)',
  borderCard: 'rgba(238,233,223,0.08)',
  gradientCta: 'linear-gradient(135deg, #8B3B26 0%, #A35139 35%, #B39B6F 75%, #C9AE7E 100%)',
  gradientCtaHov: 'linear-gradient(135deg, #9E4733 0%, #B8634A 35%, #C5AC80 75%, #D4BC90 100%)',
  glowRadial: 'radial-gradient(ellipse 700px 500px at 50% 30%, rgba(163,81,57,0.16) 0%, transparent 70%)',
};

/* ─────────────────────────────────────────
   Shared form data type
───────────────────────────────────────── */
type AuthFormData = {
  email: string;
  confirmEmail: string;
  password: string;
  fullName: string;
  phone: string;
  confirmPassword: string;
};

/* ─────────────────────────────────────────
   Helper — Portuguese required_error
───────────────────────────────────────── */
const str = (msg = 'Campo obrigatório') =>
  z.string({
    required_error: msg,
    invalid_type_error: msg,
  });

/* ─────────────────────────────────────────
   BLOCKLIST — commonly mistyped TLDs
   If the domain ends with any of these,
   Zod rejects before we even hit Supabase.
───────────────────────────────────────── */
const TYPO_TLDS = [
  '.om',    // .com typo
  '.con',   // .com typo
  '.cm',    // .com typo
  '.cmo',   // .com typo
  '.coom',  // .com typo
  '.comm',  // .com typo
  '.cim',   // .com typo
  '.vom',   // .com typo (V next to C)
  '.xom',   // .com typo (X next to C)
  '.c0m',   // .com typo (zero for o)
  '.nt',    // .net typo
  '.neet',  // .net typo
  '.ogr',   // .org typo
  '.orgg',  // .org typo
  '.gmial', // gmail typo in domain body
  '.gmai',  // gmail typo in domain body
];

function hasTypoTLD(email: string): boolean {
  const lower = email.toLowerCase();
  const atIdx = lower.lastIndexOf('@');
  if (atIdx === -1) return false;
  const domain = lower.slice(atIdx + 1);
  return TYPO_TLDS.some((tld) => domain.endsWith(tld));
}

/* ─────────────────────────────────────────
   SIGN-IN schema  (loose — server validates)
───────────────────────────────────────── */
const signInSchema = z.object({
  email:           str('E-mail é obrigatório').min(1, 'E-mail é obrigatório').email('Formato de e-mail inválido'),
  password:        str('Senha é obrigatória').min(1, 'Senha é obrigatória'),
  fullName:        z.string().optional().default(''),
  phone:           z.string().optional().default(''),
  confirmPassword: z.string().optional().default(''),
  confirmEmail:    z.string().optional().default(''),
});

/* ─────────────────────────────────────────
   SIGN-UP schema  (strict — double confirm)
   ‣ email checked for typo TLDs
   ‣ confirmEmail must match email
   ‣ confirmPassword must match password
───────────────────────────────────────── */
const signUpSchema = z
  .object({
    fullName: str('Nome é obrigatório')
      .min(2, 'Nome deve ter pelo menos 2 caracteres')
      .max(100, 'Nome muito longo'),

    phone: str('Telefone é obrigatório')
      .min(1, 'Telefone é obrigatório')
      .refine(
        (v) => {
          const digits = v.replace(/\D/g, '');
          // If it's a Brazilian number (starts with 55), check for 12 or 13 digits (55 + 10/11)
          if (v.startsWith('+55')) {
            return digits.length === 12 || digits.length === 13;
          }
          // For other countries, just ensure it has a reasonable amount of digits (min 7)
          return digits.length >= 7;
        },
        'Telefone inválido ou incompleto',
      ),

    email: str('E-mail é obrigatório')
      .min(1, 'E-mail é obrigatório')
      .email('Formato de e-mail inválido')
      .refine(
        (v) => /\.[a-zA-Z]{2,}$/.test(v.toLowerCase()),
        'Domínio inválido — confira o final (ex: .com, .com.br)',
      )
      .refine(
        (v) => !hasTypoTLD(v),
        'Domínio parece conter um erro de digitação. Verifique se digitou corretamente (ex: .com e não .con, .om, .cm).',
      ),

    confirmEmail: str('Confirme o e-mail').min(1, 'Confirme o e-mail'),

    password: str('Senha é obrigatória')
      .min(8, 'Mínimo de 8 caracteres')
      .regex(/[A-Z]/, 'Deve conter pelo menos uma letra maiúscula')
      .regex(/[0-9]/, 'Deve conter pelo menos um número')
      .regex(/[^a-zA-Z0-9]/, 'Deve conter pelo menos um caractere especial (!@#$…)'),

    confirmPassword: str('Confirme a senha').min(1, 'Confirme a senha'),
  })
  /* ── Cross-field: emails match ── */
  .refine((d) => d.email === d.confirmEmail, {
    message: 'Os e-mails não coincidem',
    path: ['confirmEmail'],
  })
  /* ── Cross-field: passwords match ── */
  .refine((d) => d.password === d.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

/* ─────────────────────────────────────────
   Password-strength rules (visual meter)
───────────────────────────────────────── */
const PWD_RULES = [
  { label: 'Mínimo 8 caracteres',    test: (v: string) => v.length >= 8 },
  { label: 'Uma letra maiúscula',     test: (v: string) => /[A-Z]/.test(v) },
  { label: 'Um número',               test: (v: string) => /[0-9]/.test(v) },
  { label: 'Um caractere especial',   test: (v: string) => /[^a-zA-Z0-9]/.test(v) },
] as const;

function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const passed = PWD_RULES.filter((r) => r.test(password)).length;
  const colors  = ['#ef4444', '#f97316', '#eab308', '#4ade80'];
  const labels  = ['Fraca', 'Regular', 'Boa', 'Forte'];
  const color   = colors[passed - 1] ?? '#ef4444';

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {PWD_RULES.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i < passed ? color : 'rgba(238,233,223,0.10)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {PWD_RULES.map((rule) => {
          const ok = rule.test(password);
          return (
            <div key={rule.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {ok ? <CheckCircle2 size={12} color={C.success} /> : <XCircle size={12} color="#ef4444" />}
              <span style={{ fontSize: '0.72rem', color: ok ? C.success : '#ef4444', transition: 'color 0.2s' }}>
                {rule.label}
              </span>
            </div>
          );
        })}
        {passed > 0 && (
          <span style={{ fontSize: '0.72rem', color, fontWeight: 600, marginTop: 2 }}>
            Senha {labels[passed - 1]}
          </span>
        )}
      </div>
    </div>
  );
}

function InternationalPhoneInput({
  value,
  onChange,
  onBlur,
  error,
}: {
  value: string;
  onChange: (fullValue: string) => void;
  onBlur?: () => void;
  error?: string;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ position: 'relative' }} className="premium-phone-auth">
      <PhoneInput
        defaultCountry="br"
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); onBlur?.(); }}
        className="w-full"
        /* 
           Using !important (via style attribute or class) to override library defaults 
           and match the custom design tokens in Auth.tsx
        */
        inputStyle={{
          width: '100%',
          height: '52px',
          background: C.bgInput,
          border: `1px solid ${error ? '#ef4444' : (focused ? C.gold : 'rgba(238,233,223,0.06)')}`,
          borderRadius: '4px',
          color: C.palladian,
          fontFamily: "'Poppins', sans-serif",
          fontSize: '0.9rem',
          paddingLeft: '54px',
          outline: 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          boxShadow: focused
            ? `0 0 0 3px ${error ? 'rgba(239,68,68,0.12)' : 'rgba(179,155,111,0.12)'}`
            : 'none',
        }}
        countrySelectorStyleProps={{
          buttonStyle: {
            position: 'absolute',
            left: '1px',
            top: '1px',
            bottom: '1px',
            background: 'transparent',
            border: 'none',
            borderRight: '1px solid rgba(238,233,223,0.08)',
            padding: '0 12px',
            height: '50px',
            zIndex: 10,
          },
          dropdownStyleProps: {
            style: {
              background: C.bgCard,
              border: `1px solid ${C.borderSubtle}`,
              color: C.palladian,
              borderRadius: '4px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            }
          }
        }}
      />
      {error && (
        <p role="alert" style={errorStyle}>{error}</p>
      )}
      
      <style>{`
        /* Library CSS Overrides for Dark Mode Readability */
        .premium-phone-auth .react-international-phone-country-selector-dropdown {
          background-color: ${C.bgCard} !important;
          border: 1px solid ${C.borderSubtle} !important;
        }
        .premium-phone-auth .react-international-phone-country-selector-list-item {
          background-color: ${C.bgCard} !important;
          color: ${C.palladian} !important;
        }
        .premium-phone-auth .react-international-phone-country-selector-list-item:hover {
          background-color: rgba(179,155,111,0.1) !important;
        }
        .premium-phone-auth .react-international-phone-country-selector-list-item--selected {
          background-color: rgba(179,155,111,0.2) !important;
        }
        .premium-phone-auth .react-international-phone-country-selector-list-item__country-name {
          color: ${C.palladian} !important;
        }
        .premium-phone-auth .react-international-phone-country-selector-list-item__dial-code {
          color: ${C.oatmealDim} !important;
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────
   Reusable text / password input
   ‣ Uses React.forwardRef so react-hook-form's
     register() can attach a ref to the <input>.
───────────────────────────────────────── */
type AuthInputProps = {
  type?: string;
  placeholder: string;
  icon: React.ReactNode;
  error?: string;
  [key: string]: any;
};

const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
  ({ type = 'text', placeholder, icon, error, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const [showPwd, setShowPwd]   = useState(false);
    const isPwd = type === 'password';

    return (
      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute', left: 16, top: 26, transform: 'translateY(-50%)',
          color: error ? '#ef4444' : (focused ? C.gold : C.oatmealDim),
          transition: 'color 0.2s', zIndex: 1, pointerEvents: 'none',
        }}>
          {icon}
        </div>

        <input
          {...props}
          ref={ref}
          type={isPwd ? (showPwd ? 'text' : 'password') : type}
          placeholder={placeholder}
          onFocus={(e) => { setFocused(true);  props.onFocus?.(e); }}
          onBlur={(e)  => { setFocused(false); props.onBlur?.(e);  }}
          style={{
            width: '100%',
            height: 52,
            paddingLeft: 46,
            paddingRight: isPwd ? 46 : 16,
            background: C.bgInput,
            border: `1px solid ${error ? '#ef4444' : (focused ? C.gold : 'rgba(238,233,223,0.06)')}`,
            borderRadius: 4,
            color: C.palladian,
            fontFamily: "'Poppins', sans-serif",
            fontSize: '0.9rem',
            fontWeight: 400,
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxShadow: focused
              ? `0 0 0 3px ${error ? 'rgba(239,68,68,0.12)' : 'rgba(179,155,111,0.12)'}`
              : 'none',
            boxSizing: 'border-box',
          }}
        />

        {isPwd && (
          <button
            type="button"
            onClick={() => setShowPwd((p) => !p)}
            aria-label={showPwd ? 'Ocultar senha' : 'Mostrar senha'}
            style={{
              position: 'absolute', right: 16, top: 26, transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: C.oatmealDim, cursor: 'pointer',
              padding: 0, display: 'flex', alignItems: 'center', zIndex: 2,
            }}
          >
            {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}

        {error && (
          <p role="alert" style={errorStyle}>{error}</p>
        )}
      </div>
    );
  }
);
AuthInput.displayName = 'AuthInput';

/* ─────────────────────────────────────────
   Shared micro-styles
───────────────────────────────────────── */
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.72rem',
  color: C.oatmealDim,
  fontFamily: "'Oswald', sans-serif",
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  marginBottom: 6,
};

const errorStyle: React.CSSProperties = {
  color: '#ef4444',
  fontSize: '0.75rem',
  marginTop: 4,
  marginLeft: 2,
};

/* ─────────────────────────────────────────
   Main Auth Page
───────────────────────────────────────── */
export default function Auth() {
  const { session, loading: authLoading, signUp, signIn } = useAuth();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');

  const [isSignUp, setIsSignUp] = useState(returnUrl?.includes('/join/') || false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit: handleFormSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<AuthFormData>({
    resolver: zodResolver(isSignUp ? signUpSchema : signInSchema),
    /**
     * onBlur   → error appears only AFTER the user leaves the field.
     *            Never while typing for the first time.
     *
     * reValidateMode: 'onChange' → once an error is shown, it is
     *   re-checked on every keystroke so the message disappears the
     *   instant the user fixes it.
     */
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      email: '',
      confirmEmail: '',
      password: '',
      fullName: '',
      phone: '+55',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('password') ?? '';

  if (authLoading) return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: C.bgDeeper }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', border: `2px solid ${C.gold}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  if (session && !authLoading) return <Navigate to={returnUrl || '/'} replace />;

  const toggleMode = () => {
    setIsSignUp((prev) => !prev);
    reset();
  };

  /* ─────────────────────────────────────────
     CLEAN DATA → onSubmit
     ‣ Strips mask characters from phone
     ‣ Uses sonner toast for server errors
     ‣ emailRedirectTo ensures Supabase sends
       the confirmation link pointing back here
  ───────────────────────────────────────── */
  const onSubmit = async (data: AuthFormData) => {
    setSubmitting(true);
    try {
      // Clean phone: keep '+' and digits (E.164 format)
      const cleanPhone = data.phone.startsWith('+') 
        ? '+' + data.phone.replace(/\D/g, '')
        : data.phone.replace(/\D/g, '');

      if (isSignUp) {
        await signUp(data.email, data.password, data.fullName, cleanPhone);
        toast.success('🎉 Conta criada com sucesso!', {
          description: 'Enviamos um link de confirmação para o seu e-mail. Verifique sua caixa de entrada (e spam) para ativar o acesso.',
          duration: 8000,
        });
      } else {
        await signIn(data.email, data.password);
        toast.success('Acesso autorizado', {
          description: 'Bem-vindo de volta ao Kanba.',
        });
      }
    } catch (err: any) {
      const msg = mapSupabaseError(err.message);
      toast.error('Falha na autenticação', { description: msg });
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
          LEFT COLUMN — Brand panel
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

        <div style={{ position: 'absolute', inset: 0, background: C.glowRadial, pointerEvents: 'none' }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(179,155,111,0.10) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
          pointerEvents: 'none', opacity: 0.6,
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
          <img src="/K transparante.png" alt="K" style={{ height: 36, filter: 'drop-shadow(0 0 10px rgba(163,81,57,0.6))' }} />
          <span style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: '1.5rem', letterSpacing: '0.14em', background: C.gradientCta, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            KANBA
          </span>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1, marginTop: 60 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: `1px solid ${C.borderSubtle}`, background: 'rgba(179,155,111,0.07)', padding: '5px 14px', borderRadius: 3, marginBottom: 28, alignSelf: 'flex-start' }}>
            <ShieldCheck size={13} color={C.gold} />
            <span style={{ fontSize: '0.65rem', color: C.gold, fontFamily: "'Oswald',sans-serif", letterSpacing: '0.12em', fontWeight: 600 }}>
              EXCLUSIVO PARA AGÊNCIAS
            </span>
          </div>

          <h2 style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 'clamp(2.8rem, 4vw, 4.5rem)', lineHeight: 1.03, color: C.palladian, margin: '0 0 24px', letterSpacing: '-0.02em' }}>
            Acesse sua<br />
            <span style={{ background: C.gradientCta, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>central de</span>
            <br />comando.
          </h2>

          <p style={{ fontSize: '1rem', color: C.oatmeal, lineHeight: 1.75, maxWidth: 440, fontWeight: 300, margin: '0 0 48px' }}>
            O Kanba centraliza todas as demandas da sua agência e usa automação no WhatsApp para garantir que nada atrase e nada se perca.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              'Kanban visual com prioridades e prazos',
              'Notificações automáticas via WhatsApp',
              'Portal do cliente sem chamadas no privado',
              'Wiki integrada para briefings e processos',
            ].map((text) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(179,155,111,0.1)', border: `1px solid rgba(179,155,111,0.35)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckCircle2 size={10} color={C.gold} />
                </div>
                <span style={{ fontSize: '0.88rem', color: C.oatmeal, fontWeight: 300 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: '0.72rem', color: C.oatmealDim, position: 'relative', zIndex: 1, marginTop: 40 }}>
          © 2025 Kanba · Todos os direitos reservados
        </p>
      </div>

      {/* ══════════════════════════════════════
          RIGHT COLUMN — Auth form
      ══════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 32px', position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>

        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 600px 500px at 50% 45%, rgba(163,81,57,0.10) 0%, transparent 65%)', pointerEvents: 'none' }} />

        {/* Mobile-only logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48, position: 'relative', zIndex: 1 }} className="auth-mobile-logo">
          <img src="/K transparante.png" alt="K" style={{ height: 30, filter: 'drop-shadow(0 0 8px rgba(163,81,57,0.5))' }} />
          <span style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: '1.3rem', letterSpacing: '0.14em', background: C.gradientCta, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            KANBA
          </span>
        </div>

        {/* ── Form card ── */}
        <div style={{
          width: '100%', maxWidth: 460,
          background: C.bgCard,
          border: `1px solid ${C.borderCard}`,
          borderRadius: 6,
          padding: 'clamp(28px,5vw,44px)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(179,155,111,0.06)',
          position: 'relative', zIndex: 1,
          maxHeight: '92vh',
          overflowY: 'auto',
        }}>
          {/* Top accent line */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${C.copper}, ${C.gold}, transparent)`, borderRadius: '6px 6px 0 0' }} />

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
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

          {/* ── FORM ── */}
          <form onSubmit={handleFormSubmit(onSubmit)} noValidate>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>

              {/* ─ Sign-Up-only fields ─ */}
              {isSignUp && (
                <>
                  {/* Full name */}
                  <div>
                    <label style={labelStyle} htmlFor="fullName">Nome completo</label>
                    <AuthInput
                      id="fullName"
                      placeholder="João Silva"
                      {...register('fullName')}
                      error={errors.fullName?.message}
                      icon={<UserIcon size={17} />}
                    />
                  </div>

                  {/* Phone — custom International prefix + selector */}
                  <div>
                    <label style={labelStyle} htmlFor="phone">Telefone</label>
                    <Controller
                      name="phone"
                      control={control}
                      render={({ field }) => (
                        <InternationalPhoneInput
                          value={field.value}
                          onChange={(val) => field.onChange(val)}
                          onBlur={field.onBlur}
                          error={errors.phone?.message}
                        />
                      )}
                    />
                  </div>
                </>
              )}

              {/* E-mail */}
              <div>
                <label style={labelStyle} htmlFor="email">E-mail</label>
                <AuthInput
                  id="email"
                  type="email"
                  placeholder="seunome@agencia.com"
                  {...register('email')}
                  error={errors.email?.message}
                  icon={<Mail size={17} />}
                />
              </div>

              {/* Confirm e-mail — sign-up only */}
              {isSignUp && (
                <div>
                  <label style={labelStyle} htmlFor="confirmEmail">Confirmar e-mail</label>
                  <AuthInput
                    id="confirmEmail"
                    type="email"
                    placeholder="Digite o e-mail novamente"
                    {...register('confirmEmail')}
                    error={errors.confirmEmail?.message}
                    icon={<MailCheck size={17} />}
                    autoComplete="off"
                    onPaste={(e: React.ClipboardEvent) => {
                      e.preventDefault();
                      toast.error('Colar desabilitado', {
                        description: 'Por segurança, digite o e-mail manualmente para confirmar.',
                      });
                    }}
                  />
                </div>
              )}

              {/* Password */}
              <div>
                <label style={labelStyle} htmlFor="password">
                  {isSignUp ? 'Defina sua senha' : 'Senha'}
                </label>
                <AuthInput
                  id="password"
                  type="password"
                  placeholder={isSignUp ? 'Mín. 8 chars · maiúsc. · número · símbolo' : 'Sua senha'}
                  {...register('password')}
                  error={errors.password?.message}
                  icon={<Lock size={17} />}
                />
                {isSignUp && <PasswordStrengthMeter password={passwordValue} />}
              </div>

              {/* Confirm password — sign-up only */}
              {isSignUp && (
                <div>
                  <label style={labelStyle} htmlFor="confirmPassword">Confirmar senha</label>
                  <AuthInput
                    id="confirmPassword"
                    type="password"
                    placeholder="Repita a senha acima"
                    {...register('confirmPassword')}
                    error={errors.confirmPassword?.message}
                    icon={<ShieldCheck size={17} />}
                  />
                </div>
              )}
            </div>

            {/* Submit */}
            <SubmitButton
              submitting={submitting}
              label={isSignUp ? 'CRIAR CONTA' : 'ENTRAR NA PLATAFORMA'}
            />
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
            onClick={toggleMode}
            style={{
              width: '100%', padding: '13px 0',
              background: 'transparent',
              border: `1px solid ${C.borderSubtle}`,
              borderRadius: 4,
              fontFamily: "'Oswald',sans-serif",
              fontWeight: 600, fontSize: '0.85rem',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: C.oatmeal, cursor: 'pointer',
              transition: 'all 0.22s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.borderColor = C.gold;
              el.style.color = C.gold;
              el.style.background = 'rgba(179,155,111,0.06)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.borderColor = C.borderSubtle;
              el.style.color = C.oatmeal;
              el.style.background = 'transparent';
            }}
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
          to="/"
          style={{ marginTop: 24, fontSize: '0.75rem', color: C.oatmealDim, textDecoration: 'none', position: 'relative', zIndex: 1, transition: 'color 0.2s' }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = C.gold)}
          onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = C.oatmealDim)}
        >
          ← Voltar para a página inicial
        </Link>
      </div>

      {/* Global styles */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 900px) {
          .auth-left-panel  { display: flex !important; }
          .auth-mobile-logo { display: none !important; }
        }
      `}
      </style>
    </div>
  );
}

/* ─────────────────────────────────────────
   Map common Supabase Auth error messages
   to user-friendly Portuguese strings.
───────────────────────────────────────── */
function mapSupabaseError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes('already registered') || lower.includes('already been registered'))
    return 'Este e-mail já está cadastrado. Tente fazer login.';
  if (lower.includes('invalid login credentials'))
    return 'E-mail ou senha incorretos. Verifique e tente novamente.';
  if (lower.includes('email not confirmed'))
    return 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.';
  if (lower.includes('rate limit') || lower.includes('too many requests'))
    return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
  if (lower.includes('password') && lower.includes('weak'))
    return 'A senha é muito fraca. Escolha uma senha mais forte.';
  if (lower.includes('signup is disabled'))
    return 'Cadastro temporariamente desabilitado. Tente novamente mais tarde.';
  return msg;
}

/* ─────────────────────────────────────────
   Submit button — shimmer + glow
───────────────────────────────────────── */
function SubmitButton({ submitting, label }: { submitting: boolean; label: string }) {
  const [hov, setHov] = useState(false);
  const gradCta = 'linear-gradient(135deg, #8B3B26 0%, #A35139 35%, #B39B6F 75%, #C9AE7E 100%)';
  const gradHov = 'linear-gradient(135deg, #9E4733 0%, #B8634A 35%, #C5AC80 75%, #D4BC90 100%)';

  return (
    <button
      type="submit"
      disabled={submitting}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', height: 52,
        background: submitting ? 'rgba(163,81,57,0.5)' : (hov ? gradHov : gradCta),
        border: 'none', borderRadius: 4,
        cursor: submitting ? 'not-allowed' : 'pointer',
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
