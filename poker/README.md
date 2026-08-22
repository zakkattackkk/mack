# Hold'em Odds & Bet Advisor

A single-page, no-install poker odds calculator for **No-Limit Texas Hold'em**.
Open `index.html` in any browser (works great on a phone at the table) and it
tells you your real chance of winning the hand plus a fold / call / raise
recommendation with a suggested bet size — in the actual dollars of your stake.

## What it does

You give it:

- **Stakes** — 5¢/10¢, 10¢/20¢, 25¢/50¢, 50¢/$1, $1/$2, or $2/$5.
- **Players still in the hand** — win % drops as more people are in, so update
  this as opponents fold.
- **How tight the other players are** — a Loose ↔ Tight slider (see below).
- **Your two hole cards**, and the **board** as it's dealt (flop / turn / river).
- **The action** — checked, bet/called, or raised — plus the current pot and the
  amount it costs you to call.

It gives you:

- **Win %** (with a win / tie / lose bar) for your exact hand vs. that many
  opponents, from a ~12,000-hand Monte Carlo simulation.
- **Your current made hand** (pair, flush, etc.) once the flop is out.
- **Pot odds** — the equity you need to call profitably.
- **EV of calling** — expected dollar value of a call, + or –.
- **A recommendation** — FOLD / CHECK / CALL / BET / RAISE — with a suggested
  bet size rounded to your table's bet increment. Sizing is built to **fold out
  weaker hands and deny draws the odds to chase**: opens and raises grow with the
  number of players still in (to thin a loose, multiway field), and postflop bets
  grow on drawy boards (two-tone / connected / monotone) so a flush or straight
  draw can't call cheaply and "catch" you.

## Two modes

- **✍️ Manual** — enter the cards and action from a real game yourself.
- **🎮 Practice game** — the app deals a mock hand and **fills in your cards, the
  board, the pot, and the bet for you** as the hand plays out. Simulated
  opponents check / bet / fold, and you just make the decisions (Fold / Check-Call
  / Raise) while the advisor updates live. A running log explains what everyone
  did and who won at showdown, so you can practice reading the numbers without
  typing anything. The practice opponents use a simplified betting model (one
  action per player per street, a single raise) — enough to rehearse decisions,
  not a full poker AI. Their tightness follows the same Loose ↔ Tight slider.

  *Note on "watching a real game": having the app read an online poker table off
  your screen would violate most real-money sites' terms of service, so it isn't
  built. Practice mode gives you the auto-filled cards without that risk.*

## How the win % is calculated

It runs a Monte Carlo simulation: thousands of times it deals random hands to
your opponents and random remaining community cards, evaluates every player's
best five-card hand, and counts how often you win, tie, or lose. That fraction
is your equity. This is exactly how a real poker odds calculator works — no
lookup-table shortcuts, so any board and any number of opponents work.

## How "tightness" works

A tight player only voluntarily plays strong hands. The slider narrows the range
of hands your opponents are assumed to hold:

- **Loose** — opponents can show up with almost anything (~80% of hands). Your
  win % goes **up**, because their range is weaker.
- **Tight** — opponents only hold premium hands (~8% of hands). Your win % goes
  **down**, because you're up against strength.

Hand strength for the range is scored with the **Chen formula**, a well-known
starting-hand rating. Watch how people play, jot reads in the notes box, and set
the slider to match the opponents in the current hand.

## Honest limits

- The tightness model applies **one** average range to all opponents. It can't
  read a specific player's soul — it's an adjustment, not mind-reading.
- Your own past statistics don't change the math of the hand in front of you
  (the cards are the cards). The notes box is there to track reads over time.
- Monte Carlo results wobble by ~1% between runs; that's expected.
- This is a decision aid, not a guarantee. Variance is real. Play responsibly.

## Files

- `index.html` — the app (UI + inline logic). Open it directly, no server needed.
- `engine.js` — the poker engine: hand evaluator, Monte Carlo equity, pot-odds
  and bet-sizing advice. Pure functions, usable in the browser or Node.
- `engine.test.js` — unit tests. Run with `node engine.test.js`.

## Running the tests

```
cd poker
node engine.test.js
```
