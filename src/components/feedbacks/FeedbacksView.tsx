import React, { useState } from 'react';
import {
  MessageSquareQuote,
  Plus,
  Calendar,
  User,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  Eye,
  FileText,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { Feedback, FeedbackType } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { TODAY_ISO } from '../../lib/initialData';

const FEEDBACK_TYPES: FeedbackType[] = [
  'Feedback positivo',
  'Ponto de melhoria',
  'Desempenho',
  'Comportamento',
  'Desenvolvimento',
  'Projeto específico',
  'Produtividade',
  'Atendimento',
  'Outro',
];

const FOLLOW_UP_OPTIONS = [
  '7 dias',
  '15 dias',
  '30 dias',
  '60 dias',
  '90 dias',
  'data personalizada',
];

export const FeedbacksView: React.FC = () => {
  const { currentUser, currentRole } = useAuth();
  const { users, departments, feedbacks, addFeedback, followUps, selfEvaluations } = useAppData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [isNewFeedbackOpen, setIsNewFeedbackOpen] = useState(false);
  const [selectedFeedbackDetails, setSelectedFeedbackDetails] = useState<Feedback | null>(null);

  // New feedback form state
  const [formData, setFormData] = useState({
    employeeId: '',
    date: TODAY_ISO,
    type: 'Desempenho' as FeedbackType,
    category: '',
    title: '',
    description: '',
    positivePoints: '',
    improvementPoints: '',
    agreements: '',
    notes: '',
    needsFollowUp: true,
    followUpDaysOption: '30 dias',
    customFollowUpDate: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Eligible employees:
  // - Manager: ONLY employees belonging to their department
  // - Admin: all active users except self
  const eligibleEmployees = users.filter((u) => {
    if (!u.active) return false;
    if (currentRole === 'admin') return u.id !== currentUser?.id;
    return (
      u.role === 'employee' &&
      (u.departmentId === currentUser?.departmentId ||
        u.departmentName?.toLowerCase() === currentUser?.departmentName?.toLowerCase())
    );
  });

  // Filter feedbacks by role & search
  const visibleFeedbacks = feedbacks.filter((fb) => {
    // Permission isolation:
    if (currentRole === 'employee') {
      if (fb.employeeId !== currentUser?.id) return false;
    } else if (currentRole === 'manager') {
      const isTeam = eligibleEmployees.some((e) => e.id === fb.employeeId);
      if (fb.managerId !== currentUser?.id && !isTeam) return false;
    } else if (currentRole === 'admin') {
      if (selectedSector !== 'all') {
        const targetEmp = users.find((u) => u.id === fb.employeeId);
        if (targetEmp?.departmentId !== selectedSector) return false;
      }
    }

    if (selectedType !== 'all' && fb.type !== selectedType) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        fb.title.toLowerCase().includes(q) ||
        fb.employeeName.toLowerCase().includes(q) ||
        fb.category.toLowerCase().includes(q) ||
        fb.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.title || !formData.description) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const employee = users.find((u) => u.id === formData.employeeId);
    if (!employee) return;

    setIsSubmitting(true);
    try {
      let finalFollowUpDate = undefined;
      if (formData.needsFollowUp) {
        if (formData.followUpDaysOption === 'data personalizada') {
          finalFollowUpDate = formData.customFollowUpDate;
        } else {
          const days = parseInt(formData.followUpDaysOption.match(/\d+/)?.[0] || '30', 10);
          const d = new Date(formData.date);
          d.setDate(d.getDate() + days);
          finalFollowUpDate = d.toISOString().split('T')[0];
        }
      }

      await addFeedback({
        employeeId: employee.id,
        employeeName: employee.name,
        managerId: currentUser?.id || 'gestor',
        managerName: currentUser?.name || 'Gestor',
        date: formData.date,
        type: formData.type,
        category: formData.category || formData.type,
        title: formData.title,
        description: formData.description,
        positivePoints: formData.positivePoints,
        improvementPoints: formData.improvementPoints,
        agreements: formData.agreements,
        notes: formData.notes,
        needsFollowUp: formData.needsFollowUp,
        followUpDaysOption: formData.followUpDaysOption,
        followUpDate: finalFollowUpDate,
      });

      setIsNewFeedbackOpen(false);
      // Reset form
      setFormData({
        employeeId: '',
        date: TODAY_ISO,
        type: 'Desempenho',
        category: '',
        title: '',
        description: '',
        positivePoints: '',
        improvementPoints: '',
        agreements: '',
        notes: '',
        needsFollowUp: true,
        followUpDaysOption: '30 dias',
        customFollowUpDate: '',
      });
    } catch (err: any) {
      console.error(err);
      alert('Erro ao registrar feedback: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquareQuote className="w-5 h-5 text-indigo-600" />
            Módulo de Feedbacks
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {currentRole === 'employee'
              ? 'Visualize os feedbacks registrados pela sua liderança e acompanhe seus combinados.'
              : 'Registre conversas estruturadas, pontos fortes, melhorias e acompanhamentos futuros com a equipe.'}
          </p>
        </div>

        {/* Action Button for Managers / Admins */}
        {currentRole !== 'employee' && (
          <button
            onClick={() => setIsNewFeedbackOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs flex items-center justify-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Novo Feedback
          </button>
        )}
      </div>

      {/* Admin Sector Filter Tabs */}
      {currentRole === 'admin' && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setSelectedSector('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors ${
              selectedSector === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors ${
                selectedSector === d.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <span>Setor {d.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por título, colaborador ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-500"
          >
            <option value="all">Todos os tipos</option>
            {FEEDBACK_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Feedbacks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleFeedbacks.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
            Nenhum feedback encontrado para os filtros selecionados.
          </div>
        ) : (
          visibleFeedbacks.map((fb) => {
            const hasFollowUp = fb.needsFollowUp;
            return (
              <div
                key={fb.id}
                onClick={() => setSelectedFeedbackDetails(fb)}
                className="p-5 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between group shadow-xs hover:shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant={fb.type === 'Feedback positivo' ? 'emerald' : 'indigo'} size="sm">
                      {fb.type}
                    </Badge>
                    <span className="text-[11px] font-mono text-slate-500">{fb.date}</span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {fb.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {fb.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center justify-between">
                      <span>Colaborador:</span>
                      <span className="font-semibold text-slate-800">{fb.employeeName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Gestor:</span>
                      <span className="text-slate-700">{fb.managerName}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  {hasFollowUp ? (
                    <span className="text-amber-700 flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3 text-amber-600" />
                      Acompanhamento: {fb.followUpDate || 'Agendado'}
                    </span>
                  ) : (
                    <span className="text-slate-400">Sem acompanhamento</span>
                  )}
                  <span className="text-indigo-600 font-medium flex items-center gap-0.5 group-hover:underline">
                    Ver detalhes →
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Detalhes do Feedback */}
      {selectedFeedbackDetails && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedFeedbackDetails(null)}
          title={selectedFeedbackDetails.title}
          subtitle={`Registrado em ${selectedFeedbackDetails.date} por ${selectedFeedbackDetails.managerName}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200">
              <Badge variant="indigo">{selectedFeedbackDetails.type}</Badge>
              <Badge variant="zinc">{selectedFeedbackDetails.category}</Badge>
              <span className="text-slate-500 ml-auto">
                Colaborador: <strong className="text-slate-800">{selectedFeedbackDetails.employeeName}</strong>
              </span>
            </div>

            <div>
              <h4 className="font-semibold text-slate-700 mb-1">Descrição Geral</h4>
              <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                {selectedFeedbackDetails.description}
              </p>
            </div>

            {selectedFeedbackDetails.positivePoints && (
              <div>
                <h4 className="font-semibold text-emerald-700 mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Pontos Positivos
                </h4>
                <p className="text-slate-700 bg-emerald-50/70 border border-emerald-200 p-3 rounded-lg leading-relaxed">
                  {selectedFeedbackDetails.positivePoints}
                </p>
              </div>
            )}

            {selectedFeedbackDetails.improvementPoints && (
              <div>
                <h4 className="font-semibold text-amber-700 mb-1">Pontos de Melhoria</h4>
                <p className="text-slate-700 bg-amber-50/70 border border-amber-200 p-3 rounded-lg leading-relaxed">
                  {selectedFeedbackDetails.improvementPoints}
                </p>
              </div>
            )}

            {selectedFeedbackDetails.agreements && (
              <div>
                <h4 className="font-semibold text-indigo-700 mb-1">Combinados & Próximos Passos</h4>
                <p className="text-slate-700 bg-indigo-50/70 border border-indigo-200 p-3 rounded-lg leading-relaxed">
                  {selectedFeedbackDetails.agreements}
                </p>
              </div>
            )}

            {selectedFeedbackDetails.notes && (
              <div>
                <h4 className="font-semibold text-slate-500 mb-1">Observações Confidenciais</h4>
                <p className="text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  {selectedFeedbackDetails.notes}
                </p>
              </div>
            )}

            {selectedFeedbackDetails.needsFollowUp && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 block">
                    Acompanhamento Programado
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Intervalo definido: {selectedFeedbackDetails.followUpDaysOption || 'Configurado'}
                  </span>
                </div>
                <Badge variant="amber">
                  Data: {selectedFeedbackDetails.followUpDate}
                </Badge>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Modal: Novo Feedback (Prompt Section 7) */}
      <Modal
        isOpen={isNewFeedbackOpen}
        onClose={() => setIsNewFeedbackOpen(false)}
        title="Registrar Novo Feedback"
        subtitle="Conversa estruturada para acompanhamento contínuo da equipe"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Funcionário */}
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Funcionário *
              </label>
              <select
                required
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Selecione o colaborador...</option>
                {eligibleEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.positionName || emp.departmentName})
                  </option>
                ))}
              </select>
            </div>

            {/* Data */}
            <div>
              <label className="block text-slate-700 font-medium mb-1">Data *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tipo */}
            <div>
              <label className="block text-slate-700 font-medium mb-1">Tipo de Feedback *</label>
              <select
                required
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as FeedbackType })
                }
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                {FEEDBACK_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-slate-700 font-medium mb-1">Categoria / Tema</label>
              <input
                type="text"
                placeholder="Ex: Atendimento ao cliente, Design System..."
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Título */}
          <div>
            <label className="block text-slate-700 font-medium mb-1">Título do Feedback *</label>
            <input
              type="text"
              required
              placeholder="Ex: Feedback sobre pontualidade e entregas de setembro"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-slate-700 font-medium mb-1">Descrição Detalhada *</label>
            <textarea
              required
              rows={3}
              placeholder="Contexto da conversa, motivos e temas abordados..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Pontos Positivos */}
          <div>
            <label className="block text-emerald-700 font-medium mb-1">Pontos Positivos</label>
            <textarea
              rows={2}
              placeholder="O que o funcionário fez muito bem, elogios e destaques..."
              value={formData.positivePoints}
              onChange={(e) => setFormData({ ...formData, positivePoints: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Pontos de Melhoria */}
          <div>
            <label className="block text-amber-700 font-medium mb-1">Pontos de Melhoria</label>
            <textarea
              rows={2}
              placeholder="Oportunidades de evolução e ajustes necessários..."
              value={formData.improvementPoints}
              onChange={(e) => setFormData({ ...formData, improvementPoints: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Combinados */}
          <div>
            <label className="block text-indigo-700 font-medium mb-1">Combinados e Ações</label>
            <textarea
              rows={2}
              placeholder="Quais compromissos foram estabelecidos durante o alinhamento?"
              value={formData.agreements}
              onChange={(e) => setFormData({ ...formData, agreements: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Observações */}
          <div>
            <label className="block text-slate-600 font-medium mb-1">Observações adicionais</label>
            <input
              type="text"
              placeholder="Notas internas do gestor..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Precisa de acompanhamento? (Prompt Section 7 requirement) */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800 block">
                  Precisa de acompanhamento futuro?
                </span>
                <span className="text-[11px] text-slate-500">
                  Gera automaticamente um item no módulo de Acompanhamentos e lembretes no dashboard.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, needsFollowUp: true })}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    formData.needsFollowUp
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, needsFollowUp: false })}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    !formData.needsFollowUp
                      ? 'bg-slate-800 text-white'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  Não
                </button>
              </div>
            </div>

            {formData.needsFollowUp && (
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <label className="block text-slate-700 font-medium">
                  Próximo acompanhamento:
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {FOLLOW_UP_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setFormData({ ...formData, followUpDaysOption: opt })}
                      className={`px-2 py-1.5 rounded-lg text-xs font-medium border text-center transition-all ${
                        formData.followUpDaysOption === opt
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-semibold'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {formData.followUpDaysOption === 'data personalizada' && (
                  <div className="mt-2">
                    <label className="block text-slate-600 text-[11px] mb-1">
                      Escolha a data do acompanhamento:
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.customFollowUpDate}
                      onChange={(e) =>
                        setFormData({ ...formData, customFollowUpDate: e.target.value })
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsNewFeedbackOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors border border-slate-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors shadow-xs"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Feedback'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
