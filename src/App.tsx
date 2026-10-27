import React, { useState, useEffect } from 'react';
import { Language } from './types';
import {
  DashboardView,
  StudentProfile,
  DailyTask,
  MistakeItem,
} from './types/dashboard';
import { UserAccount } from './types/auth';
import { initialStudentProfile, initialDailyTasks } from './content/studentData';
import {
  Organization,
  SchoolClass,
  SchoolAssignment,
  AssignmentResult,
  OrganizationMember,
} from './types/school';
import { schoolService } from './services/schoolService';
import { DEMO_MODE } from './config';
import { useAuth } from './auth/AuthProvider';
import { authApi, learningApi, MeResponse, OnboardingPayload, profileApi, ProfilePatch } from './api/endpoints';
import { toProfilePatch, toStudentProfile } from './api/mappers';
import { UnavailablePage } from './components/common/UnavailablePage';
import { ResetPasswordPage } from './components/auth/ResetPasswordPage';

// Landing Page Components
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { ProblemSection } from './components/ProblemSection';
import { ApproachSection } from './components/ApproachSection';
import { ProductExperienceSection } from './components/ProductExperienceSection';
import { SchoolSection } from './components/landing/SchoolSection';
import { RouteSection } from './components/RouteSection';
import { ExamPracticeSection } from './components/ExamPracticeSection';
import { SubjectsSection } from './components/SubjectsSection';
import { PricingSection } from './components/PricingSection';
import { FinalCtaSection } from './components/FinalCtaSection';
import { Footer } from './components/Footer';

// Schools Ecosystem Pages
import { SchoolLandingPage } from './components/schools/SchoolLandingPage';
import { SchoolApplyPage } from './components/schools/SchoolApplyPage';
import { PlatformAdminPage } from './components/admin/PlatformAdminPage';
import { SchoolAdminShell, SchoolAdminView } from './components/school/SchoolAdminShell';
import { SchoolOverviewView } from './components/school/SchoolOverviewView';
import { SchoolClassesView } from './components/school/SchoolClassesView';
import { SchoolTeachersView } from './components/school/SchoolTeachersView';
import { SchoolAssignmentsView } from './components/school/SchoolAssignmentsView';
import { SchoolAnalyticsView } from './components/school/SchoolAnalyticsView';
import { SchoolAccessView } from './components/school/SchoolAccessView';

// Teacher Workspace
import { TeacherShell, TeacherView } from './components/teacher/TeacherShell';
import { TeacherHomeView } from './components/teacher/TeacherHomeView';
import { TeacherCreateAssignmentModal } from './components/teacher/TeacherCreateAssignmentModal';

// Dedicated Auth Components (Layout A)
import { RegisterPage } from './components/auth/RegisterPage';
import { LoginPage } from './components/auth/LoginPage';
import { VerifyEmailPage } from './components/auth/VerifyEmailPage';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';

// Post-Registration Onboarding
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';

// Workspace Components (Layout B)
import { DashboardShell } from './components/dashboard/DashboardShell';
import { TodayView } from './components/dashboard/TodayView';
import { RouteView } from './components/dashboard/RouteView';
import { SubjectsView } from './components/dashboard/SubjectsView';
import { PracticeView } from './components/dashboard/PracticeView';
import { MockExamView } from './components/dashboard/MockExamView';
import { MistakesView } from './components/dashboard/MistakesView';
import { ProgressView, ExamHistoryRecord } from './components/dashboard/ProgressView';
import { SettingsView } from './components/dashboard/SettingsView';
import { WorkspaceOption } from './components/common/WorkspaceSwitcher';

// Focus Mode Experiences (Layout C)
import { FocusLessonReader } from './components/focus/FocusLessonReader';
import { FocusPracticeSession } from './components/focus/FocusPracticeSession';
import { FocusMockExamSession } from './components/focus/FocusMockExamSession';
import { FocusMockExamResults } from './components/focus/FocusMockExamResults';
import { FocusMistakeReview } from './components/focus/FocusMistakeReview';

type AppRoute =
  | 'landing'
  | 'schools'
  | 'schools_apply'
  | 'school'
  | 'teacher'
  | 'platform_admin'
  | 'login'
  | 'register'
  | 'verify-email'
  | 'forgot-password'
  | 'reset-password'
  | 'onboarding'
  | 'app'
  | 'focus_lesson'
  | 'focus_practice'
  | 'focus_exam'
  | 'focus_exam_results'
  | 'focus_mistake_review';

export default function App() {
  // Sync initial route from URL path or default to landing
  const getInitialRoute = (): AppRoute => {
    const path = window.location.pathname;

    if (path === '/schools') return 'schools';
    if (path === '/schools/apply') return 'schools_apply';
    if (path.startsWith('/school')) return 'school';
    if (path.startsWith('/teacher')) return 'teacher';
    if (path.startsWith('/admin')) return 'platform_admin';
    if (path === '/login') return 'login';
    if (path === '/register') return 'register';
    if (path === '/verify-email') return 'verify-email';
    if (path === '/forgot-password') return 'forgot-password';
    if (path === '/reset-password') return 'reset-password';
    if (path === '/onboarding') return 'onboarding';
    if (path.startsWith('/app')) return 'app';
    if (path.startsWith('/learn')) return 'focus_lesson';
    if (path.startsWith('/practice/session')) return 'focus_practice';
    if (path.startsWith('/exam/session')) return 'focus_exam';
    if (path.startsWith('/exam/results')) return 'focus_exam_results';
    if (path.startsWith('/review')) return 'focus_mistake_review';

    return 'landing';
  };

  const [currentRoute, setCurrentRoute] = useState<AppRoute>(getInitialRoute);
  const [currentLang, setCurrentLang] = useState<Language>('ru');

  // Identity and profile come from the server (AuthProvider). Nothing here is read from localStorage for identity.
  const auth = useAuth();
  const currentUser: UserAccount | null = auth.user
    ? {
        id: auth.user.id,
        name: auth.user.name,
        email: auth.user.email,
        isEmailVerified: auth.user.email_verified,
        createdAt: auth.user.created_at,
      }
    : null;
  const onboardingCompleted = auth.onboardingCompleted;
  const profile: StudentProfile = auth.profile
    ? toStudentProfile(auth.user?.name ?? '', auth.profile)
    : initialStudentProfile;

  // Progress that is not on the server yet (stage 4 moves it to the API). Keys are scoped to the signed-in
  // user, and App is remounted when the user changes, so one person never sees another's progress.
  const userId = auth.user?.id ?? 'anonymous';
  const storageKey = (name: string) => `qazmind:${userId}:${name}`;
  const readLocal = <T,>(name: string, fallback: T): T => {
    try {
      const raw = localStorage.getItem(storageKey(name));
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  };
  const writeLocal = (name: string, value: unknown) => {
    try {
      localStorage.setItem(storageKey(name), JSON.stringify(value));
    } catch {}
  };
  const pendingEmail = (() => {
    try {
      return sessionStorage.getItem('qazmind_pending_email') || '';
    } catch {
      return '';
    }
  })();

  // Learning Progress State
  // Completed lessons come from the server (GET /me/progress); see the effect below.
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);

  const [examHistory, setExamHistory] = useState<ExamHistoryRecord[]>(() =>
    readLocal<ExamHistoryRecord[]>('exam_history', [])
  );

  const [practicedCount, setPracticedCount] = useState<number>(() => readLocal<number>('practiced_count', 0));

  // Starts empty: the prototype's sample mistakes must not appear in a real account.
  const [mistakesList, setMistakesList] = useState<MistakeItem[]>(() => readLocal<MistakeItem[]>('mistakes', []));

  // Dashboard Navigation View
  const [dashboardView, setDashboardView] = useState<DashboardView>('today');
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>(initialDailyTasks);

  // Active Focus Mode parameters
  const [activeLessonSlug, setActiveLessonSlug] = useState<string>('khanate-foundation');
  const [activeSubjectId, setActiveSubjectId] = useState<string>('history_kz');
  const [activePracticeCount, setActivePracticeCount] = useState<number>(5);
  const [activeMistakeReviewItem, setActiveMistakeReviewItem] = useState<MistakeItem | null>(null);
  const [activeSchoolAssignment, setActiveSchoolAssignment] = useState<SchoolAssignment | null>(null);

  // Active Exam Results State
  const [lastExamResult, setLastExamResult] = useState<{
    score: number;
    total: number;
    answers: Record<number, string>;
    durationTakenSeconds: number;
  }>({
    score: 0,
    total: 5,
    answers: {},
    durationTakenSeconds: 0,
  });

  // --- SCHOOL ECOSYSTEM STATE ---
  const [activeSchoolId, setActiveSchoolId] = useState<string>('school_lyceum28');
  const [schoolAdminView, setSchoolAdminView] = useState<SchoolAdminView>('overview');
  const [selectedSchoolClassId, setSelectedSchoolClassId] = useState<string | null>(null);
  const [teacherView, setTeacherView] = useState<TeacherView>('classes');
  const [isTeacherCreateModalOpen, setIsTeacherCreateModalOpen] = useState(false);

  // Derived school data
  const currentSchool = schoolService.getOrganization(activeSchoolId) || schoolService.getOrganizations()[0];
  const schoolClasses = schoolService.getClassesByOrg(activeSchoolId);
  const schoolTeachers = schoolService.getTeachersByOrg(activeSchoolId);
  const schoolAssignments = schoolService.getAssignmentsByOrg(activeSchoolId);

  // Teacher assigned classes (for default teacher Даулет)
  const teacherUserId = 'usr_teacher_daulet';
  const teacherName = 'Даулет Бауржанович';
  const teacherClasses = schoolClasses.filter(
    (c) => c.teacherIds.includes(teacherUserId) || c.id === 'class_11a'
  );
  const teacherAssignments = schoolAssignments.filter(
    (a) => a.teacherId === teacherUserId || a.classIds.includes('class_11a')
  );

  // Student affiliation (check if student is enrolled in any class)
  const [studentEnrolledClass, setStudentEnrolledClass] = useState<{
    schoolName: string;
    className: string;
    classId: string;
  } | null>(() => {
    const stored = readLocal<{ schoolName: string; className: string; classId: string } | null>('student_class', null);
    if (stored) return stored;
    // Only the demo build pre-enrolls the user in the prototype class. A real account starts with no school.
    return DEMO_MODE
      ? { schoolName: 'Лицей №28 им. К. Сатпаева', className: '11 «А»', classId: 'class_11a' }
      : null;
  });

  // URL synchronization helper
  const navigateTo = (route: AppRoute, pathUrl?: string) => {
    setCurrentRoute(route);
    const targetUrl =
      pathUrl ||
      (route === 'landing'
        ? '/'
        : route === 'schools'
        ? '/schools'
        : route === 'schools_apply'
        ? '/schools/apply'
        : route === 'school'
        ? '/school'
        : route === 'teacher'
        ? '/teacher'
        : route === 'platform_admin'
        ? '/admin/schools'
        : `/${route}`);

    if (window.location.pathname !== targetUrl) {
      window.history.pushState({}, '', targetUrl);
    }
    window.scrollTo(0, 0);
  };

  // Popstate listener
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(getInitialRoute());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync profile & storage changes
  useEffect(() => {
    if (!auth.user) return;
    learningApi
      .myProgress()
      .then((records) => setCompletedLessonIds(records.filter((r) => r.state === 'completed').map((r) => r.lesson_slug)))
      .catch(() => setCompletedLessonIds([]));
  }, [auth.user?.id]);
  useEffect(() => writeLocal('exam_history', examHistory), [examHistory]);
  useEffect(() => writeLocal('practiced_count', practicedCount), [practicedCount]);
  useEffect(() => writeLocal('mistakes', mistakesList), [mistakesList]);
  useEffect(() => {
    if (studentEnrolledClass) writeLocal('student_class', studentEnrolledClass);
  }, [studentEnrolledClass]);

  // Auth gating: personal study and focus screens need a session; study needs a completed onboarding.
  const sessionRoutes: AppRoute[] = [
    'app',
    'onboarding',
    'focus_lesson',
    'focus_practice',
    'focus_exam',
    'focus_exam_results',
    'focus_mistake_review',
  ];
  useEffect(() => {
    if (auth.status === 'loading' || !sessionRoutes.includes(currentRoute)) return;
    if (!auth.user) {
      navigateTo('login', '/login');
    } else if (!onboardingCompleted && currentRoute !== 'onboarding') {
      navigateTo('onboarding', '/onboarding');
    }
  }, [currentRoute, auth.status, auth.user, onboardingCompleted]);

  // Opens a session returned by the server. The URL is changed first: the app remounts for the new user
  // and reads its screen from the URL.
  const openSession = async (me: MeResponse) => {
    window.history.pushState({}, '', me.onboarding_completed ? '/app' : '/onboarding');
    await auth.applySession(me);
  };

  const handleRegister = async (name: string, email: string, password: string) => {
    await authApi.register(name, email, password);
    try {
      sessionStorage.setItem('qazmind_pending_email', email);
    } catch {}
    navigateTo('verify-email', '/verify-email');
  };

  const handleVerifyEmail = async (token: string) => {
    const me = await authApi.verifyEmail(token);
    try {
      sessionStorage.removeItem('qazmind_pending_email');
    } catch {}
    await openSession(me);
  };

  const handleLogin = async (email: string, password: string) => {
    const me = await authApi.login(email, password);
    await openSession(me);
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Even if the request fails, the local session is dropped below.
    }
    window.history.pushState({}, '', '/');
    auth.clearSession();
  };

  const handleOnboardingSubmit = async (payload: OnboardingPayload) => {
    await profileApi.completeOnboarding(payload);
    await auth.refreshProfile();
    navigateTo('app', '/app');
    setDashboardView('today');
  };

  // Settings screen: only server-stored fields are saved.
  const handleUpdateProfile = async (updated: Partial<StudentProfile>) => {
    const patch: ProfilePatch = toProfilePatch(updated);
    if (Object.keys(patch).length === 0) return;
    await profileApi.updateProfile(patch);
    await auth.refreshProfile();
  };

  // Handler: Start Lesson in Focus Mode (Layout C)
  // Personal flows must not inherit a school assignment left over from an earlier, exited session.
  const handleStartLesson = (lessonSlug: string, subjectId: string) => {
    setActiveSchoolAssignment(null);
    setActiveLessonSlug(lessonSlug);
    setActiveSubjectId(subjectId);
    navigateTo('focus_lesson', `/learn/${subjectId}/${lessonSlug}`);
  };

  // Handler: Complete Lesson
  // The reader has already stored the completion on the server; this only updates the local list.
  const handleCompleteLesson = (lessonSlug: string) => {
    if (!completedLessonIds.includes(lessonSlug)) {
      setCompletedLessonIds((prev) => [...prev, lessonSlug]);
    }

    // If attempting a school assignment lesson, record result
    if (activeSchoolAssignment && activeSchoolAssignment.activityType === 'lesson') {
      schoolService.submitAssignmentResult({
        assignmentId: activeSchoolAssignment.id,
        studentId: currentUser?.id || 'usr_student_aliyah',
        studentName: profile.name,
        studentEmail: currentUser?.email || 'student@qazmind.kz',
        classId: studentEnrolledClass?.classId || 'class_11a',
        score: 1,
        total: 1,
      });
      setActiveSchoolAssignment(null);
    }

    navigateTo('app', '/app');
    setDashboardView('today');
  };

  // Handler: Start Practice in Focus Mode (Layout C)
  const handleStartPractice = (subjectId: string, count: number = 5) => {
    setActiveSchoolAssignment(null);
    setActiveSubjectId(subjectId);
    setActivePracticeCount(count);
    navigateTo('focus_practice', `/practice/session/${subjectId}`);
  };

  // Handler: Finish Practice
  const handleFinishPractice = (result: {
    subjectId: string;
    score: number;
    total: number;
    mistakes: { questionId: string; questionText: string; explanation: string }[];
  }) => {
    setPracticedCount((prev) => prev + result.total);

    // If attempting a school assignment, record result
    if (activeSchoolAssignment) {
      schoolService.submitAssignmentResult({
        assignmentId: activeSchoolAssignment.id,
        studentId: currentUser?.id || 'usr_student_aliyah',
        studentName: profile.name,
        studentEmail: currentUser?.email || 'student@qazmind.kz',
        classId: studentEnrolledClass?.classId || 'class_11a',
        score: result.score,
        total: result.total,
      });
      setActiveSchoolAssignment(null);
    }

    // Append mistakes to list if any
    if (result.mistakes.length > 0) {
      const newMistakes: MistakeItem[] = result.mistakes.map((m, idx) => ({
        id: `mistake_${Date.now()}_${idx}`,
        subjectRu: profile.profilePairLabelRu.split('(')[0] || 'Дисциплина',
        subjectKz: profile.profilePairLabelKz.split('(')[0] || 'Пән',
        topicRu: 'Практические задания',
        topicKz: 'Практикалық тапсырмалар',
        questionTextRu: m.questionText,
        questionTextKz: m.questionText,
        studentAnswerRu: 'Ошибочный ответ',
        studentAnswerKz: 'Қате жауап',
        correctAnswerRu: 'Правильный ответ',
        correctAnswerKz: 'Дұрыс жауап',
        explanationRu: m.explanation,
        explanationKz: m.explanation,
        priority: 'high',
        resolved: false,
      }));

      setMistakesList((prev) => [...newMistakes, ...prev]);
    }

    navigateTo('app', '/app');
    setDashboardView('today');
  };

  // Handler: Start Mock Exam in Focus Mode (Layout C)
  const handleStartExam = () => {
    setActiveSchoolAssignment(null);
    navigateTo('focus_exam', `/exam/session/demo_${Date.now()}`);
  };

  // Handler: Finish Mock Exam
  const handleFinishExam = (result: {
    score: number;
    total: number;
    answers: Record<number, string>;
    durationTakenSeconds: number;
  }) => {
    setLastExamResult({
      score: result.score,
      total: result.total,
      answers: result.answers,
      durationTakenSeconds: result.durationTakenSeconds,
    });

    // If attempting a school assignment exam, record result
    if (activeSchoolAssignment) {
      schoolService.submitAssignmentResult({
        assignmentId: activeSchoolAssignment.id,
        studentId: currentUser?.id || 'usr_student_aliyah',
        studentName: profile.name,
        studentEmail: currentUser?.email || 'student@qazmind.kz',
        classId: studentEnrolledClass?.classId || 'class_11a',
        score: result.score,
        total: result.total,
        answers: result.answers,
      });
      setActiveSchoolAssignment(null);
    }

    // Append to real exam history
    const record: ExamHistoryRecord = {
      id: `exam_${Date.now()}`,
      date: new Date().toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      score: result.score,
      total: result.total,
      percentage: Math.round((result.score / result.total) * 100),
    };
    setExamHistory((prev) => [record, ...prev]);
    setPracticedCount((prev) => prev + result.total);

    navigateTo('focus_exam_results', `/exam/results/${record.id}`);
  };

  // Handler: Review Mistake in Focus Mode (Layout C)
  const handleReviewMistake = (mistake: MistakeItem) => {
    setActiveMistakeReviewItem(mistake);
    navigateTo('focus_mistake_review', `/review/${mistake.id}`);
  };

  // Handler: Resolve Mistake
  const handleResolveMistake = (mistakeId: string) => {
    setMistakesList((prev) =>
      prev.map((m) => (m.id === mistakeId ? { ...m, resolved: true } : m))
    );
  };

  // Handler: Launch School Assignment in Focus Mode
  const handleStartSchoolAssignment = (asg: SchoolAssignment) => {
    setActiveSchoolAssignment(asg);

    if (asg.activityType === 'lesson') {
      setActiveLessonSlug(asg.lessonId || 'khanate-foundation');
      setActiveSubjectId(asg.subjectId);
      navigateTo('focus_lesson', `/learn/${asg.subjectId}/${asg.lessonId || 'lesson'}`);
    } else if (asg.activityType === 'mock_exam') {
      navigateTo('focus_exam', `/exam/session/asg_${asg.id}`);
    } else {
      setActiveSubjectId(asg.subjectId);
      setActivePracticeCount(asg.questionCount || 5);
      navigateTo('focus_practice', `/practice/session/${asg.subjectId}`);
    }
  };

  // Handler: Student Join Class by Code
  const handleJoinClassByCode = (code: string) => {
    const tempUser: UserAccount = currentUser || {
      id: `usr_${Date.now()}`,
      name: profile.name,
      email: 'student@qazmind.kz',
      isEmailVerified: true,
      createdAt: new Date().toISOString(),
    };

    const res = schoolService.joinClassByCode(code, tempUser);
    if (res.success && res.organization && res.schoolClass) {
      setStudentEnrolledClass({
        schoolName: res.organization.name,
        className: res.schoolClass.name,
        classId: res.schoolClass.id,
      });
    }
    return res;
  };

  // Handler: Select Workspace from Switcher
  const handleSelectWorkspace = (option: WorkspaceOption) => {
    if (option.type === 'personal') {
      navigateTo('app', '/app');
    } else if (option.type === 'school_admin') {
      if (option.orgId) setActiveSchoolId(option.orgId);
      navigateTo('school', '/school');
    } else if (option.type === 'teacher') {
      navigateTo('teacher', '/teacher');
    } else if (option.type === 'platform_admin') {
      navigateTo('platform_admin', '/admin/schools');
    }
  };

  // ==========================================
  // ROUTE RENDERING
  // ==========================================

  // Prototype school, teacher and admin screens run on browser demo data. Outside DEMO_MODE they are not shown.
  if (!DEMO_MODE && ['school', 'teacher', 'platform_admin'].includes(currentRoute)) {
    return (
      <UnavailablePage
        label="Кабинеты школ"
        title="Раздел в разработке"
        description="Кабинеты школ, учителей и администрирование платформы подключаются к серверу на следующих этапах. Здесь пока нет реальных данных."
        actionLabel="На главную"
        onAction={() => navigateTo('landing', '/')}
      />
    );
  }

  if (!DEMO_MODE && currentRoute === 'schools_apply') {
    return (
      <UnavailablePage
        label="Заявка школы"
        title="Подача заявки откроется позже"
        description="Заявки школ будут храниться на сервере и рассматриваться администратором платформы. Пока эта функция не подключена, заявка никуда не отправляется."
        actionLabel="На главную"
        onAction={() => navigateTo('landing', '/')}
        secondaryLabel="К разделу для школ"
        onSecondary={() => navigateTo('schools', '/schools')}
      />
    );
  }

  // A. SCHOOL LANDING PAGE (/schools)
  if (currentRoute === 'schools') {
    return (
      <SchoolLandingPage
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        onNavigateHome={() => navigateTo('landing', '/')}
        onOpenApply={() => navigateTo('schools_apply', '/schools/apply')}
        onOpenLogin={() => navigateTo('login', '/login')}
      />
    );
  }

  // B. SCHOOL APPLICATION FLOW (/schools/apply)
  if (currentRoute === 'schools_apply') {
    return (
      <SchoolApplyPage
        currentLang={currentLang}
        currentUser={currentUser}
        onNavigateHome={() => navigateTo('landing', '/')}
        onNavigateLogin={() => navigateTo('login', '/login')}
        onNavigatePlatformAdmin={() => navigateTo('platform_admin', '/admin/schools')}
        onNavigateSchoolAdmin={() => navigateTo('school', '/school')}
      />
    );
  }

  // C. PLATFORM ADMIN MODULE (/admin/schools)
  if (currentRoute === 'platform_admin') {
    return (
      <PlatformAdminPage
        currentLang={currentLang}
        onNavigateHome={() => navigateTo('landing', '/')}
        onNavigateSchoolAdmin={(orgId) => {
          setActiveSchoolId(orgId);
          navigateTo('school', '/school');
        }}
        onNavigateTeacher={() => navigateTo('teacher', '/teacher')}
      />
    );
  }

  // D. SCHOOL ADMINISTRATOR WORKSPACE (/school)
  if (currentRoute === 'school') {
    return (
      <SchoolAdminShell
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        organization={currentSchool}
        currentView={schoolAdminView}
        onViewChange={setSchoolAdminView}
        onSelectWorkspace={handleSelectWorkspace}
        onLogout={handleLogout}
        onBackToLanding={() => navigateTo('landing', '/')}
      >
        {schoolAdminView === 'overview' && (
          <SchoolOverviewView
            organization={currentSchool}
            classes={schoolClasses}
            assignments={schoolAssignments}
            onNavigateClasses={() => setSchoolAdminView('classes')}
            onNavigateTeachers={() => setSchoolAdminView('teachers')}
            onNavigateAssignments={() => setSchoolAdminView('assignments')}
            onCreateClass={() => setSchoolAdminView('classes')}
            onOpenClassDetail={(cid) => {
              setSelectedSchoolClassId(cid);
              setSchoolAdminView('classes');
            }}
          />
        )}

        {schoolAdminView === 'classes' && (
          <SchoolClassesView
            organization={currentSchool}
            classes={schoolClasses}
            assignments={schoolAssignments}
            teachers={schoolTeachers}
            selectedClassId={selectedSchoolClassId}
            onSelectClass={setSelectedSchoolClassId}
            onRefresh={() => {
              // Trigger state refresh
              setActiveSchoolId(activeSchoolId);
            }}
          />
        )}

        {schoolAdminView === 'teachers' && (
          <SchoolTeachersView
            organization={currentSchool}
            teachers={schoolTeachers}
            classes={schoolClasses}
            onRefresh={() => setActiveSchoolId(activeSchoolId)}
          />
        )}

        {schoolAdminView === 'assignments' && (
          <SchoolAssignmentsView
            organization={currentSchool}
            assignments={schoolAssignments}
            classes={schoolClasses}
          />
        )}

        {schoolAdminView === 'analytics' && (
          <SchoolAnalyticsView organization={currentSchool} classes={schoolClasses} />
        )}

        {schoolAdminView === 'access' && <SchoolAccessView organization={currentSchool} />}
      </SchoolAdminShell>
    );
  }

  // E. TEACHER WORKSPACE (/teacher)
  if (currentRoute === 'teacher') {
    return (
      <TeacherShell
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        teacherName={teacherName}
        currentView={teacherView}
        onViewChange={setTeacherView}
        onOpenCreateModal={() => setIsTeacherCreateModalOpen(true)}
        onSelectWorkspace={handleSelectWorkspace}
        onLogout={handleLogout}
        onBackToLanding={() => navigateTo('landing', '/')}
      >
        <TeacherHomeView
          teacherName={teacherName}
          assignedClasses={teacherClasses}
          assignments={teacherAssignments}
          onOpenCreateModal={() => setIsTeacherCreateModalOpen(true)}
          onSelectClass={(cid) => {
            // view submissions
          }}
        />

        <TeacherCreateAssignmentModal
          isOpen={isTeacherCreateModalOpen}
          onClose={() => setIsTeacherCreateModalOpen(false)}
          assignedClasses={teacherClasses}
          teacherUserId={teacherUserId}
          teacherName={teacherName}
          onAssignmentCreated={() => {
            // Trigger refresh
            setActiveSchoolId(activeSchoolId);
          }}
        />
      </TeacherShell>
    );
  }

  // F. AUTHENTICATION ROUTES (Layout A)
  if (currentRoute === 'register') {
    return (
      <RegisterPage
        currentLang={currentLang}
        onRegister={handleRegister}
        onNavigateLogin={() => navigateTo('login', '/login')}
        onNavigateHome={() => navigateTo('landing', '/')}
        onNavigateSchoolApply={() => navigateTo('schools_apply', '/schools/apply')}
      />
    );
  }

  if (currentRoute === 'login') {
    return (
      <LoginPage
        currentLang={currentLang}
        onLogin={handleLogin}
        onNavigateRegister={() => navigateTo('register', '/register')}
        onNavigateForgotPassword={() => navigateTo('forgot-password', '/forgot-password')}
        onNavigateHome={() => navigateTo('landing', '/')}
      />
    );
  }

  if (currentRoute === 'verify-email') {
    return (
      <VerifyEmailPage
        email={pendingEmail || currentUser?.email || ''}
        token={new URLSearchParams(window.location.search).get('token')}
        currentLang={currentLang}
        onVerify={handleVerifyEmail}
        onResend={async (email) => {
          await authApi.resendVerification(email);
        }}
        onChangeEmail={() => navigateTo('register', '/register')}
        onNavigateHome={() => navigateTo('landing', '/')}
      />
    );
  }

  if (currentRoute === 'forgot-password') {
    return (
      <ForgotPasswordPage
        currentLang={currentLang}
        onRequestReset={async (email) => {
          await authApi.forgotPassword(email);
        }}
        onNavigateLogin={() => navigateTo('login', '/login')}
        onNavigateHome={() => navigateTo('landing', '/')}
      />
    );
  }

  if (currentRoute === 'reset-password') {
    return (
      <ResetPasswordPage
        token={new URLSearchParams(window.location.search).get('token')}
        currentLang={currentLang}
        onReset={async (token, password) => {
          await authApi.resetPassword(token, password);
        }}
        onNavigateLogin={() => navigateTo('login', '/login')}
        onNavigateForgotPassword={() => navigateTo('forgot-password', '/forgot-password')}
        onNavigateHome={() => navigateTo('landing', '/')}
      />
    );
  }

  // G. ONBOARDING ROUTE
  if (currentRoute === 'onboarding') {
    return (
      <OnboardingFlow
        initialLang={currentLang}
        onSubmit={handleOnboardingSubmit}
        onLogout={handleLogout}
      />
    );
  }

  // H. FOCUS MODE ROUTES (Layout C)
  if (currentRoute === 'focus_lesson') {
    return (
      <FocusLessonReader
        lessonSlug={activeLessonSlug}
        currentLang={currentLang}
        onComplete={handleCompleteLesson}
        onExit={() => {
          navigateTo('app', '/app');
          setDashboardView('today');
        }}
      />
    );
  }

  if (currentRoute === 'focus_practice') {
    return (
      <FocusPracticeSession
        subjectId={activeSubjectId}
        count={activePracticeCount}
        currentLang={currentLang}
        onFinishSession={handleFinishPractice}
        onExit={() => {
          navigateTo('app', '/app');
          setDashboardView('today');
        }}
      />
    );
  }

  if (currentRoute === 'focus_exam') {
    return (
      <FocusMockExamSession
        currentLang={currentLang}
        onFinishExam={handleFinishExam}
        onExit={() => {
          navigateTo('app', '/app');
          setDashboardView('mock_exam');
        }}
      />
    );
  }

  if (currentRoute === 'focus_exam_results') {
    return (
      <FocusMockExamResults
        score={lastExamResult.score}
        total={lastExamResult.total}
        answers={lastExamResult.answers}
        durationTakenSeconds={lastExamResult.durationTakenSeconds}
        currentLang={currentLang}
        onNavigateMistakes={() => {
          navigateTo('app', '/app');
          setDashboardView('mistakes');
        }}
        onReturnToDashboard={() => {
          navigateTo('app', '/app');
          setDashboardView('today');
        }}
        onRetryExam={handleStartExam}
      />
    );
  }

  if (currentRoute === 'focus_mistake_review' && activeMistakeReviewItem) {
    return (
      <FocusMistakeReview
        mistake={activeMistakeReviewItem}
        currentLang={currentLang}
        onResolved={handleResolveMistake}
        onExit={() => {
          navigateTo('app', '/app');
          setDashboardView('mistakes');
        }}
      />
    );
  }

  // I. STUDENT DASHBOARD APPLICATION (Layout B)
  if (currentRoute === 'app') {
    const unresolvedMistakesCount = mistakesList.filter((m) => !m.resolved).length;
    const studentAssignments = studentEnrolledClass
      ? schoolService.getAssignmentsForClass(studentEnrolledClass.classId)
      : [];

    return (
      <DashboardShell
        currentView={dashboardView}
        onViewChange={setDashboardView}
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        profile={profile}
        mistakesCount={unresolvedMistakesCount}
        onSelectWorkspace={handleSelectWorkspace}
        onBackToLanding={() => navigateTo('landing', '/')}
        onLogout={handleLogout}
      >
        {dashboardView === 'today' && (
          <TodayView
            currentLang={currentLang}
            studentState={completedLessonIds.length === 0 ? 'new' : 'returning'}
            profile={profile}
            dailyTasks={dailyTasks}
            completedLessonsCount={completedLessonIds.length}
            mistakesCount={unresolvedMistakesCount}
            studentAffiliation={studentEnrolledClass}
            schoolAssignments={studentAssignments}
            onToggleTask={(taskId) => {
              setDailyTasks((prev) =>
                prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
              );
            }}
            onStartLesson={handleStartLesson}
            onStartPractice={(subId) => handleStartPractice(subId, 5)}
            onStartExam={handleStartExam}
            onNavigateMistakes={() => setDashboardView('mistakes')}
            onStartSchoolAssignment={handleStartSchoolAssignment}
            onJoinClassByCode={handleJoinClassByCode}
          />
        )}

        {dashboardView === 'route' && (
          <RouteView
            currentLang={currentLang}
            profile={profile}
            onNavigate={(view) => setDashboardView(view)}
          />
        )}

        {dashboardView === 'subjects' && (
          <SubjectsView
            currentLang={currentLang}
            profile={profile}
            onNavigateToLesson={handleStartLesson}
            onNavigateToPractice={(subId) => handleStartPractice(subId, 5)}
          />
        )}

        {dashboardView === 'practice' && (
          <PracticeView
            currentLang={currentLang}
            profile={profile}
            onStartSession={(subId, count) => handleStartPractice(subId, count)}
            onNavigateToMistakes={() => setDashboardView('mistakes')}
          />
        )}

        {dashboardView === 'mock_exam' && (
          <MockExamView
            currentLang={currentLang}
            profile={profile}
            onStartExam={handleStartExam}
          />
        )}

        {dashboardView === 'mistakes' && (
          <MistakesView
            mistakes={mistakesList}
            currentLang={currentLang}
            onReviewMistake={handleReviewMistake}
            onNavigateToPractice={() => setDashboardView('practice')}
          />
        )}

        {dashboardView === 'progress' && (
          <ProgressView
            currentLang={currentLang}
            profile={profile}
            completedLessonIds={completedLessonIds}
            examHistory={examHistory}
            practicedCount={practicedCount}
            onStartLearning={() => {
              setDashboardView('today');
              handleStartLesson('khanate-foundation', 'history_kz');
            }}
          />
        )}

        {dashboardView === 'settings' && (
          <SettingsView
            currentLang={currentLang}
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
          />
        )}
      </DashboardShell>
    );
  }

  // J. PUBLIC MAIN LANDING PAGE (Layout A)
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#171717] selection:bg-[#FF5A36] selection:text-white">
      {/* Editorial Top Navigation */}
      <Header
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        onOpenLogin={() => navigateTo('login', '/login')}
        onOpenRegister={() => navigateTo('register', '/register')}
        onOpenSchools={() => navigateTo('schools', '/schools')}
      />

      <main>
        {/* Hero Section */}
        <HeroSection
          currentLang={currentLang}
          onStart={() => navigateTo('register', '/register')}
          onExplore={() => scrollToSection('platform')}
        />

        {/* Section 01: The Problem */}
        <ProblemSection currentLang={currentLang} />

        {/* Section 02: The Approach */}
        <ApproachSection currentLang={currentLang} />

        {/* Section 03: Product Experience (Inside QazMind) */}
        <ProductExperienceSection
          currentLang={currentLang}
          onOpenSimulator={() => navigateTo('login', '/login')}
        />

        {/* Section: Schools Ecosystem Promo */}
        <div id="schools">
          <SchoolSection
            currentLang={currentLang}
            onOpenSchools={() => navigateTo('schools', '/schools')}
          />
        </div>

        {/* Section 04: Personal Learning Route */}
        <RouteSection
          currentLang={currentLang}
          onStartRoute={() => navigateTo('register', '/register')}
        />

        {/* Section 05: Exam Practice (Inverted Dark Section) */}
        <div id="exam-simulator">
          <ExamPracticeSection currentLang={currentLang} />
        </div>

        {/* Section 06: Subjects Typographic Directory */}
        <SubjectsSection currentLang={currentLang} />

        {/* Section 07: Pricing / Access */}
        <PricingSection
          currentLang={currentLang}
          onSelectFree={() => navigateTo('register', '/register')}
          onNotifyPlus={() => navigateTo('login', '/login')}
        />

        {/* Section 08: Final Call to Action */}
        <FinalCtaSection
          currentLang={currentLang}
          onStartFree={() => navigateTo('register', '/register')}
        />
      </main>

      {/* Editorial Footer */}
      <Footer currentLang={currentLang} />
    </div>
  );
}
