import type { HelpSectionContent } from "./helpFoundationTypes";

export const helpFoundationProjectSections: HelpSectionContent[] = [
  {
    id: "setlists",
    eyebrow: "Projects",
    title: "Open projects, organize songs, and build setlists",
    body:
      "Projects are where songs become organized workspaces, setlists, notes, and playable groups.",
    cards: [
      {
        title: "I want to open a project",
        body: "Go to Projects, choose the project card, then open its overview.",
        route: ["Title Bar", "Projects", "Choose Project", "Overview"],
        status: "verified",
      },
      {
        title: "I want to reorder songs",
        body:
          "Open the project, go to Setlist, then use Move Up or Move Down on the song row.",
        route: ["Projects", "Open Project", "Setlist", "Move Up / Move Down"],
        status: "foundation",
      },
      {
        title: "I want to hear a project",
        body:
          "Open the project and use the project player or the play control on a track row.",
        route: ["Projects", "Open Project", "Overview", "Play"],
        status: "verified",
      },
      {
        title: "I want to add songs to a project",
        body:
          "Songs usually start in Library. Select the track, choose a project, then send it there.",
        route: ["Library", "Select Track", "Choose Project", "Send To"],
        status: "foundation",
      },
      {
        title: "I want project notes later",
        body:
          "Future Help should explain project notes, track notes, setlist notes, and workspace notes in plain language.",
        route: ["Projects", "Open Project", "Notes"],
        status: "planned",
      },
    ],
  },
];

export const projectHelpCards = helpFoundationProjectSections.flatMap((section) => section.cards);