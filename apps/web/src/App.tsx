import React, { useState, useEffect } from 'react';
import { Language } from './types';
import { DashboardView, MistakeItem, StudentProfile } from './types/dashboard';
import { UserAccount } from './types/auth';
import { useAuth } from './auth/AuthProvider';
import { authApi, learningApi, MeResponse, OnboardingPayload, mistakesApi, practiceApi, schoolApi, profileApi, ProfilePatch } from './api/endpoints';
import { emptyStudentProfile, toProfilePatch, toStudentProfile } from './api/mappers';
import { UnavailablePage } from './components/common/UnavailablePage';
import { SchoolApplyPage } from './components/school/SchoolApplyPage';
import { SchoolCabinet } from './components/school/SchoolCabinet';
import { AcceptInvitePage } from './components/school/AcceptInvitePage';
import { AssignmentsView } from './components/dashboard/AssignmentsView';
import { FocusAssignment } from './components/focus/FocusAssignment';
import { ResetPasswordPage } from './components/auth/ResetPasswordPage';

// Landing Page Components
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { StepsSection } from './components/landing/StepsSection';
import { ExamSection } from './components/landing/ExamSection';
import { FinalCtaSection } from './components/FinalCtaSection';
import { Footer } from './components/Footer';

// Dedicated Auth Components (Layout A)
import { RegisterPage } from './components/auth/RegisterPage';
import { LoginPage } from './components/auth/LoginPage';
import { VerifyEmailPage } from './components/auth/VerifyEmailPage';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';

// Post-Registration Onboarding
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';

// Dashboard (Layout B)
import { DashboardShell } from './components/dashboard/DashboardShell';
import { TodayView } from './components/dashboard/TodayView';
import { RouteView } from './components/dashboard/RouteView';
import { SubjectsView } from './components/dashboard/SubjectsView';
import { PracticeView } from './components/dashboard/PracticeView';
import { MockExamView } from './components/dashboard/MockExamView';
import { MistakesView } from './components/dashboard/MistakesView';
import { ProgressView } from './components/dashboard/ProgressView';
import { SettingsView } from './components/dashboard/SettingsView';

// Focus Mode (Layout C)
import { FocusLessonReader } from './components/focus/FocusLessonReader';
import { FocusMistakeReview } from './components/focus/FocusMistakeReview';
import { FocusPractice } from './components/focus/FocusPractice';

/** Screens that are not connected to the server yet. They say so and show no data. */
const INVITE_TOKEN_KEY = 'qazmind_invite_token';

type UnavailableScreen = 'schools' | 'teacher' | 'exam' | 'not_found';

const UNAVAILABLE_COPY: Record<
  UnavailableScreen,
  { label: string; title: string; description: string; toDashboard: boolean }
> = {
  schools: {
    label: 'Кабинеты школ',
    title: 'Раздел в разработке',
    description: 'Кабинеты школ подключаются к серверу на следующих этапах. Здесь пока нет реальных данных.',
    toDashboard: false,
  },
  teacher: {
    label: 'Кабинет учителя',
    title: 'Раздел в разработке',
    description: 'Кабинеты школ и учителей подключаются на следующих этапах. Здесь пока нет реальных данных.',
    toDashboard: false,
  },
  exam: {
    label: 'Пробное ЕНТ',
    title: 'Пробный экзамен пока недоступен',
    description:
      'Экзамен собирается только из опубликованных заданий по спецификации ЕНТ. Таких заданий пока нет, поэтому экзамен не запускается.',
    toDashboard: true,
  },
  not_found: {
    label: 'Ошибка 404',
    title: 'Страница не найдена',
    description: 'Такой страницы нет. Вернитесь на главную.',
    toDashboard: false,
  },
};

/** Routes that render an unavailable screen instead of a feature. */
const UNAVAILABLE_ROUTES: Partial<Record<AppRoute, UnavailableScreen>> = {
  schools: 'schools',
  teacher: 'teacher',
  not_found: 'not_found',
  focus_exam: 'exam',
  focus_exam_results: 'exam',
};

type AppRoute =
  | 'landing'
  | 'schools'
  | 'schools_apply'
  | 'invite'
  | 'school'
  | 'teacher'
  | 'not_found'
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
  | 'focus_mistake_review'
  | 'focus_assignment';

/** Subject and lesson from /learn/<subject>/<lesson>, so a reload keeps the lesson the user opened. */
const lessonFromPath = (): string => {
  const [, section = '', , slug = ''] = window.location.pathname.split('/');
  return section === 'learn' ? slug : '';
};

/** Session id from /practice/session/<id>, so a reload returns to the same run. */
const practiceSessionFromPath = (): string => {
  const [, section = '', kind = '', id = ''] = window.location.pathname.split('/');
  return section === 'practice' && kind === 'session' ? id : '';
};

/** Attempt id from /assignment/<id>, so a reload returns to the same attempt. */
const assignmentAttemptFromPath = (): string => {
  const [, section = '', id = ''] = window.location.pathname.split('/');
  return section === 'assignment' ? id : '';
};

/** Question id from /review/<id>, so a reload returns to the same mistake. */
const mistakeFromPath = (): string => {
  const [, section = '', id = ''] = window.location.pathname.split('/');
  return section === 'review' ? id : '';
};

export default function App() {
  // Sync initial route from URL path or default to landing
  const getInitialRoute = (): AppRoute => {
    const path = window.location.pathname;

    if (path === '/schools') return 'schools_apply';
    if (path === '/schools/apply') return 'schools_apply';
    if (path === '/invite') return 'invite';
    if (path.startsWith('/school')) return 'school';
    if (path.startsWith('/teacher')) return 'teacher';
    if (path.startsWith('/admin')) return 'not_found';
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
    if (path.startsWith('/assignment/')) return 'focus_assignment';

    if (path === '/home') return 'landing';

    // The entry point of the site is the login page.
    return 'login';
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
    : emptyStudentProfile(auth.user?.name ?? '');
  const pendingEmail = (() => {
    try {
      return sessionStorage.getItem('qazmind_pending_email') || '';
    } catch {
      return '';
    }
  })();

  // Completed lessons come from the server (GET /me/progress); see the effect below.
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);

  // Mistakes are the questions the student answered wrongly in practice; they are read from the server.
  const [mistakesList, setMistakesList] = useState<MistakeItem[]>([]);
  const [mistakesLoaded, setMistakesLoaded] = useState(false);

  // Dashboard Navigation View
  const [dashboardView, setDashboardView] = useState<DashboardView>('today');

  // Active Focus Mode parameters
  const [activeLessonSlug, setActiveLessonSlug] = useState<string>(lessonFromPath);
  const [activePracticeSessionId, setActivePracticeSessionId] = useState<string>(practiceSessionFromPath);
  const [practiceSubjectId, setPracticeSubjectId] = useState<string>('');
  const [practicedCount, setPracticedCount] = useState(0);
  const [activeMistakeId, setActiveMistakeId] = useState<string>(mistakeFromPath);
  const [activeAttemptId, setActiveAttemptId] = useState<string>(assignmentAttemptFromPath);

  // URL synchronization helper
  const navigateTo = (route: AppRoute, pathUrl?: string) => {
    setCurrentRoute(route);
    const targetUrl =
      pathUrl ||
      (route === 'landing' ? '/home' : route === 'schools_apply' ? '/schools/apply' : `/${route}`);

    if (window.location.pathname !== targetUrl) {
      window.history.pushState({}, '', targetUrl);
    }
    window.scrollTo(0, 0);
  };

  // Popstate listener
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(getInitialRoute());
      setActiveLessonSlug(lessonFromPath());
      setActivePracticeSessionId(practiceSessionFromPath());
      setActiveMistakeId(mistakeFromPath());
      setActiveAttemptId(assignmentAttemptFromPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!auth.user) return;
    learningApi
      .myProgress()
      .then((records) => setCompletedLessonIds(records.filter((r) => r.state === 'completed').map((r) => r.lesson_slug)))
      .catch(() => setCompletedLessonIds([]));
  }, [auth.user?.id]);

  // The number of answered practice questions comes from the server; it is refreshed when the student returns.
  useEffect(() => {
    if (!auth.user || currentRoute !== 'app') return;
    practiceApi
      .stats()
      .then((stats) => setPracticedCount(stats.answered))
      .catch(() => setPracticedCount(0));
  }, [auth.user?.id, currentRoute, dashboardView]);

  // Mistakes are read from the server on the dashboard and in the review screen.
  const loadMistakes = () =>
    Promise.all([mistakesApi.list(), learningApi.listSubjects()])
      .then(([items, subjects]) => {
        const title = (id: string) => subjects.find((s) => s.id === id);
        setMistakesList(
          items.map((m) => ({
            id: m.question_id,
            subjectRu: title(m.subject_id)?.title_ru ?? m.subject_id,
            subjectKz: title(m.subject_id)?.title_kz ?? m.subject_id,
            questionTextRu: m.text_ru,
            questionTextKz: m.text_kz || m.text_ru,
            options: m.options.map((o) => ({ label: o.label, textRu: o.text_ru, textKz: o.text_kz || o.text_ru })),
            wrongLabel: m.wrong_label,
            correctLabel: m.correct_label,
            explanationRu: m.explanation_ru,
            explanationKz: m.explanation_kz || m.explanation_ru,
            wrongCount: m.wrong_count,
            resolved: m.resolved,
          })),
        );
      })
      .catch(() => setMistakesList([]))
      .finally(() => setMistakesLoaded(true));

  useEffect(() => {
    if (!auth.user || (currentRoute !== 'app' && currentRoute !== 'focus_mistake_review')) return;
    void loadMistakes();
  }, [auth.user?.id, currentRoute, dashboardView]);

  // The school workspace link appears only for people who have a school membership on the server.
  const [hasSchool, setHasSchool] = useState(false);
  const [hasStudentClass, setHasStudentClass] = useState(false);
  useEffect(() => {
    if (!auth.user || currentRoute !== 'app') return;
    schoolApi
      .myOrganizations()
      .then((items) => setHasSchool(items.length > 0))
      .catch(() => setHasSchool(false));
    schoolApi
      .mySchoolClasses()
      .then((items) => setHasStudentClass(items.length > 0))
      .catch(() => setHasStudentClass(false));
  }, [auth.user?.id, currentRoute]);

  // Auth gating: personal study and focus screens need a session; study needs a completed onboarding.
  const sessionRoutes: AppRoute[] = [
    'app',
    'onboarding',
    'focus_lesson',
    'focus_practice',
    'focus_exam',
    'focus_exam_results',
    'focus_mistake_review',
    'focus_assignment',
  ];
  useEffect(() => {
    // The school workspace needs a session, but not a finished student onboarding.
    if (auth.status !== 'loading' && currentRoute === 'school' && !auth.user) {
      navigateTo('login', '/login');
      return;
    }
    if (auth.status === 'loading' || !sessionRoutes.includes(currentRoute)) return;
    if (!auth.user) {
      navigateTo('login', '/login');
    } else if (!onboardingCompleted && currentRoute !== 'onboarding') {
      navigateTo('onboarding', '/onboarding');
    }
  }, [currentRoute, auth.status, auth.user, onboardingCompleted]);

  // An invitation link opened before signing in: after the login the person is brought back to it (once).
  useEffect(() => {
    if (auth.status === 'loading' || !auth.user || currentRoute === 'invite') return;
    let stored = '';
    try {
      stored = sessionStorage.getItem(INVITE_TOKEN_KEY) || '';
      if (stored) sessionStorage.removeItem(INVITE_TOKEN_KEY);
    } catch {
      stored = '';
    }
    if (stored) navigateTo('invite', `/invite?token=${encodeURIComponent(stored)}`);
  }, [auth.status, auth.user?.id, currentRoute]);

  // A signed-in student has no use for the public pages: the landing and the login/register forms lead to the dashboard.
  useEffect(() => {
    if (auth.status === 'loading' || !auth.user) return;
    if (currentRoute === 'landing' || currentRoute === 'login' || currentRoute === 'register') {
      navigateTo(onboardingCompleted ? 'app' : 'onboarding', onboardingCompleted ? '/app' : '/onboarding');
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
    window.history.pushState({}, '', '/login');
    setCurrentRoute('login');
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
  const handleStartLesson = (lessonSlug: string, subjectId: string) => {
    setActiveLessonSlug(lessonSlug);
    navigateTo('focus_lesson', `/learn/${subjectId}/${lessonSlug}`);
  };

  // Handler: Complete Lesson
  // The reader has already stored the completion on the server; this only updates the local list.
  const handleCompleteLesson = (lessonSlug: string) => {
    if (!completedLessonIds.includes(lessonSlug)) {
      setCompletedLessonIds((prev) => [...prev, lessonSlug]);
    }
    navigateTo('app', '/app');
    setDashboardView('today');
  };

  // Handler: a practice session was created on the server; open it in Focus Mode.
  const handlePracticeStarted = (sessionId: string) => {
    setActivePracticeSessionId(sessionId);
    navigateTo('focus_practice', `/practice/session/${sessionId}`);
  };

  // Handler: Review Mistake in Focus Mode (Layout C)
  const handleReviewMistake = (mistake: MistakeItem) => {
    setActiveMistakeId(mistake.id);
    navigateTo('focus_mistake_review', `/review/${mistake.id}`);
  };


  // ==========================================
  // ROUTE RENDERING
  // ==========================================

  if (currentRoute === 'invite') {
    const token = new URLSearchParams(window.location.search).get('token') || '';
    const rememberAndGo = (route: AppRoute) => {
      try {
        sessionStorage.setItem(INVITE_TOKEN_KEY, token);
      } catch {}
      navigateTo(route, `/${route}`);
    };
    return (
      <AcceptInvitePage
        token={token}
        signedIn={!!auth.user}
        email={auth.user?.email ?? ''}
        onLogin={() => rememberAndGo('login')}
        onRegister={() => rememberAndGo('register')}
        onDone={(role) => (role === 'TEACHER' ? navigateTo('school', '/school') : navigateTo('app', '/app'))}
      />
    );
  }

  if (currentRoute === 'schools_apply') {
    return (
      <SchoolApplyPage
        signedIn={!!auth.user}
        onLogin={() => navigateTo('login', '/login')}
        onOpenCabinet={() => navigateTo('school', '/school')}
        onBack={() => navigateTo(auth.user ? 'app' : 'landing', auth.user ? '/app' : '/home')}
      />
    );
  }

  if (currentRoute === 'school') {
    if (!auth.user) return null; // the guard above sends an anonymous visitor to the login page
    return <SchoolCabinet onExit={() => navigateTo('app', '/app')} onApply={() => navigateTo('schools_apply', '/schools/apply')} />;
  }

  const unavailableScreen = UNAVAILABLE_ROUTES[currentRoute];
  if (unavailableScreen) {
    const copy = UNAVAILABLE_COPY[unavailableScreen];
    return (
      <UnavailablePage
        label={copy.label}
        title={copy.title}
        description={copy.description}
        actionLabel={copy.toDashboard ? 'К кабинету' : 'Ко входу'}
        onAction={() => (copy.toDashboard ? navigateTo('app', '/app') : navigateTo('login', '/login'))}
      />
    );
  }

  // AUTHENTICATION ROUTES (Layout A)
  if (currentRoute === 'register') {
    return (
      <RegisterPage
        currentLang={currentLang}
        onRegister={handleRegister}
        onNavigateLogin={() => navigateTo('login', '/login')}
        onNavigateHome={() => navigateTo('landing', '/home')}
        onNavigateSchoolApply={() => navigateTo('schools_apply', '/schools/apply')}
      />
    );
  }

  if (currentRoute === 'login') {
    return (
      <LoginPage
        onNavigateSchoolApply={() => navigateTo('schools_apply', '/schools/apply')}
        currentLang={currentLang}
        onLogin={handleLogin}
        onNavigateRegister={() => navigateTo('register', '/register')}
        onNavigateForgotPassword={() => navigateTo('forgot-password', '/forgot-password')}
        onNavigateHome={() => navigateTo('landing', '/home')}
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
        onNavigateHome={() => navigateTo('landing', '/home')}
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
        onNavigateHome={() => navigateTo('landing', '/home')}
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
        onNavigateHome={() => navigateTo('landing', '/home')}
      />
    );
  }

  // ONBOARDING ROUTE
  if (currentRoute === 'onboarding') {
    return (
      <OnboardingFlow
        initialLang={currentLang}
        onSubmit={handleOnboardingSubmit}
        onLogout={handleLogout}
      />
    );
  }

  // FOCUS MODE ROUTES (Layout C)
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
      <FocusPractice
        sessionId={activePracticeSessionId}
        currentLang={currentLang}
        contentLang={profile.examLanguage}
        onRestart={(subjectId) => {
          practiceApi
            .start(subjectId, 10)
            .then((session) => handlePracticeStarted(session.id))
            .catch(() => {
              setPracticeSubjectId(subjectId);
              navigateTo('app', '/app');
              setDashboardView('practice');
            });
        }}
        onExit={() => {
          navigateTo('app', '/app');
          setDashboardView('practice');
        }}
      />
    );
  }

  if (currentRoute === 'focus_assignment') {
    return (
      <FocusAssignment
        attemptId={activeAttemptId}
        currentLang={currentLang}
        contentLang={profile.examLanguage}
        onExit={() => {
          navigateTo('app', '/app');
          setDashboardView('assignments');
        }}
      />
    );
  }

  if (currentRoute === 'focus_mistake_review') {
    const mistake = mistakesList.find((m) => m.id === activeMistakeId);
    if (!mistake) {
      // Waiting for the list, or the question is not among this student's mistakes: say so, show nothing else.
      return (
        <div className="min-h-screen bg-[#F5F3EE] text-[#171717] flex flex-col items-center justify-center px-4 text-center gap-4">
          <p className="font-mono text-xs text-[#74736F]">
            {mistakesLoaded ? 'Этого вопроса нет в вашем списке ошибок.' : 'Загрузка…'}
          </p>
          {mistakesLoaded && (
            <button
              type="button"
              onClick={() => {
                navigateTo('app', '/app');
                setDashboardView('mistakes');
              }}
              className="px-5 py-2.5 bg-[#171717] hover:bg-[#FF5A36] text-white font-mono text-xs font-bold cursor-pointer"
            >
              К списку ошибок
            </button>
          )}
        </div>
      );
    }
    return (
      <FocusMistakeReview
        mistake={mistake}
        currentLang={currentLang}
        contentLang={profile.examLanguage}
        onAnswered={() => void loadMistakes()}
        onExit={() => {
          navigateTo('app', '/app');
          setDashboardView('mistakes');
        }}
      />
    );
  }

  // STUDENT DASHBOARD APPLICATION (Layout B)
  if (currentRoute === 'app') {
    const unresolvedMistakesCount = mistakesList.filter((m) => !m.resolved).length;

    return (
      <DashboardShell
        currentView={dashboardView}
        onViewChange={setDashboardView}
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        profile={profile}
        mistakesCount={unresolvedMistakesCount}
        onLogout={handleLogout}
        onOpenSchool={hasSchool ? () => navigateTo('school', '/school') : undefined}
        showAssignments={hasStudentClass}
      >
        {dashboardView === 'today' && (
          <TodayView
            currentLang={currentLang}
            profile={profile}
            completedLessonsCount={completedLessonIds.length}
            mistakesCount={unresolvedMistakesCount}
            onNavigate={setDashboardView}
          />
        )}

        {dashboardView === 'route' && <RouteView currentLang={currentLang} onNavigate={setDashboardView} />}

        {dashboardView === 'subjects' && (
          <SubjectsView
            currentLang={currentLang}
            profile={profile}
            onNavigateToLesson={handleStartLesson}
            onNavigateToPractice={(subjectId) => {
              setPracticeSubjectId(subjectId);
              setDashboardView('practice');
            }}
          />
        )}

        {dashboardView === 'practice' && (
          <PracticeView
            currentLang={currentLang}
            initialSubjectId={practiceSubjectId}
            onNavigate={setDashboardView}
            onStarted={handlePracticeStarted}
          />
        )}

        {dashboardView === 'assignments' && (
          <AssignmentsView
            currentLang={currentLang}
            onOpenAttempt={(attemptId) => {
              setActiveAttemptId(attemptId);
              navigateTo('focus_assignment', `/assignment/${attemptId}`);
            }}
          />
        )}

        {dashboardView === 'mock_exam' && <MockExamView currentLang={currentLang} onNavigate={setDashboardView} />}

        {dashboardView === 'mistakes' && (
          <MistakesView
            mistakes={mistakesList}
            currentLang={currentLang}
            contentLang={profile.examLanguage}
            onReviewMistake={handleReviewMistake}
            onNavigateToPractice={() => setDashboardView('practice')}
          />
        )}

        {dashboardView === 'progress' && (
          <ProgressView
            currentLang={currentLang}
            profile={profile}
            completedLessonIds={completedLessonIds}
            examHistory={[]}
            practicedCount={practicedCount}
            onStartLearning={() => setDashboardView('subjects')}
          />
        )}

        {dashboardView === 'settings' && (
          <SettingsView currentLang={currentLang} profile={profile} onUpdateProfile={handleUpdateProfile} />
        )}
      </DashboardShell>
    );
  }

  // PUBLIC MAIN LANDING PAGE (Layout A)
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#171717] selection:bg-[#FF5A36] selection:text-white">
      {/* Editorial Top Navigation */}
      <Header
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        onOpenLogin={() => navigateTo('login', '/login')}
        onOpenRegister={() => navigateTo('register', '/register')}
        onOpenSchools={() => navigateTo('schools_apply', '/schools/apply')}
      />

      <main>
        <HeroSection
          currentLang={currentLang}
          onStart={() => navigateTo('register', '/register')}
          onExplore={() => scrollToSection('how-it-works')}
        />
        <StepsSection currentLang={currentLang} />
        <ExamSection currentLang={currentLang} />
        <FinalCtaSection currentLang={currentLang} onStartFree={() => navigateTo('register', '/register')} />
      </main>

      {/* Editorial Footer */}
      <Footer currentLang={currentLang} />
    </div>
  );
}
