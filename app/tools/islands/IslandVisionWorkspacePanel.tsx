// app/tools/islands/IslandVisionWorkspacePanel.tsx

"use client";

import { useState } from "react";

type SectionProps = {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

function IslandSection({
  title,
  children,
  defaultOpen = false,
}: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-2xl border border-white/15 bg-black p-5">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-lg font-black text-white">
          {open ? "▼" : "▶"} {title}
        </span>

        <span className="text-xs uppercase tracking-[0.25em] text-white/50">
          {open ? "Open" : "Closed"}
        </span>
      </button>

      {open ? <div className="mt-5">{children}</div> : null}
    </section>
  );
}

function IslandLinkWord({ children }: { children: React.ReactNode }) {
  return (
    <span className="cursor-pointer font-black text-white underline decoration-white/40 underline-offset-4 transition hover:scale-105">
      {children}
    </span>
  );
}

function TreeItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 px-3 py-2 text-white/80">
      ▶ {children}
    </div>
  );
}

export function IslandVisionWorkspacePanel() {
  const [islandTitle, setIslandTitle] = useState("");

  return (
    <div className="space-y-5 text-white">
      <section className="rounded-3xl border border-white/20 bg-black p-6">
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">
          ISLAND WORKSPACE
        </p>

        <h1 className="mt-3 text-4xl font-black text-white">
          ISLAND WORKSPACE
        </h1>

        <div className="mt-6">
          <label className="block text-sm font-black text-white">
            Island Title
          </label>

          <input
            value={islandTitle}
            onChange={(event) => setIslandTitle(event.target.value)}
            placeholder="The Muzes Garden"
            className="mt-2 w-full rounded-2xl border border-white/20 bg-black px-4 py-3 text-white outline-none"
          />
        </div>

        <p className="mt-4 text-sm text-white/70">
          Give your Island a name. You can change it at any time.
        </p>
      </section>

      <section className="rounded-3xl border border-white/20 bg-black p-6">
        <h2 className="text-3xl font-black text-white">
          Welcome To Your Island
        </h2>

        <p className="mt-5 text-white/80">
          An Island is not a website.
        </p>

        <p className="mt-3 text-xl font-black text-white">
          An Island is a place where ideas are allowed to grow.
        </p>

        <p className="mt-5 text-white/70">
          Some ideas become songs. Some become stories. Some become projects.
          Some become memories. Some become communities. Some become things
          nobody could have imagined when they first began.
        </p>

        <p className="mt-5 text-white/70">
          Build as much or as little as you like.
        </p>

        <p className="mt-2 text-white/70">
          Start with a blank page.
        </p>

        <p className="mt-2 text-white/70">
          Start with a tool.
        </p>

        <p className="mt-2 text-white/70">
          Start with a dream.
        </p>

        <p className="mt-2 text-white/70">
          Start anywhere.
        </p>

        <p className="mt-2 font-black text-white">
          Just start.
        </p>
      </section>

      <IslandSection title="What Is An Island?" defaultOpen>
        <p className="text-white/70">
          Your Island is your personal space inside The Muzes Garden.
        </p>

        <p className="mt-3 text-white/70">
          It can be private, shared, permission based, or public.
        </p>

        <p className="mt-3 text-white/70">
          Some members create a single page. Others create entire worlds.
        </p>
      </IslandSection>

      <IslandSection title="Why Is My Island So Empty?">
        <p className="text-white/70">
          Every Island begins as a blank space.
        </p>

        <p className="mt-3 text-white/70">
          A blank Island is not unfinished.
        </p>

        <p className="mt-3 text-white/70">
          A blank Island is full of possibility.
        </p>
      </IslandSection>

      <IslandSection title="How Do I Know My Ideas Are Safe?">
        <p className="text-white/70">
          Your ideas belong to you.
        </p>

        <p className="mt-3 text-white/70">
          You decide what remains private and what gets shared.
        </p>

        <p className="mt-3 text-white/70">
          Learn more about{" "}
          <IslandLinkWord>Permissions</IslandLinkWord>.
        </p>
      </IslandSection>

      <IslandSection title="A Few Questions To Help You Get Started">
        <p className="text-white/70">
          You may fill out as much or as little of your Island as you wish.
        </p>

        <p className="mt-4 text-white/70">
          These questions are simply here to help put a little fat on the
          bones.
        </p>

        <div className="mt-5 space-y-2">
          <TreeItem>Music</TreeItem>
          <TreeItem>Lyrics</TreeItem>
          <TreeItem>Stories</TreeItem>
          <TreeItem>Photos</TreeItem>
          <TreeItem>Videos</TreeItem>
          <TreeItem>Projects</TreeItem>
          <TreeItem>Research</TreeItem>
          <TreeItem>Documents</TreeItem>
          <TreeItem>Timelines</TreeItem>
          <TreeItem>Communities</TreeItem>
          <TreeItem>Blueprints</TreeItem>
          <TreeItem>Experiences</TreeItem>
        </div>

        <div className="mt-5 space-y-2">
          <TreeItem>A Single Page</TreeItem>
          <TreeItem>A Single Song</TreeItem>
          <TreeItem>A Single Story</TreeItem>
          <TreeItem>A Personal Journal</TreeItem>
          <TreeItem>An Empty Canvas</TreeItem>
        </div>

        <p className="mt-5 text-white/70">
          For our vegetarian friends, you are welcome to remain as gloriously
          naked as you like.
        </p>

        <p className="mt-2 text-white/70">
          Many great Islands begin that way.
        </p>
      </IslandSection>

      <IslandSection title="I Already Know What I Want To Build">
        <p className="text-white/70">
          Perfect.
        </p>

        <p className="mt-3 text-white/70">
          Many creators arrive with a vision already forming in their minds.
        </p>

        <div className="mt-5 space-y-2">
          <TreeItem>Show Me The Tools</TreeItem>
          <TreeItem>Open Create</TreeItem>
          <TreeItem>Start Building</TreeItem>
        </div>
      </IslandSection>

      <IslandSection title="I Have No Idea Where To Start">
        <div className="space-y-2">
          <TreeItem>Suggestions</TreeItem>
          <TreeItem>Templates</TreeItem>
          <TreeItem>Blueprints</TreeItem>
          <TreeItem>Experiences</TreeItem>
          <TreeItem>Community Islands</TreeItem>
        </div>
      </IslandSection>

      <IslandSection title="Show Me The Tools">
        <div className="space-y-2">
          <TreeItem>Music Tools</TreeItem>
          <TreeItem>Writing Tools</TreeItem>
          <TreeItem>Media Tools</TreeItem>
          <TreeItem>Organization Tools</TreeItem>
          <TreeItem>AI Tools</TreeItem>
          <TreeItem>Protection Tools</TreeItem>
          <TreeItem>Community Tools</TreeItem>
          <TreeItem>Future Tools</TreeItem>
        </div>
      </IslandSection>

      <IslandSection title="Templates, Blueprints, And Experiences">
        <p className="text-white/70">
          Templates show possibilities.
        </p>

        <p className="mt-2 text-white/70">
          Blueprints show workflows.
        </p>

        <p className="mt-2 text-white/70">
          Experiences show lessons learned.
        </p>
      </IslandSection>

      <IslandSection title="Protecting Your Work">
        <div className="space-y-2">
          <TreeItem>Ownership Records</TreeItem>
          <TreeItem>Copyright Information</TreeItem>
          <TreeItem>Permissions</TreeItem>
          <TreeItem>Version History</TreeItem>
          <TreeItem>Contributor Tracking</TreeItem>
        </div>
      </IslandSection>

      <IslandSection title="Learn From Others">
        <div className="space-y-2">
          <TreeItem>Lessons Learned</TreeItem>
          <TreeItem>Common Mistakes</TreeItem>
          <TreeItem>Workflows</TreeItem>
          <TreeItem>Time Saving Tips</TreeItem>
          <TreeItem>Success Stories</TreeItem>
          <TreeItem>Failures</TreeItem>
        </div>
      </IslandSection>

      <IslandSection title="Explore Member Islands">
        <div className="space-y-2">
          <TreeItem>See What Members Built</TreeItem>
          <TreeItem>Featured Islands</TreeItem>
          <TreeItem>Community Blueprints</TreeItem>
          <TreeItem>Remix A Blueprint</TreeItem>
        </div>
      </IslandSection>

      <IslandSection title="Need More Information?">
        <div className="space-y-2">
          <TreeItem>Home Page</TreeItem>
          <TreeItem>Help</TreeItem>
          <TreeItem>Things To Come</TreeItem>
          <TreeItem>Creator Guides</TreeItem>
        </div>
      </IslandSection>

      <section className="rounded-3xl border border-white/20 bg-black p-6">
        <h2 className="text-2xl font-black text-white">
          The Three Principles Of Islands
        </h2>

        <div className="mt-5 space-y-2">
          <p className="text-white">Blank Is The Default.</p>
          <p className="text-white">Borrow Ideas, Not Limits.</p>
          <p className="text-white">Start Small, Grow Naturally.</p>
        </div>
      </section>

      <section className="rounded-3xl border border-white/20 bg-black p-6">
        <h2 className="text-2xl font-black text-white">
          The Creator's Promise
        </h2>

        <p className="mt-5 text-white/70">
          You are free to create.
        </p>

        <p className="mt-2 text-white/70">
          You are free to experiment.
        </p>

        <p className="mt-2 text-white/70">
          You are free to change your mind.
        </p>

        <p className="mt-2 text-white/70">
          You are free to start over.
        </p>

        <p className="mt-2 text-white/70">
          You are free to build something nobody has ever seen before.
        </p>

        <p className="mt-5 text-xl font-black text-white">
          Now show us what you can imagine.
        </p>
      </section>
    </div>
  );
}