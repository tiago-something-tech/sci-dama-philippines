# Sci Dama: continuation notes

## User and objective

The user is a former Sci-Dama school competitor preparing to teach in DepEd. They are a solo beginner familiar with HTML, prefer simple components, and want plain-language explanations. Work in this existing folder; do not rebuild the app from scratch.

The initial Electro Sci-Dama idea was replaced with **scientific-notation Sci-Dama**. MVP: two players sharing one device, automatic legal moves, move records, and scoring. Future work may include computer play and move feedback. Eventual hosting preference: Vercel. No publication has happened.

## Current implementation

- `index.html`, `styles.css`, `engine.js`, `app.js`: playable buildless app, no npm dependencies.
- `RULES-DRAFT.md`: source rule extraction, exact chip values/positions, board operation map, user confirmations, unresolved edge cases.
- `README.md`: usage, assumptions, file map, test instructions.
- `engine.test.cjs`: 17 passing checks, including simulated games, replay, score arithmetic and compulsory capture hierarchy.
- `references/`: original blog board and chip-arrangement images.
- `preview.jpg`: screenshot of the prototype.
- Source webpage: https://tsoktok.blogspot.com/2011/09/dama-sci-notation.html (also saved as HTML in this folder).

## Critical confirmed rules

1. Captures are compulsory. **Capturing dama status outranks capture count.** If any dama can capture, ordinary-chip captures are excluded even if they take more pieces. Maximize captures within the selected class. A dama that cannot capture does not suppress an ordinary capture.
2. Landing-square operation determines the capture calculation; the capturing chip is the first operand.
3. Non-capturing moves are recorded but earn zero; running total stays unchanged.
4. Show per-move score and cumulative running score.
5. Final score = running score + own remaining chip values. **Lower wins.**
6. The user does not want a fixed classroom rounding/significant-figure rule. Implementation uses exact rational arithmetic and exact winner comparisons; up to 15 significant digits are displayed, with ≈ for shortened output. Do not replace this with ordinary floating-point totals casually.

## Defaults awaiting competition review

These are disclosed in the app, not all explicitly confirmed by the user: red starts; promotion after a complete turn; captured pieces removed immediately; fixed original taker value for each jump; equal-class/equal-count capture choices both allowed; remaining dama counted once; repetition ended manually; immobility ends the match by final score comparison. See the rules draft before changing these.

## Preview and verification

The last preview was `http://127.0.0.1:4173/`, served by the bundled Python HTTP server. Check whether it is still running; a new chat should not assume the old server or browser handles survived. The user may have an ongoing match in that origin's browser storage: do not clear it or overwrite it for tests. A separate `localhost:4173` origin was used for browser QA.

Verified in browser: piece selection, legal destinations, alternating turns, a capture and record, refresh restoring the game, undo, finish confirmation, final-score breakdown. No browser console errors were observed. Responsive CSS exists; no comprehensive physical-phone testing has been completed.

Bundled runtime paths used (verify availability before reuse):

- Node: `/Users/jamesvincentaves/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`
- Python: `/Users/jamesvincentaves/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3`

Run the Node executable with `engine.test.cjs` from this folder. A static server can use Python `-m http.server 4173 --bind 127.0.0.1 --directory` followed by this folder's absolute path. Native sandbox permission may be required for listening on the port. Avoid invoking Apple's placeholder `python3` or `git` unnecessarily: they previously triggered Command Line Tools installation prompts.

## Version control status

A local Git repository was initialized for the user-requested annotated interface changes. No GitHub repository or deployment has been created. The system Git still requires Apple developer tools; use the bundled Git at `/Users/jamesvincentaves/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/git/bin/git`. Check the log for the latest commit. Preserve existing working files before changes.

## Suggested next work

Follow the user's next requested improvement. Before significant changes, inspect current files and preserve the working version; explain checkpoint/version concepts simply. Keep the implementation local and framework-free unless a concrete need justifies more tooling. Do not use Sites hosting in place of the user's Vercel preference without discussion.

## Annotated interface update (2026-11-16)

The user clarified that the app is for student competitors. Removed the promotional intro, board caption, and footer slogan; centered the wordmark; moved How to play to the footer; simplified history/result copy. Blue pieces and indicators now use blue. Chip numbers use Geist via Google Fonts with system fallbacks. Operations scale to fill empty squares, with smaller corner operations on occupied squares. The message element remains a visually hidden live region for accessibility. Game rules and exact scoring were preserved. Verified desktop, 593px, and 375px layouts without horizontal overflow, Geist loading, and the footer rules dialog. All 17 engine checks pass. Updated `preview.jpg`. Browser saves were preserved.

## Main menu and modes — v0.2.0 (2026-11-16)

The user requested a menu-first app for student competitors. The desktop menu shows a decorative animated board on the left and vertical menu on the right; mobile hides the animation. Play expands a mode picker: PvP (automatic orientation after complete turns), PvAI (disabled, coming soon), and Playground (one player controls both sides, same engine rules, manual flipping). Optional PvP timer: one minute for the complete move, reset on complete turn or undo. User explicitly confirmed expiry should pause for player review. Timeout dialog offers Continue turn with a fresh minute or Finish & score. The timer pauses in the main menu and confirmation dialogs. It uses an absolute deadline during play, so background throttling does not extend turns. Refresh opens the menu, preserving remaining time at load; Resume restarts the clock. Legacy v1 saves are replayed without destructive migration. No initial save is written on page load.

All typography uses Geist with system fallbacks. Background is neutral off-white; board squares are black and white, retaining red/blue chips. Footer shows v0.2.0. Routine save notices removed; storage failures remain visible. How to Play, Changelogs, and Credits are in menu dialogs. Credits use the user-provided name and school history.

Maintain CHANGELOG.md and the in-app version history for every subsequent release; the user explicitly requires committing changes and logging changelogs in Markdown from now on. `app.test.cjs` adds isolated mode/timer/persistence checks alongside the existing engine tests. Use a separate QA origin (127.0.0.1:4174) to avoid overwriting the user's saved games on localhost:4173 or 127.0.0.1:4173. Playground does not yet provide free board editing or illegal moves.

Release validation: all 17 engine and 8 controller tests pass. Browser checked desktop and 375px mobile, mode selection, automatic PvP orientation, real one-minute expiry and continuation, Credits/Changelogs dialogs, and no console warnings/errors. Refreshed `preview.jpg` to show the desktop menu. The user’s existing match on localhost:4173 was retained.

## Computer opponents — v0.3.0 (2026-11-16)

PvAI is implemented locally using ai.js and ai-worker.js; no dependencies or API service. Human is Red; computer Blue; fixed human-facing board; untimed. Dumbledore chooses the lowest immediate evaluation; Joe targets 4 plies (1.2 seconds / 14k nodes); Magnus targets up to 8 plies (2.5 seconds / 35k nodes). Iterative deepening retains the last completed root search. Magnus is not claimed unbeatable. The user accepted this limitation. No 24/30-turn artificial ending was introduced.

Search uses E.apply with speculative history removed, preserving the existing exact scoring and rules. Evaluation orders proven terminal outcome, exact projected final-score margin, then positional tie-break. It is an initial heuristic and has not established competition strength. Worker cancellation uses generation IDs and termination. Menu, undo, restart, and finish cancel pending work. Undo rewinds to the previous human decision. Saved aiLevel and mode restore; a pending Blue turn restarts on Resume. Worker errors or a 12-second watchdog expose Retry opponent. HTTP serving is required for reliable worker support; file URLs can block it.

Maintain CHANGELOG.md, in-app version history, and commits. ai.test.cjs adds search/tactics/replay tests; app.test.cjs includes worker lifecycle tests. Browser QA must use the separate 4174 origin, preserving user games on 4173.

Release validation: 17 engine, 14 controller, and 7 AI checks pass (38 total). Browser QA verified each opponent replies, fixed orientation, undo, mobile without horizontal overflow, and a saved pending Magnus turn resuming after reload. No browser warning/error logs were observed. ai-preview.jpg shows the computer match. Sample opening search on this computer completed Joe depth 4 and Magnus depth 8; this is not a strength or device-performance guarantee.

## PvAI turn order — v0.3.1 (2026-11-16)

PvAI now offers First (Red) / Second (Blue) before starting a game. Red still starts; when humanColor is Blue, AI opens as Red. Orientation remains fixed toward humanColor. Ownership guards, status, saved matches, exports, and decision-level undo use humanColor. Older saves default to Red. Undo cannot remove the computer opening alone; after the first human decision it rewinds the human move and reply while preserving that opening. PvP and Playground behavior is unchanged.

Validation: all 42 checks pass (17 engine, 18 controller, 7 AI). Browser confirmed Second/Blue starts with one Red computer move, then enables Blue with the board facing Blue. Mobile selector layout was visually checked.
