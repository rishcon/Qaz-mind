import React, { useState } from 'react';
import { Save, ShieldAlert, BookOpen, Globe } from 'lucide-react';
import { PlatformSettings } from '../types';
import { adminService } from '../services/adminService';
import { ActionResultNotice, failureResult, type ActionResult } from '../components/ui/ConnectionNotice';

/** Without settings from the server, the form is not drawn: nothing is shown as if it were the real configuration. */
export const SettingsPage: React.FC = () => {
  const loaded = adminService.getSettings();
  if (loaded === null) {
    return (
      <div className="space-y-6 animate-in fade-in duration-150 max-w-4xl">
        <div className="pb-2 border-b border-[#E2DED5]">
          <h1 className="text-xl font-bold text-[#171717]">Настройки платформы QazMind</h1>
          <p className="text-xs text-[#78716C] mt-0.5">Глобальная конфигурация, параметры ЕНТ и политики безопасности.</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2DED5] p-6 text-xs text-[#78716C]">
          Данные не загружены: сервер администрирования не подключён. Настройки не отображаются, чтобы не показать значения,
          которых нет на сервере.
        </div>
      </div>
    );
  }
  return <SettingsForm initial={loaded} />;
};

const SettingsForm: React.FC<{ initial: PlatformSettings }> = ({ initial }) => {
  const [settings, setSettings] = useState<PlatformSettings>(initial);
  const [result, setResult] = useState<ActionResult | null>(null);

  const handleSave = () => {
    try {
      adminService.updateSettings(settings);
      setResult({ tone: 'success', text: 'Настройки сохранены.' });
    } catch (error) {
      setResult(failureResult(error));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 max-w-4xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#E2DED5]">
        <div>
          <h1 className="text-xl font-bold text-[#171717]">Настройки платформы QazMind</h1>
          <p className="text-xs text-[#78716C] mt-0.5">
            Глобальная конфигурация образовательной платформы, параметры ЕНТ и политики безопасности.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2 text-xs font-semibold text-white bg-[#FF5A36] hover:bg-[#E84D2B] rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Save className="w-4 h-4" /> Сохранить настройки
        </button>
      </div>

      <ActionResultNotice result={result} onDismiss={() => setResult(null)} />

      {/* General Settings */}
      <div className="bg-white rounded-xl border border-[#E2DED5] p-5 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#171717] flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#FF5A36]" /> Общие параметры
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-[#171717] block mb-1">Название платформы</label>
            <input
              type="text"
              value={settings.general.platformName}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  general: { ...settings.general, platformName: e.target.value },
                })
              }
              className="w-full px-3 py-1.5 bg-[#FAF9F6] border border-[#E2DED5] rounded-md"
            />
          </div>

          <div>
            <label className="font-semibold text-[#171717] block mb-1">Служебный Email поддержки</label>
            <input
              type="email"
              value={settings.general.supportEmail}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  general: { ...settings.general, supportEmail: e.target.value },
                })
              }
              className="w-full px-3 py-1.5 bg-[#FAF9F6] border border-[#E2DED5] rounded-md"
            />
          </div>

          <div>
            <label className="font-semibold text-[#171717] block mb-1">Текущий учебный год</label>
            <input
              type="text"
              value={settings.general.academicYear}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  general: { ...settings.general, academicYear: e.target.value },
                })
              }
              className="w-full px-3 py-1.5 bg-[#FAF9F6] border border-[#E2DED5] rounded-md font-mono"
            />
          </div>

          <div className="flex items-center gap-2 pt-5">
            <input
              type="checkbox"
              id="allowReg"
              checked={settings.general.allowPublicRegistration}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  general: { ...settings.general, allowPublicRegistration: e.target.checked },
                })
              }
              className="rounded text-[#FF5A36] focus:ring-[#FF5A36] cursor-pointer"
            />
            <label htmlFor="allowReg" className="cursor-pointer font-medium text-[#171717]">
              Разрешить самостоятельную регистрацию учеников
            </label>
          </div>
        </div>
      </div>

      {/* Educational ENT Settings */}
      <div className="bg-white rounded-xl border border-[#E2DED5] p-5 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#171717] flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#258568]" /> Регламенты ЕНТ / ҰБТ
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-[#171717] block mb-1">Активная редакция ЕНТ</label>
            <input
              type="text"
              value={settings.educational.activeEntVersion}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  educational: { ...settings.educational, activeEntVersion: e.target.value },
                })
              }
              className="w-full px-3 py-1.5 bg-[#FAF9F6] border border-[#E2DED5] rounded-md font-mono"
            />
          </div>

          <div>
            <label className="font-semibold text-[#171717] block mb-1">Минимальный порог зачета (баллов)</label>
            <input
              type="number"
              value={settings.educational.minPassingScore}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  educational: { ...settings.educational, minPassingScore: Number(e.target.value) },
                })
              }
              className="w-full px-3 py-1.5 bg-[#FAF9F6] border border-[#E2DED5] rounded-md font-bold"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="requireDual"
              checked={settings.educational.requireDualLanguageForPublish}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  educational: { ...settings.educational, requireDualLanguageForPublish: e.target.checked },
                })
              }
              className="rounded text-[#258568] focus:ring-[#258568] cursor-pointer"
            />
            <label htmlFor="requireDual" className="cursor-pointer font-medium text-[#171717]">
              Требовать перевод на казахский язык при публикации заданий
            </label>
          </div>
        </div>
      </div>

      {/* Maintenance Mode */}
      <div className="bg-white rounded-xl border border-[#E2DED5] p-5 shadow-xs space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#C94A43] flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" /> Режим технического обслуживания
        </h2>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="maintenance"
            checked={settings.maintenance.maintenanceMode}
            onChange={(e) =>
              setSettings({
                ...settings,
                maintenance: { ...settings.maintenance, maintenanceMode: e.target.checked },
              })
            }
            className="rounded text-[#C94A43] focus:ring-[#C94A43] cursor-pointer"
          />
          <label htmlFor="maintenance" className="cursor-pointer text-xs font-semibold text-[#171717]">
            Включить режим технического обслуживания (Вход доступен только администраторам)
          </label>
        </div>
      </div>
    </div>
  );
};
