const assert=require('node:assert/strict');
require('./engine.js');require('./ai.js');
const E=globalThis.SciDama,A=globalThis.SciDamaAI;
let count=0;
const signature=m=>JSON.stringify([m.uid,m.steps.map(s=>s.to)]);
function test(name,fn){fn();count++;console.log('PASS '+name);}
const tactical={...E.create(),pieces:[{uid:'r',id:1,color:'red',x:2,y:3,king:false},{uid:'b1',id:2,color:'blue',x:1,y:4,king:false},{uid:'b2',id:4,color:'blue',x:3,y:4,king:false}]};
test('Dumbledore deliberately chooses the worst immediate legal evaluation',()=>{
  const moves=E.legal(tactical);assert.equal(moves.length,2);
  const worst=moves.reduce((a,b)=>A.compare(A.evaluate(A.advance(tactical,a),'red'),A.evaluate(A.advance(tactical,b),'red'))<=0?a:b);
  const result=A.choose(tactical,'dumbledore');assert.equal(signature(result.move),signature(worst));assert.equal(result.depth,1);
});
test('Joe agrees with exhaustive four-turn minimax on a tactical position',()=>{
  function brute(s,d){if(!d||s.finished)return A.evaluate(s,'red');const values=E.legal(s).map(m=>brute(A.advance(s,m),d-1));return values.reduce((a,b)=>(s.turn==='red'?A.compare(a,b)>=0:A.compare(a,b)<=0)?a:b);}
  const moves=E.legal(tactical),values=moves.map(m=>brute(A.advance(tactical,m),3));const best=values.reduce((a,b)=>A.compare(a,b)>=0?a:b);
  const result=A.choose(tactical,'joe');assert.equal(result.depth,4);assert.equal(A.compare(brute(A.advance(tactical,result.move),3),best),0);
});
test('search preserves source state and exact score differences',()=>{
  const s=E.create(),before=JSON.stringify(s);A.choose(s,'joe');assert.equal(JSON.stringify(s),before);
  s.totals.blue=E.VALUES[11];assert.equal(E.compare(A.evaluate(s,'red').margin,E.VALUES[11]),0);
});
test('a proven final win ranks above any speculative score margin',()=>{
  const win={...tactical,finished:true,totals:{red:E.fraction(-1),blue:E.ZERO}};
  assert.equal(E.results(win).winner,'red');const guess=E.create();guess.totals.blue=E.fraction(10n**100n);assert(A.compare(A.evaluate(win,'red'),A.evaluate(guess,'red'))>0);
});
test('Magnus returns a legal fallback when its node budget is exhausted',()=>{
  const s=E.create(),r=A.choose(s,'magnus',{nodes:1});assert(E.legal(s).some(m=>signature(m)===signature(r.move)));assert(r.nodes<=1);assert.equal(r.depth,0);
});
test('finished states return no computer move',()=>{const s=E.create();s.finished=true;assert.equal(A.choose(s,'joe').move,null);});
test('all levels obey compulsory captures and produce replayable games',()=>{
  let s=E.create();for(let turn=0;turn<28&&!s.finished;turn++){const level=['dumbledore','joe','magnus'][turn%3];const r=A.choose(s,level,{milliseconds:100,nodes:1500});assert(r.move);assert(E.legal(s).some(m=>signature(m)===signature(r.move)));s=E.apply(s,r.move);}
  let replay=E.create();for(const move of s.moves)replay=E.apply(replay,move);assert.deepEqual(replay,s);
});
console.log(`\n${count} AI tests passed.`);
