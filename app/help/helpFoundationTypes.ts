export type HelpCardStatus = "verified" | "foundation" | "planned";

export type HelpCard = {
  title: string;
  body: string;
  route?: string[];
  note?: string;
  status?: HelpCardStatus;
};

export type HelpJumpLink = {
  label: string;
  href: string;
  detail: string;
};

export type HelpQuickAnswer = {
  question: string;
  answer: string;
  route?: string[];
};

export type HelpGlossaryItem = {
  term: string;
  meaning: string;
  useWhen: string;
};

export type HelpSectionContent = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  cards: HelpCard[];
};

export type HelpUpdateCard = {
  title: string;
  body: string;
};

export type HelpRouteMap = {
  title: string;
  summary: string;
  start: string;
  finish: string;
  steps: string[];
  verified: boolean;
};
