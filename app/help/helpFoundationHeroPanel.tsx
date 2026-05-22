import { eyebrowClass, panelClass } from "./helpFoundationStyles";
import { StatusPill } from "./helpFoundationUiAtoms";

export function HelpHeroPanel() {
  return (
    <section className={panelClass}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className={eyebrowClass}>The Muzes Garden</div>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-white">HELP</h1>
          <p className="mt-3 text-base leading-7 text-white/70">
            This page is the foundation for the future HELP system: how to use the app, what each area means, and how to get from one place to another.
          </p>
          <p className="mt-3 text-sm leading-6 text-white/70">
            Help content should grow from verified workflows first. Planned areas can be named, but exact instructions should stay tied to real tested paths.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusPill label="HOW DO I?" />
          <StatusPill label="WHAT IS THIS?" />
          <StatusPill label="ROUTES" />
          <StatusPill label="TIPS" />
          <StatusPill label="WHAT'S NEW?" />
        </div>
      </div>
    </section>
  );
}
