import React, { useState } from 'react';
import {
  Users,
  Search,
  LayoutGrid,
  List,
  MessageSquareQuote,
  Calendar,
  CheckSquare,
  Shield,
  Briefcase,
  UserCheck,
  Building2,
  Sparkles,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { UserProfile } from '../../types';
import { Badge } from '../common/Badge';
import { EmployeeProfileModal } from './EmployeeProfileModal';
import { ManagerMeetingModal } from '../meetings/ManagerMeetingModal';

export const TeamView: React.FC = () => {
  const { currentUser, currentRole } = useAuth();
  const { users, departments, feedbacks, meetings, tasks } = useAppData();

  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<UserProfile | null>(null);
  const [selectedSectorTab, setSelectedSectorTab] = useState<string>('all');
  const [isManagerMeetingOpen, setIsManagerMeetingOpen] = useState(false);

  // 1. Strict Department Access Control:
  // - Admin (Gerente Geral): access to all employees across all sectors.
  // - Manager (Gerente de Setor): restricted strictly to employees of their assigned department.
  // - Employee: view profile.
  const authorizedMembers = users.filter((u) => {
    if (!u.active) return false;

    if (currentRole === 'admin') {
      return true;
    }

    if (currentRole === 'manager') {
      // Gerente tem acesso estritamente aos funcionários do respectivo setor
      return (
        u.role === 'employee' &&
        (u.departmentId === currentUser?.departmentId ||
          u.departmentName?.toLowerCase() === currentUser?.departmentName?.toLowerCase())
      );
    }

    return u.id === currentUser?.id;
  });

  // 2. Admin Sector Filtering
  const sectorFilteredMembers = authorizedMembers.filter((u) => {
    if (currentRole !== 'admin') return true;

    if (selectedSectorTab === 'all') return true;
    if (selectedSectorTab === 'managers') return u.role === 'manager';
    return u.departmentId === selectedSectorTab;
  });

  // 3. Search Filter
  const filteredMembers = sectorFilteredMembers.filter((u) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.departmentName && u.departmentName.toLowerCase().includes(q)) ||
        (u.positionName && u.positionName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Sector helper stats for Admin (3 sectors)
  const activeDepartments = departments.length > 0 ? departments : [
    { id: 'dept-comercial', name: 'Comercial', managerName: 'Bruno Fagundes' },
    { id: 'dept-marketing', name: 'Marketing', managerName: 'Camila Rocha' },
    { id: 'dept-site', name: 'Site', managerName: 'Rafael Mendes' },
  ];

  const currentSelectedDept = departments.find((d) => d.id === selectedSectorTab);
  const currentDeptManager = users.find(
    (u) => u.role === 'manager' && u.departmentId === selectedSectorTab
  );

  const getEmployeeStats = (empId: string, deptId: string) => {
    const empFeedbacks = feedbacks.filter((f) => f.employeeId === empId);
    const lastFeedback = empFeedbacks.sort((a, b) => (a.date < b.date ? 1 : -1))[0];

    const empMeetings = meetings.filter(
      (m) =>
        m.targetType === 'company' ||
        (m.targetType === 'department' && m.targetDepartmentId === deptId) ||
        m.targetParticipantIds.includes(empId)
    );
    const lastMeeting = empMeetings.sort((a, b) => (a.date < b.date ? 1 : -1))[0];

    const pendingTasks = tasks.filter(
      (t) => t.assigneeId === empId && (t.status === 'Pendente' || t.status === 'Em andamento')
    );

    return {
      lastFeedbackDate: lastFeedback?.date || 'Nenhum',
      lastFeedbackType: lastFeedback?.type,
      lastMeetingDate: lastMeeting ? `${lastMeeting.date} (${lastMeeting.type})` : 'Nenhuma',
      pendingTasksCount: pendingTasks.length,
    };
  };

  const getDepartmentColor = (deptName?: string) => {
    const lower = (deptName || '').toLowerCase();
    if (lower.includes('mkt') || lower.includes('marketing')) return 'purple';
    if (lower.includes('site') || lower.includes('web')) return 'blue';
    if (lower.includes('comercial') || lower.includes('vendas')) return 'emerald';
    return 'indigo';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              {currentRole === 'admin'
                ? 'Controle Geral de Pessoas por Setor'
                : `Equipe do Setor: ${currentUser?.departmentName || 'Meu Setor'}`}
            </h2>
            {currentRole === 'admin' ? (
              <Badge variant="purple" size="sm">Gerente Geral</Badge>
            ) : (
              <Badge variant="indigo" size="sm">Acesso Exclusivo do Setor</Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {currentRole === 'admin'
              ? 'Acesso irrestrito a todos os colaboradores de Comercial, Marketing e Site com visão segmentada por setor.'
              : `Você tem acesso exclusivamente aos funcionários vinculados ao setor de ${currentUser?.departmentName || 'seu setor'}.`}
          </p>
        </div>

        {/* View Mode & Admin Manager Meeting Button */}
        <div className="flex items-center gap-2">
          {currentRole === 'admin' && (
            <button
              onClick={() => setIsManagerMeetingOpen(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 shrink-0"
              title="Convocar reunião com todos ou gerentes selecionados"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Reunião com Gerentes</span>
            </button>
          )}

          <div className="flex items-center p-1 bg-white border border-slate-200 rounded-xl shadow-xs">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'cards'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Tabela
            </button>
          </div>
        </div>
      </div>

      {/* Admin Sector Switcher Tabs */}
      {currentRole === 'admin' && (
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <button
              onClick={() => setSelectedSectorTab('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
                selectedSectorTab === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Todos os Setores</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                selectedSectorTab === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {authorizedMembers.filter(u => u.role !== 'admin').length}
              </span>
            </button>

            {/* Individual Sector Tabs */}
            {activeDepartments.map((dept) => {
              const count = authorizedMembers.filter((u) => u.departmentId === dept.id).length;
              const isSelected = selectedSectorTab === dept.id;
              const color = getDepartmentColor(dept.name);

              return (
                <button
                  key={dept.id}
                  onClick={() => setSelectedSectorTab(dept.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current opacity-80" />
                  <span>Setor {dept.name}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}

            {/* Gerentes de Setor Tab */}
            <button
              onClick={() => setSelectedSectorTab('managers')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
                selectedSectorTab === 'managers'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              <span>Gerentes de Setor</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                selectedSectorTab === 'managers' ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {users.filter(u => u.role === 'manager').length}
              </span>
            </button>
          </div>

          {/* Sector Highlight Banner for Selected Sector */}
          {selectedSectorTab !== 'all' && selectedSectorTab !== 'managers' && currentSelectedDept && (
            <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">
                    Setor: {currentSelectedDept.name}
                  </span>
                  <Badge variant={getDepartmentColor(currentSelectedDept.name) as any} size="sm">
                    {filteredMembers.length} Colaboradores
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {currentSelectedDept.description || 'Gestão e acompanhamento das entregas deste setor.'}
                </p>
                {currentDeptManager && (
                  <p className="text-xs text-slate-600 flex items-center gap-1.5 pt-1">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Gerente Responsável:</span>
                    <strong className="text-slate-900">{currentDeptManager.name}</strong>
                    <span className="text-slate-400">({currentDeptManager.email})</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsManagerMeetingOpen(true)}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  Agendar com Gerente
                </button>
              </div>
            </div>
          )}

          {/* Gerentes de Setor Summary Banner */}
          {selectedSectorTab === 'managers' && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-bold text-purple-900">
                    Corpo de Liderança da Empresa (3 Setores)
                  </span>
                  <Badge variant="purple" size="sm">Gerentes</Badge>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Estes gestores lideram as equipes dos setores Comercial, Marketing e Site.
                  Você pode convocar reuniões individuais ou uma reunião geral de liderança selecionando os gerentes.
                </p>
              </div>
              <button
                onClick={() => setIsManagerMeetingOpen(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs flex items-center gap-1.5 shrink-0"
              >
                <Shield className="w-4 h-4" />
                <span>Convocar Reunião de Gerência</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Manager Scope Restriction Notice (When logged in as a Sector Manager) */}
      {currentRole === 'manager' && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-slate-700">
              Você está no setor <strong className="text-slate-900">{currentUser?.departmentName}</strong>. 
              Por segurança e organização, apenas os funcionários deste setor estão visíveis para você.
            </span>
          </div>
          <Badge variant={getDepartmentColor(currentUser?.departmentName) as any} size="sm">
            {filteredMembers.length} Funcionários
          </Badge>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <Search className="w-4 h-4 text-slate-400 absolute left-6 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder={`Buscar por nome, e-mail ou cargo em ${
            selectedSectorTab !== 'all' && currentSelectedDept
              ? `Setor ${currentSelectedDept.name}`
              : 'todos os colaboradores'
          }...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500"
        />
      </div>

      {/* CARDS VIEW */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
              Nenhum colaborador encontrado com os filtros selecionados.
            </div>
          ) : (
            filteredMembers.map((member) => {
              const stats = getEmployeeStats(member.id, member.departmentId);
              const deptColor = getDepartmentColor(member.departmentName);
              const isManager = member.role === 'manager';

              return (
                <div
                  key={member.id}
                  onClick={() => setSelectedEmployee(member)}
                  className={`p-5 bg-white rounded-xl border transition-all cursor-pointer flex flex-col justify-between group shadow-xs hover:shadow-sm ${
                    isManager ? 'border-purple-300 bg-purple-50/20' : 'border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <div>
                    {/* Avatar & Basics */}
                    <div className="flex items-center gap-3 mb-4">
                      {member.avatarUrl ? (
                        <img
                          src={member.avatarUrl}
                          alt={member.name}
                          className={`w-12 h-12 rounded-full object-cover shrink-0 ring-2 ${
                            isManager ? 'ring-purple-400' : 'ring-slate-200'
                          }`}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-base text-slate-600 shrink-0">
                          {member.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h3 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                            {member.name}
                          </h3>
                          {isManager && (
                            <Badge variant="purple" size="sm">Gestor</Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                          {member.positionName || 'Cargo não especificado'}
                        </p>
                        <Badge variant={deptColor as any} size="sm" className="mt-1">
                          Setor {member.departmentName}
                        </Badge>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <MessageSquareQuote className="w-3.5 h-3.5" /> Último Feedback:
                        </span>
                        <span className="font-medium text-slate-800">{stats.lastFeedbackDate}</span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <Calendar className="w-3.5 h-3.5" /> Última Reunião:
                        </span>
                        <span className="font-medium text-slate-800 truncate max-w-[140px]">
                          {stats.lastMeetingDate}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <CheckSquare className="w-3.5 h-3.5" /> Tarefas Pendentes:
                        </span>
                        <span
                          className={`font-semibold ${
                            stats.pendingTasksCount > 0 ? 'text-amber-600' : 'text-emerald-600'
                          }`}
                        >
                          {stats.pendingTasksCount}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-indigo-600 font-medium group-hover:underline">
                    <span>Abrir Perfil 360°</span>
                    <span>Ver Histórico & Timeline →</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Colaborador</th>
                  <th className="py-3.5 px-4">Papel / Cargo</th>
                  <th className="py-3.5 px-4">Setor</th>
                  <th className="py-3.5 px-4">Último Feedback</th>
                  <th className="py-3.5 px-4">Última Reunião</th>
                  <th className="py-3.5 px-4">Tarefas</th>
                  <th className="py-3.5 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((member) => {
                  const stats = getEmployeeStats(member.id, member.departmentId);
                  const deptColor = getDepartmentColor(member.departmentName);

                  return (
                    <tr
                      key={member.id}
                      onClick={() => setSelectedEmployee(member)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {member.avatarUrl ? (
                            <img
                              src={member.avatarUrl}
                              alt={member.name}
                              className="w-7 h-7 rounded-full object-cover border border-slate-200"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600">
                              {member.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <span className="font-semibold text-slate-900 block">
                              {member.name}
                            </span>
                            <span className="text-[11px] text-slate-400">{member.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-800 block">{member.positionName}</span>
                        {member.role === 'manager' && (
                          <Badge variant="purple" size="sm" className="mt-0.5">Gerente</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={deptColor as any} size="sm">
                          {member.departmentName}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-mono">
                        {stats.lastFeedbackDate}
                      </td>
                      <td className="py-3 px-4 text-slate-700 truncate max-w-[150px]">
                        {stats.lastMeetingDate}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={stats.pendingTasksCount > 0 ? 'amber' : 'emerald'}
                          size="sm"
                        >
                          {stats.pendingTasksCount}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEmployee(member);
                          }}
                          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          Ver perfil
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Individual Employee Profile Modal */}
      {selectedEmployee && (
        <EmployeeProfileModal
          employee={selectedEmployee}
          isOpen={true}
          onClose={() => setSelectedEmployee(null)}
        />
      )}

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
