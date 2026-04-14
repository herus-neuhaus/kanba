import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Check, Crown, Zap, Rocket } from 'lucide-react';

const SubscriptionPending = () => {
  const { agency, signOut } = useAuth();

  const plans = [
    {
      name: 'Starter',
      price: 'R$ 97',
      link: 'https://pay.cakto.com.br/34bt8zp',
      type: 'starter',
      icon: <Rocket className="h-6 w-6 text-blue-500" />,
      features: ['Até 5 projetos', 'Kanban ilimitado', 'Suporte via Chat'],
      highlight: false
    },
    {
      name: 'Pro',
      price: 'R$ 247',
      link: 'https://pay.cakto.com.br/bdzd6t9',
      type: 'pro',
      icon: <Zap className="h-6 w-6 text-amber-500" />,
      features: ['Projetos ilimitados', 'Dashboard de Relatórios', 'Automação WhatsApp'],
      highlight: true
    },
    {
      name: 'Elite',
      price: 'R$ 497',
      link: 'https://pay.cakto.com.br/3et7uft',
      type: 'elite',
      icon: <Crown className="h-6 w-6 text-purple-500" />,
      features: ['Gestão de Equipe', 'Wiki do Projeto', 'Suporte Prioritário'],
      highlight: false
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600">
          Acesso Restrito
        </h1>
        <p className="text-slate-400 text-lg">
          Sua assinatura expirou ou ainda não foi ativada.
          {agency?.next_billing_date && (
            <span className="block mt-2 text-red-400">
              Vencimento: {new Date(agency.next_billing_date).toLocaleDateString()}
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full">
        {plans.map((plan) => {
          const isCurrent = agency?.plan_type === plan.type;
          const isActive = agency?.subscription_status === 'active';

          return (
            <Card 
              key={plan.name} 
              className={`border-slate-800 bg-slate-900/50 backdrop-blur-sm transition-all hover:scale-105 ${
                plan.highlight ? 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : ''
              }`}
            >
              <CardHeader>
                <div className="flex justify-between items-center mb-2">
                  {plan.icon}
                  {isCurrent ? (
                    <span className="bg-emerald-500 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded-full">
                      Plano Atual
                    </span>
                  ) : plan.highlight && (
                    <span className="bg-amber-500 text-black text-[10px] uppercase font-black px-2 py-0.5 rounded-full">
                      Recomendado
                    </span>
                  )}
                </div>
                <CardTitle className="text-2xl text-white">{plan.name}</CardTitle>
                <CardDescription className="text-slate-400">Plano ideal para sua agência</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-6">
                  {plan.price}
                  <span className="text-sm font-normal text-slate-500 ml-1">/mês</span>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center text-sm text-slate-300">
                      <Check className="h-4 w-4 text-green-500 mr-2 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  asChild={!isCurrent || !isActive}
                  disabled={isCurrent && isActive}
                  className={`w-full ${
                    plan.highlight 
                      ? 'bg-amber-500 hover:bg-amber-600 text-black' 
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  {isCurrent && isActive ? (
                    <span>Assinatura Ativa</span>
                  ) : (
                    <a href={`${plan.link}?external_id=${agency?.id}`}>
                      Assinar Agora
                    </a>
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <p className="text-slate-500 text-sm mb-4">
          Já realizou o pagamento? O processamento pode levar alguns minutos.
        </p>
        <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={signOut}>
          Sair da Conta
        </Button>
      </div>
    </div>
  );
};

export default SubscriptionPending;
