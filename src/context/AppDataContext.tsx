import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  UserProfile,
  Department,
  Position,
  Feedback,
  FeedbackRequest,
  ConversationRequest,
  Meeting,
  Task,
  FollowUp,
  NotificationItem,
  SelfEvaluation,
  MeetingMinutes,
  ParticipantStatus,
  FollowUpResult,
  TaskStatus,
} from '../types';
import {
  COLLECTIONS,
  subscribeToCollection,
  createDocument,
  updateDocument,
  deleteDocument,
  seedFirestoreIfEmpty,
} from '../services/firestoreService';
import {
  INITIAL_USERS,
  INITIAL_DEPARTMENTS,
  INITIAL_POSITIONS,
  INITIAL_MEETINGS,
  INITIAL_FEEDBACKS,
  INITIAL_FOLLOW_UPS,
  INITIAL_TASKS,
  INITIAL_FEEDBACK_REQUESTS,
  INITIAL_CONVERSATION_REQUESTS,
  INITIAL_NOTIFICATIONS,
  TODAY_ISO,
} from '../lib/initialData';

interface AppDataContextType {
  users: UserProfile[];
  departments: Department[];
  positions: Position[];
  feedbacks: Feedback[];
  feedbackRequests: FeedbackRequest[];
  conversationRequests: ConversationRequest[];
  meetings: Meeting[];
  tasks: Task[];
  followUps: FollowUp[];
  selfEvaluations: SelfEvaluation[];
  notifications: NotificationItem[];
  isLoading: boolean;

  // Actions
  addFeedback: (feedback: Omit<Feedback, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<string>;
  completeFollowUp: (
    followUpId: string,
    result: FollowUpResult,
    notes: string,
    createNext: boolean,
    nextDate?: string
  ) => Promise<void>;
  createFeedbackRequest: (req: {
    employeeId: string;
    employeeName: string;
    managerId: string;
    managerName: string;
    topic: string;
    message?: string;
  }) => Promise<string>;
  createConversationRequest: (req: {
    employeeId: string;
    employeeName: string;
    managerId: string;
    managerName: string;
    type: any;
    message?: string;
  }) => Promise<string>;
  updateRequestStatus: (
    type: 'feedback' | 'conversation',
    id: string,
    status: 'requested' | 'viewed' | 'scheduled' | 'performed' | 'completed'
  ) => Promise<void>;
  scheduleRequestMeeting: (
    requestType: 'feedback' | 'conversation',
    requestId: string,
    meetingData: {
      title: string;
      date: string;
      time: string;
      durationMinutes: number;
      location: string;
      notes?: string;
      organizerId: string;
      organizerName: string;
      employeeId: string;
      employeeName: string;
    }
  ) => Promise<string>;
  createMeeting: (meeting: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<string>;
  addMeeting: (meeting: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<string>;
  updateMeetingPresence: (meetingId: string, userId: string, status: ParticipantStatus) => Promise<void>;
  updateMeetingRsvp: (meetingId: string, userId: string, status: 'confirmed' | 'declined' | 'pending') => Promise<void>;
  saveMeetingMinutes: (
    meetingId: string,
    minutes: MeetingMinutes,
    newTasks?: Array<{
      title: string;
      description?: string;
      assigneeId: string;
      dueDate: string;
      priority: any;
    }>
  ) => Promise<void>;
  updateMeetingAta: (
    meetingId: string,
    ata: { summary: string; decisions: string; agreements: string; nextSteps: string }
  ) => Promise<void>;
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  createSelfEvaluation: (data: Omit<SelfEvaluation, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  addSelfEvaluation: (data: Partial<SelfEvaluation>) => Promise<string>;
  submitSelfEvaluation: (id: string, answers: SelfEvaluation['questions']) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: (userId: string) => Promise<void>;
  addUser: (user: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateUser: (id: string, user: Partial<UserProfile>) => Promise<void>;
  toggleUserActive: (id: string, currentActive: boolean) => Promise<void>;
  addDepartment: (dept: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateDepartment: (id: string, dept: Partial<Department>) => Promise<void>;
  addPosition: (pos: Omit<Position, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updatePosition: (id: string, pos: Partial<Position>) => Promise<void>;
  seedDemoData: () => Promise<void>;
  resetSeedData: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [positions, setPositions] = useState<Position[]>(INITIAL_POSITIONS);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>(INITIAL_FEEDBACKS);
  const [feedbackRequests, setFeedbackRequests] = useState<FeedbackRequest[]>(INITIAL_FEEDBACK_REQUESTS);
  const [conversationRequests, setConversationRequests] = useState<ConversationRequest[]>(INITIAL_CONVERSATION_REQUESTS);
  const [meetings, setMeetings] = useState<Meeting[]>(INITIAL_MEETINGS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [followUps, setFollowUps] = useState<FollowUp[]>(INITIAL_FOLLOW_UPS);
  const [selfEvaluations, setSelfEvaluations] = useState<SelfEvaluation[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize seed & subscribe
  useEffect(() => {
    let unsubs: Array<() => void> = [];

    async function init() {
      await seedFirestoreIfEmpty();

      const u1 = subscribeToCollection<UserProfile>(COLLECTIONS.USERS, setUsers, INITIAL_USERS);
      const u2 = subscribeToCollection<Department>(COLLECTIONS.DEPARTMENTS, setDepartments, INITIAL_DEPARTMENTS);
      const u3 = subscribeToCollection<Position>(COLLECTIONS.POSITIONS, setPositions, INITIAL_POSITIONS);
      const u4 = subscribeToCollection<Feedback>(COLLECTIONS.FEEDBACKS, setFeedbacks, INITIAL_FEEDBACKS);
      const u5 = subscribeToCollection<FeedbackRequest>(COLLECTIONS.FEEDBACK_REQUESTS, setFeedbackRequests, INITIAL_FEEDBACK_REQUESTS);
      const u6 = subscribeToCollection<ConversationRequest>(COLLECTIONS.CONVERSATION_REQUESTS, setConversationRequests, INITIAL_CONVERSATION_REQUESTS);
      const u7 = subscribeToCollection<Meeting>(COLLECTIONS.MEETINGS, setMeetings, INITIAL_MEETINGS);
      const u8 = subscribeToCollection<Task>(COLLECTIONS.TASKS, setTasks, INITIAL_TASKS);
      const u9 = subscribeToCollection<FollowUp>(COLLECTIONS.FOLLOW_UPS, setFollowUps, INITIAL_FOLLOW_UPS);
      const u11 = subscribeToCollection<SelfEvaluation>(COLLECTIONS.SELF_EVALUATIONS, setSelfEvaluations, []);
      const u12 = subscribeToCollection<NotificationItem>(COLLECTIONS.NOTIFICATIONS, setNotifications, INITIAL_NOTIFICATIONS);

      unsubs = [u1, u2, u3, u4, u5, u6, u7, u8, u9, u11, u12];
      setIsLoading(false);
    }

    init();

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, []);

  // FLUXO 1: Gestor cria feedback com acompanhamento automático
  const addFeedback = async (
    fb: Omit<Feedback, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<string> => {
    const now = new Date().toISOString();
    const newFeedback: Feedback = {
      ...fb,
      id: `fb-${Date.now()}`,
      status: 'realizado',
      createdAt: now,
      updatedAt: now,
    };

    // Calculate follow-up date if option chosen
    let computedFollowUpDate = fb.followUpDate;
    if (fb.needsFollowUp && fb.followUpDaysOption) {
      const daysMatch = fb.followUpDaysOption.match(/\d+/);
      if (daysMatch) {
        const days = parseInt(daysMatch[0], 10);
        const target = new Date();
        target.setDate(target.getDate() + days);
        computedFollowUpDate = target.toISOString().split('T')[0];
      }
    }

    if (computedFollowUpDate) {
      newFeedback.followUpDate = computedFollowUpDate;
    }

    // Save feedback to state immediately & to Firestore
    setFeedbacks((prev) => [newFeedback, ...prev]);
    await createDocument(COLLECTIONS.FEEDBACKS, newFeedback);

    // If needs follow-up, create FollowUp automatically
    if (fb.needsFollowUp && computedFollowUpDate) {
      const newFollowUp: FollowUp = {
        id: `fup-${Date.now()}`,
        feedbackId: newFeedback.id,
        feedbackTitle: newFeedback.title,
        employeeId: newFeedback.employeeId,
        employeeName: newFeedback.employeeName,
        managerId: newFeedback.managerId,
        managerName: newFeedback.managerName,
        title: `Acompanhamento: ${newFeedback.title}`,
        scheduledDate: computedFollowUpDate,
        status: computedFollowUpDate === TODAY_ISO ? 'Hoje' : 'Próximo',
        notes: `Acompanhamento gerado a partir do feedback registrado em ${newFeedback.date}.`,
        createdAt: now,
        updatedAt: now,
      };

      setFollowUps((prev) => [newFollowUp, ...prev]);
      await createDocument(COLLECTIONS.FOLLOW_UPS, newFollowUp);

      // Create notification for manager & employee
      const notif: NotificationItem = {
        id: `notif-${Date.now()}`,
        userId: newFeedback.employeeId,
        title: 'Novo feedback registrado',
        message: `${newFeedback.managerName} registrou um novo feedback: "${newFeedback.title}".`,
        type: 'feedback',
        read: false,
        relatedId: newFeedback.id,
        createdAt: now,
      };
      setNotifications((prev) => [notif, ...prev]);
      await createDocument(COLLECTIONS.NOTIFICATIONS, notif);
    }

    return newFeedback.id;
  };

  // FLUXO 1 cont: Gestor realiza acompanhamento
  const completeFollowUp = async (
    followUpId: string,
    result: FollowUpResult,
    notes: string,
    createNext: boolean,
    nextDate?: string
  ): Promise<void> => {
    const now = new Date().toISOString();
    const updated = {
      status: 'Concluído' as const,
      result,
      notes,
      nextFollowUpDate: createNext && nextDate ? nextDate : undefined,
      completedAt: now,
      updatedAt: now,
    };

    setFollowUps((prev) =>
      prev.map((f) => (f.id === followUpId ? { ...f, ...updated } : f))
    );
    await updateDocument(COLLECTIONS.FOLLOW_UPS, followUpId, updated);

    // If manager requested a new follow-up
    const current = followUps.find((f) => f.id === followUpId);
    if (createNext && nextDate && current) {
      const nextFollowUp: FollowUp = {
        id: `fup-${Date.now()}`,
        feedbackId: current.feedbackId,
        feedbackTitle: current.feedbackTitle,
        employeeId: current.employeeId,
        employeeName: current.employeeName,
        managerId: current.managerId,
        managerName: current.managerName,
        title: `Novo Acompanhamento: ${current.title.replace(/^Acompanhamento:\s*/, '')}`,
        scheduledDate: nextDate,
        status: nextDate === TODAY_ISO ? 'Hoje' : 'Próximo',
        notes: `Continuação do acompanhamento anterior. Observação: ${notes}`,
        createdAt: now,
        updatedAt: now,
      };

      setFollowUps((prev) => [nextFollowUp, ...prev]);
      await createDocument(COLLECTIONS.FOLLOW_UPS, nextFollowUp);
    }
  };

  // FLUXO 2: Funcionário solicita feedback
  const createFeedbackRequest = async (req: {
    employeeId: string;
    employeeName: string;
    managerId: string;
    managerName: string;
    topic: string;
    message?: string;
  }): Promise<string> => {
    const now = new Date().toISOString();
    const newReq: FeedbackRequest = {
      ...req,
      id: `freq-${Date.now()}`,
      status: 'requested',
      createdAt: now,
      updatedAt: now,
    };

    setFeedbackRequests((prev) => [newReq, ...prev]);
    await createDocument(COLLECTIONS.FEEDBACK_REQUESTS, newReq);

    // Notify manager
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: req.managerId,
      title: 'Nova solicitação de feedback',
      message: `${req.employeeName} solicitou feedback sobre "${req.topic}".`,
      type: 'request',
      read: false,
      relatedId: newReq.id,
      createdAt: now,
    };
    setNotifications((prev) => [notif, ...prev]);
    await createDocument(COLLECTIONS.NOTIFICATIONS, notif);

    return newReq.id;
  };

  // Solicitar conversa
  const createConversationRequest = async (req: {
    employeeId: string;
    employeeName: string;
    managerId: string;
    managerName: string;
    type: any;
    message?: string;
  }): Promise<string> => {
    const now = new Date().toISOString();
    const newReq: ConversationRequest = {
      ...req,
      id: `creq-${Date.now()}`,
      status: 'requested',
      createdAt: now,
      updatedAt: now,
    };

    setConversationRequests((prev) => [newReq, ...prev]);
    await createDocument(COLLECTIONS.CONVERSATION_REQUESTS, newReq);

    // Notify manager
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: req.managerId,
      title: 'Solicitação de conversa',
      message: `${req.employeeName} solicitou uma conversa: "${req.type}".`,
      type: 'request',
      read: false,
      relatedId: newReq.id,
      createdAt: now,
    };
    setNotifications((prev) => [notif, ...prev]);
    await createDocument(COLLECTIONS.NOTIFICATIONS, notif);

    return newReq.id;
  };

  const updateRequestStatus = async (
    type: 'feedback' | 'conversation',
    id: string,
    status: 'requested' | 'viewed' | 'scheduled' | 'performed' | 'completed'
  ) => {
    const collectionName =
      type === 'feedback' ? COLLECTIONS.FEEDBACK_REQUESTS : COLLECTIONS.CONVERSATION_REQUESTS;
    const now = new Date().toISOString();

    if (type === 'feedback') {
      setFeedbackRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status, updatedAt: now } : r))
      );
    } else {
      setConversationRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status, updatedAt: now } : r))
      );
    }

    await updateDocument(collectionName, id, { status, updatedAt: now });
  };

  // FLUXO 2 cont: Gestor agenda conversa a partir da solicitação -> cria reunião automaticamente
  const scheduleRequestMeeting = async (
    requestType: 'feedback' | 'conversation',
    requestId: string,
    meetingData: {
      title: string;
      date: string;
      time: string;
      durationMinutes: number;
      location: string;
      notes?: string;
      organizerId: string;
      organizerName: string;
      employeeId: string;
      employeeName: string;
    }
  ): Promise<string> => {
    const now = new Date().toISOString();
    const meetingId = `meet-${Date.now()}`;

    const newMeeting: Meeting = {
      id: meetingId,
      title: meetingData.title,
      description: meetingData.notes || `Reunião agendada a partir da solicitação de ${requestType === 'feedback' ? 'feedback' : 'conversa'}.`,
      date: meetingData.date,
      time: meetingData.time,
      durationMinutes: meetingData.durationMinutes,
      location: meetingData.location,
      organizerId: meetingData.organizerId,
      organizerName: meetingData.organizerName,
      type: requestType === 'feedback' ? 'Feedback' : 'Reunião Individual',
      targetType: 'individual',
      targetParticipantIds: [meetingData.organizerId, meetingData.employeeId],
      status: 'scheduled',
      recurrence: 'none',
      agendaItems: [
        `Alinhamento solicitado por ${meetingData.employeeName}`,
        'Pontos a serem discutidos',
        'Definição de próximos passos e combinados',
      ],
      createdAt: now,
      updatedAt: now,
    };

    setMeetings((prev) => [newMeeting, ...prev]);
    await createDocument(COLLECTIONS.MEETINGS, newMeeting);

    // Update request
    const reqUpdate = {
      status: 'scheduled' as const,
      scheduledDate: `${meetingData.date} às ${meetingData.time}`,
      scheduledMeetingId: meetingId,
      updatedAt: now,
    };

    if (requestType === 'feedback') {
      setFeedbackRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, ...reqUpdate } : r))
      );
      await updateDocument(COLLECTIONS.FEEDBACK_REQUESTS, requestId, reqUpdate);
    } else {
      setConversationRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, ...reqUpdate } : r))
      );
      await updateDocument(COLLECTIONS.CONVERSATION_REQUESTS, requestId, reqUpdate);
    }

    // Notify employee
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: meetingData.employeeId,
      title: 'Conversa agendada com seu gestor',
      message: `${meetingData.organizerName} agendou: "${meetingData.title}" para ${meetingData.date} às ${meetingData.time}.`,
      type: 'meeting',
      read: false,
      relatedId: meetingId,
      createdAt: now,
    };
    setNotifications((prev) => [notif, ...prev]);
    await createDocument(COLLECTIONS.NOTIFICATIONS, notif);

    return meetingId;
  };

  // FLUXO 3: Criar reunião geral / setor / individual com participantes e notificações
  const createMeeting = async (
    meeting: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<string> => {
    const now = new Date().toISOString();
    const meetingId = `meet-${Date.now()}`;

    // Compute participants based on targetType
    let participantIds = meeting.targetParticipantIds || [];
    if (meeting.targetType === 'company') {
      participantIds = users.filter((u) => u.active).map((u) => u.id);
    } else if (meeting.targetType === 'department' && meeting.targetDepartmentId) {
      participantIds = users
        .filter((u) => u.active && u.departmentId === meeting.targetDepartmentId)
        .map((u) => u.id);
    }

    const newMeeting: Meeting = {
      ...meeting,
      id: meetingId,
      targetParticipantIds: participantIds,
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
    };

    setMeetings((prev) => [newMeeting, ...prev]);
    await createDocument(COLLECTIONS.MEETINGS, newMeeting);

    // Notify participants
    for (const uid of participantIds) {
      if (uid !== meeting.organizerId) {
        const notif: NotificationItem = {
          id: `notif-${Date.now()}-${uid}`,
          userId: uid,
          title: meeting.targetType === 'company' ? 'Nova Reunião Geral agendada' : 'Nova reunião agendada',
          message: `Você foi convidado para: "${meeting.title}" no dia ${meeting.date} às ${meeting.time}.`,
          type: 'meeting',
          read: false,
          relatedId: meetingId,
          createdAt: now,
        };
        setNotifications((prev) => [notif, ...prev]);
        createDocument(COLLECTIONS.NOTIFICATIONS, notif).catch(console.warn);
      }
    }

    return meetingId;
  };

  // Confirmação de presença
  const updateMeetingPresence = async (
    meetingId: string,
    userId: string,
    status: ParticipantStatus
  ): Promise<void> => {
    const partRefId = `${meetingId}_${userId}`;
    const user = users.find((u) => u.id === userId);
    const participantPayload = {
      id: partRefId,
      meetingId,
      userId,
      userName: user?.name || 'Participante',
      userEmail: user?.email || '',
      status,
      updatedAt: new Date().toISOString(),
    };
    await createDocument('meetingParticipants', participantPayload);
  };

  const addMeeting = createMeeting;

  const updateMeetingRsvp = async (
    meetingId: string,
    userId: string,
    status: 'confirmed' | 'declined' | 'pending'
  ): Promise<void> => {
    const partStatus: ParticipantStatus =
      status === 'confirmed' ? 'attending' : status === 'declined' ? 'not_attending' : 'pending';
    await updateMeetingPresence(meetingId, userId, partStatus);
    setMeetings((prev) =>
      prev.map((m) =>
        m.id === meetingId ? { ...m, rsvp: { ...(m.rsvp || {}), [userId]: status } } : m
      )
    );
  };

  const updateMeetingAta = async (
    meetingId: string,
    ata: { summary: string; decisions: string; agreements: string; nextSteps: string }
  ): Promise<void> => {
    await saveMeetingMinutes(meetingId, {
      summary: ata.summary,
      topics: '',
      decisions: ata.decisions,
      nextSteps: ata.nextSteps,
      notes: ata.agreements,
    });
  };

  // FLUXO 3 cont & FLUXO 4: Salvar ata da reunião e criar tarefas e combinados
  const saveMeetingMinutes = async (
    meetingId: string,
    minutes: MeetingMinutes,
    newTasks?: Array<{
      title: string;
      description?: string;
      assigneeId: string;
      dueDate: string;
      priority: any;
    }>
  ): Promise<void> => {
    const now = new Date().toISOString();
    const meeting = meetings.find((m) => m.id === meetingId);
    const updatePayload = {
      minutes,
      status: 'completed' as const,
      updatedAt: now,
    };

    setMeetings((prev) =>
      prev.map((m) => (m.id === meetingId ? { ...m, ...updatePayload } : m))
    );
    await updateDocument(COLLECTIONS.MEETINGS, meetingId, updatePayload);

    // If new tasks are included
    if (newTasks && newTasks.length > 0) {
      for (const t of newTasks) {
        const assignee = users.find((u) => u.id === t.assigneeId);
        const taskPayload: Task = {
          id: `tsk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title: t.title,
          description: t.description || '',
          assigneeId: t.assigneeId,
          assigneeName: assignee?.name || 'Responsável',
          creatorId: meeting?.organizerId || 'gestor',
          creatorName: meeting?.organizerName || 'Gestor',
          dueDate: t.dueDate,
          priority: t.priority,
          status: 'Pendente',
          originType: 'meeting',
          originTitle: `Reunião: ${meeting?.title || 'Ata de Reunião'}`,
          originId: meetingId,
          createdAt: now,
          updatedAt: now,
        };

        setTasks((prev) => [taskPayload, ...prev]);
        await createDocument(COLLECTIONS.TASKS, taskPayload);

        // Notify assignee
        const notif: NotificationItem = {
          id: `notif-${Date.now()}-${t.assigneeId}`,
          userId: t.assigneeId,
          title: 'Nova tarefa atribuída a você',
          message: `Você recebeu uma tarefa da reunião "${meeting?.title}": "${t.title}".`,
          type: 'task',
          read: false,
          relatedId: taskPayload.id,
          createdAt: now,
        };
        setNotifications((prev) => [notif, ...prev]);
        createDocument(COLLECTIONS.NOTIFICATIONS, notif).catch(console.warn);
      }
    }
  };

  // FLUXO 4: Gestor cria tarefa e funcionário atualiza status
  const createTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const now = new Date().toISOString();
    const taskId = `tsk-${Date.now()}`;
    const newTask: Task = {
      ...task,
      id: taskId,
      createdAt: now,
      updatedAt: now,
    };

    setTasks((prev) => [newTask, ...prev]);
    await createDocument(COLLECTIONS.TASKS, newTask);

    // Notify assignee
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: newTask.assigneeId,
      title: 'Nova tarefa atribuída',
      message: `Você recebeu uma tarefa: "${newTask.title}". Prazo: ${newTask.dueDate}.`,
      type: 'task',
      read: false,
      relatedId: taskId,
      createdAt: now,
    };
    setNotifications((prev) => [notif, ...prev]);
    await createDocument(COLLECTIONS.NOTIFICATIONS, notif);

    return taskId;
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus): Promise<void> => {
    const now = new Date().toISOString();
    const updatePayload: Partial<Task> = {
      status,
      updatedAt: now,
      ...(status === 'Concluído' ? { completedAt: now } : { completedAt: '' }),
    };

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updatePayload } : t))
    );
    await updateDocument(COLLECTIONS.TASKS, taskId, updatePayload);

    // If completed, notify creator
    const task = tasks.find((t) => t.id === taskId);
    if (task && status === 'Concluído' && task.creatorId !== task.assigneeId) {
      const notif: NotificationItem = {
        id: `notif-${Date.now()}`,
        userId: task.creatorId,
        title: 'Tarefa concluída pela equipe',
        message: `${task.assigneeName} concluiu a tarefa: "${task.title}".`,
        type: 'task',
        read: false,
        relatedId: taskId,
        createdAt: now,
      };
      setNotifications((prev) => [notif, ...prev]);
      createDocument(COLLECTIONS.NOTIFICATIONS, notif).catch(console.warn);
    }
  };

  // Autoavaliação
  const createSelfEvaluation = async (
    data: Omit<SelfEvaluation, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    const now = new Date().toISOString();
    const id = `eval-${Date.now()}`;
    const newEval: SelfEvaluation = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    setSelfEvaluations((prev) => [newEval, ...prev]);
    await createDocument(COLLECTIONS.SELF_EVALUATIONS, newEval);

    // Notify employee
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: data.employeeId,
      title: 'Autoavaliação solicitada',
      message: `${data.managerName} solicitou que você preencha uma autoavaliação antes do feedback.`,
      type: 'feedback',
      read: false,
      relatedId: id,
      createdAt: now,
    };
    setNotifications((prev) => [notif, ...prev]);
    await createDocument(COLLECTIONS.NOTIFICATIONS, notif);

    return id;
  };

  const addSelfEvaluation = async (data: Partial<SelfEvaluation>): Promise<string> => {
    const now = new Date().toISOString();
    const id = `eval-${Date.now()}`;
    const newEval: SelfEvaluation = {
      id,
      employeeId: data.employeeId || 'usr-joao',
      employeeName: data.employeeName || 'Funcionário',
      cycleId: data.cycleId,
      performanceRatingText: data.performanceRatingText,
      achievementsText: data.achievementsText,
      difficultiesText: data.difficultiesText,
      developmentAreaText: data.developmentAreaText,
      companySupportText: data.companySupportText,
      questions: {
        strengths: data.achievementsText || '',
        improvements: data.developmentAreaText || '',
        difficulties: data.difficultiesText || '',
        growthAreas: data.developmentAreaText || '',
        goals: data.performanceRatingText || '',
      },
      status: 'submitted',
      createdAt: now,
      updatedAt: now,
    };
    setSelfEvaluations((prev) => [newEval, ...prev]);
    await createDocument(COLLECTIONS.SELF_EVALUATIONS, newEval);
    return id;
  };

  const submitSelfEvaluation = async (
    id: string,
    answers: SelfEvaluation['questions']
  ): Promise<void> => {
    const now = new Date().toISOString();
    const updatePayload = {
      questions: answers,
      status: 'submitted' as const,
      updatedAt: now,
    };
    setSelfEvaluations((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updatePayload } : e))
    );
    await updateDocument(COLLECTIONS.SELF_EVALUATIONS, id, updatePayload);
  };

  // Notificações
  const markNotificationRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    await updateDocument(COLLECTIONS.NOTIFICATIONS, id, { read: true });
  };

  const markAllNotificationsRead = async (userId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.userId === userId ? { ...n, read: true } : n))
    );
    const userNotifs = notifications.filter((n) => n.userId === userId && !n.read);
    for (const n of userNotifs) {
      updateDocument(COLLECTIONS.NOTIFICATIONS, n.id, { read: true }).catch(console.warn);
    }
  };

  // Admin users, departments, positions
  const addUser = async (user: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const now = new Date().toISOString();
    const id = `usr-${Date.now()}`;
    const newUser: UserProfile = { ...user, id, createdAt: now, updatedAt: now };
    setUsers((prev) => [...prev, newUser]);
    await createDocument(COLLECTIONS.USERS, newUser);
    return id;
  };

  const updateUser = async (id: string, user: Partial<UserProfile>): Promise<void> => {
    const now = new Date().toISOString();
    const payload = { ...user, updatedAt: now };
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...payload } : u)));
    await updateDocument(COLLECTIONS.USERS, id, payload);
  };

  const toggleUserActive = async (id: string, currentActive: boolean): Promise<void> => {
    const now = new Date().toISOString();
    const active = !currentActive;
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, active, updatedAt: now } : u)));
    await updateDocument(COLLECTIONS.USERS, id, { active, updatedAt: now });
  };

  const addDepartment = async (dept: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const now = new Date().toISOString();
    const id = `dept-${Date.now()}`;
    const newDept: Department = { ...dept, id, createdAt: now, updatedAt: now };
    setDepartments((prev) => [...prev, newDept]);
    await createDocument(COLLECTIONS.DEPARTMENTS, newDept);
    return id;
  };

  const updateDepartment = async (id: string, dept: Partial<Department>): Promise<void> => {
    const now = new Date().toISOString();
    const payload = { ...dept, updatedAt: now };
    setDepartments((prev) => prev.map((d) => (d.id === id ? { ...d, ...payload } : d)));
    await updateDocument(COLLECTIONS.DEPARTMENTS, id, payload);
  };

  const addPosition = async (pos: Omit<Position, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const now = new Date().toISOString();
    const id = `pos-${Date.now()}`;
    const newPos: Position = { ...pos, id, createdAt: now, updatedAt: now };
    setPositions((prev) => [...prev, newPos]);
    await createDocument(COLLECTIONS.POSITIONS, newPos);
    return id;
  };

  const updatePosition = async (id: string, pos: Partial<Position>): Promise<void> => {
    const now = new Date().toISOString();
    const payload = { ...pos, updatedAt: now };
    setPositions((prev) => prev.map((p) => (p.id === id ? { ...p, ...payload } : p)));
    await updateDocument(COLLECTIONS.POSITIONS, id, payload);
  };

  const seedDemoData = async () => {
    setIsLoading(true);
    await seedFirestoreIfEmpty();
    setIsLoading(false);
  };

  return (
    <AppDataContext.Provider
      value={{
        users,
        departments,
        positions,
        feedbacks,
        feedbackRequests,
        conversationRequests,
        meetings,
        tasks,
        followUps,
        selfEvaluations,
        notifications,
        isLoading,
        addFeedback,
        completeFollowUp,
        createFeedbackRequest,
        createConversationRequest,
        updateRequestStatus,
        scheduleRequestMeeting,
        createMeeting,
        addMeeting,
        updateMeetingPresence,
        updateMeetingRsvp,
        saveMeetingMinutes,
        updateMeetingAta,
        createTask,
        updateTaskStatus,
        createSelfEvaluation,
        addSelfEvaluation,
        submitSelfEvaluation,
        markNotificationRead,
        markAllNotificationsRead,
        addUser,
        updateUser,
        toggleUserActive,
        addDepartment,
        updateDepartment,
        addPosition,
        updatePosition,
        seedDemoData,
        resetSeedData: seedDemoData,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};
