import React, { useState } from 'react';
import {
  MessageSquareQuote,
  Calendar,
  Inbox,
  CheckSquare,
  Sparkles,
  User,
  Clock,
  Send,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { Modal } from './Modal';
import { TODAY_ISO } from '../../lib/initialData';
import { FeedbackType, MeetingType, TaskPriority } from '../../types';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAction?: 'feedback' | 'meeting' | 'request' | 'task';
  onNavigate?: (view: string) => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  isOpen,
  onClose,
  defaultAction = 'feedback',
  onNavigate,
}) => {
  const { currentUser, currentRole } = useAuth();
  const {
    users,
    addFeedback,
    createMeeting,
    createFeedbackRequest,
    createConversationRequest,
    createTask,
  } = useAppData();

  const [activeTab, setActiveTab] = useState<'feedback' | 'meeting' | 'request' | 'task'>(defaultAction);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter candidates for assigning/meeting
  const selectableUsers = users.filter((u) => u.active && u.id !== currentUser?.id);
  const myTeam = users.filter(
    (u) => u.active && (currentRole === 'admin' ? u.id !== currentUser?.id : u.managerId === currentUser?.id)
  );

  // Form states
  // 1. Feedback Form
  const [feedbackData, setFeedbackData] = useState({
    employeeId: myTeam[0]?.id || selectableUsers[0]?.id || '',
    type: 'Desempenho' as FeedbackType,
    title: '',
    description: '',
    requiresFollowUp: true,
    followUpDays: 15,
  });

  // 2. Meeting Form
  const [meetingData, setMeetingData] = useState({
    title: 'Alinhamento 1:1',
    type: '1:1 (One on One)' as MeetingType,
    date: TODAY_ISO,
    time: '14:00',
    durationMinutes: 45,
    participantId: myTeam[0]?.id || selectableUsers[0]?.id || '',
    location: 'Sala de Reunião 2 / Google Meet',
  });

  // 3. Request Form (Employee asks manager)
  const [requestData, setRequestData] = useState({
    type: 'feedback' as 'feedback' | 'conversation',
    topic: 'Meu desempenho geral e alinhamento de metas',
    message: '',
  });

  // 4. Task Form
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    assigneeId: currentUser?.id || '',
    dueDate: TODAY_ISO,
    priority: 'Normal' as TaskPriority,
  });

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackData.title.trim() || !feedbackData.description.trim()) return;

    setIsSubmitting(true);
    try {
      const selectedEmp = users.find((u) => u.id === feedbackData.employeeId);
      const followUpDateObj = new Date();
      followUpDateObj.setDate(followUpDateObj.getDate() + feedbackData.followUpDays);
      const followUpDateStr = followUpDateObj.toISOString().split('T')[0];

      await addFeedback({
        employeeId: feedbackData.employeeId,
        employeeName: selectedEmp?.name || 'Colaborador',
        managerId: currentUser?.id || 'usr-rafael',
        managerName: currentUser?.name || 'Gestor',
        date: TODAY_ISO,
        type: feedbackData.type,
        category: 'Desempenho & Desenvolvimento',
        title: feedbackData.title,
        description: feedbackData.description,
        requiresFollowUp: feedbackData.requiresFollowUp,
        followUpPeriod: `${feedbackData.followUpDays} dias`,
        followUpScheduledDate: feedbackData.requiresFollowUp ? followUpDateStr : undefined,
      });

      setSuccessMessage('Feedback registrado com sucesso!');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
        if (onNavigate) onNavigate('feedbacks');
      }, 1200);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMeetingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingData.title.trim()) return;

    setIsSubmitting(true);
    try {
      const selectedPart = users.find((u) => u.id === meetingData.participantId);
      await createMeeting({
        title: meetingData.title,
        type: meetingData.type,
        date: meetingData.date,
        time: meetingData.time,
        durationMinutes: meetingData.durationMinutes,
        location: meetingData.location,
        organizerId: currentUser?.id || 'usr-rafael',
        organizerName: currentUser?.name || 'Organizador',
        targetType: 'participants',
        targetParticipantIds: [currentUser?.id || '', meetingData.participantId],
        targetParticipantNames: [currentUser?.name || '', selectedPart?.name || 'Participante'],
        agendaItems: ['Alinhamento de prioridades', 'Pontos de atenção', 'Próximos passos'],
      });

      setSuccessMessage('Reunião agendada com sucesso!');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
        if (onNavigate) onNavigate('meetings');
      }, 1200);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const managerId = currentUser?.managerId || 'usr-rafael';
      const manager = users.find((u) => u.id === managerId);

      if (requestData.type === 'feedback') {
        await createFeedbackRequest({
          employeeId: currentUser?.id || 'usr-joao',
          employeeName: currentUser?.name || 'Funcionário',
          managerId,
          managerName: manager?.name || 'Rafael Mendes',
          topic: requestData.topic,
          message: requestData.message,
        });
      } else {
        await createConversationRequest({
          employeeId: currentUser?.id || 'usr-joao',
          employeeName: currentUser?.name || 'Funcionário',
          managerId,
          managerName: manager?.name || 'Rafael Mendes',
          type: requestData.topic,
          message: requestData.message,
        });
      }

      setSuccessMessage('Solicitação enviada ao seu gestor!');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
        if (onNavigate) onNavigate('requests');
      }, 1200);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskData.title.trim()) return;

    setIsSubmitting(true);
    try {
      const assignee = users.find((u) => u.id === taskData.assigneeId);
      await createTask({
        title: taskData.title,
        description: taskData.description,
        assigneeId: taskData.assigneeId,
        assigneeName: assignee?.name || 'Responsável',
        creatorId: currentUser?.id || 'usr-rafael',
        creatorName: currentUser?.name || 'Criador',
        dueDate: taskData.dueDate,
        priority: taskData.priority,
        status: 'Pendente',
      });

      setSuccessMessage('Tarefa criada com sucesso!');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
        if (onNavigate) onNavigate('tasks');
      }, 1200);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ação Rápida no Sistema" size="lg">
      <div className="space-y-4">
        {/* Tab selection */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('feedback')}
            className={`p-2.5 rounded-lg text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
              activeTab === 'feedback'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <MessageSquareQuote className="w-4 h-4" />
            <span>Dar Feedback</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('meeting')}
            className={`p-2.5 rounded-lg text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
              activeTab === 'meeting'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Agendar Reunião</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('request')}
            className={`p-2.5 rounded-lg text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
              activeTab === 'request'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Pedir 1:1 / Conversa</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('task')}
            className={`p-2.5 rounded-lg text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
              activeTab === 'task'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Nova Tarefa</span>
          </button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Tab 1: Feedback Form */}
        {activeTab === 'feedback' && (
          <form onSubmit={handleFeedbackSubmit} className="space-y-3.5">
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-800">
              💡 <strong>Fluxo 1 do Sistema:</strong> Ao registrar um feedback, o acompanhamento (follow-up) futuro é agendado automaticamente para verificar a evolução do colaborador.
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Colaborador que receberá o feedback *
              </label>
              <select
                value={feedbackData.employeeId}
                onChange={(e) => setFeedbackData({ ...feedbackData, employeeId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
                required
              >
                {users
                  .filter((u) => u.active && u.id !== currentUser?.id)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.positionName || u.departmentName}
                    </option>
                  ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tipo de Feedback</label>
                <select
                  value={feedbackData.type}
                  onChange={(e) => setFeedbackData({ ...feedbackData, type: e.target.value as FeedbackType })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
                >
                  <option value="Feedback positivo">Feedback positivo</option>
                  <option value="Ponto de melhoria">Ponto de melhoria</option>
                  <option value="Desempenho">Desempenho</option>
                  <option value="Comportamento">Comportamento</option>
                  <option value="Desenvolvimento">Desenvolvimento</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Acompanhar em</label>
                <select
                  value={feedbackData.followUpDays}
                  onChange={(e) => setFeedbackData({ ...feedbackData, followUpDays: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
                >
                  <option value={7}>7 dias (Check-in rápido)</option>
                  <option value={15}>15 dias (Padrão sugerido)</option>
                  <option value={30}>30 dias (Mensal)</option>
                  <option value={60}>60 dias (Médio prazo)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Título / Assunto Principal *</label>
              <input
                type="text"
                placeholder="Ex: Excelente autonomia nas entregas da sprint"
                value={feedbackData.title}
                onChange={(e) => setFeedbackData({ ...feedbackData, title: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Descrição e Pontos Observados *</label>
              <textarea
                rows={3}
                placeholder="Descreva fatos, contexto, impacto positivo ou recomendações construtivas..."
                value={feedbackData.description}
                onChange={(e) => setFeedbackData({ ...feedbackData, description: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 resize-none"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs text-white font-semibold shadow-xs transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Salvando...' : 'Registrar Feedback'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Meeting Form */}
        {activeTab === 'meeting' && (
          <form onSubmit={handleMeetingSubmit} className="space-y-3.5">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
              💡 <strong>Fluxo 3 do Sistema:</strong> Reuniões 1:1 criadas aqui permitem registrar atas, decisões e transformar combinados em tarefas com responsáveis e prazos.
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Título da Reunião *</label>
                <input
                  type="text"
                  value={meetingData.title}
                  onChange={(e) => setMeetingData({ ...meetingData, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tipo</label>
                <select
                  value={meetingData.type}
                  onChange={(e) => setMeetingData({ ...meetingData, type: e.target.value as MeetingType })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
                >
                  <option value="1:1 (One on One)">1:1 (One on One)</option>
                  <option value="Alinhamento">Alinhamento</option>
                  <option value="Acompanhamento de metas">Acompanhamento de metas</option>
                  <option value="Feedback">Feedback</option>
                  <option value="Reunião de equipe">Reunião de equipe</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Participante Principal *</label>
              <select
                value={meetingData.participantId}
                onChange={(e) => setMeetingData({ ...meetingData, participantId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
                required
              >
                {selectableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.positionName || u.departmentName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Data</label>
                <input
                  type="date"
                  value={meetingData.date}
                  onChange={(e) => setMeetingData({ ...meetingData, date: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Horário</label>
                <input
                  type="time"
                  value={meetingData.time}
                  onChange={(e) => setMeetingData({ ...meetingData, time: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Duração (min)</label>
                <input
                  type="number"
                  value={meetingData.durationMinutes}
                  onChange={(e) => setMeetingData({ ...meetingData, durationMinutes: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
                  step={15}
                  min={15}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Local ou Link</label>
              <input
                type="text"
                value={meetingData.location}
                onChange={(e) => setMeetingData({ ...meetingData, location: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs text-white font-semibold shadow-xs transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Agendando...' : 'Agendar Reunião'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Request Form (Employee asks manager) */}
        {activeTab === 'request' && (
          <form onSubmit={handleRequestSubmit} className="space-y-3.5">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              💡 <strong>Fluxo 2 do Sistema:</strong> Qualquer colaborador pode solicitar uma conversa ou feedback ao seu gestor. O gestor recebe a notificação e pode agendar a reunião com 1 clique.
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tipo de Solicitação</label>
                <select
                  value={requestData.type}
                  onChange={(e) => setRequestData({ ...requestData, type: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
                >
                  <option value="feedback">Pedir Feedback sobre Desempenho</option>
                  <option value="conversation">Pedir Conversa Individual / 1:1</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Destinatário (Gestor)</label>
                <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium">
                  Rafael Mendes (Gestor de Equipe)
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Assunto / Pauta *</label>
              <input
                type="text"
                value={requestData.topic}
                onChange={(e) => setRequestData({ ...requestData, topic: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Mensagem ou Detalhes (Opcional)</label>
              <textarea
                rows={3}
                placeholder="Gostaria de alinhar expectativas para a próxima etapa e tirar dúvidas sobre meus objetivos..."
                value={requestData.message}
                onChange={(e) => setRequestData({ ...requestData, message: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs text-white font-semibold shadow-xs transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 4: Task Form */}
        {activeTab === 'task' && (
          <form onSubmit={handleTaskSubmit} className="space-y-3.5">
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-800">
              💡 <strong>Fluxo 4 do Sistema:</strong> Tarefas e combinados possuem prazo de entrega e avisam o gestor assim que concluídas pelo responsável.
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">O que deve ser feito? *</label>
              <input
                type="text"
                placeholder="Ex: Atualizar documentação de onboarding da equipe"
                value={taskData.title}
                onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Responsável *</label>
                <select
                  value={taskData.assigneeId}
                  onChange={(e) => setTaskData({ ...taskData, assigneeId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
                  required
                >
                  {users.filter((u) => u.active).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role === 'manager' ? 'Gestor' : u.role === 'admin' ? 'Admin' : 'Funcionário'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Prioridade</label>
                <select
                  value={taskData.priority}
                  onChange={(e) => setTaskData({ ...taskData, priority: e.target.value as TaskPriority })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
                >
                  <option value="Baixa">Baixa</option>
                  <option value="Normal">Normal</option>
                  <option value="Alta">Alta</option>
                  <option value="Urgente">Urgente</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Data de Vencimento *</label>
              <input
                type="date"
                value={taskData.dueDate}
                onChange={(e) => setTaskData({ ...taskData, dueDate: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Observações / Critérios de Sucesso</label>
              <textarea
                rows={2}
                placeholder="Detalhes adicionais ou links de referência..."
                value={taskData.description}
                onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs text-white font-semibold shadow-xs transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Criando...' : 'Criar Tarefa'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
