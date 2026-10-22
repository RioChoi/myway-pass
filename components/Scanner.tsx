'use client';
import {useEffect,useRef,useState} from 'react';
import jsQR from 'jsqr';
export default function Scanner({onRead,onClose}:{onRead:(value:string)=>void;onClose:()=>void}){
  const video=useRef<HTMLVideoElement>(null),[error,setError]=useState('');
  useEffect(()=>{
    let closed=false,stream:MediaStream|undefined,frame=0;
    const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});
    const scan=()=>{const v=video.current;if(closed||!v||!ctx)return;if(v.readyState>=2){canvas.width=v.videoWidth;canvas.height=v.videoHeight;ctx.drawImage(v,0,0);const data=ctx.getImageData(0,0,canvas.width,canvas.height);const qr=jsQR(data.data,data.width,data.height,{inversionAttempts:'attemptBoth'});if(qr){onRead(qr.data);return;}}frame=requestAnimationFrame(scan);};
    if(!navigator.mediaDevices?.getUserMedia)setError('카메라는 HTTPS 또는 localhost에서 사용할 수 있습니다. 연결번호로 진행해 주세요.');
    else navigator.mediaDevices.getUserMedia({video:{facingMode:'environment',width:{ideal:640}},audio:false}).then(async s=>{if(closed){s.getTracks().forEach(t=>t.stop());return;}stream=s;if(video.current){video.current.srcObject=s;await video.current.play();frame=requestAnimationFrame(scan);}}).catch(()=>setError('카메라를 열지 못했습니다. 권한을 확인하거나 연결번호를 이용해 주세요.'));
    return()=>{closed=true;cancelAnimationFrame(frame);stream?.getTracks().forEach(t=>t.stop());};
  },[onRead]);
  return <div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true" aria-label="QR 읽기"><h2>앱의 QR을 보여 주세요</h2>{error?<p role="alert">{error}</p>:<video ref={video} muted playsInline className="scanner-video"/>}<button className="button" onClick={onClose}>닫기 · 연결번호로 입력</button></section></div>;
}
