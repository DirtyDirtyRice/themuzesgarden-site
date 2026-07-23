"use client";

import { useState } from "react";

type Mode = "target" | "questions";
type Phase = "setup" | "playing" | "finished";
type Question = { prompt: string; answers: string[]; correct: string; explanation: string };

const QUESTIONS: Question[] = [
  { prompt: "How many beats are in a standard 4/4 measure?", answers: ["2", "3", "4"], correct: "4", explanation: "The top number in 4/4 means four beats per measure." },
  { prompt: "Which word means gradually getting louder?", answers: ["Crescendo", "Rest", "Tempo"], correct: "Crescendo", explanation: "A crescendo increases the volume gradually." },
  { prompt: "Which instrument belongs to the percussion family?", answers: ["Violin", "Snare drum", "Clarinet"], correct: "Snare drum", explanation: "A snare drum makes sound when it is struck." },
  { prompt: "What does a rest tell a musician to do?", answers: ["Play louder", "Pause", "Play faster"], correct: "Pause", explanation: "A rest marks a measured period of silence." },
  { prompt: "Which instrument usually has six strings?", answers: ["Guitar", "Flute", "Trumpet"], correct: "Guitar", explanation: "A standard guitar has six strings." },
  { prompt: "What does tempo describe?", answers: ["The speed", "The instrument", "The lyrics"], correct: "The speed", explanation: "Tempo describes how fast or slow music is played." },
];

const lightButton = "rounded-lg border border-white/25 bg-white px-4 py-2 text-sm font-bold text-black transition hover:opacity-85 active:scale-[0.98]";
const fieldClass = "rounded-lg border border-white/20 bg-black px-3 py-2 text-white outline-none focus:border-emerald-300";

export default function LiveMusicChallengeGuide() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [mode, setMode] = useState<Mode>("target");
  const [names, setNames] = useState<[string, string]>(["Player 1", "Player 2"]);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [turn, setTurn] = useState(0);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const activePlayer = turn % 2;
  const question = QUESTIONS[questionNumber % QUESTIONS.length];

  function updateName(index: 0 | 1, value: string) {
    setNames((current) => { const next: [string, string] = [...current]; next[index] = value; return next; });
  }

  function startGame() {
    setNames((current) => [current[0].trim() || "Player 1", current[1].trim() || "Player 2"]);
    setScores([0, 0]); setTurn(0); setQuestionNumber(0); setMessage(null); setWinner(null); setPhase("playing");
  }

  function chooseAnswer(answer: string) {
    if (message) return;
    const correct = answer === question.correct;
    const nextScores: [number, number] = [...scores];
    if (correct) nextScores[activePlayer] += 1;
    setScores(nextScores);
    setMessage(correct ? `Correct! ${question.explanation}` : `Good try. The answer is “${question.correct}.” ${question.explanation}`);
    const targetReached = mode === "target" && nextScores[activePlayer] >= 3;
    const limitReached = mode === "questions" && questionNumber + 1 >= QUESTIONS.length;
    if (targetReached) { setWinner(names[activePlayer]); setPhase("finished"); }
    if (limitReached) {
      setWinner(nextScores[0] === nextScores[1] ? "Tie game" : nextScores[0] > nextScores[1] ? names[0] : names[1]);
      setPhase("finished");
    }
  }

  function nextQuestion() { setTurn((value) => value + 1); setQuestionNumber((value) => value + 1); setMessage(null); }

  return (
    <section className="rounded-2xl border border-emerald-400/35 bg-emerald-950/20 p-5">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-300">Two-Player Music Challenge</p>
      <h2 className="mt-2 text-2xl font-bold">Learn music through friendly competition</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-white/75">Take turns answering questions about rhythm, instruments, music words, and listening skills. Correct answers earn one point.</p>

      {phase === "setup" ? (
        <div className="mt-5 space-y-4 rounded-xl border border-white/15 bg-black/45 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {([0, 1] as const).map((index) => (
              <label className="grid gap-1 text-sm font-semibold" key={index}>Player {index + 1} name
                <input className={fieldClass} value={names[index]} onChange={(event) => updateName(index, event.target.value)} />
              </label>
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <button type="button" onClick={() => setMode("target")} className={`rounded-xl border p-4 text-left ${mode === "target" ? "border-emerald-300 bg-emerald-400/15" : "border-white/15 bg-black/35"}`}>
              <strong>Race to 3 points</strong><span className="mt-1 block text-sm text-white/70">The first player to reach the target wins.</span>
            </button>
            <button type="button" onClick={() => setMode("questions")} className={`rounded-xl border p-4 text-left ${mode === "questions" ? "border-emerald-300 bg-emerald-400/15" : "border-white/15 bg-black/35"}`}>
              <strong>6-question challenge</strong><span className="mt-1 block text-sm text-white/70">The highest score after all questions wins.</span>
            </button>
          </div>
          <button className={lightButton} type="button" onClick={startGame}>Start Two-Player Game</button>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-amber-300/35 bg-black/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-bold text-amber-300">{phase === "playing" ? `${names[activePlayer]}'s turn · Question ${questionNumber + 1}` : winner === "Tie game" ? "The game ended in a tie!" : `${winner} wins!`}</p>
            <p className="rounded-lg border border-white/15 px-3 py-2 text-sm font-bold">{names[0]} {scores[0]} · {names[1]} {scores[1]}</p>
          </div>
          {phase === "playing" ? <>
            <h3 className="mt-5 text-xl font-bold">{question.prompt}</h3>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">{question.answers.map((answer) => (
              <button className="rounded-lg border border-white/20 bg-white/5 px-3 py-3 text-left text-sm font-semibold hover:border-emerald-300 disabled:cursor-not-allowed" disabled={Boolean(message)} key={answer} type="button" onClick={() => chooseAnswer(answer)}>{answer}</button>
            ))}</div>
            {message ? <div className="mt-4"><p className="text-sm text-emerald-100">{message}</p><button className={`${lightButton} mt-3`} type="button" onClick={nextQuestion}>Next Player</button></div> : null}
          </> : <button className={`${lightButton} mt-5`} type="button" onClick={startGame}>Play Rematch</button>}
          <button className="mt-4 block text-sm text-white/65 underline hover:text-white" type="button" onClick={() => setPhase("setup")}>Change players or game mode</button>
        </div>
      )}
      <p className="mt-4 text-xs text-white/55">This first version plays locally with two people sharing one screen. Only reviewed and approved community questions will enter the future question bank.</p>
    </section>
  );
}