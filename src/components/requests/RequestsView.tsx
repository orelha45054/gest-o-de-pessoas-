import React, { useState } from 'react';
import {
  Inbox,
  MessageSquareQuote,
  CalendarCheck,
  Plus,
  Clock,
  CheckCircle2,
  Calendar,
  Eye,
  Send,
  User,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { FeedbackRequest, ConversationRequest, RequestStatus, ConversationTopic } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { TODAY_ISO } from '../../lib/initialData';

const FEEDBACK_TOPICS = [
  'Meu desempenho geral',
  'Onde posso melhorar',
  'Desenvolvimento profissional',
  'Projeto específico',
  'Minhas responsabilidades',
  'Carreira',
  'Atendimento',
  'Produtividade',
  'Outro',
];

const CONVERSATION_TOPICS: ConversationTopic[] = [
  'Conversa individual',
  'Orientação',
  'Conversa sobre carreira',
  'Conversa sobre dificuldades',
  'Reunião com gestor',
  'Outro',
];

export const RequestsView: React.FC = () => {
  const { currentUser, currentRole } = useAuth();
  const {
    users,
    feedbackRequests,
    conversationRequests,
    createFeedbackRequest,
    createConversationRequest,
    updateRequestStatus,
    scheduleRequestMeeting,
  } = useAppData();

  // Modals state
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isConversationModalOpen, setIsConversationModalOpen] = useState(false);
  const [scheduleTarget, setScheduleTarget] = useState<{
    type: 'feedback' | 'conversation';
    request: any;
  } | null>(null);
  const [viewDetailsTarget, setViewDetailsTarget] = useState<{
    type: 'feedback' | 'conversation';
    request: any;
  } | null>(null);

  // Form states
  const [feedbackForm, setFeedbackForm] = useState({
    managerId: '',
    topic: 'Meu desempenho geral',
    message: '',
  });

  const [conversationForm, setConversationForm] = useState({
    managerId: '',
    type: 'Conversa individual' as ConversationTopic,
    message: '',
  });

  const [scheduleForm, setScheduleForm] = useState({
    date: TODAY_ISO,
    time: '14:00',
    durationMinutes: 45,
    location: 'Sala de Reuniões 1 / Google Meet',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // List of eligible managers
  const eligibleManagers = users.filter((u) => u.role === 'manager' || u.role === 'admin');

  // Employee requests
  const myFeedbackRequests = feedbackRequests.filter((r) => r.employeeId === currentUser?.id);
  const myConversationRequests = conversationRequests.filter((r) => r.employeeId === currentUser?.id);

  // Team requests (for Managers and Admins)
  const teamFeedbackRequests = feedbackRequests.filter((r) =>
    currentRole === 'admin' ? true : r.managerId === currentUser?.id
  );
  const teamConversationRequests = conversationRequests.filter((r) =>
    currentRole === 'admin' ? true : r.managerId === currentUser?.id
  );

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'requested':
        return <Badge variant="amber">Solicitado</Badge>;
      case 'viewed':
        return <Badge variant="zinc">Visualizado</Badge>;
      case 'scheduled':
        return <Badge variant="indigo">Agendado</Badge>;
      case 'performed':
        return <Badge variant="purple">Realizado</Badge>;
      case 'completed':
        return <Badge variant="emerald">Concluído</Badge>;
      default:
        return <Badge variant="zinc">{status}</Badge>;
    }
  };

  // Submit Feedback Request
  const handleSendFeedbackRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackForm.managerId) {
      alert('Selecione um gestor.');
      return;
    }
    const manager = users.find((u) => u.id === feedbackForm.managerId);
    if (!manager) return;

    setIsSubmitting(true);
    try {
      await createFeedbackRequest({
        employeeId: currentUser?.id || 'usr-joao',
        employeeName: currentUser?.name || 'Funcionário',
        managerId: manager.id,
        managerName: manager.name,
        topic: feedbackForm.topic,
        message: feedbackForm.message,
      });
      setIsFeedbackModalOpen(false);
      setFeedbackForm({
        managerId: '',
        topic: 'Meu desempenho geral',
        message: '',
      });
    } catch (err: any) {
      alert('Erro ao enviar solicitação: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Conversation Request
  const handleSendConversationRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversationForm.managerId) {
      alert('Selecione um gestor.');
      return;
    }
    const manager = users.find((u) => u.id === conversationForm.managerId);
    if (!manager) return;

    setIsSubmitting(true);
    try {
      await createConversationRequest({
        employeeId: currentUser?.id || 'usr-joao',
        employeeName: currentUser?.name || 'Funcionário',
        managerId: manager.id,
        managerName: manager.name,
        type: conversationForm.type,
        message: conversationForm.message,
      });
      setIsConversationModalOpen(false);
      setConversationForm({
        managerId: '',
        type: 'Conversa individual',
        message: '',
      });
    } catch (err: any) {
      alert('Erro ao enviar solicitação: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // FLUXO 2: Manager schedules conversation -> creates meeting automatically
  const handleScheduleConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleTarget) return;

    setIsSubmitting(true);
    try {
      const isFb = scheduleTarget.type === 'feedback';
      const req = scheduleTarget.request;

      await scheduleRequestMeeting(scheduleTarget.type, req.id, {
        title: isFb
          ? `Feedback: ${req.topic} (${req.employeeName})`
          : `${req.type}: ${req.employeeName}`,
        date: scheduleForm.date,
        time: scheduleForm.time,
        durationMinutes: Number(scheduleForm.durationMinutes),
        location: scheduleForm.location,
        notes: scheduleForm.notes,
        organizerId: currentUser?.id || req.managerId,
        organizerName: currentUser?.name || req.managerName,
        employeeId: req.employeeId,
        employeeName: req.employeeName,
      });

      setScheduleTarget(null);
    } catch (err: any) {
      alert('Erro ao agendar reunião: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Inbox className="w-5 h-5 text-indigo-600" />
            Solicitações de Feedback e Conversas
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Canal direto para que colaboradores solicitem orientações e gestores transformem pedidos em reuniões na agenda.
          </p>
        </div>

        {/* Action buttons for Employee */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              // Pre-select manager if employee has assigned manager
              setFeedbackForm((prev) => ({
                ...prev,
                managerId: currentUser?.managerId || eligibleManagers[0]?.id || '',
              }));
              setIsFeedbackModalOpen(true);
            }}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
          >
            <MessageSquareQuote className="w-4 h-4" />
            Solicitar Feedback
          </button>
          <button
            onClick={() => {
              setConversationForm((prev) => ({
                ...prev,
                managerId: currentUser?.managerId || eligibleManagers[0]?.id || '',
              }));
              setIsConversationModalOpen(true);
            }}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200 shadow-xs flex items-center gap-1.5"
          >
            <CalendarCheck className="w-4 h-4 text-indigo-600" />
            Solicitar Conversa
          </button>
        </div>
      </div>

      {/* PAINEL DE SOLICITAÇÕES DO GESTOR (Sections 13 & Fluxo 2) */}
      {currentRole !== 'employee' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Inbox className="w-4 h-4 text-amber-500" />
                Solicitações da Equipe
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pedidos de feedback e conversas enviados pelos colaboradores da equipe.
              </p>
            </div>
            <Badge variant="amber">
              {teamFeedbackRequests.length + teamConversationRequests.length} solicitações
            </Badge>
          </div>

          <div className="divide-y divide-slate-100">
            {teamFeedbackRequests.length === 0 && teamConversationRequests.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Nenhuma solicitação da equipe pendente.
              </p>
            ) : (
              [...teamFeedbackRequests, ...teamConversationRequests].map((req: any) => {
                const isFb = 'topic' in req;
                const subject = isFb ? req.topic : req.type;

                return (
                  <div
                    key={req.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {req.employeeName}
                        </span>
                        {getStatusBadge(req.status)}
                        <span className="text-[11px] text-slate-400">
                          em {req.createdAt.split('T')[0]}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        {isFb ? 'Solicitou feedback sobre: ' : 'Solicitou conversa: '}
                        <span className="font-semibold text-indigo-600">{subject}</span>
                      </p>
                      {req.message && (
                        <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          "{req.message}"
                        </p>
                      )}
                      {req.scheduledDate && (
                        <p className="text-xs text-emerald-600 font-medium">
                          Agendado para: {req.scheduledDate}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          updateRequestStatus(
                            isFb ? 'feedback' : 'conversation',
                            req.id,
                            'viewed'
                          );
                          setViewDetailsTarget({
                            type: isFb ? 'feedback' : 'conversation',
                            request: req,
                          });
                        }}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition-colors flex items-center gap-1 shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Visualizar
                      </button>

                      {req.status !== 'completed' && req.status !== 'scheduled' && (
                        <button
                          onClick={() => {
                            updateRequestStatus(
                              isFb ? 'feedback' : 'conversation',
                              req.id,
                              'viewed'
                            );
                            setScheduleTarget({
                              type: isFb ? 'feedback' : 'conversation',
                              request: req,
                            });
                          }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors shadow-xs flex items-center gap-1"
                        >
                          <CalendarCheck className="w-3.5 h-3.5" />
                          Agendar conversa
                        </button>
                      )}

                      {req.status === 'scheduled' && (
                        <button
                          onClick={() =>
                            updateRequestStatus(
                              isFb ? 'feedback' : 'conversation',
                              req.id,
                              'completed'
                            )
                          }
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium rounded-lg border border-emerald-200 transition-colors"
                        >
                          Marcar como concluído
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MINHAS SOLICITAÇÕES (Section 12: Assunto, Gestor, Data da solicitação, Status, Data agendada) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Inbox className="w-4 h-4 text-indigo-600" />
            Minhas Solicitações Enviadas
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhe o status e a data agendada para seus pedidos de alinhamento.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="pb-3 pr-4">Assunto / Tema</th>
                <th className="pb-3 pr-4">Gestor Responsável</th>
                <th className="pb-3 pr-4">Data da Solicitação</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Data Agendada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myFeedbackRequests.length === 0 && myConversationRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Você ainda não enviou solicitações de feedback ou conversas.
                  </td>
                </tr>
              ) : (
                [...myFeedbackRequests, ...myConversationRequests].map((req: any) => {
                  const isFb = 'topic' in req;
                  const subject = isFb ? req.topic : req.type;

                  return (
                    <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 pr-4 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <Badge variant={isFb ? 'indigo' : 'purple'} size="sm">
                            {isFb ? 'Feedback' : 'Conversa'}
                          </Badge>
                          <span>{subject}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{req.managerName}</td>
                      <td className="py-3 pr-4 font-mono text-slate-400">
                        {req.createdAt.split('T')[0]}
                      </td>
                      <td className="py-3 pr-4">{getStatusBadge(req.status)}</td>
                      <td className="py-3 text-slate-700 font-medium">
                        {req.scheduledDate ? (
                          <span className="text-emerald-600 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {req.scheduledDate}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">Aguardando gestor</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Solicitar Feedback (Prompt Section 11) */}
      <Modal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        title="Solicitar Feedback"
        subtitle="Peça um retorno estruturado sobre suas atividades e desenvolvimento"
        maxWidth="md"
      >
        <form onSubmit={handleSendFeedbackRequest} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Para quem? *</label>
            <select
              required
              value={feedbackForm.managerId}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, managerId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
            >
              <option value="">Selecione seu gestor...</option>
              {eligibleManagers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.positionName || 'Liderança'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Sobre o quê você gostaria de receber feedback? *
            </label>
            <select
              required
              value={feedbackForm.topic}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, topic: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
            >
              {FEEDBACK_TOPICS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Mensagem opcional</label>
            <textarea
              rows={3}
              placeholder='Ex: "Gostaria de receber um feedback sobre meu desempenho no atendimento e saber onde posso melhorar."'
              value={feedbackForm.message}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsFeedbackModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Enviar Solicitação
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Solicitar Conversa (Prompt Section 14) */}
      <Modal
        isOpen={isConversationModalOpen}
        onClose={() => setIsConversationModalOpen(false)}
        title="Solicitar Conversa"
        subtitle="Alinhe um momento com seu gestor para orientação ou alinhamento de carreira"
        maxWidth="md"
      >
        <form onSubmit={handleSendConversationRequest} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Para quem? *</label>
            <select
              required
              value={conversationForm.managerId}
              onChange={(e) =>
                setConversationForm({ ...conversationForm, managerId: e.target.value })
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
            >
              <option value="">Selecione seu gestor...</option>
              {eligibleManagers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.positionName || 'Liderança'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Tipo de Conversa *</label>
            <select
              required
              value={conversationForm.type}
              onChange={(e) =>
                setConversationForm({
                  ...conversationForm,
                  type: e.target.value as ConversationTopic,
                })
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
            >
              {CONVERSATION_TOPICS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Mensagem ou Motivo</label>
            <textarea
              rows={3}
              placeholder="Descreva brevemente o motivo da conversa..."
              value={conversationForm.message}
              onChange={(e) =>
                setConversationForm({ ...conversationForm, message: e.target.value })
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsConversationModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Enviar Pedido
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Agendar Conversa (Prompt Section 13 - Modal com data, horário, duração, local, observação -> cria reunião automaticamente!) */}
      {scheduleTarget && (
        <Modal
          isOpen={true}
          onClose={() => setScheduleTarget(null)}
          title="Agendar Conversa com Colaborador"
          subtitle={`Atendendo à solicitação de ${scheduleTarget.request.employeeName}`}
          maxWidth="md"
        >
          <form onSubmit={handleScheduleConversation} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Colaborador:</span>
                <span className="font-semibold text-slate-900">
                  {scheduleTarget.request.employeeName}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Assunto:</span>
                <span className="text-indigo-600 font-medium">
                  {scheduleTarget.request.topic || scheduleTarget.request.type}
                </span>
              </div>
              {scheduleTarget.request.message && (
                <p className="text-[11px] text-slate-500 italic pt-1">
                  "{scheduleTarget.request.message}"
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Data *</label>
                <input
                  type="date"
                  required
                  value={scheduleForm.date}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Horário *</label>
                <input
                  type="time"
                  required
                  value={scheduleForm.time}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Duração (minutos) *</label>
                <select
                  value={scheduleForm.durationMinutes}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, durationMinutes: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
                >
                  <option value={30}>30 minutos</option>
                  <option value={45}>45 minutos</option>
                  <option value={60}>60 minutos (1h)</option>
                  <option value={90}>90 minutos (1h30)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Local / Link *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Google Meet ou Sala 02"
                  value={scheduleForm.location}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, location: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Observações adicionais</label>
              <textarea
                rows={2}
                placeholder="Pauta prévia, links ou instruções para o colaborador..."
                value={scheduleForm.notes}
                onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setScheduleTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-xs flex items-center gap-1.5"
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                Confirmar e Criar Reunião
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Visualizar Solicitação */}
      {viewDetailsTarget && (
        <Modal
          isOpen={true}
          onClose={() => setViewDetailsTarget(null)}
          title="Detalhes da Solicitação"
          subtitle={`Enviada por ${viewDetailsTarget.request.employeeName}`}
          maxWidth="md"
        >
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500">Status atual:</span>
              {getStatusBadge(viewDetailsTarget.request.status)}
            </div>
            <div>
              <span className="text-slate-400 font-semibold block">Tema:</span>
              <p className="text-slate-900 text-sm font-medium mt-0.5">
                {viewDetailsTarget.request.topic || viewDetailsTarget.request.type}
              </p>
            </div>
            {viewDetailsTarget.request.message && (
              <div>
                <span className="text-slate-400 font-semibold block">Mensagem do Colaborador:</span>
                <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 mt-1 leading-relaxed">
                  {viewDetailsTarget.request.message}
                </p>
              </div>
            )}
            {viewDetailsTarget.request.scheduledDate && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <span className="text-emerald-700 font-semibold block">Reunião Agendada:</span>
                <span className="text-slate-800">{viewDetailsTarget.request.scheduledDate}</span>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
