// app/tools/islands/IslandQuestionWorkspacePanel.tsx

"use client";

const questionGroups = [
  {
    title: "Identity Questions",
    questions: [
      "Who Am I?",
      "What Am I Building?",
      "Why Am I Building It?",
      "Who Is It For?",
      "What Do I Want To Preserve?",
      "What Do I Want To Share?",
      "What Do I Want To Learn?",
      "What Do I Want To Create?",
    ],
  },
  {
    title: "Creator Questions",
    questions: [
      "Do I Need A Page?",
      "Do I Need A Project?",
      "Do I Need A Library?",
      "Do I Need A Timeline?",
      "Do I Need A Community?",
      "Do I Need A Blueprint?",
      "Do I Need A Template?",
      "Do I Need A Tool?",
    ],
  },
  {
    title: "Protection Questions",
    questions: [
      "Who Can See My Work?",
      "Who Can Edit My Work?",
      "Who Can Share My Work?",
      "How Do I Track Ownership?",
      "How Do I Track Contributors?",
      "How Do I Preserve History?",
    ],
  },
];

export function IslandQuestionWorkspacePanel() {
  return (
    <div className="space-y-5">
      {questionGroups.map((group) => (
        <section
          key={group.title}
          className="rounded-3xl border border-white/20 bg-black p-6"
        >
          <h2 className="text-2xl font-black text-white">
            {group.title}
          </h2>

          <div className="mt-5 space-y-2">
            {group.questions.map((question) => (
              <div
                key={question}
                className="rounded-xl border border-white/10 px-3 py-2 text-white/80"
              >
                ? {question}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}