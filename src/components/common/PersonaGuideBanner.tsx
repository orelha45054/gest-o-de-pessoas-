import React, { useState } from 'react';
import {
  Users,
  Shield,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  MessageSquareQuote,
  CalendarCheck,
  CheckSquare,
  TrendingUp,
  HelpCircle,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from './Badge';

interface PersonaGuideBannerProps {
  onOpenQuickAction: (action: 'feedback' | 'meeting' | 'request' | 'task') => void;
  onNavigate: (view: string) => void;
}

export const PersonaGuideBanner: React.FC<PersonaGuideBannerProps> = ({
  onOpenQuickAction,
  onNavigate,
}) => {
  const { currentUser, currentRole, switchUserPersona } = useAuth();
  const [showGuide, setShowGuide] = useState(false);

  const roleConfigs: Record<
    string,
    {
      title: string;
      desc: string;
      badge: 'indigo' | 'emerald' | 'purple';
      hint: string;
    }
  > = {
    manager: {
      title: `Gerente de Setor (${currentUser?.departmentName || 'Setor'})`,
      desc: `Você lidera o setor de ${currentUser?.departmentName}. Tem acesso estrito aos funcionários do seu setor para reuniões, feedbacks e combinados.`,
      badge: 'indigo',
      hint: 'Dica: Você só enxerga os colaboradores do seu próprio setor, garantindo total privacidade e foco.',
    },
    employee: {
      title: `Colaborador (${currentUser?.departmentName || 'Setor'})`,
      desc: 'Visão individual. Você consulta feedbacks recebidos, confirma presença em reuniões e solicita 1:1 ao seu gestor.',
      badge: 'emerald',
      hint: 'Dica: Peça uma conversa 1:1 com seu gestor ou responda sua autoavaliação.',
    },
    admin: {
      title: 'Gerente Geral (Admin)',
      desc: 'Acesso total corporativo aos 3 setores (Comercial, Marketing e Site). Pode convocar Reuniões de Gerência escolhendo os gerentes.',
      badge: 'purple',
      hint: 'Dica: Clique em "Reunião com Gerentes" no menu ou nos painéis para convocar a liderança da empresa.',
    },
  };

  const currentConfig = roleConfigs[currentRole] || roleConfigs.manager;

  return (
    <div className="mb-6 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
      {/* Top line: Active persona and selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-indigo-500/30"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center font-bold text-indigo-700">
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
            )}
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                currentRole === 'admin'
                  ? 'bg-purple-500'
                  : currentRole === 'manager'
                  ? 'bg-indigo-600'
                  : 'bg-emerald-500'
              }`}
            />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 font-medium">Você está conectado como:</span>
              <span className="text-sm font-bold text-slate-900">{currentUser?.name}</span>
              <Badge variant={currentConfig.badge} size="sm">
                {currentConfig.title}
              </Badge>
              {currentUser?.departmentName && (
                <Badge variant="zinc" size="sm">
                  Setor: {currentUser.departmentName}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-1">
              {currentConfig.desc}
            </p>
          </div>
        </div>

        {/* 1-Click Role Switcher Quick Bar */}
        <div className="flex items-center gap-1.5 flex-wrap shrink-0 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 px-1 hidden xl:inline">
            Testar Papéis:
          </span>

          {/* Admin / Gerente Geral */}
          <button
            onClick={() => switchUserPersona('usr-admin')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              currentUser?.id === 'usr-admin'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title="Gerente Geral (Acesso total aos 3 setores)"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Gerente Geral</span>
          </button>

          {/* Gerente Comercial */}
          <button
            onClick={() => switchUserPersona('usr-bruno')}
            className={`px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              currentUser?.id === 'usr-bruno'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title="Gerente Comercial (Bruno Fagundes)"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Gerente Comercial</span>
          </button>

          {/* Gerente Marketing */}
          <button
            onClick={() => switchUserPersona('usr-camila')}
            className={`px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              currentUser?.id === 'usr-camila'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title="Gerente de Marketing (Camila Rocha)"
          >
            <UserCheck className="w-3.5 h-3.5 text-purple-600" />
            <span>Gerente Mkt</span>
          </button>

          {/* Gerente Site */}
          <button
            onClick={() => switchUserPersona('usr-rafael')}
            className={`px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              currentUser?.id === 'usr-rafael'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title="Gerente do Site (Rafael Mendes)"
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Gerente Site</span>
          </button>

          {/* Colaborador João (Site) */}
          <button
            onClick={() => switchUserPersona('usr-joao')}
            className={`px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              currentUser?.id === 'usr-joao'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title="Funcionário do Site (João Santos)"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Colaborador</span>
          </button>

          <button
            onClick={() => setShowGuide(!showGuide)}
            className="ml-1 px-2.5 py-1.5 rounded-lg text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 border border-indigo-200 flex items-center gap-1 transition-colors"
            title="Ver arquitetura dos setores e reuniões"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Regras de Acesso</span>
            {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable System Guide */}
      {showGuide && (
        <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in duration-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Estrutura de Setores & Reuniões de Liderança
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Regras de isolamento por departamento e controle centralizado para o Gerente Geral.
              </p>
            </div>
            <button
              onClick={() => setShowGuide(false)}
              className="text-xs text-slate-400 hover:text-slate-700"
            >
              Fechar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Setor Comercial */}
            <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200/80">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 mb-1">
                <span>Setor Comercial</span>
                <Badge variant="emerald" size="sm">Comercial</Badge>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Gerente: <strong className="text-slate-800">Bruno Fagundes</strong>. Gestão exclusiva da equipe de vendas e prospecção.
              </p>
            </div>

            {/* Setor Marketing */}
            <div className="p-3.5 bg-purple-50/70 rounded-xl border border-purple-200/80">
              <div className="flex items-center justify-between text-xs font-semibold text-purple-800 mb-1">
                <span>Setor Marketing</span>
                <Badge variant="purple" size="sm">Marketing</Badge>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Gerente: <strong className="text-slate-800">Camila Rocha</strong>. Acesso apenas aos colaboradores de Marketing (Lucas, etc).
              </p>
            </div>

            {/* Setor Site */}
            <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200/80">
              <div className="flex items-center justify-between text-xs font-semibold text-blue-800 mb-1">
                <span>Setor Site</span>
                <Badge variant="blue" size="sm">Site</Badge>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Gerente: <strong className="text-slate-800">Rafael Mendes</strong>. Acesso apenas aos colaboradores do site e produto web.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
