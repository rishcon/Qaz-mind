import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  FolderTree,
  ChevronRight,
  FileText,
  HelpCircle,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import { SubjectItem, TopicItem } from '../types';
import { adminService } from '../services/adminService';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ActionResultNotice, failureResult, type ActionResult } from '../components/ui/ConnectionNotice';

interface SubjectsPageProps {
  onNavigate: (path: string) => void;
}

export const SubjectsPage: React.FC<SubjectsPageProps> = ({ onNavigate }) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [createSubjectOpen, setCreateSubjectOpen] = useState(false);
  const [newSubNameRu, setNewSubNameRu] = useState('');
  const [newSubNameKz, setNewSubNameKz] = useState('');
  const [newSubType, setNewSubType] = useState<'mandatory' | 'profile'>('profile');
  const [newSubCode, setNewSubCode] = useState('');

  // Topic creation modal
  const [createTopicOpen, setCreateTopicOpen] = useState(false);
  const [newTopicTitleRu, setNewTopicTitleRu] = useState('');
  const [newTopicTitleKz, setNewTopicTitleKz] = useState('');
  const [newTopicSection, setNewTopicSection] = useState('Общий раздел');
  const [result, setResult] = useState<ActionResult | null>(null);

  const subjects = adminService.getSubjects();
  const activeSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];
  const topics = adminService.getTopics(activeSubject?.id);

  // A refused create keeps the form open with the typed values, so nothing has to be typed again.
  const handleCreateSubject = () => {
    if (!newSubNameRu.trim() || !newSubCode.trim()) return;
    try {
      adminService.createSubject({
        id: newSubCode.trim().toLowerCase().replace(/_/g, '-'),
        code: newSubCode.trim().toUpperCase(),
        nameRu: newSubNameRu.trim(),
        nameKz: newSubNameKz.trim() || newSubNameRu.trim(),
        description: `Учебный предмет ЕНТ: ${newSubNameRu.trim()}`,
        type: newSubType,
        status: 'active',
        color: '#FF5A36',
      });
      setCreateSubjectOpen(false);
      setNewSubNameRu('');
      setNewSubNameKz('');
      setNewSubCode('');
    } catch (error) {
      setResult(failureResult(error));
    }
  };

  const handleCreateTopic = () => {
    if (!newTopicTitleRu.trim() || !activeSubject) return;
    try {
      adminService.createTopic({
        subjectId: activeSubject.id,
        sectionTitle: newTopicSection.trim(),
        titleRu: newTopicTitleRu.trim(),
        titleKz: newTopicTitleKz.trim() || newTopicTitleRu.trim(),
        order: topics.length + 1,
        status: 'published',
      });
      setCreateTopicOpen(false);
      setNewTopicTitleRu('');
      setNewTopicTitleKz('');
    } catch (error) {
      setResult(failureResult(error));
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#E2DED5]">
        <div>
          <h1 className="text-xl font-bold text-[#171717]">Предметы и учебная программа ЕНТ</h1>
          <p className="text-xs text-[#78716C] mt-0.5">
            Иерархическая структура образовательных курсов: Предмет → Раздел → Тема → Уроки и задания.
          </p>
        </div>

        <button
          onClick={() => setCreateSubjectOpen(true)}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#FF5A36] hover:bg-[#E84D2B] rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" /> Добавить предмет
        </button>
      </div>

      {!createSubjectOpen && !createTopicOpen && (
        <ActionResultNotice result={result} onDismiss={() => setResult(null)} />
      )}

      {/* Grid: Left Subjects List + Right Topic Hierarchy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Subject List */}
        <div className="bg-white rounded-xl border border-[#E2DED5] p-4 space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#78716C] px-2 mb-2">
            Предметы ЕНТ ({subjects.length})
          </h2>

          <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
            {subjects.map((sub) => {
              const isSelected = sub.id === activeSubject?.id;
              return (
                <div
                  key={sub.id}
                  onClick={() => setSelectedSubjectId(sub.id)}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#FF5A36] bg-[#FFF7F5] shadow-xs'
                      : 'border-[#E2DED5] bg-white hover:bg-[#FAF9F6]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isSelected ? 'text-[#FF5A36]' : 'text-[#171717]'
                      }`}
                    >
                      {sub.nameRu}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        sub.type === 'mandatory'
                          ? 'bg-[#EBF7F2] text-[#258568]'
                          : 'bg-[#F0EEE8] text-[#5C574F]'
                      }`}
                    >
                      {sub.type === 'mandatory' ? 'Обязательный' : 'Профильный'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#78716C] mt-0.5">{sub.nameKz}</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-[#A8A29E] font-medium">
                    <span>{sub.topicsCount} тем</span>
                    <span>•</span>
                    <span>{sub.lessonsCount} уроков</span>
                    <span>•</span>
                    <span>{sub.questionsCount} вопросов</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Columns: Curriculum structure for active subject */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-[#E2DED5] p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E2DED5]">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF5A36]">
                  {activeSubject?.code} • {activeSubject?.type === 'mandatory' ? 'Обязательный блок' : 'Профильный блок'}
                </span>
                <h2 className="text-lg font-bold text-[#171717] mt-0.5">{activeSubject?.nameRu}</h2>
                <p className="text-xs text-[#78716C] mt-1">{activeSubject?.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCreateTopicOpen(true)}
                  className="px-3 py-1.5 text-xs font-medium text-[#171717] bg-white border border-[#E2DED5] rounded-md hover:bg-[#F5F3EE] flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-[#FF5A36]" /> Добавить тему
                </button>
                <button
                  onClick={() => onNavigate(`/admin/content/questions?subjectId=${activeSubject?.id}`)}
                  className="px-3 py-1.5 text-xs font-medium text-[#FF5A36] bg-[#FFF7F5] border border-[#FF5A36]/30 rounded-md hover:bg-[#FFEFEA] flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <HelpCircle className="w-3.5 h-3.5" /> Вопросы предмета
                </button>
              </div>
            </div>

            {/* Topics Hierarchy List */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#78716C] mb-3">
                Темы учебного плана ({topics.length})
              </h3>

              <div className="space-y-2.5">
                {topics.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#78716C] bg-[#FAF9F6] rounded-lg border border-[#E2DED5]">
                    Для данного предмета еще не добавлены темы. Нажмите «Добавить тему» выше.
                  </div>
                ) : (
                  topics.map((t, idx) => (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-lg border border-[#E2DED5] bg-white hover:border-[#C5BFB5] transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-md bg-[#F0EEE8] flex items-center justify-center font-mono text-xs font-bold text-[#5C574F]">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-[#171717]">{t.titleRu}</div>
                          <div className="text-[11px] text-[#78716C]">
                            Раздел: <span className="font-medium text-[#171717]">{t.sectionTitle}</span> • {t.lessonsCount} уроков
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onNavigate(`/admin/content/lessons?subjectId=${activeSubject?.id}`)}
                          className="px-2.5 py-1 text-xs text-[#78716C] hover:text-[#FF5A36] bg-[#FAF9F6] border border-[#E2DED5] rounded cursor-pointer"
                        >
                          Уроки ({t.lessonsCount})
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Subject Modal */}
      {createSubjectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl border border-[#E2DED5] overflow-hidden">
            <div className="p-4 border-b border-[#E2DED5] flex items-center justify-between bg-[#FCFBF9]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
                Создание учебного предмета ЕНТ
              </h3>
              <button onClick={() => setCreateSubjectOpen(false)} className="text-[#A8A29E] hover:text-[#171717]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <ActionResultNotice result={result} onDismiss={() => setResult(null)} />
              <div>
                <label className="text-xs font-medium text-[#78716C] block mb-1">Код предмета (ENG)</label>
                <input
                  type="text"
                  value={newSubCode}
                  onChange={(e) => setNewSubCode(e.target.value)}
                  placeholder="Код предмета"
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#E2DED5] rounded-md font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#78716C] block mb-1">Название (RU) *</label>
                <input
                  type="text"
                  value={newSubNameRu}
                  onChange={(e) => setNewSubNameRu(e.target.value)}
                  placeholder="Название предмета"
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#E2DED5] rounded-md font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#78716C] block mb-1">Название (KZ)</label>
                <input
                  type="text"
                  value={newSubNameKz}
                  onChange={(e) => setNewSubNameKz(e.target.value)}
                  placeholder="Атауы"
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#E2DED5] rounded-md font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#78716C] block mb-1">Тип предмета</label>
                <select
                  value={newSubType}
                  onChange={(e) => setNewSubType(e.target.value as any)}
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#E2DED5] rounded-md"
                >
                  <option value="profile">Профильный предмет ЕНТ</option>
                  <option value="mandatory">Обязательный предмет ЕНТ</option>
                </select>
              </div>
            </div>
            <div className="p-3 bg-[#FCFBF9] border-t border-[#E2DED5] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateSubjectOpen(false)}
                className="px-3 py-1.5 text-xs text-[#78716C] bg-white border border-[#E2DED5] rounded hover:bg-[#F5F3EE]"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleCreateSubject}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#FF5A36] hover:bg-[#E84D2B] rounded cursor-pointer shadow-xs"
              >
                Создать предмет
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Topic Modal */}
      {createTopicOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl border border-[#E2DED5] overflow-hidden">
            <div className="p-4 border-b border-[#E2DED5] flex items-center justify-between bg-[#FCFBF9]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
                Добавление темы в предмет: {activeSubject?.nameRu}
              </h3>
              <button onClick={() => setCreateTopicOpen(false)} className="text-[#A8A29E] hover:text-[#171717]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <ActionResultNotice result={result} onDismiss={() => setResult(null)} />
              <div>
                <label className="text-xs font-medium text-[#78716C] block mb-1">Раздел курса</label>
                <input
                  type="text"
                  value={newTopicSection}
                  onChange={(e) => setNewTopicSection(e.target.value)}
                  placeholder="Название раздела"
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#E2DED5] rounded-md"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#78716C] block mb-1">Название темы (RU) *</label>
                <input
                  type="text"
                  value={newTopicTitleRu}
                  onChange={(e) => setNewTopicTitleRu(e.target.value)}
                  placeholder="Название темы"
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#E2DED5] rounded-md font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#78716C] block mb-1">Название темы (KZ)</label>
                <input
                  type="text"
                  value={newTopicTitleKz}
                  onChange={(e) => setNewTopicTitleKz(e.target.value)}
                  placeholder="Тақырыбы"
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#E2DED5] rounded-md font-medium"
                />
              </div>
            </div>
            <div className="p-3 bg-[#FCFBF9] border-t border-[#E2DED5] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateTopicOpen(false)}
                className="px-3 py-1.5 text-xs text-[#78716C] bg-white border border-[#E2DED5] rounded hover:bg-[#F5F3EE]"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleCreateTopic}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#FF5A36] hover:bg-[#E84D2B] rounded cursor-pointer shadow-xs"
              >
                Добавить тему
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
