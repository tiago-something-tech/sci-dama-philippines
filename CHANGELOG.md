# Changelog

All future releases must be logged here and reflected in the in-app Changelogs dialog. Dates use Asia/Manila.

## [0.3.1] — 2026-11-16

- Added a PvAI turn-order selector: First (Red) or Second (Blue).
- Computer opens as Red when the human chooses second; the board stays facing the human’s chosen side.
- Human side is saved, restored, and included in exported records. Older saves retain human Red.
- Updated input ownership, opponent status, and undo for either side. Undo preserves the computer opening when playing second.
- PvP and Playground retain their existing turn behavior.

## [0.3.0] — 2026-11-16

### Added

- PvAI mode with Dumbledore (deliberately poor immediate choices), Joe (target four individual turns ahead), and Magnus (deeper bounded search, up to eight turns).
- Local Web Worker search with iterative deepening, alpha-beta pruning, exact rational score comparisons, and node/time limits. No external AI service.
- Position evaluation based on running scores plus remaining chip values. Actual terminal wins/losses take priority; positional features break equal score margins.
- Fixed human-facing board: human Red versus computer Blue, untimed.
- Undo to the human’s previous decision, including the opponent reply.
- Cancellation of pending searches on menu navigation, new game, undo, or finish confirmation; saved opponent difficulty and resumable computer turns.
- Worker failure recovery through Retry opponent and a watchdog. Old replies cannot change a newer position.
- AI tactical, budget, exact-arithmetic, and replay tests, plus controller tests for opponent lifecycle and cancellation.

### Changed

- Activated PvAI in the mode picker, with opponent descriptions, thinking status, and updated guide, export metadata, footer, and in-app changelog.
- Magnus is described as the strongest level, not unbeatable. Typical match length does not impose a move cap.
- Existing PvP, Playground, timer behavior, saved matches, and the scoring/rules engine retained.

## [0.2.0] — 2026-11-16

### Added

- Menu-first entry with an animated board on the left and vertical menu on desktop; animation hidden on mobile and disabled for reduced motion.
- Play mode picker: PvP (two players), PvAI (coming soon), and Playground (one player controls both sides under existing rules).
- Automatic board orientation after complete PvP turns and undo.
- Optional one-minute PvP move timer, shared across all jumps in a turn. Expiry pauses for review, with Continue turn or Finish & score. No automatic loss.
- Timer pause in the main menu and confirmation dialogs; background-safe deadlines and remaining-time restoration.
- Resume match for existing and legacy saved games, without overwriting saves on initial load.
- Menu dialogs for How to Play, version history, and Credits.
- Credits: developed using Codex; ideation by Engr. James Vincent Aves, former Sci-Dama player for Cahagnaan Elementary School (2012–2014) and Bato School of Fisheries (2016–2019).
- Controller integration checks for modes, timer expiry, pause/resume, persistence, and confirmation behavior.

### Changed

- Neutral off-white background, black and white board, and Geist throughout, retaining red/blue player colors.
- Footer now shows v0.2.0. Removed routine saved-on-device messaging; storage failures still display.
- Updated rules, documentation, and exported record metadata for the available modes and optional timer.
- Exact arithmetic, capture hierarchy, move scoring, and final score comparisons preserved.

## [0.1.0] — 2026-11-16

Retrospective entry for the existing application and initial interface refinement (commit ce62c0c).

- Shared-device Sci-Dama with exact scientific-notation scoring, compulsory capture hierarchy, dama, move records, final scoring, undo, autosave, and JSON record downloads.
- Centered wordmark, simplified copy, larger operations, Geist chip numbers, blue player chips, and removal of promotional and instructional panels.
- Seventeen engine checks, including simulated games and replay verification.
