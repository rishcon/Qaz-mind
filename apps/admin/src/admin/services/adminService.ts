/**
 * Data layer of the sections that have no server side yet (schools, teachers, exams, assignments, support,
 * reports, finance, settings, user activity). Connected sections use src/admin/api/client.ts instead.
 *
 * QazMind Admin data layer.
 *
 * The administrative API (/api/v1/admin/...) does not exist yet, and administrator sign-in is not implemented.
 * Until both exist, this layer returns NO data: lists are empty, single records are undefined, metrics are null.
 * Every write is refused with AdminNotConnectedError, so no screen can show a change as saved.
 *
 * Nothing in this file is invented. When the API is connected, each function calls it instead
 * (paths are listed in packages/contracts/src/admin.ts, behaviour in docs/API_CONTRACTS.md).
 */

import type {
  AccountStatus,
  AdminNotification,
  AssignmentItem,
  AuditLogEvent,
  BackgroundJob,
  ContentReport,
  ExamItem,
  ExamSpecification,
  LessonItem,
  PlatformSettings,
  QuestionItem,
  RoleType,
  SchoolApprovalStatus,
  SchoolOrganization,
  SubjectItem,
  SupportTicket,
  SystemServiceStatus,
  TopicItem,
  UserAccount,
  UserActivityEvent,
} from '../types';
import type { ImportedQuestionRow } from '../utils/questionCsv';

/** False until the administrative API is served and administrator sign-in works. */
export const ADMIN_API_CONNECTED = false;

export class AdminNotConnectedError extends Error {
  constructor(action: string) {
    super(`Этот раздел ещё не подключён к серверу: «${action}» не выполнено. Изменения не сохранены.`);
    this.name = 'AdminNotConnectedError';
  }
}

function refuse(action: string): never {
  throw new AdminNotConnectedError(action);
}

export interface CurrentAdmin {
  name: string | null;
  email: string | null;
  role: RoleType | null;
}

export interface AttentionItem {
  id: string;
  title: string;
  actionUrl: string;
  count: number | null;
}

export interface OverviewMetrics {
  totalUsers: number | null;
  activeUsers: number | null;
  totalSchools: number | null;
  pendingSchools: number | null;
  totalTeachers: number | null;
  totalExamsCompleted: number | null;
  activeSubscriptions: number | null;
  pendingReviews: number | null;
  pendingReports: number | null;
  openTickets: number | null;
  requiresAttention: AttentionItem[];
  recentActivity: AuditLogEvent[];
}

/** A platform staff account. Roles are granted by the owner; nobody can grant them to themselves. */
export interface StaffMember {
  id: string;
  name: string;
  email: string;
  roles: RoleType[];
  status: 'invited' | 'active' | 'disabled';
  mfaEnabled: boolean;
  lastSignInAt: string | null;
}

export interface SidebarCounters {
  pendingSchools: number | null;
  inReviewQuestions: number | null;
  pendingReports: number | null;
  openTickets: number | null;
  unreadNotifications: number | null;
}

const NOT_LOADED_COUNTERS: SidebarCounters = {
  pendingSchools: null,
  inReviewQuestions: null,
  pendingReports: null,
  openTickets: null,
  unreadNotifications: null,
};

export const adminService = {
  // Identity: there is no signed-in administrator until sign-in is implemented.
  getCurrentAdmin(): CurrentAdmin {
    return { name: null, email: null, role: null };
  },

  // Overview
  getOverviewMetrics(_period: 'today' | '7days' | '30days' | 'all' = '30days'): OverviewMetrics {
    return {
      totalUsers: null,
      activeUsers: null,
      totalSchools: null,
      pendingSchools: null,
      totalTeachers: null,
      totalExamsCompleted: null,
      activeSubscriptions: null,
      pendingReviews: null,
      pendingReports: null,
      openTickets: null,
      requiresAttention: [],
      recentActivity: [],
    };
  },

  getCounters(): SidebarCounters {
    return NOT_LOADED_COUNTERS;
  },

  // Users
  getUsers(_filters?: { search?: string; role?: string; status?: string }): UserAccount[] {
    return [];
  },
  getUserById(_id: string): UserAccount | undefined {
    return undefined;
  },
  updateUserStatus(_userId: string, _newStatus: AccountStatus, _reason?: string): never {
    return refuse('изменение статуса пользователя');
  },
  revokeUserSessions(_userId: string): never {
    return refuse('завершение сессий пользователя');
  },
  getUserActivity(_filters?: { userId?: string; eventType?: string; search?: string }): UserActivityEvent[] {
    return [];
  },

  // Schools
  getSchools(_filters?: { search?: string; status?: string; city?: string }): SchoolOrganization[] {
    return [];
  },
  getSchoolById(_id: string): SchoolOrganization | undefined {
    return undefined;
  },
  getSchoolMembers(_schoolId: string): UserAccount[] {
    return [];
  },
  approveSchool(_schoolId: string): never {
    return refuse('одобрение школы');
  },
  rejectSchool(_schoolId: string, _reason: string): never {
    return refuse('отклонение заявки школы');
  },
  updateSchoolSeats(_schoolId: string, _purchasedSeats: number): never {
    return refuse('изменение лицензионных мест');
  },
  updateSchoolApprovalStatus(_schoolId: string, _status: SchoolApprovalStatus): never {
    return refuse('изменение статуса школы');
  },

  // Subjects and topics
  getSubjects(): SubjectItem[] {
    return [];
  },
  getSubjectById(_id: string): SubjectItem | undefined {
    return undefined;
  },
  createSubject(_subject: Omit<SubjectItem, 'topicsCount' | 'lessonsCount' | 'questionsCount'>): never {
    return refuse('создание предмета');
  },
  updateSubject(_id: string, _updates: Partial<SubjectItem>): never {
    return refuse('изменение предмета');
  },
  getTopics(_subjectId?: string): TopicItem[] {
    return [];
  },
  createTopic(_topic: Omit<TopicItem, 'id' | 'lessonsCount'>): never {
    return refuse('создание темы');
  },

  // Lessons
  getLessons(_filters?: { subjectId?: string; status?: string; search?: string }): LessonItem[] {
    return [];
  },
  getLessonById(_id: string): LessonItem | undefined {
    return undefined;
  },
  saveLesson(_lesson: LessonItem): never {
    return refuse('сохранение урока');
  },
  publishLesson(_id: string): never {
    return refuse('публикация урока');
  },

  // Question bank
  getQuestions(_filters?: {
    subjectId?: string;
    topicId?: string;
    status?: string;
    type?: string;
    search?: string;
  }): QuestionItem[] {
    return [];
  },
  getQuestionById(_id: string): QuestionItem | undefined {
    return undefined;
  },
  saveQuestion(_question: QuestionItem): never {
    return refuse('сохранение вопроса');
  },
  reviewQuestion(_questionId: string, _decision: 'approve' | 'request_changes' | 'reject', _notes: string): never {
    return refuse('рецензирование вопроса');
  },
  importQuestions(_rows: ImportedQuestionRow[]): never {
    return refuse('импорт вопросов');
  },

  // Exams
  getExamSpecifications(): ExamSpecification[] {
    return [];
  },
  getExams(): ExamItem[] {
    return [];
  },
  getExamById(_id: string): ExamItem | undefined {
    return undefined;
  },
  saveExam(_exam: ExamItem): never {
    return refuse('сохранение экзамена');
  },
  publishExam(_examId: string): never {
    return refuse('публикация экзамена');
  },

  // Assignments
  getAssignments(): AssignmentItem[] {
    return [];
  },

  // Audit and activity
  getAuditLogs(_filters?: { module?: string; actor?: string; search?: string }): AuditLogEvent[] {
    return [];
  },

  // Support
  getSupportTickets(_filters?: { status?: string; category?: string; priority?: string }): SupportTicket[] {
    return [];
  },
  addSupportMessage(_ticketId: string, _text: string, _isInternalNote: boolean = false): never {
    return refuse('ответ на обращение');
  },
  updateTicketStatus(_ticketId: string, _status: SupportTicket['status']): never {
    return refuse('смена статуса обращения');
  },

  // Content reports
  getContentReports(_filters?: { status?: string; reportType?: string }): ContentReport[] {
    return [];
  },
  resolveReport(_reportId: string, _action: 'resolved' | 'rejected', _notes: string): never {
    return refuse('решение по жалобе');
  },

  // Monitoring
  getSystemServices(): SystemServiceStatus[] {
    return [];
  },
  getBackgroundJobs(): BackgroundJob[] {
    return [];
  },

  // Notifications
  getNotifications(): AdminNotification[] {
    return [];
  },
  markNotificationAsRead(_id: string): never {
    return refuse('отметка уведомления');
  },
  markAllNotificationsRead(): never {
    return refuse('отметка всех уведомлений');
  },

  // Staff and roles (the owner manages them; sign-in for staff is not implemented yet)
  getStaff(): StaffMember[] {
    return [];
  },
  inviteStaff(_email: string, _roles: RoleType[]): never {
    return refuse('приглашение сотрудника');
  },
  changeStaffRoles(_staffId: string, _roles: RoleType[]): never {
    return refuse('изменение ролей сотрудника');
  },
  disableStaff(_staffId: string): never {
    return refuse('отключение сотрудника');
  },

  // Settings
  getSettings(): PlatformSettings | null {
    return null;
  },
  updateSettings(_updates: Partial<PlatformSettings>): never {
    return refuse('сохранение настроек платформы');
  },
};
