export type UserRole = 'admin' | 'manager' | 'employee';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  departmentId?: string;
  departmentName?: string;
  positionId?: string;
  positionName?: string;
  managerId?: string;
  managerName?: string;
  phone?: string;
  avatarUrl?: string;
  startDate?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  managerId?: string;
  managerName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Position {
  id: string;
  title: string;
  departmentId?: string;
  departmentName?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type FeedbackType =
  | 'Feedback positivo'
  | 'Ponto de melhoria'
  | 'Desempenho'
  | 'Comportamento'
  | 'Desenvolvimento'
  | 'Projeto específico'
  | 'Produtividade'
  | 'Atendimento'
  | 'Outro';

export interface Feedback {
  id: string;
  employeeId: string;
  employeeName: string;
  managerId: string;
  managerName: string;
  date: string;
  type: FeedbackType;
  category: string;
  title: string;
  description: string;
  positivePoints: string;
  improvementPoints: string;
  agreements: string;
  notes?: string;
  needsFollowUp: boolean;
  followUpDaysOption?: string;
  followUpDate?: string;
  status: 'realizado' | 'agendado' | 'concluido';
  selfEvaluationId?: string;
  createdAt: string;
  updatedAt: string;
}

export type RequestStatus = 'requested' | 'viewed' | 'scheduled' | 'performed' | 'completed';

export interface FeedbackRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  managerId: string;
  managerName: string;
  topic: string;
  message?: string;
  status: RequestStatus;
  scheduledDate?: string;
  scheduledMeetingId?: string;
  createdAt: string;
  updatedAt: string;
}

export type ConversationTopic =
  | 'Conversa individual'
  | 'Orientação'
  | 'Conversa sobre carreira'
  | 'Conversa sobre dificuldades'
  | 'Reunião com gestor'
  | 'Outro';

export interface ConversationRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  managerId: string;
  managerName: string;
  type: ConversationTopic;
  message?: string;
  status: RequestStatus;
  scheduledDate?: string;
  scheduledMeetingId?: string;
  createdAt: string;
  updatedAt: string;
}

export type MeetingType =
  | '1:1 (One on One)'
  | 'Alinhamento'
  | 'Reunião Geral'
  | 'Reunião de Setor'
  | 'Reunião com Gerentes'
  | 'Reunião Individual'
  | 'Feedback'
  | 'Reunião de equipe'
  | 'Planejamento'
  | 'Acompanhamento'
  | 'Acompanhamento de metas'
  | 'Treinamento'
  | 'Outro';

export type TargetAudienceType = 'company' | 'department' | 'selected' | 'individual';
export type MeetingTargetType = TargetAudienceType;

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';

export interface MeetingMinutes {
  summary: string;
  topics: string;
  decisions: string;
  nextSteps: string;
  notes?: string;
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes: number;
  location: string;
  organizerId: string;
  organizerName: string;
  type: MeetingType;
  targetType: TargetAudienceType;
  targetDepartmentId?: string;
  targetDepartmentName?: string;
  targetParticipantIds: string[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  recurrence: RecurrenceType;
  recurrenceDescription?: string;
  agendaItems: string[];
  minutes?: MeetingMinutes;
  ataSummary?: string;
  decisions?: string;
  agreements?: string;
  nextSteps?: string;
  rsvp?: Record<string, string>;
  presence?: Record<string, ParticipantStatus>;
  createdAt: string;
  updatedAt: string;
}

export type ParticipantStatus = 'attending' | 'not_attending' | 'pending';

export interface MeetingParticipant {
  id: string;
  meetingId: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: ParticipantStatus;
  updatedAt: string;
}

export type TaskPriority = 'Baixa' | 'Normal' | 'Média' | 'Alta' | 'Urgente';
export type TaskStatus = 'Pendente' | 'Em andamento' | 'Concluído' | 'Atrasado' | 'Cancelado';

export interface Task {
  id: string;
  title: string;
  description?: string;
  assigneeId: string;
  assigneeName: string;
  creatorId: string;
  creatorName: string;
  dueDate: string; // YYYY-MM-DD
  priority: TaskPriority;
  status: TaskStatus;
  originType: 'meeting' | 'feedback' | 'development_plan' | 'direct';
  originTitle: string;
  originId?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export type FollowUpStatus = 'Próximo' | 'Hoje' | 'Atrasado' | 'Concluído';
export type FollowUpResult =
  | 'Melhorou'
  | 'Melhorou parcialmente'
  | 'Não apresentou evolução'
  | 'Objetivo atingido'
  | 'Necessita continuar acompanhamento';

export interface FollowUp {
  id: string;
  feedbackId: string;
  feedbackTitle?: string;
  employeeId: string;
  employeeName: string;
  managerId: string;
  managerName: string;
  title: string;
  scheduledDate: string; // YYYY-MM-DD
  status: FollowUpStatus;
  result?: FollowUpResult;
  notes?: string;
  nextFollowUpDate?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface DevelopmentStage {
  id: string;
  title: string;
  order: number;
  completed: boolean;
  completedAt?: string;
}

export type DevelopmentStepNumber = 1 | 2 | 3 | 4 | 5;
export type ActionPlanStatus = 'Pendente' | 'Em andamento' | 'Concluído' | 'Atrasado' | 'Cancelado';

export interface ActionPlan {
  id: string;
  title?: string;
  objective?: string;
  description?: string;
  actions?: string;
  responsibleId?: string;
  responsibleName?: string;
  dueDate?: string;
  deadline?: string;
  expectedResult?: string;
  supportNeeded?: string;
  status: ActionPlanStatus;
}

export interface DevelopmentCycle {
  id: string;
  employeeId: string;
  employeeName: string;
  managerId: string;
  managerName: string;
  title: string;
  goal?: string;
  description?: string;
  startDate?: string;
  targetDate?: string;
  status: 'Ativo' | 'Concluído' | 'Cancelado';
  currentStep: number;
  stages?: DevelopmentStage[];
  actionPlans: ActionPlan[];
  period?: string;
  year?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SelfEvaluation {
  id: string;
  employeeId: string;
  employeeName: string;
  managerId?: string;
  managerName?: string;
  cycleId?: string;
  feedbackId?: string;
  title?: string;
  performanceRatingText?: string;
  achievementsText?: string;
  difficultiesText?: string;
  developmentAreaText?: string;
  companySupportText?: string;
  questions?: {
    strengths: string;
    improvements: string;
    difficulties: string;
    growthAreas: string;
    goals: string;
  };
  status?: 'pending' | 'submitted';
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'meeting' | 'feedback' | 'task' | 'followup' | 'request';
  read: boolean;
  linkUrl?: string;
  relatedId?: string;
  createdAt: string;
}

export type TimelineEventType = 'feedback' | 'meeting' | 'task' | 'development' | 'followup';

export interface TimelineEvent {
  id: string;
  date: string;
  type: TimelineEventType;
  title: string;
  description: string;
  badgeText: string;
  badgeColor: 'emerald' | 'amber' | 'rose' | 'indigo' | 'zinc';
}
