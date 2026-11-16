/* Dependency-free game rules. Values remain exact rational numbers. */
(function (root) {
  'use strict';
  const gcd = (a,b) => { a=a<0n?-a:a; b=b<0n?-b:b; while(b){const t=b;b=a%b;a=t;}return a; };
  function fraction(n,d=1n){n=BigInt(n);d=BigInt(d);if(!d)throw Error('Division by zero');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return {n:String(n/g),d:String(d/g)};}
  const ZERO=fraction(0);
  function add(a,b){return fraction(BigInt(a.n)*BigInt(b.d)+BigInt(b.n)*BigInt(a.d),BigInt(a.d)*BigInt(b.d));}
  function subtract(a,b){return add(a,{n:String(-BigInt(b.n)),d:b.d});}
  function multiply(a,b){return fraction(BigInt(a.n)*BigInt(b.n),BigInt(a.d)*BigInt(b.d));}
  function divide(a,b){return fraction(BigInt(a.n)*BigInt(b.d),BigInt(a.d)*BigInt(b.n));}
  function compare(a,b){const diff=BigInt(a.n)*BigInt(b.d)-BigInt(b.n)*BigInt(a.d);return diff<0n?-1:diff>0n?1:0;}
  function decimal(coefficient,exponent=0){const s=String(coefficient);const places=(s.split('.')[1]||'').length;const power=exponent-places;return power>=0?fraction(BigInt(s.replace('.',''))*10n**BigInt(power)):fraction(BigInt(s.replace('.','')),10n**BigInt(-power));}
  const VALUES=[null,decimal('1.1',-1),decimal('2.2',2),decimal('3.3',-3),decimal('4.4',4),decimal('5.5',-5),decimal('6.6',6),decimal('7.7',-7),decimal('8.8',8),decimal('9.9',-9),decimal('1.01',10),decimal('1.111',-11),decimal('1.212',12)];
  const LABELS=['','1.1 × 10⁻¹','2.2 × 10²','3.3 × 10⁻³','4.4 × 10⁴','5.5 × 10⁻⁵','6.6 × 10⁶','7.7 × 10⁻⁷','8.8 × 10⁸','9.9 × 10⁻⁹','1.01 × 10¹⁰','1.111 × 10⁻¹¹','1.212 × 10¹²'];
  const exact=a=>a.d==='1'?a.n:`${a.n} / ${a.d}`;
  // A finite calculator-style view; never used as input to score arithmetic.
  function display(a){
    let n=BigInt(a.n),d=BigInt(a.d);if(!n)return {text:'0',approx:false};const sign=n<0n?'−':'';if(n<0n)n=-n;
    let e=n.toString().length-d.toString().length;
    if(e>=0?n<d*10n**BigInt(e):n*10n**BigInt(-e)<d)e--;
    const shift=14-e;const top=shift>=0?n*10n**BigInt(shift):n;const bottom=shift>=0?d:d*10n**BigInt(-shift);
    let rounded=top/bottom;const approximate=top%bottom!==0n;if((top%bottom)*2n>=bottom)rounded++;
    let digits=rounded.toString();if(digits.length>15){e++;digits=digits.slice(0,15);}digits=digits.padStart(15,'0').replace(/0+$/,'');
    let text;if(e>=-3&&e<=5){const point=e+1;text=point<=0?'0.'+'0'.repeat(-point)+digits:point>=digits.length?digits+'0'.repeat(point-digits.length):digits.slice(0,point)+'.'+digits.slice(point);}else{text=digits[0]+(digits.length>1?'.'+digits.slice(1):'')+' × 10^'+e;}
    return {text:sign+text,approx:approximate};
  }
  const opRows=[['+','−','÷','×'],['−','+','×','÷'],['÷','×','+','−'],['×','÷','−','+']];
  function operation(x,y){return opRows[y%4][Math.floor(x/2)];}
  const directions=[[1,1],[-1,1],[1,-1],[-1,-1]];
  const inside=(x,y)=>x>=0&&x<8&&y>=0&&y<8;
  const at=(pieces,x,y)=>pieces.find(p=>p.x===x&&p.y===y);
  const copy=value=>JSON.parse(JSON.stringify(value));
  function create(){
    const coords=[[0,1],[5,2],[7,0],[2,1],[7,2],[5,0],[3,2],[6,1],[3,0],[1,2],[4,1],[1,0]];
    const pieces=[];coords.forEach(([x,y],i)=>{pieces.push({uid:'r'+(i+1),id:i+1,color:'red',x,y,king:false});pieces.push({uid:'b'+(i+1),id:i+1,color:'blue',x:7-x,y:7-y,king:false});});
    return {pieces,turn:'red',totals:{red:copy(ZERO),blue:copy(ZERO)},moves:[],finished:false,reason:''};
  }
  function jumps(pieces,piece){
    const options=[];
    for(const [dx,dy] of directions){
      if(!piece.king){const enemy=at(pieces,piece.x+dx,piece.y+dy);const x=piece.x+2*dx,y=piece.y+2*dy;if(enemy&&enemy.color!==piece.color&&inside(x,y)&&!at(pieces,x,y))options.push({to:[x,y],captured:copy(enemy),op:operation(x,y)});}
      else{
        let x=piece.x+dx,y=piece.y+dy,enemy=null;
        while(inside(x,y)){
          const occupant=at(pieces,x,y);
          if(occupant){if(enemy||occupant.color===piece.color)break;enemy=occupant;}
          else if(enemy)options.push({to:[x,y],captured:copy(enemy),op:operation(x,y)});
          x+=dx;y+=dy;
        }
      }
    }return options;
  }
  function captureSequences(pieces,piece,path=[]){
    const choices=jumps(pieces,piece);if(!choices.length)return path.length?[{uid:piece.uid,king:piece.king,steps:path}]:[];
    return choices.flatMap(step=>{const next=pieces.filter(p=>p.uid!==step.captured.uid).map(p=>p.uid===piece.uid?{...p,x:step.to[0],y:step.to[1]}:p);return captureSequences(next,next.find(p=>p.uid===piece.uid),[...path,step]);});
  }
  function legal(state){
    if(state.finished)return [];
    const own=state.pieces.filter(p=>p.color===state.turn);
    let captures=own.flatMap(p=>captureSequences(state.pieces,p));
    if(captures.length){if(captures.some(p=>p.king))captures=captures.filter(p=>p.king);const max=Math.max(...captures.map(p=>p.steps.length));return captures.filter(p=>p.steps.length===max);}
    return own.flatMap(p=>{const moves=[];for(const [dx,dy] of directions){if(!p.king&&dy!==(p.color==='red'?1:-1))continue;let x=p.x+dx,y=p.y+dy;while(inside(x,y)&&!at(state.pieces,x,y)){moves.push({uid:p.uid,king:p.king,steps:[{to:[x,y],captured:null,op:operation(x,y)}]});if(!p.king)break;x+=dx;y+=dy;}}return moves;});
  }
  function calculate(a,b,op){switch(op){case '+':return add(a,b);case '−':return subtract(a,b);case '×':return multiply(a,b);case '÷':return divide(a,b);default:throw Error('Unknown operation');}}
  const signature=path=>JSON.stringify([path.uid,path.steps.map(s=>s.to)]);
  function apply(state,path){
    const move=legal(state).find(p=>signature(p)===signature(path));if(!move)throw Error('Illegal move');
    const next=copy(state);const piece=next.pieces.find(p=>p.uid===move.uid);const from=[piece.x,piece.y];const wasKing=piece.king;
    let score=copy(ZERO);const calculations=[];
    for(const step of move.steps){
      if(step.captured){const multiplier=wasKing&&step.captured.king?4:wasKing||step.captured.king?2:1;const base=calculate(VALUES[piece.id],VALUES[step.captured.id],step.op);const result=multiply(base,fraction(multiplier));score=add(score,result);calculations.push({taker:piece.id,captured:step.captured.id,op:step.op,multiplier,result});next.pieces=next.pieces.filter(p=>p.uid!==step.captured.uid);}
      piece.x=step.to[0];piece.y=step.to[1];
    }
    const promoted=!wasKing&&piece.y===(piece.color==='red'?7:0);piece.king=wasKing||promoted;
    next.totals[piece.color]=add(next.totals[piece.color],score);
    next.moves.push({number:next.moves.length+1,color:piece.color,id:piece.id,uid:piece.uid,from,steps:copy(move.steps),score,running:copy(next.totals[piece.color]),calculations,promoted});
    next.turn=piece.color==='red'?'blue':'red';
    if(!legal(next).length){next.finished=true;next.reason=`${next.turn==='red'?'Red':'Blue'} has no legal move.`;}
    return next;
  }
  function results(state){const remaining={red:copy(ZERO),blue:copy(ZERO)};for(const p of state.pieces)remaining[p.color]=add(remaining[p.color],VALUES[p.id]);const final={red:add(state.totals.red,remaining.red),blue:add(state.totals.blue,remaining.blue)};const c=compare(final.red,final.blue);return {remaining,final,winner:c===0?'draw':c<0?'red':'blue'};}
  root.SciDama={fraction,ZERO,add,subtract,multiply,divide,compare,decimal,VALUES,LABELS,exact,display,operation,create,legal,apply,results,copy,at};
})(typeof globalThis!=='undefined'?globalThis:window);
