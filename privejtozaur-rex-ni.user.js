// ==UserScript==
// @name         Margonem — Privejtozaur Rex i Irianogarbaróg
// @namespace    local.privejtozaur
// @version      3.1.8
// @description  Terrozaur: sam Rex. Neferkar Set: Irianogarbaróg na wężu. Chaegd Agnrakh: postać w szarej koszulce. Ciutek: postać z większym nosem. Pogardliwa Sybilla: karykatura. Mapa i walka.
// @match        https://*.margonem.pl/*
// @match        https://*.margonem.com/*
// @homepageURL  https://github.com/Oskirrix/notyfikator
// @updateURL    https://raw.githubusercontent.com/Oskirrix/notyfikator/main/privejtozaur-rex-ni.user.js
// @downloadURL  https://raw.githubusercontent.com/Oskirrix/notyfikator/main/privejtozaur-rex-ni.user.js
// @grant        none
// @run-at       document-start
// @sandbox      raw
// @noframes
// ==/UserScript==
(() => {
 'use strict';
 window.PrivejtozaurRex?.destroy?.();
 // Kolejne podmianki: dopisz nazwę NPC, jej warianty i bezpośredni URL PNG.
 // Po zmianie zwiększ @version i wersję zwracaną w status().
 const assets = [
  {name:'Terrozaur', names:['terrozaur'], data:'https://raw.githubusercontent.com/Oskirrix/notyfikator/main/privejtozaur-rex-krzywe-zeby-v2.png'},
  {name:'Neferkar Set', names:['neferkar set','nefrekar set'], data:'https://raw.githubusercontent.com/Oskirrix/notyfikator/main/irianogarbarog-neferkar-set.png'},
  {name:'Chaegd Agnrakh', names:['chaegd agnrakh','chaegd anrakh'], data:'https://raw.githubusercontent.com/Oskirrix/notyfikator/main/exec-07ed5958-c814-43ae-b97b-a5558eeaed72.png'},
  {name:'Ciutek', names:['ciutek'], data:'https://raw.githubusercontent.com/Oskirrix/notyfikator/main/exec-92987b68-d57e-437b-a178-aad27e21fb25.png'},
  {name:'Pogardliwa Sybilla', names:['pogardliwa sybilla'], data:'https://raw.githubusercontent.com/Oskirrix/notyfikator/main/exec-2cbe3c6a-900b-4336-8f3f-f32a3401397d.png'}
 ];
 let enabled=true, stopped=false, found=0, battleFound=0, replacements=0, lastError='';
 const icons=new Map(), styled=new Map(), hooks=[], battleTargets=new Map(), canvasTargets=new Map(), drawHooks=new Map();
 const sourceTargets=new WeakMap(), encodedTargets=new Map(), objectUrls=new Map(), transportRestores=[];
 const networkStats={images:0,fetch:0,xhr:0,bitmaps:0,unrecognizedGif64:0};
 let drawingFrame=null;
 const fittedFrames=new Map();
 const safe=fn=>{try{return fn();}catch{return undefined;}};
 const dataOf=v=>safe(()=>v.getData())||v?.d||v;
 const normalize=v=>String(v||'').trim().toLocaleLowerCase('pl');
 const path=v=>{if(!v||String(v).startsWith('data:'))return '';try{return decodeURI(new URL(v,location.href).pathname);}catch{return '';}};
 for(const a of assets){a.image=new Image();a.image.crossOrigin='anonymous';a.image.onerror=()=>{lastError='Błąd grafiki: '+a.name;};a.image.src=a.data;}
 function remember(v){
  const d=dataOf(v), name=normalize(d?.nick??d?.name??safe(()=>v.getName())??safe(()=>v.getNick()));
  const a=assets.find(a=>a.names.includes(name));if(!a)return null;
  const icon=d?.icon??safe(()=>v.getIcon());
  if(typeof icon==='string'&&icon){let p=path(icon);if(!/^(https?:)?\/\//.test(icon)&&!icon.startsWith('/'))p=p.replace(/^\//,'');if(p)icons.set(p,a);}
  return a;
 }
 function match(src){
  if(!src)return null;const s=String(src);
  if(objectUrls.has(s))return objectUrls.get(s);
  if(s.startsWith('data:'))return encodedTargets.get(s.slice(s.indexOf(',')+1).replace(/\s/g,''))||null;
  const p=path(s);if(!p)return null;
  // Exact filename supplied in the user's Network screenshot, before NPC data exists.
  if(/\/(?:terrorzaur|terrozaur)_pus2\.gif(?:64)?$/i.test(p))return assets[0];
  for(const [i,a]of icons)if(i.startsWith('/')?p===i:p==='/'+i||p.endsWith('/'+i))return a;return null;
 }
 // Preserve transport responses verbatim. Associate resource bytes/URLs with a
 // character so NI's base64 decoder and createImageBitmap caches retain identity.
 function rememberBody(body,a,depth=0){
  if(!a||body==null||depth>3)return false;
  if(typeof body==='object'){
   sourceTargets.set(body,a);
   if(Array.isArray(body)||Object.getPrototypeOf(body)===Object.prototype)return Object.values(body).some(v=>rememberBody(v,a,depth+1));
   return true;
  }
  if(typeof body!=='string')return false;
  let text=body.trim();
  if(text.startsWith('data:'))text=text.slice(text.indexOf(',')+1);
  const compact=text.replace(/\s/g,'');
  if(/^(R0lGOD|iVBORw0KGgo|UklGR)/.test(compact)){encodedTargets.set(compact,a);return true;}
  if(/^[\[{\"]/.test(text))return safe(()=>rememberBody(JSON.parse(text),a,depth+1))||false;
  return false;
 }
 function replaceMethod(owner,name,make){
  if(!owner||typeof owner[name]!=='function')return;
  const original=owner[name],wrapper=make(original);owner[name]=wrapper;
  transportRestores.push(()=>{if(owner[name]===wrapper)owner[name]=original;});
 }
 const imageProto=window.HTMLImageElement?.prototype;
 const srcDescriptor=imageProto&&Object.getOwnPropertyDescriptor(imageProto,'src');
 if(srcDescriptor?.set&&srcDescriptor.configurable){
  const setter=function(value){
   const a=enabled&&match(value);
   if(a){sourceTargets.set(this,a);networkStats.images++;}else sourceTargets.delete(this);
   // Tooltip images are ordinary DOM images, not animation sheets.
   // Redirect before the browser displays/reloads the original resource.
   const target=a&&this.closest?.('.tipInnerContainer, .tip, [role="tooltip"]')?a.data:value;
   if(srcDescriptor.get?.call(this)===String(target))return;
   return srcDescriptor.set.call(this,target);
  };
  Object.defineProperty(imageProto,'src',{...srcDescriptor,set:setter});
  transportRestores.push(()=>{if(Object.getOwnPropertyDescriptor(imageProto,'src')?.set===setter)Object.defineProperty(imageProto,'src',srcDescriptor);});
  replaceMethod(imageProto,'setAttribute',original=>function(name,value){
   if(String(name).toLowerCase()==='src'){this.src=value;return;}
   return original.call(this,name,value);
  });
 }
 function wrapResponse(response,a){
  if(!a||!response)return response;
  for(const name of ['text','json','blob','arrayBuffer']){
   if(typeof response[name]!=='function')continue;
   const original=response[name];response[name]=async function(...args){const body=await original.apply(this,args);if(enabled&&!rememberBody(body,a)&&name==='text')networkStats.unrecognizedGif64++;return body;};
  }
  const clone=response.clone;if(typeof clone==='function')response.clone=function(){return wrapResponse(clone.call(this),a);};
  return response;
 }
 replaceMethod(window,'fetch',original=>async function(input,...args){
  const a=enabled&&match(typeof input==='string'||input instanceof URL?String(input):input?.url);
  const response=await original.call(this,input,...args);if(a)networkStats.fetch++;return wrapResponse(response,a);
 });
 const xhrProto=window.XMLHttpRequest?.prototype,xhrAssets=new WeakMap();
 replaceMethod(xhrProto,'open',original=>function(method,url,...args){const a=enabled&&match(url);if(a){xhrAssets.set(this,a);networkStats.xhr++;}else xhrAssets.delete(this);return original.call(this,method,url,...args);});
 for(const name of ['responseText','response']){
  const d=xhrProto&&Object.getOwnPropertyDescriptor(xhrProto,name);if(!d?.get||!d.configurable)continue;
  const getter=function(){const body=d.get.call(this),a=enabled&&xhrAssets.get(this);if(a)rememberBody(body,a);return body;};
  Object.defineProperty(xhrProto,name,{...d,get:getter});
  transportRestores.push(()=>{if(Object.getOwnPropertyDescriptor(xhrProto,name)?.get===getter)Object.defineProperty(xhrProto,name,d);});
 }
 replaceMethod(URL,'createObjectURL',original=>function(blob){const url=original.call(this,blob),a=sourceTargets.get(blob);if(a)objectUrls.set(url,a);return url;});
 replaceMethod(URL,'revokeObjectURL',original=>function(url){objectUrls.delete(String(url));return original.call(this,url);});
 replaceMethod(window,'createImageBitmap',original=>async function(source,...args){const bitmap=await original.call(this,source,...args),a=enabled&&(sourceTargets.get(source)||match(source?.src));if(a){sourceTargets.set(bitmap,a);networkStats.bitmaps++;}return bitmap;});
 const nativeDraw=CanvasRenderingContext2D.prototype.drawImage;
 // The NI client decodes GIFs into a PNG sheet (often with a blob/data URL).
 // Only the img/sprite actually drawn by a named character is substituted.
 function fittedFrame(asset,w,h){
  if(!asset.image.complete||!asset.image.naturalWidth||!(w>0&&h>0))return null;
  const key=asset.name+'|'+w+'x'+h;
  if(fittedFrames.has(key))return fittedFrames.get(key);
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d');if(!ctx)return null;
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  const scale=Math.min(w/asset.image.naturalWidth,h/asset.image.naturalHeight);
  const dw=asset.image.naturalWidth*scale,dh=asset.image.naturalHeight*scale;
  nativeDraw.call(ctx,asset.image,(w-dw)/2,h-dh,dw,dh);
  fittedFrames.set(key,canvas);return canvas;
 }
 function drawImage(image,...args){
  const f=enabled&&drawingFrame;
  if(f&&image===f.source){
   const frame=fittedFrame(f.asset,f.fw,f.fh);
   if(frame){
    if(args.length===8){
     // Drop animation/direction offsets; retain within-frame clipping (water).
     const [sx,sy,sw,sh,dx,dy,dw,dh]=args;
     const x=((sx%f.fw)+f.fw)%f.fw,y=((sy%f.fh)+f.fh)%f.fh;
     replacements++;return nativeDraw.call(this,frame,x,y,sw,sh,dx,dy,dw,dh);
    }
    replacements++;return nativeDraw.call(this,frame,...args);
   }
   return nativeDraw.call(this,image,...args);
  }
  const source=image?.currentSrc||image?.src;
  const asset=enabled&&(sourceTargets.get(image)||match(source));
  const sprite=asset?.image;
  if(!sprite?.complete||!sprite.naturalWidth)return nativeDraw.call(this,image,...args);
  let x,y,w,h;
  if(args.length===8)[,,,,x,y,w,h]=args;
  else if(args.length===4)[x,y,w,h]=args;
  else if(args.length===2){[x,y]=args;w=image.naturalWidth||image.width;h=image.naturalHeight||image.height;}
  else return nativeDraw.call(this,image,...args);
  if(![x,y,w,h].every(Number.isFinite)||w<=0||h<=0)return nativeDraw.call(this,image,...args);
  const scale=Math.min(w/sprite.naturalWidth,h/sprite.naturalHeight),dw=sprite.naturalWidth*scale,dh=sprite.naturalHeight*scale;
  replacements++;return nativeDraw.call(this,sprite,x+(w-dw)/2,y+h-dh,dw,dh);
 }
 CanvasRenderingContext2D.prototype.drawImage=drawImage;
 function hookCharacter(character,asset,battle){
  const name=battle?'draw':'drawIcon';
  if(typeof character?.[name]!=='function')return;
  let record=drawHooks.get(character);
  if(record&&character[name]===record.wrapper)return;
  const own=Object.prototype.hasOwnProperty.call(character,name),original=character[name];
  const wrapper=function(...args){
   const previous=drawingFrame;
   const fw=Number(character.fw),fh=Number(character.fh);
   drawingFrame=enabled&&fw>0&&fh>0?{
    asset,source:character.img||character.sprite,fw,fh
   }:null;
   try{return original.apply(this,args);}finally{drawingFrame=previous;}
  };
  character[name]=wrapper;
  drawHooks.set(character,{original,wrapper,own,name,battle});
 }
 function styleElement(el,a){
  if(!el||!a||el.tagName==='CANVAS')return;
  if(!styled.has(el)){
   const names=['background-image','background-size','background-position','background-repeat','object-fit','object-position','max-width','max-height'];
   styled.set(el,{values:names.map(n=>[n,el.style.getPropertyValue(n),el.style.getPropertyPriority(n)]),
    src:el.tagName==='IMG'?el.getAttribute('src'):undefined,srcset:el.tagName==='IMG'?el.getAttribute('srcset'):undefined});
  }
  if(el.tagName==='IMG'){
   if(el.getAttribute('src')!==a.data){el.removeAttribute('srcset');el.setAttribute('src',a.data);}
   el.style.setProperty('object-fit','contain','important');el.style.setProperty('object-position','center bottom','important');
   if(el.closest?.('.tipInnerContainer')){
    el.style.setProperty('max-width','160px','important');el.style.setProperty('max-height','180px','important');
   }
  }else{
   const bg=`url("${a.data}")`;if(el.style.getPropertyValue('background-image')!==bg)el.style.setProperty('background-image',bg,'important');
   el.style.setProperty('background-size','contain','important');el.style.setProperty('background-position','center bottom','important');el.style.setProperty('background-repeat','no-repeat','important');
  }
 }
 function restore(){
  for(const [el,s]of styled){for(const [n,v,p]of s.values){if(v)el.style.setProperty(n,v,p);else el.style.removeProperty(n);}
   for(const n of ['src','srcset'])if(s[n]!==undefined){if(s[n]===null)el.removeAttribute(n);else el.setAttribute(n,s[n]);}}
  styled.clear();
 }
 function collect(list,battle=false){
  for(const [key,v]of (list instanceof Map?[...list.entries()]:Object.entries(list||{}))){
   const a=remember(v);if(!a)continue;if(battle)battleFound++;else found++;
   const id=dataOf(v)?.id??key;if(!/^-?\d+$/.test(String(id)))continue;
   if(!battle){styleElement(document.getElementById('npc'+id),a);hookCharacter(v,a,false);}
   else{
    battleTargets.set(String(id),a);hookCharacter(v,a,true);
    styleElement(document.getElementById('troop'+id),a);
    for(const el of document.querySelectorAll(`.other-id-battle-${id} .warrior-icon, .other-id-battle-${id} img`))styleElement(el,a);
   }
  }
 }
 function inspectDom(){
  // Minimap tips are appended outside the battle window; inspect DOM images too.
  for(const el of document.querySelectorAll('img, #battle [style*="background"], .battle-window [style*="background"]')){
   const src=el.tagName==='IMG'?el.getAttribute('src'):'';
   const bg=el.style.getPropertyValue('background-image');
   const a=match(src)||match(bg?.match(/url\(["']?(.*?)["']?\)/)?.[1]);if(a)styleElement(el,a);
  }
 }
 let domRefreshQueued=false;
 const imageObserver=window.MutationObserver?new MutationObserver(records=>{
  if(!enabled||stopped||domRefreshQueued)return;
  const changed=records.some(r=>r.type==='attributes'&&r.target.tagName==='IMG'||
   [...(r.addedNodes||[])].some(n=>n.tagName==='IMG'||n.querySelector?.('img')));
  if(!changed)return;
  domRefreshQueued=true;try{safe(inspectDom);}finally{domRefreshQueued=false;}
 }):null;
 imageObserver?.observe(document,{subtree:true,childList:true,attributes:true,attributeFilter:['src','srcset']});
 function hook(owner,name){
  if(!owner||typeof owner[name]!=='function'||hooks.some(h=>h.owner===owner&&h.name===name))return;
  const original=owner[name];const wrapper=function(...args){
   if(!stopped&&enabled)safe(()=>collect(args[0],true));
   const result=original.apply(this,args);if(!stopped&&enabled)queueMicrotask(()=>safe(scan));return result;
  };
  owner[name]=wrapper;hooks.push({owner,name,original,wrapper});
 }
 function scan(){
  if(!enabled||stopped)return;
  try{
   found=0;battleFound=0;
   collect(safe(()=>window.Engine.npcs.check()));collect(window.g?.npc);
   collect(window.g?.battle?.f,true);collect(window.Engine?.battle?.warriorsList,true);collect(safe(()=>window.Engine.battle.getWarriors()),true);
   hook(window.Engine?.battle,'updateWarriors');hook(window,'newTroops');inspectDom();
   for(const el of styled.keys())if(!el.isConnected)styled.delete(el);
  }catch(e){lastError=String(e.message||e);}
 }
 window.PrivejtozaurRex=Object.freeze({
  status:()=>({version:'3.1.8',enabled,interface:window.Engine?'NI':'SI / oczekiwanie',found,battleFound,replacements,network:{...networkStats},niMapHooks:[...drawHooks.values()].filter(h=>!h.battle).length,niBattleHooks:[...drawHooks.values()].filter(h=>h.battle).length,images:assets.map(a=>({name:a.name,ready:!!a.image.naturalWidth})),icons:[...icons.keys()],lastError}),
  setEnabled(v){enabled=!!v;if(!enabled){restore();canvasTargets.clear();}else scan();},
  destroy(){stopped=true;enabled=false;imageObserver?.disconnect();clearInterval(timer);restore();for(const h of hooks)if(h.owner[h.name]===h.wrapper)h.owner[h.name]=h.original;
   for(const [npc,h]of drawHooks)if(npc[h.name]===h.wrapper){if(h.own)npc[h.name]=h.original;else delete npc[h.name];}
   drawHooks.clear();fittedFrames.clear();canvasTargets.clear();battleTargets.clear();
   for(const restoreTransport of transportRestores)restoreTransport();encodedTargets.clear();objectUrls.clear();
   if(CanvasRenderingContext2D.prototype.drawImage===drawImage)CanvasRenderingContext2D.prototype.drawImage=nativeDraw;delete window.PrivejtozaurRex;}
 });
 const timer=setInterval(scan,200);scan();
})();

