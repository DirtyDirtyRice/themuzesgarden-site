"use client";

import { useEffect, useState } from "react";

type DemoQuestion = {
  prompt: string;
  answers: string[];
  correctAnswer: string;
  player: string;
};

const DEMO_QUESTIONS: DemoQuestion[] = [
  {
    prompt: "How many beats are in a standard 4/4 measure?",
    answers: ["2", "3", "4"],
    correctAnswer: "4",
    player: "Maya",
  },
  {
    prompt: "Which word means gradually getting louder?",
    answers: ["Crescendo", "Rest", "Tempo"],
    correctAnswer: "Crescendo",
    player: "Jordan",
  },
  {
    prompt: "Which instrument belongs to the percussion family?",
    answers: ["Violin", "Snare drum", "Clarinet"],
    correctAnswer: "Snare drum",
    player: "Maya",
  },
];

const buttonClass =
  "rounded-lg border border-white/25 bg-white px-4 py-2 text-sm font-bold text-black transition hover:opacity-85 active:scale-[0.98]";

export default function LiveMusicChallengeGuide() {
  const [demoOpen, setDemoOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!demoOpen) return;

    const timer = window.setInterval(() => {
      setStep((current) => (current + 1) % DEMO_QUESTIONS.length);
    }, 3500);

    return () => window.clearInterval(timer);
  }, [demoOpen]);

  const question = DEMO_QUESTIONS[step];
  const mayaScore = DEMO_QUESTIONS.slice(0, step + 1).filter(
    (item) => item.player === "Maya"
  ).length;
  const jordanScore = DEMO_QUESTIONS.slice(0, step + 1).filter(
    (item) => item.player === "Jordan"
  ).length;

  return (
    <section className="rounded-2xl border border-emerald-400/35 bg-emerald-950/20 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-300">
            Music Challenge
          </p>
          <h2 className="mt-2 text-2xl font-bold">Learn music through friendly competition</h2>
          <p className="mt-2 text-sm leading-6 text-white/75">
            Children answer age-appropriate questions about rhythm, instruments, notes,
            music words, and listening skills. Correct answers earn points while the
            scoreboard keeps the game exciting.
          </p>
        </div>

        <button
          className={buttonClass}
          type="button"
          onClick={() => {
            setStep(0);
            setDemoOpen((open) => !open);
          }}
        >
          {demoOpen ? "Close Demonstration" : "See Game Played"}
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <article className="rounded-xl border border-white/15 bg-black/35 p-4">
          <h3 className="font-bold">Race to the Score</h3>
          <p className="mt-1 text-sm text-white/70">
            Choose a winning score before play begins. The first player or team to
            reach that score wins.
          </p>
        </article>
        <article className="rounded-xl border border-white/15 bg-black/35 p-4">
          <h3 className="font-bold">Question Challenge</h3>
          <p className="mt-1 text-sm text-white/70">
            Choose the number of questions. When the final question is answered, the
            player or team with the highest score wins.
          </p>
        </article>
      </div>

      {demoOpen ? (
        <div
          className="mt-5 rounded-xl border border-amber-300/35 bg-black/60 p-4"
          aria-live="polite"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Demonstration · Question {step + 1} of {DEMO_QUESTIONS.length}
              </p>
              <p className="mt-2 text-lg font-bold">{question.prompt}</p>
            </div>
            <div className="rounded-lg border border-white/15 px-3 py-2 text-sm">
              Maya {mayaScore} · Jordan {jordanScore}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {question.answers.map((answer) => (
              <span
                key={answer}
                className={[
                  "rounded-lg border px-3 py-2 text-sm",
                  answer === question.correctAnswer
                    ? "border-emerald-300 bg-emerald-400/20 text-emerald-100"
                    : "border-white/15 bg-white/5 text-white/60",
                ].join(" ")}
              >
                {answer}
              </span>
            ))}
          </div>

          <p className="mt-4 text-sm text-emerald-200">
            {question.player} selected “{question.correctAnswer}” — correct! +1 point
          </p>
          <p className="mt-2 text-xs text-white/55">
            The demonstration advances automatically every few seconds.
          </p>
        </div>
      ) : null}

      <p className="mt-4 text-xs text-white/55">
        The transition-timing game below is the current playable engine. Music
        questions will become an additional game format built on the same scoring,
        rounds, and results foundation.
      </p>
    </section>
  );
}
