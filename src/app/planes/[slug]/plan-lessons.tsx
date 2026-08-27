"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { t } from "@/lib/i18n/es";
import { cn } from "@/lib/utils";

type Lesson = {
  id: string;
  position: number;
  title: string;
  bible_reading: string;
  explanation: string;
  questions: string[] | null;
  activity: string | null;
  prayer: string | null;
};

export function PlanLessons({
  planId,
  lessons,
  initialCompleted,
  hasStarted,
  isLoggedIn,
}: {
  planId: string;
  lessons: Lesson[];
  initialCompleted: string[];
  hasStarted: boolean;
  isLoggedIn: boolean;
}) {
  const [completed, setCompleted] = useState<Set<string>>(new Set(initialCompleted));
  const [started, setStarted] = useState(hasStarted);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const percent = lessons.length ? Math.round((completed.size / lessons.length) * 100) : 0;
  const isDone = percent === 100;

  function startPlan() {
    startTransition(async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from("user_plan_progress")
        .upsert({ user_id: user.id, plan_id: planId, state: "active" }, { onConflict: "user_id,plan_id" });
      if (error) setError(t.common.error);
      else setStarted(true);
    });
  }

  function completeLesson(lessonId: string) {
    startTransition(async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const next = new Set(completed);
      next.add(lessonId);
      const allDone = next.size === lessons.length;

      const { error } = await supabase
        .from("user_plan_progress")
        .upsert(
          {
            user_id: user.id,
            plan_id: planId,
            completed_lessons: Array.from(next),
            state: allDone ? "completed" : "active",
            completed_at: allDone ? new Date().toISOString() : null,
          },
          { onConflict: "user_id,plan_id" }
        );
      if (error) setError(t.common.error);
      else setCompleted(next);
    });
  }

  return (
    <div className="space-y-4">
      {isLoggedIn ? (
        started ? (
          <div>
            <div className="flex items-center justify-between text-sm font-semibold">
              <span>{t.plans.progress}</span>
              <span className="text-anil-600">{percent}%</span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t.plans.progress}
              className="mt-1 h-2.5 overflow-hidden rounded-full bg-manta"
            >
              <div
                className="h-full rounded-full bg-balsamo-500"
                style={{ width: `${percent}%`, transition: "width 500ms cubic-bezier(0.34, 1.2, 0.4, 1)" }}
              />
            </div>
          </div>
        ) : (
          <Button onClick={startPlan} disabled={pending} className="w-full">
            {t.plans.start}
          </Button>
        )
      ) : (
        <Link href="/auth/login" className="block text-center text-sm font-semibold text-anil-600">
          {t.auth.login} para registrar tu progreso
        </Link>
      )}

      {isDone ? (
        <p role="status" className="rounded-[var(--radius-card)] bg-cirio-100 p-4 text-center font-display text-cirio-600">
          {t.plans.congrats}
        </p>
      ) : null}

      {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}

      <LessonDeck
        lessons={lessons}
        completed={completed}
        started={started}
        isLoggedIn={isLoggedIn}
        pending={pending}
        onComplete={completeLesson}
      />
    </div>
  );
}

/**
 * Galería de tarjetas de vidrio: una lección al frente, con las
 * vecinas asomando a los lados (mismo lenguaje visual de Liquid Glass
 * que el resto de la app). Toda la lógica de progreso vive en el
 * componente padre — esto solo es la presentación.
 */
function LessonDeck({
  lessons,
  completed,
  started,
  isLoggedIn,
  pending,
  onComplete,
}: {
  lessons: Lesson[];
  completed: Set<string>;
  started: boolean;
  isLoggedIn: boolean;
  pending: boolean;
  onComplete: (lessonId: string) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const active = lessons[activeIndex];

  function goTo(index: number) {
    if (index < 0 || index >= lessons.length) return;
    setActiveIndex(index);
    setExpanded(false);
  }

  if (!lessons.length || !active) return null;

  return (
    <div className="space-y-3">
      <div className="relative h-[26rem] sm:h-[30rem]" style={{ perspective: "1200px" }}>
        {lessons.map((lesson, i) => {
          const offset = i - activeIndex;
          if (Math.abs(offset) > 1) return null;
          const done = completed.has(lesson.id);
          const isActive = offset === 0;

          return (
            <button
              key={lesson.id}
              type="button"
              onClick={() => (isActive ? null : goTo(i))}
              aria-label={isActive ? undefined : `Ir a la lección ${lesson.position}`}
              aria-current={isActive ? "true" : undefined}
              className={cn(
                "absolute inset-x-6 top-0 h-full overflow-hidden rounded-[var(--radius-card)] text-left shadow-xl transition-all duration-300 ease-out",
                isActive ? "z-30 cursor-default" : "z-10 cursor-pointer"
              )}
              style={{
                transform:
                  offset === 0
                    ? "translateX(0) scale(1)"
                    : `translateX(${offset > 0 ? "78%" : "-78%"}) scale(0.9)`,
                opacity: Math.abs(offset) > 1 ? 0 : isActive ? 1 : 0.55,
              }}
            >
              <div className="relative h-2/5 w-full">
                <Image
                  src="/plans/lesson-cover-example.jpg"
                  alt=""
                  fill
                  sizes="(max-width: 640px) 90vw, 500px"
                  className="object-cover"
                  priority={isActive}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-anil-900/90 via-transparent to-black/10" />
                <span className="absolute left-4 top-4 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-anil-50 backdrop-blur">
                  Lección {lesson.position}
                </span>
                {done ? (
                  <span className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-balsamo-500 text-white">
                    <span className="animate-check-pop">✓</span>
                  </span>
                ) : null}
              </div>

              <div className="glass-dark flex h-3/5 flex-col p-5">
                <h3 className="font-display text-xl font-semibold">{lesson.title}</h3>
                <p className="mt-1 text-sm font-medium text-cirio-100">{lesson.bible_reading}</p>

                {isActive ? (
                  <div className="mt-3 flex-1 space-y-3 overflow-y-auto text-sm leading-relaxed text-anil-50/90">
                    <p className={expanded ? "" : "line-clamp-3"}>{lesson.explanation}</p>

                    {expanded ? (
                      <>
                        {lesson.questions?.length ? (
                          <div>
                            <h4 className="font-semibold text-anil-50">{t.devotional.questions}</h4>
                            <ul className="mt-1 list-disc space-y-1 pl-5">
                              {lesson.questions.map((q, qi) => <li key={qi}>{q}</li>)}
                            </ul>
                          </div>
                        ) : null}
                        {lesson.activity ? (
                          <p className="rounded-xl bg-white/10 p-3">{lesson.activity}</p>
                        ) : null}
                        {lesson.prayer ? <p className="italic text-anil-50/75">{lesson.prayer}</p> : null}
                      </>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
                        className="glass-chip rounded-full px-4 py-2 text-xs font-semibold"
                      >
                        {expanded ? "↑ Ver menos" : "↗ Expandir"}
                      </button>
                      {isLoggedIn && started && !done ? (
                        <Button
                          variant="accent"
                          onClick={(e) => { e.stopPropagation(); onComplete(lesson.id); }}
                          disabled={pending}
                          className="min-h-9 px-4 text-xs"
                        >
                          {t.plans.completeLesson}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      {/* Barra flotante inferior: navegación entre lecciones */}
      <div className="glass-dark mx-auto flex w-full max-w-sm items-center justify-between rounded-full px-2 py-2">
        <button
          type="button"
          onClick={() => goTo(activeIndex - 1)}
          disabled={activeIndex === 0}
          aria-label="Lección anterior"
          className="flex h-10 w-10 items-center justify-center rounded-full text-anil-50 disabled:opacity-30"
        >
          ←
        </button>
        <span className="text-sm font-semibold text-anil-50">
          {activeIndex + 1} de {lessons.length}
        </span>
        <button
          type="button"
          onClick={() => goTo(activeIndex + 1)}
          disabled={activeIndex === lessons.length - 1}
          aria-label="Lección siguiente"
          className="flex h-10 w-10 items-center justify-center rounded-full text-anil-50 disabled:opacity-30"
        >
          →
        </button>
      </div>
    </div>
  );
}
