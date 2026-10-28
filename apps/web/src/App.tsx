import React, { useState, useEffect } from 'react';
import { Language } from './types';
import { DashboardView, MistakeItem, StudentProfile } from './types/dashboard';
import { UserAccount } from './types/auth';
import { useAuth } from './auth/AuthProvider';
import { authApi, learningApi, MeResponse, OnboardingPayload, profileApi, ProfilePatch } from './api/endpoints';
import { emptyStudentProfile, toProfilePatch, toStudentProfile } from './api/mappers';
import { UnavailablePage } from './components/common/UnavailablePage';
import { ResetPasswordPage } from './components/auth/ResetPasswordPage';

// Landing Page Components
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { StepsSection } from './components/landing/StepsSection';
import { ExamSection } from './components/landing/ExamSection';
import { SchoolSection } from './components/landing/SchoolSection';
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

/** Screens that are not connected to the server yet. They say so and show no data. */
type UnavailableScreen = 'schools' | 'schools_apply' | 'school' | 'teacher' | 'practice' | 'exam' | 'not_found';

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
  schools_apply: {
    label: 'Заявка школы',
    title: 'Подача заявки откроется позже',
    description:
      'Заявки школ будут храниться на сервере и рассматриваться администратором платформы. Пока эта функция не подключена, заявка никуда не отправляется.',
    toDashboard: false,
  },
  school: {
    label: 'Кабинет школы',
    title: 'Раздел в разработке',
    description: 'Кабинеты школ и учителей подключаются на следующих этапах. Здесь пока нет реальных данных.',
    toDashboard: false,
  },
  teacher: {
    label: 'Кабинет учителя',
    title: 'Раздел в разработке',
    description: 'Кабинеты школ и учителей подключаются на следующих этапах. Здесь пока нет реальных данных.',
    toDashboard: false,
  },
  practice: {
    label: 'Практика',
    title: 'Практика пока недоступна',
    description: 'Практика откроется, когда в банке появятся опубликованные задания. Сессия не запускается.',
    toDashboard: true,
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
  schools_apply: 'schools_apply',
  school: 'school',
  teacher: 'teacher',
  not_found: 'not_found',
  focus_practice: 'practice',
  focus_exam: 'exam',
  focus_exam_results: 'exam',
};

type AppRoute =
  | 'landing'
  | 'schools'
  | 'schools_apply'
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
  | 'focus_mistake_review';

/** Subject and lesson from /learn/<subject>/<lesson>, so a reload keeps the lesson the user opened. */
const lessonFromPath = (): string => {
  const [, section = '', , slug = ''] = window.location.pathname.split('/');
  return section === 'learn' ? slug : '';
};

export default function App() {
  // Sync initial route from URL path or default to landing
  const getInitialRoute = (): AppRoute => {
    const path = window.location.pathname;

    if (path === '/schools') return 'schools';
    if (path === '/schools/apply') return 'schools_apply';
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

  // Mistakes are not stored anywhere yet: they will come from practice once practice is connected to the server.
  const [mistakesList, setMistakesList] = useState<MistakeItem[]>([]);

  // Dashboard Navigation View
  const [dashboardView, setDashboardView] = useState<DashboardView>('today');

  // Active Focus Mode parameters
  const [activeLessonSlug, setActiveLessonSlug] = useState<string>(lessonFromPath);
  const [activeMistakeReviewItem, setActiveMistakeReviewItem] = useState<MistakeItem | null>(null);

  // URL synchronization helper
  const navigateTo = (route: AppRoute, pathUrl?: string) => {
    setCurrentRoute(route);
    const targetUrl =
      pathUrl ||
      (route === 'landing' ? '/' : route === 'schools_apply' ? '/schools/apply' : `/${route}`);

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

  // Handler: Review Mistake in Focus Mode (Layout C)
  const handleReviewMistake = (mistake: MistakeItem) => {
    setActiveMistakeReviewItem(mistake);
    navigateTo('focus_mistake_review', `/review/${mistake.id}`);
  };

  // Handler: Resolve Mistake
  const handleResolveMistake = (mistakeId: string) => {
    setMistakesList((prev) => prev.map((m) => (m.id === mistakeId ? { ...m, resolved: true } : m)));
  };

  // ==========================================
  // ROUTE RENDERING
  // ==========================================

  const unavailableScreen = UNAVAILABLE_ROUTES[currentRoute];
  if (unavailableScreen) {
    const copy = UNAVAILABLE_COPY[unavailableScreen];
    return (
      <UnavailablePage
        label={copy.label}
        title={copy.title}
        description={copy.description}
        actionLabel={copy.toDashboard ? 'К кабинету' : 'На главную'}
        onAction={() => (copy.toDashboard ? navigateTo('app', '/app') : navigateTo('landing', '/'))}
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
        onBackToLanding={() => navigateTo('landing', '/')}
        onLogout={handleLogout}
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
            onNavigateToPractice={() => setDashboardView('practice')}
          />
        )}

        {dashboardView === 'practice' && <PracticeView currentLang={currentLang} onNavigate={setDashboardView} />}

        {dashboardView === 'mock_exam' && <MockExamView currentLang={currentLang} onNavigate={setDashboardView} />}

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
            examHistory={[]}
            practicedCount={0}
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
      />

      <main>
        <HeroSection
          currentLang={currentLang}
          onStart={() => navigateTo('register', '/register')}
          onExplore={() => scrollToSection('how-it-works')}
        />
        <StepsSection currentLang={currentLang} />
        <ExamSection currentLang={currentLang} />
        <SchoolSection currentLang={currentLang} />
        <FinalCtaSection currentLang={currentLang} onStartFree={() => navigateTo('register', '/register')} />
      </main>

      {/* Editorial Footer */}
      <Footer currentLang={currentLang} />
    </div>
  );
}
