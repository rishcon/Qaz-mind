export type OrgRole = 'STUDENT' | 'TEACHER' | 'SCHOOL_ADMIN' | 'PLATFORM_ADMIN';

export type OrganizationStatus = 'pending' | 'active' | 'suspended' | 'rejected';

export type OrganizationType =
  | 'lyceum'
  | 'gymnasium'
  | 'secondary_school'
  | 'nis'
  | 'bil'
  | 'private'
  | 'prep_center';

export interface SchoolLicense {
  totalSeats: number;
  usedSeats: number;
  expiresAt: string;
  planName: string;
}

export interface Organization {
  id: string;
  name: string;
  city: string;
  type: OrganizationType;
  contactEmail: string;
  contactPerson: string;
  status: OrganizationStatus;
  createdAt: string;
  licenses: SchoolLicense;
}

export interface OrganizationApplication {
  id: string;
  userId: string;
  representativeName: string;
  representativeEmail: string;
  schoolName: string;
  city: string;
  orgType: OrganizationType;
  contactEmail: string;
  contactPerson: string;
  studentCountApprox: number;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: OrgRole;
  status: 'active' | 'pending' | 'revoked';
  joinedAt: string;
  classIds?: string[];
}

export interface SchoolClass {
  id: string;
  organizationId: string;
  name: string; // e.g. "11 «А»"
  academicYear: string; // e.g. "2026–2027"
  teacherIds: string[];
  studentIds: string[];
  createdAt: string;
}

export interface ClassJoinCode {
  id: string;
  classId: string;
  organizationId: string;
  code: string; // e.g. "QM-28A1"
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
}

export interface SchoolInvitation {
  id: string;
  organizationId: string;
  classId?: string;
  email: string;
  role: 'STUDENT' | 'TEACHER';
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  token: string;
  createdAt: string;
  expiresAt: string;
}

export type AssignmentActivityType = 'lesson' | 'practice' | 'test' | 'mock_exam';

export type AssignmentStatus = 'draft' | 'published' | 'closed' | 'archived';

export interface SchoolAssignment {
  id: string;
  organizationId: string;
  classIds: string[];
  teacherId: string;
  teacherName: string;
  title: string;
  subjectId: string;
  topicId?: string;
  activityType: AssignmentActivityType;
  lessonId?: string;
  questionCount: number;
  deadline: string;
  timeLimitMinutes?: number;
  allowedAttempts: number;
  status: AssignmentStatus;
  createdAt: string;
}

export interface AssignmentResult {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  classId: string;
  score: number;
  total: number;
  answers?: Record<number, string>;
  completedAt: string;
  status: 'submitted' | 'evaluated';
}
