import {Capacitor} from '@capacitor/core';
import {normalizeServerAddress} from './server-url';
export function serverBase(){if(typeof window==='undefined')return '';const fallback=Capacitor.isNativePlatform()?'https://myway-pass-choi-2026.goldenloom32.chatgpt.site':'';try{return normalizeServerAddress(localStorage.getItem('myway.server')||'',!Capacitor.isNativePlatform())||fallback;}catch{return fallback;}}
export async function api<T=any>(action:string,body:unknown,token?:string):Promise<T>{
  const r=await fetch(serverBase()+'/api/'+action,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(25000)});
  const data=await r.json() as any;if(!r.ok)throw new Error(data.error||'요청을 처리하지 못했습니다.');return data as T;
}
export function saveFile(name:string,value:unknown){const url=URL.createObjectURL(new Blob([typeof value==='string'?value:JSON.stringify(value,null,2)],{type:'application/json;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function speak(text:string,rate:number){if(!('speechSynthesis' in window))throw new Error('이 기기는 음성 읽기를 지원하지 않습니다.');window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='ko-KR';u.rate=rate;window.speechSynthesis.speak(u);}
