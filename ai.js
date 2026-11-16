/* Local, bounded game-tree search. No model, network service, or training data. */
(function(root){
  'use strict';
  const E=root.SciDama;
  const LEVELS={
    dumbledore:{name:'Dumbledore',depth:1,milliseconds:400,nodes:3000},
    joe:{name:'Joe',depth:4,milliseconds:1200,nodes:14000},
    magnus:{name:'Magnus',depth:8,milliseconds:2500,nodes:35000}
  };
  // Scores remain exact. Positional preferences only break equal score margins.
  function evaluate(state,color){
    const other=color==='red'?'blue':'red',r=E.results(state);
    const margin=E.subtract(r.final[other],r.final[color]);
    let position=0;
    for(const p of state.pieces){const progress=p.color==='red'?p.y:7-p.y;const value=(p.king?12:progress)+3-Math.abs(3.5-p.x);position+=(p.color===color?1:-1)*value;}
    const outcome=state.finished?(r.winner==='draw'?0:r.winner===color?1:-1):0;
    return {outcome,margin,position:state.finished?0:position};
  }
  function compare(a,b){if(a.outcome!==b.outcome)return Math.sign(a.outcome-b.outcome);return E.compare(a.margin,b.margin)||Math.sign(a.position-b.position);}
  // Use the authoritative transition; omit accumulated records in speculative nodes.
  function advance(state,move){const next=E.apply({...state,moves:[]},move);next.moves=[];return next;}
  function key(state){return state.turn+'|'+state.pieces.map(p=>`${p.uid}:${p.x},${p.y},${+p.king}`).sort().join(';');}
  function choose(state,level='joe',options={}){
    const config=LEVELS[level]||LEVELS.joe,color=state.turn,moves=E.legal(state);
    if(!moves.length)return {move:null,depth:0,nodes:0};
    const now=options.now||(()=>performance.now()),start=now();
    const budget=Math.min(options.milliseconds??config.milliseconds,config.milliseconds);
    const limit=Math.min(options.nodes??config.nodes,config.nodes);let nodes=0;
    const STOP={};
    function check(){if(nodes>=limit||now()-start>=budget)throw STOP;nodes++;}
    function search(s,depth,alpha,beta,seen){
      check();
      const k=key(s);
      if(s.finished||depth===0||seen.has(k))return evaluate(s,color);
      const nextSeen=new Set(seen);nextSeen.add(k);
      const maximizing=s.turn===color;
      let best=null;
      for(const move of E.legal(s)){
        const value=search(advance(s,move),depth-1,alpha,beta,nextSeen);
        if(!best||(maximizing?compare(value,best)>0:compare(value,best)<0))best=value;
        if(maximizing){if(!alpha||compare(best,alpha)>0)alpha=best;}else if(!beta||compare(best,beta)<0)beta=best;
        if(alpha&&beta&&compare(alpha,beta)>=0)break;
      }
      return best||evaluate(s,color);
    }
    // An immediately available legal fallback survives a deadline before depth one.
    let chosen=moves[0],completed=0,bestValue=null;
    for(let depth=1;depth<=config.depth;depth++){
      let candidate=null,value=null,alpha=null;
      const ordered=[chosen,...moves.filter(m=>m!==chosen)];
      try{
        for(const move of ordered){
          const score=search(advance(state,move),depth-1,level==='dumbledore'?null:alpha,null,new Set([key(state)]));
          if(!value||(level==='dumbledore'?compare(score,value)<0:compare(score,value)>0)){candidate=move;value=score;}
          if(level!=='dumbledore'&&(!alpha||compare(score,alpha)>0))alpha=score;
        }
      }catch(error){if(error===STOP)break;throw error;}
      chosen=candidate;bestValue=value;completed=depth;
    }
    return {move:chosen,depth:completed,nodes,value:bestValue,elapsed:Math.round(now()-start)};
  }
  root.SciDamaAI={LEVELS,evaluate,compare,advance,choose};
})(typeof globalThis!=='undefined'?globalThis:window);
