/**
 * QazMind Admin Platform Types
 * Definitions for Users, Schools, Curriculum, Question Bank, Exams, Audit, Finance, Monitoring, etc.
 */

export type RoleType =
  | 'OWNER'
  | 'PLATFORM_ADMIN'
  | 'CONTENT_MANAGER'
  | 'CONTENT_REVIEWER'
  | 'SUPPORT_AGENT'
  | 'FINANCE_MANAGER'
  | 'ANALYST';

export type UserAccountType = 'student' | 'teacher' | 'school_admin' | 'platform_admin';
export type AccountStatus = 'active' | 'pending_verification' | 'suspended' | 'deactivated';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserAccountType;
  adminRole?: RoleType;
  avatarUrl?: string;
  status: AccountStatus;
  organizationId?: string;
  organizationName?: string;
  registeredAt: string;
  lastActiveAt: string;
  emailVerified: boolean;
  phone?: string;
  city?: string;
  // Student specific
  targetEntScore?: number;
  profileSubjects?: string[];
  completedLessonsCount?: number;
  practiceAttemptsCount?: number;
  examAttemptsCount?: number;
  averageScore?: number;
  // Teacher specific
  assignedClasses?: string[];
  createdAssignmentsCount?: number;
}

export type SchoolType = 'public_school' | 'lyceum' | 'gymnasium' | 'nis' | 'bil' | 'private_school';
export type SchoolApprovalStatus = 'approved' | 'pending_verification' | 'rejected' | 'suspended';
export type LicenseStatus = 'active' | 'trial' | 'expired' | 'past_due' | 'unallocated';

export interface SchoolOrganization {
  id: string;
  name: string;
  city: string;
  type: SchoolType;
  approvalStatus: SchoolApprovalStatus;
  licenseStatus: LicenseStatus;
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  purchasedSeats: number;
  assignedSeats: number;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  binNumber: string;
  submittedAt: string;
  verifiedAt?: string;
  licenseExpiresAt: string;
  classesList?: Array<{ id: string; name: string; studentCount: number; grade: string }>;
}

export type SubjectType = 'mandatory' | 'profile';

export interface SubjectItem {
  id: string;
  code: string;
  nameRu: string;
  nameKz: string;
  description: string;
  type: SubjectType;
  status: 'active' | 'draft' | 'archived';
  topicsCount: number;
  lessonsCount: number;
  questionsCount: number;
  color?: string;
}

export interface TopicItem {
  id: string;
  subjectId: string;
  sectionTitle: string;
  titleRu: string;
  titleKz: string;
  order: number;
  lessonsCount: number;
  status: 'published' | 'draft';
}

export type ContentStatus = 'draft' | 'in_review' | 'changes_requested' | 'approved' | 'published' | 'archived';

export interface LessonContentBlock {
  id: string;
  type:
    | 'heading'
    | 'paragraph'
    | 'important_fact'
    | 'numbered_list'
    | 'bullet_list'
    | 'image'
    | 'table'
    | 'timeline'
    | 'formula'
    | 'quote'
    | 'question_ref'
    | 'callout'
    | 'divider';
  content: string;
  data?: Record<string, any>;
}

export interface LessonItem {
  id: string;
  subjectId: string;
  topicId: string;
  titleRu: string;
  titleKz: string;
  language: 'ru' | 'kz' | 'both';
  status: ContentStatus;
  estimatedMinutes: number;
  difficulty: 'easy' | 'medium' | 'hard';
  learningObjectives: string[];
  blocksRu: LessonContentBlock[];
  blocksKz: LessonContentBlock[];
  author: string;
  reviewer?: string;
  version: number;
  lastModifiedAt: string;
  publishedAt?: string;
}

export type QuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'matching'
  | 'context_group'
  | 'numerical';

export interface QuestionOption {
  id: string;
  textRu: string;
  textKz: string;
  isCorrect?: boolean;
}

export interface MatchingPair {
  id: string;
  leftRu: string;
  leftKz: string;
  rightRu: string;
  rightKz: string;
  correctRightId: string;
}

export interface QuestionItem {
  id: string;
  subjectId: string;
  sectionName: string;
  topicId: string;
  type: QuestionType;
  language: 'ru' | 'kz' | 'both';
  difficulty: 'easy' | 'medium' | 'hard';
  status: ContentStatus;
  points: number;
  // Content
  textRu: string;
  textKz: string;
  imageUrl?: string;
  // Type specific
  options?: QuestionOption[];
  correctOptionIds?: string[];
  matchingPairs?: MatchingPair[];
  numericalAnswer?: number;
  tolerance?: number;
  // Context group
  contextPassageRu?: string;
  contextPassageKz?: string;
  subQuestions?: Array<{
    id: string;
    textRu: string;
    textKz: string;
    options: QuestionOption[];
    correctOptionId: string;
    explanationRu?: string;
    explanationKz?: string;
  }>;
  // Explanations & metadata
  explanationRu: string;
  explanationKz: string;
  sourceReference?: string;
  relatedLessonId?: string;
  tags: string[];
  author: string;
  reviewer?: string;
  reviewerNotes?: string;
  version: number;
  createdAt: string;
  lastModifiedAt: string;
  reportsCount?: number;
}

export interface ExamSpecification {
  id: string;
  title: string;
  year: number;
  version: string;
  totalQuestions: number;
  maxScore: number;
  durationMinutes: number;
  mandatorySubjectConfigs: Array<{
    subjectId: string;
    questionCount: number;
    pointsPerQuestion: number;
  }>;
  profileSubjectConfigs: Array<{
    profilePairName: string;
    subject1Id: string;
    subject1Questions: number;
    subject2Id: string;
    subject2Questions: number;
  }>;
}

export interface ExamItem {
  id: string;
  titleRu: string;
  titleKz: string;
  specificationId: string;
  year: number;
  version: number;
  type: 'official_mock' | 'diagnostic' | 'practice_set' | 'school_olympiad';
  questionCount: number;
  maxScore: number;
  durationMinutes: number;
  status: 'draft' | 'published' | 'archived';
  selectedSubjectIds: string[];
  questionIds: string[];
  passingScore: number;
  publishedAt?: string;
  attemptsCount: number;
  averageScore?: number;
}

export interface AssignmentItem {
  id: string;
  title: string;
  schoolId: string;
  schoolName: string;
  className: string;
  teacherId: string;
  teacherName: string;
  subjectId: string;
  subjectName: string;
  activityType: 'exam_attempt' | 'topic_practice' | 'lesson_study';
  targetResourceTitle: string;
  deadline: string;
  status: 'active' | 'upcoming' | 'completed' | 'expired';
  assignedCount: number;
  completedCount: number;
  averageScore?: number;
  createdAt: string;
}

export interface AuditLogEvent {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: RoleType | string;
  action: string;
  module:
    | 'users'
    | 'schools'
    | 'teachers'
    | 'curriculum'
    | 'questions'
    | 'exams'
    | 'finance'
    | 'roles'
    | 'settings'
    | 'reports';
  resourceType: string;
  resourceId: string;
  resourceTitle: string;
  previousValue?: Record<string, any>;
  newValue?: Record<string, any>;
  status: 'success' | 'failure' | 'warning';
  correlationId: string;
  ipAddress?: string;
}

export interface UserActivityEvent {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserAccountType;
  eventType:
    | 'login'
    | 'register'
    | 'onboarding_complete'
    | 'lesson_started'
    | 'lesson_completed'
    | 'practice_started'
    | 'practice_completed'
    | 'exam_started'
    | 'exam_submitted'
    | 'assignment_submitted'
    | 'profile_updated';
  resourceType: string;
  resourceId?: string;
  resourceName?: string;
  status: 'success' | 'failed';
  metadata?: Record<string, any>;
}

export interface SupportTicket {
  id: string;
  subject: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: UserAccountType;
  category: 'technical' | 'billing' | 'content_error' | 'account' | 'school_inquiry';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'in_progress' | 'waiting_for_user' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  assignedAdmin?: string;
  messages: Array<{
    id: string;
    sender: 'user' | 'agent' | 'system';
    senderName: string;
    text: string;
    timestamp: string;
    isInternalNote?: boolean;
  }>;
}

export interface ContentReport {
  id: string;
  questionId: string;
  questionPreview: string;
  subjectName: string;
  reportType: 'wrong_answer' | 'typo' | 'unclear_wording' | 'translation_error' | 'missing_image' | 'other';
  reporterUserId: string;
  reporterName: string;
  reportDate: string;
  status: 'pending' | 'in_review' | 'resolved' | 'rejected';
  userComment: string;
  resolutionNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface SystemServiceStatus {
  id: string;
  name: string;
  category: 'core' | 'database' | 'storage' | 'communication' | 'workers';
  status: 'healthy' | 'degraded' | 'unavailable' | 'unknown';
  latencyMs: number;
  uptimePercent: number;
  lastChecked: string;
  notes?: string;
}

export interface BackgroundJob {
  id: string;
  name: string;
  type: 'analytics_aggregation' | 'license_reconciliation' | 'email_digest' | 'backup_snapshot' | 'question_indexing';
  createdAt: string;
  status: 'completed' | 'running' | 'queued' | 'failed';
  attempts: number;
  durationMs: number;
  errorReason?: string;
}

export interface PlatformSettings {
  general: {
    platformName: string;
    supportEmail: string;
    defaultLanguage: 'ru' | 'kz';
    allowPublicRegistration: boolean;
    academicYear: string;
  };
  educational: {
    activeEntVersion: string;
    minPassingScore: number;
    defaultPracticeQuestions: number;
    enableContextQuestions: boolean;
    requireDualLanguageForPublish: boolean;
  };
  access: {
    schoolAutoVerification: boolean;
    sessionTimeoutMinutes: number;
    invitationExpiryDays: number;
  };
  maintenance: {
    maintenanceMode: boolean;
    maintenanceMessage: string;
    readOnlyMode: boolean;
  };
}

export interface AdminNotification {
  id: string;
  category: 'school_application' | 'content_report' | 'support_ticket' | 'system_alert' | 'license_expiry' | 'review_request';
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  linkUrl: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}
