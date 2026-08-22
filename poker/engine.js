/*
 * Poker odds engine — Texas Hold'em (No-Limit)
 * -------------------------------------------------
 * Pure functions, no dependencies. Works in the browser (attaches to
 * window.PokerEngine) and in Node (module.exports) so it can be unit tested.
 *
 * What it does:
 *   - Evaluates the best 5-card hand out of 7 cards.
 *   - Runs a Monte Carlo simulation to estimate your equity (win% + tie share)
 *     against N opponents, given your hole cards and any known board cards.
 *   - Models opponent "tightness": tight players are dealt from a narrower,
 *     stronger range (via the Chen starting-hand score), which realistically
 *     lowers your equity; loose players widen the range and raise it.
 *   - Turns equity + pot/bet numbers into pot odds, EV of a call, and a
 *     fold / call / raise recommendation with a suggested bet size.
 */
(function (root) {
  'use strict';

  // ---- Cards -------------------------------------------------------------
  // A card is an integer 0..51. rank = card % 13 (0=2 .. 12=A). suit = (card/13)|0.
  var RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
  var SUITS = ['c', 'd', 'h', 's']; // clubs diamonds hearts spades

  function cardRank(c) { return c % 13; }
  function cardSuit(c) { return (c / 13) | 0; }
  function makeCard(rank, suit) { return suit * 13 + rank; }

  function cardToStr(c) { return RANKS[cardRank(c)] + SUITS[cardSuit(c)]; }
  function strToCard(str) {
    if (!str || str.length < 2) return -1;
    var r = RANKS.indexOf(str[0].toUpperCase());
    var s = SUITS.indexOf(str[1].toLowerCase());
    if (r < 0 || s < 0) return -1;
    return makeCard(r, s);
  }

  // ---- 5-card evaluator --------------------------------------------------
  // Returns a single comparable integer; higher is better.
  // Category (8=straight flush .. 0=high card) packed with 5 rank tiebreakers.
  function eval5(a, b, c, d, e) {
    var ranks = [cardRank(a), cardRank(b), cardRank(c), cardRank(d), cardRank(e)];
    var suits = [cardSuit(a), cardSuit(b), cardSuit(c), cardSuit(d), cardSuit(e)];
    ranks.sort(function (x, y) { return y - x; });

    var flush = suits[0] === suits[1] && suits[1] === suits[2] &&
                suits[2] === suits[3] && suits[3] === suits[4];

    // straight detection (ranks sorted desc, may contain duplicates)
    var straightHigh = -1;
    var uniq = [];
    for (var i = 0; i < 5; i++) if (uniq.indexOf(ranks[i]) < 0) uniq.push(ranks[i]);
    if (uniq.length === 5) {
      if (uniq[0] - uniq[4] === 4) straightHigh = uniq[0];
      // wheel: A,5,4,3,2 -> A is rank 12, others 3,2,1,0
      else if (uniq[0] === 12 && uniq[1] === 3 && uniq[2] === 2 &&
               uniq[3] === 1 && uniq[4] === 0) straightHigh = 3; // 5-high
    }

    // count ranks
    var counts = {};
    for (i = 0; i < 5; i++) counts[ranks[i]] = (counts[ranks[i]] || 0) + 1;
    // groups: array of [count, rank] sorted by count desc then rank desc
    var groups = [];
    for (var k in counts) groups.push([counts[k], parseInt(k, 10)]);
    groups.sort(function (x, y) { return y[0] - x[0] || y[1] - x[1]; });

    function pack(cat, tb) {
      var v = cat;
      for (var j = 0; j < 5; j++) v = v * 13 + (tb[j] || 0);
      return v;
    }

    if (straightHigh >= 0 && flush) return pack(8, [straightHigh]);
    if (groups[0][0] === 4) return pack(7, [groups[0][1], groups[1][1]]);
    if (groups[0][0] === 3 && groups[1][0] === 2) return pack(6, [groups[0][1], groups[1][1]]);
    if (flush) return pack(5, ranks);
    if (straightHigh >= 0) return pack(4, [straightHigh]);
    if (groups[0][0] === 3) return pack(3, [groups[0][1], groups[1][1], groups[2][1]]);
    if (groups[0][0] === 2 && groups[1][0] === 2)
      return pack(2, [groups[0][1], groups[1][1], groups[2][1]]);
    if (groups[0][0] === 2) return pack(1, [groups[0][1], groups[1][1], groups[2][1], groups[3][1]]);
    return pack(0, ranks);
  }

  var CATEGORY_NAMES = ['High Card', 'Pair', 'Two Pair', 'Three of a Kind',
    'Straight', 'Flush', 'Full House', 'Four of a Kind', 'Straight Flush'];

  // 21 combinations of choosing 5 of 7 cards
  var C7 = (function () {
    var out = [];
    for (var a = 0; a < 7; a++)
      for (var b = a + 1; b < 7; b++)
        for (var c = b + 1; c < 7; c++)
          for (var d = c + 1; d < 7; d++)
            for (var e = d + 1; e < 7; e++) out.push([a, b, c, d, e]);
    return out;
  })();

  // Best 5-card score from 7 cards (array of 7 card ints).
  function eval7(cards) {
    var best = -1;
    for (var i = 0; i < 21; i++) {
      var combo = C7[i];
      var v = eval5(cards[combo[0]], cards[combo[1]], cards[combo[2]],
        cards[combo[3]], cards[combo[4]]);
      if (v > best) best = v;
    }
    return best;
  }

  // Best 5-card score from 5, 6, or 7 known cards.
  function bestKnown(cards) {
    var n = cards.length;
    if (n < 5) return -1;
    if (n === 7) return eval7(cards);
    var best = -1;
    // enumerate all 5-card subsets of n cards
    for (var a = 0; a < n; a++)
      for (var b = a + 1; b < n; b++)
        for (var c = b + 1; c < n; c++)
          for (var d = c + 1; d < n; d++)
            for (var e = d + 1; e < n; e++) {
              var v = eval5(cards[a], cards[b], cards[c], cards[d], cards[e]);
              if (v > best) best = v;
            }
    return best;
  }

  function categoryOf(score) {
    // score = cat * 13^5 + ...  => cat = floor(score / 13^5)
    return (score / 371293) | 0; // 13^5 = 371293
  }

  // ---- Chen starting-hand score (used for opponent ranges) ---------------
  // Returns a score; higher = stronger starting hand.
  function chenScore(rankA, rankB, suited) {
    // rank inputs 0..12 (0=2..12=A). Convert to card value.
    var hi = Math.max(rankA, rankB), lo = Math.min(rankA, rankB);
    function baseVal(r) {
      if (r === 12) return 10;    // A
      if (r === 11) return 8;     // K
      if (r === 10) return 7;     // Q
      if (r === 9) return 6;      // J
      return (r + 2) / 2;         // T..2 => rank/2
    }
    var score;
    if (hi === lo) {
      score = Math.max(baseVal(hi) * 2, 5); // pair
    } else {
      score = baseVal(hi);
      if (suited) score += 2;
      var gap = hi - lo - 1;
      if (gap === 1) score -= 1;
      else if (gap === 2) score -= 2;
      else if (gap === 3) score -= 4;
      else if (gap >= 4) score -= 5;
      // straight bonus: 0 or 1 gap and both cards below Q
      if (gap <= 1 && hi < 10) score += 1;
    }
    return Math.round(score * 10) / 10;
  }

  // Precompute the distribution of Chen scores across all 1326 combos so we
  // can map a "range %" (top X% of hands an opponent plays) to a cutoff score.
  var CHEN_SORTED = (function () {
    var scores = [];
    for (var i = 0; i < 52; i++)
      for (var j = i + 1; j < 52; j++) {
        var suited = cardSuit(i) === cardSuit(j);
        scores.push(chenScore(cardRank(i), cardRank(j), suited));
      }
    scores.sort(function (a, b) { return b - a; }); // desc
    return scores;
  })();

  // Cutoff Chen score such that ~rangePct% of all combos are >= cutoff.
  function chenCutoff(rangePct) {
    if (rangePct >= 100) return -100;
    if (rangePct <= 0) return 100;
    var idx = Math.floor(CHEN_SORTED.length * (rangePct / 100));
    idx = Math.min(idx, CHEN_SORTED.length - 1);
    return CHEN_SORTED[idx];
  }

  // Map a 0..100 "tightness" slider to a range % of hands played.
  // 0 = very loose (plays ~80% of hands), 100 = very tight (plays ~8%).
  function tightnessToRangePct(tightness) {
    var t = Math.max(0, Math.min(100, tightness));
    return 80 - (t / 100) * 72; // 80% down to 8%
  }

  // ---- Monte Carlo equity ------------------------------------------------
  // opts: { hole:[c,c], board:[..0-5], opponents:N, tightness:0..100, iterations }
  // Returns { win, tie, lose, equity, iterations, category, samples }
  function equity(opts) {
    var hole = opts.hole || [];
    var board = opts.board || [];
    var opponents = Math.max(1, opts.opponents || 1);
    var iterations = opts.iterations || 10000;
    var cutoff = chenCutoff(tightnessToRangePct(
      opts.tightness == null ? 50 : opts.tightness));

    if (hole.length !== 2) throw new Error('Need exactly 2 hole cards');

    // deck of remaining cards
    var used = {};
    hole.forEach(function (c) { used[c] = true; });
    board.forEach(function (c) { used[c] = true; });
    var deck = [];
    for (var c = 0; c < 52; c++) if (!used[c]) deck.push(c);

    var wins = 0, ties = 0, losses = 0, done = 0;
    var boardNeeded = 5 - board.length;

    // Current made hand from the cards actually known (need >=5 total cards).
    var myCat = -1;
    var known = hole.concat(board);
    if (known.length >= 5) myCat = categoryOf(bestKnown(known));

    // Fisher-Yates partial shuffle helper
    function drawOpponentHand(d, dlen, tries) {
      // reject hands outside the range up to `tries` times, then accept anything
      for (var t = 0; t < tries; t++) {
        var i1 = (Math.random() * dlen) | 0;
        var i2 = (Math.random() * dlen) | 0;
        if (i1 === i2) continue;
        var a = d[i1], b = d[i2];
        var sc = chenScore(cardRank(a), cardRank(b), cardSuit(a) === cardSuit(b));
        if (sc >= cutoff) return [i1, i2];
      }
      // fallback: any two distinct
      var j1 = (Math.random() * dlen) | 0;
      var j2 = (j1 + 1 + ((Math.random() * (dlen - 1)) | 0)) % dlen;
      return [j1, j2];
    }

    for (var it = 0; it < iterations; it++) {
      // work on a shuffled copy conceptually via swap-to-end
      var d = deck.slice();
      var dlen = d.length;
      var oppHands = [];
      var ok = true;

      // deal opponent hands
      for (var o = 0; o < opponents; o++) {
        if (dlen < 2 + boardNeeded) { ok = false; break; }
        var idx = drawOpponentHand(d, dlen, 20);
        var pa = d[idx[0]], pb = d[idx[1]];
        oppHands.push([pa, pb]);
        // remove the two used cards (swap to end)
        var hi = Math.max(idx[0], idx[1]), lo = Math.min(idx[0], idx[1]);
        d[hi] = d[dlen - 1]; dlen--;
        d[lo] = d[dlen - 1]; dlen--;
      }
      if (!ok) continue;

      // complete the board
      var fullBoard = board.slice();
      for (var bnd = 0; bnd < boardNeeded; bnd++) {
        var ri = (Math.random() * dlen) | 0;
        fullBoard.push(d[ri]);
        d[ri] = d[dlen - 1]; dlen--;
      }

      var mine = eval7([hole[0], hole[1], fullBoard[0], fullBoard[1],
        fullBoard[2], fullBoard[3], fullBoard[4]]);

      var tie = false, beaten = false;
      for (var oo = 0; oo < oppHands.length; oo++) {
        var os = eval7([oppHands[oo][0], oppHands[oo][1], fullBoard[0],
          fullBoard[1], fullBoard[2], fullBoard[3], fullBoard[4]]);
        if (os > mine) { beaten = true; break; }
        if (os === mine) tie = true;
      }
      done++;
      if (beaten) losses++;
      else if (tie) ties++;
      else wins++;
    }

    var eq = done ? (wins + ties * 0.5) / done : 0;
    return {
      win: done ? wins / done : 0,
      tie: done ? ties / done : 0,
      lose: done ? losses / done : 0,
      equity: eq,
      iterations: done,
      category: myCat,
      categoryName: myCat >= 0 ? CATEGORY_NAMES[myCat] : ''
    };
  }

  // ---- Decision / bet sizing --------------------------------------------
  // params: { equity, pot, toCall, bigBlind, increment, stack }
  // Returns advice object with pot odds, EV, action, suggested bet.
  function advise(params) {
    var eq = params.equity;
    var pot = Math.max(0, params.pot || 0);
    var toCall = Math.max(0, params.toCall || 0);
    var bb = params.bigBlind || 0;
    var inc = params.increment || bb || 0.01;
    var stack = params.stack || 0;

    function roundInc(x) {
      if (!inc) return Math.round(x * 100) / 100;
      return Math.round(x / inc) * inc;
    }
    function money(x) { return Math.round(x * 100) / 100; }

    // Pot odds: equity you need to break even on a call.
    var required = toCall > 0 ? toCall / (pot + toCall) : 0;
    // EV of calling (call amount, then win the current pot+call, or lose call).
    var evCall = eq * (pot + toCall) - (1 - eq) * toCall;

    var action, reason, betText = '';
    var suggestBet = 0;

    if (toCall === 0) {
      // No bet to us — decide check vs bet (lead).
      if (eq >= 0.66) {
        suggestBet = roundInc(pot * 0.75);
        action = 'BET (value)';
        reason = 'You are a clear favorite. Bet for value to build the pot.';
      } else if (eq >= 0.55) {
        suggestBet = roundInc(pot * 0.5);
        action = 'BET (value)';
        reason = 'You are ahead. A half-pot bet charges draws and builds value.';
      } else if (eq >= 0.45) {
        suggestBet = roundInc(pot * 0.33);
        action = 'BET small / CHECK';
        reason = 'Roughly a coin flip. A small bet or a check are both fine.';
      } else {
        action = 'CHECK';
        reason = 'You are behind on average. Check and see a cheap card.';
      }
      if (suggestBet > 0) {
        if (stack && suggestBet > stack) suggestBet = stack;
        betText = 'Suggested bet: $' + money(suggestBet) +
          (pot ? ' (~' + Math.round(suggestBet / pot * 100) + '% of pot)' : '');
      }
    } else {
      // Facing a bet — fold / call / raise.
      var edge = eq - required;
      if (eq < required - 0.03) {
        action = 'FOLD';
        reason = 'Your ' + pct(eq) + ' equity is below the ' + pct(required) +
          ' you need to call profitably.';
      } else if (edge >= 0.15 && eq >= 0.6) {
        suggestBet = roundInc(toCall + (pot + toCall) * 0.7);
        if (stack && suggestBet > stack) suggestBet = stack;
        action = 'RAISE (value)';
        reason = 'You have a big equity edge (' + pct(eq) + ' vs ' + pct(required) +
          ' needed). Raise for value.';
        betText = 'Suggested raise TO: $' + money(suggestBet);
      } else {
        action = 'CALL';
        reason = 'Your ' + pct(eq) + ' equity beats the ' + pct(required) +
          ' break-even. Calling is +EV (about +$' + money(evCall) + ').';
      }
    }

    return {
      requiredEquity: required,
      evCall: evCall,
      action: action,
      reason: reason,
      suggestBet: suggestBet,
      betText: betText
    };
  }

  function pct(x) { return Math.round(x * 1000) / 10 + '%'; }

  var api = {
    RANKS: RANKS, SUITS: SUITS,
    cardRank: cardRank, cardSuit: cardSuit, makeCard: makeCard,
    cardToStr: cardToStr, strToCard: strToCard,
    eval5: eval5, eval7: eval7, bestKnown: bestKnown, categoryOf: categoryOf,
    CATEGORY_NAMES: CATEGORY_NAMES,
    chenScore: chenScore, chenCutoff: chenCutoff,
    tightnessToRangePct: tightnessToRangePct,
    equity: equity, advise: advise, pct: pct
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.PokerEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
