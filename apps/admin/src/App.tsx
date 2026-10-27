/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
import { adminService } from './admin/services/adminService';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    const p = window.location.pathname;
    return p.startsWith('/admin') ? p : '/admin';
  });

  // Sync with browser history
  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname;
      setCurrentPath(p.startsWith('/admin') ? p : '/admin');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    setCurrentPath(path);
    window.history.pushState(null, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Admin Route Resolver
  const renderAdminContent = () => {
    // Question new / edit route
    if (currentPath === '/admin/content/questions/new') {
      return (
        <QuestionEditor
          onSave={() => navigateTo('/admin/content/questions')}
          onCancel={() => navigateTo('/admin/content/questions')}
        />
      );
    }

    if (currentPath.startsWith('/admin/content/questions/') && currentPath !== '/admin/content/questions/import') {
      const qId = currentPath.replace('/admin/content/questions/', '');
      const question = adminService.getQuestionById(qId);
      return (
        <QuestionEditor
          initialQuestion={question}
          onSave={() => navigateTo('/admin/content/questions')}
          onCancel={() => navigateTo('/admin/content/questions')}
        />
      );
    }

    if (currentPath === '/admin/content/questions/import') {
      return (
        <ImportWizard
          onDone={() => navigateTo('/admin/content/questions')}
          onCancel={() => navigateTo('/admin/content/questions')}
        />
      );
    }

    // User details route
    if (currentPath.startsWith('/admin/users/')) {
      const uId = currentPath.replace('/admin/users/', '');
      return <UserDetailPage userId={uId} onNavigate={navigateTo} />;
    }

    // School details route
    if (currentPath.startsWith('/admin/schools/')) {
      const sId = currentPath.replace('/admin/schools/', '');
      return <SchoolDetailPage schoolId={sId} onNavigate={navigateTo} />;
    }

    switch (currentPath) {
      case '/admin':
        return <OverviewPage onNavigate={navigateTo} />;
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

  return (
    <AdminLayout currentPath={currentPath} onNavigate={navigateTo}>
      {renderAdminContent()}
    </AdminLayout>
  );
}
