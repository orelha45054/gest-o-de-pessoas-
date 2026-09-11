import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Users2,
  MessageSquareQuote,
  Inbox,
  CheckSquare,
  UserCheck2,
  BarChart3,
  Settings,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  subtitle?: string;
  icon: React.ElementType;
  allowedRoles: Array<'admin' | 'manager' | 'employee'>;
  badgeCount?: number;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { currentRole, currentUser } = useAuth();
  const { feedbackRequests, conversationRequests, followUps, tasks } = useAppData();

  // Compute live badges
  const pendingRequestsCount =
    currentRole === 'employee'
      ? feedbackRequests.filter((r) => r.employeeId === currentUser?.id && r.status === 'requested').length +
        conversationRequests.filter((r) => r.employeeId === currentUser?.id && r.status === 'requested').length
      : feedbackRequests.filter((r) => r.status === 'requested').length +
        conversationRequests.filter((r) => r.status === 'requested').length;

  const urgentTasksCount = tasks.filter(
    (t) =>
      (currentRole === 'employee' ? t.assigneeId === currentUser?.id : true) &&
      (t.status === 'Pendente' || t.status === 'Em andamento' || t.status === 'Atrasado') &&
      (t.priority === 'Urgente' || t.status === 'Atrasado')
  ).length;

  const todayFollowUpsCount = followUps.filter(
    (f) =>
      (currentRole === 'employee' ? f.employeeId === currentUser?.id : true) &&
      (f.status === 'Hoje' || f.status === 'Atrasado')
  ).length;

  const menuGroups: MenuGroup[] = [
    {
      title: 'Principal',
      items: [
        {
          id: 'dashboard',
          label: currentRole === 'employee' ? 'Meu Dia' : 'Painel de Gestão',
          subtitle: 'Visão geral e métricas',
          icon: LayoutDashboard,
          allowedRoles: ['admin', 'manager', 'employee'],
        },
      ],
    },
    {
      title: 'Comunicação & 1:1',
      items: [
        {
          id: 'agenda',
          label: 'Minha Agenda',
          subtitle: 'Visão calendário',
          icon: Calendar,
          allowedRoles: ['admin', 'manager', 'employee'],
        },
        {
          id: 'meetings',
          label: 'Reuniões & Atas',
          subtitle: '1:1s, presenças e notas',
          icon: Users2,
          allowedRoles: ['admin', 'manager', 'employee'],
        },
        {
          id: 'feedbacks',
          label: 'Feedbacks',
          subtitle: 'Elogios e melhorias',
          icon: MessageSquareQuote,
          allowedRoles: ['admin', 'manager', 'employee'],
        },
        {
          id: 'followups',
          label: 'Acompanhamentos',
          subtitle: 'Follow-ups de feedbacks',
          icon: Sparkles,
          allowedRoles: ['admin', 'manager', 'employee'],
          badgeCount: todayFollowUpsCount > 0 ? todayFollowUpsCount : undefined,
        },
        {
          id: 'requests',
          label: 'Solicitações',
          subtitle: 'Pedidos de conversa e 1:1',
          icon: Inbox,
          allowedRoles: ['admin', 'manager', 'employee'],
          badgeCount: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
        },
      ],
    },
    {
      title: 'Execução & Acompanhamento',
      items: [
        {
          id: 'tasks',
          label: 'Tarefas e Combinados',
          subtitle: 'Prazos e entregas',
          icon: CheckSquare,
          allowedRoles: ['admin', 'manager', 'employee'],
          badgeCount: urgentTasksCount > 0 ? urgentTasksCount : undefined,
        },
      ],
    },
    {
      title: currentRole === 'admin' ? 'Gestão Corporativa' : 'Gestão da Equipe',
      items: [
        {
          id: 'team',
          label: currentRole === 'admin' ? 'Todas as Equipes' : 'Minha Equipe',
          subtitle: 'Perfil 360° e histórico',
          icon: UserCheck2,
          allowedRoles: ['admin', 'manager'],
        },
        {
          id: 'reports',
          label: 'Relatórios & Métricas',
          subtitle: 'Indicadores e taxas',
          icon: BarChart3,
          allowedRoles: ['admin', 'manager'],
        },
        {
          id: 'settings',
          label: 'Configurações',
          subtitle: 'Setores, cargos e acessos',
          icon: Settings,
          allowedRoles: ['admin'],
        },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 text-slate-700">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-xs shadow-indigo-600/20">
            GP
          </div>
          <div>
            <span className="font-semibold text-sm text-slate-900 tracking-tight block">
              Gestão de Pessoas
            </span>
            <span className="text-[11px] text-slate-500 font-normal">
              Acompanhamento 360°
            </span>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links grouped */}
      <nav className="flex-1 px-3 py-3.5 space-y-4 overflow-y-auto">
        {menuGroups.map((group) => {
          const visibleGroupItems = group.items.filter((i) => i.allowedRoles.includes(currentRole));
          if (visibleGroupItems.length === 0) return null;

          return (
            <div key={group.title} className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                {group.title}
              </div>
              {visibleGroupItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-indigo-600' : 'text-slate-400'
                        }`}
                      />
                      <div className="text-left truncate">
                        <span className="block truncate">{item.label}</span>
                      </div>
                    </div>
                    {item.badgeCount && item.badgeCount > 0 ? (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                        {item.badgeCount}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Current User Snapshot Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/50">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-white border border-slate-200 shadow-xs">
          {currentUser?.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700">
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 truncate">{currentUser?.name}</p>
            <p className="text-[11px] text-slate-500 truncate">
              {currentRole === 'admin'
                ? 'Administrador'
                : currentRole === 'manager'
                ? 'Gestor'
                : 'Funcionário'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 max-w-xs h-full z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
