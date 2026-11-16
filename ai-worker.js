'use strict';
importScripts('engine.js','ai.js');
self.onmessage=event=>{
  const {id,state,level}=event.data;
  try{self.postMessage({id,...SciDamaAI.choose(state,level)});}
  catch{self.postMessage({id,error:'The opponent could not complete its search.'});}
};
