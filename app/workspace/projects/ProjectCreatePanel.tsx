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
          <span className="text-sm font-black text-white">Visibility</span>
          <select className={`${selectClass} mt-2`} name="visibility">
            <option value="private">Private</option>
            <option value="shared">Shared</option>
            <option value="public">Public</option>
          </select>
        </label>
      </div>
    </form>
  );
}