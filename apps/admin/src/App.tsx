import React, { useState, useEffect } from 'react';
import { AdminLayout } from './admin/components/layout/AdminLayout';
import { OverviewPage } from './admin/pages/OverviewPage';
import { UsersPage } from './admin/pages/UsersPage';
import { UserDetailPage } from './admin/pages/UserDetailPage';
import { SchoolsPage } from './admin/pages/SchoolsPage';
import { SchoolDetailPage } from './admin/pages/SchoolDetailPage';
import { TeachersPage } from './admin/pages/TeachersPage';
import { SubjectsPage } from './admin/pages/SubjectsPage';
import { LessonsPage } from './admin/pages/LessonsPage';
import { QuestionsPage } from './admin/pages/QuestionsPage';
import { QuestionReviewPage } from './admin/pages/QuestionReviewPage';
import { ExamsPage } from './admin/pages/ExamsPage';
import { AssignmentsPage } from './admin/pages/AssignmentsPage';
import { AnalyticsPage } from './admin/pages/AnalyticsPage';
import { ActivityPage } from './admin/pages/ActivityPage';
import { AuditPage } from './admin/pages/AuditPage';
import { FinancePage } from './admin/pages/FinancePage';
import { SupportPage } from './admin/pages/SupportPage';
import { ReportsPage } from './admin/pages/ReportsPage';
import { MonitoringPage } from './admin/pages/MonitoringPage';
import { NotificationsPage } from './admin/pages/NotificationsPage';
import { RolesPage } from './admin/pages/RolesPage';
import { SettingsPage } from './admin/pages/SettingsPage';
import { QuestionEditor } from './admin/components/editors/QuestionEditor';
import { ImportWizard } from './admin/components/editors/ImportWizard';
import { StaffAuthProvider, useStaff } from './admin/auth/StaffAuth';
import { AcceptInviteScreen, LoadingScreen, MfaScreen, SignInScreen } from './admin/auth/AuthScreens';
import { AttentionProvider } from './admin/api/AttentionProvider';
import { ForbiddenBlock, SectionNotConnected } from './admin/components/ui/PageState';

/** Sections whose server side does not exist yet. They are labelled; nothing on them is loaded or saved. */
const NOT_CONNECTED: Array<{ prefix: string; what: string }> = [
  { prefix: '/admin/teachers', what: 'на сервере ещё нет учителей и классов' },
  { prefix: '/admin/exams', what: 'конструктор пробных экзаменов появится вместе с банком опубликованных вопросов' },
  { prefix: '/admin/assignments', what: 'школьные задания появятся вместе со школами' },
  { prefix: '/admin/activity', what: 'журнал действий учеников ещё не ведётся; действия сотрудников — в «Истории действий»' },
  { prefix: '/admin/finance', what: 'лицензии и платежи не подключены, ценовая модель не утверждена' },
  { prefix: '/admin/support', what: 'обращения пользователей ещё не принимаются' },
  { prefix: '/admin/reports', what: 'жалобы учеников на задания ещё не принимаются' },
  { prefix: '/admin/settings', what: 'параметры платформы задаются в конфигурации сервера' },
];

/** Permission each section needs. Hiding is convenience: the server refuses the request anyway. */
const SECTION_PERMISSION: Array<{ prefix: string; permission: string }> = [
  { prefix: '/admin/users', permission: 'users.read' },
  { prefix: '/admin/content/review', permission: 'content.review' },
  { prefix: '/admin/content/questions/new', permission: 'content.create' },
  { prefix: '/admin/content/questions/import', permission: 'content.create' },
  { prefix: '/admin/audit', permission: 'audit.read' },
  { prefix: '/admin/monitoring', permission: 'monitoring.read' },
  { prefix: '/admin/roles', permission: 'staff.manage' },
];

function AdminApp() {
  const { status, can, refresh } = useStaff();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    const p = window.location.pathname;
    return p.startsWith('/admin') || p.startsWith('/accept-invite') ? p : '/admin';
  });

  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname;
      setCurrentPath(p.startsWith('/admin') ? p : '/admin');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    setCurrentPath(path.split('?')[0]);
    window.history.pushState(null, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (currentPath.startsWith('/accept-invite')) {
    const token = new URLSearchParams(window.location.search).get('token') ?? '';
    return (
      <AcceptInviteScreen
        token={token}
        onDone={() => {
          navigateTo('/admin');
          void refresh();
        }}
      />
    );
  }
  if (status === 'loading') return <LoadingScreen />;
  if (status === 'signed_out') return <SignInScreen />;
  if (status === 'mfa_setup') return <MfaScreen enrol />;
  if (status === 'mfa_verify') return <MfaScreen enrol={false} />;

  const renderAdminContent = () => {
    const guard = SECTION_PERMISSION.find((s) => currentPath.startsWith(s.prefix));
    if (guard && !can(guard.permission)) return <ForbiddenBlock />;

    if (currentPath === '/admin/content/questions/new') {
      return <QuestionEditor onClose={() => navigateTo('/admin/content/questions')} />;
    }
    if (currentPath === '/admin/content/questions/import') {
      return <ImportWizard onDone={() => navigateTo('/admin/content/questions')} onCancel={() => navigateTo('/admin/content/questions')} />;
    }
    if (currentPath.startsWith('/admin/content/questions/')) {
      const id = currentPath.replace('/admin/content/questions/', '');
      return <QuestionEditor key={id} questionId={id} onClose={() => navigateTo('/admin/content/questions')} />;
    }
    if (currentPath.startsWith('/admin/users/')) {
      return <UserDetailPage userId={currentPath.replace('/admin/users/', '')} onNavigate={navigateTo} />;
    }
    if (currentPath.startsWith('/admin/schools/')) {
      return <SchoolDetailPage schoolId={currentPath.replace('/admin/schools/', '')} onNavigate={navigateTo} />;
    }

    switch (currentPath) {
      case '/admin/users':
        return <UsersPage onNavigate={navigateTo} />;
      case '/admin/schools':
        return <SchoolsPage onNavigate={navigateTo} />;
      case '/admin/teachers':
        return <TeachersPage onNavigate={navigateTo} />;
      case '/admin/content/subjects':
        return <SubjectsPage onNavigate={navigateTo} />;
      case '/admin/content/lessons':
        return <LessonsPage onNavigate={navigateTo} />;
      case '/admin/content/questions':
        return <QuestionsPage onNavigate={navigateTo} />;
      case '/admin/content/review':
        return <QuestionReviewPage onNavigate={navigateTo} />;
      case '/admin/exams':
        return <ExamsPage onNavigate={navigateTo} />;
      case '/admin/assignments':
        return <AssignmentsPage onNavigate={navigateTo} />;
      case '/admin/analytics':
        return <AnalyticsPage />;
      case '/admin/activity':
        return <ActivityPage onNavigate={navigateTo} />;
      case '/admin/audit':
        return <AuditPage />;
      case '/admin/finance':
        return <FinancePage />;
      case '/admin/support':
        return <SupportPage />;
      case '/admin/reports':
        return <ReportsPage onNavigate={navigateTo} />;
      case '/admin/monitoring':
        return <MonitoringPage />;
      case '/admin/notifications':
        return <NotificationsPage onNavigate={navigateTo} />;
      case '/admin/roles':
        return <RolesPage />;
      case '/admin/settings':
        return <SettingsPage />;
      default:
        return <OverviewPage onNavigate={navigateTo} />;
    }
  };

  const notConnected = NOT_CONNECTED.find((s) => currentPath.startsWith(s.prefix));

  return (
    <AttentionProvider>
      <AdminLayout currentPath={currentPath} onNavigate={navigateTo}>
        {notConnected && <SectionNotConnected what={notConnected.what} />}
        {renderAdminContent()}
      </AdminLayout>
    </AttentionProvider>
  );
}

export default function App() {
  return (
    <StaffAuthProvider>
      <AdminApp />
    </StaffAuthProvider>
  );
}
