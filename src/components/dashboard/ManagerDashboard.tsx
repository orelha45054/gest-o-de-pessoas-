import React, { useState } from 'react';
import {
  Users,
  Calendar,
  MessageSquareQuote,
  Clock,
  CheckSquare,
  AlertCircle,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  Inbox,
  AlertTriangle,
  Shield,
  Building2,
  UserCheck,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { Badge } from '../common/Badge';
import { TODAY_ISO } from '../../lib/initialData';
import { ManagerMeetingModal } from '../meetings/ManagerMeetingModal';

interface ManagerDashboardProps {
  onNavigate: (view: string, itemId?: string) => void;
  onOpenFollowUpModal: (followUp: any) => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  onNavigate,
  onOpenFollowUpModal,
}) => {
  const { currentUser, currentRole } = useAuth();
  const {
    users,
    departments,
    meetings,
    feedbacks,
    feedbackRequests,
    conversationRequests,
    followUps,
    tasks,
  } = useAppData();

  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>('all');
  const [isManagerMeetingOpen, setIsManagerMeetingOpen] = useState(false);

  // Active departments (strictly 3 sectors)
  const activeDepartments = departments.length > 0 ? departments : [
    { id: 'dept-comercial', name: 'Comercial', managerName: 'Bruno Fagundes' },
    { id: 'dept-marketing', name: 'Marketing', managerName: 'Camila Rocha' },
    { id: 'dept-site', name: 'Site', managerName: 'Rafael Mendes' },
  ];

  // Team scope:
  // - If admin: can view all or filter by sector
  // - If manager: strictly restricted to employees of their sector
  const teamMembers = users.filter((u) => {
    if (!u.active) return false;
    if (currentRole === 'admin') {
      if (selectedSectorFilter === 'all') return u.id !== currentUser?.id;
      return u.departmentId === selectedSectorFilter && u.id !== currentUser?.id;
    }
    // Manager is restricted to employees in same department
    return (
      u.role === 'employee' &&
      (u.departmentId === currentUser?.departmentId ||
        u.departmentName?.toLowerCase() === currentUser?.departmentName?.toLowerCase())
    );
  });

  const teamMemberIds = teamMembers.map((u) => u.id);

  // Selected Sector Details for Admin
  const currentSelectedDept = departments.find((d) => d.id === selectedSectorFilter);
  const currentDeptManager = users.find(
    (u) => u.role === 'manager' && u.departmentId === selectedSectorFilter
  );

  // Metrics computation scoped to teamMembers
  const todayMeetings = meetings.filter((m) => {
    if (m.date !== TODAY_ISO) return false;
    if (currentRole === 'admin' && selectedSectorFilter === 'all') return true;
    if (currentRole === 'admin' && selectedSectorFilter !== 'all') {
      return (
        m.targetDepartmentId === selectedSectorFilter ||
        m.targetParticipantIds.some((id) => teamMemberIds.includes(id))
      );
    }
    // Manager: meetings of their dept, company-wide, or where they are participant
    return (
      m.targetType === 'company' ||
      m.targetDepartmentId === currentUser?.departmentId ||
      m.targetParticipantIds.includes(currentUser?.id || '') ||
      m.organizerId === currentUser?.id
    );
  });

  const weekMeetings = meetings.filter((m) => {
    if (m.date < '2026-09-07' || m.date > '2026-09-14') return false;
    if (currentRole === 'admin' && selectedSectorFilter === 'all') return true;
    if (currentRole === 'admin' && selectedSectorFilter !== 'all') {
      return (
        m.targetDepartmentId === selectedSectorFilter ||
        m.targetParticipantIds.some((id) => teamMemberIds.includes(id))
      );
    }
    return (
      m.targetType === 'company' ||
      m.targetDepartmentId === currentUser?.departmentId ||
      m.targetParticipantIds.includes(currentUser?.id || '') ||
      m.organizerId === currentUser?.id
    );
  });

  const feedbacksThisMonth = feedbacks.filter((f) => {
    if (!f.date.startsWith('2026-09')) return false;
    if (currentRole === 'admin' && selectedSectorFilter === 'all') return true;
    return teamMemberIds.includes(f.employeeId) || f.managerId === currentUser?.id;
  });

  const pendingRequests = [
    ...feedbackRequests.filter(
      (r) =>
        r.status === 'requested' &&
        (currentRole === 'admin' && selectedSectorFilter === 'all'
          ? true
          : teamMemberIds.includes(r.employeeId) || r.managerId === currentUser?.id)
    ),
    ...conversationRequests.filter(
      (r) =>
        r.status === 'requested' &&
        (currentRole === 'admin' && selectedSectorFilter === 'all'
          ? true
          : teamMemberIds.includes(r.employeeId) || r.managerId === currentUser?.id)
    ),
  ];

  const todayFollowUps = followUps.filter((f) => {
    const isToday =
      f.status === 'Hoje' || (f.scheduledDate === TODAY_ISO && f.status !== 'Concluído');
    if (!isToday) return false;
    if (currentRole === 'admin' && selectedSectorFilter === 'all') return true;
    return teamMemberIds.includes(f.employeeId);
  });

  const overdueFollowUps = followUps.filter((f) => {
    const isOverdue =
      f.status === 'Atrasado' || (f.scheduledDate < TODAY_ISO && f.status !== 'Concluído');
    if (!isOverdue) return false;
    if (currentRole === 'admin' && selectedSectorFilter === 'all') return true;
    return teamMemberIds.includes(f.employeeId);
  });

  const teamTasks = tasks.filter((t) => {
    if (currentRole === 'admin' && selectedSectorFilter === 'all') return true;
    return teamMemberIds.includes(t.assigneeId);
  });

  const pendingTasks = teamTasks.filter(
    (t) => t.status === 'Pendente' || t.status === 'Em andamento'
  );
  const overdueTasks = teamTasks.filter(
    (t) => t.status === 'Atrasado' || (t.dueDate < TODAY_ISO && t.status !== 'Concluído')
  );

  // Próximos acompanhamentos list
  const upcomingFollowUps = followUps
    .filter((f) => {
      if (f.status === 'Concluído') return false;
      if (currentRole === 'admin' && selectedSectorFilter === 'all') return true;
      return teamMemberIds.includes(f.employeeId);
    })
    .sort((a, b) => (a.scheduledDate > b.scheduledDate ? 1 : -1))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Top Banner Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">
              {currentRole === 'admin'
                ? 'Painel de Gestão Geral & Controle por Setores'
                : `Painel de Gestão — Setor ${currentUser?.departmentName || 'Equipe'}`}
            </h2>
            <Badge variant={currentRole === 'admin' ? 'purple' : 'indigo'} size="sm">
              {currentRole === 'admin' ? 'Gerente Geral' : `Gestor ${currentUser?.departmentName || ''}`}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {currentRole === 'admin'
              ? `Olá, ${currentUser?.name}. Você tem visão corporativa completa e pode gerenciar todos os setores ou filtrá-los separadamente.`
              : `Olá, ${currentUser?.name}. Acompanhe sua equipe do setor ${currentUser?.departmentName}, feedbacks e reuniões.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {currentRole === 'admin' && (
            <button
              onClick={() => setIsManagerMeetingOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs flex items-center gap-1.5 shrink-0"
              title="Convocar reunião com os gerentes de setor"
            >
              <Shield className="w-3.5 h-3.5" />
              Reunião com Gerentes
            </button>
          )}

          <button
            onClick={() => onNavigate('feedbacks')}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
          >
            <MessageSquareQuote className="w-3.5 h-3.5" />
            Novo Feedback
          </button>
          <button
            onClick={() => onNavigate('meetings')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200 flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            Nova Reunião
          </button>
        </div>
      </div>

      {/* Admin Sector Control Section */}
      {currentRole === 'admin' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Visualização por Setores da Empresa
              </span>
            </div>
            <span className="text-xs text-slate-500">
              Selecione para inspecionar um setor individualmente
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <button
              onClick={() => setSelectedSectorFilter('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
                selectedSectorFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Visão Consolidada (Todos os Setores)</span>
            </button>

            {activeDepartments.map((dept) => {
              const count = users.filter((u) => u.departmentId === dept.id && u.active).length;
              const isSelected = selectedSectorFilter === dept.id;

              return (
                <button
                  key={dept.id}
                  onClick={() => setSelectedSectorFilter(dept.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current opacity-80" />
                  <span>Setor {dept.name}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selected Sector Focus Card */}
          {selectedSectorFilter !== 'all' && currentSelectedDept && (
            <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-150">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">
                    Setor Selecionado: {currentSelectedDept.name}
                  </span>
                  <Badge variant="indigo" size="sm">Filtro Ativo</Badge>
                </div>
                {currentDeptManager && (
                  <p className="text-xs text-slate-700 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Gerente do Setor:</span>
                    <strong className="text-slate-900">{currentDeptManager.name}</strong>
                    <span className="text-slate-500">({currentDeptManager.email})</span>
                  </p>
                )}
                <p className="text-xs text-slate-600">
                  Os indicadores abaixo refletem apenas os dados de colaboradores e atividades do setor de {currentSelectedDept.name}.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onNavigate('team')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  Ver Equipe de {currentSelectedDept.name}
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setSelectedSectorFilter('all')}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs rounded-lg transition-colors border border-slate-200"
                >
                  Limpar Filtro
                </button>
              </div>
            </div>
          )}

          {/* 3-Sector Overview Bento Grid (Visible when in Consolidated View) */}
          {selectedSectorFilter === 'all' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {activeDepartments.map((dept) => {
                const deptUsers = users.filter((u) => u.departmentId === dept.id && u.active);
                const manager = deptUsers.find((u) => u.role === 'manager');
                const employees = deptUsers.filter((u) => u.role === 'employee');

                return (
                  <div
                    key={dept.id}
                    onClick={() => setSelectedSectorFilter(dept.id)}
                    className="p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          Setor {dept.name}
                        </span>
                        <Badge variant="zinc" size="sm">
                          {deptUsers.length} membros
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-1">
                        Gerente: <strong className="text-slate-800">{manager?.name || 'A definir'}</strong>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {employees.length} funcionários sob gestão direta
                      </p>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-indigo-600 font-medium group-hover:underline">
                      <span>Inspecionar setor</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Manager Scope Restriction Notice */}
      {currentRole === 'manager' && (
        <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="text-xs text-slate-700">
              Painel restrito ao seu setor de atuação (<strong className="text-slate-900">{currentUser?.departmentName}</strong>). Você gerencia {teamMembers.length} funcionários.
            </span>
          </div>
          <button
            onClick={() => onNavigate('team')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium shrink-0 flex items-center gap-1"
          >
            Ver Equipe →
          </button>
        </div>
      )}

      {/* Grid of Indicator Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Funcionários da equipe */}
        <div
          onClick={() => onNavigate('team')}
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Equipe Ativa</span>
            <Users className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{teamMembers.length}</div>
          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
            <span>Colaboradores</span>
            <span className="text-indigo-600 font-medium flex items-center">
              Ver lista <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Reuniões de hoje */}
        <div
          onClick={() => onNavigate('meetings')}
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Reuniões Hoje</span>
            <Calendar className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{todayMeetings.length}</div>
          <div className="mt-1 text-[11px] text-slate-500">
            {weekMeetings.length} agendadas na semana
          </div>
        </div>

        {/* Feedbacks realizados no mês */}
        <div
          onClick={() => onNavigate('feedbacks')}
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Feedbacks (Mês)</span>
            <MessageSquareQuote className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{feedbacksThisMonth.length}</div>
          <div className="mt-1 text-[11px] text-emerald-600 font-medium">
            Em dia com a cultura 360°
          </div>
        </div>

        {/* Solicitações de feedback pendentes */}
        <div
          onClick={() => onNavigate('requests')}
          className={`p-4 rounded-xl border transition-all cursor-pointer group shadow-xs ${
            pendingRequests.length > 0
              ? 'border-amber-300 bg-amber-50/60'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Solicitações Pendentes</span>
            <Inbox
              className={`w-4 h-4 ${
                pendingRequests.length > 0 ? 'text-amber-600' : 'text-slate-400'
              } group-hover:scale-110 transition-transform`}
            />
          </div>
          <div className="text-2xl font-bold text-slate-900">{pendingRequests.length}</div>
          <div className="mt-1 text-[11px] text-slate-500">
            {pendingRequests.length > 0 ? 'Aguardando agendamento' : 'Todas respondidas'}
          </div>
        </div>

        {/* Acompanhamentos para hoje */}
        <div
          onClick={() => onNavigate('followups')}
          className={`p-4 rounded-xl border transition-all cursor-pointer group shadow-xs ${
            todayFollowUps.length > 0
              ? 'border-indigo-300 bg-indigo-50/60'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Acompanhamentos Hoje</span>
            <Clock className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{todayFollowUps.length}</div>
          <div className="mt-1 text-[11px] text-slate-500">
            {todayFollowUps.length > 0 ? 'Requer avaliação' : 'Nenhum para hoje'}
          </div>
        </div>

        {/* Acompanhamentos atrasados */}
        <div
          onClick={() => onNavigate('followups')}
          className={`p-4 rounded-xl border transition-all cursor-pointer group shadow-xs ${
            overdueFollowUps.length > 0
              ? 'border-rose-300 bg-rose-50/60'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Acompanh. Atrasados</span>
            <AlertCircle className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
          </div>
          <div
            className={`text-2xl font-bold ${
              overdueFollowUps.length > 0 ? 'text-rose-600' : 'text-slate-900'
            }`}
          >
            {overdueFollowUps.length}
          </div>
          <div className="mt-1 text-[11px] text-rose-600 font-medium">
            {overdueFollowUps.length > 0 ? 'Ação necessária' : 'Nenhum atraso'}
          </div>
        </div>

        {/* Tarefas pendentes */}
        <div
          onClick={() => onNavigate('tasks')}
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Tarefas Pendentes</span>
            <CheckSquare className="w-4 h-4 text-slate-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{pendingTasks.length}</div>
          <div className="mt-1 text-[11px] text-slate-500">Combinados em curso</div>
        </div>

        {/* Tarefas atrasadas */}
        <div
          onClick={() => onNavigate('tasks')}
          className={`p-4 rounded-xl border transition-all cursor-pointer group shadow-xs ${
            overdueTasks.length > 0
              ? 'border-rose-300 bg-rose-50/60'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Tarefas Atrasadas</span>
            <AlertTriangle className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
          </div>
          <div
            className={`text-2xl font-bold ${
              overdueTasks.length > 0 ? 'text-rose-600' : 'text-slate-900'
            }`}
          >
            {overdueTasks.length}
          </div>
          <div className="mt-1 text-[11px] text-rose-600 font-medium">
            {overdueTasks.length > 0 ? 'Cobrar responsáveis' : 'Prazos cumpridos'}
          </div>
        </div>
      </div>

      {/* Main Section: Próximos Acompanhamentos */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h3 className="text-base font-semibold text-slate-900">
              Próximos Acompanhamentos
            </h3>
          </div>
          <button
            onClick={() => onNavigate('followups')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
          >
            Ver todos ({followUps.length}) <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Clique diretamente no acompanhamento para registrar o resultado, atualizar notas ou agendar nova conversa.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {upcomingFollowUps.map((fup) => {
            const isToday = fup.scheduledDate === TODAY_ISO || fup.status === 'Hoje';
            const isOverdue =
              fup.status === 'Atrasado' || fup.scheduledDate < TODAY_ISO;

            const badgeVariant = isOverdue ? 'rose' : isToday ? 'indigo' : 'amber';
            const dateLabel = isToday
              ? 'Hoje'
              : isOverdue
              ? `Atrasado (${fup.scheduledDate})`
              : fup.scheduledDate.split('-').reverse().slice(0, 2).join('/');

            return (
              <div
                key={fup.id}
                onClick={() => onOpenFollowUpModal(fup)}
                className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-sm ${
                  isToday
                    ? 'bg-indigo-50/60 border-indigo-200 hover:border-indigo-300'
                    : isOverdue
                    ? 'bg-rose-50/60 border-rose-200 hover:border-rose-300'
                    : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">{fup.employeeName}</h4>
                    <p className="text-xs text-slate-600 mt-0.5">{fup.title}</p>
                  </div>
                  <Badge variant={badgeVariant} size="sm">
                    {dateLabel}
                  </Badge>
                </div>

                {fup.notes && (
                  <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 italic">
                    "{fup.notes}"
                  </p>
                )}

                <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Responsável: {fup.managerName}</span>
                  <span className="text-indigo-600 font-medium flex items-center gap-0.5">
                    Realizar acompanhamento →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Split Rows: Today's Agenda & Pending Team Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reuniões de hoje */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Agenda de Hoje ({todayMeetings.length})
              </h3>
            </div>
            <button
              onClick={() => onNavigate('agenda')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Abrir agenda completa
            </button>
          </div>

          <div className="space-y-2.5">
            {todayMeetings.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Nenhuma reunião agendada para hoje.
              </p>
            ) : (
              todayMeetings.map((m) => (
                <div
                  key={m.id}
                  onClick={() => onNavigate('meetings', m.id)}
                  className="p-3 bg-slate-50/70 rounded-xl border border-slate-200 hover:bg-slate-100/70 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="px-2 py-1 rounded bg-white border border-slate-200 text-slate-800 text-xs font-mono font-medium shadow-xs">
                      {m.time}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{m.title}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {m.location} • {m.durationMinutes} min
                      </p>
                    </div>
                  </div>
                  <Badge variant={m.type === 'Feedback' ? 'indigo' : 'zinc'} size="sm">
                    {m.type}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Solicitações da Equipe pendentes */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Solicitações da Equipe ({pendingRequests.length})
              </h3>
            </div>
            <button
              onClick={() => onNavigate('requests')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Gerenciar todas
            </button>
          </div>

          <div className="space-y-2.5">
            {pendingRequests.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Nenhuma solicitação de feedback ou conversa pendente.
              </p>
            ) : (
              pendingRequests.slice(0, 3).map((req: any) => (
                <div
                  key={req.id}
                  onClick={() => onNavigate('requests')}
                  className="p-3 bg-slate-50/70 rounded-xl border border-slate-200 hover:bg-slate-100/70 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900">
                        {req.employeeName}
                      </span>
                      <Badge variant="amber" size="sm">
                        Solicitado
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 truncate">
                      {req.topic || req.type}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate('requests');
                    }}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-medium rounded-lg border border-indigo-200 transition-colors shadow-xs"
                  >
                    Agendar conversa
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Manager Meeting Modal for Admin */}
      {isManagerMeetingOpen && (
        <ManagerMeetingModal
          isOpen={isManagerMeetingOpen}
          onClose={() => setIsManagerMeetingOpen(false)}
        />
      )}
    </div>
  );
};
