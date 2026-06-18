import { MessageSquare } from 'lucide-react';
import { C } from './tokens';

export function MockDashboard() {
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
