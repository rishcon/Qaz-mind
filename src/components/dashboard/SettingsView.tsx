import React, { useState } from 'react';
import { Language } from '../../types';
import { StudentProfile } from '../../types/dashboard';
import { OFFICIAL_PROFILE_PAIRS } from '../../types/auth';
import { Check, Save, User, Shield, Bell, BookOpen } from 'lucide-react';
import { errorText } from '../../api/client';

interface SettingsViewProps {
  currentLang: Language;
  profile: StudentProfile;
  onUpdateProfile: (updated: Partial<StudentProfile>) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentLang,
  profile,
  onUpdateProfile,
}) => {
  const [name, setName] = useState(profile.name);
  const [grade, setGrade] = useState(profile.grade);
  const [city, setCity] = useState(profile.city);
  const [targetScore, setTargetScore] = useState(profile.targetScore);
  const [examLanguage, setExamLanguage] = useState<'ru' | 'kz'>(profile.examLanguage);
  const [profilePairId, setProfilePairId] = useState(profile.profilePairId);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const pair = OFFICIAL_PROFILE_PAIRS.find((p) => p.id === profilePairId) || OFFICIAL_PROFILE_PAIRS[0];

    // Only the fields stored on the server are sent (see toProfilePatch); name is the account name.
    setSaveError('');
    setSavedSuccess(false);
    try {
      await onUpdateProfile({
        targetScore,
        examLanguage,
        profilePairId,
        profilePairLabelRu: `${pair.titleRu} (${pair.clusterRu})`,
        profilePairLabelKz: `${pair.titleKz} (${pair.clusterKz})`,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      setSaveError(errorText(err));
    }
  };

  return (
    <div className="space-y-8 max-w-2xl animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#171717]">
          {currentLang === 'kz' ? 'Баптаулар' : 'Настройки профиля'}
        </h1>
        <p className="mt-1 text-sm text-[#74736F]">
          Управление личными данными, целевым баллом и профильными предметами.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-[#E2DED5] p-6 md:p-8 rounded-sm shadow-xs space-y-6">
        {saveError && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded text-xs font-bold text-red-700">{saveError}</div>
        )}
        {savedSuccess && (
          <div className="p-3.5 bg-green-50 border border-green-200 rounded text-xs font-bold text-green-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            <span>{currentLang === 'kz' ? 'Баптаулар сәтті сақталды!' : 'Настройки успешно сохранены!'}</span>
          </div>
        )}

        {/* Section 1: Personal Data */}
        <div className="space-y-4">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A36] block">
            Личные данные
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
                Имя
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs border border-[#E2DED5] rounded bg-[#FAF8F5] focus:bg-white focus:outline-none focus:border-[#FF5A36]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
                Город
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs border border-[#E2DED5] rounded bg-[#FAF8F5] focus:bg-white focus:outline-none focus:border-[#FF5A36]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Exam Goal & Subject Pairs */}
        <div className="space-y-4 pt-4 border-t border-[#E2DED5]">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A36] block">
            Параметры ЕНТ
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
                Целевой балл (до 140)
              </label>
              <input
                type="number"
                min="60"
                max="140"
                value={targetScore}
                onChange={(e) => setTargetScore(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm font-mono font-bold text-[#171717] border border-[#E2DED5] rounded bg-[#FAF8F5] focus:bg-white focus:outline-none focus:border-[#FF5A36]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
                Язык экзамена
              </label>
              <select
                value={examLanguage}
                onChange={(e) => setExamLanguage(e.target.value as 'ru' | 'kz')}
                className="w-full px-3.5 py-2.5 text-xs border border-[#E2DED5] rounded bg-[#FAF8F5] focus:bg-white focus:outline-none focus:border-[#FF5A36]"
              >
                <option value="ru">Русский язык</option>
                <option value="kz">Қазақ тілі</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171717] uppercase mb-1">
              Профильные предметы
            </label>
            <select
              value={profilePairId}
              onChange={(e) => setProfilePairId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs border border-[#E2DED5] rounded bg-[#FAF8F5] focus:bg-white focus:outline-none focus:border-[#FF5A36]"
            >
              {OFFICIAL_PROFILE_PAIRS.map((pair) => (
                <option key={pair.id} value={pair.id}>
                  {pair.titleRu} — {pair.clusterRu}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-[#74736F] mt-1 block">
              При смене профиля предметы и рекомендации обновятся автоматически. Ранее пройденные уроки сохранятся.
            </span>
          </div>
        </div>

        {/* Section 3: School Affiliation */}
        <div className="space-y-4 pt-4 border-t border-[#E2DED5]">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF5A36] block">
            Школьное обучение
          </span>

          <div className="p-4 bg-[#FAF9F5] border border-[#E2DED5] rounded text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-[#171717]">Лицей №28 им. К. Сатпаева</div>
                <div className="text-[11px] text-[#74736F]">Класс 11 «А» · Подготовка к ЕНТ 2026/2027</div>
              </div>
              <span className="px-2 py-0.5 bg-[#258568]/10 text-[#258568] font-mono font-bold rounded">
                Подключен
              </span>
            </div>
            <p className="text-[11px] text-[#74736F] pt-1">
              Вы прикреплены к классу по коду. Все ваши школьные проверочные работы отображаются на вкладке «Сегодня».
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-[#E2DED5] flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#171717] hover:bg-[#FF5A36] text-white font-mono font-bold text-xs uppercase tracking-wider rounded-sm transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Сохранить изменения</span>
          </button>
        </div>
      </form>
    </div>
  );
};
