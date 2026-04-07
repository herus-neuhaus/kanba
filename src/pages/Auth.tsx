import { useState } from 'react';
import { Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Zap, 
  Loader2, 
  Phone,
  ArrowRight
} from 'lucide-react';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';

export default function Auth() {
  const { session, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const returnUrl = searchParams.get('returnUrl');
  
  const [isSignUp, setIsSignUp] = useState(returnUrl?.includes('/join/') || false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signUp, signIn } = useAuth();
  const { toast } = useToast();

  if (authLoading) return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d0620]">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
        <div className="relative h-full w-full animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    </div>
  );
  
  if (session && !authLoading) {
    return <Navigate to={returnUrl || "/"} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isSignUp) {
        await signUp(email, password, fullName, phone);
        toast({ title: 'Residência ativa!', description: 'Sua conta foi criada. Verifique seu e-mail para acesso total.' });
      } else {
        await signIn(email, password);
        toast({ title: 'Acesso autorizado', description: 'Central de comando liberada.' });
      }
    } catch (err: any) {
      toast({ title: 'Falha na autenticação', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#0f0b1e] text-white font-['Montserrat'] overflow-hidden">
      
      {/* 55% LEFT COLUMN: ANIMATED SPACE SCENE */}
      <div className="hidden lg:flex w-[55%] relative overflow-hidden bg-gradient-to-br from-[#0d0620] to-[#1a0a3d] flex-col justify-between p-16">
        
        {/* LOGO */}
        <div className="z-20 flex items-center gap-4">
          <img src="/src/img/kanba-logo-transparent.png" alt="Kanba Logo" className="h-12 w-auto object-contain" />
          <div className="text-xs font-black tracking-[0.4em] text-white/40 uppercase">
            KANBA
          </div>
        </div>

        {/* STARS */}
        <div className="absolute inset-0 z-0">
          {[...Array(80)].map((_, i) => (
            <div 
              key={i}
              className="absolute bg-white rounded-full animate-pulse"
              style={{
                width: Math.random() * 2 + 'px',
                height: Math.random() * 2 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                animationDelay: Math.random() * 5 + 's',
                opacity: Math.random() * 0.7 + 0.3
              }}
            />
          ))}
        </div>

        {/* SHOOTING STARS */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[150px] h-0.5 bg-gradient-to-r from-white to-transparent -rotate-45 -translate-x-[200%] animate-[shoot_4s_infinite_linear]" style={{ top: '20%', left: '30%' }} />
          <div className="absolute w-[200px] h-0.5 bg-gradient-to-r from-white to-transparent -rotate-45 -translate-x-[200%] animate-[shoot_6s_infinite_linear_1s]" style={{ top: '50%', left: '70%' }} />
          <div className="absolute w-[100px] h-0.5 bg-gradient-to-r from-white to-transparent -rotate-45 -translate-x-[200%] animate-[shoot_3s_infinite_linear_2s]" style={{ top: '20%', left: '5%' }} />
        </div>

        {/* PLANET LAYER */}
        <div className="absolute bottom-[20%] right-[-50px] z-10 scale-110">
          {/* ORBITAL RING */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[150px] border border-cyan-500/10 rounded-[50%] rotate-[25deg] z-0" />
          
          {/* THE PLANET */}
          <div className="relative w-[380px] h-[380px] rounded-full bg-[radial-gradient(circle_at_35%_35%,#67e8f9,#0891b2,#0e7490,#164e63)] shadow-[inset_-20px_-20px_60px_rgba(0,0,0,0.5),0_0_100px_rgba(8,145,178,0.2)]">
             {/* Suble Cloud Texture (via shadows/gradients) */}
             <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_left,white_0%,transparent_50%)] rounded-full blur-md" />
             <div className="absolute inset-0 opacity-10 bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0%,rgba(255,255,255,0.7)_180deg,transparent_360deg)] rounded-full blur-[100px]" />
          </div>

          {/* SMALL MOON */}
          <div className="absolute top-0 right-[-40px] w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-900 shadow-xl" />
        </div>

        {/* HERO TEXT */}
        <div className="z-20 mt-auto max-w-2xl translate-y-12 animate-fade-up">
           <h2 className="leading-none tracking-tighter mb-4">
             <span className="block text-[64px] font-black text-white">ACESSE SUA</span>
             <span className="block text-[64px] font-black text-[#7c3aed]">CENTRAL DE COMANDO!</span>
           </h2>
           <p className="text-slate-400 font-medium text-lg max-w-md">
             O Kanba centraliza todas as demandas da sua agência em um só lugar e usa automações no WhatsApp pra garantir que nada atrase, nada se perca e sua equipe execute no prazo.
           </p>
        </div>
      </div>

      {/* 45% RIGHT COLUMN: AUTH PANEL */}
      <div className="w-full lg:w-[45%] bg-[#0f0b1e] flex flex-col p-8 lg:p-16 relative">
        
        {/* TOP TOGGLE */}
        <div className="absolute top-12 right-12 text-[10px] font-black uppercase tracking-widest text-[#7c3aed]/60 hover:text-[#7c3aed] transition-colors cursor-pointer" onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? 'JÁ TEM CONTA? ENTRAR' : 'QUERO ME REGISTRAR →'}
        </div>

        <div className="my-auto max-w-[400px] w-full mx-auto space-y-12">
          {/* HEADER */}
          <div className="space-y-3 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
             <h3 className="text-[52px] font-black leading-none tracking-tight">
               {isSignUp ? 'REGISTRO' : 'ENTRAR'}
             </h3>
             <p className="text-slate-400 font-medium">Entre com seu endereço de email</p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-700">
            <div className="space-y-4">
              {isSignUp && (
                <div className="space-y-4">
                   <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-purple-500 transition-colors z-10" />
                    <input 
                      placeholder="Seu Nome" 
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="w-full h-14 pl-12 bg-[#1a1530] border-none rounded-2xl text-white font-bold placeholder:text-slate-600 focus:ring-2 focus:ring-[#7c3aed] transition-all outline-none"
                      required
                    />
                  </div>

                  <div className="relative premium-phone-container">
                    <PhoneInput
                      defaultCountry="br"
                      value={phone}
                      onChange={setPhone}
                      className="w-full relative"
                      inputClassName="!h-14 !w-full !bg-[#1a1530] !border-none !rounded-2xl !text-white !font-bold !pl-16 !placeholder-slate-600 !transition-all"
                      countrySelectorStyleProps={{
                        className: "!absolute !left-0 !bg-transparent !border-none !z-10 !h-14 !flex !items-center !justify-center !w-12"
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-purple-500 transition-colors z-10" />
                <input 
                  type="email"
                  placeholder="seunome@gmail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full h-14 pl-12 bg-[#1a1530] border-none rounded-2xl text-white font-bold placeholder:text-slate-600 focus:ring-2 focus:ring-[#7c3aed] transition-all outline-none"
                  required
                />
              </div>

              {!isSignUp && (
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-purple-500 transition-colors z-10" />
                  <input 
                    type="password"
                    placeholder="Sua Senha"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full h-14 pl-12 bg-[#1a1530] border-none rounded-2xl text-white font-bold placeholder:text-slate-600 focus:ring-2 focus:ring-[#7c3aed] transition-all outline-none"
                    required
                  />
                </div>
              )}

              {isSignUp && (
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-purple-500 transition-colors z-10" />
                  <input 
                    type="password"
                    placeholder="Definir Senha"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full h-14 pl-12 bg-[#1a1530] border-none rounded-2xl text-white font-bold placeholder:text-slate-600 focus:ring-2 focus:ring-[#7c3aed] transition-all outline-none"
                    required
                  />
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              className="w-full h-14 bg-gradient-to-r from-[#5b21b6] via-[#7c3aed] to-[#6d28d9] rounded-full font-black text-lg tracking-wide shadow-[0_10px_30px_rgba(124,58,237,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (isSignUp ? 'Criar Conta' : 'Entrar')}
            </button>
          </form>

          {/* DIVIDER */}
          <div className="flex items-center gap-4 text-xs font-black text-slate-700 uppercase tracking-widest">
            <div className="flex-1 h-[1px] bg-slate-800/50" />
            Ou continue com
            <div className="flex-1 h-[1px] bg-slate-800/50" />
          </div>

          {/* SOCIAL BUTTONS */}
          <div className="grid grid-cols-2 gap-4">
             <button className="h-12 bg-[#1a1530] flex items-center justify-center gap-3 rounded-2xl font-bold text-sm hover:bg-[#251e44] transition-colors border border-white/5">
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 11h9v2h-9z"/><path fill="#FBBC05" d="M12 11V3h9v8z"/><path fill="#34A853" d="M12 11h9v9H3v-9z"/><path fill="#4285F4" d="M12 11V3H3v18h9v-7h9v-2h-9z"/></svg>
                Google
             </button>
             <button className="h-12 bg-[#1a1530] flex items-center justify-center gap-3 rounded-2xl font-bold text-sm hover:bg-[#251e44] transition-colors border border-white/5">
                <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Facebook
             </button>
          </div>

          {/* TERMS */}
          <p className="text-[10px] text-center text-slate-500 font-medium">
             Ao se registrar você aceita nossos <span className="text-[#7c3aed] font-bold cursor-pointer hover:underline">Termos e Condições</span>
          </p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shoot {
          0% { transform: translateX(-200%) rotate(-45deg); opacity: 1; }
          40% { opacity: 1; }
          100% { transform: translateX(800%) rotate(-45deg); opacity: 0; }
        }
        
        .animate-fade-up {
          animation: fade-up 1s ease forwards;
        }
        
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Phone Input Overrides for Space Theme */
        .premium-phone-container .react-international-phone-country-selector-dropdown {
          background: #1a1530 !important;
          border-color: #7c3aed33 !important;
        }
        .premium-phone-container .react-international-phone-country-selector-list-item {
          color: #fff !important;
        }
        .premium-phone-container .react-international-phone-country-selector-list-item:hover {
          background: #7c3aed22 !important;
        }
      `}} />
    </div>
  );
}
