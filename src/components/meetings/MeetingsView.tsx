import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  FileText,
  CheckSquare,
  AlertCircle,
  ExternalLink,
  Shield,
  Building2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { Meeting, MeetingType, MeetingTargetType, TaskPriority } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { TODAY_ISO } from '../../lib/initialData';
import { ManagerMeetingModal } from './ManagerMeetingModal';

const MEETING_TYPES: MeetingType[] = [
  '1:1 (One on One)',
  'Alinhamento',
  'Reunião com Gerentes',
  'Reunião de Setor',
  'Feedback',
  'Reunião de equipe',
  'Planejamento',
  'Acompanhamento de metas',
  'Outro',
];

interface MeetingsViewProps {
  selectedMeetingId?: string;
}

export const MeetingsView: React.FC<MeetingsViewProps> = ({ selectedMeetingId }) => {
  const { currentUser, currentRole } = useAuth();
  const {
    users,
    departments,
    meetings,
    addMeeting,
    updateMeetingAta,
    createTask,
    updateMeetingRsvp,
  } = useAppData();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [isNewMeetingOpen, setIsNewMeetingOpen] = useState(false);
  const [isManagerMeetingOpen, setIsManagerMeetingOpen] = useState(false);
  const [activeMeetingDetails, setActiveMeetingDetails] = useState<Meeting | null>(null);

  // New Meeting Form
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    date: TODAY_ISO,
    time: '10:00',
    durationMinutes: 45,
    type: '1:1 (One on One)' as MeetingType,
    targetType: 'individual' as MeetingTargetType,
    targetParticipantIds: [] as string[],
    targetDepartmentId: '',
    objective: '',
    agenda: '',
    location: 'Sala de Reunião 1 / Online',
    notes: '',
  });

  // Ata / Próximos Passos Form in Meeting Details
  const [editingAta, setEditingAta] = useState(false);
  const [ataData, setAtaData] = useState({
    summary: '',
    decisions: '',
    agreements: '',
    nextSteps: '',
  });

  // Inline task generation from meeting (Prompt Section 10 & Fluxo 3)
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskData, setNewTaskData] = useState({
    title: '',
    description: '',
    assigneeId: '',
    dueDate: TODAY_ISO,
    priority: 'Média' as TaskPriority,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter meetings user is authorized to see
  const visibleMeetings = meetings.filter((m) => {
    // 1. Employee Isolation: only company-wide, their department, or where they are a participant/organizer
    if (currentRole === 'employee') {
      const isCompany = m.targetType === 'company';
      const isMyDept =
        m.targetType === 'department' &&
        (m.targetDepartmentId === currentUser?.departmentId ||
          m.targetDepartmentName?.toLowerCase() === currentUser?.departmentName?.toLowerCase());
      const isParticipant =
        m.targetParticipantIds?.includes(currentUser?.id || '') || m.organizerId === currentUser?.id;
      if (!isCompany && !isMyDept && !isParticipant) return false;
    }

    // 2. Manager Isolation:
    // Manager has access to:
    // - company meetings
    // - meetings of their department
    // - meetings where they are a participant or organizer (e.g., manager meetings with Admin or 1:1 with team members)
    // CANNOT see private meetings of other departments!
    if (currentRole === 'manager') {
      const isCompany = m.targetType === 'company';
      const isMyDept =
        m.targetType === 'department' &&
        (m.targetDepartmentId === currentUser?.departmentId ||
          m.targetDepartmentName?.toLowerCase() === currentUser?.departmentName?.toLowerCase());
      const isParticipant =
        m.targetParticipantIds?.includes(currentUser?.id || '') || m.organizerId === currentUser?.id;
      if (!isCompany && !isMyDept && !isParticipant) return false;
    }

    // 3. Admin Sector Filtering (Admin is Gerente Geral and sees all, but can filter by sector)
    if (currentRole === 'admin') {
      if (selectedSector === 'managers') {
        if (m.type !== 'Reunião com Gerentes') return false;
      } else if (selectedSector !== 'all') {
        const matchesDept =
          m.targetDepartmentId === selectedSector ||
          m.targetDepartmentName?.toLowerCase() ===
            departments.find((d) => d.id === selectedSector)?.name?.toLowerCase();
        const hasParticipantInDept = users
          .filter((u) => u.departmentId === selectedSector)
          .some((u) => m.targetParticipantIds?.includes(u.id));
        if (!matchesDept && !hasParticipantInDept) return false;
      }
    }

    if (filterType !== 'all' && m.type !== filterType) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        m.title.toLowerCase().includes(q) ||
        m.location.toLowerCase().includes(q) ||
        (m.objective && m.objective.toLowerCase().includes(q)) ||
        m.organizerName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenDetails = (m: Meeting) => {
    setActiveMeetingDetails(m);
    setAtaData({
      summary: m.ataSummary || '',
      decisions: m.decisions || '',
      agreements: m.agreements || '',
      nextSteps: m.nextSteps || '',
    });
    setEditingAta(false);
    setIsAddingTask(false);
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeeting.title) {
      alert('Informe o título da reunião.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addMeeting({
        title: newMeeting.title,
        date: newMeeting.date,
        time: newMeeting.time,
        durationMinutes: Number(newMeeting.durationMinutes),
        type: newMeeting.type,
        targetType: newMeeting.targetType,
        targetParticipantIds: newMeeting.targetParticipantIds,
        targetDepartmentId: newMeeting.targetDepartmentId || undefined,
        objective: newMeeting.objective,
        agenda: newMeeting.agenda,
        location: newMeeting.location,
        notes: newMeeting.notes,
        organizerId: currentUser?.id || 'usr-rafael',
        organizerName: currentUser?.name || 'Gestor',
      });

      setIsNewMeetingOpen(false);
      setNewMeeting({
        title: '',
        date: TODAY_ISO,
        time: '10:00',
        durationMinutes: 45,
        type: '1:1 (One on One)',
        targetType: 'individual',
        targetParticipantIds: [],
        targetDepartmentId: '',
        objective: '',
        agenda: '',
        location: 'Sala de Reunião 1 / Online',
        notes: '',
      });
    } catch (err: any) {
      alert('Erro ao agendar reunião: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAta = async () => {
    if (!activeMeetingDetails) return;
    setIsSubmitting(true);
    try {
      await updateMeetingAta(activeMeetingDetails.id, {
        ataSummary: ataData.summary,
        decisions: ataData.decisions,
        agreements: ataData.agreements,
        nextSteps: ataData.nextSteps,
      });
      setActiveMeetingDetails({
        ...activeMeetingDetails,
        ataSummary: ataData.summary,
        decisions: ataData.decisions,
        agreements: ataData.agreements,
        nextSteps: ataData.nextSteps,
      });
      setEditingAta(false);
    } catch (err: any) {
      alert('Erro ao salvar ata: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // FLUXO 3: Create Task directly from Meeting
  const handleGenerateTaskFromMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMeetingDetails || !newTaskData.title || !newTaskData.assigneeId) {
      alert('Informe o título e o responsável pela tarefa.');
      return;
    }

    const assignee = users.find((u) => u.id === newTaskData.assigneeId);
    if (!assignee) return;

    setIsSubmitting(true);
    try {
      await createTask({
        title: newTaskData.title,
        description: newTaskData.description,
        assigneeId: assignee.id,
        assigneeName: assignee.name,
        creatorId: currentUser?.id || 'gestor',
        creatorName: currentUser?.name || 'Gestor',
        originType: 'meeting',
        originId: activeMeetingDetails.id,
        originTitle: `Reunião: ${activeMeetingDetails.title} (${activeMeetingDetails.date})`,
        priority: newTaskData.priority,
        dueDate: newTaskData.dueDate,
        status: 'Pendente',
      });

      setIsAddingTask(false);
      setNewTaskData({
        title: '',
        description: '',
        assigneeId: '',
        dueDate: TODAY_ISO,
        priority: 'Média',
      });
      alert('Tarefa criada com sucesso e adicionada ao painel do colaborador!');
    } catch (err: any) {
      alert('Erro ao criar tarefa: ' + err.message);
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
            <Users className="w-5 h-5 text-indigo-600" />
            Módulo de Reuniões & Atas
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Planejamento de 1:1, alinhamentos de equipe, registro de atas, decisões tomadas e geração de tarefas.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          {currentRole === 'admin' && (
            <button
              onClick={() => setIsManagerMeetingOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0"
              title="Convocar reunião com os gerentes de setor"
            >
              <Shield className="w-4 h-4" />
              <span>Reunião com Gerentes</span>
            </button>
          )}

          <button
            onClick={() => setIsNewMeetingOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs flex items-center justify-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Nova Reunião
          </button>
        </div>
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
          <button
            onClick={() => setSelectedSector('managers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors ${
              selectedSector === 'managers'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-purple-600" />
            <span>Reuniões com Gerentes</span>
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar reuniões por título, pauta ou organizador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-500"
          >
            <option value="all">Todos os tipos</option>
            {MEETING_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Meetings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleMeetings.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
            Nenhuma reunião encontrada.
          </div>
        ) : (
          visibleMeetings.map((m) => {
            const isToday = m.date === TODAY_ISO;

            return (
              <div
                key={m.id}
                onClick={() => handleOpenDetails(m)}
                className={`p-5 bg-white rounded-xl border transition-all cursor-pointer flex flex-col justify-between group shadow-xs hover:shadow-sm ${
                  isToday ? 'border-indigo-400 bg-indigo-50/20' : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    {m.type === 'Reunião com Gerentes' ? (
                      <Badge variant="purple" size="sm">
                        <Shield className="w-3 h-3 mr-1 inline" />
                        Reunião com Gerentes
                      </Badge>
                    ) : (
                      <Badge variant={m.type === '1:1 (One on One)' ? 'indigo' : 'zinc'} size="sm">
                        {m.type}
                      </Badge>
                    )}
                    <span className="text-xs font-mono font-medium text-slate-600 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {m.time} ({m.durationMinutes} min)
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {m.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {m.objective || m.agenda || 'Sem pauta definida.'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono text-slate-700">{m.date}</span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate text-slate-700">{m.location}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 truncate">Org: {m.organizerName}</span>
                  <span className="text-indigo-600 font-medium flex items-center gap-0.5 group-hover:underline shrink-0">
                    Ata & Decisões →
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Detalhes da Reunião com ATA E PRÓXIMOS PASSOS (Prompt Section 10 & Fluxo 3) */}
      {activeMeetingDetails && (
        <Modal
          isOpen={true}
          onClose={() => setActiveMeetingDetails(null)}
          title={activeMeetingDetails.title}
          subtitle={`${activeMeetingDetails.date} às ${activeMeetingDetails.time} (${activeMeetingDetails.durationMinutes} min) • ${activeMeetingDetails.location}`}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs">
            {/* Header info & RSVP */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <Badge variant="indigo">{activeMeetingDetails.type}</Badge>
                <span className="text-slate-600">
                  Organizador: <strong className="text-slate-900">{activeMeetingDetails.organizerName}</strong>
                </span>
              </div>

              {/* RSVP Actions for User */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 text-[11px] mr-1">Sua presença:</span>
                <button
                  onClick={() =>
                    updateMeetingRsvp(activeMeetingDetails.id, currentUser?.id || '', 'confirmed')
                  }
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    activeMeetingDetails.rsvp?.[currentUser?.id || ''] === 'confirmed'
                      ? 'bg-emerald-600 text-white font-semibold'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  Confirmar
                </button>
                <button
                  onClick={() =>
                    updateMeetingRsvp(activeMeetingDetails.id, currentUser?.id || '', 'declined')
                  }
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    activeMeetingDetails.rsvp?.[currentUser?.id || ''] === 'declined'
                      ? 'bg-rose-600 text-white font-semibold'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  Recusar
                </button>
              </div>
            </div>

            {/* Objetivo & Pauta prévia */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-600 font-semibold block mb-1">Objetivo da Reunião</span>
                <p className="text-slate-800 leading-relaxed">
                  {activeMeetingDetails.objective || 'Nenhum objetivo registrado.'}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-600 font-semibold block mb-1">Pauta Prévia</span>
                <p className="text-slate-800 leading-relaxed">
                  {activeMeetingDetails.agenda || 'Nenhuma pauta prévia.'}
                </p>
              </div>
            </div>

            {/* SEÇÃO DA ATA (Prompt Section 10: resumo, decisões tomadas, combinados, próximos passos) */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-sm font-semibold text-slate-900">
                    Ata da Reunião & Decisões Tomadas
                  </h4>
                </div>
                {currentRole !== 'employee' && (
                  <button
                    onClick={() => setEditingAta(!editingAta)}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    {editingAta ? 'Cancelar Edição' : 'Editar Ata'}
                  </button>
                )}
              </div>

              {editingAta ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">
                      Resumo da Reunião
                    </label>
                    <textarea
                      rows={3}
                      value={ataData.summary}
                      onChange={(e) => setAtaData({ ...ataData, summary: e.target.value })}
                      placeholder="Resumo dos tópicos discutidos..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-emerald-700 font-medium mb-1">
                      Decisões Tomadas
                    </label>
                    <textarea
                      rows={2}
                      value={ataData.decisions}
                      onChange={(e) => setAtaData({ ...ataData, decisions: e.target.value })}
                      placeholder="Quais decisões foram aprovadas?"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-indigo-700 font-medium mb-1">Combinados</label>
                    <textarea
                      rows={2}
                      value={ataData.agreements}
                      onChange={(e) => setAtaData({ ...ataData, agreements: e.target.value })}
                      placeholder="Combinados entre as partes..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-amber-700 font-medium mb-1">Próximos Passos</label>
                    <textarea
                      rows={2}
                      value={ataData.nextSteps}
                      onChange={(e) => setAtaData({ ...ataData, nextSteps: e.target.value })}
                      placeholder="Próximas etapas do projeto..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    onClick={handleSaveAta}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-xs"
                  >
                    Salvar Ata Oficial
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <span className="text-slate-500 font-semibold block">Resumo:</span>
                    <p className="text-slate-800 leading-relaxed mt-0.5">
                      {activeMeetingDetails.ataSummary || (
                        <span className="italic text-slate-400">Ata ainda não preenchida.</span>
                      )}
                    </p>
                  </div>

                  {activeMeetingDetails.decisions && (
                    <div>
                      <span className="text-emerald-700 font-semibold block">
                        Decisões Tomadas:
                      </span>
                      <p className="text-slate-800 leading-relaxed mt-0.5">
                        {activeMeetingDetails.decisions}
                      </p>
                    </div>
                  )}

                  {activeMeetingDetails.agreements && (
                    <div>
                      <span className="text-indigo-700 font-semibold block">Combinados:</span>
                      <p className="text-slate-800 leading-relaxed mt-0.5">
                        {activeMeetingDetails.agreements}
                      </p>
                    </div>
                  )}

                  {activeMeetingDetails.nextSteps && (
                    <div>
                      <span className="text-amber-700 font-semibold block">Próximos Passos:</span>
                      <p className="text-slate-800 leading-relaxed mt-0.5">
                        {activeMeetingDetails.nextSteps}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SEÇÃO: GERAR TAREFAS DA REUNIÃO (Prompt Section 10 & Fluxo 3) */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                    Gerar Tarefas da Reunião
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Transforme decisões e combinados diretamente em tarefas atribuídas na tela do colaborador.
                  </p>
                </div>

                {!isAddingTask && currentRole !== 'employee' && (
                  <button
                    onClick={() => setIsAddingTask(true)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition-colors flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Criar Tarefa
                  </button>
                )}
              </div>

              {isAddingTask && (
                <form
                  onSubmit={handleGenerateTaskFromMeeting}
                  className="pt-3 border-t border-slate-200 space-y-3"
                >
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">
                      Título da Tarefa / Ação *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Entregar proposta revisada para o cliente X"
                      value={newTaskData.title}
                      onChange={(e) =>
                        setNewTaskData({ ...newTaskData, title: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">
                        Responsável *
                      </label>
                      <select
                        required
                        value={newTaskData.assigneeId}
                        onChange={(e) =>
                          setNewTaskData({ ...newTaskData, assigneeId: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">Selecione...</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.departmentName})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Prazo *</label>
                      <input
                        type="date"
                        required
                        value={newTaskData.dueDate}
                        onChange={(e) =>
                          setNewTaskData({ ...newTaskData, dueDate: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">
                        Prioridade *
                      </label>
                      <select
                        value={newTaskData.priority}
                        onChange={(e) =>
                          setNewTaskData({
                            ...newTaskData,
                            priority: e.target.value as TaskPriority,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Baixa">Baixa</option>
                        <option value="Média">Média</option>
                        <option value="Alta">Alta</option>
                        <option value="Urgente">Urgente</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">
                      Instruções detalhadas
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Detalhes adicionais sobre como realizar a tarefa..."
                      value={newTaskData.description}
                      onChange={(e) =>
                        setNewTaskData({ ...newTaskData, description: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingTask(false)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-xs"
                    >
                      Criar Tarefa
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Nova Reunião (Prompt Section 9) */}
      <Modal
        isOpen={isNewMeetingOpen}
        onClose={() => setIsNewMeetingOpen(false)}
        title="Agendar Nova Reunião"
        subtitle="Crie alinhamentos 1:1, reuniões de equipe ou alinhamentos estratégicos"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateMeeting} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Título da Reunião *</label>
            <input
              type="text"
              required
              placeholder="Ex: Alinhamento de Metas Q3 com João"
              value={newMeeting.title}
              onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Data *</label>
              <input
                type="date"
                required
                value={newMeeting.date}
                onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Horário *</label>
              <input
                type="time"
                required
                value={newMeeting.time}
                onChange={(e) => setNewMeeting({ ...newMeeting, time: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Duração (minutos) *</label>
              <select
                value={newMeeting.durationMinutes}
                onChange={(e) =>
                  setNewMeeting({ ...newMeeting, durationMinutes: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                <option value={15}>15 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>60 minutos (1h)</option>
                <option value={90}>90 minutos (1h30)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Tipo de Reunião *</label>
              <select
                value={newMeeting.type}
                onChange={(e) =>
                  setNewMeeting({ ...newMeeting, type: e.target.value as MeetingType })
                }
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                {MEETING_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Quem pode participar? * (Prompt Section 9)
              </label>
              <select
                value={newMeeting.targetType}
                onChange={(e) =>
                  setNewMeeting({
                    ...newMeeting,
                    targetType: e.target.value as MeetingTargetType,
                  })
                }
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                <option value="individual">Individual (um funcionário específico)</option>
                <option value="department">Setor inteiro</option>
                <option value="company">Toda a empresa</option>
              </select>
            </div>
          </div>

          {/* Conditional target selector */}
          {newMeeting.targetType === 'individual' && (
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Participante Individual *
              </label>
              <select
                required
                value={newMeeting.targetParticipantIds[0] || ''}
                onChange={(e) =>
                  setNewMeeting({ ...newMeeting, targetParticipantIds: [e.target.value] })
                }
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Selecione o colaborador...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.positionName || u.departmentName})
                  </option>
                ))}
              </select>
            </div>
          )}

          {newMeeting.targetType === 'department' && (
            <div>
              <label className="block text-slate-700 font-medium mb-1">Setor / Departamento *</label>
              <select
                required
                value={newMeeting.targetDepartmentId}
                onChange={(e) =>
                  setNewMeeting({ ...newMeeting, targetDepartmentId: e.target.value })
                }
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Selecione o departamento...</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-medium mb-1">Local físico ou Link *</label>
            <input
              type="text"
              required
              placeholder="Ex: Google Meet (link) ou Sala de Reunião 2"
              value={newMeeting.location}
              onChange={(e) => setNewMeeting({ ...newMeeting, location: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Objetivo da Reunião</label>
            <textarea
              rows={2}
              placeholder="Qual é o propósito principal desta conversa?"
              value={newMeeting.objective}
              onChange={(e) => setNewMeeting({ ...newMeeting, objective: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Pauta Prévia</label>
            <textarea
              rows={2}
              placeholder="Tópicos que serão abordados..."
              value={newMeeting.agenda}
              onChange={(e) => setNewMeeting({ ...newMeeting, agenda: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsNewMeetingOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors border border-slate-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-xs"
            >
              {isSubmitting ? 'Salvando...' : 'Agendar Reunião'}
            </button>
          </div>
        </form>
      </Modal>
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
