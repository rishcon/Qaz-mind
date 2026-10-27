import React, { useState } from 'react';
import { Language } from '../../types';
import { StudentProfile } from '../../types/dashboard';
import { OFFICIAL_PROFILE_PAIRS } from '../../types/auth';
import { ALL_SUBJECT_CURRICULA } from '../../content/curriculumData';
import {
  ArrowRight,
  BookOpen,
  Zap,
  Target,
  Sparkles,
  Layers,
} from 'lucide-react';

interface PracticeViewProps {
  currentLang: Language;
  profile: StudentProfile;
  onStartSession: (subjectId: string, count: number) => void;
  onNavigateToMistakes: () => void;
}

export const PracticeView: React.FC<PracticeViewProps> = ({
  currentLang,
  profile,
  onStartSession,
  onNavigateToMistakes,
}) => {
  const currentPair = OFFICIAL_PROFILE_PAIRS.find((p) => p.id === profile.profilePairId) || OFFICIAL_PROFILE_PAIRS[0];

  const availableSubjectIds = [
    'history_kz',
    'math_lit',
    'reading_lit',
    currentPair.subjectIds[0],
    currentPair.subjectIds[1],
  ];

  const [selectedSubject, setSelectedSubject] = useState<string>('history_kz');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [practiceMode, setPracticeMode] = useState<'subject' | 'quick'>('subject');

  const handleLaunch = () => {
    onStartSession(selectedSubject, questionCount);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#171717]">
          {currentLang === 'kz' ? 'Практика' : 'Практика'}
        </h1>
        <p className="mt-1 text-sm text-[#74736F]">
          {currentLang === 'kz'
            ? 'Сұрақтарды шешу арқылы біліміңізді бекітіңіз.'
            : 'Закрепляйте пройденные темы на реальных тестовых заданиях.'}
        </p>
      </div>

      {/* Main Configuration Card */}
      <div className="bg-white border border-[#E2DED5] p-6 md:p-8 rounded-sm shadow-xs max-w-2xl space-y-6">
        {/* Mode selector */}
        <div>
          <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#171717] mb-2.5">
            Формат тренировки
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPracticeMode('subject')}
              className={`p-3.5 border rounded text-left transition-all cursor-pointer ${
                practiceMode === 'subject'
                  ? 'border-[#FF5A36] bg-[#FAF8F5] ring-1 ring-[#FF5A36]'
                  : 'border-[#E2DED5] hover:border-[#171717]'
              }`}
            >
              <div className="font-bold text-xs text-[#171717] flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#FF5A36]" />
                <span>По конкретному предмету</span>
              </div>
              <div className="text-[11px] text-[#74736F] mt-1">
                Вопросы строго по выбранной дисциплине
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPracticeMode('quick')}
              className={`p-3.5 border rounded text-left transition-all cursor-pointer ${
                practiceMode === 'quick'
                  ? 'border-[#FF5A36] bg-[#FAF8F5] ring-1 ring-[#FF5A36]'
                  : 'border-[#E2DED5] hover:border-[#171717]'
              }`}
            >
              <div className="font-bold text-xs text-[#171717] flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#FF5A36]" />
                <span>Экспресс-тренировка</span>
              </div>
              <div className="text-[11px] text-[#74736F] mt-1">
                Быстрый срез из 5 смешанных заданий
              </div>
            </button>
          </div>
        </div>

        {/* Subject Selection (filtered to user's enrolled subjects) */}
        <div>
          <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#171717] mb-2.5">
            Дисциплина
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {availableSubjectIds.map((subId) => {
              const subMeta = ALL_SUBJECT_CURRICULA[subId] || {
                nameRu: subId,
                nameKz: subId,
              };
              const isSelected = selectedSubject === subId;

              return (
                <button
                  key={subId}
                  type="button"
                  onClick={() => setSelectedSubject(subId)}
                  className={`p-3 text-left border rounded text-xs transition-colors cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'border-[#FF5A36] bg-[#FAF8F5] font-bold text-[#171717] ring-1 ring-[#FF5A36]'
                      : 'border-[#E2DED5] text-[#74736F] hover:text-[#171717] hover:border-[#171717]'
                  }`}
                >
                  <span>{currentLang === 'kz' ? subMeta.nameKz : subMeta.nameRu}</span>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-[#FF5A36]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Count Selection */}
        <div>
          <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#171717] mb-2.5">
            Количество заданий
          </label>
          <div className="flex gap-2">
            {[5, 10, 15].map((cnt) => (
              <button
                key={cnt}
                type="button"
                onClick={() => setQuestionCount(cnt)}
                className={`flex-1 py-2 text-center border rounded font-mono text-xs font-bold transition-colors cursor-pointer ${
                  questionCount === cnt
                    ? 'border-[#171717] bg-[#171717] text-white'
                    : 'border-[#E2DED5] text-[#74736F] hover:border-[#171717]'
                }`}
              >
                {cnt} вопросов
              </button>
            ))}
          </div>
        </div>

        {/* Launch CTA Button */}
        <div className="pt-2 border-t border-[#E2DED5]">
          <button
            type="button"
            onClick={handleLaunch}
            className="w-full py-3.5 bg-[#FF5A36] hover:bg-[#E54825] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer rounded-sm shadow-sm"
          >
            <span>Начать практику</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-[11px] text-[#74736F] text-center mt-2.5">
            Практика откроется в полноэкранном режиме Focus Mode без отвлекающих элементов.
          </p>
        </div>
      </div>
    </div>
  );
};
