"use client";

import { useState, useTransition } from "react";
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
  const [openLesson, setOpenLesson] = useState<string | null>(null);
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

      <ol className="space-y-3">
        {lessons.map((lesson) => {
          const done = completed.has(lesson.id);
          const open = openLesson === lesson.id;
          return (
            <li key={lesson.id} className="overflow-hidden rounded-[var(--radius-card)] border border-manta bg-white dark:bg-manta">
              <button
                onClick={() => setOpenLesson(open ? null : lesson.id)}
                aria-expanded={open}
                className="flex w-full items-center gap-3 p-4 text-left"
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    done ? "bg-balsamo-500 text-white" : "bg-anil-100 text-anil-800"
                  )}
                >
                  {done ? <span className="animate-check-pop">✓</span> : lesson.position}
                </span>
                <span>
                  <span className="block font-display font-semibold">{lesson.title}</span>
                  <span className="block text-sm text-balsamo-700">{lesson.bible_reading}</span>
                </span>
              </button>

              {open ? (
                <div className="space-y-4 border-t border-manta p-4">
                  <p className="leading-relaxed">{lesson.explanation}</p>
                  {lesson.questions?.length ? (
                    <div>
                      <h3 className="font-semibold text-anil-800">{t.devotional.questions}</h3>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                        {lesson.questions.map((q, i) => <li key={i}>{q}</li>)}
                      </ul>
                    </div>
                  ) : null}
                  {lesson.activity ? (
                    <p className="rounded-xl bg-balsamo-100 p-3 text-sm">{lesson.activity}</p>
                  ) : null}
                  {lesson.prayer ? <p className="text-sm italic text-tinta-suave">{lesson.prayer}</p> : null}
                  {isLoggedIn && started && !done ? (
                    <Button variant="secondary" onClick={() => completeLesson(lesson.id)} disabled={pending}>
                      {t.plans.completeLesson}
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
