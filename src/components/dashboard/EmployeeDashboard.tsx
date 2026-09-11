import React from 'react';
import {
  Calendar,
  CheckSquare,
  Clock,
  MessageSquareQuote,
  Inbox,
  AlertCircle,
  Plus,
  CheckCircle2,
  CalendarCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { Badge } from '../common/Badge';
import { TODAY_ISO, TOMORROW_ISO } from '../../lib/initialData';

interface EmployeeDashboardProps {
  onNavigate: (view: string, itemId?: string) => void;
  onRequestFeedback: () => void;
  onRequestConversation: () => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  onNavigate,
  onRequestFeedback,
  onRequestConversation,
}) => {
  const { currentUser } = useAuth();
  const {
    meetings,
    tasks,
    feedbacks,
    feedbackRequests,
    conversationRequests,
    followUps,
    updateTaskStatus,
  } = useAppData();

  const userId = currentUser?.id || '';

  // Filter items specifically for the current employee
  const userMeetings = meetings.filter(
    (m) =>
      m.targetType === 'company' ||
      (m.targetType === 'department' && m.targetDepartmentId === currentUser?.departmentId) ||
      m.targetParticipantIds.includes(userId)
  );

  const todayMeetings = userMeetings.filter((m) => m.date === TODAY_ISO);
  const upcomingMeetings = userMeetings.filter((m) => m.date > TODAY_ISO).slice(0, 3);

  const userTasks = tasks.filter((t) => t.assigneeId === userId);
  const todayTasks = userTasks.filter(
    (t) => t.dueDate === TODAY_ISO && t.status !== 'Concluído'
  );
  const tomorrowTasks = userTasks.filter(
    (t) => t.dueDate === TOMORROW_ISO && t.status !== 'Concluído'
  );
  const overdueTasks = userTasks.filter(
    (t) => t.dueDate < TODAY_ISO && t.status !== 'Concluído'
  );

  const userRequests = [
    ...feedbackRequests.filter((r) => r.employeeId === userId),
    ...conversationRequests.filter((r) => r.employeeId === userId),
  ];

  const nextScheduledMeeting = userMeetings.find(
    (m) => m.date >= TODAY_ISO && m.type === 'Feedback'
  );

  const nextFollowUp = followUps.find(
    (f) => f.employeeId === userId && f.status !== 'Concluído'
  );

  const firstName = currentUser?.name?.split(' ')[0] || 'Colaborador';

  return (
    <div className="space-y-6">
      {/* "Meu Dia" Hero Section */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                Acompanhamento Individual
              </span>
              <Badge variant="indigo" size="sm">
                Meu Dia
              </Badge>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              Bom dia, {firstName}.
            </h2>
            <div className="text-sm text-slate-500 mt-2 space-y-1">
              <p className="font-medium text-slate-700">Hoje você possui:</p>
              <ul className="list-disc list-inside space-y-0.5 text-xs text-slate-600">
                <li>
                  <span className="font-semibold text-slate-900">{todayMeetings.length}</span>{' '}
                  reunião{todayMeetings.length !== 1 ? 'ões' : ''}
                </li>
                <li>
                  <span className="font-semibold text-slate-900">{todayTasks.length}</span>{' '}
                  tarefa{todayTasks.length !== 1 ? 's' : ''} para hoje
                </li>
                {tomorrowTasks.length > 0 && (
                  <li>
                    <span className="font-semibold text-amber-600">{tomorrowTasks.length}</span>{' '}
                    atividade vencendo amanhã
                  </li>
                )}
                {overdueTasks.length > 0 && (
                  <li className="text-rose-600 font-medium">
                    <span className="font-semibold">{overdueTasks.length}</span> tarefa atrasada
                  </li>
                )}
              </ul>
              {nextScheduledMeeting ? (
                <p className="text-xs font-medium text-indigo-700 pt-1">
                  Próximo feedback agendado:{' '}
                  <span className="underline">
                    {nextScheduledMeeting.date} às {nextScheduledMeeting.time}
                  </span>
                </p>
              ) : nextFollowUp ? (
                <p className="text-xs font-medium text-indigo-700 pt-1">
                  Próximo acompanhamento:{' '}
                  <span className="underline">
                    {nextFollowUp.scheduledDate} ({nextFollowUp.title})
                  </span>
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
            <button
              onClick={onRequestFeedback}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs flex items-center justify-center gap-1.5"
            >
              <MessageSquareQuote className="w-4 h-4" />
              Solicitar Feedback
            </button>
            <button
              onClick={onRequestConversation}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200 flex items-center justify-center gap-1.5"
            >
              <CalendarCheck className="w-4 h-4 text-indigo-600" />
              Solicitar Conversa
            </button>
          </div>
        </div>
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div
          onClick={() => onNavigate('agenda')}
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Reuniões Hoje</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{todayMeetings.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">Ver horários</p>
        </div>

        <div
          onClick={() => onNavigate('tasks')}
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Tarefas Ativas</span>
            <CheckSquare className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {todayTasks.length + tomorrowTasks.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Combinados de reuniões</p>
        </div>

        <div
          onClick={() => onNavigate('requests')}
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Minhas Solicitações</span>
            <Inbox className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{userRequests.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">Feedbacks & conversas</p>
        </div>
      </div>

      {/* Main Rows: Today's Tasks & Today's Meetings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Minhas Tarefas de Hoje e Próximas */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Tarefas do Dia & Combinados
              </h3>
            </div>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Ver todas ({userTasks.length})
            </button>
          </div>

          <div className="space-y-2.5">
            {todayTasks.length === 0 && tomorrowTasks.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                Nenhuma tarefa pendente para hoje ou amanhã. Ótimo trabalho!
              </div>
            ) : (
              [...todayTasks, ...tomorrowTasks].map((task) => {
                const isOverdue = task.dueDate < TODAY_ISO;
                const isTomorrow = task.dueDate === TOMORROW_ISO;

                return (
                  <div
                    key={task.id}
                    className="p-3 bg-slate-50/70 rounded-xl border border-slate-200 hover:bg-slate-100/70 transition-colors flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <button
                        onClick={() =>
                          updateTaskStatus(
                            task.id,
                            task.status === 'Concluído' ? 'Pendente' : 'Concluído'
                          )
                        }
                        className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          task.status === 'Concluído'
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 hover:border-indigo-500 bg-white'
                        }`}
                        title="Marcar como concluída"
                      >
                        {task.status === 'Concluído' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-medium text-slate-900 ${
                            task.status === 'Concluído' ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {task.title}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Origem: <span className="text-slate-600">{task.originTitle}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0 gap-1">
                      <Badge
                        variant={
                          isOverdue ? 'rose' : isTomorrow ? 'amber' : 'zinc'
                        }
                        size="sm"
                      >
                        {isOverdue ? 'Atrasado' : isTomorrow ? 'Amanhã' : 'Hoje'}
                      </Badge>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Prioridade {task.priority}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Compromissos e Reuniões de Hoje */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Compromissos de Hoje ({todayMeetings.length})
              </h3>
            </div>
            <button
              onClick={() => onNavigate('agenda')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Minha Agenda
            </button>
          </div>

          <div className="space-y-2.5">
            {todayMeetings.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                Nenhum compromisso agendado para hoje.
              </div>
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

          {/* Próximos compromissos da semana */}
          {upcomingMeetings.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Próximos Compromissos da Semana
              </h4>
              <div className="space-y-2">
                {upcomingMeetings.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => onNavigate('meetings', m.id)}
                    className="p-2.5 bg-slate-50/60 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs flex items-center justify-between cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">{m.title}</p>
                      <p className="text-[11px] text-slate-500">
                        {m.date} às {m.time}
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-500">{m.location}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
