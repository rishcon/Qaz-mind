import React, { useState } from 'react';
import { Language } from '../../types';
import { OrganizationApplication, Organization } from '../../types/school';
import { schoolService } from '../../services/schoolService';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Building,
  Users,
  Calendar,
  ExternalLink,
  Search,
  ArrowRight,
} from 'lucide-react';

interface PlatformAdminPageProps {
  currentLang: Language;
  onNavigateHome: () => void;
  onNavigateSchoolAdmin: (orgId: string) => void;
  onNavigateTeacher: () => void;
}

export const PlatformAdminPage: React.FC<PlatformAdminPageProps> = ({
  currentLang,
  onNavigateHome,
  onNavigateSchoolAdmin,
  onNavigateTeacher,
}) => {
  const [applications, setApplications] = useState<OrganizationApplication[]>(() =>
    schoolService.getApplications()
  );
  const [organizations, setOrganizations] = useState<Organization[]>(() =>
    schoolService.getOrganizations()
  );
  const [activeTab, setActiveTab] = useState<'applications' | 'organizations'>('applications');
  const [rejectingAppId, setRejectingAppId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [notification, setNotification] = useState<string>('');

  const refreshData = () => {
    setApplications([...schoolService.getApplications()]);
    setOrganizations([...schoolService.getOrganizations()]);
  };

  const handleApprove = (appId: string) => {
    const res = schoolService.approveApplication(appId);
    if (res) {
      setNotification(`Школа «${res.organization.name}» успешно одобрена и активирована!`);
      refreshData();
      setTimeout(() => setNotification(''), 4000);
    }
  };

  const handleReject = (appId: string) => {
    if (!rejectReason.trim()) {
      alert('Пожалуйста, укажите причину отклонения.');
      return;
    }
    schoolService.rejectApplication(appId, rejectReason);
    setRejectingAppId(null);
    setRejectReason('');
    setNotification('Заявка отклонена с уведомлением заявителю.');
    refreshData();
    setTimeout(() => setNotification(''), 4000);
  };

  const handleToggleStatus = (orgId: string, currentStatus: Organization['status']) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    schoolService.updateOrganizationStatus(orgId, newStatus);
    refreshData();
  };

  const pendingApps = applications.filter((a) => a.status === 'pending');
  const processedApps = applications.filter((a) => a.status !== 'pending');

  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#171717] antialiased">
      {/* Platform Admin Header */}
      <header className="bg-[#171717] text-[#F5F3EE] px-6 md:px-10 py-4 flex items-center justify-between border-b border-black">
        <div className="flex items-center gap-3">
          <span className="font-mono font-black text-xl tracking-tight text-white">qazmind.</span>
          <span className="text-[10px] font-mono uppercase bg-[#FF5A36] text-white px-2 py-0.5 rounded font-bold">
            PLATFORM ADMIN
          </span>
          <span className="text-xs text-[#74736F] hidden sm:inline">
            / Управление школьными организациями
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <button
            type="button"
            onClick={onNavigateHome}
            className="text-[#D9D5CB] hover:text-white transition-colors cursor-pointer"
          >
            ← На сайт
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 md:px-10 py-8">
        {/* Notification Toast */}
        {notification && (
          <div className="mb-6 p-4 bg-[#258568] text-white text-xs font-bold rounded flex items-center justify-between shadow-xs">
            <span>{notification}</span>
            <button
              type="button"
              onClick={() => setNotification('')}
              className="text-white/80 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-[#171717] tracking-tight">
              Институциональная модерация
            </h1>
            <p className="text-xs text-[#74736F] mt-1">
              Рассмотрение заявок представителей школ и мониторинг активных подключений.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-white border border-[#D9D5CB] p-1 rounded">
            <button
              type="button"
              onClick={() => setActiveTab('applications')}
              className={`px-3 py-1.5 text-xs font-bold rounded cursor-pointer transition-colors flex items-center gap-2 ${
                activeTab === 'applications'
                  ? 'bg-[#171717] text-white'
                  : 'text-[#74736F] hover:text-[#171717]'
              }`}
            >
              <span>Заявки школ</span>
              {pendingApps.length > 0 && (
                <span className="px-1.5 py-0.2 bg-[#FF5A36] text-white text-[10px] rounded-full">
                  {pendingApps.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('organizations')}
              className={`px-3 py-1.5 text-xs font-bold rounded cursor-pointer transition-colors flex items-center gap-2 ${
                activeTab === 'organizations'
                  ? 'bg-[#171717] text-white'
                  : 'text-[#74736F] hover:text-[#171717]'
              }`}
            >
              <span>Школы в системе ({organizations.length})</span>
            </button>
          </div>
        </div>

        {/* TAB 1: Applications */}
        {activeTab === 'applications' && (
          <div className="space-y-8">
            {/* Pending Applications Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF5A36]" />
                  <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#171717]">
                    Ожидают проверки ({pendingApps.length})
                  </h2>
                </div>
              </div>

              {pendingApps.length === 0 ? (
                <div className="p-8 bg-white border border-[#D9D5CB] rounded text-center text-xs text-[#74736F]">
                  Нет нерассмотренных заявок. Все школы проверены.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {pendingApps.map((app) => (
                    <div
                      key={app.id}
                      className="p-6 bg-white border border-[#D9D5CB] rounded shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-base font-bold text-[#171717]">{app.schoolName}</span>
                          <span className="text-[10px] font-mono bg-[#EAE7DF] px-2 py-0.5 rounded text-[#171717]">
                            г. {app.city}
                          </span>
                          <span className="text-[10px] font-mono bg-[#FF5A36]/10 text-[#FF5A36] px-2 py-0.5 rounded font-bold">
                            ~{app.studentCountApprox} учеников
                          </span>
                        </div>

                        <div className="text-xs text-[#74736F] flex flex-wrap gap-x-6 gap-y-1">
                          <span>
                            Представитель: <strong className="text-[#171717]">{app.representativeName}</strong>
                          </span>
                          <span>
                            Email: <strong className="text-[#171717]">{app.representativeEmail}</strong>
                          </span>
                          <span>
                            Дата заявки: {new Date(app.createdAt).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 shrink-0">
                        {rejectingAppId === app.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              placeholder="Причина отклонения..."
                              className="px-2.5 py-1.5 text-xs border border-[#D9D5CB] rounded w-48"
                            />
                            <button
                              type="button"
                              onClick={() => handleReject(app.id)}
                              className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 cursor-pointer"
                            >
                              Подтвердить
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectingAppId(null)}
                              className="px-2 py-1.5 text-xs text-[#74736F] hover:text-[#171717] cursor-pointer"
                            >
                              Отмена
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setRejectingAppId(app.id)}
                              className="px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 rounded cursor-pointer transition-colors"
                            >
                              Отклонить
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApprove(app.id)}
                              className="px-4 py-2 text-xs font-bold text-white bg-[#258568] hover:bg-[#1f6e56] rounded cursor-pointer transition-colors shadow-xs"
                            >
                              ✓ Одобрить школу
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Previously Processed */}
            {processedApps.length > 0 && (
              <div>
                <h3 className="text-xs font-mono font-bold uppercase text-[#74736F] mb-3">
                  История рассмотрения ({processedApps.length})
                </h3>
                <div className="bg-white border border-[#D9D5CB] rounded divide-y divide-[#E2DED5]">
                  {processedApps.map((app) => (
                    <div key={app.id} className="p-4 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-[#171717]">
                          {app.schoolName} ({app.city})
                        </div>
                        <div className="text-[11px] text-[#74736F]">
                          {app.representativeName} · {app.representativeEmail}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {app.status === 'approved' ? (
                          <span className="px-2 py-0.5 bg-[#258568]/10 text-[#258568] font-mono font-bold rounded">
                            Одобрена
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 font-mono font-bold rounded">
                            Отклонена: {app.rejectionReason}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Organizations */}
        {activeTab === 'organizations' && (
          <div className="space-y-4">
            <div className="bg-white border border-[#D9D5CB] rounded overflow-hidden">
              <div className="p-4 border-b border-[#D9D5CB] bg-[#FAF9F5] flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-[#74736F]">
                  Подключенные учебные заведения
                </span>
                <span className="text-xs text-[#74736F]">Всего: {organizations.length}</span>
              </div>

              <div className="divide-y divide-[#E2DED5]">
                {organizations.map((org) => (
                  <div
                    key={org.id}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="font-bold text-sm text-[#171717]">{org.name}</h3>
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                            org.status === 'active'
                              ? 'bg-[#258568]/10 text-[#258568]'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {org.status === 'active' ? 'АКТИВНА' : 'ПРИОСТАНОВЛЕНА'}
                        </span>
                      </div>

                      <div className="text-xs text-[#74736F] mt-1 flex flex-wrap gap-x-4">
                        <span>Город: {org.city}</span>
                        <span>Контакт: {org.contactPerson} ({org.contactEmail})</span>
                        <span>
                          Мест по лицензии: {org.licenses?.usedSeats || 0} / {org.licenses?.totalSeats || 60}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(org.id, org.status)}
                        className="px-3 py-1.5 text-xs font-semibold border border-[#D9D5CB] rounded hover:bg-[#FAF9F5] cursor-pointer"
                      >
                        {org.status === 'active' ? 'Приостановить' : 'Возобновить'}
                      </button>

                      <button
                        type="button"
                        onClick={() => onNavigateSchoolAdmin(org.id)}
                        className="px-4 py-1.5 text-xs font-bold text-white bg-[#171717] hover:bg-black rounded cursor-pointer transition-colors"
                      >
                        Войти в кабинет школы →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
