# Hanabi — Complete Rules

Hanabi is a cooperative card game by Antoine Bauza. Players work together as a team to build five
firework "stacks" (one per color) in ascending order. The defining twist: **you cannot see your own
cards** — you hold them facing outward, so everyone sees your hand except you. Information is shared
only through a limited supply of hints.

This document describes the standard base game plus the official optional rules.

---

## 1. Components

### Cards (50 standard + 10 rainbow)

- **5 colors (suits):** White, Red, Blue, Yellow, Green.
- **Each color has 10 cards** with the values: `1 1 1 2 2 3 3 4 4 5`.
  - Three **1s**
  - Two each of **2s, 3s, 4s**
  - One **5**
- **Rainbow color:** a 6th suit of 10 cards, also distributed `1 1 1 2 2 3 3 4 4 5`.
  Used only in advanced/variant play (see §8).

So the base deck is **50 cards** (5 colors × 10). With the rainbow suit fully added it is 60 cards.

### Tokens

- **8 Clue (hint/note) tokens** — typically blue. Spent to give hints, recovered by other actions.
- **3 Fuse (storm/strike) tokens** — typically red/black. Lost when a card is misplayed. Losing all
  3 ends the game immediately in failure.

These are usually stored on a small lid/board: clue tokens start **all available (8)**, fuse tokens
start **all intact (3)**.

---

## 2. Goal

All players cooperate to play cards onto color stacks so that each color forms an ascending run
`1 → 2 → 3 → 4 → 5`. A perfect game scores **25 points** (five complete stacks of five colors).

There are no teams within the group and no individual winner — the whole table wins or loses together.

---

## 3. Setup

1. Choose colors in play (5 colors for the base game).
2. Shuffle all cards into a single face-down **draw deck**.
3. Place all **8 clue tokens** and all **3 fuse tokens** in their available state.
4. Deal a hand to each player based on player count:
   - **2 or 3 players → 5 cards each**
   - **4 or 5 players → 4 cards each**
5. **Critical rule:** players hold their hands so the **backs face themselves** and the **faces point
   outward**. You never look at the front of your own cards. You can (and should) see every other
   player's cards.
6. Pick a starting player (e.g., the most colorful-looking person, per the rulebook's suggestion).
   Play proceeds clockwise.

The remaining undealt cards form the face-down draw deck within reach of all players.

---

## 4. The Firework Stacks

The play area in the middle holds up to five firework stacks, one per color. A stack is built in
strict ascending order:

- A color's **1** must be played before its **2**, the **2** before its **3**, and so on up to **5**.
- Only one card of each rank can be on a stack (the duplicates exist as backups against discards).
- A completed stack runs `1-2-3-4-5` and is worth 5 points.

---

## 5. A Turn

On your turn you **must perform exactly one** of the following three actions. You may **not** pass,
and you may not take more than one action.

> Important: You may **never** give information about your own hand, and players may not give hints
> outside the formal hint action.

### Action A — Give a Hint (costs 1 clue token)

- Only allowed if **at least one clue token is available**. If all 8 have been spent, you cannot
  choose this action.
- Spend one clue token (move it to the "used" side).
- Choose **one other player** and tell them about **either one color OR one rank** in their hand.
- You must point to **every** card matching that color or rank, and the hint must be **complete and
  truthful**:
  - **Color hint:** "These two cards are Red" — indicate all Red cards.
  - **Rank hint:** "These three cards are 1s" — indicate all 1s.
- **Negative information is implied:** if you say "these are your 1s," all other cards are known not
  to be 1s.
- **Empty (negative) hints are allowed** in this project's ruleset. You may give a hint about a color
  or rank that matches **zero** cards in the target's hand ("you have no Red cards", "you have no
  4s"). It still costs a clue token and is a complete, truthful statement about the whole hand.
- You may not give a hint that combines color and rank (e.g., not "your red 1"). One attribute only.

### Action B — Discard a Card (recovers 1 clue token)

- Only allowed if **at least one clue token has been used** (i.e., not all 8 are available). You
  cannot discard when all clue tokens are already in the pool.
- Choose a card from your hand (without looking at it) and place it **face up** on the discard pile.
- **Recover one clue token** (return it to the available pool).
- Draw a new card from the deck and add it to your hand, keeping it facing outward without looking.

The discard pile is **public** — anyone may look through it at any time. This matters for tracking
which critical cards remain.

### Action C — Play a Card (attempt to add to a stack)

- Choose a card from your hand (without looking) and play it face up to the table.
- **If it legally continues a stack** (it's the next ascending card of its color, or a `1` starting a
  new color stack), it is added to that color's firework. Success.
  - **Bonus:** completing a stack by playing its **5** recovers **one clue token** (if any have been
    used; if the pool is already full, no token is gained — it is not stored).
- **If it cannot be legally played** (wrong rank for that color, duplicate, or no valid position):
  - It is a **misplay**. Discard the card to the discard pile and **lose one fuse token**.
  - You do **not** recover a clue token for a misplay.
- Either way, draw a new card from the deck to refill your hand (if cards remain).

---

## 6. Drawing & the Deck

- After discarding or playing, you draw back up to your hand size from the deck.
- If the **deck is empty**, you simply do not draw; you continue playing with a smaller hand.
- You never reveal a drawn card to yourself — slot it into your hand facing outward.

---

## 7. End of the Game

The game can end in three ways:

1. **Failure (immediate loss):** the **third fuse token is lost** (three misplays). The fireworks
   blow up. The game ends instantly with a score of **0** in the strict official rule. (Many groups
   instead score the stacks as-is — see the scoring note below.)
2. **Last round triggered by the deck running out:** when the **last card is drawn** from the deck,
   each player — **including the player who drew the last card** — takes **one final turn**, then the
   game ends. (Equivalently: the game ends after every player has had one more turn once the deck is
   empty.)
3. **Perfect game:** all five stacks reach **5** (score 25). The game ends immediately in a perfect
   victory.

> Official scoring on a blown game: the rulebook states the game is lost and scores 0. A widely used
> house variant scores the completed cards even after three strikes. Pick one and be consistent.

---

## 8. Scoring

At game end, sum the **top card value of each color stack** (i.e., the highest card successfully
played in each color). Maximum is **25** (5 colors × 5).

The rulebook provides this evaluation scale (the "fireworks display" rating):

| Score | Rating                                           |
|------:|--------------------------------------------------|
|   0–5 | Oh dear! The crowd booed.                        |
|  6–10 | Poor — only just managed to please the crowd.    |
| 11–15 | Honourable attempt.                              |
| 16–20 | Excellent! The crowd is delighted.               |
| 21–24 | Amazing! The crowd will remember this for years. |
|    25 | Legendary! A perfect, unforgettable display.     |

---

## 9. Official Expansion Modules (DLC)

These are the three official mini-expansions bundled with **Hanabi Deluxe / Grands Feux**. Each can be
added independently, and they can be **combined** with each other (combine Flamboyant Fireworks with Black
Gunpowder and/or Colour Avalanche; all three at once for the bravest groups). Each adds its component
cards into the **single shuffled draw deck** — they are not separate decks.

### 9.1 Colour Avalanche (Rainbow suit)

- **Setup:** add a sixth **rainbow** suit to the deck and build a **sixth firework series** alongside
  the others in ascending order `1 → 5`. Maximum score rises to **30**. Rank hints always work
  normally; the rainbow suit never substitutes for cards of another series.
- **Scoring scale (max 30):** 25–29 = "Legendary"; 30 = "Sublime! Heaven itself is amazed."

There are three rainbow modes — one differs in *how rainbow is hinted*, and the others in *suit size*:

- **Wildcard (official Colour Avalanche):** rainbow is a **wildcard color — it counts as every
  color**, so **every** color hint touches a rainbow card (a "Red" hint points at reds *and*
  rainbows). You may **not** name "rainbow" as a hint, since it is all colors at once. Full 10-card
  suit `1 1 1 2 2 3 3 4 4 5`.
- **Sixth color, long:** rainbow is its **own** sixth color — touched **only** by a "rainbow" hint,
  never by another color, and the standard colors never touch it. Full 10-card suit.
- **Sixth color, short:** same own-color hinting, but a **short 5-card suit** `1 2 3 4 5` (one of each,
  no duplicates).

> **Which is harder:** **sixth-color short** is the most demanding — with no duplicate rainbow cards,
> every one is critical, so a single misplay or wasted discard of a rainbow card makes 30 unreachable.
> Among the 10-card modes, **wildcard** is harder to *read* than **sixth-color long**: because a
> wildcard rainbow is touched by every color hint, you can't cleanly single it out, whereas the
> sixth-color mode lets you clue rainbows directly.

### 9.2 Black Gunpowder (Black Powder)

- **Setup:** add the **10 black cards** to the deck. Because black is built in reverse, its
  distribution is **mirrored**: `5 5 5 4 4 3 3 2 2 1` (three `5`s, two each of `4/3/2`, a single `1`).
- Build a **sixth series** in black, but in **reverse / descending order — `5 → 4 → 3 → 2 → 1`**. The
  black **5** is the starter (three copies exist), and the series is completed by playing the lone
  **1**, which is the single critical card.
- Completing the black series (with the `1`) recovers a **clue token**, like completing any other `5`.
- **Hints:** black cards are **colorless**. You may **never** give color information about them, and
  you may **not** say "you have no black cards." Only **value** hints may reference them.
- **Scoring (max stays 25):** black does **not** add to the score like other colors. Instead,
  **subtract 1 point** from your final score for **each card missing** from the black series. You also
  earn the **"Black Powder Award"** flavor accolade regardless of completion.
  - *Example:* if the black display ends at `5, 4, 3` (the `2` and `1` are missing), subtract 2 points
    — final score 16 with the Black Powder Award.

### 9.3 Flamboyant Fireworks

- **Setup:** shuffle the **6 BONUS cards** face down beside the deck (no extra suit is added).
- **Trigger:** when you complete a series by successfully playing a **5**, *instead* of recovering a
  clue token, flip **one random BONUS card** face up and apply its effect. Then discard that BONUS card
  and draw a card to refill your hand.
- The **6 bonus effects** are:
  1. **Gain 1 clue token.**
  2. **Repair an error + gain 1 clue token** — flip one red ERROR/fuse token back to its blue (intact)
     side *and* gain 1 clue token. If no error has been made, you simply gain 1 clue token.
  3. **Free color hint** — immediately give a color hint to any player of your choice, **without
     spending a clue token** (one piece of information).
  4. **Free value hint** — immediately give a rank/value hint to any player, **without spending a clue
     token** (one piece of information).
  5. **Recover a discard into the deck** — take one card from the discard pile and shuffle it back into
     the draw deck. *Special case:* if the deck is empty, apply effect #6 instead.
  6. **Recover a discard and play it** — take one card from the discard pile and play it directly onto
     a series. It must be a legal play (e.g., a red 3 only after the red 2); if it doesn't fit, the
     bonus is lost. *Special case:* if the recovered card is a `5` that completes a series, that
     completion **triggers another bonus**.

### 9.4 Player count

Hanabi plays 2–5. With 2–3 players the larger 5-card hands give more information per player.

---

## 10. Key Constraints & Etiquette

- **No looking at your own cards, ever**, until they are played or discarded.
- **No table talk / coded signals.** The only legal channel of information is the formal hint action.
  You may not hint with tone of voice, timing, gestures, or by commenting on your own hand.
- You **may** discuss general strategy and the public game state (discard pile, stacks, tokens, whose
  turn it is) — but never reveal hidden information about your own hand or use side-channels.
- **Track the discards.** Because each color has a fixed multiset (`1 1 1 2 2 3 3 4 4 5`), discarding
  both copies of a needed rank — or the lone `5` — can make a perfect score impossible.
- **Clue economy is central:** hints are scarce (8 max). Discarding and completing stacks are the only
  ways to regain clue tokens, so the team must balance giving information vs. preserving it.

---

## 11. Quick Reference

| Item                   | Value                                                                |
|------------------------|----------------------------------------------------------------------|
| Colors (base)          | 5 (White, Red, Blue, Yellow, Green)                                  |
| Cards per color        | 10 → `1 1 1 2 2 3 3 4 4 5`                                           |
| Total cards (base)     | 50                                                                   |
| Hand size              | 5 (2–3 players) / 4 (4–5 players)                                    |
| Clue tokens            | 8                                                                    |
| Fuse tokens            | 3                                                                    |
| Actions per turn       | exactly 1: Hint / Discard / Play                                     |
| Empty (negative) hints | allowed (enabled in this ruleset)                                    |
| Clue token recovered   | on discard, and on completing a `5`                                  |
| Fuse lost              | on each misplay; 3 lost = game over                                  |
| Max score              | 25 (base) / 30 (with Colour Avalanche; Black Gunpowder keeps max 25) |
| Official DLC           | Colour Avalanche · Black Gunpowder · Flamboyant Fireworks            |
| End triggers           | 3 fuses lost · deck empty + 1 final round each · perfect 25          |
