export type MomentInspectorWorkspacePanelLayoutSection =
  | "header"
  | "toolbar"
  | "selection"
  | "queue";

export type MomentInspectorWorkspacePanelLayout = {
  sections: MomentInspectorWorkspacePanelLayoutSection[];
};

export function buildMomentInspectorWorkspacePanelLayout(): MomentInspectorWorkspacePanelLayout {
  return {
    sections: ["header", "toolbar", "selection", "queue"],
  };
}