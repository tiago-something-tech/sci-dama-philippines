# Sci Dama — scientific notation

A dependency-free, shared-device practice game built with HTML, CSS, and JavaScript. No accounts, backend, or installation is needed to play.

## Open the game

Open `index.html` in a modern browser, or serve this folder with any static HTTP server. Browser saving is most reliable when served over HTTP at the same address each time. The development preview uses `http://127.0.0.1:4173/` while its server is running. A direct file preview may have browser-specific storage restrictions.

The app opens at the main menu. Choose Play, then PvP, PvAI, or Playground, and Start game. Resume match opens your saved game. In PvAI, choose Dumbledore, Joe, or Magnus; choose First (Red) or Second (Blue). The computer opens when you choose second. Red starts. Tap a chip and then a marked destination. Complete compulsory multiple captures before passing the device. PvP automatically turns the board toward the next player after a complete turn. Playground lets one person play both sides using the same move rules and manual board flipping. Undo reverses a turn; during an unfinished capture it cancels that turn's uncommitted selection. Refresh returns to the menu; Resume match restores the last completed turn. Download a JSON record to preserve the game outside browser storage. Clearing browser data removes the saved local game.

## Included

- Verified chip starting coordinates and operation layout from the supplied blog images.
- Capturing dama has priority over ordinary-piece captures; maximize captured count within that class.
- Flying dama, backward ordinary captures, promotion, per-jump calculations, move history, running scores, and final remaining-chip scoring.
- Exact fraction arithmetic and winner comparisons; calculator-style display with up to 15 significant digits. The display's approximation marker never affects the internally exact score.
- Browser autosave, whole-turn undo, manual board flip, game-record download, new-game and finish confirmations.
- Responsive layout and labeled keyboard-accessible squares.

## Interface

Version 0.2.0 opens with a desktop animated board preview and a vertical main menu; the preview is hidden on mobile and respects reduced-motion preferences. The interface uses Geist, an off-white background, and a black and white board with red and blue chips. How to Play, Changelogs, and Credits open from the menu. The footer shows the version number. Routine save notices are removed; storage failures still display an actionable message. Routine move instructions remain available to screen readers.

PvP offers a timer toggle (off by default). When enabled, each complete turn has one minute, including all jumps in a capture. The clock resets after a turn or undo. It pauses in the main menu and during confirmation dialogs. It continues in background tabs while a match is open, using an absolute deadline instead of relying on timer ticks. On expiry, play pauses: players may continue the same turn with a new minute or finish and compare exact final scores. No automatic loss or forced move is assigned. Reloading opens the menu and preserves time remaining as of the reload; Resume restarts the paused clock. Playground is untimed.

## Computer opponents

PvAI runs locally in a Web Worker; no LLM, account, server-side AI, or API key is required. Serve the app over HTTP for worker support (opening a `file://` page can block workers). PvP and Playground still work without a worker. If the computer fails to start, Retry opponent is available and the saved position is retained.

- **Dumbledore:** picks the worst immediate evaluation it finds, attempting to lose while obeying compulsory captures. It cannot guarantee a loss.
- **Joe:** iterative minimax search targeting four individual turns (Joe → human → Joe → human), bounded by 1.2 seconds or 14,000 nodes.
- **Magnus:** iterative minimax with alpha-beta pruning targeting up to eight individual turns, bounded by 2.5 seconds or 35,000 nodes. This is the strongest search configuration, not a guarantee of unbeatable play.

Search retains the last fully completed depth and always has a legal fallback. Large positions or slower phones can reduce the completed depth. The thinking budgets are checked between nodes; move generation can add some overhead. A 12-second worker watchdog offers retry if the worker becomes unresponsive. Speculative moves use the same authoritative engine with record history omitted, preserving exact rational arithmetic. Evaluation compares the difference between final scores if play ended at the evaluated position, including remaining chips. Proven terminal wins/losses take priority; advancement, centralization, and dama status only break equal score margins. This is a first evaluation model, not a proven competition-strength analyst.

The board stays facing the chosen human side. Turn order is saved with the match and included in exported records; older saves default to human Red. Undo returns to the human’s prior decision, including taking back the computer reply. When playing second, the computer’s opening is preserved; undo becomes available after your first completed move. Going to the menu, starting over, undoing, or opening finish confirmation cancels pending computer work. Resuming a saved computer turn restarts the search. PvAI is untimed in this release. There is no artificial game ending at 24 or 30 turns; estimated typical match length is not a rule or search-depth guarantee.

## Practice assumptions to review

See `RULES-DRAFT.md` for source facts, user clarifications, and remaining edge cases. This implementation offers untimed practice and an optional PvP move timer; it is not a verified competition ruleset. It promotes at the end of a full turn, removes captured chips immediately, uses the taker's unchanged original value for each jump, permits equal-priority/equal-count capture paths, counts remaining dama values once, and compares final scores after immobility. Repetition is ended manually with both players' agreement using Finish & score. During a capture, a chip remains in its initial ordinary/dama class until the full turn ends.

## Files

- `index.html`: page structure and dialogs.
- `styles.css`: board and responsive layout. Geist is loaded through Google Fonts with local system font fallbacks.
- `engine.js`: independent legal-move and exact-score engine.
- `app.js`: board interaction, records, browser storage, dialogs, and computer-turn lifecycle.
- `ai.js`: bounded opponent search and evaluation.
- `ai-worker.js`: background worker entry point.
- `ai.test.cjs`: tactical, exact-score, search-budget, and game-replay checks.
- `engine.test.cjs`: rule, arithmetic, and simulated-game checks.
- `app.test.cjs`: isolated controller checks for modes, timers, persistence, and navigation.
- `CHANGELOG.md`: maintained release history. Update it and the in-app changelog for each release.
- `references/`: original downloaded reference images.

## Verify

With a modern Node.js installation, run `node engine.test.cjs` and `node app.test.cjs`, and `node ai.test.cjs`. Node.js is needed only to run this test script, not to play. No npm packages are required.

## Future Vercel deployment

This is a static app: choose the Other framework preset, no build command, and the project root as the output directory. Only publish the application files (`index.html`, `styles.css`, `engine.js`, `app.js`, `ai.js`, `ai-worker.js`) if the saved blog HTML and reference materials should remain local. Online multiplayer, opening analysis, and move-review labels remain future work.
