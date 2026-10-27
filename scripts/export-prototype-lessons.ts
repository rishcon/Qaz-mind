// One-off export: turns the prototype lesson modules into content files for the backend importer.
// Output is DRAFT material: nothing here is verified by an expert, and the importer never publishes it.
//
//   npm run export:prototype   (or: npx tsx scripts/export-prototype-lessons.ts)
//
// Writes apps/api/content/drafts/<subject>.json. Lessons without a chapter or without a parseable
// duration are skipped and reported, never guessed.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL_SUBJECT_CURRICULA, LESSON_MODULES } from '../apps/web/src/content/curriculumData';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'apps', 'api', 'content', 'drafts');
const AUTHOR = 'Прототип QazMind (ИИ-черновик, не проверен)';
const SOURCE = 'Прототип QazMind: не сверено с учебником и не проверено экспертом';

type Step = (typeof LESSON_MODULES)[string]['steps'][number];

function slugify(id: string): string {
  return id.replace(/^lesson-/, '').replace(/^l_/, '').replace(/_/g, '-').toLowerCase();
}

function minutes(duration: string): number | null {
  const match = /^(\d+)/.exec(duration.trim());
  return match ? Number(match[1]) : null;
}

function stepJson(step: Step) {
  const out: Record<string, string> = {
    heading_ru: step.headingRu,
    heading_kz: step.headingKz,
    body_ru: step.bodyRu,
    body_kz: step.bodyKz,
  };
  if (step.keyFactRu) out.key_fact_ru = step.keyFactRu;
  if (step.keyFactKz) out.key_fact_kz = step.keyFactKz;
  if (step.exampleRu) out.example_ru = step.exampleRu;
  if (step.exampleKz) out.example_kz = step.exampleKz;
  return out;
}

const bySubject = new Map<string, unknown[]>();
const skipped: string[] = [];

for (const lessonId of Object.keys(LESSON_MODULES)) {
  const lesson = LESSON_MODULES[lessonId];
  const curriculum = ALL_SUBJECT_CURRICULA[lesson.subjectId];
  const chapterIndex = curriculum?.chapters.findIndex((chapter) => chapter.lessons.some((l) => l.id === lessonId)) ?? -1;
  if (!curriculum || chapterIndex < 0) {
    skipped.push(`${lessonId}: нет главы в программе предмета`);
    continue;
  }
  const chapter = curriculum.chapters[chapterIndex];
  const lessonIndex = chapter.lessons.findIndex((l) => l.id === lessonId);
  const estimated = minutes(lesson.durationRu);
  if (estimated === null) {
    skipped.push(`${lessonId}: длительность «${lesson.durationRu}» не разбирается`);
    continue;
  }

  const entry = {
    slug: slugify(lessonId),
    position: lessonIndex + 1,
    title_ru: lesson.titleRu,
    title_kz: lesson.titleKz,
    estimated_minutes: estimated,
    source_reference: SOURCE,
    steps: lesson.steps.map(stepJson),
  };

  const topic = {
    slug: chapter.id.replace(/^ch-/, ''),
    position: chapterIndex + 1,
    title_ru: chapter.titleRu,
    title_kz: chapter.titleKz,
    lessons: [entry],
  };
  // One topic per chapter; lessons of the same chapter are grouped together.
  const topics = (bySubject.get(lesson.subjectId) as typeof topic[] | undefined) ?? [];
  const existing = topics.find((t) => t.slug === topic.slug);
  if (existing) {
    existing.lessons.push(entry);
  } else {
    topics.push(topic);
  }
  bySubject.set(lesson.subjectId, topics);
}

mkdirSync(outDir, { recursive: true });
for (const [subjectId, topics] of bySubject) {
  const file = { subject: subjectId, author: AUTHOR, topics };
  const path = join(outDir, `${subjectId}.json`);
  writeFileSync(path, JSON.stringify(file, null, 2) + '\n', 'utf-8');
  const lessonCount = (topics as { lessons: unknown[] }[]).reduce((n, t) => n + t.lessons.length, 0);
  console.log(`${path}: тем ${topics.length}, уроков ${lessonCount}`);
}
for (const line of skipped) console.log(`пропущено — ${line}`);
