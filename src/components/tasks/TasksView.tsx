import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { Task, TaskPriority, TaskStatus } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { TODAY_ISO } from '../../lib/initialData';

export const TasksView: React.FC = () => {
  const { currentUser, currentRole } = useAuth();
  const { users, departments, tasks, createTask, updateTaskStatus } = useAppData();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);

  // Eligible employees for task assignment:
  // - Manager: strictly their own sector employees
  // - Admin: all active employees
  const departmentEmployees = users.filter((u) => {
    if (!u.active) return false;
    if (currentRole === 'admin') return u.id !== currentUser?.id;
    return (
      u.role === 'employee' &&
      (u.departmentId === currentUser?.departmentId ||
        u.departmentName?.toLowerCase() === currentUser?.departmentName?.toLowerCase())
    );
  });

  // New task form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigneeId: '',
    dueDate: TODAY_ISO,
    priority: 'Média' as TaskPriority,
    originTitle: 'Acordo Direto de Gestão',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtering
  const visibleTasks = tasks.filter((t) => {
    // Permission isolation
    if (currentRole === 'employee' && t.assigneeId !== currentUser?.id) return false;
    if (currentRole === 'manager') {
      const isDeptMember = departmentEmployees.some((e) => e.id === t.assigneeId);
      if (!isDeptMember && t.creatorId !== currentUser?.id) return false;
    }
    if (currentRole === 'admin' && selectedSector !== 'all') {
      const assignee = users.find((u) => u.id === t.assigneeId);
      if (assignee?.departmentId !== selectedSector) return false;
    }

    if (filterStatus === 'overdue') {
      if (t.status === 'Concluído' || t.dueDate >= TODAY_ISO) return false;
    } else if (filterStatus !== 'all' && t.status !== filterStatus) {
      return false;
    }

    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (filterAssignee !== 'all' && t.assigneeId !== filterAssignee) return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.assigneeName.toLowerCase().includes(q) ||
        t.originTitle.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.assigneeId) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    const assignee = users.find((u) => u.id === formData.assigneeId);
    if (!assignee) return;

    setIsSubmitting(true);
    try {
      await createTask({
        title: formData.title,
        description: formData.description,
        assigneeId: assignee.id,
        assigneeName: assignee.name,
        creatorId: currentUser?.id || 'gestor',
        creatorName: currentUser?.name || 'Gestor',
        originType: 'direct',
        originTitle: formData.originTitle,
        priority: formData.priority,
        dueDate: formData.dueDate,
        status: 'Pendente',
      });

      setIsNewTaskOpen(false);
      setFormData({
        title: '',
        description: '',
        assigneeId: '',
        dueDate: TODAY_ISO,
        priority: 'Média',
        originTitle: 'Acordo Direto de Gestão',
      });
    } catch (err: any) {
      alert('Erro ao criar tarefa: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityBadgeVariant = (p: TaskPriority) => {
    switch (p) {
      case 'Urgente':
        return 'rose';
      case 'Alta':
        return 'amber';
      case 'Média':
        return 'indigo';
      case 'Baixa':
      default:
        return 'zinc';
    }
  };

  const getStatusBadgeVariant = (s: TaskStatus) => {
    switch (s) {
      case 'Concluído':
        return 'emerald';
      case 'Em andamento':
        return 'indigo';
      case 'Atrasado':
        return 'rose';
      case 'Pendente':
      default:
        return 'amber';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-600" />
            Tarefas e Combinados
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Acompanhamento de planos de ação, compromissos acordados em reuniões 1:1 e prazos.
          </p>
        </div>

        {currentRole !== 'employee' && (
          <button
            onClick={() => setIsNewTaskOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs flex items-center justify-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Nova Tarefa
          </button>
        )}
      </div>

      {/* Admin Sector Filter Tabs */}
      {currentRole === 'admin' && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setSelectedSector('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors ${
              selectedSector === 'all'
                ? 'bg-slate-900 text-white font-semibold shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Todos os Setores</span>
          </button>
          {departments.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedSector(d.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors ${
                selectedSector === d.id
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <span>Setor {d.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Filter Bar (Prompt Section 15: responsável, status, prioridade, tarefas atrasadas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs text-xs">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar tarefas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500"
          />
        </div>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
        >
          <option value="all">Todos os status</option>
          <option value="Pendente">Pendente</option>
          <option value="Em andamento">Em andamento</option>
          <option value="Concluído">Concluído</option>
          <option value="overdue">Apenas Atrasadas</option>
        </select>

        {/* Prioridade filter */}
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
        >
          <option value="all">Todas as prioridades</option>
          <option value="Baixa">Baixa</option>
          <option value="Média">Média</option>
          <option value="Alta">Alta</option>
          <option value="Urgente">Urgente</option>
        </select>

        {/* Responsável filter (for Managers and Admins) */}
        {currentRole !== 'employee' ? (
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
          >
            <option value="all">Todos os responsáveis</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="flex items-center px-2.5 py-1.5 text-slate-500 font-medium">
            Minhas atribuições
          </div>
        )}
      </div>

      {/* Tasks Table / Cards */}
      <div className="space-y-3">
        {visibleTasks.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200 shadow-xs">
            Nenhuma tarefa encontrada para os filtros selecionados.
          </div>
        ) : (
          visibleTasks.map((task) => {
            const isCompleted = task.status === 'Concluído';
            const isOverdue = !isCompleted && task.dueDate < TODAY_ISO;

            return (
              <div
                key={task.id}
                className={`p-4 bg-white rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs ${
                  isOverdue
                    ? 'border-rose-300 bg-rose-50/40 ring-1 ring-rose-200'
                    : isCompleted
                    ? 'border-slate-200 bg-slate-50/60 opacity-75'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  {/* Quick Toggle Checkbox */}
                  <button
                    onClick={() =>
                      updateTaskStatus(
                        task.id,
                        isCompleted ? 'Pendente' : 'Concluído'
                      )
                    }
                    className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 hover:border-indigo-500 bg-white'
                    }`}
                    title={isCompleted ? 'Marcar como pendente' : 'Marcar como concluída'}
                  >
                    {isCompleted && <CheckCircle2 className="w-4 h-4" />}
                  </button>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4
                        className={`text-sm font-semibold text-slate-900 ${
                          isCompleted ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {task.title}
                      </h4>
                      <Badge variant={getPriorityBadgeVariant(task.priority)} size="sm">
                        {task.priority}
                      </Badge>
                      <Badge
                        variant={isOverdue ? 'rose' : getStatusBadgeVariant(task.status)}
                        size="sm"
                      >
                        {isOverdue ? 'Atrasado' : task.status}
                      </Badge>
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-600 leading-relaxed">{task.description}</p>
                    )}

                    {/* Origem da tarefa (Prompt Section 15: Exemplo: Reunião Comercial - 09/09) */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                      <span>
                        Origem: <strong className="text-slate-800 font-medium">{task.originTitle}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Responsável: <strong className="text-slate-800 font-medium">{task.assigneeName}</strong>
                      </span>
                      <span>•</span>
                      <span>Criado por: {task.creatorName}</span>
                    </div>
                  </div>
                </div>

                {/* Right controls: Due date and status select */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <span
                    className={`text-xs font-mono flex items-center gap-1 ${
                      isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Prazo: {task.dueDate}
                  </span>

                  <select
                    value={task.status}
                    onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Concluído">Concluído</option>
                    <option value="Atrasado">Atrasado</option>
                  </select>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Nova Tarefa */}
      <Modal
        isOpen={isNewTaskOpen}
        onClose={() => setIsNewTaskOpen(false)}
        title="Criar Nova Tarefa / Combinado"
        subtitle="Atribua um plano de ação claro com prazo e prioridade"
        maxWidth="md"
      >
        <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Título da Tarefa *</label>
            <input
              type="text"
              required
              placeholder="Ex: Enviar relatório consolidado do mês"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Responsável *</label>
              <select
                required
                value={formData.assigneeId}
                onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
              >
                <option value="">Selecione o colaborador...</option>
                {departmentEmployees.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.departmentName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Data Limite *</label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Prioridade *</label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value as TaskPriority })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
              >
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Origem da Tarefa (Ex: Reunião X)
              </label>
              <input
                type="text"
                placeholder="Ex: Alinhamento de Metas"
                value={formData.originTitle}
                onChange={(e) => setFormData({ ...formData, originTitle: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Descrição</label>
            <textarea
              rows={2}
              placeholder="Instruções e escopo do combinado..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsNewTaskOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-xs"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Tarefa'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
