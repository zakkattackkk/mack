/* Simple assertion tests for the poker engine. Run: node engine.test.js */
var E = require('./engine.js');
var pass = 0, fail = 0;

function ok(cond, msg) {
  if (cond) { pass++; }
  else { fail++; console.error('FAIL: ' + msg); }
}
function approx(a, b, tol, msg) {
  ok(Math.abs(a - b) <= tol, msg + ' (got ' + a + ', expected ~' + b + ')');
}
function C(s) { return E.strToCard(s); }
function h7(strs) { return strs.map(C); }

// ---- Hand ranking sanity ----
var royal = E.eval7(h7(['As', 'Ks', 'Qs', 'Js', 'Ts', '2c', '3d']));
ok(E.categoryOf(royal) === 8, 'royal flush is straight flush category');

var quads = E.eval7(h7(['As', 'Ah', 'Ad', 'Ac', 'Ks', '2c', '3d']));
ok(E.categoryOf(quads) === 7, 'four aces is quads');

var boat = E.eval7(h7(['As', 'Ah', 'Ad', 'Ks', 'Kh', '2c', '3d']));
ok(E.categoryOf(boat) === 6, 'AAAKK is full house');

var flush = E.eval7(h7(['As', '9s', '7s', '4s', '2s', 'Kh', 'Qd']));
ok(E.categoryOf(flush) === 5, 'five spades is a flush');

var wheel = E.eval7(h7(['As', '2h', '3d', '4c', '5s', 'Kh', 'Qd']));
ok(E.categoryOf(wheel) === 4, 'A-2-3-4-5 wheel is a straight');

var trips = E.eval7(h7(['As', 'Ah', 'Ad', 'Ks', 'Qh', '2c', '3d']));
ok(E.categoryOf(trips) === 3, 'three aces is trips');

var twopair = E.eval7(h7(['As', 'Ah', 'Ks', 'Kh', 'Qd', '2c', '3d']));
ok(E.categoryOf(twopair) === 2, 'AAKK is two pair');

var pair = E.eval7(h7(['As', 'Ah', 'Ks', 'Qh', 'Jd', '2c', '4d']));
ok(E.categoryOf(pair) === 1, 'AA is a pair');

var high = E.eval7(h7(['As', 'Kh', 'Qs', 'Jh', '9d', '2c', '4d']));
ok(E.categoryOf(high) === 0, 'AKQJ9 is high card');

// higher straight beats lower straight
var s9 = E.eval7(h7(['9s', '8h', '7d', '6c', '5s', '2c', '3d']));
var s6 = E.eval7(h7(['6s', '5h', '4d', '3c', '2s', 'Kc', 'Qd']));
ok(s9 > s6, '9-high straight beats 6-high straight');

// ---- Equity sanity ----
// AA vs 1 random opponent preflop is ~85%.
var aa = E.equity({ hole: [C('As'), C('Ah')], board: [], opponents: 1,
  tightness: 50, iterations: 20000 });
approx(aa.equity, 0.85, 0.03, 'AA heads-up preflop ~85%');

// 72o vs 1 random opponent preflop is ~35%.
var seven2 = E.equity({ hole: [C('7d'), C('2c')], board: [], opponents: 1,
  tightness: 50, iterations: 20000 });
ok(seven2.equity < 0.42, '72o heads-up is a big underdog (got ' + E.pct(seven2.equity) + ')');

// More opponents lowers equity for a strong hand.
var aa3 = E.equity({ hole: [C('As'), C('Ah')], board: [], opponents: 3,
  tightness: 50, iterations: 20000 });
ok(aa3.equity < aa.equity, 'AA equity drops vs more opponents');

// Tighter opponents lower equity vs looser (same hand, marginal holding).
var loose = E.equity({ hole: [C('Ks'), C('Jh')], board: [], opponents: 2,
  tightness: 5, iterations: 25000 });
var tight = E.equity({ hole: [C('Ks'), C('Jh')], board: [], opponents: 2,
  tightness: 95, iterations: 25000 });
ok(tight.equity < loose.equity + 0.005,
  'KJ equity is not higher vs tighter opponents (loose ' +
  E.pct(loose.equity) + ' vs tight ' + E.pct(tight.equity) + ')');

// Nut flush on the board = ~100% (can only tie).
var nut = E.equity({ hole: [C('As'), C('Ks')],
  board: [C('Qs'), C('Js'), C('Ts'), C('2h'), C('3d')], opponents: 2,
  tightness: 50, iterations: 5000 });
ok(nut.equity > 0.98, 'royal flush made on board wins ~always');

// ---- Chen score ----
ok(E.chenScore(12, 12, false) === 20, 'AA Chen score is 20');
ok(E.chenScore(0, 0, false) === 5, 'pair of 2s Chen score is 5');
ok(E.chenScore(12, 11, true) > E.chenScore(12, 11, false),
  'AKs scores higher than AKo');

// ---- Advice ----
var call = E.advise({ equity: 0.5, pot: 1.0, toCall: 0.2, bigBlind: 0.1 });
ok(call.requiredEquity < 0.2, 'pot odds: 0.2 into 1.0 needs <20% equity');
ok(call.action === 'CALL' || call.action.indexOf('RAISE') === 0,
  'good equity vs small bet => call or raise');

var fold = E.advise({ equity: 0.1, pot: 1.0, toCall: 0.8, bigBlind: 0.1 });
ok(fold.action === 'FOLD', 'low equity vs big bet => fold');

var lead = E.advise({ equity: 0.75, pot: 1.0, toCall: 0, bigBlind: 0.1 });
ok(lead.action.indexOf('BET') === 0 && lead.suggestBet > 0,
  'strong hand, no bet to us => value bet');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
