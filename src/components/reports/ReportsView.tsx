import React, { useState } from 'react';
import {
  BarChart3,
  Calendar,
  Filter,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  PieChart,
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { Badge } from '../common/Badge';
import { TODAY_ISO } from '../../lib/initialData';

export const ReportsView: React.FC = () => {
  const { users, departments, feedbacks, meetings, tasks, followUps } = useAppData();

  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('month');

  // Filter users by department if selected
  const activeEmployees = users.filter((u) => {
    if (!u.active) return false;
    if (selectedDept !== 'all' && u.departmentId !== selectedDept) return false;
    return true;
  });
  const employeeIds = activeEmployees.map((e) => e.id);

  // Filter feedbacks
  const relevantFeedbacks = feedbacks.filter((f) => employeeIds.includes(f.employeeId));

  // Filter meetings
  const relevantMeetings = meetings;

  // Filter tasks
  const relevantTasks = tasks.filter((t) => employeeIds.includes(t.assigneeId));
  const completedTasks = relevantTasks.filter((t) => t.status === 'Concluído');
  const taskCompletionRate =
    relevantTasks.length > 0
      ? Math.round((completedTasks.length / relevantTasks.length) * 100)
      : 100;

  // Feedbacks by type calculation
  const typeCounts: Record<string, number> = {};
  relevantFeedbacks.forEach((f) => {
    typeCounts[f.type] = (typeCounts[f.type] || 0) + 1;
  });
  const sortedTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);

  // Ranking: Funcionários com mais feedbacks & Funcionários há mais tempo sem feedback (Prompt Section 21)
  const employeeFeedbackStats = activeEmployees.map((emp) => {
    const empFeedbacks = feedbacks.filter((f) => f.employeeId === emp.id);
    const sorted = empFeedbacks.sort((a, b) => (a.date < b.date ? 1 : -1));
    const lastDate = sorted[0]?.date || 'Nunca recebeu';

    return {
      id: emp.id,
      name: emp.name,
      department: emp.departmentName,
      feedbackCount: empFeedbacks.length,
      lastFeedbackDate: lastDate,
    };
  });

  const mostFeedbacks = [...employeeFeedbackStats].sort(
    (a, b) => b.feedbackCount - a.feedbackCount
  );

  const longestWithoutFeedback = [...employeeFeedbackStats].sort((a, b) => {
    if (a.lastFeedbackDate === 'Nunca recebeu') return -1;
    if (b.lastFeedbackDate === 'Nunca recebeu') return 1;
    return a.lastFeedbackDate > b.lastFeedbackDate ? 1 : -1;
  });

  const pendingFollowUps = followUps.filter((f) => f.status !== 'Concluído');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Relatórios e Indicadores de Liderança
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Métricas de frequência de feedbacks, cumprimento de acordos, alinhamentos e cultura contínua.
          </p>
        </div>

        {/* Filters: Período e Setor (Prompt Section 21) */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-lg border border-slate-200 text-xs shadow-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-transparent text-slate-700 focus:outline-none"
            >
              <option value="all">Todos os setores</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-lg border border-slate-200 text-xs shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent text-slate-700 focus:outline-none"
            >
              <option value="month">Este Mês (Setembro/2026)</option>
              <option value="quarter">Este Trimestre (Q3/2026)</option>
              <option value="year">Ano Atual (2026)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Top Indicators KPI Grid (Prompt Section 21) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">Total de Feedbacks</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            {relevantFeedbacks.length}
          </span>
          <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">Registrados no período</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">Reuniões Realizadas</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            {relevantMeetings.length}
          </span>
          <span className="text-[11px] text-indigo-600 font-medium mt-0.5 block">1:1s e alinhamentos</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">Taxa de Conclusão de Tarefas</span>
          <span className="text-2xl font-bold text-emerald-600 mt-1 block">
            {taskCompletionRate}%
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {completedTasks.length} de {relevantTasks.length} tarefas
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">Acompanhamentos Pendentes</span>
          <span className="text-2xl font-bold text-amber-600 mt-1 block">
            {pendingFollowUps.length}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Aguardando resultado</span>
        </div>
      </div>

      {/* Breakdown: Tipos de Feedback mais frequentes */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <PieChart className="w-4 h-4 text-indigo-600" />
          Tipos de Feedback Mais Frequentes
        </h3>

        <div className="space-y-2.5 text-xs">
          {sortedTypes.map(([type, count]) => {
            const pct = Math.round((count / (relevantFeedbacks.length || 1)) * 100);
            return (
              <div key={type} className="space-y-1">
                <div className="flex justify-between text-slate-700">
                  <span className="font-medium">{type}</span>
                  <span className="font-mono text-slate-500">
                    {count} ({pct}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comparisons: Mais Feedbacks vs. Mais Tempo Sem Feedback (Prompt Section 21) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Funcionários com mais feedbacks */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Colaboradores Mais Acompanhados
          </h3>
          <p className="text-xs text-slate-500">
            Maior volume de conversas e alinhamentos registrados.
          </p>

          <div className="divide-y divide-slate-100 text-xs">
            {mostFeedbacks.slice(0, 4).map((emp) => (
              <div key={emp.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-900 block">{emp.name}</span>
                  <span className="text-[11px] text-slate-500">{emp.department}</span>
                </div>
                <Badge variant="emerald">{emp.feedbackCount} feedbacks</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Funcionários há mais tempo sem feedback (Atenção para a liderança) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Atenção: Mais Tempo Sem Feedback
          </h3>
          <p className="text-xs text-slate-500">
            Recomenda-se agendar uma conversa 1:1 para esses colaboradores.
          </p>

          <div className="divide-y divide-slate-100 text-xs">
            {longestWithoutFeedback.slice(0, 4).map((emp) => (
              <div key={emp.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-900 block">{emp.name}</span>
                  <span className="text-[11px] text-slate-500">{emp.department}</span>
                </div>
                <Badge
                  variant={emp.lastFeedbackDate === 'Nunca recebeu' ? 'rose' : 'amber'}
                  size="sm"
                >
                  {emp.lastFeedbackDate}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
