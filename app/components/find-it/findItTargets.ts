import {
  appNavigationTree,
  findNavigationNodeById,
  getNavigationLabelsToNode,
} from "@/lib/navigation/appNavigationTree";
import type { AppNavigationNode } from "@/lib/navigation/appNavigationTree";

import type {
  FindItTarget,
  FindItTargetCategory,
  FindItTargetId,
} from "./findItTypes";

type FindItTargetBlueprint = {
  id: FindItTargetId;
  navigationNodeId: string;
  shortLabel: string;
  category: FindItTargetCategory;
  extraKeywords: string[];
  exactSteps: string[];
  detail?: string;
  startButtonLabel?: string;
  fallbackRoute?: string;
  fallbackSteps?: string[];
};

function getNodeOrThrow(id: string) {
  const node = findNavigationNodeById(id);

  if (!node) {
    throw new Error(`Find It navigation node is missing: ${id}`);
  }

  return node;
}

function getNodeRoute(node: AppNavigationNode, fallbackRoute?: string) {
  return fallbackRoute ?? node.route ?? "/";
}

function getNodeSteps(nodeId: string, fallbackSteps?: string[]) {
  const labels = getNavigationLabelsToNode(nodeId);

  if (labels.length > 0) return labels;
  return fallbackSteps ?? [appNavigationTree.label];
}

function normalizeKeywordList(keywords: string[]) {
  return Array.from(
    new Set(
      keywords
        .map((keyword) => keyword.trim().toLowerCase())
        .filter((keyword) => keyword.length > 0),
    ),
  );
}

function createFindItTarget(blueprint: FindItTargetBlueprint): FindItTarget {
  const node = getNodeOrThrow(blueprint.navigationNodeId);
  const steps = getNodeSteps(blueprint.navigationNodeId, blueprint.fallbackSteps);

  return {
    id: blueprint.id,
    label: node.label,
    shortLabel: blueprint.shortLabel,
    category: blueprint.category,
    keywords: normalizeKeywordList([
      ...node.keywords,
      ...steps,
      node.label,
      node.description,
      ...blueprint.extraKeywords,
    ]),
    route: getNodeRoute(node, blueprint.fallbackRoute),
    steps,
    exactSteps: blueprint.exactSteps,
    detail: blueprint.detail ?? node.description,
    startButtonLabel: blueprint.startButtonLabel,
  };
}

const FIND_IT_TARGET_BLUEPRINTS: FindItTargetBlueprint[] = [
  {
    id: "metadata-create-record",
    navigationNodeId: "metadata-create",
    shortLabel: "Create record",
    category: "Create",
    extraKeywords: [
      "add",
      "make",
      "build",
      "start",
      "new record",
      "create metadata",
    ],
    exactSteps: [
      "Look at the top navigation bar.",
      "Click Metadata.",
      "Click Create in the Metadata menu, or go to the Create page.",
      "Click Start Creating Record.",
      "Fill in the required fields marked with a yellow star.",
      "Use Next until you reach Save.",
    ],
    detail: "Use this when you want to build a new metadata record and save it.",
    startButtonLabel: "Go to Create",
  },
  {
    id: "metadata-library",
    navigationNodeId: "metadata-library",
    shortLabel: "Metadata Library",
    category: "Metadata",
    extraKeywords: ["browse records", "metadata cards", "saved records"],
    exactSteps: [
      "Look at the top navigation bar.",
      "Click Metadata.",
      "Click Library in the Metadata menu.",
      "Wait for the Metadata Library page to load.",
      "Use the search box or record cards to find a record.",
    ],
    detail: "Use this when you want to find an existing metadata record.",
    startButtonLabel: "Go to Metadata Library",
  },
  {
    id: "metadata-open-record",
    navigationNodeId: "metadata-open-selected",
    shortLabel: "Open record",
    category: "Record",
    extraKeywords: [
      "open record",
      "record page",
      "details",
      "quick preview",
      "selected record",
    ],
    exactSteps: [
      "Look at the top navigation bar.",
      "Click Metadata.",
      "Click Library in the Metadata menu.",
      "Wait for the Metadata Library page to load.",
      "Click once on the record card you want.",
      "Look at the right-side Quick Preview panel.",
      "Find the Actions box inside Quick Preview.",
      "Click Open Selected.",
      "Wait for the full record page to load.",
    ],
    detail:
      "Use the Library page, select a card, then press Open Selected in Quick Preview.",
    startButtonLabel: "Go to Library",
    fallbackRoute: "/metadata/library",
  },
  {
    id: "metadata-relationships",
    navigationNodeId: "metadata-record-relationships",
    shortLabel: "Relationships",
    category: "Record",
    extraKeywords: [
      "relationship",
      "relationships",
      "links",
      "connected",
      "graph",
      "connection",
      "connections",
      "related",
    ],
    exactSteps: [
      "Look at the top navigation bar.",
      "Click Metadata.",
      "Click Library in the Metadata menu.",
      "Wait for the Metadata Library page to load.",
      "Click once on the record card you want.",
      "Look at the right-side Quick Preview panel.",
      "Find the Actions box inside Quick Preview.",
      "Click Open Selected.",
      "Wait for the full record page to load.",
      "Slowly scroll down until you see Relationships.",
      "Read the Relationship map preview or connected-record panels.",
    ],
    detail: "Open a record first, then scroll to the Relationships section.",
    startButtonLabel: "Go to Library",
    fallbackRoute: "/metadata/library",
  },
  {
    id: "metadata-system",
    navigationNodeId: "metadata-system",
    shortLabel: "Metadata System",
    category: "Help",
    extraKeywords: ["system help", "how metadata works", "explain metadata"],
    exactSteps: [
      "Look at the top navigation bar.",
      "Click Metadata.",
      "Click System in the Metadata menu.",
      "Read the system explanation panels from top to bottom.",
      "Use Find It again if you need to locate a specific metadata feature.",
    ],
    detail:
      "Use this when you want the larger explanation of how metadata works.",
    startButtonLabel: "Go to System",
  },
  {
    id: "metadata-edit-record",
    navigationNodeId: "metadata-record-page",
    shortLabel: "Edit record",
    category: "Record",
    extraKeywords: [
      "edit",
      "change",
      "update",
      "revise",
      "fix",
      "record details",
    ],
    exactSteps: [
      "Look at the top navigation bar.",
      "Click Metadata.",
      "Click Library in the Metadata menu.",
      "Wait for the Metadata Library page to load.",
      "Click once on the record card you want to edit.",
      "Look at the right-side Quick Preview panel.",
      "Click Open Selected.",
      "Wait for the full record page to load.",
      "Look near the record details for edit controls.",
      "Change only the fields you intend to update.",
    ],
    detail:
      "Use this when you need to change an existing record after opening it.",
    startButtonLabel: "Go to Library",
    fallbackRoute: "/metadata/library",
  },
  {
    id: "metadata-delete-record",
    navigationNodeId: "metadata-record-page",
    shortLabel: "Delete record",
    category: "Record",
    extraKeywords: [
      "delete",
      "remove",
      "trash",
      "erase",
      "discard",
      "danger zone",
    ],
    exactSteps: [
      "Look at the top navigation bar.",
      "Click Metadata.",
      "Click Library in the Metadata menu.",
      "Wait for the Metadata Library page to load.",
      "Click once on the record card you want to delete.",
      "Look at the right-side Quick Preview panel.",
      "Click Open Selected.",
      "Wait for the full record page to load.",
      "Find the delete button or danger-zone control.",
      "Read the warning before confirming deletion.",
    ],
    detail:
      "Use this carefully when you want to remove an existing metadata record.",
    startButtonLabel: "Go to Library",
    fallbackRoute: "/metadata/library",
  },
  {
    id: "metadata-create-required-fields",
    navigationNodeId: "metadata-create-required-fields",
    shortLabel: "Required fields",
    category: "Create",
    extraKeywords: [
      "required field",
      "required fields",
      "star",
      "yellow star",
      "missing",
      "finish",
      "next error",
    ],
    exactSteps: [
      "Look at the top navigation bar.",
      "Click Metadata.",
      "Click Create in the Metadata menu.",
      "Click Start Creating Record if the create flow has not started.",
      "Look for every field marked with a yellow star.",
      "Fill in the starred fields first.",
      "Click Next.",
      "If an error appears, read the field names listed in the error message.",
      "Fill in those named fields.",
      "Click Next again.",
    ],
    detail:
      "Use this when the create flow will not move forward because required fields are missing.",
    startButtonLabel: "Go to Create",
  },
  {
    id: "metadata-create-placement",
    navigationNodeId: "metadata-create-placement",
    shortLabel: "Placement",
    category: "Create",
    extraKeywords: [
      "where belongs",
      "shelf",
      "section",
      "location",
      "organize",
      "place record",
    ],
    exactSteps: [
      "Look at the top navigation bar.",
      "Click Metadata.",
      "Click Create in the Metadata menu.",
      "Click Start Creating Record if the create flow has not started.",
      "Use Next until you reach the placement step.",
      "Choose the best shelf or section for the record.",
      "Write a clear placement reason if the page asks for one.",
      "Click Next after the placement information is complete.",
    ],
    detail:
      "Use this when you need to decide where the record lives in the metadata library.",
    startButtonLabel: "Go to Create",
  },
  {
    id: "metadata-more-information",
    navigationNodeId: "metadata-record-more-information",
    shortLabel: "More information",
    category: "Help",
    extraKeywords: [
      "more info",
      "information",
      "details",
      "learn",
      "what",
      "why",
      "encyclopedia",
    ],
    exactSteps: [
      "Look at the top navigation bar.",
      "Click Metadata.",
      "Click System in the Metadata menu.",
      "Find the explanation area for the feature you are trying to understand.",
      "Read the visible summary first.",
      "Use Find It again with a more specific phrase if you need a narrower answer.",
    ],
    detail:
      "This points to the current explanation area until the full encyclopedia-style More Info system is built.",
    startButtonLabel: "Go to System",
    fallbackRoute: "/metadata/system",
  },
  {
    id: "metadata-find-it-help",
    navigationNodeId: "find-it",
    shortLabel: "Find It help",
    category: "Help",
    extraKeywords: [
      "findit",
      "find-it",
      "where am i",
      "navigate",
      "navigation",
      "lost",
      "help me find",
    ],
    exactSteps: [
      "Look at the top navigation bar.",
      "Click Find It.",
      "Click inside the box labeled What are you trying to find?",
      "Type the page, feature, or action you want.",
      "Look at the suggestion cards that appear below the input.",
      "Click the suggestion that best matches what you meant.",
      "Read the exact numbered steps.",
      "Click the starting-page button if you want the app to take you there.",
    ],
    detail:
      "Use this when you are lost and want the app to tell you exactly how to get somewhere.",
    startButtonLabel: "Go Home",
    fallbackRoute: "/",
    fallbackSteps: ["Home", "TitleBar", "Find It"],
  },
  {
    id: "home",
    navigationNodeId: "home",
    shortLabel: "Home",
    category: "Navigation",
    extraKeywords: ["front", "return home", "main page"],
    exactSteps: [
      "Look at the top navigation bar.",
      "Click The Muzes Garden button on the far left, or click Home.",
      "Wait for the home page to load.",
    ],
    detail: "Use this when you want to return to the main starting page.",
    startButtonLabel: "Go Home",
  },
  {
    id: "main-library",
    navigationNodeId: "library",
    shortLabel: "Main Library",
    category: "Navigation",
    extraKeywords: ["music library", "song library", "track library"],
    exactSteps: [
      "Look at the top navigation bar.",
      "Click Library.",
      "Wait for the main music Library page to load.",
      "Use the library controls to search or browse tracks.",
    ],
    detail:
      "Use this for the regular music library, not the metadata record library.",
    startButtonLabel: "Go to Library",
  },
  {
    id: "listen",
    navigationNodeId: "listen",
    shortLabel: "Listen",
    category: "Navigation",
    extraKeywords: ["hear", "play music", "audio player"],
    exactSteps: [
      "Look at the top navigation bar.",
      "Click Listen.",
      "Wait for the Listen page to load.",
      "Use the visible player controls on that page.",
    ],
    detail: "Use this when you want to listen to music or test playback.",
    startButtonLabel: "Go to Listen",
  },
  {
    id: "live",
    navigationNodeId: "live",
    shortLabel: "Live",
    category: "Navigation",
    extraKeywords: ["performance", "stage", "stream", "show"],
    exactSteps: [
      "Look at the top navigation bar.",
      "Click Live.",
      "Wait for the Live page to load.",
      "Use the page controls shown there.",
    ],
    detail: "Use this when you want the Live area of the app.",
    startButtonLabel: "Go to Live",
  },
  {
    id: "members",
    navigationNodeId: "members",
    shortLabel: "Members",
    category: "Navigation",
    extraKeywords: ["people", "profile", "account", "user"],
    exactSteps: [
      "Look at the top navigation bar.",
      "Click Members.",
      "Wait for the Members page to load.",
      "Use the member controls shown there.",
    ],
    detail: "Use this when you want the Members area of the app.",
    startButtonLabel: "Go to Members",
  },
];

export const FIND_IT_TARGETS: FindItTarget[] =
  FIND_IT_TARGET_BLUEPRINTS.map(createFindItTarget);

export function getFindItTargetById(id: FindItTargetId) {
  return FIND_IT_TARGETS.find((target) => target.id === id) ?? null;
}