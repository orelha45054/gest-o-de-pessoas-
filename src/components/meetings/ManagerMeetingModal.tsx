import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Shield,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  CheckSquare,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { TODAY_ISO } from '../../lib/initialData';

interface ManagerMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (meetingId: string) => void;
}

export const ManagerMeetingModal: React.FC<ManagerMeetingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser, currentRole } = useAuth();
  const { users, departments, createMeeting } = useAppData();

  // Find all active managers
  const managers = users.filter((u) => u.role === 'manager' && u.active);

  // Selected managers list (defaults to all managers initially for convenience)
  const [selectedManagerIds, setSelectedManagerIds] = useState<string[]>(() =>
    managers.map((m) => m.id)
  );

  const [title, setTitle] = useState('Alinhamento Estratégico com Gerentes de Setor');
  const [date, setDate] = useState(TODAY_ISO);
  const [time, setTime] = useState('09:00');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [location, setLocation] = useState('Sala da Diretoria / Google Meet Executivo');
  const [objective, setObjective] = useState(
    'Alinhamento integrado de metas e prioridades entre os setores Comercial, Marketing e Site.'
  );
  const [agenda, setAgenda] = useState(
    `1. Indicadores gerais da empresa e metas do trimestre\n2. Status e gargalos do Site e infraestrutura\n3. Campanhas e geração de leads do Marketing\n4. Pipeline e fechamentos do Comercial\n5. Combinados e próximos passos da liderança`
  );
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Toggle single manager
  const handleToggleManager = (id: string) => {
    setSelectedManagerIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  // Select all managers
  const handleSelectAll = () => {
    setSelectedManagerIds(managers.map((m) => m.id));
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedManagerIds([]);
  };

  const getDepartmentBadgeVariant = (deptName?: string): 'indigo' | 'emerald' | 'purple' | 'amber' | 'blue' => {
    const lower = (deptName || '').toLowerCase();
    if (lower.includes('mkt') || lower.includes('marketing')) return 'purple';
    if (lower.includes('site') || lower.includes('web')) return 'blue';
    if (lower.includes('comercial') || lower.includes('vendas')) return 'emerald';
    if (lower.includes('finan')) return 'amber';
    return 'indigo';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Por favor, informe o título da reunião.');
      return;
    }

    if (selectedManagerIds.length === 0) {
      setErrorMsg('Selecione pelo menos um gerente para participar da reunião.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      // Split agenda text into item array
      const agendaItems = agenda
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      const allParticipantIds = Array.from(
        new Set([currentUser?.id || 'usr-admin', ...selectedManagerIds])
      );

      const meetingId = await createMeeting({
        title: title.trim(),
        description: objective.trim(),
        date,
        time,
        durationMinutes: Number(durationMinutes),
        location: location.trim(),
        type: 'Reunião com Gerentes',
        targetType: 'selected',
        targetParticipantIds: allParticipantIds,
        recurrence: 'none',
        agendaItems,
        notes: notes.trim(),
        organizerId: currentUser?.id || 'usr-admin',
        organizerName: `${currentUser?.name || 'Matheus Manfroi'} (Gerente Geral)`,
      });

      setIsSubmitting(false);
      onSuccess?.(meetingId);
      onClose();
    } catch (err: any) {
      console.error('Erro ao agendar reunião com gerentes:', err);
      setErrorMsg(err.message || 'Falha ao agendar a reunião. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reunião com Gerentes de Setor"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Header Notice Banner */}
        <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 shrink-0 mt-0.5">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-800 uppercase tracking-wide">
                Exclusivo do Gerente Geral
              </span>
              <Badge variant="purple" size="sm">Liderança Executiva</Badge>
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Como Gerente Geral, você pode convocar todos os gerentes da empresa ou escolher
              especificamente quais gerentes de setor (Comercial, Marketing, Site)
              farão parte deste alinhamento.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Gerentes Participantes Selector */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Escolha os Gerentes Participantes</span>
              <span className="text-xs font-normal text-slate-500">
                ({selectedManagerIds.length} de {managers.length} selecionados)
              </span>
            </label>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors border border-slate-200"
              >
                Selecionar Todos
              </button>
              <button
                type="button"
                onClick={handleClearSelection}
                className="px-2.5 py-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
              >
                Limpar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {managers.map((mgr) => {
              const isSelected = selectedManagerIds.includes(mgr.id);
              const badgeVariant = getDepartmentBadgeVariant(mgr.departmentName);

              return (
                <div
                  key={mgr.id}
                  onClick={() => handleToggleManager(mgr.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2.5 select-none ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-400 shadow-xs ring-1 ring-indigo-400'
                      : 'bg-white border-slate-200 hover:border-slate-300 opacity-80'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      {mgr.avatarUrl ? (
                        <img
                          src={mgr.avatarUrl}
                          alt={mgr.name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-indigo-100 border border-indigo-300 flex items-center justify-center font-bold text-xs text-indigo-700">
                          {mgr.name.charAt(0)}
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{mgr.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{mgr.positionName}</p>
                      <div className="mt-1">
                        <Badge variant={badgeVariant as any} size="sm">
                          Setor {mgr.departmentName}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}} // handled by parent div
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 bg-white cursor-pointer shrink-0"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Meeting Information */}
        <div className="space-y-3 pt-2 border-t border-slate-200">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Título da Reunião *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              placeholder="Ex: Alinhamento Estratégico com Gerentes de Setor"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Data *
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Horário *
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Duração
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>60 minutos (1h)</option>
                <option value={90}>90 minutos (1h30)</option>
                <option value={120}>120 minutos (2h)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Local ou Link da Videochamada *
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                placeholder="Ex: Sala da Diretoria ou Google Meet"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Objetivo da Reunião
            </label>
            <input
              type="text"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              placeholder="Ex: Alinhar metas prioritárias e integração entre setores"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Pauta da Reunião (um tópico por linha)
            </label>
            <textarea
              rows={4}
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
              placeholder="1. Tópico A&#10;2. Tópico B"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || selectedManagerIds.length === 0}
            className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Convocando Gerentes...</span>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>Agendar com {selectedManagerIds.length} Gerente{selectedManagerIds.length > 1 ? 's' : ''}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
