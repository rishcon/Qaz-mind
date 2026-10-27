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
import { mockDb } from './admin/repositories/mockDatabase';
import { adminService } from './admin/services/adminService';
import { ArrowLeft, ExternalLink, ShieldAlert, BookOpen, GraduationCap, Building2 } from 'lucide-react';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    const p = window.location.pathname;
    return p.startsWith('/admin') ? p : '/admin';
  });

  const [activeWorkspace, setActiveWorkspace] = useState<'admin' | 'student' | 'teacher' | 'school' | 'landing'>('admin');

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

  // If switched to an ecosystem portal preview
  if (activeWorkspace !== 'admin') {
    return (
      <div className="min-h-screen bg-[#F5F3EE] text-[#171717] flex flex-col font-sans">
        {/* Workspace Ecosystem Return Header */}
        <div className="bg-[#171717] text-white px-4 py-2.5 flex items-center justify-between text-xs border-b border-black shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#FF5A36]">qazmind.</span>
            <span className="text-[#A8A29E]">
              {activeWorkspace === 'student' && 'Кабинет ученика ЕНТ (Предпросмотр)'}
              {activeWorkspace === 'teacher' && 'Кабинет учителя (Предпросмотр)'}
              {activeWorkspace === 'school' && 'Кабинет школы (Предпросмотр)'}
              {activeWorkspace === 'landing' && 'Публичный портал QazMind'}
            </span>
          </div>

          <button
            onClick={() => setActiveWorkspace('admin')}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#FF5A36] hover:bg-[#E84D2B] text-white font-semibold text-xs cursor-pointer shadow-xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Вернуться в QazMind Admin
          </button>
        </div>

        {/* Workspace preview body */}
        <div className="flex-1 p-6 md:p-12 max-w-5xl mx-auto w-full space-y-6">
          {activeWorkspace === 'student' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-[#E2DED5] p-6 shadow-xs flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold text-[#171717]">Сәлем, Аружан! Дайындық барысы</h1>
                  <p className="text-xs text-[#78716C] mt-1">ЕНТ 2026: Мақсатты балл — 135 / 140</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-[#FF5A36]">126</span>
                  <div className="text-[10px] text-[#258568] font-semibold">Соңғы срез нәтижесі</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-[#E2DED5]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#78716C]">Қазақстан тарихы</h3>
                  <p className="text-base font-bold text-[#171717] mt-1">18/20 балл</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-[#E2DED5]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#78716C]">Мат. сауаттылық</h3>
                  <p className="text-base font-bold text-[#171717] mt-1">9/10 балл</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-[#E2DED5]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#78716C]">Математика (Бейіндік)</h3>
                  <p className="text-base font-bold text-[#171717] mt-1">42/50 балл</p>
                </div>
              </div>
            </div>
          )}

          {activeWorkspace === 'teacher' && (
            <div className="bg-white rounded-xl border border-[#E2DED5] p-6 shadow-xs space-y-4">
              <h1 className="text-xl font-bold text-[#171717]">Кабинет преподавателя: 11-А класс</h1>
              <p className="text-xs text-[#78716C]">Школа-лицей №79 г. Астана • История Казахстана</p>
              <div className="p-4 bg-[#FAF9F6] border border-[#E2DED5] rounded-lg text-xs">
                Учитель может создавать домашние задания из верифицированного банка вопросов QazMind Admin.
              </div>
            </div>
          )}

          {activeWorkspace === 'school' && (
            <div className="bg-white rounded-xl border border-[#E2DED5] p-6 shadow-xs space-y-4">
              <h1 className="text-xl font-bold text-[#171717]">Кабинет администрации школы</h1>
              <p className="text-xs text-[#78716C]">Школа-лицей №79 • 340 учащихся на платформе QazMind</p>
              <div className="p-4 bg-[#FAF9F6] border border-[#E2DED5] rounded-lg text-xs">
                Доступно управление классами и лицензионным пулом, выделенным администратором платформы.
              </div>
            </div>
          )}

          {activeWorkspace === 'landing' && (
            <div className="bg-white rounded-xl border border-[#E2DED5] p-8 text-center space-y-4">
              <div className="text-2xl font-bold text-[#171717]">
                qazmind<span className="text-[#FF5A36]">.</span>
              </div>
              <p className="text-sm text-[#78716C] max-w-md mx-auto">
                Интеллектуальная образовательная платформа для эффективной подготовки к ЕНТ / ҰБТ в Казахстане.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

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
    <AdminLayout
      currentPath={currentPath}
      onNavigate={navigateTo}
      onSwitchWorkspace={(ws) => setActiveWorkspace(ws)}
    >
      {renderAdminContent()}
    </AdminLayout>
  );
}
