(function(){
  'use strict';
  const E=window.SciDama,$=id=>document.getElementById(id),KEY='scidama.practice.v1';
  let state=E.create(),undo=[],flipped=false,selected=null,prefix=[],paths=[],pendingAction=null;
  let saveWarning='',mode='pvp',timed=false,remaining=60000,deadline=0,inGame=false,hasSession=false;
  const VERSION='0.3.1';
  const OPPONENTS={dumbledore:'Dumbledore',joe:'Joe',magnus:'Magnus'};
  let humanColor='red',aiLevel='joe',aiWorker=null,aiGeneration=0,aiBusy=false,aiError='',aiWatchdog=null;
  function cancelAI(){aiGeneration++;if(aiWorker)aiWorker.terminate();aiWorker=null;aiBusy=false;if(aiWatchdog!==null)clearTimeout(aiWatchdog);aiWatchdog=null;}
  function renderAI(){const active=mode==='ai';$('ai-panel').hidden=!active;$('flip-button').hidden=active;$('ai-retry').hidden=!aiError;$('ai-status').textContent=aiError||(aiBusy?`${OPPONENTS[aiLevel]} is thinking…`:state.finished?'Match complete.':`You play ${name(humanColor)} · ${OPPONENTS[aiLevel]} plays ${name(humanColor==='red'?'blue':'red')}.`);}
  function scheduleAI(){
    if(mode!=='ai'||!inGame||state.finished||state.turn===humanColor||aiBusy||$('confirm-dialog').open)return;
    aiError='';aiBusy=true;render();const id=++aiGeneration;
    const fail=()=>{if(id!==aiGeneration)return;cancelAI();aiError='The opponent could not start. Retry, or use the app at a local HTTP address instead of opening the file directly.';render();};
    try{
      aiWorker=new Worker('ai-worker.js');
      aiWorker.onmessage=event=>{if(id!==aiGeneration||event.data.id!==id||!inGame||state.finished||mode!=='ai'||state.turn===humanColor)return;const reply=event.data;if(reply.error||!reply.move){fail();return;}cancelAI();try{const next=E.apply(state,reply.move);undo.push(E.copy(state));state=next;afterTurn();}catch{aiError='The opponent returned an invalid move. Retry to continue.';render();}};
      aiWorker.onerror=fail;
      aiWatchdog=setTimeout(fail,12000);
      aiWorker.postMessage({id,state:E.copy(state),level:aiLevel});
    }catch{fail();}
  }

  function pauseClock(){if(deadline)remaining=Math.max(0,deadline-Date.now());deadline=0;}
  function clockView(){const ms=deadline?Math.max(0,deadline-Date.now()):remaining;const seconds=Math.ceil(ms/1000);$('move-clock').hidden=!timed;$('move-clock').textContent=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;$('move-clock').classList.toggle('urgent',seconds<=10);}
  function expire(){if(!timed||!inGame||state.finished||$('timeout-dialog').open)return;pauseClock();remaining=0;clockView();save();$('timeout-copy').textContent=`${name(state.turn)} reached the one-minute move limit.`;$('timeout-dialog').showModal();}
  function startClock(){deadline=0;if(timed&&!state.finished&&inGame){if(remaining<=0){expire();return;}deadline=Date.now()+remaining;}clockView();}
  function orient(){if(mode==='pvp')flipped=state.turn==='blue';else if(mode==='ai')flipped=humanColor==='blue';}
  function afterTurn(){pauseClock();remaining=60000;orient();resetSelection();render();startClock();save();if(state.finished)showResults();else scheduleAI();}
  function showHome(){cancelAI();pauseClock();inGame=false;$('game-screen').hidden=true;$('home-screen').hidden=false;$('resume-button').hidden=!hasSession;$('resume-button').textContent=state.finished?'Review match ↗':'Resume match ↗';if(hasSession)save();$('menu-title').focus();}
  function showGame(){inGame=true;$('home-screen').hidden=true;$('game-screen').hidden=false;orient();render();startClock();save();$('turn-title').focus();scheduleAI();}
  function startGame(){const nextMode=document.querySelector('input[name="mode"]:checked').value;const nextTimed=nextMode==='pvp'&&$('timer-toggle').checked;const nextLevel=Object.hasOwn(OPPONENTS,$('ai-level').value)?$('ai-level').value:'joe';const nextHuman=$('ai-order').value==='blue'?'blue':'red';const begin=()=>{cancelAI();aiError='';pauseClock();state=E.create();undo=[];mode=nextMode;timed=nextTimed;aiLevel=nextLevel;humanColor=nextHuman;remaining=60000;flipped=false;resetSelection();hasSession=true;showGame();};if(hasSession&&!state.finished)confirm('Start a new game?','This replaces the saved match. Cancel and resume it to save a record first.',begin);else begin();}
  function setupView(){const chosen=document.querySelector('input[name="mode"]:checked').value,pvp=chosen==='pvp';$('timer-setting').hidden=!pvp;$('ai-setting').hidden=chosen!=='ai';$('timer-note').textContent=pvp?'Board flips automatically after each PvP turn. The menu pauses the timer.':chosen==='ai'?`You play ${$('ai-order').value==='blue'?'Blue and move second':'Red and move first'}. The board stays facing you.`:'Control both sides. Flip the board manually when needed.';document.querySelector('.switch-state').textContent=$('timer-toggle').checked?'ON':'OFF';$('ai-description').textContent={dumbledore:'Plays to lose. Thought this was regular dama.',joe:'Aims to look two moves ahead for each side.',magnus:'Our deepest search. Strongest level, not unbeatable.'}[$('ai-level').value]||'Choose an opponent.';}
  function buildHero(){const pieces=E.create().pieces;for(let y=7;y>=0;y--)for(let x=0;x<8;x++){const square=document.createElement('span');square.className='hero-square'+((x+y)%2?' dark':'')+(x===1&&y===2?' demo-move':'');if((x+y)%2){const op=document.createElement('span');op.className='hero-op';op.textContent=E.operation(x,y);square.append(op);}const p=E.at(pieces,x,y);if(p){const chip=document.createElement('span');chip.className='piece '+p.color;chip.textContent=p.id;square.append(chip);}$('hero-board').append(square);}}

  function load(){try{const raw=localStorage.getItem(KEY);if(!raw)return;const saved=JSON.parse(raw);if(saved.version!==1)throw Error('Unsupported saved version');let replay=E.create();const restoredUndo=[];for(const move of saved.moves){restoredUndo.push(E.copy(replay));replay=E.apply(replay,{uid:move.uid,steps:move.steps});}if(saved.finished){replay.finished=true;replay.reason=saved.reason||'Players finished the match.';}state=replay;undo=restoredUndo;flipped=!!saved.flipped;mode=['ai','playground'].includes(saved.mode)?saved.mode:'pvp';aiLevel=Object.hasOwn(OPPONENTS,saved.aiLevel)?saved.aiLevel:'joe';humanColor=saved.humanColor==='blue'?'blue':'red';timed=mode==='pvp'&&saved.timed===true;remaining=Number.isFinite(saved.remaining)?Math.min(60000,Math.max(0,saved.remaining)):60000;if(timed&&Number.isFinite(saved.deadline)&&saved.deadline>0)remaining=Math.min(60000,Math.max(0,saved.deadline-Date.now()));hasSession=true;}catch{saveWarning='The saved match could not be restored. A new game is ready.';}}
  function save(){hasSession=true;try{localStorage.setItem(KEY,JSON.stringify({version:1,appVersion:VERSION,moves:state.moves,finished:state.finished,reason:state.reason,flipped,mode,aiLevel,humanColor,timed,remaining,deadline}));$('save-status').hidden=true;}catch{$('save-status').textContent='Browser saving is unavailable. Save a record before leaving.';$('save-status').hidden=false;}}
  const name=color=>color==='red'?'Red':'Blue';
  function numberHTML(value){const v=E.display(value);const parts=v.text.split(' × 10^');return (v.approx?'≈ ':'')+parts[0]+(parts.length>1?' × 10<sup>'+parts[1]+'</sup>':'');}
  function resetSelection(){selected=null;prefix=[];paths=[];}
  function tempPieces(){let pieces=E.copy(state.pieces);if(!selected)return pieces;for(const step of prefix){if(step.captured)pieces=pieces.filter(p=>p.uid!==step.captured.uid);const p=pieces.find(p=>p.uid===selected);p.x=step.to[0];p.y=step.to[1];}return pieces;}
  function message(text){$('message').textContent=text;}
  function renderBoard(){
    const pieces=tempPieces(),legal=E.legal(state),candidateIds=new Set(legal.map(p=>p.uid));
    const options=paths.filter(p=>prefix.every((s,i)=>p.steps[i].to[0]===s.to[0]&&p.steps[i].to[1]===s.to[1])).map(p=>p.steps[prefix.length]).filter(Boolean);
    const last=state.moves.at(-1);const lastSquares=last?[last.from,last.steps.at(-1).to]:[];
    const xs=Array.from({length:8},(_,i)=>flipped?7-i:i),ys=Array.from({length:8},(_,i)=>flipped?i:7-i);
    $('board').replaceChildren();
    for(const y of ys)for(const x of xs){const playable=(x+y)%2===1,p=E.at(pieces,x,y),dest=options.some(s=>s.to[0]===x&&s.to[1]===y);const button=document.createElement('button');button.type='button';button.className='square '+(playable?'dark':'light')+(p?' has-piece':'')+(p?.uid===selected?' selected':'')+(dest?' destination':'')+(lastSquares.some(s=>s[0]===x&&s[1]===y)?' last-move':'');button.dataset.x=x;button.dataset.y=y;
      button.disabled=!playable||state.finished||(mode==='ai'&&state.turn!==humanColor);button.setAttribute('aria-label',`(${x},${y})${playable?', '+E.operation(x,y):', unplayable'}${p?`, ${name(p.color)} ${p.king?'dama':'chip'} ${p.id}, ${E.LABELS[p.id]}${candidateIds.has(p.uid)?', can move':''}`:''}${dest?', legal destination':''}`);if(p?.uid===selected)button.setAttribute('aria-pressed','true');
      if(playable){const op=document.createElement('span');op.className='operation';op.setAttribute('aria-hidden','true');op.textContent=E.operation(x,y);button.append(op);}
      if(p){const piece=document.createElement('span');piece.className=`piece ${p.color}${p.king?' dama':''}`;piece.setAttribute('aria-hidden','true');if(p.king){const crown=document.createElement('span');crown.className='crown';crown.textContent='♛';piece.append(crown);}const num=document.createElement('span');num.className='piece-number';num.textContent=p.id;piece.append(num);button.append(piece);}
      $('board').append(button);
    }
    $('rank-labels').innerHTML=ys.map(y=>`<span>${y}</span>`).join('');$('file-labels').innerHTML=xs.map(x=>`<span>${x}</span>`).join('');
  }
  function renderScores(){
    $('scores').innerHTML=['red','blue'].map(color=>`<div class="player-score"><div class="player-label"><span class="mini-piece ${color}"></span><div>${name(color)}${!state.finished&&state.turn===color?'<span class="active-tag">TO MOVE</span>':''}<small>${state.pieces.filter(p=>p.color===color).length} chips remaining</small></div></div><span class="score-value" title="Exact running score: ${E.exact(state.totals[color])}">${numberHTML(state.totals[color])}</span></div>`).join('');
    $('turn-title').textContent=state.finished?'Game complete':`${name(state.turn)} to move`;$('turn-dot').style.background=state.finished?'var(--green)':state.turn==='red'?'var(--red)':'var(--blue)';$('turn-count').textContent=state.finished?`${state.moves.length} moves`:`Turn ${state.moves.length+1}`;
  }
  function renderHistory(){
    $('move-badge').textContent=state.moves.length;
    if(!state.moves.length){$('history').innerHTML='<div class="empty-history"><span class="empty-symbol">↗</span><strong>No moves yet.</strong><p>Moves and capture calculations appear here.</p></div>';return;}
    $('history').innerHTML=state.moves.map(m=>`<article class="move-row"><div class="move-summary"><div class="move-label"><span class="move-index">${m.number}.</span><span class="tiny-dot ${m.color}"></span><b>${name(m.color)} · Chip ${m.id}</b>${m.promoted?' · Dama!':''}<span class="move-path">${[m.from,...m.steps.map(s=>s.to)].map(s=>`(${s.join(',')})`).join(m.calculations.length?' × ':' → ')}</span></div><div class="move-score">${m.calculations.length?numberHTML(m.score):'—'}<small>${m.calculations.length?m.calculations.length+' captured':'No capture'} · Total ${numberHTML(m.running)}</small></div></div>${m.calculations.length?`<details><summary>View calculation</summary>${m.calculations.map(c=>`<div class="calculation">(${E.LABELS[c.taker]}) ${c.op} (${E.LABELS[c.captured]})${c.multiplier>1?' · then × '+c.multiplier:''}<br>= ${numberHTML(c.result)}<span class="exact">Exact: ${E.exact(c.result)}</span></div>`).join('')}<div class="calculation">Move score: ${numberHTML(m.score)}<span class="exact">Exact: ${E.exact(m.score)}</span></div></details>`:''}</article>`).join('');
    $('history').scrollTop=$('history').scrollHeight;
  }
  function status(){if(state.finished)return `${state.reason} Final scores are ready. Use “Finish & score” to review them.`;const legal=E.legal(state);if(legal[0]?.steps[0].captured){const count=legal[0].steps.length;return `${name(state.turn)} must capture ${count} chip${count===1?'':'s'}${legal[0].king?' with a dama':''}. Choose a highlighted destination after selecting a chip.`;}return `${name(state.turn)} to move. Tap a chip, then a legal destination.`;}
  function render(){renderAI();$('mode-label').textContent=mode==='pvp'?'PvP · Pass and play':mode==='ai'?`PvAI · ${OPPONENTS[aiLevel]}`:'Playground';clockView();renderBoard();renderScores();renderHistory();$('undo-button').disabled=!state.finished&&(mode==='ai'?!undo.some(s=>s.turn===humanColor):!undo.length);$('export-button').disabled=!state.moves.length&&!state.finished;message(saveWarning||status());saveWarning='';}
  function choose(x,y){
    if(state.finished||!inGame||$('timeout-dialog').open||(mode==='ai'&&state.turn!==humanColor))return;if(timed&&deadline&&Date.now()>=deadline){expire();return;}const pieces=tempPieces(),p=E.at(pieces,x,y);
    if(selected){const candidates=paths.filter(path=>prefix.every((s,i)=>path.steps[i].to[0]===s.to[0]&&path.steps[i].to[1]===s.to[1])&&path.steps[prefix.length]?.to[0]===x&&path.steps[prefix.length]?.to[1]===y);
      if(candidates.length){prefix.push(candidates[0].steps[prefix.length]);paths=candidates;if(prefix.length===paths[0].steps.length){undo.push(E.copy(state));state=E.apply(state,paths[0]);afterTurn();}else{renderBoard();message(`Continue the capture with chip ${pieces.find(p=>p.uid===selected).id}. ${paths[0].steps.length-prefix.length} more to take.`);}return;}
    }
    if(prefix.length){message('Complete this capture sequence before choosing another chip.');return;}
    if(p&&p.color===state.turn){const valid=E.legal(state).filter(path=>path.uid===p.uid);if(!valid.length){message('That chip cannot move under the compulsory capture rules. Try another chip.');return;}selected=p.uid;paths=valid;prefix=[];renderBoard();message(`Chip ${p.id} = ${E.LABELS[p.id]}. Tap a marked square${valid[0].steps[0].captured?' to capture':''}.`);}else{resetSelection();renderBoard();message(status());}
  }
  function showResults(){const r=E.results(state);$('result-title').textContent=r.winner==='draw'?'Draw.':`${name(r.winner)} wins.`;$('result-reason').textContent=state.reason||'Final scores compared. Lower wins.';$('result-scores').innerHTML=['red','blue'].map(c=>`<section class="result-card ${r.winner===c?'winner':''}"><h3>${name(c)}${r.winner===c?' · Winner':''}</h3><div class="result-line"><span>Running score</span><span>${numberHTML(state.totals[c])}</span></div><div class="result-line"><span>Remaining chips</span><span>${numberHTML(r.remaining[c])}</span></div><div class="result-line total"><span>Final score</span><span>${numberHTML(r.final[c])}</span></div><details><summary>Exact final score</summary><span class="exact">${E.exact(r.final[c])}</span></details></section>`).join('');$('result-dialog').showModal();}
  function confirm(title,copy,action){cancelAI();pauseClock();if(hasSession)save();$('confirm-title').textContent=title;$('confirm-copy').textContent=copy;pendingAction=action;$('confirm-dialog').showModal();}
  function exportGame(){const r=state.finished?E.results(state):null;const record={format:'scidama-record-v1',appVersion:VERSION,mode,aiLevel:mode==='ai'?aiLevel:null,humanColor:mode==='ai'?humanColor:null,timed,moveLimitSeconds:timed?60:null,rules:'Capturing dama first, then maximum capture count; promotion after turn; remaining dama counted once; optional move timer pauses play on expiry.',exportedAt:new Date().toISOString(),...E.copy(state),results:r,chipValues:E.VALUES.slice(1),note:'Scores are exact fractions: n is numerator; d is denominator. Scientific notation is a display only.'};const blob=new Blob([JSON.stringify(record,null,2)],{type:'application/json'});const a=document.createElement('a');const url=URL.createObjectURL(blob);a.href=url;a.download=`scidama-${new Date().toISOString().slice(0,10)}-${state.moves.length}-moves.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message('Game record downloaded, including moves, calculations, and exact scores.');}
  $('board').addEventListener('click',event=>{const b=event.target.closest('button[data-x]');if(b)choose(Number(b.dataset.x),Number(b.dataset.y));});
  $('flip-button').addEventListener('click',()=>{flipped=!flipped;renderBoard();save();});
  $('rules-button').addEventListener('click',()=>$('rules-dialog').showModal());
  document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.close).close()));
  $('undo-button').addEventListener('click',()=>{if(mode==='ai'&&!state.finished&&!undo.some(s=>s.turn===humanColor))return;cancelAI();aiError='';if(prefix.length){resetSelection();render();return;}if(state.finished&&state.reason.startsWith('Players finished')){state.finished=false;state.reason='';}else if(undo.length){state=undo.pop();if(mode==='ai'&&state.turn!==humanColor&&undo.length)state=undo.pop();}afterTurn();});
  $('export-button').addEventListener('click',exportGame);$('result-export').addEventListener('click',exportGame);
  $('new-button').addEventListener('click',()=>{showHome();$('play-options').hidden=false;$('play-button').setAttribute('aria-expanded','true');$('play-button').focus();});
  $('finish-button').addEventListener('click',()=>{if(state.finished){showResults();return;}if(prefix.length){message('Complete the current capture before finishing the game.');return;}confirm('Ready to compare scores?','Finish when both players agree. We’ll add each player’s remaining chip values to their running score. The lower final score wins.',()=>{cancelAI();pauseClock();state.finished=true;state.reason='Players finished the match.';resetSelection();render();save();showResults();});});
  $('confirm-action').addEventListener('click',()=>{$('confirm-dialog').close();const action=pendingAction;pendingAction=null;if(action)action();});
  $('chip-values').innerHTML=E.LABELS.slice(1).map((v,i)=>`<span class="key-item"><b>${i+1}</b>${v}</span>`).join('');
  $('confirm-dialog').addEventListener('close',()=>{if(inGame&&!state.finished&&!deadline){startClock();save();scheduleAI();}});
  $('play-button').addEventListener('click',()=>{const open=$('play-options').hidden;$('play-options').hidden=!open;$('play-button').setAttribute('aria-expanded',String(open));});
  document.querySelectorAll('input[name="mode"]').forEach(r=>r.addEventListener('change',setupView));
  $('ai-order').addEventListener('change',setupView);
  $('ai-level').addEventListener('change',setupView);
  $('ai-retry').addEventListener('click',scheduleAI);
  $('timer-toggle').addEventListener('change',setupView);
  $('start-button').addEventListener('click',startGame);
  $('resume-button').addEventListener('click',showGame);
  $('menu-button').addEventListener('click',showHome);
  document.querySelector('.wordmark').addEventListener('click',event=>{event.preventDefault();showHome();});
  $('changelog-button').addEventListener('click',()=>$('changelog-dialog').showModal());
  $('credits-button').addEventListener('click',()=>$('credits-dialog').showModal());
  $('timeout-dialog').addEventListener('cancel',event=>event.preventDefault());
  $('timeout-continue').addEventListener('click',()=>{$('timeout-dialog').close();remaining=60000;startClock();save();$('turn-title').focus();});
  $('timeout-finish').addEventListener('click',()=>{$('timeout-dialog').close();pauseClock();state.finished=true;state.reason='Players finished after the move timer expired.';resetSelection();render();save();showResults();});
  setInterval(()=>{if(!inGame||!timed||state.finished||!deadline)return;clockView();if(Date.now()>=deadline)expire();},200);
  load();buildHero();setupView();render();$('resume-button').hidden=!hasSession;

})();
