import React, { useState } from 'react';
import {
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Search,
  Filter,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { FollowUp, FollowUpResult, FollowUpStatus } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { TODAY_ISO } from '../../lib/initialData';

const RESULTS: FollowUpResult[] = [
  'Melhorou',
  'Melhorou parcialmente',
  'Não apresentou evolução',
  'Objetivo atingido',
  'Necessita continuar acompanhamento',
];

interface FollowUpsViewProps {
  selectedFollowUpId?: string;
}

export const FollowUpsView: React.FC<FollowUpsViewProps> = ({ selectedFollowUpId }) => {
  const { currentUser, currentRole } = useAuth();
  const { followUps, completeFollowUp } = useAppData();

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFollowUpToComplete, setActiveFollowUpToComplete] = useState<FollowUp | null>(null);

  // Completion modal form
  const [result, setResult] = useState<FollowUpResult>('Melhorou');
  const [notes, setNotes] = useState('');
  const [createNext, setCreateNext] = useState(false);
  const [nextDate, setNextDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter according to role & search
  const visibleFollowUps = followUps.filter((fup) => {
    if (currentRole === 'employee' && fup.employeeId !== currentUser?.id) return false;
    if (currentRole === 'manager' && fup.managerId !== currentUser?.id) {
      // Manager sees what belongs to his team
    }

    if (filterStatus !== 'all' && fup.status !== filterStatus) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        fup.title.toLowerCase().includes(q) ||
        fup.employeeName.toLowerCase().includes(q) ||
        (fup.feedbackTitle && fup.feedbackTitle.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleOpenCompleteModal = (fup: FollowUp) => {
    setActiveFollowUpToComplete(fup);
    setResult('Melhorou');
    setNotes('');
    setCreateNext(false);
    setNextDate('');
  };

  const handleSaveCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFollowUpToComplete) return;

    if (createNext && !nextDate) {
      alert('Por favor, informe a data para o novo acompanhamento.');
      return;
    }

    setIsSubmitting(true);
    try {
      await completeFollowUp(
        activeFollowUpToComplete.id,
        result,
        notes,
        createNext,
        nextDate || undefined
      );
      setActiveFollowUpToComplete(null);
    } catch (err: any) {
      alert('Erro ao registrar acompanhamento: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeVariant = (status: FollowUpStatus) => {
    switch (status) {
      case 'Concluído':
        return 'emerald';
      case 'Hoje':
        return 'indigo';
      case 'Atrasado':
        return 'rose';
      case 'Próximo':
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
            <Sparkles className="w-5 h-5 text-indigo-600" />
            Módulo de Acompanhamentos
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Garante que os feedbacks e alinhamentos evoluam na prática com datas, avaliações e histórico.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por colaborador ou assunto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {['all', 'Hoje', 'Próximo', 'Atrasado', 'Concluído'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                filterStatus === st
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {st === 'all' ? 'Todos' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Acompanhamentos Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleFollowUps.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200 shadow-xs">
            Nenhum acompanhamento encontrado para este filtro.
          </div>
        ) : (
          visibleFollowUps.map((fup) => {
            const isCompleted = fup.status === 'Concluído';
            const badgeVariant = getStatusBadgeVariant(fup.status);

            return (
              <div
                key={fup.id}
                className={`p-5 bg-white rounded-xl border transition-all flex flex-col justify-between shadow-xs ${
                  fup.status === 'Hoje'
                    ? 'border-indigo-300 ring-2 ring-indigo-100'
                    : fup.status === 'Atrasado'
                    ? 'border-rose-300 ring-2 ring-rose-100'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant={badgeVariant} size="sm">
                      {fup.status}
                    </Badge>
                    <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {fup.scheduledDate}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900">{fup.employeeName}</h3>
                  <p className="text-xs text-indigo-600 font-medium mt-0.5">{fup.title}</p>

                  {fup.feedbackTitle && (
                    <p className="text-xs text-slate-500 mt-1">
                      Feedback relacionado:{' '}
                      <span className="text-slate-800 font-medium">{fup.feedbackTitle}</span>
                    </p>
                  )}

                  {fup.notes && (
                    <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 italic">
                      "{fup.notes}"
                    </p>
                  )}

                  {/* Outcome if completed */}
                  {isCompleted && fup.result && (
                    <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
                      <span className="text-emerald-700 block text-[10px] uppercase font-semibold">
                        Resultado Registrado:
                      </span>
                      <span className="font-semibold text-emerald-800">{fup.result}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Gestor: {fup.managerName}</span>

                  {currentRole !== 'employee' && !isCompleted ? (
                    <button
                      onClick={() => handleOpenCompleteModal(fup)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs flex items-center gap-1"
                    >
                      Realizar acompanhamento
                    </button>
                  ) : (
                    isCompleted && (
                      <span className="text-emerald-600 text-xs font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Concluído
                      </span>
                    )
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Realizar Acompanhamento (Prompt Section 8 requirement) */}
      {activeFollowUpToComplete && (
        <Modal
          isOpen={true}
          onClose={() => setActiveFollowUpToComplete(null)}
          title="Realizar Acompanhamento"
          subtitle={`Acompanhamento com ${activeFollowUpToComplete.employeeName} referente a "${activeFollowUpToComplete.title}"`}
          maxWidth="lg"
        >
          <form onSubmit={handleSaveCompletion} className="space-y-4 text-xs">
            {/* Context Card */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Data prevista:</span>
                <span className="font-mono text-slate-900 font-semibold">
                  {activeFollowUpToComplete.scheduledDate}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Colaborador:</span>
                <span className="text-slate-900 font-medium">
                  {activeFollowUpToComplete.employeeName}
                </span>
              </div>
            </div>

            {/* Resultado (Prompt Section 8 specification) */}
            <div>
              <label className="block text-slate-800 font-semibold mb-2">
                Resultado do Acompanhamento *
              </label>
              <div className="space-y-1.5">
                {RESULTS.map((r) => (
                  <label
                    key={r}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      result === r
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="followup_result"
                      value={r}
                      checked={result === r}
                      onChange={() => setResult(r)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{r}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Observações */}
            <div>
              <label className="block text-slate-800 font-semibold mb-1">
                Observações sobre a evolução *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Descreva o que mudou, como o colaborador se comportou e se o objetivo foi atingido..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
              />
            </div>

            {/* Criar novo acompanhamento? (Prompt Section 8 requirement) */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 block">
                    Criar novo acompanhamento?
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Se ainda for necessário continuar acompanhando a evolução deste ponto.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateNext(true)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      createNext
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateNext(false)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      !createNext
                        ? 'bg-slate-200 text-slate-800 font-semibold'
                        : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Não
                  </button>
                </div>
              </div>

              {createNext && (
                <div className="pt-2 border-t border-slate-200">
                  <label className="block text-slate-700 font-medium mb-1">
                    Nova data do acompanhamento *
                  </label>
                  <input
                    type="date"
                    required={createNext}
                    value={nextDate}
                    onChange={(e) => setNextDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveFollowUpToComplete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors shadow-xs"
              >
                {isSubmitting ? 'Salvando...' : 'Concluir Acompanhamento'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
