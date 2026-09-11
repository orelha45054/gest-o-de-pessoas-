import React, { useState } from 'react';
import { Award, Send, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { Modal } from '../common/Modal';

interface SelfEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  cycleId?: string;
}

export const SelfEvaluationModal: React.FC<SelfEvaluationModalProps> = ({
  isOpen,
  onClose,
  cycleId,
}) => {
  const { currentUser } = useAuth();
  const { addSelfEvaluation } = useAppData();

  // The 5 mandatory questions from Prompt Section 16
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [q3, setQ3] = useState('');
  const [q4, setQ4] = useState('');
  const [q5, setQ5] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!q1 || !q2 || !q3 || !q4 || !q5) {
      alert('Por favor, responda a todas as 5 perguntas de autoavaliação.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addSelfEvaluation({
        employeeId: currentUser?.id || 'usr-joao',
        employeeName: currentUser?.name || 'Funcionário',
        cycleId: cycleId || undefined,
        performanceRatingText: q1,
        achievementsText: q2,
        difficultiesText: q3,
        developmentAreaText: q4,
        companySupportText: q5,
      });

      alert('Autoavaliação enviada com sucesso para o seu gestor!');
      onClose();
    } catch (err: any) {
      alert('Erro ao enviar autoavaliação: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Autoavaliação de Desempenho & Carreira"
      subtitle="Reflita sobre suas entregas, metas, desafios e aspirações profissionais"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Pergunta 1 */}
        <div>
          <label className="block text-slate-800 font-semibold mb-1">
            1. Como você avalia seu desempenho nos últimos meses? *
          </label>
          <textarea
            required
            rows={2}
            placeholder="Analise sua produtividade, qualidade de entrega e constância..."
            value={q1}
            onChange={(e) => setQ1(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
          />
        </div>

        {/* Pergunta 2 */}
        <div>
          <label className="block text-slate-800 font-semibold mb-1">
            2. Quais foram suas principais conquistas? *
          </label>
          <textarea
            required
            rows={2}
            placeholder="Projetos entregues, metas atingidas, elogios de clientes ou colegas..."
            value={q2}
            onChange={(e) => setQ2(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
          />
        </div>

        {/* Pergunta 3 */}
        <div>
          <label className="block text-slate-800 font-semibold mb-1">
            3. Quais foram suas maiores dificuldades? *
          </label>
          <textarea
            required
            rows={2}
            placeholder="Gargalos, ferramentas, prazos apertados ou lacunas de conhecimento..."
            value={q3}
            onChange={(e) => setQ3(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
          />
        </div>

        {/* Pergunta 4 */}
        <div>
          <label className="block text-slate-800 font-semibold mb-1">
            4. Em qual área você gostaria de se desenvolver? *
          </label>
          <textarea
            required
            rows={2}
            placeholder="Habilidades técnicas, liderança, comunicação, cursos ou certificações..."
            value={q4}
            onChange={(e) => setQ4(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
          />
        </div>

        {/* Pergunta 5 */}
        <div>
          <label className="block text-slate-800 font-semibold mb-1">
            5. Como o gestor ou a empresa podem te ajudar? *
          </label>
          <textarea
            required
            rows={2}
            placeholder="Feedbacks mais frequentes, treinamentos, apoio em projetos, recursos..."
            value={q5}
            onChange={(e) => setQ5(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
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
            Salvar Autoavaliação
          </button>
        </div>
      </form>
    </Modal>
  );
};
