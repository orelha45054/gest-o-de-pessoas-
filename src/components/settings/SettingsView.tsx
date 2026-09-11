import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Plus,
  Shield,
  Briefcase,
  Building2,
  Users,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { UserRole } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

export const SettingsView: React.FC = () => {
  const { currentRole } = useAuth();
  const { users, departments, positions, addDepartment, addPosition, addUser, resetSeedData } =
    useAppData();

  const [activeTab, setActiveTab] = useState<'departments' | 'positions' | 'users'>('departments');

  // Modals
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isPosModalOpen, setIsPosModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Forms
  const [deptName, setDeptName] = useState('');
  const [deptManagerId, setDeptManagerId] = useState('');

  const [posTitle, setPosTitle] = useState('');
  const [posDeptId, setPosDeptId] = useState('');

  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('employee');
  const [userDeptId, setUserDeptId] = useState('');
  const [userPosId, setUserPosId] = useState('');
  const [userManagerId, setUserManagerId] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Security guard: Admin only (Prompt Section 22)
  if (currentRole !== 'admin') {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200 shadow-xs text-xs">
        <Shield className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-slate-900">Acesso Restrito ao Administrador</h3>
        <p className="text-slate-500 mt-1">
          Este módulo é exclusivo para administradores configurarem setores, cargos e permissões.
        </p>
      </div>
    );
  }

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName) return;
    setIsSubmitting(true);
    try {
      const manager = users.find((u) => u.id === deptManagerId);
      await addDepartment({
        name: deptName,
        managerId: manager?.id,
        managerName: manager?.name,
      });
      setIsDeptModalOpen(false);
      setDeptName('');
      setDeptManagerId('');
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreatePos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!posTitle || !posDeptId) return;
    setIsSubmitting(true);
    try {
      const dept = departments.find((d) => d.id === posDeptId);
      await addPosition({
        title: posTitle,
        departmentId: posDeptId,
        departmentName: dept?.name || '',
      });
      setIsPosModalOpen(false);
      setPosTitle('');
      setPosDeptId('');
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userEmail) return;
    setIsSubmitting(true);
    try {
      const dept = departments.find((d) => d.id === userDeptId);
      const pos = positions.find((p) => p.id === userPosId);
      const mgr = users.find((u) => u.id === userManagerId);

      await addUser({
        name: userName,
        email: userEmail,
        role: userRole,
        departmentId: userDeptId,
        departmentName: dept?.name || 'Geral',
        positionId: userPosId,
        positionName: pos?.title || 'Colaborador',
        managerId: mgr?.id,
        managerName: mgr?.name,
        active: true,
      });

      setIsUserModalOpen(false);
      setUserName('');
      setUserEmail('');
    } catch (err: any) {
      alert('Erro: ' + err.message);
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
            <SettingsIcon className="w-5 h-5 text-indigo-600" />
            Configurações Corporativas
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gestão de setores da empresa, cargos, cadastro de usuários e regras de acesso.
          </p>
        </div>

        <button
          onClick={resetSeedData}
          className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-xs rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          title="Recarrega dados mock caso queira reiniciar o banco"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Restaurar Dados Demo
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('departments')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
            activeTab === 'departments'
              ? 'bg-indigo-600 text-white font-semibold shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          Setores ({departments.length})
        </button>
        <button
          onClick={() => setActiveTab('positions')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
            activeTab === 'positions'
              ? 'bg-indigo-600 text-white font-semibold shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          Cargos ({positions.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
            activeTab === 'users'
              ? 'bg-indigo-600 text-white font-semibold shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Usuários ({users.length})
        </button>
      </div>

      {/* TAB: SETORES */}
      {activeTab === 'departments' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-900">Departamentos da Empresa</h3>
            <button
              onClick={() => setIsDeptModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo Setor
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {departments.map((d) => (
              <div
                key={d.id}
                className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{d.name}</span>
                  <Building2 className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="text-slate-500">
                  Gestor Responsável:{' '}
                  <strong className="text-slate-800">
                    {d.managerName || 'A definir'}
                  </strong>
                </p>
                <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                  {users.filter((u) => u.departmentId === d.id).length} colaboradores vinculados
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: CARGOS */}
      {activeTab === 'positions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-900">Cargos & Funções</h3>
            <button
              onClick={() => setIsPosModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo Cargo
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {positions.map((p) => (
              <div
                key={p.id}
                className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{p.title}</span>
                  <Briefcase className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="text-slate-500">Setor: {p.departmentName}</p>
                <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                  {users.filter((u) => u.positionId === p.id).length} profissionais
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: USUÁRIOS */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-900">Usuários e Permissões</h3>
            <button
              onClick={() => setIsUserModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Cadastrar Usuário
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold">
                <tr>
                  <th className="p-3">Nome</th>
                  <th className="p-3">E-mail</th>
                  <th className="p-3">Perfil / Papel</th>
                  <th className="p-3">Setor</th>
                  <th className="p-3">Cargo</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-semibold text-slate-900">{u.name}</td>
                    <td className="p-3 text-slate-600">{u.email}</td>
                    <td className="p-3">
                      <Badge
                        variant={
                          u.role === 'admin'
                            ? 'purple'
                            : u.role === 'manager'
                            ? 'indigo'
                            : 'emerald'
                        }
                        size="sm"
                      >
                        {u.role === 'admin'
                          ? 'Administrador'
                          : u.role === 'manager'
                          ? 'Gestor'
                          : 'Funcionário'}
                      </Badge>
                    </td>
                    <td className="p-3 text-slate-700">{u.departmentName}</td>
                    <td className="p-3 text-slate-700">{u.positionName}</td>
                    <td className="p-3">
                      <span className="text-emerald-600 font-medium">Ativo</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Novo Setor */}
      <Modal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        title="Cadastrar Novo Setor"
        maxWidth="sm"
      >
        <form onSubmit={handleCreateDept} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Nome do Setor *</label>
            <input
              type="text"
              required
              placeholder="Ex: Comercial ou Marketing"
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-medium mb-1">Gestor Responsável</label>
            <select
              value={deptManagerId}
              onChange={(e) => setDeptManagerId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
            >
              <option value="">Selecione...</option>
              {users
                .filter((u) => u.role === 'manager' || u.role === 'admin')
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsDeptModalOpen(false)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-xs transition-colors"
            >
              Salvar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Novo Cargo */}
      <Modal
        isOpen={isPosModalOpen}
        onClose={() => setIsPosModalOpen(false)}
        title="Cadastrar Novo Cargo"
        maxWidth="sm"
      >
        <form onSubmit={handleCreatePos} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Título do Cargo *</label>
            <input
              type="text"
              required
              placeholder="Ex: Analista de Marketing Sênior"
              value={posTitle}
              onChange={(e) => setPosTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-medium mb-1">Setor Pertencente *</label>
            <select
              required
              value={posDeptId}
              onChange={(e) => setPosDeptId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
            >
              <option value="">Selecione o setor...</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsPosModalOpen(false)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-xs transition-colors"
            >
              Salvar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Cadastrar Usuário */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title="Cadastrar Novo Usuário"
        maxWidth="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Nome Completo *</label>
              <input
                type="text"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">E-mail *</label>
              <input
                type="email"
                required
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Perfil de Acesso *</label>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
              >
                <option value="employee">Funcionário</option>
                <option value="manager">Gestor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Setor</label>
              <select
                value={userDeptId}
                onChange={(e) => setUserDeptId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
              >
                <option value="">Selecione...</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Cargo</label>
              <select
                value={userPosId}
                onChange={(e) => setUserPosId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
              >
                <option value="">Selecione...</option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Gestor Imediato</label>
              <select
                value={userManagerId}
                onChange={(e) => setUserManagerId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
              >
                <option value="">Selecione...</option>
                {users
                  .filter((u) => u.role === 'manager' || u.role === 'admin')
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsUserModalOpen(false)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-xs transition-colors"
            >
              Cadastrar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
