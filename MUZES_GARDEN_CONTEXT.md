# MUZES GARDEN — MASTER PROJECT CONTEXT

## PLATFORM
The Muzes Garden

Stack:
- Next.js App Router
- TypeScript
- Tailwind
- Supabase Auth
- Supabase Database
- Supabase Storage (audio bucket)

Local Dev:
http://localhost:3000

Repository:
themuzesgarden-site


--------------------------------------------------
APP TREE (CONFIRMED)
--------------------------------------------------

app/
  workspace/
    projects/
      [id]/
        page.tsx   ← Project Workspace (large stable file)

lib/
  supabaseClient.ts
  getSupabaseTracks.ts
  performanceState.ts
  performancePlayback.ts


--------------------------------------------------
CORE SYSTEMS (WORKING)
--------------------------------------------------

GLOBAL LIBRARY
- Upload works
- MP3 playback works
- Storage IDs: sb:bucket:path
- getSupabaseTracks() is source of truth
- Library UI NEVER modified by Projects

AUTHENTICATION
- Supabase Auth working
- Workspace routes protected

PROJECTS
- Projects CRUD complete
- Workspace tabs:
  Overview
  Notes
  Library
  Activity

PROJECT NOTES
- Create / edit / delete
- Autosave option
- Pinning
- Rename
- Keyboard shortcuts

PROJECT ⇄ LIBRARY LINKING
Architecture:

projects ← project_tracks → library tracks

Rules:
- No duplication
- Library remains global
- Projects only LINK tracks


--------------------------------------------------
PERFORMANCE MODE (CURRENT ERA)
--------------------------------------------------

Working Features:
- Play Project
- Sequential playback
- Next / Previous
- Auto-advance
- Loop modes
- Shuffle
- Volume / mute
- Floating Mini Player
- Keyboard shortcuts
- Persisted setlist order
- LocalStorage persistence (performanceState.ts)

Constraints:
- Extend only
- No refactors
- Do not enlarge page.tsx unnecessarily
- Do not modify Global Library logic
- Prefer helpers inside /lib


--------------------------------------------------
NEW CHAT START RULE
--------------------------------------------------

Every new ChatGPT session begins by:

1. Pasting this context.
2. Stating CURRENT GOAL.
3. Assistant asks what user sees on screen.
4. Verify dev server + playback.
5. Continue development in baby steps.


CURRENT GOAL:
(Write session goal here)