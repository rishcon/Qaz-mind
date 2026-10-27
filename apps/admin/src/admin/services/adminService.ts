/**
 * QazMind Admin Service Layer
 * Models REST API calls to future FastAPI backend (/api/v1/admin/...)
 * Operates on mockDb with reactive state updates and audit event recording.
 */

import { mockDb } from '../repositories/mockDatabase';
import {
  UserAccount,
  SchoolOrganization,
  SubjectItem,
  TopicItem,
  LessonItem,
  QuestionItem,
  ExamItem,
  AssignmentItem,
  AuditLogEvent,
  UserActivityEvent,
  SupportTicket,
  ContentReport,
  RoleType,
  PlatformSettings,
  AdminNotification,
  AccountStatus,
} from '../types';

export const adminService = {
  // Current admin role simulation
  getCurrentAdmin() {
    return {
      name: mockDb.currentAdminName,
      email: mockDb.currentAdminEmail,
      role: mockDb.currentAdminRole,
    };
  },

  setAdminRole(role: RoleType) {
    const prev = mockDb.currentAdminRole;
    mockDb.currentAdminRole = role;
    mockDb.recordAuditEvent(
      'SWITCH_ADMIN_DEMO_ROLE',
      'roles',
      'admin_role',
      role,
      `Роль изменена на ${role}`,
      { role: prev },
      { role }
    );
  },

  // Overview / Dashboard
  getOverviewMetrics(period: 'today' | '7days' | '30days' | 'all' = '30days') {
    const totalUsers = mockDb.users.length;
    const activeUsers = mockDb.users.filter((u) => u.status === 'active').length;
    const totalSchools = mockDb.schools.filter((s) => s.approvalStatus === 'approved').length;
    const pendingSchools = mockDb.schools.filter((s) => s.approvalStatus === 'pending_verification').length;
    const totalTeachers = mockDb.users.filter((u) => u.role === 'teacher').length;
    const totalExamsCompleted = mockDb.exams.reduce((acc, e) => acc + e.attemptsCount, 0);
    // Counts come only from the mock repository. Nothing is added to them to look like a large platform.
    const activeSubscriptions = mockDb.schools.reduce((acc, s) => acc + s.assignedSeats, 0);
    const pendingReviews = mockDb.questions.filter((q) => q.status === 'in_review').length;
    const pendingReports = mockDb.contentReports.filter((r) => r.status === 'pending').length;
    const openTickets = mockDb.supportTickets.filter((t) => t.status === 'new' || t.status === 'in_progress').length;

    return {
      totalUsers,
      activeUsers,
      totalSchools,
      pendingSchools,
      totalTeachers,
      totalExamsCompleted,
      activeSubscriptions,
      pendingReviews,
      pendingReports,
      openTickets,
      requiresAttention: [
        {
          id: 'att-1',
          type: 'school_application',
          title: 'Новая заявка школы: Лицей №2 им. Абая (г. Караганда)',
          actionUrl: '/admin/schools',
          severity: 'warning' as const,
          count: pendingSchools,
        },
        {
          id: 'att-2',
          type: 'content_review',
          title: 'Вопросы на рецензировании методистов ЕНТ',
          actionUrl: '/admin/content/review',
          severity: 'info' as const,
          count: pendingReviews,
        },
        {
          id: 'att-3',
          type: 'content_report',
          title: 'Жалобы учащихся на задания (неточность/перевод)',
          actionUrl: '/admin/reports',
          severity: 'error' as const,
          count: pendingReports,
        },
        {
          id: 'att-4',
          type: 'support_ticket',
          title: 'Обращения школ и пользователей без ответа',
          actionUrl: '/admin/support',
          severity: 'warning' as const,
          count: openTickets,
        },
      ],
      recentActivity: mockDb.auditLogs.slice(0, 6),
    };
  },

  // Users
  getUsers(filters?: { search?: string; role?: string; status?: string }) {
    let list = [...mockDb.users];
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.organizationName?.toLowerCase().includes(q)
      );
    }
    if (filters?.role && filters.role !== 'all') {
      list = list.filter((u) => u.role === filters.role);
    }
    if (filters?.status && filters.status !== 'all') {
      list = list.filter((u) => u.status === filters.status);
    }
    return list;
  },

  getUserById(id: string) {
    return mockDb.users.find((u) => u.id === id);
  },

  updateUserStatus(userId: string, newStatus: AccountStatus, reason?: string) {
    const user = mockDb.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    const oldStatus = user.status;
    user.status = newStatus;

    mockDb.recordAuditEvent(
      newStatus === 'suspended' ? 'SUSPEND_USER' : 'ACTIVATE_USER',
      'users',
      'user_account',
      user.id,
      user.name,
      { status: oldStatus },
      { status: newStatus, reason: reason || 'Изменение статуса администратором' },
      newStatus === 'suspended' ? 'warning' : 'success'
    );
    mockDb.notify();
    return user;
  },

  revokeUserSessions(userId: string) {
    const user = mockDb.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    mockDb.recordAuditEvent(
      'REVOKE_USER_SESSIONS',
      'users',
      'user_account',
      user.id,
      user.name,
      {},
      { revokedAt: new Date().toISOString() }
    );
    return true;
  },

  // Schools
  getSchools(filters?: { search?: string; status?: string; city?: string }) {
    let list = [...mockDb.schools];
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q));
    }
    if (filters?.status && filters.status !== 'all') {
      list = list.filter((s) => s.approvalStatus === filters.status);
    }
    if (filters?.city && filters.city !== 'all') {
      list = list.filter((s) => s.city === filters.city);
    }
    return list;
  },

  getSchoolById(id: string) {
    return mockDb.schools.find((s) => s.id === id);
  },

  approveSchool(schoolId: string) {
    const school = mockDb.schools.find((s) => s.id === schoolId);
    if (!school) throw new Error('School not found');
    const prev = { ...school };
    school.approvalStatus = 'approved';
    school.licenseStatus = 'active';
    school.verifiedAt = new Date().toISOString();

    mockDb.recordAuditEvent(
      'APPROVE_SCHOOL',
      'schools',
      'school_organization',
      school.id,
      school.name,
      { approvalStatus: prev.approvalStatus },
      { approvalStatus: 'approved', licenseStatus: 'active' }
    );
    mockDb.notify();
    return school;
  },

  rejectSchool(schoolId: string, reason: string) {
    const school = mockDb.schools.find((s) => s.id === schoolId);
    if (!school) throw new Error('School not found');
    const prev = { ...school };
    school.approvalStatus = 'rejected';

    mockDb.recordAuditEvent(
      'REJECT_SCHOOL',
      'schools',
      'school_organization',
      school.id,
      school.name,
      { approvalStatus: prev.approvalStatus },
      { approvalStatus: 'rejected', reason }
    );
    mockDb.notify();
    return school;
  },

  updateSchoolSeats(schoolId: string, purchasedSeats: number) {
    const school = mockDb.schools.find((s) => s.id === schoolId);
    if (!school) throw new Error('School not found');
    const prev = school.purchasedSeats;
    school.purchasedSeats = purchasedSeats;

    mockDb.recordAuditEvent(
      'UPDATE_SCHOOL_LICENSES',
      'finance',
      'school_organization',
      school.id,
      school.name,
      { purchasedSeats: prev },
      { purchasedSeats }
    );
    mockDb.notify();
    return school;
  },

  // Subjects & Curriculum
  getSubjects() {
    return [...mockDb.subjects];
  },

  getSubjectById(id: string) {
    return mockDb.subjects.find((s) => s.id === id);
  },

  createSubject(subject: Omit<SubjectItem, 'topicsCount' | 'lessonsCount' | 'questionsCount'>) {
    const newSub: SubjectItem = {
      ...subject,
      topicsCount: 0,
      lessonsCount: 0,
      questionsCount: 0,
    };
    mockDb.subjects.push(newSub);
    mockDb.recordAuditEvent(
      'CREATE_SUBJECT',
      'curriculum',
      'subject_item',
      newSub.id,
      newSub.nameRu,
      {},
      { nameRu: newSub.nameRu, type: newSub.type }
    );
    mockDb.notify();
    return newSub;
  },

  updateSubject(id: string, updates: Partial<SubjectItem>) {
    const sub = mockDb.subjects.find((s) => s.id === id);
    if (!sub) throw new Error('Subject not found');
    const prev = { ...sub };
    Object.assign(sub, updates);
    mockDb.recordAuditEvent(
      'UPDATE_SUBJECT',
      'curriculum',
      'subject_item',
      sub.id,
      sub.nameRu,
      prev,
      updates
    );
    mockDb.notify();
    return sub;
  },

  getTopics(subjectId?: string) {
    if (subjectId) {
      return mockDb.topics.filter((t) => t.subjectId === subjectId);
    }
    return [...mockDb.topics];
  },

  createTopic(topic: Omit<TopicItem, 'id' | 'lessonsCount'>) {
    const newTopic: TopicItem = {
      ...topic,
      id: `top-${Date.now().toString(36)}`,
      lessonsCount: 0,
    };
    mockDb.topics.push(newTopic);
    const sub = mockDb.subjects.find((s) => s.id === topic.subjectId);
    if (sub) sub.topicsCount++;
    mockDb.recordAuditEvent(
      'CREATE_TOPIC',
      'curriculum',
      'topic_item',
      newTopic.id,
      newTopic.titleRu,
      {},
      { titleRu: newTopic.titleRu }
    );
    mockDb.notify();
    return newTopic;
  },

  // Lessons
  getLessons(filters?: { subjectId?: string; status?: string; search?: string }) {
    let list = [...mockDb.lessons];
    if (filters?.subjectId && filters.subjectId !== 'all') {
      list = list.filter((l) => l.subjectId === filters.subjectId);
    }
    if (filters?.status && filters.status !== 'all') {
      list = list.filter((l) => l.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter((l) => l.titleRu.toLowerCase().includes(q) || l.titleKz.toLowerCase().includes(q));
    }
    return list;
  },

  getLessonById(id: string) {
    return mockDb.lessons.find((l) => l.id === id);
  },

  saveLesson(lesson: LessonItem) {
    const index = mockDb.lessons.findIndex((l) => l.id === lesson.id);
    if (index >= 0) {
      const prev = { ...mockDb.lessons[index] };
      lesson.lastModifiedAt = new Date().toISOString();
      mockDb.lessons[index] = lesson;
      mockDb.recordAuditEvent(
        'UPDATE_LESSON',
        'curriculum',
        'lesson_item',
        lesson.id,
        lesson.titleRu,
        { status: prev.status, version: prev.version },
        { status: lesson.status, version: lesson.version }
      );
    } else {
      lesson.lastModifiedAt = new Date().toISOString();
      mockDb.lessons.push(lesson);
      mockDb.recordAuditEvent(
        'CREATE_LESSON',
        'curriculum',
        'lesson_item',
        lesson.id,
        lesson.titleRu,
        {},
        { status: lesson.status }
      );
    }
    mockDb.notify();
    return lesson;
  },

  publishLesson(id: string) {
    const l = mockDb.lessons.find((item) => item.id === id);
    if (!l) throw new Error('Lesson not found');
    const prev = l.status;
    l.status = 'published';
    l.publishedAt = new Date().toISOString();
    mockDb.recordAuditEvent(
      'PUBLISH_LESSON',
      'curriculum',
      'lesson_item',
      l.id,
      l.titleRu,
      { status: prev },
      { status: 'published' }
    );
    mockDb.notify();
    return l;
  },

  // Question Bank
  getQuestions(filters?: {
    subjectId?: string;
    topicId?: string;
    type?: string;
    status?: string;
    difficulty?: string;
    search?: string;
  }) {
    let list = [...mockDb.questions];
    if (filters?.subjectId && filters.subjectId !== 'all') {
      list = list.filter((q) => q.subjectId === filters.subjectId);
    }
    if (filters?.topicId && filters.topicId !== 'all') {
      list = list.filter((q) => q.topicId === filters.topicId);
    }
    if (filters?.type && filters.type !== 'all') {
      list = list.filter((q) => q.type === filters.type);
    }
    if (filters?.status && filters.status !== 'all') {
      list = list.filter((q) => q.status === filters.status);
    }
    if (filters?.difficulty && filters.difficulty !== 'all') {
      list = list.filter((q) => q.difficulty === filters.difficulty);
    }
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      list = list.filter(
        (q) =>
          q.id.toLowerCase().includes(s) ||
          q.textRu.toLowerCase().includes(s) ||
          q.textKz.toLowerCase().includes(s) ||
          q.tags.some((t) => t.toLowerCase().includes(s))
      );
    }
    return list;
  },

  getQuestionById(id: string) {
    return mockDb.questions.find((q) => q.id === id);
  },

  saveQuestion(question: QuestionItem) {
    const idx = mockDb.questions.findIndex((q) => q.id === question.id);
    question.lastModifiedAt = new Date().toISOString();
    if (idx >= 0) {
      const prev = { ...mockDb.questions[idx] };
      mockDb.questions[idx] = question;
      mockDb.recordAuditEvent(
        'UPDATE_QUESTION',
        'questions',
        'question_item',
        question.id,
        question.textRu.slice(0, 40) + '...',
        { status: prev.status, version: prev.version },
        { status: question.status, version: question.version }
      );
    } else {
      mockDb.questions.unshift(question);
      mockDb.recordAuditEvent(
        'CREATE_QUESTION',
        'questions',
        'question_item',
        question.id,
        question.textRu.slice(0, 40) + '...',
        {},
        { status: question.status, type: question.type }
      );
    }
    mockDb.notify();
    return question;
  },

  reviewQuestion(
    questionId: string,
    action: 'approve' | 'request_changes' | 'reject' | 'publish',
    reviewerNotes?: string
  ) {
    const q = mockDb.questions.find((item) => item.id === questionId);
    if (!q) throw new Error('Question not found');
    const prevStatus = q.status;

    if (action === 'approve') q.status = 'approved';
    else if (action === 'publish') q.status = 'published';
    else if (action === 'request_changes') q.status = 'changes_requested';
    else if (action === 'reject') q.status = 'archived';

    q.reviewer = mockDb.currentAdminName;
    q.reviewerNotes = reviewerNotes;
    q.lastModifiedAt = new Date().toISOString();

    mockDb.recordAuditEvent(
      `QUESTION_${action.toUpperCase()}`,
      'questions',
      'question_item',
      q.id,
      q.textRu.slice(0, 40) + '...',
      { status: prevStatus },
      { status: q.status, reviewerNotes }
    );
    mockDb.notify();
    return q;
  },

  importQuestions(importedQuestions: QuestionItem[]) {
    for (const q of importedQuestions) {
      mockDb.questions.unshift(q);
    }
    mockDb.recordAuditEvent(
      'IMPORT_QUESTIONS_BATCH',
      'questions',
      'batch_import',
      `batch-${Date.now()}`,
      `Импортировано вопросов: ${importedQuestions.length}`,
      {},
      { count: importedQuestions.length }
    );
    mockDb.notify();
    return importedQuestions.length;
  },

  // Exams
  getExams() {
    return [...mockDb.exams];
  },

  getExamById(id: string) {
    return mockDb.exams.find((e) => e.id === id);
  },

  saveExam(exam: ExamItem) {
    const idx = mockDb.exams.findIndex((e) => e.id === exam.id);
    if (idx >= 0) {
      const prev = { ...mockDb.exams[idx] };
      mockDb.exams[idx] = exam;
      mockDb.recordAuditEvent(
        'UPDATE_EXAM',
        'exams',
        'exam_item',
        exam.id,
        exam.titleRu,
        { status: prev.status },
        { status: exam.status, questionCount: exam.questionCount }
      );
    } else {
      mockDb.exams.unshift(exam);
      mockDb.recordAuditEvent(
        'CREATE_EXAM',
        'exams',
        'exam_item',
        exam.id,
        exam.titleRu,
        {},
        { status: exam.status }
      );
    }
    mockDb.notify();
    return exam;
  },

  publishExam(examId: string) {
    const exam = mockDb.exams.find((e) => e.id === examId);
    if (!exam) throw new Error('Exam not found');
    const prev = exam.status;
    exam.status = 'published';
    exam.publishedAt = new Date().toISOString();

    mockDb.recordAuditEvent(
      'PUBLISH_EXAM',
      'exams',
      'exam_item',
      exam.id,
      exam.titleRu,
      { status: prev },
      { status: 'published' }
    );
    mockDb.notify();
    return exam;
  },

  // Assignments
  getAssignments() {
    return [...mockDb.assignments];
  },

  // Audit Logs
  getAuditLogs(filters?: { module?: string; actor?: string; search?: string }) {
    let list = [...mockDb.auditLogs];
    if (filters?.module && filters.module !== 'all') {
      list = list.filter((a) => a.module === filters.module);
    }
    if (filters?.actor && filters.actor !== 'all') {
      list = list.filter((a) => a.actorName.toLowerCase().includes(filters.actor!.toLowerCase()));
    }
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      list = list.filter(
        (a) =>
          a.action.toLowerCase().includes(s) ||
          a.resourceTitle.toLowerCase().includes(s) ||
          a.actorName.toLowerCase().includes(s)
      );
    }
    return list;
  },

  // User Activity Timeline
  getUserActivity(filters?: { eventType?: string; search?: string }) {
    let list = [...mockDb.userActivity];
    if (filters?.eventType && filters.eventType !== 'all') {
      list = list.filter((ev) => ev.eventType === filters.eventType);
    }
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      list = list.filter((ev) => ev.userName.toLowerCase().includes(s) || ev.resourceName?.toLowerCase().includes(s));
    }
    return list;
  },

  // Support Tickets
  getSupportTickets(filters?: { status?: string; category?: string; priority?: string }) {
    let list = [...mockDb.supportTickets];
    if (filters?.status && filters.status !== 'all') {
      list = list.filter((t) => t.status === filters.status);
    }
    if (filters?.category && filters.category !== 'all') {
      list = list.filter((t) => t.category === filters.category);
    }
    if (filters?.priority && filters.priority !== 'all') {
      list = list.filter((t) => t.priority === filters.priority);
    }
    return list;
  },

  addSupportMessage(ticketId: string, text: string, isInternalNote: boolean = false) {
    const t = mockDb.supportTickets.find((ticket) => ticket.id === ticketId);
    if (!t) throw new Error('Ticket not found');
    const msg = {
      id: `msg-${Date.now()}`,
      sender: 'agent' as const,
      senderName: mockDb.currentAdminName,
      text,
      timestamp: new Date().toISOString(),
      isInternalNote,
    };
    t.messages.push(msg);
    t.updatedAt = msg.timestamp;
    if (!isInternalNote && t.status === 'new') {
      t.status = 'in_progress';
    }
    mockDb.notify();
    return msg;
  },

  updateTicketStatus(ticketId: string, status: SupportTicket['status']) {
    const t = mockDb.supportTickets.find((ticket) => ticket.id === ticketId);
    if (!t) throw new Error('Ticket not found');
    const prev = t.status;
    t.status = status;
    t.updatedAt = new Date().toISOString();
    mockDb.recordAuditEvent(
      'UPDATE_SUPPORT_TICKET_STATUS',
      'users',
      'support_ticket',
      t.id,
      t.subject,
      { status: prev },
      { status }
    );
    mockDb.notify();
    return t;
  },

  // Content Reports
  getContentReports(filters?: { status?: string; reportType?: string }) {
    let list = [...mockDb.contentReports];
    if (filters?.status && filters.status !== 'all') {
      list = list.filter((r) => r.status === filters.status);
    }
    if (filters?.reportType && filters.reportType !== 'all') {
      list = list.filter((r) => r.reportType === filters.reportType);
    }
    return list;
  },

  resolveReport(reportId: string, action: 'resolved' | 'rejected', notes: string) {
    const r = mockDb.contentReports.find((item) => item.id === reportId);
    if (!r) throw new Error('Report not found');
    const prev = r.status;
    r.status = action;
    r.resolutionNotes = notes;
    r.resolvedAt = new Date().toISOString();
    r.resolvedBy = mockDb.currentAdminName;

    mockDb.recordAuditEvent(
      'RESOLVE_CONTENT_REPORT',
      'reports',
      'content_report',
      r.id,
      `Жалоба на вопрос ${r.questionId}`,
      { status: prev },
      { status: action, resolutionNotes: notes }
    );
    mockDb.notify();
    return r;
  },

  // Monitoring
  getSystemServices() {
    return [...mockDb.systemServices];
  },

  getBackgroundJobs() {
    return [...mockDb.backgroundJobs];
  },

  // Notifications
  getNotifications() {
    return [...mockDb.notifications];
  },

  markNotificationAsRead(id: string) {
    const n = mockDb.notifications.find((notif) => notif.id === id);
    if (n) {
      n.isRead = true;
      mockDb.notify();
    }
  },

  // Settings
  getSettings() {
    return { ...mockDb.settings };
  },

  updateSettings(updates: Partial<PlatformSettings>) {
    const prev = { ...mockDb.settings };
    mockDb.settings = { ...mockDb.settings, ...updates };
    mockDb.recordAuditEvent(
      'UPDATE_PLATFORM_SETTINGS',
      'settings',
      'platform_settings',
      'global_config',
      'Обновление конфигурации платформы',
      prev,
      mockDb.settings
    );
    mockDb.notify();
    return mockDb.settings;
  },
};
