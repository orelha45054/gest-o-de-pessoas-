import React, { useState } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  LogIn,
  LogOut,
  ShieldCheck,
  UserCheck,
  Users,
  Menu,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { Badge } from '../common/Badge';

interface HeaderProps {
  onToggleMobileSidebar: () => void;
  onNavigate: (view: string) => void;
  onOpenQuickAction?: (action?: 'feedback' | 'meeting' | 'request' | 'task') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileSidebar,
  onNavigate,
  onOpenQuickAction,
}) => {
  const { currentUser, currentRole, switchUserPersona, signInWithGoogle, logout, firebaseUser } = useAuth();
  const { users, notifications, markNotificationRead, markAllNotificationsRead } = useAppData();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  // Filter notifications for current user
  const userNotifications = notifications.filter(
    (n) => n.userId === currentUser?.id || n.userId === 'usr-admin' && currentRole === 'admin'
  );
  const unreadCount = userNotifications.filter((n) => !n.read).length;

  const roleLabels: Record<string, { label: string; badge: 'purple' | 'indigo' | 'emerald' }> = {
    admin: { label: 'Administrador', badge: 'purple' },
    manager: { label: 'Gestor', badge: 'indigo' },
    employee: { label: 'Funcionário', badge: 'emerald' },
  };

  const currentRoleInfo = roleLabels[currentRole] || { label: 'Funcionário', badge: 'emerald' };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden text-slate-500 hover:text-slate-900 p-2 rounded-lg hover:bg-slate-100 focus:outline-none transition-colors"
          title="Menu de navegação"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-xs">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-900 tracking-tight leading-none">
              Gestão de Pessoas
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
              Feedbacks, Reuniões e Gestão por Setores
            </p>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Quick Action Button */}
        {onOpenQuickAction && (
          <button
            onClick={() => onOpenQuickAction()}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs shadow-indigo-600/20 flex items-center gap-1.5 transition-all"
            title="Realizar uma ação rápida (Feedback, Reunião, Conversa, Tarefa)"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ação Rápida</span>
          </button>
        )}

        {/* Persona Switcher for effortless multi-role testing */}
        <div className="relative">
          <button
            onClick={() => {
              setShowPersonaMenu(!showPersonaMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-xs text-slate-700 hover:text-slate-900 transition-colors shadow-xs"
            title="Alternar perfil de teste"
          >
            <span className="text-slate-400 hidden md:inline">Simular perfil:</span>
            <Badge variant={currentRoleInfo.badge} size="sm">
              {currentRoleInfo.label}
            </Badge>
            <span className="font-medium text-slate-800 hidden sm:inline truncate max-w-[120px]">
              {currentUser?.name}
            </span>
          </button>

          {showPersonaMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/50">
                <p className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                  Alternar Usuário & Papel (RBAC)
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Teste o isolamento de dados e permissões de cada perfil.
                </p>
              </div>

              <div className="max-h-64 overflow-y-auto py-1 divide-y divide-slate-50">
                {users.map((u) => {
                  const roleBadge =
                    u.role === 'admin' ? 'purple' : u.role === 'manager' ? 'indigo' : 'emerald';
                  const isSelected = u.id === currentUser?.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        switchUserPersona(u.id);
                        setShowPersonaMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-indigo-50/60 font-medium' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {u.avatarUrl ? (
                          <img
                            src={u.avatarUrl}
                            alt={u.name}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-700 font-semibold">
                            {u.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-900 truncate">{u.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{u.positionName || u.departmentName}</p>
                        </div>
                      </div>
                      <Badge variant={roleBadge as any} size="sm">
                        {u.role === 'admin' ? 'Admin' : u.role === 'manager' ? 'Gestor' : 'Funcionário'}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowPersonaMenu(false);
            }}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Notificações"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/80">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">Notificações</span>
                  {unreadCount > 0 && (
                    <Badge variant="indigo" size="sm">
                      {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllNotificationsRead(currentUser?.id || '')}
                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Marcar todas
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {userNotifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    Nenhuma notificação no momento.
                  </div>
                ) : (
                  userNotifications.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      className={`p-3.5 hover:bg-slate-50 transition-colors flex items-start gap-3 ${
                        !n.read ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          !n.read ? 'bg-indigo-600' : 'bg-transparent'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-900">{n.title}</p>
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {new Date(n.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {!n.read && (
                        <button
                          onClick={() => markNotificationRead(n.id)}
                          className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100"
                          title="Marcar como lida"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Google Auth Integration */}
        {firebaseUser ? (
          <div className="flex items-center gap-2">
            <button
              onClick={logout}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs text-slate-600 hover:text-slate-900 transition-colors"
              title="Desconectar do Google"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
          </div>
        ) : (
          <button
            onClick={signInWithGoogle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition-colors border border-slate-200 shadow-xs"
            title="Conectar com conta Google"
          >
            <LogIn className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Entrar com Google</span>
            <span className="sm:hidden">Google</span>
          </button>
        )}
      </div>
    </header>
  );
};
