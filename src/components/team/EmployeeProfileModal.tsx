import React, { useState } from 'react';
import {
  User,
  Calendar,
  MessageSquareQuote,
  CheckSquare,
  Sparkles,
  Clock,
  History,
  CheckCircle2,
  Filter,
  Inbox,
  AlertCircle,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { useAppData } from '../../context/AppDataContext';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

interface EmployeeProfileModalProps {
  employee: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

type TabKey =
  | 'overview'
  | 'feedbacks'
  | 'meetings'
  | 'tasks'
  | 'followups'
  | 'timeline';

export const EmployeeProfileModal: React.FC<EmployeeProfileModalProps> = ({
  employee,
  isOpen,
  onClose,
}) => {
  const {
    feedbacks,
    meetings,
    tasks,
    followUps,
    feedbackRequests,
    conversationRequests,
  } = useAppData();

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [timelineFilter, setTimelineFilter] = useState<string>('all');

  // Filter items for this specific employee
  const empFeedbacks = feedbacks.filter((f) => f.employeeId === employee.id);
  const empMeetings = meetings.filter(
    (m) =>
      m.targetType === 'company' ||
      (m.targetType === 'department' && m.targetDepartmentId === employee.departmentId) ||
      m.targetParticipantIds.includes(employee.id)
  );
  const empTasks = tasks.filter((t) => t.assigneeId === employee.id);
  const empFollowUps = followUps.filter((f) => f.employeeId === employee.id);
  const empRequests = [
    ...feedbackRequests.filter((r) => r.employeeId === employee.id),
    ...conversationRequests.filter((r) => r.employeeId === employee.id),
  ];

  // Build Chronological Timeline (Prompt Section 20)
  interface TimelineEvent {
    id: string;
    date: string;
    type: 'feedback' | 'meeting' | 'task' | 'followup' | 'request';
    title: string;
    subtitle: string;
    statusBadge?: string;
  }

  const timelineEvents: TimelineEvent[] = [
    ...empFeedbacks.map((f) => ({
      id: f.id,
      date: f.date,
      type: 'feedback' as const,
      title: `Feedback: ${f.title}`,
      subtitle: `Tipo: ${f.type} • Gestor: ${f.managerName}`,
      statusBadge: f.type,
    })),
    ...empMeetings.map((m) => ({
      id: m.id,
      date: m.date,
      type: 'meeting' as const,
      title: `Reunião: ${m.title}`,
      subtitle: `${m.time} • ${m.location}`,
      statusBadge: m.type,
    })),
    ...empTasks.map((t) => ({
      id: t.id,
      date: t.dueDate,
      type: 'task' as const,
      title: `Tarefa: ${t.title}`,
      subtitle: `Origem: ${t.originTitle} • Prioridade: ${t.priority}`,
      statusBadge: t.status,
    })),
    ...empFollowUps.map((f) => ({
      id: f.id,
      date: f.scheduledDate,
      type: 'followup' as const,
      title: `Acompanhamento: ${f.title}`,
      subtitle: f.result ? `Resultado: ${f.result}` : 'Acompanhamento agendado',
      statusBadge: f.status,
    })),
    ...empRequests.map((r: any) => ({
      id: r.id,
      date: r.createdAt.split('T')[0],
      type: 'request' as const,
      title: `Solicitação: ${r.topic || r.type}`,
      subtitle: `Status: ${r.status}`,
      statusBadge: r.status,
    })),
  ].sort((a, b) => (a.date < b.date ? 1 : -1));

  const filteredTimeline = timelineEvents.filter((ev) => {
    if (timelineFilter === 'all') return true;
    return ev.type === timelineFilter;
  });

  const tabs: { id: TabKey; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Visão Geral', icon: User },
    { id: 'feedbacks', label: `Feedbacks (${empFeedbacks.length})`, icon: MessageSquareQuote },
    { id: 'meetings', label: `Reuniões (${empMeetings.length})`, icon: Calendar },
    { id: 'tasks', label: `Tarefas (${empTasks.length})`, icon: CheckSquare },
    { id: 'followups', label: `Acompanhamentos (${empFollowUps.length})`, icon: Sparkles },
    { id: 'timeline', label: 'Histórico / Linha do Tempo', icon: History },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={employee.name}
      subtitle={`${employee.positionName || 'Cargo'} • ${employee.departmentName || 'Setor'}`}
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* Navigation Tabs (Prompt Section 20) */}
        <div className="flex items-center gap-1 border-b border-slate-200 pb-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB: VISÃO GERAL */}
        {activeTab === 'overview' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-slate-500 font-medium block">Total de Feedbacks</span>
                <span className="text-xl font-bold text-slate-900">{empFeedbacks.length}</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Último:{' '}
                  {empFeedbacks[0] ? empFeedbacks[0].date : 'Nenhum'}
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-slate-500 font-medium block">Tarefas Atribuídas</span>
                <span className="text-xl font-bold text-slate-900">{empTasks.length}</span>
                <span className="text-[11px] text-emerald-600 font-medium block mt-0.5">
                  {empTasks.filter((t) => t.status === 'Concluído').length} concluídas
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-slate-500 font-medium block">Acompanhamentos</span>
                <span className="text-xl font-bold text-slate-900">{empFollowUps.length}</span>
                <span className="text-[11px] text-indigo-600 font-medium block mt-0.5">
                  {empFollowUps.filter((f) => f.status === 'Hoje' || f.status === 'Próximo').length}{' '}
                  pendentes
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-semibold text-slate-900">Dados do Perfil</h4>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span className="text-slate-400 block">E-mail:</span>
                  <span className="text-slate-800">{employee.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Status:</span>
                  <span className="text-emerald-600 font-medium">Ativo no sistema</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Cargo:</span>
                  <span className="text-slate-800">{employee.positionName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Departamento:</span>
                  <span className="text-slate-800">{employee.departmentName}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: FEEDBACKS */}
        {activeTab === 'feedbacks' && (
          <div className="space-y-3 text-xs">
            {empFeedbacks.length === 0 ? (
              <p className="text-slate-400 text-center py-6">Nenhum feedback registrado.</p>
            ) : (
              empFeedbacks.map((f) => (
                <div key={f.id} className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="indigo" size="sm">
                      {f.type}
                    </Badge>
                    <span className="text-slate-400 font-mono">{f.date}</span>
                  </div>
                  <h4 className="font-semibold text-slate-900">{f.title}</h4>
                  <p className="text-slate-600 mt-1">{f.description}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB: REUNIÕES */}
        {activeTab === 'meetings' && (
          <div className="space-y-3 text-xs">
            {empMeetings.length === 0 ? (
              <p className="text-slate-400 text-center py-6">Nenhuma reunião com este colaborador.</p>
            ) : (
              empMeetings.map((m) => (
                <div key={m.id} className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="zinc" size="sm">
                      {m.type}
                    </Badge>
                    <span className="text-slate-400 font-mono">
                      {m.date} às {m.time}
                    </span>
                  </div>
                  <h4 className="font-semibold text-slate-900">{m.title}</h4>
                  <p className="text-slate-600 mt-1">{m.location}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB: TAREFAS */}
        {activeTab === 'tasks' && (
          <div className="space-y-2 text-xs">
            {empTasks.length === 0 ? (
              <p className="text-slate-400 text-center py-6">Nenhuma tarefa atribuída.</p>
            ) : (
              empTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between shadow-xs"
                >
                  <div>
                    <h4 className="font-semibold text-slate-900">{t.title}</h4>
                    <span className="text-[11px] text-slate-400">Origem: {t.originTitle}</span>
                  </div>
                  <Badge variant={t.status === 'Concluído' ? 'emerald' : 'amber'} size="sm">
                    {t.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB: ACOMPANHAMENTOS */}
        {activeTab === 'followups' && (
          <div className="space-y-3 text-xs">
            {empFollowUps.length === 0 ? (
              <p className="text-slate-400 text-center py-6">Nenhum acompanhamento registrado.</p>
            ) : (
              empFollowUps.map((f) => (
                <div key={f.id} className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs">
                  <div className="flex justify-between items-center mb-1">
                    <Badge variant="amber" size="sm">
                      {f.status}
                    </Badge>
                    <span className="text-slate-400 font-mono">{f.scheduledDate}</span>
                  </div>
                  <h4 className="font-semibold text-slate-900">{f.title}</h4>
                  {f.result && <p className="text-emerald-600 mt-1">Resultado: {f.result}</p>}
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB: HISTÓRICO / LINHA DO TEMPO (Prompt Section 20) */}
        {activeTab === 'timeline' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-600 text-xs">Filtrar histórico:</span>
              <select
                value={timelineFilter}
                onChange={(e) => setTimelineFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded px-2 py-1 text-slate-700 text-xs focus:outline-none"
              >
                <option value="all">Todos os eventos</option>
                <option value="feedback">Feedbacks</option>
                <option value="meeting">Reuniões</option>
                <option value="task">Tarefas</option>
                <option value="followup">Acompanhamentos</option>
                <option value="request">Solicitações</option>
              </select>
            </div>

            <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
              {filteredTimeline.length === 0 ? (
                <p className="text-slate-400 py-4">Nenhum evento registrado no histórico.</p>
              ) : (
                filteredTimeline.map((ev) => (
                  <div key={ev.id} className="relative group">
                    {/* Timeline bullet dot */}
                    <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-indigo-600 ring-4 ring-slate-100" />

                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{ev.title}</span>
                        <span className="font-mono text-[11px] text-slate-400">{ev.date}</span>
                      </div>
                      <p className="text-slate-600 text-xs">{ev.subtitle}</p>
                      {ev.statusBadge && (
                        <div className="pt-1">
                          <Badge variant="zinc" size="sm">
                            {ev.statusBadge}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
