/* Run with any modern Node.js: node engine.test.cjs */
const assert = require('node:assert/strict');
require('./engine.js');
const E = globalThis.SciDama;
let passed = 0;
function test(name, fn) { fn(); passed++; console.log('PASS ' + name); }
function piece(uid, id, color, x, y, king = false) { return { uid, id, color, x, y, king }; }
function position(pieces, turn = 'red') { return { ...E.create(), pieces, turn }; }
function equal(a, b) { assert.equal(E.compare(a, b), 0); }

test('starting positions have 24 unique chips and seven opening moves', () => {
  const s = E.create();
  assert.equal(s.pieces.length, 24);
  assert.equal(new Set(s.pieces.map(p => `${p.x},${p.y}`)).size, 24);
  assert(s.pieces.every(p => (p.x + p.y) % 2 === 1));
  assert.equal(E.legal(s).length, 7);
  assert.deepEqual([E.at(s.pieces, 1, 0).id, E.at(s.pieces, 0, 7).id], [12, 3]);
});
test('board operations agree with the reference rows', () => {
  const rows = ['+−÷×','−+×÷','÷×+−','×÷−+'];
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if ((x + y) % 2) assert.equal(E.operation(x, y), [...rows[y % 4]][Math.floor(x / 2)]);
});
test('ordinary opening move records a zero score without mutating input', () => {
  const s = E.create(), next = E.apply(s, E.legal(s)[0]);
  equal(next.totals.red, E.ZERO); assert.equal(next.moves.length, 1);
  assert.equal(s.moves.length, 0); assert.equal(next.turn, 'blue');
});
test('ordinary chips move forward only but capture backward', () => {
  let s = position([piece('r',1,'red',2,3),piece('b',2,'blue',7,6)]);
  assert(E.legal(s).every(p => p.steps[0].to[1] === 4));
  s = position([piece('r',1,'red',2,3),piece('b',2,'blue',1,2)]);
  assert.deepEqual(E.legal(s)[0].steps[0].to, [0,1]);
});
test('dama capture outranks a longer ordinary-piece capture', () => {
  const s = position([piece('rK',1,'red',0,7,true),piece('block',6,'red',3,4),piece('r',2,'red',0,1),piece('b1',3,'blue',1,6),piece('b2',4,'blue',1,2),piece('b3',5,'blue',3,2)]);
  const paths = E.legal(s);
  assert(paths.length > 0); assert(paths.every(p => p.uid === 'rK'));
  assert(paths.every(p => p.steps.length === 1));
  const ordinaryOnly = { ...s, pieces: s.pieces.filter(p => p.uid !== 'rK') };
  assert(E.legal(ordinaryOnly).every(p => p.uid === 'r' && p.steps.length === 2));
});
test('ordinary maximum capture compares complete sequences', () => {
  const s = position([piece('r1',1,'red',0,1),piece('r2',2,'red',7,0),piece('b1',3,'blue',1,2),piece('b2',4,'blue',3,4),piece('b3',5,'blue',6,1)]);
  const paths = E.legal(s); assert(paths.every(p => p.uid === 'r1' && p.steps.length === 2));
});
test('a non-capturing dama does not suppress ordinary captures', () => {
  const s = position([piece('rK',1,'red',0,7,true),piece('block',4,'red',1,6),piece('r',2,'red',0,1),piece('b',3,'blue',1,2)]);
  assert(E.legal(s).every(p => p.uid === 'r' && p.steps[0].captured));
});
test('dama uses flying moves and cannot pass its own chip', () => {
  const s = position([piece('rK',1,'red',0,1,true),piece('r',2,'red',3,4),piece('b',3,'blue',7,6)]);
  const kingMoves = E.legal(s).filter(p => p.uid === 'rK');
  assert(kingMoves.some(p => p.steps[0].to.join() === '2,3'));
  assert(!kingMoves.some(p => p.steps[0].to.join() === '4,5'));
});
test('dama maximizes captured pieces within its class', () => {
  const s = position([piece('rK',1,'red',0,1,true),piece('rK2',2,'red',6,1,true),piece('b1',3,'blue',1,2),piece('b2',4,'blue',3,4),piece('b3',5,'blue',5,2)]);
  const paths=E.legal(s); const count=paths[0].steps.length;
  assert(count>=2); assert(paths.every(p=>p.king && p.steps.length===count));
});
test('subtraction preserves operand order and can score negatively', () => {
  const s = position([piece('r',1,'red',2,3),piece('b',2,'blue',1,4)]);
  const next = E.apply(s,E.legal(s)[0]);
  assert.equal(next.moves[0].steps[0].op,'−');
  equal(next.moves[0].score,E.subtract(E.VALUES[1],E.VALUES[2]));
  assert(E.compare(next.totals.red,E.ZERO)<0);
});
test('all four arithmetic operations and exact repeating division', () => {
  equal(E.add(E.fraction(1),E.fraction(2)),E.fraction(3));
  equal(E.subtract(E.fraction(1),E.fraction(2)),E.fraction(-1));
  equal(E.multiply(E.fraction(3),E.fraction(2)),E.fraction(6));
  equal(E.multiply(E.divide(E.fraction(1),E.fraction(3)),E.fraction(3)),E.fraction(1));
  assert.throws(()=>E.divide(E.fraction(1),E.ZERO));
});
test('capture multipliers cover ordinary/dama and dama/dama', () => {
  for (const [king,victimKing,multiplier] of [[false,false,1],[true,false,2],[false,true,2],[true,true,4]]) {
    const s=position([piece('r',1,'red',0,1,king),piece('b',2,'blue',1,2,victimKing)]);
    const path=E.legal(s).find(p=>p.steps[0].to.join()==='2,3');
    const n=E.apply(s,path); equal(n.moves[0].score,E.multiply(E.divide(E.VALUES[1],E.VALUES[2]),E.fraction(multiplier)));
  }
});
test('multiple jumps score each capture with the original chip value', () => {
  const s=position([piece('r',1,'red',0,1),piece('b1',2,'blue',1,2),piece('b2',3,'blue',3,4)]);
  const n=E.apply(s,E.legal(s)[0]);
  equal(n.moves[0].score,E.add(E.divide(E.VALUES[1],E.VALUES[2]),E.multiply(E.VALUES[1],E.VALUES[3])));
  assert.equal(n.moves[0].calculations.length,2); assert.equal(n.pieces.length,1);
});
test('promotion happens at the end of a turn', () => {
  const s=position([piece('r',1,'red',1,6),piece('b',2,'blue',7,0)]);
  const next=E.apply(s,E.legal(s)[0]); assert(next.pieces.find(p=>p.uid==='r').king); assert(next.moves[0].promoted);
});
test('illegal move is rejected and final scoring adds remaining values once', () => {
  assert.throws(()=>E.apply(E.create(),{uid:'r1',steps:[{to:[7,7]}]}));
  const s=position([piece('r',1,'red',0,1,true),piece('b',2,'blue',7,6)]);
  s.totals.red=E.fraction(1);s.totals.blue=E.fraction(2);
  const result=E.results(s);equal(result.final.red,E.add(E.fraction(1),E.VALUES[1]));assert.equal(result.winner,'red');
  const tied=E.results(E.create());assert.equal(tied.winner,'draw');
});
test('calculator display handles sign, magnitude, carry and exact comparison', () => {
  assert.equal(E.display(E.fraction(-123)).text,'−123');
  assert.equal(E.display(E.decimal('0.001')).text,'0.001');
  assert.equal(E.display(E.decimal('1',12)).text,'1 × 10^12');
  assert(E.display(E.divide(E.fraction(1),E.fraction(3))).approx);
  equal(E.subtract(E.add(E.VALUES[12],E.VALUES[11]),E.VALUES[12]),E.VALUES[11]);
  assert(E.compare(E.add(E.VALUES[12],E.VALUES[11]),E.VALUES[12])>0);
});
test('complete simulated games preserve board, score, and record invariants', () => {
  let seed=7;
  for(let game=0;game<6;game++){
    let s=E.create();
    for(let ply=0;ply<180&&!s.finished;ply++){
      const options=E.legal(s);assert(options.length);seed=(seed*1664525+1013904223)>>>0;
      s=E.apply(s,options[seed%options.length]);
      assert.equal(new Set(s.pieces.map(p=>`${p.x},${p.y}`)).size,s.pieces.length);
      assert(s.pieces.every(p=>p.x>=0&&p.x<8&&p.y>=0&&p.y<8&&(p.x+p.y)%2===1));
      for(const color of ['red','blue'])equal(s.totals[color],s.moves.filter(m=>m.color===color).reduce((t,m)=>E.add(t,m.score),E.ZERO));
    }
    const serialized=JSON.parse(JSON.stringify(s));let replay=E.create();for(const move of serialized.moves)replay=E.apply(replay,{uid:move.uid,steps:move.steps});
    assert.deepEqual(replay.pieces,s.pieces);assert.deepEqual(replay.totals,s.totals);
  }
});
console.log(`\n${passed} tests passed.`);
