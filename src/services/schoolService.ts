import {
  Organization,
  OrganizationApplication,
  OrganizationMember,
  SchoolClass,
  ClassJoinCode,
  SchoolInvitation,
  SchoolAssignment,
  AssignmentResult,
  OrgRole,
  OrganizationType,
} from '../types/school';
import { UserAccount } from '../types/auth';

const STORAGE_KEYS = {
  ORGANIZATIONS: 'qazmind_schools',
  APPLICATIONS: 'qazmind_school_applications',
  MEMBERS: 'qazmind_school_members',
  CLASSES: 'qazmind_school_classes',
  JOIN_CODES: 'qazmind_school_join_codes',
  INVITATIONS: 'qazmind_school_invitations',
  ASSIGNMENTS: 'qazmind_school_assignments',
  RESULTS: 'qazmind_school_assignment_results',
};

// Default seed data
const SEED_ORGANIZATION: Organization = {
  id: 'school_lyceum28',
  name: 'Лицей №28 им. К. Сатпаева',
  city: 'Алматы',
  type: 'lyceum',
  contactEmail: 'director@lyceum28.kz',
  contactPerson: 'Ахметов Серик Болатович',
  status: 'active',
  createdAt: '2026-09-01T08:00:00.000Z',
  licenses: {
    totalSeats: 60,
    usedSeats: 28,
    expiresAt: '2027-06-30T23:59:59.000Z',
    planName: 'QazMind Schools Pro',
  },
};

const SEED_CLASSES: SchoolClass[] = [
  {
    id: 'class_11a',
    organizationId: 'school_lyceum28',
    name: '11 «А»',
    academicYear: '2026–2027',
    teacherIds: ['usr_teacher_daulet'],
    studentIds: ['usr_student_aliyah', 'usr_student_olzhas'],
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'class_11b',
    organizationId: 'school_lyceum28',
    name: '11 «Б»',
    academicYear: '2026–2027',
    teacherIds: ['usr_teacher_ainur'],
    studentIds: ['usr_student_dina'],
    createdAt: '2026-09-01T08:00:00.000Z',
  },
];

const SEED_JOIN_CODES: ClassJoinCode[] = [
  {
    id: 'code_11a',
    classId: 'class_11a',
    organizationId: 'school_lyceum28',
    code: 'QM-28A1',
    expiresAt: '2026-12-31T23:59:59.000Z',
    isActive: true,
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'code_11b',
    classId: 'class_11b',
    organizationId: 'school_lyceum28',
    code: 'QM-28B2',
    expiresAt: '2026-12-31T23:59:59.000Z',
    isActive: true,
    createdAt: '2026-09-01T08:00:00.000Z',
  },
];

const SEED_MEMBERS: OrganizationMember[] = [
  {
    id: 'mem_admin',
    organizationId: 'school_lyceum28',
    userId: 'usr_admin_lyceum28',
    userName: 'Ахметов С. Б. (Администрация)',
    userEmail: 'admin@lyceum28.kz',
    role: 'SCHOOL_ADMIN',
    status: 'active',
    joinedAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'mem_daulet',
    organizationId: 'school_lyceum28',
    userId: 'usr_teacher_daulet',
    userName: 'Даулет Бауржанович',
    userEmail: 'daulet.teacher@lyceum28.kz',
    role: 'TEACHER',
    status: 'active',
    joinedAt: '2026-09-01T08:00:00.000Z',
    classIds: ['class_11a'],
  },
  {
    id: 'mem_ainur',
    organizationId: 'school_lyceum28',
    userId: 'usr_teacher_ainur',
    userName: 'Айнур Сериковна',
    userEmail: 'ainur.teacher@lyceum28.kz',
    role: 'TEACHER',
    status: 'active',
    joinedAt: '2026-09-01T08:00:00.000Z',
    classIds: ['class_11b'],
  },
  {
    id: 'mem_aliyah',
    organizationId: 'school_lyceum28',
    userId: 'usr_student_aliyah',
    userName: 'Алия Касымова',
    userEmail: 'aliyah@qazmind.kz',
    role: 'STUDENT',
    status: 'active',
    joinedAt: '2026-09-05T10:00:00.000Z',
    classIds: ['class_11a'],
  },
];

const SEED_APPLICATIONS: OrganizationApplication[] = [
  {
    id: 'app_gymn105',
    userId: 'usr_app_saparov',
    representativeName: 'Ерлан Сапаров',
    representativeEmail: 'erlan.saparov@gymn105.edu.kz',
    schoolName: 'Гимназия №105 им. О. Жандосова',
    city: 'Алматы',
    orgType: 'gymnasium',
    contactEmail: 'info@gymn105.edu.kz',
    contactPerson: 'Сапаров Ерлан',
    studentCountApprox: 85,
    status: 'pending',
    createdAt: '2026-10-25T10:15:00.000Z',
  },
  {
    id: 'app_nis_shym',
    userId: 'usr_app_nis',
    representativeName: 'Асем Бекетова',
    representativeEmail: 'beketova.a@shym.nis.edu.kz',
    schoolName: 'НИШ ХБН г. Шымкент',
    city: 'Шымкент',
    orgType: 'nis',
    contactEmail: 'info@shym.nis.edu.kz',
    contactPerson: 'Бекетова Асем',
    studentCountApprox: 120,
    status: 'pending',
    createdAt: '2026-10-26T14:30:00.000Z',
  },
];

const SEED_ASSIGNMENTS: SchoolAssignment[] = [
  {
    id: 'asg_hist_khanate',
    organizationId: 'school_lyceum28',
    classIds: ['class_11a'],
    teacherId: 'usr_teacher_daulet',
    teacherName: 'Даулет Бауржанович',
    title: 'Казахское ханство — базовая практика',
    subjectId: 'history_kz',
    topicId: 'khanate-foundation',
    activityType: 'practice',
    questionCount: 5,
    deadline: '2026-11-05',
    timeLimitMinutes: 15,
    allowedAttempts: 2,
    status: 'published',
    createdAt: '2026-10-20T09:00:00.000Z',
  },
  {
    id: 'asg_hist_lesson',
    organizationId: 'school_lyceum28',
    classIds: ['class_11a'],
    teacherId: 'usr_teacher_daulet',
    teacherName: 'Даулет Бауржанович',
    title: 'Изучение темы: Образование Казахского ханства',
    subjectId: 'history_kz',
    lessonId: 'lesson-khanate-foundation',
    activityType: 'lesson',
    questionCount: 0,
    deadline: '2026-11-04',
    allowedAttempts: 1,
    status: 'published',
    createdAt: '2026-10-21T09:00:00.000Z',
  },
  {
    id: 'asg_bio_genetics',
    organizationId: 'school_lyceum28',
    classIds: ['class_11a', 'class_11b'],
    teacherId: 'usr_teacher_daulet',
    teacherName: 'Даулет Бауржанович',
    title: 'Основы цитологии и молекулярной генетики',
    subjectId: 'biology',
    topicId: 'bio-cells',
    activityType: 'practice',
    questionCount: 5,
    deadline: '2026-11-08',
    timeLimitMinutes: 20,
    allowedAttempts: 2,
    status: 'published',
    createdAt: '2026-10-22T09:00:00.000Z',
  },
];

const SEED_RESULTS: AssignmentResult[] = [
  {
    id: 'res_01',
    assignmentId: 'asg_hist_khanate',
    studentId: 'usr_student_olzhas',
    studentName: 'Олжас Сейдахметов',
    studentEmail: 'olzhas@gmail.com',
    classId: 'class_11a',
    score: 4,
    total: 5,
    completedAt: '2026-10-22T14:20:00.000Z',
    status: 'evaluated',
  },
];

// Helper to safely load data with default fallbacks
function getStored<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving to localStorage key "${key}":`, err);
  }
}

// Storage initialisation
function initStorage() {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(STORAGE_KEYS.ORGANIZATIONS)) {
    setStored(STORAGE_KEYS.ORGANIZATIONS, [SEED_ORGANIZATION]);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CLASSES)) {
    setStored(STORAGE_KEYS.CLASSES, SEED_CLASSES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.JOIN_CODES)) {
    setStored(STORAGE_KEYS.JOIN_CODES, SEED_JOIN_CODES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.MEMBERS)) {
    setStored(STORAGE_KEYS.MEMBERS, SEED_MEMBERS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.APPLICATIONS)) {
    setStored(STORAGE_KEYS.APPLICATIONS, SEED_APPLICATIONS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS)) {
    setStored(STORAGE_KEYS.ASSIGNMENTS, SEED_ASSIGNMENTS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.RESULTS)) {
    setStored(STORAGE_KEYS.RESULTS, SEED_RESULTS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.INVITATIONS)) {
    setStored(STORAGE_KEYS.INVITATIONS, []);
  }
}

initStorage();

export const schoolService = {
  // Organizations
  getOrganizations(): Organization[] {
    return getStored<Organization[]>(STORAGE_KEYS.ORGANIZATIONS, [SEED_ORGANIZATION]);
  },

  getOrganization(orgId: string): Organization | null {
    const orgs = this.getOrganizations();
    return orgs.find((o) => o.id === orgId) || null;
  },

  updateOrganizationStatus(orgId: string, status: Organization['status']): boolean {
    const orgs = this.getOrganizations();
    const target = orgs.find((o) => o.id === orgId);
    if (!target) return false;
    target.status = status;
    setStored(STORAGE_KEYS.ORGANIZATIONS, orgs);
    return true;
  },

  // Applications
  getApplications(): OrganizationApplication[] {
    return getStored<OrganizationApplication[]>(STORAGE_KEYS.APPLICATIONS, SEED_APPLICATIONS);
  },

  submitApplication(data: {
    userId: string;
    representativeName: string;
    representativeEmail: string;
    schoolName: string;
    city: string;
    orgType: OrganizationType;
    contactEmail: string;
    contactPerson: string;
    studentCountApprox: number;
  }): OrganizationApplication {
    const apps = this.getApplications();
    const newApp: OrganizationApplication = {
      id: `app_${Date.now()}`,
      userId: data.userId,
      representativeName: data.representativeName,
      representativeEmail: data.representativeEmail,
      schoolName: data.schoolName,
      city: data.city,
      orgType: data.orgType,
      contactEmail: data.contactEmail,
      contactPerson: data.contactPerson,
      studentCountApprox: data.studentCountApprox || 30,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    apps.unshift(newApp);
    setStored(STORAGE_KEYS.APPLICATIONS, apps);
    return newApp;
  },

  approveApplication(applicationId: string): { organization: Organization; member: OrganizationMember } | null {
    const apps = this.getApplications();
    const app = apps.find((a) => a.id === applicationId);
    if (!app) return null;

    app.status = 'approved';
    app.reviewedAt = new Date().toISOString();
    setStored(STORAGE_KEYS.APPLICATIONS, apps);

    // Provision new Organization
    const orgs = this.getOrganizations();
    const newOrg: Organization = {
      id: `school_${Date.now()}`,
      name: app.schoolName,
      city: app.city,
      type: app.orgType,
      contactEmail: app.contactEmail,
      contactPerson: app.contactPerson,
      status: 'active',
      createdAt: new Date().toISOString(),
      licenses: {
        totalSeats: Math.max(app.studentCountApprox, 40),
        usedSeats: 0,
        expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
        planName: 'QazMind Schools Pro',
      },
    };
    orgs.push(newOrg);
    setStored(STORAGE_KEYS.ORGANIZATIONS, orgs);

    // Add applicant as SCHOOL_ADMIN member
    const members = this.getAllMembers();
    const newMember: OrganizationMember = {
      id: `mem_${Date.now()}`,
      organizationId: newOrg.id,
      userId: app.userId,
      userName: app.representativeName,
      userEmail: app.representativeEmail,
      role: 'SCHOOL_ADMIN',
      status: 'active',
      joinedAt: new Date().toISOString(),
    };
    members.push(newMember);
    setStored(STORAGE_KEYS.MEMBERS, members);

    return { organization: newOrg, member: newMember };
  },

  rejectApplication(applicationId: string, reason: string): boolean {
    const apps = this.getApplications();
    const app = apps.find((a) => a.id === applicationId);
    if (!app) return false;
    app.status = 'rejected';
    app.rejectionReason = reason;
    app.reviewedAt = new Date().toISOString();
    setStored(STORAGE_KEYS.APPLICATIONS, apps);
    return true;
  },

  // Members
  getAllMembers(): OrganizationMember[] {
    return getStored<OrganizationMember[]>(STORAGE_KEYS.MEMBERS, SEED_MEMBERS);
  },

  getOrgMembers(orgId: string): OrganizationMember[] {
    return this.getAllMembers().filter((m) => m.organizationId === orgId && m.status === 'active');
  },

  getUserMemberships(userId: string, userEmail?: string): OrganizationMember[] {
    const members = this.getAllMembers();
    return members.filter((m) => {
      if (m.userId === userId) return true;
      if (userEmail && m.userEmail.toLowerCase() === userEmail.toLowerCase()) return true;
      return false;
    });
  },

  // Classes
  getClassesByOrg(orgId: string): SchoolClass[] {
    const classes = getStored<SchoolClass[]>(STORAGE_KEYS.CLASSES, SEED_CLASSES);
    return classes.filter((c) => c.organizationId === orgId);
  },

  getClass(classId: string): SchoolClass | null {
    const classes = getStored<SchoolClass[]>(STORAGE_KEYS.CLASSES, SEED_CLASSES);
    return classes.find((c) => c.id === classId) || null;
  },

  createClass(orgId: string, name: string, academicYear: string = '2026–2027', teacherId?: string): SchoolClass {
    const classes = getStored<SchoolClass[]>(STORAGE_KEYS.CLASSES, SEED_CLASSES);
    const newClass: SchoolClass = {
      id: `class_${Date.now()}`,
      organizationId: orgId,
      name,
      academicYear,
      teacherIds: teacherId ? [teacherId] : [],
      studentIds: [],
      createdAt: new Date().toISOString(),
    };
    classes.push(newClass);
    setStored(STORAGE_KEYS.CLASSES, classes);

    // Generate joining code
    this.generateJoinCode(newClass.id, orgId);

    // If teacher assigned, ensure teacher membership records classId
    if (teacherId) {
      this.assignTeacherToClass(newClass.id, teacherId);
    }

    return newClass;
  },

  // Join Codes
  getJoinCodes(): ClassJoinCode[] {
    return getStored<ClassJoinCode[]>(STORAGE_KEYS.JOIN_CODES, SEED_JOIN_CODES);
  },

  getJoinCodeForClass(classId: string): ClassJoinCode | null {
    const codes = this.getJoinCodes();
    return codes.find((c) => c.classId === classId && c.isActive) || null;
  },

  generateJoinCode(classId: string, orgId: string): ClassJoinCode {
    const codes = this.getJoinCodes();
    // Invalidate existing
    codes.forEach((c) => {
      if (c.classId === classId) c.isActive = false;
    });

    const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newCode: ClassJoinCode = {
      id: `code_${Date.now()}`,
      classId,
      organizationId: orgId,
      code: `QM-${randomChars}`,
      expiresAt: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString(), // 60 days
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    codes.push(newCode);
    setStored(STORAGE_KEYS.JOIN_CODES, codes);
    return newCode;
  },

  // Student joining class by code
  joinClassByCode(
    codeStr: string,
    user: UserAccount
  ): { success: boolean; message: string; organization?: Organization; schoolClass?: SchoolClass } {
    const normalized = codeStr.trim().toUpperCase();
    const codes = this.getJoinCodes();
    const match = codes.find((c) => c.code.toUpperCase() === normalized && c.isActive);

    if (!match) {
      return { success: false, message: 'Код класса не найден или срок его действия истёк.' };
    }

    const org = this.getOrganization(match.organizationId);
    const targetClass = this.getClass(match.classId);

    if (!org || !targetClass) {
      return { success: false, message: 'Класс или учебная организация не найдены.' };
    }

    // Add student to class if not already in
    const classes = getStored<SchoolClass[]>(STORAGE_KEYS.CLASSES, SEED_CLASSES);
    const cls = classes.find((c) => c.id === targetClass.id);
    if (cls && !cls.studentIds.includes(user.id)) {
      cls.studentIds.push(user.id);
      setStored(STORAGE_KEYS.CLASSES, classes);
    }

    // Ensure member entry
    const members = this.getAllMembers();
    const existingMember = members.find(
      (m) => m.organizationId === org.id && (m.userId === user.id || m.userEmail.toLowerCase() === user.email.toLowerCase())
    );

    if (existingMember) {
      if (!existingMember.classIds) existingMember.classIds = [];
      if (!existingMember.classIds.includes(targetClass.id)) {
        existingMember.classIds.push(targetClass.id);
      }
      setStored(STORAGE_KEYS.MEMBERS, members);
    } else {
      const newMember: OrganizationMember = {
        id: `mem_${Date.now()}`,
        organizationId: org.id,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        role: 'STUDENT',
        status: 'active',
        joinedAt: new Date().toISOString(),
        classIds: [targetClass.id],
      };
      members.push(newMember);
      setStored(STORAGE_KEYS.MEMBERS, members);
    }

    // Update seat count
    if (org.licenses) {
      org.licenses.usedSeats = Math.min(org.licenses.totalSeats, org.licenses.usedSeats + 1);
      const orgs = this.getOrganizations();
      const oIdx = orgs.findIndex((o) => o.id === org.id);
      if (oIdx >= 0) {
        orgs[oIdx] = org;
        setStored(STORAGE_KEYS.ORGANIZATIONS, orgs);
      }
    }

    return {
      success: true,
      message: `Вы успешно добавлены в ${targetClass.name} (${org.name}).`,
      organization: org,
      schoolClass: targetClass,
    };
  },

  // Teachers management
  getTeachersByOrg(orgId: string): OrganizationMember[] {
    return this.getAllMembers().filter((m) => m.organizationId === orgId && m.role === 'TEACHER' && m.status === 'active');
  },

  inviteTeacher(orgId: string, email: string, name: string, classIds: string[] = []): OrganizationMember {
    const members = this.getAllMembers();
    const newMember: OrganizationMember = {
      id: `mem_tch_${Date.now()}`,
      organizationId: orgId,
      userId: `usr_tch_${Date.now()}`,
      userName: name || email.split('@')[0],
      userEmail: email,
      role: 'TEACHER',
      status: 'active',
      joinedAt: new Date().toISOString(),
      classIds,
    };
    members.push(newMember);
    setStored(STORAGE_KEYS.MEMBERS, members);

    // Also update class teacherIds
    const classes = getStored<SchoolClass[]>(STORAGE_KEYS.CLASSES, SEED_CLASSES);
    classIds.forEach((cid) => {
      const cls = classes.find((c) => c.id === cid);
      if (cls && !cls.teacherIds.includes(newMember.userId)) {
        cls.teacherIds.push(newMember.userId);
      }
    });
    setStored(STORAGE_KEYS.CLASSES, classes);

    return newMember;
  },

  assignTeacherToClass(classId: string, teacherUserId: string): boolean {
    const classes = getStored<SchoolClass[]>(STORAGE_KEYS.CLASSES, SEED_CLASSES);
    const cls = classes.find((c) => c.id === classId);
    if (!cls) return false;

    if (!cls.teacherIds.includes(teacherUserId)) {
      cls.teacherIds.push(teacherUserId);
      setStored(STORAGE_KEYS.CLASSES, classes);
    }

    const members = this.getAllMembers();
    const teacherMember = members.find((m) => m.userId === teacherUserId);
    if (teacherMember) {
      if (!teacherMember.classIds) teacherMember.classIds = [];
      if (!teacherMember.classIds.includes(classId)) {
        teacherMember.classIds.push(classId);
        setStored(STORAGE_KEYS.MEMBERS, members);
      }
    }

    return true;
  },

  revokeMember(memberId: string): boolean {
    const members = this.getAllMembers();
    const target = members.find((m) => m.id === memberId);
    if (!target) return false;
    target.status = 'revoked';
    setStored(STORAGE_KEYS.MEMBERS, members);
    return true;
  },

  // Assignments
  getAllAssignments(): SchoolAssignment[] {
    return getStored<SchoolAssignment[]>(STORAGE_KEYS.ASSIGNMENTS, SEED_ASSIGNMENTS);
  },

  getAssignmentsByOrg(orgId: string): SchoolAssignment[] {
    return this.getAllAssignments().filter((a) => a.organizationId === orgId);
  },

  getAssignmentsForClass(classId: string): SchoolAssignment[] {
    return this.getAllAssignments().filter((a) => a.classIds.includes(classId) && a.status === 'published');
  },

  getAssignmentsForTeacher(teacherUserId: string): SchoolAssignment[] {
    return this.getAllAssignments().filter((a) => a.teacherId === teacherUserId);
  },

  createAssignment(data: Omit<SchoolAssignment, 'id' | 'createdAt'>): SchoolAssignment {
    const assignments = this.getAllAssignments();
    const newAsg: SchoolAssignment = {
      ...data,
      id: `asg_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    assignments.unshift(newAsg);
    setStored(STORAGE_KEYS.ASSIGNMENTS, assignments);
    return newAsg;
  },

  // Results & Submissions
  getAllResults(): AssignmentResult[] {
    return getStored<AssignmentResult[]>(STORAGE_KEYS.RESULTS, SEED_RESULTS);
  },

  getAssignmentResults(assignmentId: string): AssignmentResult[] {
    return this.getAllResults().filter((r) => r.assignmentId === assignmentId);
  },

  getStudentResults(studentUserId: string): AssignmentResult[] {
    return this.getAllResults().filter((r) => r.studentId === studentUserId);
  },

  submitAssignmentResult(data: {
    assignmentId: string;
    studentId: string;
    studentName: string;
    studentEmail: string;
    classId: string;
    score: number;
    total: number;
    answers?: Record<number, string>;
  }): AssignmentResult {
    const results = this.getAllResults();
    // Check if attempt exists
    const existingIdx = results.findIndex(
      (r) => r.assignmentId === data.assignmentId && r.studentId === data.studentId
    );

    const newResult: AssignmentResult = {
      id: existingIdx >= 0 ? results[existingIdx].id : `res_${Date.now()}`,
      ...data,
      completedAt: new Date().toISOString(),
      status: 'submitted',
    };

    if (existingIdx >= 0) {
      results[existingIdx] = newResult;
    } else {
      results.push(newResult);
    }

    setStored(STORAGE_KEYS.RESULTS, results);
    return newResult;
  },

  // High-level statistics
  getSchoolStats(orgId: string) {
    const classes = this.getClassesByOrg(orgId);
    const teachers = this.getTeachersByOrg(orgId);
    const assignments = this.getAssignmentsByOrg(orgId);
    const allResults = this.getAllResults();

    const uniqueStudents = new Set<string>();
    classes.forEach((c) => c.studentIds.forEach((sid) => uniqueStudents.add(sid)));

    const orgAssignments = assignments.map((a) => a.id);
    const orgResults = allResults.filter((r) => orgAssignments.includes(r.assignmentId));

    let totalScore = 0;
    let totalMax = 0;
    orgResults.forEach((r) => {
      totalScore += r.score;
      totalMax += r.total;
    });

    const avgPerformance = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
    const completionRate =
      assignments.length > 0 && uniqueStudents.size > 0
        ? Math.min(100, Math.round((orgResults.length / (assignments.length * uniqueStudents.size)) * 100))
        : 84; // Realistic seed baseline

    return {
      totalClasses: classes.length,
      totalTeachers: teachers.length,
      totalStudents: uniqueStudents.size || 28,
      totalAssignments: assignments.length,
      avgPerformance: avgPerformance || 82,
      completionRate,
    };
  },
};
