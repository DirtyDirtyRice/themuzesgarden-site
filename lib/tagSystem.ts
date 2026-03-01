// lib/tagSystem.ts
// Canonical Tag System — The Muzes Garden

export type TagCategory =
  | "genre"
  | "mood"
  | "instrument"
  | "production"
  | "energy"
  | "era"
  | "use"
  | "reference";

export type TagDefinition = {
  id: string;
  label: string;
  category: TagCategory;
};

// -------------------------------------
// MASTER TAG LIST
// -------------------------------------

export const TAGS: TagDefinition[] = [
  // GENRE
  { id: "rock", label: "Rock", category: "genre" },
  { id: "ambient", label: "Ambient", category: "genre" },
  { id: "electronic", label: "Electronic", category: "genre" },
  { id: "cinematic", label: "Cinematic", category: "genre" },

  // MOOD
  { id: "dark", label: "Dark", category: "mood" },
  { id: "uplifting", label: "Uplifting", category: "mood" },
  { id: "dreamy", label: "Dreamy", category: "mood" },
  { id: "melancholic", label: "Melancholic", category: "mood" },

  // INSTRUMENT
  { id: "guitar", label: "Guitar", category: "instrument" },
  { id: "piano", label: "Piano", category: "instrument" },
  { id: "synth", label: "Synth", category: "instrument" },
  { id: "strings", label: "Strings", category: "instrument" },

  // PRODUCTION
  { id: "lofi", label: "Lo-Fi", category: "production" },
  { id: "analog", label: "Analog", category: "production" },
  { id: "wide", label: "Wide", category: "production" },
  { id: "minimal", label: "Minimal", category: "production" },

  // ENERGY
  { id: "low-energy", label: "Low Energy", category: "energy" },
  { id: "mid-energy", label: "Mid Energy", category: "energy" },
  { id: "high-energy", label: "High Energy", category: "energy" },

  // ERA
  { id: "70s", label: "70s", category: "era" },
  { id: "80s", label: "80s", category: "era" },
  { id: "90s", label: "90s", category: "era" },
  { id: "modern", label: "Modern", category: "era" },

  // USE
  { id: "demo", label: "Demo", category: "use" },
  { id: "background", label: "Background", category: "use" },
  { id: "film-score", label: "Film Score", category: "use" },
  { id: "intro", label: "Intro", category: "use" },
  { id: "trailer", label: "Trailer", category: "use" },

  // REFERENCE (Sounds Like)
  { id: "pink-floyd", label: "Pink Floyd", category: "reference" },
  { id: "radiohead", label: "Radiohead", category: "reference" },
  { id: "boards-of-canada", label: "Boards of Canada", category: "reference" },
];

// -------------------------------------
// HELPERS
// -------------------------------------

export function getTagsByCategory(category: TagCategory) {
  return TAGS.filter((tag) => tag.category === category);
}

export function findTag(id: string) {
  return TAGS.find((tag) => tag.id === id);
}

export function searchTags(query: string) {
  const q = query.toLowerCase();
  return TAGS.filter((tag) => tag.label.toLowerCase().includes(q));
}