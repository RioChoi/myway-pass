'use client';
import {useEffect,useState} from 'react';
export default function LicenseNotice(){
 const [open,setOpen]=useState(false),[text,setText]=useState('');
 useEffect(()=>{if(!open)return;const controller=new AbortController();setText('불러오는 중…');fetch(new URL('third-party-notices.txt',document.baseURI),{signal:controller.signal}).then(r=>{if(!r.ok)throw Error();return r.text();}).then(setText).catch(()=>{if(!controller.signal.aborted)setText('라이선스 파일을 불러오지 못했습니다. 배포본의 third-party-notices.txt를 확인해 주세요.');});return()=>controller.abort();},[open]);
 return <><div className="legal-link"><button type="button" onClick={()=>setOpen(true)}>오픈소스 라이선스</button></div>{open&&<div className="license-backdrop"><section className="license-panel" role="dialog" aria-modal="true" aria-label="오픈소스 라이선스"><header><h2>오픈소스 라이선스</h2><button type="button" onClick={()=>setOpen(false)}>닫기</button></header><pre>{text}</pre></section></div>}</>;
}
