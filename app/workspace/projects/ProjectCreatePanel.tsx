import { buttonClass, eyebrowClass, inputClass, panelClass, selectClass } from "./projectPageStyles";

export function ProjectCreatePanel({
  creating,
  onCreate,
}: {
  creating: boolean;
  onCreate: (formData: FormData) => void;
}) {
  return (
    <form id="create-project" action={onCreate} className={panelClass}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={eyebrowClass}>New Project</p>
          <h2 className="mt-2 text-2xl font-black text-white">
            Create Project
          </h2>
        </div>

        <button className={buttonClass} type="submit" disabled={creating}>
          {creating ? "Creating" : "Create"}
        </button>
      </div>

      <div className="mt-5 space-y-4">
        <label className="block">
          <span className="text-sm font-black text-white">Title</span>
          <input
            className={`${inputClass} mt-2`}
            name="title"
            placeholder="Project title"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-black text-white">Description</span>
          <textarea
            className={`${inputClass} mt-2 min-h-24 resize-y`}
            name="description"
            placeholder="Project notes"
          />
        </label>

        <label className="block">
          <span className="text-sm font-black text-white">Kind</span>
          <select className={`${selectClass} mt-2`} name="kind">
            <option value="music">Music</option>
            <option value="education">Education</option>
            <option value="game">Game</option>
            <option value="experiment">Experiment</option>
            <option value="collab">Collaboration</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-black text-white">
            Privacy <span className="text-rose-300">(required)</span>
          </span>
          <select
            className={`${selectClass} mt-2`}
            name="visibility"
            defaultValue=""
            required
          >
            <option value="" disabled>
              Select Private or Public...
            </option>
            <option value="private">Private — only you unless you grant permission</option>
            <option value="public">Public — every song in the project is public</option>
          </select>
          <span className="mt-2 block text-xs leading-5 text-white/60">
            Every song in this project follows the project privacy setting. You
            can change it later.
          </span>
        </label>
      </div>
    </form>
  );
}