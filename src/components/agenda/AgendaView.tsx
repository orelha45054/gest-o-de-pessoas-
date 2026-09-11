import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  List,
  CalendarDays,
  Columns,
  Square,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { Meeting, MeetingType } from '../../types';
import { Badge } from '../common/Badge';
import { TODAY_ISO } from '../../lib/initialData';

type ViewMode = 'month' | 'week' | 'day' | 'list';

export const AgendaView: React.FC = () => {
  const { currentUser, currentRole } = useAuth();
  const { meetings, updateMeetingRsvp } = useAppData();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterType, setFilterType] = useState<string>('all');
  const [currentDateString, setCurrentDateString] = useState<string>(TODAY_ISO);

  // Filter meetings for the current user
  const userMeetings = meetings.filter((m) => {
    if (currentRole === 'employee') {
      const isCompany = m.targetType === 'company';
      const isMyDept =
        m.targetType === 'department' && m.targetDepartmentId === currentUser?.departmentId;
      const isParticipant =
        m.targetParticipantIds.includes(currentUser?.id || '') || m.organizerId === currentUser?.id;
      if (!isCompany && !isMyDept && !isParticipant) return false;
    }
    if (filterType !== 'all' && m.type !== filterType) return false;
    return true;
  });

  const getRsvpStatus = (m: Meeting) => {
    return m.rsvp?.[currentUser?.id || ''] || 'pending';
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-600" />
            Minha Agenda
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Visualização de compromissos, reuniões 1:1, alinhamentos e confirmação de presença.
          </p>
        </div>

        {/* View Mode Switcher (Prompt Section 6: mensal, semanal, diária, lista) */}
        <div className="flex items-center p-1 bg-slate-100 border border-slate-200 rounded-xl shadow-xs">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              viewMode === 'list'
                ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            Lista
          </button>
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              viewMode === 'day'
                ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            Dia
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              viewMode === 'week'
                ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            Semana
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              viewMode === 'month'
                ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Mês
          </button>
        </div>
      </div>

      {/* Filter by meeting type */}
      <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>Filtrar por tipo:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 text-xs focus:outline-none focus:bg-white focus:border-indigo-500"
          >
            <option value="all">Todos os tipos</option>
            <option value="1:1 (One on One)">1:1 (One on One)</option>
            <option value="Feedback">Feedback</option>
            <option value="Alinhamento">Alinhamento</option>
            <option value="Reunião de equipe">Reunião de equipe</option>
            <option value="Planejamento">Planejamento</option>
            <option value="Acompanhamento de metas">Acompanhamento de metas</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Data de referência: <span className="text-slate-800 font-medium">{currentDateString}</span>
        </div>
      </div>

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {userMeetings.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200 shadow-xs">
              Nenhuma reunião encontrada para este filtro.
            </div>
          ) : (
            userMeetings.map((m) => {
              const rsvp = getRsvpStatus(m);
              const isToday = m.date === TODAY_ISO;

              return (
                <div
                  key={m.id}
                  className={`p-4 bg-white rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs ${
                    isToday ? 'border-indigo-300 ring-2 ring-indigo-100 bg-indigo-50/20' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="text-center shrink-0 w-14 py-2 px-1 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 block uppercase font-mono">
                        {m.date.split('-')[1]}
                      </span>
                      <span className="text-base font-bold text-slate-900 block leading-tight">
                        {m.date.split('-')[2]}
                      </span>
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={m.type === 'Feedback' ? 'indigo' : 'zinc'} size="sm">
                          {m.type}
                        </Badge>
                        {isToday && (
                          <Badge variant="emerald" size="sm">
                            Hoje
                          </Badge>
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900 truncate">{m.title}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {m.time} ({m.durationMinutes} min)
                        </span>
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {m.location}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Confirmação de Presença (Prompt Section 6 requirement) */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <span className="text-xs text-slate-500 hidden md:inline">Presença:</span>
                    <button
                      onClick={() => updateMeetingRsvp(m.id, currentUser?.id || '', 'confirmed')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                        rsvp === 'confirmed'
                          ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                          : 'bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                      title="Confirmar Presença"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Confirmar
                    </button>
                    <button
                      onClick={() => updateMeetingRsvp(m.id, currentUser?.id || '', 'declined')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                        rsvp === 'declined'
                          ? 'bg-rose-600 text-white font-semibold shadow-xs'
                          : 'bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                      title="Recusar Reunião"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Recusar
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* DAY VIEW */}
      {viewMode === 'day' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900">
              Agenda do Dia: {currentDateString}
            </h3>
            <Badge variant="indigo">
              {userMeetings.filter((m) => m.date === currentDateString).length} reuniões
            </Badge>
          </div>

          <div className="space-y-3">
            {userMeetings
              .filter((m) => m.date === currentDateString)
              .map((m) => (
                <div
                  key={m.id}
                  className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-indigo-600 font-semibold">
                        {m.time}
                      </span>
                      <Badge variant="zinc" size="sm">
                        {m.durationMinutes} min
                      </Badge>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900">{m.title}</h4>
                    <p className="text-xs text-slate-500">{m.location}</p>
                  </div>
                  <Badge variant={m.type === 'Feedback' ? 'indigo' : 'zinc'}>{m.type}</Badge>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {['2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11'].map(
            (dayDate, idx) => {
              const dayNames = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
              const dayMeetings = userMeetings.filter((m) => m.date === dayDate);
              const isToday = dayDate === TODAY_ISO;

              return (
                <div
                  key={dayDate}
                  className={`p-3.5 rounded-xl border flex flex-col h-80 shadow-xs ${
                    isToday
                      ? 'bg-indigo-50/40 border-indigo-300 ring-2 ring-indigo-100'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="pb-2 mb-2 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase block">
                        {dayNames[idx]}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{dayDate.slice(5)}</span>
                    </div>
                    {isToday && (
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-indigo-100" />
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2">
                    {dayMeetings.length === 0 ? (
                      <span className="text-[11px] text-slate-400 block text-center pt-8">
                        Livre
                      </span>
                    ) : (
                      dayMeetings.map((m) => (
                        <div
                          key={m.id}
                          className="p-2 rounded bg-slate-50 border border-slate-200 text-xs space-y-1 shadow-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] text-indigo-600 font-semibold">
                              {m.time}
                            </span>
                            <span className="text-[10px] text-slate-400">{m.type}</span>
                          </div>
                          <p className="font-medium text-slate-800 truncate">{m.title}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900">Setembro de 2026</h3>
            <span className="text-xs text-slate-500 font-mono">Total no mês: {userMeetings.length} reuniões</span>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
              <div key={day} className="text-slate-500 font-semibold py-1">
                {day}
              </div>
            ))}

            {/* Render 30 days grid */}
            {Array.from({ length: 30 }, (_, i) => {
              const dayNum = i + 1;
              const formattedDate = `2026-09-${dayNum < 10 ? '0' + dayNum : dayNum}`;
              const dayMts = userMeetings.filter((m) => m.date === formattedDate);
              const isToday = formattedDate === TODAY_ISO;

              return (
                <div
                  key={dayNum}
                  onClick={() => {
                    setCurrentDateString(formattedDate);
                    setViewMode('day');
                  }}
                  className={`p-2 rounded-lg border text-left min-h-[64px] transition-colors cursor-pointer flex flex-col justify-between shadow-xs ${
                    isToday
                      ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-100'
                      : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`text-xs font-semibold ${
                      isToday ? 'text-indigo-600 font-bold' : 'text-slate-600'
                    }`}
                  >
                    {dayNum}
                  </span>

                  {dayMts.length > 0 && (
                    <div className="space-y-0.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium border border-indigo-200 block truncate">
                        {dayMts.length} reunião{dayMts.length > 1 ? 'ões' : ''}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
