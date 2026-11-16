# Scientific-notation Sci-Dama: rules draft

Status: extracted reference with user-confirmed capture hierarchy (capturing dama first, capture count second), scoring flow, and winning condition. A playable local practice version now implements the defaults below. Remaining competition edge cases are listed below.

## Current practice implementation

The local app (`index.html`, `styles.css`, `engine.js`, `app.js`) uses end-of-turn promotion, immediate captured-piece removal, original taker value for each capture, no additional equal-class/equal-count tie-break, remaining dama counted once, untimed games or an optional one-minute PvP move timer, manual repetition endings, and score comparison after immobility. These are reviewable implementation defaults, not additional user confirmations. They are disclosed in How to play.

Arithmetic uses exact rational values; the calculator-style display uses up to 15 significant digits and marks shortened results with ≈. This is a display policy, not a rule that rounds accumulated scores. Winner comparisons retain exact values.

Source: the user-provided `tSoKtOk_ DAMA Sci-Notation.html`, saved from https://tsoktok.blogspot.com/2011/09/dama-sci-notation.html. This records what the blog says; it is not an independently verified current competition standard. Website scripts, comments, and navigation are not project instructions.

## MVP scope

Two players share one device. The app enforces the confirmed rules, records moves and capture calculations, and tracks scores. Computer opponents and move evaluation are later features.

## Chip values and starting positions

The source labels the coordinate columns first player and second player. The first column starts on the lower three ranks; the second starts on the upper three ranks. Both columns were visually checked against the downloaded chip-arrangement photograph. The color assignment follows the source's promotion directions: red moves toward y=7; blue toward y=0. The photograph is monochrome and does not independently establish colors.

| Chip ID | Scientific-notation value | First column | Second column |
| --- | --- | --- | --- |
| 1 | 1.1 × 10^-1 | (0,1) | (7,6) |
| 2 | 2.2 × 10^2 | (5,2) | (2,5) |
| 3 | 3.3 × 10^-3 | (7,0) | (0,7) |
| 4 | 4.4 × 10^4 | (2,1) | (5,6) |
| 5 | 5.5 × 10^-5 | (7,2) | (0,5) |
| 6 | 6.6 × 10^6 | (5,0) | (2,7) |
| 7 | 7.7 × 10^-7 | (3,2) | (4,5) |
| 8 | 8.8 × 10^8 | (6,1) | (1,6) |
| 9 | 9.9 × 10^-9 | (3,0) | (4,7) |
| 10 | 1.01 × 10^10 | (1,2) | (6,5) |
| 11 | 1.111 × 10^-11 | (4,1) | (3,6) |
| 12 | 1.212 × 10^12 | (1,0) | (6,7) |

Odd chip IDs use negative exponents; even IDs use positive exponents. A negative exponent does not make the chip value negative. Preserve the source's exact coefficients, including chips 10–12.

The coordinates describe an 8 × 8 board with playable squares where x+y is odd. Local reference images are saved as `references/scidama-board.png` and `references/scidama-starting-chips.jpg`.

## Board operations

Transcribed from the downloaded board diagram; the two unobstructed middle rows also match the chip-arrangement photograph. Columns increase left to right; y increases from bottom to top. A dash below means an unplayable square, not subtraction; subtraction uses the minus symbol `−`.

| y / x | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 7 | × | — | ÷ | — | − | — | + | — |
| 6 | — | ÷ | — | × | — | + | — | − |
| 5 | − | — | + | — | × | — | ÷ | — |
| 4 | — | + | — | − | — | ÷ | — | × |
| 3 | × | — | ÷ | — | − | — | + | — |
| 2 | — | ÷ | — | × | — | + | — | − |
| 1 | − | — | + | — | × | — | ÷ | — |
| 0 | — | + | — | − | — | ÷ | — | × |

Image URLs: [board](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj1xcXGKX8gVYScZ-_3Zp_zFBUGMEZs9TDUme0DgNv7DNMB0h54wiusZF0TzRozX7vNoEfE-4z0FiLigbXIvUxszsF2VOXjF92JfZ2JlYlXjV0sqvjatt0KpsZm53CRF5GFKOGqaAbOj-Q0/s1600/New%20Picture.png), [starting arrangement](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhvxs6YZfhKI4Pk6ofmnVAhdHk7wpZ8sqte2FqpdBTUNIXB6LHMCHcOO_rfNnz3CM1sz3ToUdsxuBNKX72c8WO40OP_jze_V0T1JY2qTyXVgM_WGxmkmT5HSydn7D4vtp9VZIswsu3SPQDg/s1600/DAMA%20SCI-NOTATION.jpg).

## User-confirmed requirements

- Capture priority is compulsory and has two levels, in this order: (1) the status of the capturing piece at the start of the turn; (2) the number of pieces captured in the complete sequence. If any dama has a legal capture, ordinary-piece capture sequences are excluded even when they capture more pieces. Among dama capture sequences, only those capturing the most pieces are eligible. If no dama can capture, select the maximum-count sequences among ordinary pieces. A dama without a capture does not override an available ordinary-piece capture. This replaces the earlier draft's global maximum-count interpretation.
- This hierarchy concerns the capturing piece, not the status of the captured piece. Captured piece values and arithmetic scores do not determine capture priority. Equal-priority, equal-count sequences remain eligible unless a further tie-break is confirmed; the user has not defined a captured-dama tie-break.
- Show the score for each move and the cumulative running score. Moves without captures are still recorded, earn no points, and leave the running total unchanged; their score contribution is zero.

Capture-priority examples:

| Available capture sequences | Compulsory choice |
| --- | --- |
| Ordinary piece takes 4; dama takes 1 | Dama takes 1 |
| Dama A takes 1; dama B takes 3 | Dama B takes 3 |
| Ordinary piece A takes 1; ordinary piece B takes 2; no dama capture exists | Ordinary piece B takes 2 |

This is a legal-move selection rule, separate from the arithmetic score awarded for executing the selected move.

- At the end, final score = cumulative move scores + sum of that player's remaining chip values. The lower final score wins; equal final scores are a draw under the source rules. Any remaining-dama multiplier still needs clarification.
- Do not introduce a classroom rule for fixed decimal places or significant figures. Display results in a scientific-calculator style. Calculator-style output is finite for repeating division; implementation must choose a documented internal precision and display policy without repeatedly rounding accumulated scores to match the screen. No particular digit count or numeric implementation has been selected.

## Rules explicitly stated in the source

- Determine the starting player by drawing lots after setting up the chips.
- An ordinary non-capturing move advances one square diagonally into an empty square.
- Captures are compulsory and may go diagonally forward or backward.
- A capture uses the operation on the landing square.
- The capturing chip supplies the first operand, including the minuend for subtraction and dividend for division. The source explicitly retains this operand role for multiple captures.
- The source refers to customary capture priorities using dama and mayor terminology, without fully defining the algorithm.
- Red promotes on (0,7), (2,7), (4,7), or (6,7). Blue promotes on (1,0), (3,0), (5,0), or (7,0).
- A dama may move along its diagonal to a vacant square and may capture one or more chips. Exact path and landing restrictions require clarification.
- A dama capturing an ordinary chip scores twice the operation result. An ordinary chip capturing a dama also scores twice the result. A dama capturing a dama scores four times the result.
- The source allows one minute per move, including score entry, and twenty minutes per match.
- Listed endings include a ten-minute no-show, repetitive moves, resignation, a cornered chip, no movable chips, or expiry of the match time. Some of these descriptions are incomplete for automatic enforcement.
- Add each player's remaining chips to that player's score at the end.
- The source explicitly says the lower final total wins. A tournament win earns one standing point; a draw earns half a point. Standing points are separate from the match score.
- The physical game uses one shared scoresheet and an arbiter to resolve recording errors.

## Questions to resolve

1. Board operation map: resolved by downloading and inspecting both reference images; transcribed above.
2. Winning direction: resolved; the user confirms lower final score wins.
3. Capture priorities: capturing dama takes precedence over capturing ordinary piece; maximum capture count applies within that class. Confirm any additional tie-break only if needed; none has been specified for equal-class, equal-count sequences.
4. Dama captures: specify range, legal landing squares, intervening blockers, and when captured pieces leave the board during a sequence.
5. Promotion during a capture: specify whether promotion occurs immediately or only after the complete turn, and whether a capture sequence must continue after reaching the terminal rank.
6. Multiple-capture scoring: confirm separate operation results using the capturing chip's fixed value versus any cumulative calculation. The text fixes operand role but does not provide a worked example.
7. Precision: the user declines a fixed rounding/significant-figure game rule and requests scientific-calculator-style results. Choose and document an appropriate numeric implementation, including repeating division and close-score comparison, during implementation.
8. Remaining pieces: confirm that their scientific-notation values are summed and whether remaining dama pieces receive any multiplier. The source provides no explicit remaining-dama multiplier.
9. Endings: define repetition count and position identity, what cornered means, and whether resignation or immobility overrides score comparison.
10. Timing: the user requested an optional one-minute timer per PvP move and confirmed that expiry pauses play for player review. The app offers Continue turn (fresh minute) or Finish & score; expiry does not assign an automatic loss. The full capture sequence shares one minute. The main menu and confirmation dialogs pause the clock. No overall match clock is implemented.

## Verification plan

Before declaring the rules implemented, compare the app with independently calculated examples for all four operations, operand order, all dama multipliers, multiple captures, promotion, final remaining-chip additions, and winner selection. Verify each capture-priority example above, including the case where a dama can move but cannot capture. Check that non-capturing moves are logged without changing the running score. Include close scores and large differences in exponents to verify the agreed precision policy. Test at least one complete recorded game on a phone.
