/* Controller integration checks with an isolated DOM, saved match, and controllable clock. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
require('./engine.js');
const E = globalThis.SciDama;
function harness(saved) {
  let now=1000, tick;
  const workers=[];
  class Worker {constructor(){this.terminated=false;workers.push(this);}postMessage(data){this.data=data;}terminate(){this.terminated=true;}reply(){const {id,state}=this.data;this.onmessage({data:{id,move:E.legal(state)[0]}});}}
  class Element {
    constructor(){this.hidden=false;this.open=false;this.value='';this.children=[];this.events={};this.style={};this.dataset={};this.classList={toggle(){}};}
    addEventListener(type,fn){(this.events[type]??=[]).push(fn);}
    emit(type,event={}){for(const fn of this.events[type]||[])fn(event);}
    click(){this.emit('click');}
    setAttribute(){} append(e){this.children.push(e);} replaceChildren(){this.children=[];} focus(){}
    showModal(){this.open=true;} close(){this.open=false;this.emit('close');}
  }
  const nodes=new Map();const el=id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id);};
  const radio=new Element();radio.value='pvp';
  const storage=new Map(saved?[['scidama.practice.v1',JSON.stringify(saved)]]:[]);
  const context={window:{SciDama:E},document:{getElementById:el,createElement:()=>new Element(),querySelector:s=>s.includes(':checked')?radio:el(s),querySelectorAll:s=>s.includes('input[name=')?[radio]:[]},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},Date:{now:()=>now},setInterval:fn=>{tick=fn;},Worker,setTimeout:()=>1,clearTimeout:()=>{},console};
  vm.runInNewContext(fs.readFileSync('./app.js','utf8'),context);
  const read=()=>JSON.parse(storage.get('scidama.practice.v1'));
  function move(){let state=E.create();for(const m of read().moves)state=E.apply(state,m);const path=E.legal(state)[0];const piece=state.pieces.find(p=>p.uid===path.uid);const square=(x,y)=>el('board').emit('click',{target:{closest:()=>({dataset:{x,y}})}});square(piece.x,piece.y);for(const step of path.steps)square(...step.to);}
  return {el,radio,read,move,workers,advance:ms=>{now+=ms;tick();},start:(mode='pvp',timer=false,humanColor='red')=>{el('ai-order').value=humanColor;radio.value=mode;el('timer-toggle').checked=timer;el('start-button').click();}};
}
let count=0;
function test(name,fn){fn();console.log('PASS '+name);count++;}
test('fresh load stays in menu without overwriting browser storage',()=>{
  const h=harness();assert.equal(h.el('resume-button').hidden,true);assert.throws(h.read);assert.equal(h.el('hero-board').children.length,64);
});
test('PvP flips after a complete turn and undo restores orientation',()=>{
  const h=harness();h.start();h.move();assert.equal(h.read().moves.length,1);assert.equal(h.read().flipped,true);h.el('undo-button').click();assert.equal(h.read().moves.length,0);assert.equal(h.read().flipped,false);
});
test('Playground controls both sides without automatic flipping or timer',()=>{
  const h=harness();h.start('playground',true);h.move();h.move();assert.equal(h.read().moves.length,2);assert.equal(h.read().flipped,false);assert.equal(h.read().timed,false);
});
test('timer expires, blocks moves, and continues the same turn',()=>{
  const h=harness();h.start('pvp',true);h.advance(60001);assert.equal(h.el('timeout-dialog').open,true);assert.equal(h.read().remaining,0);h.move();assert.equal(h.read().moves.length,0);h.el('timeout-continue').click();h.move();assert.equal(h.read().moves.length,1);assert.equal(h.read().remaining,60000);assert.equal(h.el('move-clock').textContent,'1:00');
});
test('menu pauses timer and resume preserves remaining time',()=>{
  const h=harness();h.start('pvp',true);h.advance(20000);h.el('menu-button').click();assert.equal(h.read().remaining,40000);assert.equal(h.read().deadline,0);h.advance(120000);h.el('resume-button').click();assert.equal(h.el('move-clock').textContent,'0:40');assert.equal(h.el('timeout-dialog').open,false);
});
test('expired timer survives reload and finish uses exact final scores',()=>{
  const h=harness({version:1,moves:[],mode:'pvp',timed:true,remaining:60000,deadline:500});h.el('resume-button').click();assert.equal(h.el('timeout-dialog').open,true);h.el('timeout-finish').click();assert.equal(h.read().finished,true);assert.equal(h.el('result-title').textContent,'Draw.');
});
test('legacy records replay and new game cancellation preserves them',()=>{
  const next=E.apply(E.create(),E.legal(E.create())[0]);const h=harness({version:1,moves:next.moves,flipped:false});h.el('resume-button').click();assert.equal(h.read().moves.length,1);assert.equal(h.read().timed,false);assert.equal(h.read().flipped,true);h.el('menu-button').click();h.start('playground');assert.equal(h.el('confirm-dialog').open,true);assert.equal(h.read().moves.length,1);
});
test('finishing confirmation pauses timer and cancel resumes it',()=>{
  const h=harness();h.start('pvp',true);h.advance(15000);h.el('finish-button').click();h.advance(120000);assert.equal(h.el('timeout-dialog').open,false);h.el('confirm-dialog').close();assert.equal(h.el('move-clock').textContent,'0:45');
});
test('PvAI blocks human input on Blue and undo rewinds a complete decision',()=>{
  const h=harness();h.start('ai');h.move();assert.equal(h.workers.length,1);h.move();assert.equal(h.read().moves.length,1);h.workers[0].reply();assert.equal(h.read().moves.length,2);assert.equal(h.read().flipped,false);h.el('undo-button').click();assert.equal(h.read().moves.length,0);assert.equal(h.workers[0].terminated,true);
});
test('leaving during computer thinking rejects stale replies and resumes safely',()=>{
  const h=harness();h.start('ai');h.move();const old=h.workers[0];h.el('menu-button').click();assert(old.terminated);old.reply();assert.equal(h.read().moves.length,1);h.el('resume-button').click();assert.equal(h.workers.length,2);h.workers[1].reply();assert.equal(h.read().moves.length,2);
});
test('undo cancels pending computer work before it can change the board',()=>{
  const h=harness();h.start('ai');h.move();const old=h.workers[0];h.el('undo-button').click();assert.equal(h.read().moves.length,0);old.reply();assert.equal(h.read().moves.length,0);
});
test('computer turns restore after reload with the saved difficulty',()=>{
  const s=E.apply(E.create(),E.legal(E.create())[0]);const h=harness({version:1,moves:s.moves,mode:'ai',aiLevel:'magnus'});assert.equal(h.workers.length,0);h.el('resume-button').click();assert.equal(h.workers[0].data.level,'magnus');assert.equal(h.read().aiLevel,'magnus');h.workers[0].reply();assert.equal(h.read().moves.length,2);
});
test('worker failure shows retry without changing the match',()=>{
  const h=harness();h.start('ai');h.move();h.workers[0].onerror();assert.equal(h.el('ai-retry').hidden,false);assert.equal(h.read().moves.length,1);h.el('ai-retry').click();h.workers[1].reply();assert.equal(h.read().moves.length,2);
});
test('finish confirmation cancels computer work and cancel restarts it',()=>{
  const h=harness();h.start('ai');h.move();const old=h.workers[0];h.el('finish-button').click();old.reply();assert.equal(h.read().moves.length,1);h.el('confirm-dialog').close();assert.equal(h.workers.length,2);h.workers[1].reply();assert.equal(h.read().moves.length,2);
});
test('playing second starts a Red computer turn and faces the human Blue side',()=>{
  const h=harness();h.start('ai',false,'blue');assert.equal(h.workers.length,1);assert.equal(h.workers[0].data.state.turn,'red');assert.equal(h.read().humanColor,'blue');assert.equal(h.read().flipped,true);assert.equal(h.el('undo-button').disabled,true);h.move();assert.equal(h.read().moves.length,0);h.workers[0].reply();assert.equal(h.read().moves.length,1);assert.equal(h.el('turn-title').textContent,'Blue to move');assert.equal(h.el('ai-status').textContent,'You play Blue · Joe plays Red.');assert.equal(h.el('undo-button').disabled,true);
});
test('Blue undo preserves the computer opening and rewinds the human decision',()=>{
  const h=harness();h.start('ai',false,'blue');h.workers[0].reply();h.move();h.workers[1].reply();assert.equal(h.read().moves.length,3);h.el('undo-button').click();assert.equal(h.read().moves.length,1);assert.equal(h.el('turn-title').textContent,'Blue to move');assert.equal(h.read().flipped,true);assert.equal(h.workers.length,2);
});
test('second-turn saves restore the human color and resume pending Red replies',()=>{
  const h=harness();h.start('ai',false,'blue');h.workers[0].reply();h.move();const restored=harness(h.read());restored.el('resume-button').click();assert.equal(restored.read().humanColor,'blue');assert.equal(restored.workers[0].data.state.turn,'red');restored.workers[0].reply();assert.equal(restored.el('turn-title').textContent,'Blue to move');assert.equal(restored.read().flipped,true);
});
test('older PvAI saves default to the original human Red side',()=>{
  const h=harness({version:1,moves:[],mode:'ai'});h.el('resume-button').click();assert.equal(h.read().humanColor,'red');assert.equal(h.workers.length,0);assert.equal(h.read().flipped,false);
});
console.log(`\n${count} controller tests passed.`);
